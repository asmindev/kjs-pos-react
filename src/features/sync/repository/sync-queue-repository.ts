import type { SyncJob } from "../domain/models/sync-job-model"

const queue: SyncJob[] = []

export const syncQueueRepository = {
  add(job: SyncJob) {
    queue.push(job)
  },
  list() {
    return [...queue]
  },
}
