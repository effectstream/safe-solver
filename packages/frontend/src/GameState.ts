import { Safe } from './Safe';

export const state = {
    score: 0,
    level: 1,
    tokens: 0, // Deprecated but kept for type compat if needed for now
    isPlaying: false,
    isDemo: false,
    isProcessing: false,
    safes: [] as Safe[],
    hoveredSafe: null as Safe | null,
    levelStartTime: 0
};

export function resetState() {
    state.isProcessing = false;
    state.score = 0; // Starts at 0
    state.level = 1;
    state.safes = [];
    state.hoveredSafe = null;
    state.levelStartTime = 0;
}

export function setScore(newScore: number) {
    state.score = newScore;
}
