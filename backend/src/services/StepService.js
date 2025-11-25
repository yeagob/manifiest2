import StepRepository from '../repositories/StepRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import CauseRepository from '../repositories/CauseRepository.js';
import Step from '../models/Step.js';

class StepService {
    async recordSteps(userId, totalSteps) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        const distribution = await this.distributeSteps(user, totalSteps);
        const stepRecords = [];

        for (const [causeId, stepCount] of Object.entries(distribution)) {
            if (stepCount > 0) {
                const step = new Step({
                    userId: user.id,
                    causeId,
                    steps: stepCount
                });
                await StepRepository.create(step);
                stepRecords.push(step);

                // Update cause total
                const cause = await CauseRepository.findById(causeId);
                if (cause) {
                    cause.totalSteps += stepCount;
                    await CauseRepository.update(causeId, cause);
                }
            }
        }

        // Update user total
        user.totalSteps += totalSteps;
        await UserRepository.update(userId, user);

        return {
            totalSteps,
            distribution,
            records: stepRecords,
            userTotalSteps: user.totalSteps
        };
    }

    async distributeSteps(user, totalSteps) {
        const distribution = {};
        const causes = Object.keys(user.stepDistribution);

        if (causes.length === 0) {
            return distribution;
        }

        // Initialize distribution
        causes.forEach(causeId => {
            distribution[causeId] = 0;
        });

        // Distribute steps based on intervals
        for (let i = 0; i < totalSteps; i++) {
            for (const causeId of causes) {
                const config = user.stepDistribution[causeId];
                if ((i + 1) % config.interval === 0) {
                    distribution[causeId]++;
                }
            }
        }

        return distribution;
    }

    async getHistory(userId) {
        return StepRepository.findByUser(userId);
    }

    async getCauseStats(userId, causeId) {
        const steps = await StepRepository.findByUser(userId);
        const causeSteps = steps.filter(s => s.causeId === causeId);

        return {
            totalSteps: causeSteps.reduce((sum, s) => sum + s.steps, 0),
            records: causeSteps.length,
            lastUpdate: causeSteps.length > 0 ? causeSteps[causeSteps.length - 1].timestamp : null
        };
    }

    async getDailySteps(userId, date) {
        const steps = await StepRepository.findByDate(date);
        const userSteps = steps.filter(s => s.userId === userId);

        return {
            date,
            totalSteps: userSteps.reduce((sum, s) => sum + s.steps, 0),
            records: userSteps
        };
    }

    async getUserStats(userId) {
        const user = await UserRepository.findById(userId);
        const steps = await StepRepository.findByUser(userId);

        const byCause = {};
        for (const step of steps) {
            if (!byCause[step.causeId]) {
                byCause[step.causeId] = 0;
            }
            byCause[step.causeId] += step.steps;
        }

        const causeStats = [];
        for (const [causeId, stepCount] of Object.entries(byCause)) {
            const cause = await CauseRepository.findById(causeId);
            if (cause) {
                causeStats.push({
                    cause,
                    steps: stepCount
                });
            }
        }

        return {
            totalSteps: user.totalSteps,
            causesSupported: user.causesSupported.length,
            stepDistribution: user.stepDistribution,
            causeStats: causeStats.sort((a, b) => b.steps - a.steps)
        };
    }
}

export default new StepService();
