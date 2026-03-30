import { useEffect, useState, useMemo } from "react";
import { playCoinSound, playVoucherSound, playRaffleWinSound } from "@/lib/sounds";
import { hapticSuccess, hapticCelebration } from "@/lib/haptics";

type CelebrationType = "post-created" | "voucher-earned" | "raffle-win";

interface CelebrationOverlayProps {
  type: CelebrationType;
  message: string;
  subMessage?: string;
  onComplete: () => void;
}

const CONFETTI_COLORS = [
  "#6366f1", // indigo (primary)
  "#a855f7", // purple
  "#f59e0b", // amber
  "#22c55e", // green
  "#ec4899", // pink
  "#3b82f6", // blue
  "#f97316", // orange
];

const MOTIVATIONAL_MESSAGES = [
  "Mandou bem!",
  "Arrasou!",
  "Rumo ao topo!",
  "Mais um pro ranking!",
  "Continue assim!",
  "Show!",
  "Boa!",
];

const CONFIG: Record<CelebrationType, { particles: number; duration: number; sound: () => void; haptic: () => void }> = {
  "post-created": { particles: 35, duration: 2500, sound: playCoinSound, haptic: hapticSuccess },
  "voucher-earned": { particles: 50, duration: 3500, sound: playVoucherSound, haptic: hapticCelebration },
  "raffle-win": { particles: 70, duration: 4500, sound: playRaffleWinSound, haptic: hapticCelebration },
};

function randomBetween(a: number, b: number) { return a + Math.random() * (b - a); }

export function CelebrationOverlay({ type, message, subMessage, onComplete }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  const config = CONFIG[type];

  const particles = useMemo(() =>
    Array.from({ length: config.particles }, (_, i) => ({
      id: i,
      left: `${randomBetween(2, 98)}%`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: randomBetween(6, 14),
      delay: `${randomBetween(0, 0.6)}s`,
      duration: `${randomBetween(1.8, 3.2)}s`,
      rotation: Math.random() > 0.5 ? "rotate(45deg)" : "rotate(0deg)",
      shape: Math.random() > 0.6 ? "rounded-full" : Math.random() > 0.3 ? "rounded-sm" : "",
    })),
  [config.particles]);

  useEffect(() => {
    // Play sound + haptic
    config.sound();
    config.haptic();

    // Show message after a small delay
    const msgTimer = setTimeout(() => setShowMessage(true), 200);

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, config.duration);

    return () => { clearTimeout(msgTimer); clearTimeout(dismissTimer); };
  }, []);

  if (!visible) return null;

  const motivational = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute animate-confetti-fall ${p.shape}`}
          style={{
            left: p.left,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            "--confetti-duration": p.duration,
            transform: p.rotation,
            opacity: 0.9,
          } as React.CSSProperties}
        />
      ))}

      {/* Sparkles for voucher/raffle */}
      {type !== "post-created" && Array.from({ length: 8 }, (_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute animate-sparkle-pop text-2xl"
          style={{
            left: `${randomBetween(15, 85)}%`,
            top: `${randomBetween(15, 60)}%`,
            animationDelay: `${randomBetween(0.2, 1.2)}s`,
          }}
        >
          ✨
        </div>
      ))}

      {/* Center message */}
      {showMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" onClick={onComplete}>
          <div className="animate-bounce-in text-center px-6">
            <p className="text-3xl md:text-4xl font-black gradient-text mb-2 drop-shadow-lg">
              {message || motivational}
            </p>
            {subMessage && (
              <p className="text-sm md:text-base text-foreground/80 font-medium animate-fade-in">
                {subMessage}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              Toque para continuar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
