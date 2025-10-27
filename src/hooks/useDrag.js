import { useState } from "react";

export default function useDrag(initial = { x: 100, y: 100 }) {
  const [position, setPosition] = useState(initial);

  function handleMouseDown(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y } = position;

    function onMouseMove(ev) {
      setPosition({
        x: x + (ev.clientX - startX),
        y: y + (ev.clientY - startY),
      });
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return { position, handleMouseDown };
}
