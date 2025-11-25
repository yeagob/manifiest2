/**
 * Interface unificada para cualquier proveedor de datos de salud.
 * Permite cambiar entre iOS/Android/Wearables sin romper la lógica de negocio.
 * @interface
 */
class IHealthProvider {
    /**
     * Inicializa permisos y conexión con el store nativo.
     * @returns {Promise<void>}
     */
    async Initialize() {
        throw new Error('Method not implemented.');
    }

    /**
     * Obtiene pasos en un rango de tiempo específico.
     * @param {Date} _start 
     * @param {Date} _end 
     * @returns {Promise<import('./HealthData').IHealthPayload>}
     */
    async GetSteps(_start, _end) {
        throw new Error('Method not implemented.');
    }

    /**
     * Verifica si el dispositivo soporta conteo de pasos confiable.
     * @returns {boolean}
     */
    HasHardwareSupport() {
        throw new Error('Method not implemented.');
    }
}

export default IHealthProvider;
