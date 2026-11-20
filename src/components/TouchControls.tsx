import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles, Sword } from 'lucide-react';
import type { GameEngine } from '../game/GameEngine';
import type { GameSettings } from '../game/types';

interface TouchControlsProps {
  engine: GameEngine | null;
  settings: GameSettings;
}

export function TouchControls({ engine, settings }: TouchControlsProps) {
  const [touchCapable, setTouchCapable] = useState(false);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [activeButtons, setActiveButtons] = useState({ jump: false, attack: false, special: false });

  const joyPointerIdRef = useRef<number | null>(null);
  const joyOriginRef = useRef({ x: 0, y: 0 });
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const jumpPointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const checkTouch = () => {
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
      setTouchCapable(coarse || hasTouch || window.innerWidth < 920);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (!touchCapable && !settings.alwaysShowTouch) {
    return null;
  }

  const joyRadius = Math.round(52 * settings.joystickSize);
  const btnPx = Math.round(62 * settings.buttonSize);
  const opacityStyle = settings.buttonOpacity;
  const edgeOffset =
    settings.controlLayout === 'compact'
      ? 'p-3 sm:p-4'
      : settings.controlLayout === 'wide'
        ? 'p-5 sm:p-7'
        : 'p-4 sm:p-5';

  const handleJoyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    joyPointerIdRef.current = e.pointerId;
    const rect = e.currentTarget.getBoundingClientRect();
    joyOriginRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updateJoy(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    updateJoy(e.clientX, e.clientY);
  };

  const handleJoyUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    joyPointerIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    engine?.input.setTouchJoystick(0);
  };

  const updateJoy = (clientX: number, clientY: number) => {
    const dx = clientX - joyOriginRef.current.x;
    const dy = clientY - joyOriginRef.current.y;
    const maxR = joyRadius * 0.8;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(maxR, dist);
    const ang = Math.atan2(dy, dx);
    const nx = dist > 0 ? Math.cos(ang) * clampedDist : 0;
    const ny = dist > 0 ? Math.sin(ang) * clampedDist : 0;
    setKnobOffset({ x: nx, y: ny });
    const normX = Math.max(-1, Math.min(1, nx / maxR));
    engine?.input.setTouchJoystick(Math.abs(normX) < 0.14 ? 0 : normX);
  };

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-25 flex items-end justify-between ${edgeOffset}`}
      style={{ opacity: opacityStyle }}
      data-testid="touch-controls"
    >
      {/* Left: Virtual Analog Joystick */}
      <div
        ref={joyBaseRef}
        role="slider"
        aria-label="Movement joystick"
        aria-valuetext="Analog movement"
        onPointerDown={handleJoyDown}
        onPointerMove={handleJoyMove}
        onPointerUp={handleJoyUp}
        onPointerCancel={handleJoyUp}
        style={{ width: joyRadius * 2, height: joyRadius * 2 }}
        className="pointer-events-auto relative flex items-center justify-center rounded-full border-2 border-sky-300/50 bg-[#07152e]/65 shadow-xl touch-none"
      >
        <div
          className="pointer-events-none absolute inset-2 rounded-full border border-white/15"
          aria-hidden="true"
        />
        <div
          style={{
            width: Math.round(joyRadius * 0.85),
            height: Math.round(joyRadius * 0.85),
            transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
          }}
          className="pointer-events-none rounded-full border-2 border-white/70 bg-gradient-to-b from-sky-400 to-blue-600 shadow-lg"
        />
      </div>

      {/* Right: 3 Action Buttons (SPECIAL, ATTACK, JUMP) */}
      <div className="pointer-events-auto flex items-end gap-2.5 sm:gap-3.5 touch-none">
        <button
          type="button"
          aria-label="Special ability"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setActiveButtons((s) => ({ ...s, special: true }));
            engine?.input.triggerTouchSpecial();
          }}
          onPointerUp={() => setActiveButtons((s) => ({ ...s, special: false }))}
          onPointerCancel={() => setActiveButtons((s) => ({ ...s, special: false }))}
          style={{ width: Math.round(btnPx * 0.86), height: Math.round(btnPx * 0.86) }}
          className={`flex flex-col items-center justify-center rounded-full border-2 border-amber-300/70 bg-amber-600/80 text-white shadow-lg transition-transform ${
            activeButtons.special ? 'scale-90 brightness-125' : ''
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-wider">SPEC</span>
        </button>

        <button
          type="button"
          aria-label="Attack"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setActiveButtons((s) => ({ ...s, attack: true }));
            engine?.input.triggerTouchAttack();
          }}
          onPointerUp={() => setActiveButtons((s) => ({ ...s, attack: false }))}
          onPointerCancel={() => setActiveButtons((s) => ({ ...s, attack: false }))}
          style={{ width: Math.round(btnPx * 0.94), height: Math.round(btnPx * 0.94) }}
          className={`flex flex-col items-center justify-center rounded-full border-2 border-rose-300/70 bg-rose-600/85 text-white shadow-lg transition-transform ${
            activeButtons.attack ? 'scale-90 brightness-125' : ''
          }`}
        >
          <Sword className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-wider">ATK</span>
        </button>

        <button
          type="button"
          aria-label="Jump"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            jumpPointerIdRef.current = e.pointerId;
            setActiveButtons((s) => ({ ...s, jump: true }));
            engine?.input.setTouchJump(true);
          }}
          onPointerUp={(e) => {
            if (jumpPointerIdRef.current === e.pointerId) {
              jumpPointerIdRef.current = null;
              setActiveButtons((s) => ({ ...s, jump: false }));
              engine?.input.setTouchJump(false);
            }
          }}
          onPointerCancel={(e) => {
            if (jumpPointerIdRef.current === e.pointerId) {
              jumpPointerIdRef.current = null;
              setActiveButtons((s) => ({ ...s, jump: false }));
              engine?.input.setTouchJump(false);
            }
          }}
          style={{ width: Math.round(btnPx * 1.12), height: Math.round(btnPx * 1.12) }}
          className={`flex flex-col items-center justify-center rounded-full border-2 border-emerald-200/80 bg-emerald-500/85 text-white shadow-xl transition-transform ${
            activeButtons.jump ? 'scale-90 brightness-125' : ''
          }`}
        >
          <ArrowUp className="h-6 w-6" />
          <span className="text-[10px] font-bold tracking-wider">JUMP</span>
        </button>
      </div>
    </div>
  );
}
