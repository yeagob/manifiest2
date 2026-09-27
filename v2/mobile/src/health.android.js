import { initialize, requestPermission, getGrantedPermissions, aggregateRecord } from 'react-native-health-connect'

export const platform = 'android'

export async function requestAccess() {
  if (!(await initialize())) throw new Error('Health Connect no está disponible en este dispositivo')
  const granted = await getGrantedPermissions()
  if (granted.some(p => p.recordType === 'Steps' && p.accessType === 'read')) return true
  const result = await requestPermission([{ accessType: 'read', recordType: 'Steps' }])
  if (!result.some(p => p.recordType === 'Steps')) throw new Error('Permiso de pasos denegado')
  return true
}

export function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function dailySteps(days = 7) {
  await initialize()
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - i)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const result = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: (end > new Date() ? new Date() : end).toISOString() }
    })
    out.push({ date: localDate(start), steps: Math.round(result?.COUNT_TOTAL ?? 0) })
  }
  return out
}
