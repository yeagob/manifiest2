import AppleHealthKit from 'react-native-health'

const PERMISSIONS = { permissions: { read: [AppleHealthKit.Constants.Permissions.StepCount], write: [] } }

export const platform = 'ios'

export function requestAccess() {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(PERMISSIONS, err => (err ? reject(new Error(String(err))) : resolve(true)))
  })
}

export function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dailySteps(days = 7) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return new Promise((resolve, reject) => {
    AppleHealthKit.getDailyStepCountSamples({ startDate: start.toISOString(), endDate: new Date().toISOString(), period: 1440, includeManuallyAdded: false }, (err, rows) => {
      if (err) return reject(new Error(String(err)))
      const byDate = {}
      for (const r of rows ?? []) {
        const date = localDate(new Date(r.startDate))
        byDate[date] = (byDate[date] ?? 0) + Math.round(r.value)
      }
      resolve(Object.entries(byDate).map(([date, steps]) => ({ date, steps })))
    })
  })
}
