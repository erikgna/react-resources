import React, { useRef, useEffect, useState } from "react";

/**
 * POC: Canvas API
 * A simple drawing board demonstrating paths, strokes, and clearing.
 */
export default function CanvasAPIPOC() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3b82f6"); // Blue

  // 1. Get the Context
  // The '2d' context is the object that contains all drawing methods.
  const getCtx = () => canvasRef.current?.getContext("2d");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution to match display size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = getCtx();
    if (ctx) {
      ctx.lineCap = "round"; // Makes the end of lines smooth
      ctx.lineWidth = 5;
    }
  }, []);

  // 2. Start Drawing (MouseDown)
  const startDrawing = (e: React.MouseEvent) => {
    const ctx = getCtx();
    if (!ctx) return;

    // Begin a new path so we don't connect to previous lines
    ctx.beginPath();
    // Move the "brush" to the mouse coordinates
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  // 3. Draw (MouseMove)
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;

    ctx.strokeStyle = color;
    // Create a line segment to the current mouse position
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    // Actually render the line on the screen
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (ctx && canvas) {
      // Wipes the entire rectangular area
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto border rounded-xl bg-gray-50 shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Canvas Drawing POC</h2>
        <div className="flex gap-4 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 cursor-pointer"
          />
          <button
            onClick={clearCanvas}
            className="px-3 py-1 bg-white border border-red-200 text-red-500 rounded hover:bg-red-50"
          >
            Clear Board
          </button>
        </div>
      </div>

      {/* The Canvas Element */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="w-full h-80 bg-white border border-gray-300 rounded-lg cursor-crosshair shadow-sm"
      />

      <div className="mt-4 text-sm text-gray-500 grid grid-cols-2 gap-4">
        <p>
          <strong>Context 2D:</strong> Used for shapes, text, and images.
        </p>
        <p>
          <strong>Stateful:</strong> Canvas remembers your current{" "}
          <code>strokeStyle</code> until you change it.
        </p>
      </div>
    </div>
  );
}
