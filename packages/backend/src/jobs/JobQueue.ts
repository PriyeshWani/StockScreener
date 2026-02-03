import type { Job, JobType, JobStatus, JobPriority, JobStats } from '../types/index.js';

type JobHandler = (job: Job) => Promise<Record<string, unknown>>;

/**
 * Simple in-memory job queue for background processing
 * In production, this would be replaced with Redis-backed queue (Bull, BullMQ)
 */
export class JobQueue {
  private queue: Job[] = [];
  private processing: Map<string, Job> = new Map();
  private completed: Job[] = [];
  private handlers: Map<JobType, JobHandler> = new Map();
  private isRunning = false;
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private jobIdCounter = 0;

  /**
   * Register a handler for a job type
   */
  registerHandler(type: JobType, handler: JobHandler): void {
    this.handlers.set(type, handler);
    console.log(`[JobQueue] Registered handler for job type: ${type}`);
  }

  /**
   * Add a job to the queue
   */
  enqueue(
    type: JobType,
    payload: Record<string, unknown>,
    options: {
      priority?: JobPriority;
      scheduledFor?: Date;
      maxAttempts?: number;
    } = {}
  ): Job {
    const job: Job = {
      id: `job_${++this.jobIdCounter}_${Date.now()}`,
      type,
      status: 'pending',
      priority: options.priority ?? 'normal',
      payload,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      createdAt: new Date().toISOString(),
      scheduledFor: options.scheduledFor?.toISOString(),
    };

    // Insert based on priority
    const priorityOrder: Record<JobPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    const insertIndex = this.queue.findIndex(
      existingJob => priorityOrder[existingJob.priority] > priorityOrder[job.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    console.log(`[JobQueue] Enqueued job ${job.id} (type: ${type}, priority: ${job.priority})`);
    return job;
  }

  /**
   * Start processing jobs
   */
  start(intervalMs = 1000): void {
    if (this.isRunning) {
      console.log('[JobQueue] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[JobQueue] Started processing (interval: ${intervalMs}ms)`);

    this.processingInterval = setInterval(() => {
      this.processNext();
    }, intervalMs);
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[JobQueue] Not running');
      return;
    }

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('[JobQueue] Stopped processing');
  }

  /**
   * Process the next job in the queue
   */
  private async processNext(): Promise<void> {
    // Find next ready job
    const now = new Date();
    const jobIndex = this.queue.findIndex(job => {
      if (job.scheduledFor) {
        return new Date(job.scheduledFor) <= now;
      }
      return true;
    });

    if (jobIndex === -1) {
      return; // No jobs to process
    }

    const job = this.queue.splice(jobIndex, 1)[0];
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.error(`[JobQueue] No handler for job type: ${job.type}`);
      job.status = 'failed';
      job.error = `No handler registered for job type: ${job.type}`;
      this.completed.push(job);
      return;
    }

    // Update job status
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    job.attempts++;
    this.processing.set(job.id, job);

    console.log(`[JobQueue] Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

    try {
      const result = await handler(job);
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date().toISOString();
      console.log(`[JobQueue] Job ${job.id} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[JobQueue] Job ${job.id} failed: ${errorMessage}`);

      if (job.attempts < job.maxAttempts) {
        // Retry job
        job.status = 'pending';
        job.error = errorMessage;
        this.queue.push(job);
        console.log(`[JobQueue] Job ${job.id} will be retried`);
      } else {
        job.status = 'failed';
        job.error = errorMessage;
        job.completedAt = new Date().toISOString();
      }
    } finally {
      this.processing.delete(job.id);
      if (job.status === 'completed' || job.status === 'failed') {
        this.completed.push(job);
        // Keep only last 100 completed jobs
        if (this.completed.length > 100) {
          this.completed = this.completed.slice(-100);
        }
      }
    }
  }

  /**
   * Get job by ID
   */
  getJob(id: string): Job | undefined {
    return (
      this.queue.find(j => j.id === id) ??
      this.processing.get(id) ??
      this.completed.find(j => j.id === id)
    );
  }

  /**
   * Get queue statistics
   */
  getStats(): JobStats {
    const completedJobs = this.completed.filter(j => j.status === 'completed');
    const processingTimes = completedJobs
      .filter(j => j.startedAt && j.completedAt)
      .map(j => new Date(j.completedAt!).getTime() - new Date(j.startedAt!).getTime());

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    return {
      pending: this.queue.length,
      running: this.processing.size,
      completed: completedJobs.length,
      failed: this.completed.filter(j => j.status === 'failed').length,
      totalProcessed: this.completed.length,
      avgProcessingTime: Math.round(avgProcessingTime),
    };
  }

  /**
   * Clear all jobs
   */
  clear(): void {
    this.queue = [];
    this.processing.clear();
    this.completed = [];
    console.log('[JobQueue] Cleared all jobs');
  }
}

// Singleton instance
export const jobQueue = new JobQueue();
