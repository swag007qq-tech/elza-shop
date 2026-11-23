import React from 'react';

interface HeartParticle {
  id: number;
  left: number;
  top: number;
  size: number;
  rotate: number;
  delayMs: number;
  color: string;
}

const BROWN_PALETTE = [
  '#7D5E55',
  '#8B5A44',
  '#6B4E45',
  '#9E6B56',
  '#744B39',
];

export function generateHeartParticles(): HeartParticle[] {
  const count = 26;
  const cols = 6;
  const rows = 4;
  const particles: HeartParticle[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols) % rows;
    const baseLeft = ((col + 0.5) / cols) * 92 + 4;
    const baseTop = ((row + 0.5) / rows) * 86 + 7;
    const jitterX = (Math.random() - 0.5) * 12;
    const jitterY = (Math.random() - 0.5) * 14;

    particles.push({
      id: i,
      left: Math.min(95, Math.max(5, baseLeft + jitterX)),
      top: Math.min(93, Math.max(7, baseTop + jitterY)),
      size: 24 + Math.round(Math.random() * 24),
      rotate: Math.round((Math.random() - 0.5) * 34),
      delayMs: Math.round(Math.random() * 140),
      color: BROWN_PALETTE[i % BROWN_PALETTE.length],
    });
  }

  return particles;
}

interface BrownHeartsBurstProps {
  burstKey: number;
  particles: HeartParticle[];
}

export const BrownHeartsBurst: React.FC<BrownHeartsBurstProps> = ({burstKey, particles}) => {
  if (burstKey === 0 || particles.length === 0) return null;

  return (
    <div
      key={burstKey}
      aria-hidden="true"
      className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
    >
      {particles.map((heart) => (
        <span
          key={heart.id}
          style={
            {
              left: `${heart.left}%`,
              top: `${heart.top}%`,
              animationDelay: `${heart.delayMs}ms`,
              '--heart-rot': `${heart.rotate}deg`,
            } as React.CSSProperties
          }
          className="animate-elza-screen-heart absolute opacity-0 drop-shadow-[0_0_10px_rgba(122,74,52,0.55)]"
        >
          <svg
            width={heart.size}
            height={heart.size}
            viewBox="0 0 24 24"
            fill={heart.color}
            stroke="#FFF4EE"
            strokeWidth="1.2"
          >
            <path d="M12 20.6C12 20.6 3.5 14.9 3.5 8.9C3.5 6.1 5.6 4 8.3 4C10 4 11.4 4.9 12 6.2C12.6 4.9 14 4 15.7 4C18.4 4 20.5 6.1 20.5 8.9C20.5 14.9 12 20.6 12 20.6Z" />
          </svg>
        </span>
      ))}
    </div>
  );
};
