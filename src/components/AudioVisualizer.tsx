import React, { useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

interface AudioVisualizerProps {
  height?: number;
  className?: string;
  showLabels?: boolean;
  accentColor?: string;
  isBypassed?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  height = 96,
  className = '',
  showLabels = false,
  isBypassed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = AudioEngine.getInstance();
    const dataArray = new Uint8Array(128);

    const render = () => {
      engine.getFrequencyData(dataArray);

      const width = canvas.width;
      const canvasHeight = canvas.height;
      ctx.clearRect(0, 0, width, canvasHeight);

      // We focus on the audible musical spectrum (approx first 64 bins up to ~16kHz)
      const numBars = 32;
      const barWidth = (width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        // Map exponential index to emphasize bass and low-mids where punch is located
        const dataIndex = Math.min(127, Math.floor(Math.pow(i / numBars, 1.4) * 58));
        const value = dataArray[dataIndex] || 0;
        
        // Bar height with min resting level
        const percent = Math.min(1, Math.max(0.04, value / 255));
        const barHeight = percent * (canvasHeight - 14);
        const x = i * (barWidth + 2);
        const y = canvasHeight - barHeight;

        // Gradient based on frequency range:
        // Bars 0-8: Sub-bass & Bass Punch (Ruby Red / Crimson #FF0033)
        // Bars 9-18: Midrange / Vocals (Amber / Tangerine)
        // Bars 19-31: Treble Clarity (Cyan / Electric Violet)
        const gradient = ctx.createLinearGradient(0, canvasHeight, 0, y);
        if (isBypassed) {
          gradient.addColorStop(0, 'rgba(120, 120, 120, 0.4)');
          gradient.addColorStop(1, 'rgba(180, 180, 180, 0.8)');
        } else if (i < 8) {
          gradient.addColorStop(0, 'rgba(255, 0, 51, 0.9)');
          gradient.addColorStop(1, 'rgba(255, 75, 43, 0.95)');
        } else if (i < 20) {
          gradient.addColorStop(0, 'rgba(255, 87, 34, 0.85)');
          gradient.addColorStop(1, 'rgba(255, 179, 0, 0.9)');
        } else {
          gradient.addColorStop(0, 'rgba(0, 210, 255, 0.85)');
          gradient.addColorStop(1, 'rgba(58, 123, 213, 0.95)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(2, barWidth), barHeight, [2, 2, 0, 0]);
        ctx.fill();

        // Little peak cap
        ctx.fillStyle = isBypassed ? '#9ca3af' : (i < 8 ? '#ff4d6d' : (i < 20 ? '#ffb703' : '#38bdf8'));
        ctx.fillRect(x, Math.max(0, y - 2), Math.max(2, barWidth), 2);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isBypassed]);

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={380}
        height={height}
        className="w-full h-full block rounded-xl bg-black/40 border border-white/5 shadow-inner"
      />
      {showLabels && (
        <div className="w-full flex justify-between items-center px-2 pt-1.5 text-[10px] text-zinc-400 font-mono">
          <span className="text-[#ff334b] font-medium">32Hz Sub-Bass</span>
          <span className="text-[#ff8c42]">120Hz Punch</span>
          <span className="text-[#ffb703]">1kHz Vokal</span>
          <span className="text-[#38bdf8]">10kHz Clarity Air</span>
        </div>
      )}
    </div>
  );
};
