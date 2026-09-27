import * as TaskManager from 'expo-task-manager'
import * as BackgroundTask from 'expo-background-task'
import { syncNow } from './sync.js'

export const SYNC_TASK = 'manifiest-step-sync'

TaskManager.defineTask(SYNC_TASK, async () => {
  try {
    await syncNow(3)
    return BackgroundTask.BackgroundTaskResult.Success
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed
  }
})

export async function enableBackgroundSync() {
  const status = await BackgroundTask.getStatusAsync()
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return false
  if (!(await TaskManager.isTaskRegisteredAsync(SYNC_TASK))) {
    await BackgroundTask.registerTaskAsync(SYNC_TASK, { minimumInterval: 60 })
  }
  return true
}
