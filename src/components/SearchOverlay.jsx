import React, { useState, useMemo, useEffect } from "react";
import { filterSchema, facialFeatureLabels, hairTypeLabels } from "../data/CitizenAttributes";

export default function SearchOverlay({ citizens, cityTiles, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // normalize keys to handle capital letters in user input
  function normalizeKey(k) {
    if (!k) return k;
    const lower = k.toLowerCase();
    return Object.keys(filterSchema).find((x) => x.toLowerCase() === lower) || lower;
  }

  useEffect(() => {
    refreshSuggestions("");
  }, []);

  // Build dynamic job titles from city data
  const jobTitles = useMemo(() => {
    const titles = new Set();
    if (!Array.isArray(cityTiles)) return [];

    for (const tile of cityTiles) {
      const building = tile?.building;
      if (!building?.floors) continue;

      for (const floor of building.floors) {
        if (!Array.isArray(floor.addresses)) continue;

        for (const addr of floor.addresses) {
          const company = addr?.company;
          if (!company?.companyRoster) continue;

          company.companyRoster.forEach(job => {
            if (job.name) titles.add(job.name);
          });
        }
      }
    }
    return Array.from(titles).sort();
  }, [cityTiles]);

  // Close on esc pressed
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filterKeys = Object.keys(filterSchema);

  // Suggestions
  function refreshSuggestions(input) {
    const value = input;
    const rawLast = value.replace(/\s+$/, "").split(/\s+/).pop() || "";
    const [key, val] = rawLast.split(":");
    const normKey = normalizeKey(key);

    if (!rawLast || val === undefined) {
      const filtered = filterKeys.filter((k) =>
        k.toLowerCase().startsWith(rawLast.toLowerCase())
      );
      setSuggestions(filtered);
      setSelectedIndex(filtered.length ? 0 : -1);
    } else {
      let values = filterSchema[normKey] || [];

      if (normKey === "jobTitle" || normKey === "jobtitle") {
        values = jobTitles;
      }

      const filtered = values.filter((v) =>
        v.toLowerCase().startsWith((val || "").toLowerCase())
      );
      setSuggestions(filtered);
      setSelectedIndex(filtered.length ? 0 : -1);
    }
  }

  function handleInputChange(e) {
    const value = e.target.value;
    setQuery(value);
    refreshSuggestions(value);
  }

  function applySuggestion(s) {
    const trimmed = query.replace(/\s+$/, "");
    const parts = trimmed.length ? trimmed.split(/\s+/) : [];
    const last = parts.pop() || "";

    if (!last || !last.includes(":")) {
      parts.push(`${s}:`);
      const next = (parts.join(" ") + " ").trimEnd() + " ";
      setQuery(next);

      const normKey = normalizeKey(s);
      let values = filterSchema[normKey] || [];
      if (normKey === "jobTitle" || normKey === "jobtitle") values = jobTitles;

      setSuggestions(values);
      setSelectedIndex(values.length ? 0 : -1);
      return;
    }

    const [k] = last.split(":");
    const normKey = normalizeKey(k);
    parts.push(`${normKey}:${s}`);
    const next = (parts.join(" ") + " ").replace(/\s+$/, " ");
    setQuery(next);
    setSuggestions([]);
    setSelectedIndex(-1);
  }

  function handleKeyDown(e) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      applySuggestion(suggestions[selectedIndex]);
    }
  }

  // Helpers for filtering
  const valueIndex = (arr, v) =>
    (arr || []).findIndex((x) => String(x).toLowerCase() === String(v).toLowerCase());

  function matchesKey(c, key, val) {
    const v = String(val).toLowerCase();
    switch (key.toLowerCase()) {
      case "haircolour": {
        const label = c.descriptors?.hairColourCategoryName;
        if (label) return label.toLowerCase().includes(v);
        const idx = c.descriptors?.hairColourCategory;
        if (Number.isInteger(idx)) {
          const expect = valueIndex(filterSchema.hairColour, v);
          return expect >= 0 && idx === expect;
        }
        return false;
      }
      case "hairtype": {
        const idx = c.descriptors?.hairType;
        if (Number.isInteger(idx)) {
          const label = hairTypeLabels[idx];
          if (label && label.toLowerCase().includes(v)) return true;
          const expect = valueIndex(filterSchema.hairType, v);
          return expect >= 0 && idx === expect;
        }
        return false;
      }
      case "height": {
        const label = c.descriptors?.heightLabel;
        if (label) return label.toLowerCase().includes(v);
        const idx = c.descriptors?.height;
        if (Number.isInteger(idx)) {
          const expect = valueIndex(filterSchema.height, v);
          return expect >= 0 && idx === expect;
        }
        if (c.descriptors?.heightCM != null) {
          return String(c.descriptors.heightCM).toLowerCase().includes(v);
        }
        return false;
      }
      case "gender": {
        const expect = valueIndex(filterSchema.gender, v);
        if (expect >= 0) return String(c.gender) === String(expect);
        return String(c.gender).toLowerCase().includes(v);
      }
      case "blood": {
        const expect = valueIndex(filterSchema.blood, v);
        if (expect >= 0) return String(c.blood) === String(expect + 1);
        return String(c.blood).toLowerCase().includes(v);
      }
      case "eyecolour": {
        const label = c.descriptors?.eyeColourLabel;
        if (label) return label.toLowerCase().includes(v);
        const idx = c.descriptors?.eyeColour;
        if (Number.isInteger(idx)) {
          const expect = valueIndex(filterSchema.eyeColour, v);
          return expect >= 0 && idx === expect;
        }
        return false;
      }
      case "facialfeature": {
        if (!Array.isArray(c.descriptors?.facialFeatures)) return false;

        // Check by label name
        const matchByLabel = c.descriptors.facialFeatures.some((f) => {
          const label = facialFeatureLabels[f.feature];
          return label && label.toLowerCase().includes(v);
        });

        if (matchByLabel) return true;

        // Check by index
        const expect = valueIndex(filterSchema.facialFeature, v);
        if (expect >= 0) {
          return c.descriptors.facialFeatures.some((f) => f.feature === expect);
        }

        return false;
      }
      case "shoesize": {
        const size = c.descriptors?.shoeSize;
        if (size == null) return false;
        return String(size).toLowerCase().includes(v);
      }
      case "jobtitle": {
        if (!c.job || !Array.isArray(cityTiles)) return false;

        // Find the citizen's job title
        for (const tile of cityTiles) {
          const building = tile?.building;
          if (!building?.floors) continue;

          for (const floor of building.floors) {
            if (!Array.isArray(floor.addresses)) continue;

            for (const addr of floor.addresses) {
              const company = addr?.company;
              if (!company?.companyRoster) continue;

              const match = company.companyRoster.find((r) => r.id === c.job);
              if (match && match.name) {
                return match.name.toLowerCase().includes(v);
              }
            }
          }
        }

        return false;
      }
      default:
        return false;
    }
  }

  // Parse tokens
  function parseQueryTokens(q) {
    const tokens = q.trim().split(/\s+/).filter(Boolean);
    const filters = new Map();
    const text = [];
    let i = 0;

    const getAllowed = (key) => {
      const normKey = normalizeKey(key);
      if (normKey === "jobTitle" || normKey === "jobtitle") return jobTitles || [];
      return filterSchema[normKey] || [];
    };

    while (i < tokens.length) {
      const t = tokens[i];
      const colon = t.indexOf(":");

      if (colon > 0) {
        const rawKey = t.slice(0, colon);
        const key = normalizeKey(rawKey);
        let cur = t.slice(colon + 1);
        let j = i + 1;

        const allowed = getAllowed(key).map((s) => String(s).toLowerCase());
        if (allowed.length) {
          let best = allowed.includes(cur.toLowerCase()) ? cur : null;

          while (j < tokens.length) {
            const next = cur + " " + tokens[j];
            const isPrefix = allowed.some((a) => a.startsWith(next.toLowerCase()));
            if (!isPrefix) break;
            cur = next;
            if (allowed.includes(cur.toLowerCase())) best = cur;
            j++;
          }
          cur = best || cur; // prefer exact match if we found one
        } else {
          j = i + 1;
        }

        if (!filters.has(key)) filters.set(key, []);
        filters.get(key).push(cur.trim());
        i = j;
      } else {
        text.push(t);
        i++;
      }
    }

    return { filters, text };
  }

  // Results
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    const { filters, text } = parseQueryTokens(q);

    return citizens
      .filter((c) => {
        // when not using filters: all tokens must appear in name
        const name = String(c.citizenName || "").toLowerCase();
        const nameOK = text.length ? text.every((t) => name.includes(t.toLowerCase())) : true;

        // when using filters: AND across keys, OR within values per key
        const filtersOK =
          filters.size === 0
            ? true
            : Array.from(filters.entries()).every(([k, vals]) =>
              vals.some((v) => matchesKey(c, k, v))
            );

        return nameOK && filtersOK;
      })
      .slice(0, 50);
  }, [citizens, query, cityTiles]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-start pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="relative w-[600px] bg-ui-panel border-2 border-ui-border rounded-md shadow-[0_0_24px_rgba(0,0,0,0.6)] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder={"hairColour:black shoeSize:10 | \"Ane Vazquez\""}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-transparent border-b border-ui-border-dim text-ui-text text-lg pb-2 mb-3 focus:outline-none"
          />

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-1 w-full bg-ui-panel border border-ui-border-dim rounded-sm shadow-lg max-h-96 overflow-y-auto z-[10000]">
              {suggestions.map((s, i) => (
                <button
                  key={`${s}-${i}`}
                  className={`block w-full text-left px-3 py-1 ${i === selectedIndex ? "bg-ui-border/20" : "hover:bg-ui-border/10"
                    } text-ui-text`}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => applySuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active filters */}
        <div className="flex flex-wrap gap-2 mb-2 mt-1">
          {Array.from(parseQueryTokens(query).filters.entries()).map(([key, vals]) =>
            vals.map((val, idx) => (
              <span
                key={`${key}-${val}-${idx}`}
                className="px-2 py-1 text-sm bg-ui-border/20 rounded-sm text-ui-text"
              >
                {key}: {val}
              </span>
            ))
          )}
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto mt-2">
          {results.map((c) => (
            <button
              key={c.humanID}
              onClick={() => {
                onSelect(c.humanID);
                onClose();
              }}
              className="block w-full text-left px-3 py-2 rounded-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              <div className="font-semibold">{c.citizenName}</div>
              <div className="text-sm text-ui-text-dim">humanID: {c.humanID}</div>
            </button>
          ))}
          {query && results.length === 0 && (
            <div className="text-ui-text-dim text-center py-4">No matches</div>
          )}
        </div>
      </div>
    </div>
  );
}