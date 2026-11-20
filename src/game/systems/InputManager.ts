import { DEFAULT_KEY_BINDINGS } from '../config';
import type { InputState, KeyBindings } from '../types';

export interface SystemShortcuts {
  onPauseToggle: () => void;
  onRestart: () => void;
  onFullscreenToggle: () => void;
}

export class InputManager {
  private keysHeld = new Set<string>();
  private keyJustPressed = new Set<string>();
  private touchMoveX = 0;
  private touchJumpHeld = false;
  private touchJumpJustPressed = false;
  private touchAttackJustPressed = false;
  private touchSpecialJustPressed = false;
  private bindings: KeyBindings = { ...DEFAULT_KEY_BINDINGS };
  private shortcuts: SystemShortcuts | null = null;
  private isListening = false;
  private remappingActive = false;

  public setBindings(bindings: KeyBindings): void {
    this.bindings = { ...bindings };
  }

  public setRemapping(active: boolean): void {
    this.remappingActive = active;
    if (active) this.clearAll();
  }

  public attach(shortcuts: SystemShortcuts): () => void {
    this.shortcuts = shortcuts;
    if (this.isListening) return () => {};
    this.isListening = true;

    const onKeyDown = (e: KeyboardEvent) => {
      if (this.remappingActive) return;
      const code = e.code;

      // Prevent unwanted browser scrolling on game keys
      if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        if (document.body.dataset.state === 'playing' || document.body.dataset.state === 'paused') {
          e.preventDefault();
        }
      }

      if (!e.repeat) {
        if (code === this.bindings.pause || code === 'KeyP') {
          this.shortcuts?.onPauseToggle();
          return;
        }
        if (code === this.bindings.restart && document.body.dataset.state === 'playing') {
          this.shortcuts?.onRestart();
          return;
        }
        if (code === this.bindings.fullscreen) {
          this.shortcuts?.onFullscreenToggle();
          return;
        }
        if (!this.keysHeld.has(code)) {
          this.keyJustPressed.add(code);
        }
      }
      this.keysHeld.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysHeld.delete(e.code);
    };

    const onBlur = () => {
      this.clearAll();
    };

    const onVisibility = () => {
      if (document.hidden) this.clearAll();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      this.isListening = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }

  public clearAll(): void {
    this.keysHeld.clear();
    this.keyJustPressed.clear();
    this.touchMoveX = 0;
    this.touchJumpHeld = false;
    this.touchJumpJustPressed = false;
    this.touchAttackJustPressed = false;
    this.touchSpecialJustPressed = false;
  }

  public setTouchJoystick(x: number): void {
    this.touchMoveX = Math.max(-1, Math.min(1, x));
  }

  public setTouchJump(held: boolean): void {
    if (held && !this.touchJumpHeld) {
      this.touchJumpJustPressed = true;
    }
    this.touchJumpHeld = held;
  }

  public triggerTouchAttack(): void {
    this.touchAttackJustPressed = true;
  }

  public triggerTouchSpecial(): void {
    this.touchSpecialJustPressed = true;
  }

  public consumeFrameInput(): InputState {
    const b = this.bindings;
    const leftHeld = this.keysHeld.has(b.left) || this.keysHeld.has(b.leftAlt);
    const rightHeld = this.keysHeld.has(b.right) || this.keysHeld.has(b.rightAlt);
    let moveX = (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0);
    if (Math.abs(this.touchMoveX) > Math.abs(moveX)) {
      moveX = this.touchMoveX;
    }

    const jumpHeld =
      this.keysHeld.has(b.jump) ||
      this.keysHeld.has(b.jumpAlt) ||
      this.keysHeld.has(b.jumpAlt2) ||
      this.touchJumpHeld;

    const jumpJustPressed =
      this.keyJustPressed.has(b.jump) ||
      this.keyJustPressed.has(b.jumpAlt) ||
      this.keyJustPressed.has(b.jumpAlt2) ||
      this.touchJumpJustPressed;

    const attackJustPressed = this.keyJustPressed.has(b.attack) || this.touchAttackJustPressed;
    const specialJustPressed = this.keyJustPressed.has(b.special) || this.touchSpecialJustPressed;

    this.keyJustPressed.clear();
    this.touchJumpJustPressed = false;
    this.touchAttackJustPressed = false;
    this.touchSpecialJustPressed = false;

    return {
      moveX,
      jumpHeld,
      jumpJustPressed,
      attackJustPressed,
      specialJustPressed,
    };
  }
}

export function formatKeyCode(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'ArrowLeft') return 'Left Arrow';
  if (code === 'ArrowRight') return 'Right Arrow';
  if (code === 'ArrowUp') return 'Up Arrow';
  if (code === 'ArrowDown') return 'Down Arrow';
  if (code === 'Space') return 'Space';
  if (code === 'Escape') return 'Esc';
  return code;
}
