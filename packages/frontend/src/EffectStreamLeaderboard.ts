import { effectStreamService } from './EffectStreamService';
import { getLocalWallet, getMidnightAddress, getConnectedWallet } from './EffectStreamWallet';

export interface LeaderboardEntry {
    name: string;
    score: number;
    address?: string;
}

class Leaderboard {
    private entries: LeaderboardEntry[] = [];
    private isLoading: boolean = true;

    constructor() {
        // Initial load
        this.fetchData();

        // Setup refresh button
        const refreshBtn = document.getElementById('btn-refresh-leaderboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.fetchData();
            });
        }
    }

    private getCurrentUserAddress(): string | null {
        return getMidnightAddress()
            || getConnectedWallet()?.walletAddress
            || getLocalWallet()?.walletAddress
            || null;
    }

    async fetchData() {
        this.isLoading = true;
        this.render();
        try {
            this.entries = await effectStreamService.getLeaderboard();
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    async addScore(accountId: number) {
        try {
            this.entries = await effectStreamService.submitScore(accountId);
            this.render();
        } catch (error) {
            console.error("Failed to submit score", error);
        }
    }

    render() {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;

        list.innerHTML = '';
        if (this.isLoading) {
            list.innerHTML = '<li>Loading...</li>';
            return;
        }

        if (this.entries.length === 0) {
            list.innerHTML = '<li>No players found</li>';
            return;
        }

        const myAddress = this.getCurrentUserAddress()?.toLowerCase() ?? null;
        let foundMe = false;

        this.entries.forEach((entry, index) => {
            const isMe = myAddress != null && entry.address?.toLowerCase() === myAddress;
            if (isMe) foundMe = true;

            const li = document.createElement('li');
            if (isMe) li.classList.add('leaderboard-me');

            const placeSpan = document.createElement('span');
            placeSpan.textContent = `${index + 1}.`;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = isMe ? `${entry.name} (Me)` : entry.name;

            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = entry.score.toFixed(2);

            li.appendChild(placeSpan);
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);

            list.appendChild(li);
        });

        // If the current user isn't on the leaderboard, add them at the bottom
        if (myAddress && !foundMe) {
            const li = document.createElement('li');
            li.classList.add('leaderboard-me');

            const placeSpan = document.createElement('span');
            placeSpan.textContent = '—';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = '(Me)';

            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = '0.00';

            li.appendChild(placeSpan);
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);

            list.appendChild(li);
        }
    }
}

export const leaderboard = new Leaderboard();
