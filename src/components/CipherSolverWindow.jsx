import React, { useState } from "react";
import useDrag from "../hooks/useDrag";
import CrumpledPaperIcon from "../assets/icons/IconCrumpledPaper.png";

export default function CipherSolverWindow({ id, onClose, onMinimize, minimized, solveCipher }) {
  const { position, handleMouseDown } = useDrag({ x: 120 + id * 30, y: 120 + id * 20 });
  const [cipherText, setCipherText] = useState("");
  const [result, setResult] = useState([]);

  function handleSolve() {
    if (!cipherText.trim()) {
      setResult(["Please enter a cipher first."]);
      return;
    }
    const matches = solveCipher(cipherText);
    setResult(matches.length ? matches : ["No matches found."]);
  }

  return (
    <div
      className="absolute bg-ui-panel border-2 border-ui-border rounded-sm shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden grid-pattern"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: 420,
        zIndex: 60 + id,
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-ui-bg-text border-b border-ui-border cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <img src={CrumpledPaperIcon} alt="cipher" className="w-5 h-5" />
          <span className="font-semibold text-ui-text">Cipher Solver</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onMinimize(id)}
            className="w-8 h-8 flex items-center justify-center hover:bg-ui-border/20 rounded-sm transition-colors text-ui-text"
            title="Minimize"
          >
            {minimized ? "□" : "−"}
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onClose(id)}
            className="w-8 h-8 flex items-center justify-center hover:bg-ui-border/20 rounded-sm transition-colors text-ui-text text-xl"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="p-4 text-ui-text">
          <p className="text-sm text-ui-text-dim mb-2">
            Enter a cipher (example: <code>L.DTHION</code>) to identify matching citizens.
          </p>

          <textarea
            className="w-full h-20 bg-ui-dark border border-ui-border rounded-sm p-2 resize-none focus:outline-none focus:border-ui-border/80"
            placeholder="Type cipher here..."
            value={cipherText}
            onChange={(e) => setCipherText(e.target.value)}
          />

          <button
            onClick={handleSolve}
            className="mt-3 w-full py-1 bg-ui-border/20 border border-ui-border rounded-sm hover:bg-ui-border/30 transition-colors font-medium"
          >
            Solve Cipher
          </button>

          <div className="mt-3 border-t border-ui-border pt-2 max-h-[150px] overflow-y-auto">
            {result.length ? (
              result.map((r, i) => (
                <p key={i} className="text-ui-text">{r}</p>
              ))
            ) : (
              <p className="text-ui-text-dim">No results yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
