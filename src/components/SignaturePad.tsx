"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  isEn?: boolean;
  initialData?: string;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  onSave,
  onCancel,
  isEn = false,
  initialData,
  width = 500,
  height = 200,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [penColor, setPenColor] = useState("#1e3a5f");
  const [penSize, setPenSize] = useState(2.5);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw guide line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(30, height * 0.7);
    ctx.lineTo(width - 30, height * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasContent(true);
      };
      img.src = initialData;
    }

    // Save initial state
    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }, [width, height, initialData]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [width, height]
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      setIsDrawing(true);
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    },
    [getPos, penColor, penSize]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasContent(true);
    },
    [isDrawing, getPos]
  );

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // Save to history for undo
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height)
    );
    if (historyRef.current.length > 30) historyRef.current.shift();
  }, [isDrawing]);

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || historyRef.current.length <= 1) return;

    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHasContent(historyRef.current.length > 1);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width * dpr, height * dpr);

    // Redraw guide line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(30, height * 0.7);
    ctx.lineTo(width - 30, height * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);

    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    setHasContent(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;

    // Export as PNG with transparent background
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Get original image data
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Make white pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
        data[i + 3] = 0; // alpha = 0
      }
    }
    tempCtx.putImageData(imageData, 0, 0);

    const dataUrl = tempCanvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  const colors = ["#1e3a5f", "#1a1a2e", "#0f4c75", "#2d3436", "#000000"];

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          style={{ width: `${width}px`, height: `${height}px`, touchAction: "none", cursor: "crosshair" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {/* Tools */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">
            {isEn ? "Color" : "اللون"}
          </span>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setPenColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                penColor === c
                  ? "border-indigo-500 scale-125"
                  : "border-slate-300 hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Pen Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {isEn ? "Size" : "السمك"}
          </span>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={penSize}
            onChange={(e) => setPenSize(Number(e.target.value))}
            className="w-20 accent-indigo-600"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasContent}
          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isEn ? "Save Signature" : "حفظ التوقيع"}
        </button>
        <button
          onClick={handleUndo}
          disabled={historyRef.current.length <= 1}
          className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-40"
        >
          {isEn ? "Undo" : "تراجع"}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
        >
          {isEn ? "Clear" : "مسح"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all"
        >
          {isEn ? "Cancel" : "إلغاء"}
        </button>
      </div>
    </div>
  );
}
