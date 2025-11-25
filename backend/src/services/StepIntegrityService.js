/**
 * Servicio encargado EXCLUSIVAMENTE de validar la integridad.
 * Principio: Single Responsibility.
 */
class StepIntegrityService {
    constructor() {
        // Constantes definidas explícitamente (Magic Numbers evitados)
        this._MAX_HUMAN_SPEED_KMH = 15.0;
        this._MAX_STEPS_PER_MINUTE = 180; // Correr muy rápido
    }

    /**
     * Valida un lote de pasos
     * @param {Object} _payload 
     * @returns {boolean}
     */
    validateBatch(_payload) {
        if (!this._isValidSource(_payload.source)) return false;
        if (this._isTeleporting(_payload)) return false;
        if (this._isSuperHumanSpeed(_payload)) return false;

        return true;
    }

    _isValidSource(source) {
        const validSources = ['HEALTH_KIT', 'HEALTH_CONNECT', 'GARMIN_CONNECT', 'ACCELEROMETER', 'GPS', 'MANUAL_DEBUG'];
        return validSources.includes(source);
    }

    _isTeleporting(_payload) {
        // Implement geo-fencing logic here if location data is available
        // For now, return false (not teleporting)
        return false;
    }

    _isSuperHumanSpeed(_payload) {
        const durationMinutes = (_payload.timestampEnd - _payload.timestampStart) / 60000;
        if (durationMinutes <= 0) return true; // Error de tiempo, suspicious

        const stepsPerMin = _payload.stepCount / durationMinutes;

        // Check cadence
        if (stepsPerMin > this._MAX_STEPS_PER_MINUTE) {
            console.warn(`Suspicious cadence: ${stepsPerMin} steps/min`);
            return true;
        }

        // Check speed if distance is available
        if (_payload.distanceMeters) {
            const distanceKm = _payload.distanceMeters / 1000;
            const durationHours = durationMinutes / 60;
            const speedKmh = distanceKm / durationHours;

            if (speedKmh > this._MAX_HUMAN_SPEED_KMH) {
                console.warn(`Suspicious speed: ${speedKmh} km/h`);
                return true;
            }
        }

        return false;
    }
}

export default new StepIntegrityService();
