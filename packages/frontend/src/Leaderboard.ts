import { mockService } from './MockService';

export interface LeaderboardEntry {
    name: string;
    score: number;
}

class Leaderboard {
    private entries: LeaderboardEntry[] = [];

    constructor() {
        // Initial load
        this.fetchData();
    }

    async fetchData() {
        try {
            this.entries = await mockService.getLeaderboard();
            this.render();
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        }
    }

    async addScore(name: string, score: number) {
        try {
            this.entries = await mockService.submitScore(name, score);
            this.render();
        } catch (error) {
            console.error("Failed to submit score", error);
        }
    }

    render() {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;

        list.innerHTML = '';
        if (this.entries.length === 0) {
            list.innerHTML = '<li>Loading...</li>';
            return;
        }

        this.entries.forEach((entry, index) => {
            const li = document.createElement('li');
            
            const placeSpan = document.createElement('span');
            placeSpan.textContent = `${index + 1}.`;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = entry.name;
            
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = entry.score.toFixed(2);
            
            li.appendChild(placeSpan);
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            
            list.appendChild(li);
        });
    }
}

export const leaderboard = new Leaderboard();
