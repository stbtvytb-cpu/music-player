import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, Radio } from 'lucide-react';

interface AndroidStatusBarProps {
  dspActive?: boolean;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({ dspActive = true }) => {
  const [timeStr, setTimeStr] = useState<string>('18:37');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-8 px-5 flex items-center justify-between text-xs font-medium text-white/90 select-none bg-black/60 backdrop-blur-md z-40 shrink-0">
      {/* Time & DSP indicator */}
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-tight">{timeStr}</span>
        {dspActive && (
          <div className="flex items-center gap-1 text-[9px] bg-red-600/30 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded-full font-mono">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            <span>YT DSP</span>
          </div>
        )}
      </div>

      {/* Center Camera Punch-hole */}
      <div className="w-3.5 h-3.5 rounded-full bg-[#0a0a0a] border border-white/10 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
      </div>

      {/* Network & Battery */}
      <div className="flex items-center gap-2 text-white/80">
        <Signal className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold">5G</span>
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono">92%</span>
          <Battery className="w-4 h-4 fill-white/80" />
        </div>
      </div>
    </div>
  );
};
