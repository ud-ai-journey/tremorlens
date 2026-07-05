import React, { useRef, useEffect, useState, useCallback } from 'react';
import { analyzeSpiral } from '../utils/tremorAnalysis';

/**
 * Archimedes spiral tracing test. The user follows the printed guide spiral
 * with a finger; we record timed (x, y) points and hand them to analyzeSpiral.
 * The Archimedes spiral is a long-standing clinical tool for tremor assessment.
 */
export function SpiralTest({ onComplete }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pointsRef = useRef([]);
  const drawingRef = useRef(false);
  const sizeRef = useRef(320);

  const [status, setStatus] = useState('ready'); // 'ready' | 'drawing' | 'done'
  const [hasTrace, setHasTrace] = useState(false);

  // Draw the faint guide spiral the user should follow.
  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.44;
    const turns = 4;
    const b = maxR / (turns * 2 * Math.PI);

    ctx.beginPath();
    for (let theta = 0; theta <= turns * 2 * Math.PI; theta += 0.05) {
      const r = b * theta;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.setLineDash([2, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center start dot
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
  }, []);

  useEffect(() => {
    const resize = () => {
      const w = wrapRef.current?.clientWidth || 320;
      sizeRef.current = Math.max(240, Math.min(420, w));
      drawGuide();
      // Redraw any existing trace after a resize.
      if (pointsRef.current.length) drawTrace();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawGuide]);

  const drawTrace = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pts = pointsRef.current;
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }, []);

  const toCanvasPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, t: e.timeStamp };
  };

  const handleDown = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    pointsRef.current = [toCanvasPoint(e)];
    setStatus('drawing');
    setHasTrace(true);
    drawGuide();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    pointsRef.current.push(toCanvasPoint(e));
    // Incremental draw of the newest segment.
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pts = pointsRef.current;
    const n = pts.length;
    if (n >= 2) {
      ctx.beginPath();
      ctx.moveTo(pts[n - 2].x, pts[n - 2].y);
      ctx.lineTo(pts[n - 1].x, pts[n - 1].y);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  const handleUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const pts = pointsRef.current;
    if (pts.length >= 30) {
      const size = sizeRef.current;
      const result = analyzeSpiral(pts, { x: size / 2, y: size / 2 });
      setStatus('done');
      if (result) onComplete(result);
    } else {
      setStatus('ready');
    }
  };

  const reset = () => {
    pointsRef.current = [];
    drawingRef.current = false;
    setHasTrace(false);
    setStatus('ready');
    drawGuide();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h3 className="text-xl font-black text-blue-900">Spiral Test</h3>
        <p className="text-sm text-neutral-600 font-medium mt-1 max-w-md">
          Put your finger on the blue dot in the middle and slowly trace the
          dotted spiral outward. Try to stay on the line.
        </p>
      </div>

      <div ref={wrapRef} className="w-full flex justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          className="rounded-2xl border-2 border-blue-200 bg-white shadow-inner touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>

      <div className="flex items-center gap-3 min-h-[52px]">
        {status === 'done' ? (
          <span className="flex items-center gap-2 text-green-700 font-black">
            <span className="w-3 h-3 rounded-full bg-green-500" /> Captured — nice work!
          </span>
        ) : status === 'drawing' ? (
          <span className="text-blue-700 font-bold animate-pulse">Recording… keep tracing</span>
        ) : (
          <span className="text-neutral-500 font-medium">Trace the spiral to begin</span>
        )}
      </div>

      {hasTrace && (
        <button
          onClick={reset}
          className="min-h-[48px] px-6 bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-300 text-neutral-700 font-bold rounded-xl active:scale-95 transition touch-manipulation"
        >
          Clear &amp; try again
        </button>
      )}
    </div>
  );
}
