import React from "react";
import checkIcon from "../assets/icons/IconCheckboxChecked.png";
import crossIcon from "../assets/icons/IconCheckboxCross.png";
import speechIcon from "../assets/icons/IconMessage.png";

export default function DialogModalYesNo({ speaker, text, onYes, onNo }) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xl"
        onClick={onNo}
      />
      
      <div className="relative z-10 w-full max-w-[800px]">
        {/* Outer dialog box */}
        <div className="relative bg-[rgba(128,0,32,0.25)] border-2 border-ui-border rounded-sm shadow-[0_0_16px_theme(colors.ui-border)] grid-pattern">
          {/* Header */}
          <div className="flex items-center gap-2 bg-ui-panel/90 border-b border-ui-border px-6 py-3">
            <img
              src={speechIcon}
              alt=""
              className="w-10 h-10 opacity-90 drop-shadow-[0_0_3px_theme(colors.ui-border)] flex-shrink-0"
            />
            <span className="text-ui-text font-semibold text-2xl tracking-wide leading-none">
              {speaker}
            </span>
          </div>
          
          {/* Inner text bubble area */}
          <div className="grid-pattern px-6 py-6">
            <div className="bg-ui-bg-text border-2 border-ui-border-text text-left text-[15px] font-semibold text-ui-text-dialogue rounded-[2px] px-6 py-4 overflow-y-auto max-h-[400px]">
              {paragraphs.map((para, i) => (
                <p key={i} className="mb-3 last:mb-0">
                  {para.split('\n').map((line, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              ))}
            </div>
          </div>
        </div>
        
        {/* Yes/No buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onNo}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ui-text-dim border border-ui-border-dim bg-[rgba(43,21,54,0.7)] hover:bg-[rgba(43,21,54,0.9)] hover:text-ui-border hover:border-ui-border transition-colors duration-150 rounded-sm shadow-[0_0_6px_rgba(255,106,106,0.4)]"
          >
            <img src={crossIcon} alt="No" className="w-4 h-4 opacity-75" />
            <span>No</span>
          </button>
          
          <button
            onClick={onYes}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ui-text border border-ui-border bg-[rgba(128,0,32,0.5)] hover:bg-[rgba(128,0,32,0.7)] hover:shadow-[0_0_8px_theme(colors.ui-border)] transition-all duration-150 rounded-sm shadow-[0_0_6px_rgba(255,106,106,0.4)]"
          >
            <img src={checkIcon} alt="Yes" className="w-4 h-4 opacity-90" />
            <span>Yes</span>
          </button>
        </div>
      </div>
    </div>
  );
}