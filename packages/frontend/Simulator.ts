export class Simulator {
    private numSimulations: number;
    private startCost: number;
    private initialScore: number;

    constructor(numSimulations: number = 1000000) {
        this.numSimulations = numSimulations;
        this.startCost = 1;
        this.initialScore = 1.0;
    }

    private getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private getPrize(numSafes: number, round: number): number {
        const prizes = [ 0.33, 0.22, 0.16, 0.13, 0.11];
        return prizes[numSafes - 3] * (1 + (round - 1) * 0.55);
    }

    public run() {
        console.log(`Starting simulation of ${this.numSimulations} games per target round...`);
        
        const results: any[] = [];

        // Loop from target round 1 to 20
        for (let targetRound = 1; targetRound <= 30; targetRound++) {
             
             let totalCost = 0;
             let totalPayout = 0;
             let gamesWon = 0;
             let gamesLost = 0;
             let maxPayout = 0;

             for (let i = 1; i <= this.numSimulations; i++) {
                totalCost += this.startCost;
                const payout = this.simulateGame(targetRound);
                
                if (payout > 0) {
                    totalPayout += payout;
                    gamesWon++;
                    if (payout > maxPayout) maxPayout = payout;
                } else {
                    gamesLost++;
                }
            }

            const netProfit = totalPayout - totalCost;
            const avgPayout = totalPayout / this.numSimulations;
            const roi = (netProfit / totalCost) * 100;
            const winRate = (gamesWon / this.numSimulations) * 100;

            results.push({
                "Target Round": targetRound,
                "Total Games": this.numSimulations,
                "Net Profit": netProfit.toFixed(2),
                "ROI %": roi.toFixed(2) + '%',
                "Win Rate %": winRate.toFixed(2) + '%',
                "Avg Payout": avgPayout.toFixed(2),
                "Max Payout": maxPayout.toFixed(2)
            });
        }

        console.table(results);
    }

    private simulateGame(targetRound: number): number {
        let score = this.initialScore;
        let round = 1;
        let isGameOver = false;
        let cashedOut = false;

        // Game Loop
        while (!isGameOver && !cashedOut) {
            // Create a round
            const numSafes = this.getRandomInt(3, 7);
            const badSafeIndex = this.getRandomInt(0, numSafes - 1);
            
            // Player selects a random safe
            const pickedSafeIndex = this.getRandomInt(0, numSafes - 1);

            if (numSafes < 5) {
                cashedOut = true;
            }
            
            // Check result
            else if (pickedSafeIndex === badSafeIndex) {
                // LOSS
                isGameOver = true;
            } else {
                // WIN
                const prize = this.getPrize(numSafes, round);
                // if (round > 1) console.log(`Round ${round}: Prize = ${prize}`);
                score += prize;
                
                // Decision based on target round
                if (round >= targetRound) {
                    cashedOut = true;
                } else {
                    round++;
                }
            }
        }

        return cashedOut ? score : 0;
    }
}

new Simulator().run();
