export type JudgmentType = '적합' | '부적합' | '누락' | '확인 필요';
export type ConfidenceType = '상' | '중' | '하';

export interface ReviewItem {
  no: number;
  item: string; // 검토 항목
  specification: string; // 시방서 기재
  standard: string; // 기준값
  basisArticle: string; // 근거 조항
  judgment: JudgmentType; // 판정
  confidence: ConfidenceType; // 확신도
  remarks: string; // 비고 (확신도 '하'인 경우 [기술사 확인 요망] 포함)
  detailReason?: string; // 상세 분석 이유 (툴팁/상세 모달용)
}

export interface ReviewResult {
  title?: string;
  items: ReviewItem[];
  missingChecklistItems: string[];
  internalInconsistencies: string[];
  deprecatedCitations: string[];
  summary: {
    total: number;
    compliant: number; // 적합
    nonCompliant: number; // 부적합
    missing: number; // 누락
    needCheck: number; // 확인 필요
    engineerReviewCount: number; // [기술사 확인 요망] 개수
  };
  disclaimer: string; // 「본 결과는 검토 초안이며 기술사의 확인 후 사용해야 합니다.」
  rawMarkdownTable?: string;
}

export interface ModelConfig {
  temperature: number;
  useStructuredOutput: boolean;
  strictness: 'standard' | 'strict' | 'lenient';
  topP?: number;
}

export interface KnowledgeArticle {
  articleNo: string;
  title: string;
  content: string;
  category: '설계기준' | '표준품셈' | '체크리스트';
  keyValues?: string[];
}

export interface SampleDocument {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  expectedIssues: string[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface KnowledgeDoc {
  id: string;
  name: string;
  mimeType: string;
  content: string;
  modifiedTime?: string;
  size?: string;
  extractedLength: number;
  syncedAt: string;
}

export type HistoryType = 'REVIEW' | 'CHAT' | 'PARSE_FILE' | 'EXPORT' | 'KNOWLEDGE_SYNC';

export interface HistoryItem {
  id: string;
  type: HistoryType;
  createdAt: string;
  userEmail?: string;
  userName?: string;
  clientIp?: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  details?: string;
  metadata?: Record<string, any>;
  // For REVIEW
  reviewSummary?: {
    total: number;
    compliant: number;
    nonCompliant: number;
    missing: number;
    needCheck: number;
    engineerReviewCount: number;
  };
  reviewResult?: ReviewResult;
  documentSnippet?: string;
  documentLength?: number;
  engineType?: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
  modelConfig?: ModelConfig;
  // For CHAT
  userMessage?: string;
  chatReply?: string;
  // For PARSE_FILE
  filename?: string;
  fileSize?: string;
  extractedLength?: number;
  parseMethod?: string;
}

export interface HistoryStats {
  totalCount: number;
  reviewCount: number;
  chatCount: number;
  parseCount: number;
  exportCount: number;
  otherCount: number;
  compliantSum: number;
  nonCompliantSum: number;
  needCheckSum: number;
  missingSum: number;
  engineerReviewSum: number;
  lastActivityAt: string | null;
}

export interface UserFeedback {
  id: string;
  createdAt: string;
  userEmail: string;
  rating: number; // 1 to 5
  category: 'REVIEW_ACCURACY' | 'RESPONSE_SPEED' | 'USABILITY' | 'FEATURE_REQUEST' | 'OTHER';
  comment: string;
  targetFeature: string;
  isResolved?: boolean;
}

export interface SystemPerformanceMetrics {
  memoryUsage: { heapUsedMb: number; heapTotalMb: number; rssMb: number };
  uptimeSeconds: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  requestCount: number;
  successRate: number;
  nodeVersion: string;
}

export interface BenchmarkCaseResult {
  testId: string;
  testName: string;
  latencyMs: number;
  passed: boolean;
  accuracyScore: number;
  detectedIssues: number;
  expectedIssues: number;
  details: string;
}

export interface BenchmarkResult {
  id: string;
  runAt: string;
  totalDurationMs: number;
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  cases: BenchmarkCaseResult[];
  systemMetrics: {
    memoryHeapMb: number;
    memoryRssMb: number;
    uptimeSeconds: number;
  };
  summary: string;
}

export interface AdminAnalyticsSummary {
  overview: {
    totalUsers: number;
    totalReviews: number;
    totalChats: number;
    totalFeedbacks: number;
    avgSatisfaction: number;
    satisfactionCount: number;
    avgLatencyMs: number;
    uptimeSeconds: number;
    systemHealth: 'OPTIMAL' | 'NORMAL' | 'WARNING';
  };
  satisfactionStats: {
    avgRating: number;
    distribution: Record<number, number>;
    categoryRatings: Record<string, { count: number; sum: number; avg: number }>;
    recentFeedbacks: UserFeedback[];
  };
  topViolations: {
    article: string;
    description: string;
    count: number;
    severity: 'HIGH' | 'MEDIUM';
  }[];
  performanceHistory: {
    timestamp: string;
    avgLatency: number;
    requestCount: number;
    errorRate: number;
  }[];
  recentBenchmarks: BenchmarkResult[];
}

