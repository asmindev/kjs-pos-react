import type { SyncJob } from "../models/sync-job-model"

export async function runSyncJob(job: SyncJob) {
  return { ...job, status: "completed" as const }
}
