import React from "react";

export default function ToolButton({ iconSrc, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="tool-button relative flex items-center gap-4 w-[290px] px-8 py-4 
      border-2 border-ui-border bg-[rgba(43,21,54,0.7)] 
      hover:bg-[rgba(43,21,54,0.9)] transition-all duration-150 rounded-sm 
      shadow-[0_0_12px_theme(colors.ui-border)] text-ui-text font-semibold text-xl grid-pattern cursor-pointer"
    >
      <img
        src={iconSrc}
        alt=""
        className="w-10 h-10 drop-shadow-[0_0_4px_theme(colors.ui-border)]"
      />
      <span className="tracking-wide">{label}</span>
    </button>
  );
}
