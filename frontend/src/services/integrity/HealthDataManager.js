import api from '../api'; // Assuming standard API service exists

/**
 * Manager for Health Data Integrity
 */
export class HealthDataManager {
    /**
     * @param {import('./IHealthProvider').default} _provider 
     */
    constructor(_provider) {
        this._provider = _provider;
        this._isInitialized = false;
    }

    /**
     * Centralización de inicialización (GameManager style)
     * @returns {Promise<void>}
     */
    async Awake() {
        try {
            await this._provider.Initialize();
            this._isInitialized = true;
            console.log("Health System Initialized");
        } catch (_error) {
            console.error("Health System Init Failed", _error);
        }
    }

    /**
     * Sincroniza los pasos diarios
     * @returns {Promise<void>}
     */
    async SyncDailySteps() {
        if (!this._isInitialized) return;

        const _today = new Date();
        const _startOfDay = new Date(_today.setHours(0, 0, 0, 0));

        try {
            const _payload = await this._provider.GetSteps(_startOfDay, new Date());
            // Aquí enviamos al backend para validación final
            await this._SubmitToBackend(_payload);
        } catch (error) {
            console.error("Failed to sync steps:", error);
        }
    }

    /**
     * Envía el payload al backend
     * @param {import('./HealthData').IHealthPayload} _data 
     * @returns {Promise<void>}
     */
    async _SubmitToBackend(_data) {
        // Lógica de envío a API
        // This would likely use the existing API service but hitting a new endpoint
        console.log("Submitting signed health payload to backend:", _data);
        // await api.post('/steps/integrity-sync', _data); 
    }
}
