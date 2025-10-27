import React, { useState, useMemo } from "react";
import UnknownIcon from "../assets/icons/UnknownCitizen.png";
import useDrag from "../hooks/useDrag";
import {
  hairTypeLabels,
  hairColourLabels,
  eyeColourLabels,
  facialFeatureLabels,
  bloodTypeLabels,
  heightLabels,
  genderLabels,
} from "../data/CitizenAttributes.jsx";

export default function CitizenWindow({
  id,
  citizen,
  citizens,
  cityTiles,
  onClose,
  onMinimize,
  onOpenCitizen,
  minimized,
}) {
  const [traitsOpen, setTraitsOpen] = useState(false);
  const { position, handleMouseDown } = useDrag({ x: 100 + id * 40, y: 100 + id * 20 });

  const rawPassword =
    citizen?.password?.digits?.length > 0
      ? citizen.password.digits.join("")
      : citizen?.password || "";

  const visibleTraits = Array.isArray(citizen?.traits)
    ? citizen.traits.filter((t) => !/\d{4}$/.test((t.trait || "").trim()))
    : [];

  const partner = useMemo(() => {
    if (!citizen?.partner || citizen.partner < 0) return null;
    return citizens?.find((c) => c.humanID === citizen.partner) || null;
  }, [citizen?.partner, citizens]);

  const getSexuality = () => {
    if (!Array.isArray(citizen?.traits)) return "Unknown";

    const attractedToMen = citizen.traits.some((t) =>
      t.trait?.includes("Sex-AttractedToMen")
    );
    const attractedToWomen = citizen.traits.some((t) =>
      t.trait?.includes("Sex-AttractedToWomen")
    );
    const attractedToNB = citizen.traits.some((t) =>
      t.trait?.includes("Sex-AttractedToNonBinary")
    );

    if (attractedToMen && attractedToWomen && attractedToNB) return "Pansexual";
    if (attractedToMen && attractedToWomen) return "Bisexual";
    if (attractedToMen && attractedToNB) return "Attracted to men & non-binary";
    if (attractedToWomen && attractedToNB) return "Attracted to women & non-binary";
    if (attractedToMen) return citizen?.gender === 0 ? "Gay" : "Straight";
    if (attractedToWomen) return citizen?.gender === 0 ? "Straight" : "Lesbian";
    if (attractedToNB) return "Attracted to non-binary";
    return "Asexual";
  };

  const hairColourName =
    hairColourLabels[citizen.descriptors?.hairColourCategory] || "Unknown hair colour";

  const addressMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(cityTiles)) return map;

    for (const tile of cityTiles) {
      const building = tile?.building;
      if (!building?.floors) continue;

      for (const floor of building.floors) {
        if (!floor?.addresses) continue;
        for (const addr of floor.addresses) {
          if (addr?.id) map.set(addr.id, addr.name || "Unknown address");
        }
      }
    }
    return map;
  }, [cityTiles]);

  const homeAddress =
    addressMap.get(citizen?.home) || (citizen?.homeless ? "Homeless" : "Unknown");

  const jobInfo = useMemo(() => {
    if (!Array.isArray(cityTiles) || !citizen?.job) return null;

    for (const tile of cityTiles) {
      const building = tile?.building;
      if (!building?.floors) continue;

      for (const floor of building.floors) {
        if (!Array.isArray(floor.addresses)) continue;

        for (const addr of floor.addresses) {
          const company = addr?.company;
          if (!company?.companyRoster) continue;

          const match = company.companyRoster.find((r) => r.id === citizen.job);
          if (match) {
            return {
              workplace: addr.name || building.name || "Unknown workplace",
              jobTitle: match.name || "Unknown title",
            };
          }
        }
      }
    }

    return null;
  }, [cityTiles, citizen?.job]);

  return (
    <div
      className="absolute bg-ui-panel border-2 border-ui-border rounded-sm shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden grid-pattern"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: 512,
        zIndex: 50 + id,
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-ui-bg-text border-b border-ui-border cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="text-ui-text font-semibold">{citizen?.citizenName}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(id);
            }}
            title="Minimize"
            className="w-8 h-8 flex items-center justify-center hover:bg-ui-border/20 rounded-sm transition-colors text-ui-text"
          >
            {minimized ? "□" : "−"}
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClose(id);
            }}
            title="Close"
            className="w-8 h-8 flex items-center justify-center hover:bg-ui-border/20 rounded-sm transition-colors text-ui-text text-xl"
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="px-4 py-3 grid grid-cols-[72px_1fr] gap-4 select-text">
          <img src={UnknownIcon} alt="icon" className="w-16 h-16 rounded-sm" />
          <div>
            <div className="text-lg font-semibold text-ui-text">
              {citizen?.citizenName}
            </div>
            <div className="text-sm text-ui-text-dim mt-1">
              Date of birth: {citizen?.birthday || "—"}
              <br />
              Gender: {genderLabels[citizen?.gender] || "Unknown"}
              <br />
              Partner:{" "}
              {partner ? (
                <button
                  onClick={() => onOpenCitizen(partner.humanID)}
                  className="text-ui-border hover:underline"
                >
                  {partner.citizenName}
                </button>
              ) : (
                "None"
              )}
              <br />
              Sexuality: {getSexuality()}
              <br />
              <br />
              Hair: {hairTypeLabels[citizen.descriptors?.hairType]}, {hairColourName}
              <br />
              Facial features:{" "}
              {Array.isArray(citizen.descriptors?.facialFeatures) &&
              citizen.descriptors.facialFeatures.length > 0
                ? citizen.descriptors.facialFeatures
                    .map((f) => facialFeatureLabels[f.feature] || "Unknown")
                    .join(", ")
                : "None"}
              <br />
              Eyes: {eyeColourLabels[citizen.descriptors?.eyeColour] || "Unknown"}
              <br />
              Height: {citizen?.descriptors?.heightCM} cm (
              {heightLabels[citizen?.descriptors?.height] ?? "Unknown"})
              <br />
              Shoe size: {citizen?.descriptors?.shoeSize}
              <br />
              Blood type: {bloodTypeLabels[citizen?.blood] || "Unknown"}
              <br />
              <br />
              Address: {homeAddress || "Homeless"}
              <br />
              Workplace: {jobInfo?.workplace || "Unemployed"}
              <br />
              Job title: {jobInfo?.jobTitle || "-"}
            </div>

            {/* Passcode */}
            <div className="mt-3">
              <div className="text-sm text-ui-text-dim">Passcode</div>
              <div className="mt-1 inline-block px-2 py-1 rounded-sm border border-ui-border-dim bg-ui-dark/50">
                <span
                  className="block max-w-[220px] overflow-hidden whitespace-nowrap text-ellipsis text-ui-text"
                  style={{ filter: "blur(6px)", transition: "filter .12s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = "none")}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "blur(6px)")}
                >
                  {rawPassword || "—"}
                </span>
              </div>
            </div>

            {/* Traits */}
            <div className="mt-4">
              <button
                onClick={() => setTraitsOpen((s) => !s)}
                className="text-sm font-medium border border-ui-border-dim px-2 py-1 rounded-sm select-none hover:bg-ui-border/10 transition-colors text-ui-text"
              >
                {traitsOpen ? "Hide Traits" : "Show Traits"}
              </button>

              {traitsOpen && (
                <div className="mt-3 max-h-[180px] overflow-y-auto border border-ui-border rounded-sm p-2 bg-ui-bg-text text-sm select-text">
                  {visibleTraits.length ? (
                    visibleTraits.map((t, i) => (
                      <div key={i} className="mb-1">
                        <div className="font-semibold text-ui-text">{t.trait}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-ui-text-dim">No visible traits.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
