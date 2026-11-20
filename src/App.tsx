import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameOverModal, LevelCompleteModal, PauseModal } from './components/GameModals';
import { HUD } from './components/HUD';
import { AchievementToast, CreditsModal, HowToPlayModal, LoadingOverlay } from './components/InfoModals';
import { LevelSelect } from './components/LevelSelect';
import { MainMenu } from './components/MainMenu';
import { SettingsModal } from './components/SettingsModal';
import { TouchControls } from './components/TouchControls';
import { WorldSelect } from './components/WorldSelect';
import { GameEngine } from './game/GameEngine';
import { ACHIEVEMENTS, WORLDS } from './game/config';
import { loadSave, persistSave, recordLevelCompletion, resetSaveProgress } from './game/systems/SaveManager';
import type { GameScreen, GameSettings, HudState, RunSnapshot, SaveData } from './game/types';

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1';

  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<GameScreen>(isAutostart ? 'playing' : 'loading');
  const [selectedWorld, setSelectedWorld] = useState<number>(save.lastWorld);
  const [activeStage, setActiveStage] = useState<{ world: number; level: number }>({
    world: save.lastWorld,
    level: save.lastLevel,
  });
  const [hud, setHud] = useState<HudState | null>(null);
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [toastTitle, setToastTitle] = useState<string | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const screenRef = useRef<GameScreen>(screen);
  screenRef.current = screen;
  const activeStageRef = useRef(activeStage);
  activeStageRef.current = activeStage;
  const autostartDoneRef = useRef(false);

  // Sync document.body.dataset.state for deterministic game state tracking
  useEffect(() => {
    if (screen === 'playing') {
      document.body.dataset.state = 'playing';
    } else if (screen === 'paused') {
      document.body.dataset.state = 'paused';
    } else if (screen === 'gameOver' || screen === 'levelComplete') {
      document.body.dataset.state = 'gameover';
    } else {
      document.body.dataset.state = 'title';
    }
  }, [screen]);

  // Brief boot loading screen unless ?autostart=1
  useEffect(() => {
    if (screen !== 'loading') return;
    const t = window.setTimeout(() => {
      setScreen('menu');
    }, 450);
    return () => window.clearTimeout(t);
  }, [screen]);

  const showAchievementToast = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const first = ACHIEVEMENTS.find((a) => a.id === ids[0]);
    if (!first) return;
    setToastTitle(first.title);
    window.setTimeout(() => setToastTitle(null), 3200);
  }, []);

  const launchLevel = useCallback((world: number, level: number) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const eng = engineRef.current;
    if (!eng) return;
    setActiveStage({ world, level });
    setSnapshot(null);
    setShowSettings(false);
    setShowHowToPlay(false);
    setShowCredits(false);
    setScreen('playing');
    eng.startLevel(world, level);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const handleEngineReady = useCallback(
    (eng: GameEngine) => {
      engineRef.current = eng;
      eng.input.attach({
        onPauseToggle: () => {
          if (screenRef.current === 'playing') {
            eng.setPaused(true);
            setScreen('paused');
          } else if (screenRef.current === 'paused') {
            eng.setPaused(false);
            setShowSettings(false);
            setScreen('playing');
          }
        },
        onRestart: () => {
          if (screenRef.current === 'playing' || screenRef.current === 'paused') {
            const st = activeStageRef.current;
            launchLevel(st.world, st.level);
          }
        },
        onFullscreenToggle: toggleFullscreen,
      });

      if (isAutostart && !autostartDoneRef.current) {
        autostartDoneRef.current = true;
        launchLevel(1, 1);
      }
    },
    [isAutostart, launchLevel, toggleFullscreen]
  );

  // Enter / Space starts from Main Menu
  useEffect(() => {
    if (screen !== 'menu' || showSettings || showHowToPlay || showCredits) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        launchLevel(1, 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [launchLevel, screen, showCredits, showHowToPlay, showSettings]);

  const handleLevelComplete = useCallback(
    (snap: RunSnapshot) => {
      const result = recordLevelCompletion(save, {
        world: snap.world,
        level: snap.level,
        score: snap.score,
        coins: snap.coins,
        gems: snap.gems,
        stars: snap.stars,
        bossDefeated: snap.bossDefeated,
      });
      setSave(result.nextSave);
      showAchievementToast(result.newlyUnlockedAchievements);
      setSnapshot({
        ...snap,
        nextUnlocked: result.nextLevel,
      });
      setScreen('levelComplete');
    },
    [save, showAchievementToast]
  );

  const handleGameOver = useCallback((snap: RunSnapshot) => {
    setSnapshot(snap);
    setScreen('gameOver');
  }, []);

  const updateSettings = useCallback(
    (nextSettings: GameSettings) => {
      const nextSave: SaveData = { ...save, settings: nextSettings };
      setSave(nextSave);
      persistSave(nextSave);
    },
    [save]
  );

  const handleResetProgress = useCallback(() => {
    const fresh = resetSaveProgress(true);
    setSave(fresh);
    setSelectedWorld(1);
    setActiveStage({ world: 1, level: 1 });
  }, []);

  const handleGoMainMenu = useCallback(() => {
    setShowSettings(false);
    setScreen('menu');
    const worldTheme = WORLDS[0].theme;
    engineRef.current?.loadAttract(worldTheme);
  }, []);

  return (
    <main className="relative h-full w-full overflow-hidden select-none">
      <GameCanvas
        settings={save.settings}
        onEngineReady={handleEngineReady}
        onHudUpdate={setHud}
        onLevelComplete={handleLevelComplete}
        onGameOver={handleGameOver}
      />

      {screen === 'loading' && <LoadingOverlay />}

      {screen === 'menu' && (
        <MainMenu
          save={save}
          onPlay={() => {
            engineRef.current?.audio.playClick();
            launchLevel(1, 1);
          }}
          onContinue={() => {
            engineRef.current?.audio.playClick();
            launchLevel(save.lastWorld, save.lastLevel);
          }}
          onWorldSelect={() => {
            engineRef.current?.audio.playClick();
            setScreen('worldSelect');
          }}
          onSettings={() => {
            engineRef.current?.audio.playClick();
            setShowSettings(true);
          }}
          onHowToPlay={() => {
            engineRef.current?.audio.playClick();
            setShowHowToPlay(true);
          }}
          onCredits={() => {
            engineRef.current?.audio.playClick();
            setShowCredits(true);
          }}
        />
      )}

      {screen === 'worldSelect' && (
        <WorldSelect
          save={save}
          onSelectWorld={(wId) => {
            engineRef.current?.audio.playClick();
            setSelectedWorld(wId);
            const wInfo = WORLDS.find((w) => w.id === wId);
            if (wInfo) engineRef.current?.loadAttract(wInfo.theme);
            setScreen('levelSelect');
          }}
          onBack={handleGoMainMenu}
        />
      )}

      {screen === 'levelSelect' && (
        <LevelSelect
          worldId={selectedWorld}
          save={save}
          onSelectLevel={(w, l) => {
            engineRef.current?.audio.playClick();
            launchLevel(w, l);
          }}
          onBack={() => {
            engineRef.current?.audio.playClick();
            setScreen('worldSelect');
          }}
        />
      )}

      {(screen === 'playing' || screen === 'paused') && (
        <HUD
          hud={hud}
          muted={save.settings.muted}
          onPause={() => {
            engineRef.current?.audio.playClick();
            engineRef.current?.setPaused(true);
            setScreen('paused');
          }}
          onRestart={() => {
            engineRef.current?.audio.playClick();
            launchLevel(activeStage.world, activeStage.level);
          }}
          onToggleMute={() => {
            updateSettings({ ...save.settings, muted: !save.settings.muted });
          }}
          onSkipTutorial={() => {
            updateSettings({ ...save.settings, showTutorial: false });
          }}
        />
      )}

      {screen === 'playing' && <TouchControls engine={engineRef.current} settings={save.settings} />}

      {screen === 'paused' && !showSettings && (
        <PauseModal
          onResume={() => {
            engineRef.current?.audio.playClick();
            engineRef.current?.setPaused(false);
            setScreen('playing');
          }}
          onRestart={() => {
            engineRef.current?.audio.playClick();
            launchLevel(activeStage.world, activeStage.level);
          }}
          onSettings={() => {
            engineRef.current?.audio.playClick();
            setShowSettings(true);
          }}
          onMainMenu={() => {
            engineRef.current?.audio.playClick();
            handleGoMainMenu();
          }}
        />
      )}

      {screen === 'levelComplete' && snapshot && (
        <LevelCompleteModal
          snapshot={snapshot}
          onNextLevel={() => {
            engineRef.current?.audio.playClick();
            if (snapshot.nextUnlocked) {
              launchLevel(snapshot.nextUnlocked.world, snapshot.nextUnlocked.level);
            }
          }}
          onReplay={() => {
            engineRef.current?.audio.playClick();
            launchLevel(snapshot.world, snapshot.level);
          }}
          onWorldSelect={() => {
            engineRef.current?.audio.playClick();
            engineRef.current?.loadAttract('meadows');
            setScreen('worldSelect');
          }}
        />
      )}

      {screen === 'gameOver' && snapshot && (
        <GameOverModal
          snapshot={snapshot}
          onRetry={() => {
            engineRef.current?.audio.playClick();
            launchLevel(snapshot.world, snapshot.level);
          }}
          onMainMenu={() => {
            engineRef.current?.audio.playClick();
            handleGoMainMenu();
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={save.settings}
          onUpdate={updateSettings}
          onResetProgress={handleResetProgress}
          onToggleFullscreen={toggleFullscreen}
          onRemappingChange={(active) => engineRef.current?.input.setRemapping(active)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      {showCredits && <CreditsModal save={save} onClose={() => setShowCredits(false)} />}
      <AchievementToast title={toastTitle} />
    </main>
  );
}
