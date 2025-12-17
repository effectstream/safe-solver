import { Safe } from './Safe';

export const state = {
    score: 1.0,
    level: 1,
    tokens: 0,
    isPlaying: false,
    isDemo: false,
    isProcessing: false,
    safes: [] as Safe[],
    hoveredSafe: null as Safe | null,
    levelStartTime: 0
};

export function resetState() {
    state.isProcessing = false;
    state.score = 1.0;
    state.level = 1;
    state.safes = [];
    state.hoveredSafe = null;
    state.levelStartTime = 0;
}

export function setScore(newScore: number) {
    state.score = newScore;
}

export function removeTokens(amount: number): boolean {
    if (state.tokens >= amount) {
        state.tokens -= amount;
        return true;
    }
    return false;
}

export function addTokens(amount: number) {
    state.tokens += amount;
}
