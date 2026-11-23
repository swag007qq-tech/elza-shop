import React, {useEffect, useState} from 'react';

const SPLASH_LOGO_SRC = '/assets/splash-logo.png';

export const SplashLogoOverlay: React.FC = () => {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'done'>('visible');

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setPhase('fading');
    }, 1100);

    const doneTimer = window.setTimeout(() => {
      setPhase('done');
    }, 1450);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      aria-hidden={phase === 'fading'}
      className={`elza-wallpaper fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-350 ease-out ${
        phase === 'fading'
          ? 'opacity-0 scale-[1.03] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      <img
        src={SPLASH_LOGO_SRC}
        alt="Elza Shop"
        draggable={false}
        className="animate-elza-splash-logo w-[230px] min-[400px]:w-[280px] sm:w-[340px] md:w-[385px] max-w-[82vw] h-auto select-none pointer-events-none drop-shadow-[0_0_28px_rgba(142,84,58,0.52)] drop-shadow-[0_14px_26px_rgba(105,64,48,0.32)]"
      />
    </div>
  );
};
