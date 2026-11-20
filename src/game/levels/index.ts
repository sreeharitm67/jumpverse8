import type { LevelData } from '../types';
import { resetBuilderIds } from './builder';
import { buildWorld1Levels } from './world1';
import { buildWorld2Levels } from './world2';
import { buildWorld3Levels } from './world3';
import { buildWorld4Levels } from './world4';
import { buildWorld5Levels } from './world5';

let cachedLevels: LevelData[] | null = null;

export function getAllLevels(): LevelData[] {
  if (!cachedLevels) {
    resetBuilderIds();
    cachedLevels = [
      ...buildWorld1Levels(),
      ...buildWorld2Levels(),
      ...buildWorld3Levels(),
      ...buildWorld4Levels(),
      ...buildWorld5Levels(),
    ];
  }
  return cachedLevels;
}

export function getLevel(world: number, level: number): LevelData {
  const all = getAllLevels();
  const found = all.find((l) => l.world === world && l.level === level);
  return found ?? all[0];
}

export function getWorldLevels(world: number): LevelData[] {
  return getAllLevels().filter((l) => l.world === world);
}
