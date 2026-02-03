/**
 * Background job types for stock analysis
 */

export type JobType =
  | 'stock_analysis'
  | 'news_sentiment'
  | 'earnings_analysis'
  | 'macro_analysis'
  | 'movement_prediction'
  | 'batch_update';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scheduledFor?: string;
}

export interface JobStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  avgProcessingTime: number;
}

export interface AnalysisJobPayload {
  symbol: string;
  analysisTypes: ('technical' | 'sentiment' | 'fundamental' | 'movement')[];
  priority?: JobPriority;
}

export interface BatchUpdateJobPayload {
  symbols: string[];
  updateTypes: ('price' | 'analysis' | 'movement')[];
}
