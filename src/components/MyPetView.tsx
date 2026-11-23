import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ArrowLeft, Heart} from 'lucide-react';

interface MyPetViewProps {
  onBackToCatalog: () => void;
}

type PetMood = 'neutral' | 'happy' | 'grumpy';

interface PlayItem {
  id: string;
  label: string;
  emoji: string;
}

interface FloatingEffect {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const PET_IMAGES: Record<PetMood, string> = {
  neutral: '/assets/aistudio/20261122_144715_10a5d28f.jpg',
  happy: '/assets/aistudio/20261122_144721_776a3d86.jpg',
  grumpy: '/assets/aistudio/20261122_144718_0449425c.jpg',
};

const PLAY_ITEMS: PlayItem[] = [
  {id: 'candy', label: 'Конфетка', emoji: '🍬'},
  {id: 'heart', label: 'Сердечко', emoji: '💖'},
  {id: 'star', label: 'Звёздочка', emoji: '⭐'},
  {id: 'pillow', label: 'Подушечка', emoji: '🩷'},
  {id: 'flower', label: 'Цветочек', emoji: '🌸'},
  {id: 'bow', label: 'Бантик', emoji: '🎀'},
];

export const MyPetView: React.FC<MyPetViewProps> = ({onBackToCatalog}) => {
  const [mood, setMood] = useState<PetMood>('neutral');
  const [effects, setEffects] = useState<FloatingEffect[]>([]);
  const [draggingItem, setDraggingItem] = useState<{
    item: PlayItem;
    startX: number;
    startY: number;
    clientX: number;
    clientY: number;
    isOverPet: boolean;
  } | null>(null);

  const petBoxRef = useRef<HTMLDivElement | null>(null);
  const moodTimerRef = useRef<number | null>(null);
  const effectIdRef = useRef<number>(1);

  useEffect(() => {
    Object.values(PET_IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    return () => {
      if (moodTimerRef.current !== null) window.clearTimeout(moodTimerRef.current);
    };
  }, []);

  const spawnEffect = useCallback((emoji: string, clientX?: number, clientY?: number) => {
    const box = petBoxRef.current;
    let x = 50;
    let y = 42;

    if (box && clientX !== undefined && clientY !== undefined) {
      const rect = box.getBoundingClientRect();
      x = Math.min(86, Math.max(14, ((clientX - rect.left) / rect.width) * 100));
      y = Math.min(78, Math.max(14, ((clientY - rect.top) / rect.height) * 100));
    } else {
      x = 34 + Math.random() * 32;
      y = 26 + Math.random() * 24;
    }

    const id = effectIdRef.current++;
    setEffects((prev) => [...prev.slice(-8), {id, x, y, emoji}]);
    window.setTimeout(() => {
      setEffects((prev) => prev.filter((item) => item.id !== id));
    }, 950);
  }, []);

  const triggerMood = useCallback((nextMood: 'happy' | 'grumpy') => {
    setMood(nextMood);
    if (moodTimerRef.current !== null) {
      window.clearTimeout(moodTimerRef.current);
    }
    moodTimerRef.current = window.setTimeout(() => {
      setMood('neutral');
      moodTimerRef.current = null;
    }, 1000);
  }, []);

  const handlePetClick = (clientX?: number, clientY?: number) => {
    triggerMood('happy');
    spawnEffect('💗', clientX, clientY);
    spawnEffect('💖', clientX !== undefined ? clientX + 24 : undefined, clientY);
  };

  const handleItemDropOnPet = useCallback(
    (item: PlayItem, clientX?: number, clientY?: number) => {
      triggerMood('grumpy');
      spawnEffect(item.emoji, clientX, clientY);
    },
    [spawnEffect, triggerMood],
  );

  const isPointOverPet = (clientX: number, clientY: number): boolean => {
    const box = petBoxRef.current;
    if (!box) return false;
    const rect = box.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  useEffect(() => {
    if (!draggingItem) return;

    const handlePointerMove = (e: PointerEvent) => {
      const over = isPointOverPet(e.clientX, e.clientY);
      setDraggingItem((prev) =>
        prev ? {...prev, clientX: e.clientX, clientY: e.clientY, isOverPet: over} : null,
      );
    };

    const handlePointerUp = (e: PointerEvent) => {
      const over = isPointOverPet(e.clientX, e.clientY);
      const movedDist = Math.hypot(
        e.clientX - draggingItem.startX,
        e.clientY - draggingItem.startY,
      );
      if (over) {
        handleItemDropOnPet(draggingItem.item, e.clientX, e.clientY);
      } else if (movedDist < 8) {
        handleItemDropOnPet(draggingItem.item);
      }
      setDraggingItem(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggingItem, handleItemDropOnPet]);

  return (
    <section
      aria-label="Мой питомец"
      className="elza-card-shadow max-w-[920px] mx-auto bg-[#FCF3EF] border-2 border-[#9E6B56] rounded-[28px] sm:rounded-[34px] p-4 sm:p-7 lg:p-8"
    >
      {/* Top Row: Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 px-4 h-[42px] rounded-full bg-white hover:bg-[#FAF0EB] border-2 border-[#9E6B56] shadow-[0_0_14px_rgba(148,90,66,0.32)] text-[#6E5148] font-bold text-[15px] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>В каталог</span>
        </button>
      </div>

      {/* Main Layout: Pet Photo Stage + Side Play Items Panel */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-5 lg:gap-7">
        {/* Pet Photo Frame */}
        <div className="w-full max-w-[460px] flex flex-col items-center">
          <div
            ref={petBoxRef}
            onClick={(e) => handlePetClick(e.clientX, e.clientY)}
            role="button"
            tabIndex={0}
            aria-label="Нажмите на питомца, чтобы погладить его"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePetClick();
              }
            }}
            className={`relative w-full aspect-square rounded-[26px] sm:rounded-[30px] overflow-hidden bg-white border-2 select-none cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ECB7C6]/70 ${
              draggingItem?.isOverPet
                ? 'border-[#85523D] ring-4 ring-[#C88E76]/60 shadow-[0_0_28px_rgba(138,77,52,0.58)]'
                : 'border-[#9E6B56] shadow-[0_0_22px_rgba(148,90,66,0.38),0_10px_24px_rgba(110,68,50,0.2)]'
            }`}
          >
            {(['neutral', 'happy', 'grumpy'] as PetMood[]).map((stateKey) => (
              <img
                key={stateKey}
                src={PET_IMAGES[stateKey]}
                alt={
                  stateKey === 'happy'
                    ? 'Довольный единорог в розовом пушистом кресле'
                    : stateKey === 'grumpy'
                      ? 'Недовольный единорог в розовом пушистом кресле'
                      : 'Единорог сидит в розовом пушистом кресле'
                }
                draggable={false}
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-150 ${
                  mood === stateKey ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}

            {effects.map((effect) => (
              <span
                key={effect.id}
                style={{left: `${effect.x}%`, top: `${effect.y}%`}}
                className="animate-elza-heart absolute z-20 text-[28px] sm:text-[34px] pointer-events-none select-none drop-shadow-sm"
              >
                {effect.emoji}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handlePetClick()}
            className="elza-buy-btn mt-4 w-full max-w-[260px] h-[48px] rounded-full text-white font-bold text-[17px] flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 hover:brightness-[1.03] active:scale-[0.97]"
          >
            <Heart className="w-5 h-5 fill-white" />
            <span>Погладить питомца</span>
          </button>
        </div>

        {/* Compact Side Panel with Playful Items */}
        <aside
          aria-label="Панель предметов"
          className="w-full max-w-[460px] md:w-[270px] lg:w-[290px] bg-white/90 border-2 border-[#9E6B56] shadow-[0_0_22px_rgba(148,90,66,0.36),0_10px_24px_rgba(110,68,50,0.18)] rounded-[26px] p-4 sm:p-5 flex flex-col justify-between shrink-0"
        >
          <div>
            <h2 className="text-[18px] sm:text-[19px] font-extrabold text-[#6B4E45] mb-1 text-center md:text-left">
              Предметы
            </h2>
            <p className="text-[13.5px] font-semibold text-[#8A6D64] mb-4 text-center md:text-left leading-snug">
              Перетащите предмет на питомца или нажмите, чтобы бросить
            </p>

            <div className="grid grid-cols-3 md:grid-cols-2 gap-2.5 sm:gap-3">
              {PLAY_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDraggingItem({
                      item,
                      startX: e.clientX,
                      startY: e.clientY,
                      clientX: e.clientX,
                      clientY: e.clientY,
                      isOverPet: isPointOverPet(e.clientX, e.clientY),
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemDropOnPet(item);
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-[18px] bg-[#FCF3EF] hover:bg-[#FADCE0]/65 border border-[#B88672] shadow-[0_0_12px_rgba(148,90,66,0.22)] hover:border-[#85523D] hover:shadow-[0_0_16px_rgba(138,77,52,0.4)] cursor-grab active:cursor-grabbing select-none touch-none transition-all duration-150 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7D5E55]"
                >
                  <span className="text-[28px] sm:text-[32px] leading-none" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="text-[12.5px] sm:text-[13px] font-bold text-[#6B4E45] whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 pt-3 border-t border-[#F0E1DC] text-[12.5px] font-semibold text-[#9A7E75] text-center">
            Нажмите на самого единорога, чтобы его погладить ♡
          </p>
        </aside>
      </div>

      {draggingItem && (
        <div
          style={{
            left: draggingItem.clientX,
            top: draggingItem.clientY,
          }}
          className="fixed z-50 -translate-x-1/2 -translate-y-1/2 text-[42px] pointer-events-none select-none drop-shadow-[0_6px_12px_rgba(100,60,70,0.3)] scale-110"
        >
          {draggingItem.item.emoji}
        </div>
      )}
    </section>
  );
};
