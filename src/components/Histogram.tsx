import { useEffect, useRef } from 'react';

interface Props {
  compact?: boolean;
}

function generateHistogramData(channel: 'r' | 'g' | 'b' | 'lum') {
  const data = new Array(64).fill(0);
  const peaks = channel === 'r'
    ? [{ pos: 48, height: 0.9 }, { pos: 30, height: 0.4 }, { pos: 12, height: 0.2 }]
    : channel === 'g'
    ? [{ pos: 40, height: 0.8 }, { pos: 22, height: 0.5 }, { pos: 55, height: 0.3 }]
    : channel === 'b'
    ? [{ pos: 20, height: 0.7 }, { pos: 45, height: 0.35 }, { pos: 8, height: 0.25 }]
    : [{ pos: 38, height: 0.85 }, { pos: 18, height: 0.45 }, { pos: 52, height: 0.3 }];

  for (let i = 0; i < data.length; i++) {
    let val = 0;
    for (const peak of peaks) {
      const dist = Math.abs(i - peak.pos);
      val += peak.height * Math.exp(-(dist * dist) / 80);
    }
    data[i] = Math.min(1, val + Math.random() * 0.05);
  }
  return data;
}

export function Histogram({ compact = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo((W * i) / 4, 0);
        ctx.lineTo((W * i) / 4, H);
        ctx.stroke();
      }

      const channels: Array<{ data: number[]; color: string; alpha: number }> = [
        { data: generateHistogramData('r'), color: 'rgb(239,68,68)', alpha: 0.5 },
        { data: generateHistogramData('g'), color: 'rgb(34,197,94)', alpha: 0.5 },
        { data: generateHistogramData('b'), color: 'rgb(59,130,246)', alpha: 0.5 },
        { data: generateHistogramData('lum'), color: 'rgb(255,255,255)', alpha: 0.25 },
      ];

      for (const ch of channels) {
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let i = 0; i < ch.data.length; i++) {
          const x = (i / ch.data.length) * W;
          const y = H - ch.data[i] * (H - 4);
          if (i === 0) ctx.lineTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = ch.color.replace('rgb', 'rgba').replace(')', `, ${ch.alpha})`);
        ctx.fill();

        // Stroke
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let i = 0; i < ch.data.length; i++) {
          const x = (i / ch.data.length) * W;
          const y = H - ch.data[i] * (H - 4);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Clipping indicators
      const rData = generateHistogramData('r');
      if (rData[rData.length - 1] > 0.5 || rData[rData.length - 2] > 0.5) {
        ctx.fillStyle = 'rgba(239,68,68,0.8)';
        ctx.fillRect(W - 3, 0, 3, H);
      }
    };

    animate();
    const interval = setInterval(animate, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${compact ? 'w-28 h-14' : 'w-48 h-24'} rounded-lg overflow-hidden border border-white/20`}>
      <canvas
        ref={canvasRef}
        width={compact ? 112 : 192}
        height={compact ? 56 : 96}
        className="w-full h-full"
      />
      {!compact && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-1">
          <span className="text-[7px] text-white/40">SHADOWS</span>
          <span className="text-[7px] text-white/40">MIDS</span>
          <span className="text-[7px] text-white/40">HIGHLIGHTS</span>
        </div>
      )}
      <div className="absolute top-1 right-1">
        <span className="text-[7px] text-yellow-400 font-bold tracking-wider">HIST</span>
      </div>
    </div>
  );
}
