import { HistoryItem, HistoryStats } from '../types';

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  stats: HistoryStats;
}

/**
 * Fetch paginated & filtered history list from the backend
 */
export async function fetchHistory(options?: {
  type?: string;
  search?: string;
  userEmail?: string;
  limit?: number;
  offset?: number;
}): Promise<HistoryListResponse> {
  const query = new URLSearchParams();
  if (options?.type && options.type !== 'ALL') query.set('type', options.type);
  if (options?.search) query.set('search', options.search);
  if (options?.userEmail) query.set('userEmail', options.userEmail);
  if (options?.limit) query.set('limit', String(options.limit));
  if (options?.offset) query.set('offset', String(options.offset));

  const res = await fetch(`/api/history?${query.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || '이력 목록을 불러오지 못했습니다.');
  }
  return res.json();
}

/**
 * Fetch aggregated statistics
 */
export async function fetchHistoryStats(): Promise<HistoryStats> {
  const res = await fetch('/api/history/stats');
  if (!res.ok) {
    throw new Error('이력 통계를 불러오지 못했습니다.');
  }
  const data = await res.json();
  return data.stats;
}

/**
 * Fetch single detailed history item by ID
 */
export async function fetchHistoryItem(id: string): Promise<HistoryItem> {
  const res = await fetch(`/api/history/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error('이력 상세 정보를 불러오지 못했습니다.');
  }
  const data = await res.json();
  return data.item;
}

/**
 * Manually record an event (e.g. offline deterministic review, Google Drive export, knowledge sync)
 */
export async function recordHistoryEvent(
  eventData: Partial<HistoryItem> & { type: HistoryItem['type']; title: string }
): Promise<HistoryItem> {
  const res = await fetch('/api/history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || '이력 저장에 실패했습니다.');
  }
  const data = await res.json();
  return data.item;
}

/**
 * Delete a specific history item
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('이력 항목 삭제에 실패했습니다.');
  }
}

/**
 * Clear all history (or by type)
 */
export async function clearAllHistory(type?: string): Promise<number> {
  const query = type && type !== 'ALL' ? `?type=${encodeURIComponent(type)}` : '';
  const res = await fetch(`/api/history${query}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('이력 초기화에 실패했습니다.');
  }
  const data = await res.json();
  return data.removedCount || 0;
}
