import React, { useMemo, useState } from "react";
import useDrag from "../hooks/useDrag";

export default function BuildingDirectoryWindow({
    id,
    onClose,
    onMinimize,
    minimized,
    citizens = [],
    cityTiles = [],
    onOpenCitizen,
}) {
    const { position, handleMouseDown } = useDrag({ x: 100 + id * 40, y: 100 + id * 20 });
    const [selectedBuilding, setSelectedBuilding] = useState("");

    // Build map of building to residents
    const buildingMap = useMemo(() => {
        const map = new Map();
        const addrToBuilding = new Map();
        const addrToName = new Map();

        for (const tile of cityTiles || []) {
            const b = tile?.building;
            if (!b?.floors) continue;
            for (const f of b.floors) {
                for (const addr of f.addresses || []) {
                    if (addr?.id && b?.name) {
                        addrToBuilding.set(addr.id, b.name);
                        addrToName.set(addr.id, addr.name || b.name);
                    }
                }
            }
        }

        for (const c of citizens || []) {
            const bName = addrToBuilding.get(c.home);
            if (!bName) continue;
            if (!map.has(bName)) map.set(bName, []);
            map.get(bName).push(c);
        }

        for (const [list] of map.entries()) {
            list.sort((a, b) => {
                const addrA = (addrToName.get(a.home) || "").toLowerCase();
                const addrB = (addrToName.get(b.home) || "").toLowerCase();

                // Basement first
                const basementA = addrA.includes("basement") ? 1 : 0;
                const basementB = addrB.includes("basement") ? 1 : 0;
                if (basementA !== basementB) return basementB - basementA;

                // Numeric sort
                const numA = parseInt(addrA.match(/\d+/)?.[0] || 0, 10);
                const numB = parseInt(addrB.match(/\d+/)?.[0] || 0, 10);
                if (numA !== numB) return numA - numB;

                // Fallback lexical
                if (addrA !== addrB)
                    return addrA.localeCompare(addrB, undefined, { sensitivity: "base" });

                return (a.citizenName || "").localeCompare(
                    b.citizenName || "",
                    undefined,
                    { sensitivity: "base" }
                );
            });
        }

        return map;
    }, [citizens, cityTiles]);

    const buildingNames = useMemo(
        () => Array.from(buildingMap.keys()).sort((a, b) => a.localeCompare(b)),
        [buildingMap]
    );

    const selectedResidents = selectedBuilding ? buildingMap.get(selectedBuilding) || [] : [];

    // Sort businesses by floor (basements first) then by name
    const businesses = useMemo(() => {
        if (!selectedBuilding) return [];

        const found = [];

        for (const tile of cityTiles || []) {
            const b = tile?.building;
            if (!b || b.name !== selectedBuilding || !b.floors) continue;

            for (const floor of b.floors || []) {
                const num = floor.floor;
                for (const addr of floor.addresses || []) {
                    const company = addr?.company;
                    const preset = company?.preset?.toLowerCase?.() || "";
                    const name = addr?.name?.trim() || "";

                    if (
                        !company ||
                        Object.keys(company).length === 0 ||
                        !name ||
                        /^\d{2,4}\s/.test(name) ||
                        /vacant|bathroom|pavement|lobby|tower|management|landlord/i.test(name) ||
                        preset.includes("residence") ||
                        preset.includes("apartment") ||
                        preset === "" ||
                        preset.startsWith("streetfoodvendor")
                    )
                        continue;

                    let floorNum = typeof num === "number" ? num : null;
                    let location;
                    if (addr.isOutside === true || /outside|street-side/i.test(name)) location = "Outside";
                    else if (typeof num === "number") {
                        if (num < 0) location = `Basement ${Math.abs(num)}`;
                        else if (num === 0) location = "Ground floor";
                        else location = `Floor ${num}`;
                    } else location = floor.name || "Unknown floor";

                    found.push({
                        name,
                        preset: company?.preset || "Unknown",
                        location,
                        floorNum,
                    });
                }
            }
        }

        return found.sort((a, b) => {
            const aFloor = a.floorNum ?? 999;
            const bFloor = b.floorNum ?? 999;
            if (aFloor !== bFloor) return aFloor - bFloor;
            return a.name.localeCompare(b.name);
        });
    }, [selectedBuilding, cityTiles]);

    return (
        <div
            className="absolute bg-ui-panel border-2 border-ui-border rounded-sm shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden grid-pattern"
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                width: 400,
                zIndex: 500 + id,
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2 bg-ui-bg-text border-b border-ui-border cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="font-semibold text-ui-text">Building Directory</div>
                <div className="flex items-center gap-1">
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => onMinimize(id)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-ui-border/20 rounded-sm text-ui-text"
                    >
                        {minimized ? "□" : "−"}
                    </button>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => onClose(id)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-ui-border/20 rounded-sm text-ui-text text-xl"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Content */}
            {!minimized && (
                <div className="p-3 text-sm text-ui-text">
                    {/* Building list */}
                    {!selectedBuilding && (
                        <ul className="max-h-[420px] overflow-y-auto border border-ui-border rounded-sm divide-y divide-ui-border/40">
                            {buildingNames.map((b) => {
                                const count = buildingMap.get(b)?.length || 0;
                                return (
                                    <li key={b} className="px-2 py-1 flex justify-between items-center">
                                        <button
                                            onClick={() => setSelectedBuilding(b)}
                                            className="flex-1 text-left hover:underline text-ui-text truncate"
                                            title={b}
                                        >
                                            {b}
                                        </button>
                                        <span className="text-ui-text-dim text-xs">{count}</span>
                                    </li>
                                );
                            })}
                            {buildingNames.length === 0 && (
                                <li className="px-2 py-2 text-ui-text-dim">No buildings found.</li>
                            )}
                        </ul>
                    )}

                    {selectedBuilding && (
                        <div>
                            <button
                                onClick={() => setSelectedBuilding("")}
                                className="mb-2 text-ui-border hover:underline text-xs"
                            >
                                ← Back
                            </button>
                            <div className="font-semibold mb-2 text-ui-text">{selectedBuilding}</div>

                            {/* Residents */}
                            <div className="mb-1 text-ui-text-dim text-xs uppercase tracking-wide">Residents</div>
                            <ul className="max-h-[200px] overflow-y-auto border border-ui-border rounded-sm divide-y divide-ui-border/40 mb-3">
                                {selectedResidents.map((c) => {
                                    let address = "";
                                    for (const tile of cityTiles || []) {
                                        const b = tile?.building;
                                        if (!b?.floors) continue;
                                        for (const f of b.floors) {
                                            for (const addr of f.addresses || []) {
                                                if (addr?.id === c.home) address = addr.name || "";
                                            }
                                        }
                                    }

                                    return (
                                        <li key={c.humanID} className="px-2 py-1">
                                            <button
                                                onClick={() => onOpenCitizen(c.humanID)}
                                                className="text-left hover:underline text-ui-text block truncate w-full"
                                            >
                                                {c.citizenName || "(Unknown)"}
                                            </button>
                                            {address && <div className="text-xs text-ui-text-dim truncate">{address}</div>}
                                        </li>
                                    );
                                })}
                                {selectedResidents.length === 0 && (
                                    <li className="px-2 py-2 text-ui-text-dim">No residents found.</li>
                                )}
                            </ul>

                            {/* Businesses */}
                            <div className="mb-1 text-ui-text-dim text-xs uppercase tracking-wide">Businesses</div>
                            <ul className="max-h-[150px] overflow-y-auto border border-ui-border rounded-sm divide-y divide-ui-border/40">
                                {businesses.length > 0 ? (
                                    businesses.map((biz) => (
                                        <li key={biz.name} className="px-2 py-1">
                                            <div className="text-ui-text">
                                                {biz.name}{" "}
                                                <span className="text-ui-text-dim text-xs">({biz.preset})</span>
                                            </div>
                                            <div className="text-xs text-ui-text-dim truncate">{biz.location}</div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-2 py-2 text-ui-text-dim">No businesses found.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
