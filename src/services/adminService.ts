import {
  AdminAnalyticsSummary,
  UserFeedback,
  SystemPerformanceMetrics,
  BenchmarkResult,
} from '../types';

/**
 * Fetch overall admin dashboard analytics summary
 */
export async function fetchAdminSummary(): Promise<AdminAnalyticsSummary> {
  const res = await fetch('/api/admin/summary');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '관리자 대시보드 요약 정보를 불러오지 못했습니다.');
  }
  return res.json();
}

/**
 * Fetch list of feedbacks with optional filter
 */
export async function fetchFeedbacks(options?: {
  rating?: number;
  category?: string;
}): Promise<{ feedbacks: UserFeedback[]; avgRating: number; total: number }> {
  const params = new URLSearchParams();
  if (options?.rating) params.set('rating', String(options.rating));
  if (options?.category && options.category !== 'ALL') params.set('category', options.category);

  const res = await fetch(`/api/admin/feedbacks?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '피드백 목록을 불러오지 못했습니다.');
  }
  return res.json();
}

/**
 * Submit user satisfaction feedback
 */
export async function submitUserFeedback(feedbackData: {
  userEmail?: string;
  rating: number;
  category?: string;
  comment: string;
  targetFeature?: string;
}): Promise<UserFeedback> {
  const res = await fetch('/api/admin/feedbacks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedbackData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '만족도 제출에 실패했습니다.');
  }
  const data = await res.json();
  return data.feedback;
}

/**
 * Fetch real-time system performance metrics
 */
export async function fetchSystemPerformance(): Promise<SystemPerformanceMetrics> {
  const res = await fetch('/api/admin/performance');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '시스템 성능 지표를 불러오지 못했습니다.');
  }
  return res.json();
}

/**
 * Execute system benchmark and performance evaluation suite
 */
export async function runBenchmarkEvaluationSuite(): Promise<BenchmarkResult> {
  const res = await fetch('/api/admin/benchmark/run', {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '성능 평가 벤치마크 실행에 실패했습니다.');
  }
  const data = await res.json();
  return data.benchmark;
}

/**
 * Fetch past benchmark runs history
 */
export async function fetchBenchmarkHistory(): Promise<BenchmarkResult[]> {
  const res = await fetch('/api/admin/benchmarks');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '벤치마크 이력을 불러오지 못했습니다.');
  }
  const data = await res.json();
  return data.benchmarks || [];
}
