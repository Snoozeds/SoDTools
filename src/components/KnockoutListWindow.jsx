import React, { useMemo, useState } from "react";
import BrotliWorker from '../workers/brotli?worker'
import useDrag from "../hooks/useDrag";
import DialogModal from "./DialogModal";
import IconBuilding from "../assets/icons/IconBuilding.png";
import IconHelp from "../assets/icons/IconHelp.png";
import IconEye from "../assets/icons/IconEye.png";
import IconHidden from "../assets/icons/IconHidden.png";

export default function KnockoutListWindow({
    id,
    onClose,
    onMinimize,
    minimized,
    citizens = [],
    cityTiles = [],
    onOpenCitizen,
}) {
    const { position, handleMouseDown } = useDrag({ x: 80 + id * 40, y: 80 + id * 20 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [spareNoOneReference, setSpareNoOneReference] = useState([]);
    const [showSodbHelp, setShowSodbHelp] = useState(false);
    const [query, setQuery] = useState("");
    const [sortMode, setSortMode] = useState("name");
    const [selectedResidence, setSelectedResidence] = useState("");
    const [hideKnocked, setHideKnocked] = useState(false);

    const knocked = useMemo(() => new Set(spareNoOneReference), [spareNoOneReference]);

    function getAddressInfo(citizen) {
        if (citizen?.homeless) return { building: "Homeless", address: "Homeless" };
        for (const tile of cityTiles || []) {
            const b = tile?.building;
            if (!b?.floors) continue;
            for (const f of b.floors) {
                for (const addr of f.addresses || []) {
                    if (addr?.id === citizen?.home)
                        return { building: b.name || "Unknown", address: addr.name || b.name || "Unknown" };
                }
            }
        }
        return { building: "Unknown", address: "Unknown" };
    }

    const residences = useMemo(() => {
        const occupied = new Set();
        const addrToBuilding = new Map();
        for (const tile of cityTiles || []) {
            const b = tile?.building;
            if (!b?.floors) continue;
            for (const f of b.floors) {
                for (const addr of f.addresses || []) {
                    if (addr?.id && b?.name) addrToBuilding.set(addr.id, b.name);
                }
            }
        }
        for (const c of citizens || []) {
            if (c?.homeless) continue;
            const building = addrToBuilding.get(c.home);
            if (building) occupied.add(building);
        }
        return Array.from(occupied).sort((a, b) => a.localeCompare(b));
    }, [cityTiles, citizens]);

    const sorted = useMemo(() => {
        const list = citizens.slice();
        list.sort((a, b) => {
            if (sortMode === "residence") {
                const { address: addrA, building: buildingA } = getAddressInfo(a);
                const { address: addrB, building: buildingB } = getAddressInfo(b);

                // Group by building name
                if (buildingA !== buildingB) return buildingA.localeCompare(buildingB);

                const lowerA = addrA.toLowerCase();
                const lowerB = addrB.toLowerCase();

                // Basements get priority
                const basementA = lowerA.includes("basement") ? 1 : 0;
                const basementB = lowerB.includes("basement") ? 1 : 0;
                if (basementA !== basementB) return basementB - basementA;

                // Numeric sort
                const numA = parseInt(addrA.match(/\d+/)?.[0] || 0, 10);
                const numB = parseInt(addrB.match(/\d+/)?.[0] || 0, 10);
                if (numA !== numB) return numA - numB;

                // Fallback lexical
                return addrA.localeCompare(addrB);
            }

            return (a.citizenName || "").localeCompare(b.citizenName || "", undefined, { sensitivity: "base" });
        });
        return list;
    }, [citizens, sortMode, cityTiles]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return sorted.filter((c) => {
            const name = (c.citizenName || "").toLowerCase();
            const { building } = getAddressInfo(c);
            const matchesQuery = !q || name.includes(q);
            const matchesResidence = !selectedResidence || building === selectedResidence;
            const isKO = knocked.has(c.humanID ?? c.id);
            return matchesQuery && matchesResidence && (!hideKnocked || !isKO);
        });
    }, [sorted, query, selectedResidence, hideKnocked, knocked]);

    const totals = {
        all: citizens.length,
        knocked: spareNoOneReference.length,
        remaining: Math.max(0, citizens.length - spareNoOneReference.length),
    };

    async function handleUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!/\.(sodb|sod)$/i.test(file.name)) {
            setError("Please upload a .sodb or .sod file");
            return;
        }
        setError("");
        setLoading(true);

        try {
            const arrayBuffer = await file.arrayBuffer();

            const result = await new Promise((resolve, reject) => {
                const worker = new BrotliWorker();
                worker.postMessage(arrayBuffer);
                worker.onmessage = ({ data }) => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (err) {
                        reject(err);
                    } finally {
                        worker.terminate();
                    }
                };
                worker.onerror = (err) => {
                    reject(err);
                    worker.terminate();
                };
            });

            const list = Array.isArray(result?.spareNoOneReference)
                ? result.spareNoOneReference
                : [];

            setSpareNoOneReference(list);
        } catch (err) {
            console.error("Error decompressing save:", err);
            setError("Failed to read file");
        } finally {
            setLoading(false);
            e.target.value = "";
        }
    }

    function toggleKnockout(idKey) {
        setSpareNoOneReference((prev) => {
            const s = new Set(prev);
            s.has(idKey) ? s.delete(idKey) : s.add(idKey);
            return Array.from(s);
        });
    }

    return (
        <div
            className="absolute bg-ui-panel border border-ui-border rounded-sm shadow-lg overflow-hidden grid-pattern"
            style={{ top: position.y, left: position.x, width: 420, zIndex: 200 + id }}
        >
            {/* HEADER */}
            <div
                className="flex justify-between items-center px-3 py-2 bg-ui-bg-text border-b border-ui-border cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex flex-col text-xs leading-tight">
                    <span className="font-semibold text-ui-text">Spare No One Helper</span>
                    <span className="text-ui-text-dim">
                        KO: {totals.knocked}/{totals.all} | Remaining: {totals.remaining}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => onMinimize(id)}
                        className="w-7 h-7 text-ui-text hover:bg-ui-border/20 rounded-sm"
                    >
                        {minimized ? "□" : "−"}
                    </button>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => onClose(id)}
                        className="w-7 h-7 text-ui-text hover:bg-ui-border/20 rounded-sm text-lg"
                    >
                        ×
                    </button>
                </div>
            </div>

            {!minimized && (
                <div className="p-3 space-y-2 text-sm">
                    {/* UPLOAD PANEL */}
                    {spareNoOneReference.length === 0 && (
                        <div className="border border-ui-border-dim rounded-sm p-2 bg-ui-dark/40">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-ui-text-dim mb-2">Upload .sodb/.sod save file</span>
                                <img
                                    src={IconHelp}
                                    title="Help"
                                    alt="help"
                                    className="w-4 h-4 cursor-pointer opacity-70 hover:opacity-100"
                                    onClick={() => setShowSodbHelp(true)}
                                />
                            </div>
                            <label
                                htmlFor={`sodb-upload-${id}`}
                                className="px-3 py-1 border border-ui-border-dim rounded-sm bg-ui-dark/50 text-ui-text hover:bg-ui-border/10 cursor-pointer select-none"
                            >
                                Choose file
                            </label>
                            <input
                                id={`sodb-upload-${id}`}
                                type="file"
                                accept=".sodb,.sod"
                                onChange={handleUpload}
                                className="hidden"
                            />
                            {loading && <span className="ml-2 text-ui-text-dim">Reading…</span>}
                            {error && <div className="mt-1 text-red-400">{error}</div>}
                            <p className="mt-2 text-sm text-ui-border">Make sure to upload a save that uses the same city as the one you uploaded.</p>
                        </div>
                    )}

                    {/* TOOLBAR */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search…"
                            className="flex-1 h-7 px-2 rounded-sm border border-ui-border-dim bg-ui-dark/40 text-ui-text text-sm outline-none"
                        />
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value)}
                            className="h-7 px-2 border border-ui-border-dim bg-ui-dark/40 rounded-sm text-ui-text text-sm"
                            title="Sort mode"
                        >
                            <option value="name">Name</option>
                            <option value="residence">Residence</option>
                        </select>
                        <img
                            src={hideKnocked ? IconHidden : IconEye}
                            onClick={() => setHideKnocked(v => !v)}
                            title={hideKnocked ? "Show knocked out" : "Hide knocked out"}
                            alt="toggle visibility"
                            className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100"
                        />
                        <select
                            value={selectedResidence}
                            onChange={(e) => setSelectedResidence(e.target.value)}
                            className="px-2 py-1 border border-ui-border-dim bg-ui-dark/40 rounded-sm text-ui-text"
                            title="Filter by residence"
                        >
                            <option value="">All</option>
                            {residences.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                        <img src={IconBuilding} alt="building" className="w-5 h-5 opacity-70" />
                    </div>

                    {/* LIST */}
                    <ul className="max-h-[400px] overflow-y-auto border border-ui-border rounded-sm divide-y divide-ui-border/40">
                        {filtered.map((c) => {
                            const idKey = c.humanID ?? c.id;
                            const isKO = knocked.has(idKey);
                            const { address } = getAddressInfo(c);
                            return (
                                <li key={idKey} className="px-2 py-1 flex justify-between items-center">
                                    <button
                                        onClick={() => onOpenCitizen(idKey)}
                                        className={`flex-1 text-left truncate ${isKO
                                            ? "line-through text-ui-border decoration-ui-border"
                                            : "text-ui-text hover:underline"
                                            }`}
                                    >
                                        {c.citizenName || "(Unknown)"}{" "}
                                        <span className="text-ui-text-dim">[{address}]</span>
                                    </button>
                                    <button
                                        onClick={() => toggleKnockout(idKey)}
                                        className="ml-2 w-6 h-6 flex items-center justify-center border border-ui-border-dim rounded-sm text-xs text-ui-text-dim hover:text-ui-text hover:bg-ui-border/10"
                                        title="Toggle KO"
                                    >
                                        {isKO ? "↺" : "✕"}
                                    </button>
                                </li>
                            );
                        })}
                        {filtered.length === 0 && (
                            <li className="px-2 py-2 text-ui-text-dim text-center">No matches</li>
                        )}
                    </ul>
                </div>
            )}

            {showSodbHelp && (
                <DialogModal
                    speaker="Where to find your .sodb/.sod save"
                    text={`.sodb and .sod files store your game's save data.

Windows:
Press Win+R and paste:
%userprofile%\\AppData\\LocalLow\\ColePowered Games\\Shadows of Doubt\\
Look in the Save folder for your .sodb, or .sod file.`}
                    onClose={() => setShowSodbHelp(false)}
                />
            )}
        </div>
    );
}
