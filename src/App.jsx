import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import DialogModal from "./components/DialogModal";
import ToolButton from "./components/ToolButton";
import CrumpledPaperIcon from "./assets/icons/IconCrumpledPaper.png";
import SearchIcon from "./assets/icons/IconSearch.png";
import DonateIcon from "./assets/icons/IconResolve.png";
import LinkIcon from "./assets/icons/IconLink.png";
import FistIcon from "./assets/icons/IconFist.png";
import BuildingIcon from "./assets/icons/IconBuilding.png";
import SearchOverlay from "./components/SearchOverlay";
import BuildingDirectoryWindow from "./components/BuildingDirectoryWindow";
import CipherSolverWindow from "./components/CipherSolverWindow";
import CitizenWindow from "./components/CitizenWindow";
import KnockoutListWindow from "./components/KnockoutListWindow";

import BrotliWorker from './workers/brotli?worker'

export default function App() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cityData, setCityData] = useState(null);
  const [buildingWindows, setBuildingWindows] = useState([]);
  const [solverWindows, setSolverWindows] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [openWindows, setOpenWindows] = useState([]);
  const [koWindows, setKoWindows] = useState([]);

  // Upload handling
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();

      let result;

      if (file.name.endsWith(".citb")) {
        result = await new Promise((resolve) => {
          const brotli = new BrotliWorker();
          brotli.postMessage(arrayBuffer);
          brotli.addEventListener('message', ({ data }) => {
            resolve(JSON.parse(data));
          })
        });
      } else {
        const text = await file.text();
        // Replace invalid NaN, I had "Casablanca Quarter.1.3903.wK08ZyOM1xmZWTL1" fail to load for me because it had NaN as one of the values strangely enough.
        const clean = text
          .replace(/\bNaN\b/g, "null")
        result = JSON.parse(clean);
      }

      setCityData(result);

      console.log(
        `Loaded city: ${result?.cityName || "Unknown"} — population ${result?.population || "?"}`
      );
    } catch (err) {
      console.error("Error decompressing:", err);
      alert("Failed to process file");
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/octet-stream": [".cit", ".citb"],
      "application/x-binary": [".cit", ".citb"]
    },
    multiple: false,
  });

  // Cipher Solver
  function solveCipher(cipherText) {
    const citizens = cityData?.citizens;
    if (!Array.isArray(citizens)) return [];

    const parts = cipherText.toUpperCase().split(".");
    if (parts.length !== 2) return [];

    const cipherInitial = parts[0];
    const cipherSurnameSorted = [...parts[1]].sort().join("");

    const matches = citizens.filter((c) => {
      const name = c.citizenName;
      if (!name) return false;
      const [first, last] = name.split(" ");
      if (!first || !last) return false;

      const nameInitial = first[0].toUpperCase();
      const surnameSorted = [...last.toUpperCase()].sort().join("");

      return nameInitial === cipherInitial && surnameSorted === cipherSurnameSorted;
    });

    return matches.map((m) => m.citizenName);
  }

  // Citizen lookup
  const citizens = useMemo(() => cityData?.citizens || [], [cityData]);

  function openCitizenWindow(humanID) {
    setOpenWindows((prev) => {
      const existing = prev.find((w) => w.humanID === humanID);
      if (existing) return prev;
      const nextId = prev.length ? prev[prev.length - 1].id + 1 : 1;
      return [...prev, { id: nextId, humanID, minimized: false }];
    });
  }

  function closeWindow(id) {
    setOpenWindows((prev) => prev.filter((w) => w.id !== id));
  }

  function minimizeWindow(id) {
    setOpenWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w))
    );
  }

  function findCitizenByHumanID(humanID) {
    return citizens.find((c) => c.humanID === humanID);
  }

  // Cmd/Ctrl+K to open search
  window.onkeydown = (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setShowSearch((s) => !s);
    }
  };

  // Or, Cmd/Ctrl+F to open search
  window.onkeydown = (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "f") {
      e.preventDefault();
      setShowSearch((s) => !s);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-ui-dark text-ui-text relative">
      <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-center drop-shadow-[0_0_6px_theme(colors.ui-border)]">
        Shadows of Doubt Tools
      </h1>

      {!cityData ? (
        <>
          <p
            className="text-base sm:text-2xl underline cursor-pointer mb-5 hover:text-ui-text transition-colors text-center"
            onClick={() => setShowDialog(true)}
          >
            Where do I find my city files?
          </p>

          <div
            {...getRootProps()}
            className={`relative w-full max-w-md sm:max-w-2xl h-48 sm:h-60 border rounded-sm grid-pattern flex flex-col justify-center items-center transition-all duration-200 cursor-pointer
              ${loading
                ? "border-ui-border shadow-[0_0_20px_theme(colors.ui-border)] motion-safe:animate-pulse opacity-70"
                : isDragActive
                  ? "border-ui-border shadow-[0_0_10px_theme(colors.ui-border)]"
                  : "border-ui-border-dim hover:border-ui-border"
              }`}
          >
            <input {...getInputProps()} />
            <p className="text-ui-text-dim text-lg sm:text-2xl text-center px-4">
              {loading
                ? "Loading city data..."
                : isDragActive
                  ? "Drop your .cit/.citb file"
                  : "Drag & drop or click to upload"}
            </p>
            {!isDragActive && !loading && (
              <span className="text-ui-text-dimmer text-base sm:text-xl">
                (.cit/.citb files)
              </span>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ui-dark/50">
                <div className="w-12 h-12 border-4 border-ui-border border-t-transparent rounded-full motion-safe:animate-spin" />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center text-ui-text-dim text-xl">
            <p className="font-semibold text-ui-text">
              City: {cityData?.cityName || "Unknown"}
            </p>
            <p>Population: {cityData?.population ?? "?"}</p>
            <p>Seed: {cityData?.seed}</p>
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-4">
              <ToolButton
                iconSrc={SearchIcon}
                label="Citizen Lookup"
                onClick={() => setShowSearch(true)}
              />

              <ToolButton
                iconSrc={BuildingIcon}
                label="Building Directory"
                onClick={() => {
                  const nextId = buildingWindows.length ? buildingWindows[buildingWindows.length - 1].id + 1 : 1;
                  setBuildingWindows([...buildingWindows, { id: nextId, minimized: false }]);
                }}
              />

            </div>

            <div className="flex gap-4">
              <ToolButton
                iconSrc={FistIcon}
                label="Spare No One Helper"
                onClick={() => {
                  const nextId = koWindows.length ? koWindows[koWindows.length - 1].id + 1 : 1;
                  setKoWindows([...koWindows, { id: nextId, minimized: false }]);
                }}
              />

              <ToolButton
                iconSrc={CrumpledPaperIcon}
                label="Cipher Solver"
                onClick={() => {
                  const nextId = solverWindows.length
                    ? solverWindows[solverWindows.length - 1].id + 1
                    : 1;
                  setSolverWindows([...solverWindows, { id: nextId, minimized: false }]);
                }}
              />

            </div>

            <div className="flex gap-4">
              <ToolButton
                iconSrc={LinkIcon}
                label="GitHub"
                onClick={() => window.open("https://github.com/snoozeds/SoDTools", "_blank")}
              />

              <ToolButton
                iconSrc={DonateIcon}
                label="Support me"
                onClick={() => window.open("https://snoozeds.com/support", "_blank")}
              />
            </div>
          </div>

          {solverWindows.map((w) => (
            <CipherSolverWindow
              key={w.id}
              id={w.id}
              onClose={(id) => setSolverWindows((prev) => prev.filter((x) => x.id !== id))}
              onMinimize={(id) =>
                setSolverWindows((prev) =>
                  prev.map((x) => (x.id === id ? { ...x, minimized: !x.minimized } : x))
                )
              }
              minimized={w.minimized}
              solveCipher={solveCipher}
            />
          ))}

          {koWindows.map((w) => (
            <KnockoutListWindow
              key={w.id}
              id={w.id}
              minimized={w.minimized}
              onClose={(id) => setKoWindows((prev) => prev.filter((x) => x.id !== id))}
              onMinimize={(id) =>
                setKoWindows((prev) =>
                  prev.map((x) => (x.id === id ? { ...x, minimized: !x.minimized } : x))
                )
              }
              citizens={citizens}
              cityTiles={cityData?.cityTiles}
              onOpenCitizen={openCitizenWindow}
            />
          ))}

          {buildingWindows.map((w) => (
            <BuildingDirectoryWindow
              key={w.id}
              id={w.id}
              minimized={w.minimized}
              onClose={(id) => setBuildingWindows((prev) => prev.filter((x) => x.id !== id))}
              onMinimize={(id) =>
                setBuildingWindows((prev) =>
                  prev.map((x) => (x.id === id ? { ...x, minimized: !x.minimized } : x))
                )
              }
              citizens={citizens}
              cityTiles={cityData?.cityTiles}
              onOpenCitizen={openCitizenWindow}
            />
          ))}

        </div>
      )}

      {/* Footer disclaimer. Only appears when city data hasn't been loaded. */}
      {!cityData && (
        <footer className="mt-8 text-base text-ui-text-dim text-center opacity-70 max-w-[600px]">
          Shadows of Doubt Tools is an independent, fan-made project and is not affiliated
          with, endorsed by, or supported by ColePowered Games or Fireshine Games.
          All game content and trademarks belong to their respective owners.
        </footer>
      )}


      {showDialog && (
        <DialogModal
          speaker="How to find your city files"
          text={`Default city files appear in the game's folder. 
For example, right click Shadows of Doubt in Steam, click Manage -> Browse local files.

From there, go to Shadows of Doubt_Data -> StreamingAssets -> Cities and from here select the corresponding .cit file for your city.

Custom city files appear in your AppData\\locallow folder.
You can easily get to this by hitting the windows key + R, and then pasting %userprofile%\\appdata\\locallow\\ColePowered Games\\Shadows of Doubt\\Cities and clicking ok. From there, select the corresponding .cit or .citb file.`}
          onClose={() => setShowDialog(false)}
        />
      )}

      {showSearch && (
        <SearchOverlay
          citizens={citizens}
          onClose={() => setShowSearch(false)}
          cityTiles={cityData?.cityTiles}
          onSelect={(id) => openCitizenWindow(id)}
        />
      )}

      {openWindows.map((w) => {
        const citizen = findCitizenByHumanID(w.humanID);
        if (!citizen) return null;
        return (
          <CitizenWindow
            key={w.id}
            id={w.id}
            citizen={citizen}
            citizens={citizens}
            cityTiles={cityData?.cityTiles}
            minimized={w.minimized}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onOpenCitizen={openCitizenWindow}
          />
        );
      })}
    </div>
  );
}