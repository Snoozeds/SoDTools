import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import DialogModal from "./components/DialogModal";
import ToolButton from "./components/ToolButton";
import CrumpledPaperIcon from "./assets/icons/IconCrumpledPaper.png";
import SearchIcon from "./assets/icons/IconSearch.png";
import SearchOverlay from "./components/SearchOverlay";
import CipherSolverWindow from "./components/CipherSolverWindow";
import CitizenWindow from "./components/CitizenWindow";

export default function App() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cityData, setCityData] = useState(null);
  const [solverWindows, setSolverWindows] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [openWindows, setOpenWindows] = useState([]);

  // Upload handling
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await fetch("/decompress", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!result?.success) {
        alert("Decompression failed");
        return;
      }

      setCityData(result);
      
      console.log(
        `Loaded city: ${result.data?.cityName || "Unknown"} — population ${result.data?.population || "?"}`
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
    accept: { "application/octet-stream": [".cit", ".citb"] },
  });

  // Cipher Solver
  function solveCipher(cipherText) {
    const citizens = cityData?.data?.citizens;
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
  const citizens = useMemo(() => cityData?.data?.citizens || [], [cityData]);

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
      <h1 className="text-3xl font-bold mb-4 drop-shadow-[0_0_6px_theme(colors.ui-border)]">
        Shadows of Doubt Tools
      </h1>

      {!cityData ? (
        <>
          <p
            className="text-ui-text-dim text-lg underline cursor-pointer mb-5 hover:text-ui-text transition-colors"
            onClick={() => setShowDialog(true)}
          >
            Where do I find my city files?
          </p>

          <div
            {...getRootProps()}
            className={`relative w-[480px] h-[160px] border rounded-sm grid-pattern flex flex-col justify-center items-center transition-all duration-200 cursor-pointer
              ${loading
                ? "border-ui-border shadow-[0_0_20px_theme(colors.ui-border)] motion-safe:animate-pulse opacity-70"
                : isDragActive
                  ? "border-ui-border shadow-[0_0_10px_theme(colors.ui-border)]"
                  : "border-ui-border-dim hover:border-ui-border"
              }`}
          >
            <input {...getInputProps()} />
            <p className="text-ui-text-dim text-lg">
              {loading
                ? "Loading city data..."
                : isDragActive
                  ? "Drop your .cit/.citb file"
                  : "Drag & drop or click to upload"}
            </p>
            {!isDragActive && !loading && (
              <span className="text-ui-text-dimmer text-lg">(.cit/.citb files)</span>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ui-dark/50">
                <div className="w-8 h-8 border-4 border-ui-border border-t-transparent rounded-full motion-safe:animate-spin" />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center text-ui-text-dim text-xl">
            <p className="font-semibold text-ui-text">
              City: {cityData?.data?.cityName || "Unknown"}
            </p>
            <p>Population: {cityData?.data?.population ?? "?"}</p>
            <p>Seed: {cityData?.data?.seed}</p>
          </div>

          <div className="flex gap-4">

            <ToolButton
              iconSrc={SearchIcon}
              label="Citizen Lookup"
              onClick={() => setShowSearch(true)}
            />

            <ToolButton
              iconSrc={CrumpledPaperIcon}
              label="Cipher Solver"
              onClick={() => {
                const nextId = solverWindows.length ? solverWindows[solverWindows.length - 1].id + 1 : 1;
                setSolverWindows([...solverWindows, { id: nextId, minimized: false }]);
              }}
            />
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
        </div>
      )}

      {/* Footer disclaimer. Only appears when city data hasn't been loaded. */}
      {!cityData && (
        <footer className="mt-8 text-sm text-ui-text-dim text-center opacity-70 max-w-[600px]">
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
          cityTiles={cityData?.data?.cityTiles}
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
            cityTiles={cityData?.data?.cityTiles}
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