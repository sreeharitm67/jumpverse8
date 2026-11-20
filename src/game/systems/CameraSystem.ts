export class CameraSystem {
  public x = 0;
  public y = 0;
  public shakeTrauma = 0;
  private lookAhead = 0;

  public reset(targetX: number, targetY: number, viewW: number, viewH: number, levelW: number, levelH: number): void {
    this.lookAhead = 0;
    this.shakeTrauma = 0;
    this.x = Math.max(0, Math.min(levelW - viewW, targetX - viewW * 0.36));
    this.y = Math.max(0, Math.min(levelH - viewH, targetY - viewH * 0.55));
  }

  public addTrauma(amount: number): void {
    this.shakeTrauma = Math.min(1, this.shakeTrauma + amount);
  }

  public update(
    targetX: number,
    targetY: number,
    facing: 1 | -1,
    viewW: number,
    viewH: number,
    levelW: number,
    levelH: number,
    dt: number,
    shakeEnabled: boolean
  ): { offsetX: number; offsetY: number } {
    const desiredLook = facing * Math.min(110, viewW * 0.11);
    const lookLerp = 1 - Math.exp(-3.5 * dt);
    this.lookAhead += (desiredLook - this.lookAhead) * lookLerp;

    const idealX = targetX + this.lookAhead - viewW * 0.42;
    const idealY = targetY - viewH * 0.56;

    const clampedX = Math.max(0, Math.min(Math.max(0, levelW - viewW), idealX));
    const clampedY = Math.max(0, Math.min(Math.max(0, levelH - viewH), idealY));

    const smoothX = 1 - Math.exp(-8.5 * dt);
    const smoothY = 1 - Math.exp(-6.0 * dt);

    this.x += (clampedX - this.x) * smoothX;
    this.y += (clampedY - this.y) * smoothY;

    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.2);
    if (!shakeEnabled || this.shakeTrauma <= 0.001) {
      return { offsetX: 0, offsetY: 0 };
    }

    const mag = this.shakeTrauma * this.shakeTrauma * 14;
    return {
      offsetX: (Math.random() * 2 - 1) * mag,
      offsetY: (Math.random() * 2 - 1) * mag,
    };
  }
}
