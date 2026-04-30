export const TILE_SIZE = 32;
export const ROWS = 8;
export const COLS = 5;

export const GAME_STATE = {
  PLAYING: "PLAYING",
  THROWING: "THROWING",
  GAME_OVER: "GAME_OVER",
  COMPLETED: "COMPLETED",
  LEVEL_COMPLETE: "LEVEL_COMPLETE"
};

// Generate level configurations dynamically up to level 100
export const LEVEL_CONFIG = {};
const MAX_LEVEL = 100;

// Base values for level 1
const BASE_WATCHING_MIN = 1000;
const BASE_WATCHING_MAX = 5000;
const BASE_NOT_WATCHING_MIN = 800;
const BASE_NOT_WATCHING_MAX = 4000;
const BASE_WARNING_MIN = 500;
const BASE_WARNING_MAX = 2000;

// Minimum values (for highest levels)
const MIN_WATCHING_MIN = 200;
const MIN_WATCHING_MAX = 800;
const MIN_NOT_WATCHING_MIN = 150;
const MIN_NOT_WATCHING_MAX = 600;
const MIN_WARNING_MIN = 100;
const MIN_WARNING_MAX = 400;

for (let level = 1; level <= MAX_LEVEL; level++) {
  // Calculate progress ratio (0 for level 1, 1 for level 100)
  const progress = (level - 1) / (MAX_LEVEL - 1);
  
  // Interpolate between base and minimum values
  LEVEL_CONFIG[level] = {
    watchingMin: Math.round(BASE_WATCHING_MIN + (MIN_WATCHING_MIN - BASE_WATCHING_MIN) * progress),
    watchingMax: Math.round(BASE_WATCHING_MAX + (MIN_WATCHING_MAX - BASE_WATCHING_MAX) * progress),
    notWatchingMin: Math.round(BASE_NOT_WATCHING_MIN + (MIN_NOT_WATCHING_MIN - BASE_NOT_WATCHING_MIN) * progress),
    notWatchingMax: Math.round(BASE_NOT_WATCHING_MAX + (MIN_NOT_WATCHING_MAX - BASE_NOT_WATCHING_MAX) * progress),
    warningMin: Math.round(BASE_WARNING_MIN + (MIN_WARNING_MIN - BASE_WARNING_MIN) * progress),
    warningMax: Math.round(BASE_WARNING_MAX + (MIN_WARNING_MAX - BASE_WARNING_MAX) * progress)
  };
}
