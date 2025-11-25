/**
 * Health Source Types
 * @enum {string}
 */
export const HealthSourceType = {
    AppleHealthKit: 'HEALTH_KIT',
    GoogleHealthConnect: 'HEALTH_CONNECT',
    GarminConnect: 'GARMIN_CONNECT',
    Accelerometer: 'ACCELEROMETER', // Uncertified
    GPS: 'GPS', // Uncertified
    ManualEntry: 'MANUAL_DEBUG' // Solo para debug/admin
};

/**
 * @typedef {Object} IHealthPayload
 * @property {string} _source - One of HealthSourceType
 * @property {string} _deviceId - Unique device identifier
 * @property {Date} _startDate - Start of the activity
 * @property {Date} _endDate - End of the activity
 * @property {number} _stepCount - Number of steps
 * @property {string} [_signatureToken] - Optional digital signature
 */
