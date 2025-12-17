import { LeaderboardEntry } from './Leaderboard';

export interface SafeResult {
    isBad: boolean;
    prize: number;
}

class MockService {
    private badSafeIndex: number = -1;
    private safeCount: number = 0;
    private currentRound: number = 1;
    private userNames: Record<string, string> = {};
    
    // Initial mock data
    private leaderboard: LeaderboardEntry[] = [
        { name: 'Player 1', score: 1000 },
        { name: 'Player 2', score: 900 },
        { name: 'Player 3', score: 800 },
    ];

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Initializes the level on the "server".
     * Determines which safe is the bad one.
     */
    async initLevel(safeCount: number, round: number = 1): Promise<void> {
        console.log(`[MockServer] Request: Init Level with ${safeCount} safes, Round ${round}`);
        await this.delay(300); // Small delay for setup
        this.safeCount = safeCount;
        this.currentRound = round;
        this.badSafeIndex = Math.floor(Math.random() * safeCount);
        console.log(`[MockServer] Response: Level initialized. Bad safe is index ${this.badSafeIndex}.`);
    }

    public getPrize(numSafes: number, round: number): number {
        const prizes = [0.33, 0.22, 0.16, 0.13, 0.11];
        return prizes[numSafes - 3] * (1 + (round - 1) * 0.55);
    }

    /**
     * Checks if the clicked safe is bad.
     */
    async checkSafe(safeIndex: number): Promise<SafeResult> {
        console.log(`[MockServer] Request: Check safe ${safeIndex}`);
        await this.delay(600); // Simulate network latency

        const isBad = safeIndex === this.badSafeIndex;   
        const prize = this.getPrize(this.safeCount, this.currentRound);

        console.log(`[MockServer] Response: Safe ${safeIndex} is ${isBad ? 'BAD' : 'GOOD'}. Prize: ${prize}`);
        return {
            isBad,
            prize
        };
    }

    /**
     * Fetches the leaderboard data.
     */
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        console.log(`[MockServer] Request: Get Leaderboard`);
        await this.delay(500);
        console.log(`[MockServer] Response: Sending ${this.leaderboard.length} leaderboard entries`);
        return [...this.leaderboard];
    }

    /**
     * Submits a new score and returns the updated leaderboard.
     */
    async submitScore(name: string, score: number): Promise<LeaderboardEntry[]> {
        console.log(`[MockServer] Request: Submit Score (${name}: ${score})`);
        await this.delay(800);

        this.leaderboard.push({ name, score });
        this.leaderboard.sort((a, b) => b.score - a.score);
        if (this.leaderboard.length > 10) {
            this.leaderboard = this.leaderboard.slice(0, 10);
        }

        console.log(`[MockServer] Response: Score submitted. New leaderboard size: ${this.leaderboard.length}`);
        return [...this.leaderboard];
    }

    /**
     * Adds tokens to the user's wallet.
     */
    async addTokens(amount: number): Promise<boolean> {
        console.log(`[MockServer] Request: Add ${amount} tokens`);
        await this.delay(400); // Simulate network latency
        console.log(`[MockServer] Response: Added ${amount} tokens`);
        return true;
    }

    /**
     * Fetches the user profile (balance, etc.) given a wallet address.
     */
    async getUserProfile(walletAddress: string): Promise<{ balance: number; lastLogin: number; name?: string }> {
        console.log(`[MockServer] Request: Get User Profile for ${walletAddress}`);
        await this.delay(700);
        
        // Mock data: generating a random balance for variety, or static
        const balance = Math.floor(Math.random() * 100); 
        const name = this.userNames[walletAddress];
        
        console.log(`[MockServer] Response: User ${walletAddress} has ${balance} tokens. Name: ${name || 'N/A'}`);
        return {
            balance,
            lastLogin: Date.now(),
            name
        };
    }

    /**
     * Sets the user name for a given wallet address.
     */
    async setUserName(walletAddress: string, name: string): Promise<boolean> {
        console.log(`[MockServer] Request: Set Name for ${walletAddress} to ${name}`);
        await this.delay(500);
        this.userNames[walletAddress] = name;
        console.log(`[MockServer] Response: Name set.`);
        return true;
    }
}

export const mockService = new MockService();

