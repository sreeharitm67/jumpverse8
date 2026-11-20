import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import type { GameSettings, HudState, RunSnapshot } from '../game/types';

interface GameCanvasProps {
  settings: GameSettings;
  onEngineReady: (engine: GameEngine) => void;
  onHudUpdate: (hud: HudState) => void;
  onLevelComplete: (snapshot: RunSnapshot) => void;
  onGameOver: (snapshot: RunSnapshot) => void;
}

export function GameCanvas({
  settings,
  onEngineReady,
  onHudUpdate,
  onLevelComplete,
  onGameOver,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const callbacksRef = useRef({ onHudUpdate, onLevelComplete, onGameOver });
  callbacksRef.current = { onHudUpdate, onLevelComplete, onGameOver };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new GameEngine(canvas, settings, {
      onHudUpdate: (h) => callbacksRef.current.onHudUpdate(h),
      onLevelComplete: (s) => callbacksRef.current.onLevelComplete(s),
      onGameOver: (s) => callbacksRef.current.onGameOver(s),
    });

    const rect = container.getBoundingClientRect();
    engine.resize(rect.width, rect.height);
    engine.startLoop();
    engineRef.current = engine;
    onEngineReady(engine);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        engine.resize(width, height);
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // Mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.updateSettings(settings);
  }, [settings]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden bg-[#071226]">
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="block h-full w-full touch-none outline-none"
        tabIndex={0}
      />
    </div>
  );
}
