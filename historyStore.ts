import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type HistoryType = 'REVIEW' | 'CHAT' | 'PARSE_FILE' | 'EXPORT' | 'KNOWLEDGE_SYNC';

export interface HistoryItem {
  id: string;
  type: HistoryType;
  createdAt: string; // ISO 8601
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
  reviewResult?: any;
  documentSnippet?: string;
  documentLength?: number;
  engineType?: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
  modelConfig?: any;
  // For CHAT
  userMessage?: string;
  chatReply?: string;
  // For PARSE_FILE
  filename?: string;
  fileSize?: string;
  mimeType?: string;
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

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// In-memory cache for high performance
let historyCache: HistoryItem[] = [];
let isInitialized = false;

// Seed initial history if storage file does not exist or is empty
function getSeedHistory(): HistoryItem[] {
  const now = Date.now();
  return [
    {
      id: 'rev_seed_001',
      type: 'REVIEW',
      createdAt: new Date(now - 1000 * 60 * 35).toISOString(), // 35 min ago
      title: '구내통신설비공사 시방서 (일반건축물 구내배선)',
      status: 'WARNING',
      details: '구 제8조 폐지조항 인용 1건, 접지저항 기준 10Ω 초과(30Ω 기재) 부적합 1건 검출',
      userEmail: 'engineer@telecom.or.kr',
      engineType: 'GEMINI_AI',
      documentLength: 1850,
      documentSnippet: '제1장 총칙\n1.1 공사명: ○○업무시설 신축 구내통신설비공사\n1.2 적용기준: 구 정보통신설비 설계기준 제8조...',
      modelConfig: {
        temperature: 0.1,
        useStructuredOutput: true,
        strictness: 'strict',
        topP: 0.95,
      },
      reviewSummary: {
        total: 8,
        compliant: 6,
        nonCompliant: 1,
        missing: 0,
        needCheck: 1,
        engineerReviewCount: 2,
      },
      reviewResult: {
        title: '○○업무시설 신축 구내통신설비공사',
        summary: {
          total: 8,
          compliant: 6,
          nonCompliant: 1,
          missing: 0,
          needCheck: 1,
          engineerReviewCount: 2,
        },
        missingChecklistItems: [],
        internalInconsistencies: [],
        deprecatedCitations: ['구 제8조(배선의 규격) 인용 오류 (현행 제6조로 전부개정 이동)'],
        disclaimer: '본 결과는 검토 초안이며 기술사의 확인 후 사용해야 합니다.',
        items: [
          {
            no: 1,
            item: '수평배선 배관 규격',
            specification: '강제전선관 16mm 사용',
            standard: '호칭 22mm 이상 배관',
            basisArticle: '제5조 제1호',
            judgment: '부적합',
            confidence: '상',
            remarks: '기준치 22mm 미달로 즉시 설계변경 필요',
            detailReason: '설계기준 제5조 제1호에 따라 단위세대 및 업무시설 수평배관은 최소 호칭 22mm 이상의 배관을 적용해야 합니다.',
          },
          {
            no: 2,
            item: '주배선반 접지저항',
            specification: '통신단독접지 10Ω 이하 시공',
            standard: '10Ω 이하 (공용접지 연계 시 기준 준수)',
            basisArticle: '제9조 제1항',
            judgment: '적합',
            confidence: '상',
            remarks: '현행 제9조 기준 충족',
            detailReason: '구내통신실 접지저항은 제9조 제1항에 따라 10Ω 이하로 적합합니다.',
          },
          {
            no: 3,
            item: '간선배선 인용조항 적정성',
            specification: '구 설계기준 제8조에 의거 UTP Cat.6 케이블 적용',
            standard: '현행 제6조(배선의 규격)',
            basisArticle: '제19조(경과조치)',
            judgment: '확인 필요',
            confidence: '하',
            remarks: '[기술사 확인 요망] 폐지된 구 제8조 인용',
            detailReason: '규격(Cat.6)은 현행 기준에 부합하나, 조항 번호가 2024년 전부개정된 현행 제6조가 아닌 폐지된 구 제8조를 인용하고 있습니다.',
          },
        ],
      },
    },
    {
      id: 'chat_seed_002',
      type: 'CHAT',
      createdAt: new Date(now - 1000 * 60 * 70).toISOString(), // 70 min ago
      title: '기술 질의: 통신실 최소 면적 및 접지저항 규정',
      status: 'SUCCESS',
      userEmail: 'engineer@telecom.or.kr',
      userMessage: '업무용 건물 연면적 3,000㎡ 기준 통신실 최소 면적과 접지저항 기준이 어떻게 되나요?',
      chatReply: '「정보통신설비 설계기준」(2024 전부개정)에 따른 기준입니다:\n1. 집중구내통신실 면적(제7조 제2호): 연면적 2,000㎡ 이상 5,000㎡ 미만인 경우 최소 15㎡ 이상의 전용 통신실 면적을 확보해야 합니다.\n2. 접지저항 기준(제9조 제1항): 통신용 접지저항은 10Ω 이하를 유지해야 합니다.\n\n본 답변은 검토 초안이며 기술사의 확인 후 사용해야 합니다.',
      details: '연면적 3,000㎡ 구내통신실 면적(15㎡) 및 접지(10Ω) 기준 조문 안내',
    },
    {
      id: 'parse_seed_003',
      type: 'PARSE_FILE',
      createdAt: new Date(now - 1000 * 60 * 120).toISOString(), // 2 hours ago
      title: '파일 추출: 구내통신_공사시방서_최종본.pdf',
      status: 'SUCCESS',
      filename: '구내통신_공사시방서_최종본.pdf',
      fileSize: '1.4 MB',
      extractedLength: 14280,
      parseMethod: 'DIRECT_TEXT',
      details: 'PDF 텍스트 14,280자 추출 완료',
    },
  ];
}

// Load history from disk
export function initHistoryStore(): void {
  if (isInitialized) return;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
      if (raw.trim()) {
        historyCache = JSON.parse(raw);
      } else {
        historyCache = getSeedHistory();
        saveHistoryToDisk();
      }
    } else {
      historyCache = getSeedHistory();
      saveHistoryToDisk();
    }
  } catch (err) {
    console.error('Failed to initialize history store:', err);
    historyCache = getSeedHistory();
  }

  isInitialized = true;
}

// Save history cache to disk
function saveHistoryToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${HISTORY_FILE}.tmp_${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(historyCache, null, 2), 'utf-8');
    fs.renameSync(tempFile, HISTORY_FILE);
  } catch (err) {
    console.error('Failed to write history file:', err);
  }
}

// Get paginated and filtered history list
export function getHistoryList(options?: {
  type?: string;
  search?: string;
  userEmail?: string;
  limit?: number;
  offset?: number;
}): { items: HistoryItem[]; total: number; stats: HistoryStats } {
  initHistoryStore();

  let filtered = [...historyCache];

  // Filter by type
  if (options?.type && options.type !== 'ALL' && options.type !== 'all') {
    const targetType = options.type.toUpperCase();
    filtered = filtered.filter((item) => item.type === targetType);
  }

  // Filter by userEmail
  if (options?.userEmail) {
    filtered = filtered.filter(
      (item) => item.userEmail?.toLowerCase() === options.userEmail?.toLowerCase()
    );
  }

  // Filter by search keyword
  if (options?.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(q);
      const detailsMatch = item.details?.toLowerCase().includes(q);
      const userMsgMatch = item.userMessage?.toLowerCase().includes(q);
      const filenameMatch = item.filename?.toLowerCase().includes(q);
      const snippetMatch = item.documentSnippet?.toLowerCase().includes(q);
      return titleMatch || detailsMatch || userMsgMatch || filenameMatch || snippetMatch;
    });
  }

  // Sort descending by creation date
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const limit = options?.limit && options.limit > 0 ? options.limit : 50;
  const offset = options?.offset && options.offset >= 0 ? options.offset : 0;
  const items = filtered.slice(offset, offset + limit);

  return {
    items,
    total,
    stats: getHistoryStats(),
  };
}

// Get single history item by ID
export function getHistoryById(id: string): HistoryItem | null {
  initHistoryStore();
  const item = historyCache.find((i) => i.id === id);
  return item || null;
}

// Add history item
export function addHistoryItem(
  itemData: Omit<HistoryItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): HistoryItem {
  initHistoryStore();

  const id =
    itemData.id ||
    `${(itemData.type || 'hist').toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = itemData.createdAt || new Date().toISOString();

  const newItem: HistoryItem = {
    ...itemData,
    id,
    createdAt,
  };

  historyCache.unshift(newItem);

  // Maintain max 500 records to prevent uncontrolled disk growth
  if (historyCache.length > 500) {
    historyCache = historyCache.slice(0, 500);
  }

  saveHistoryToDisk();
  return newItem;
}

// Delete single history item
export function deleteHistoryItem(id: string): boolean {
  initHistoryStore();
  const initialLen = historyCache.length;
  historyCache = historyCache.filter((item) => item.id !== id);
  const deleted = historyCache.length < initialLen;
  if (deleted) {
    saveHistoryToDisk();
  }
  return deleted;
}

// Clear all history or filtered by type
export function clearHistory(type?: string): number {
  initHistoryStore();
  const initialLen = historyCache.length;

  if (type && type !== 'ALL' && type !== 'all') {
    const targetType = type.toUpperCase();
    historyCache = historyCache.filter((item) => item.type !== targetType);
  } else {
    historyCache = [];
  }

  const removedCount = initialLen - historyCache.length;
  saveHistoryToDisk();
  return removedCount;
}

// Get aggregated statistics
export function getHistoryStats(): HistoryStats {
  initHistoryStore();

  let reviewCount = 0;
  let chatCount = 0;
  let parseCount = 0;
  let exportCount = 0;
  let otherCount = 0;
  let compliantSum = 0;
  let nonCompliantSum = 0;
  let needCheckSum = 0;
  let missingSum = 0;
  let engineerReviewSum = 0;

  for (const item of historyCache) {
    if (item.type === 'REVIEW') {
      reviewCount++;
      if (item.reviewSummary) {
        compliantSum += item.reviewSummary.compliant || 0;
        nonCompliantSum += item.reviewSummary.nonCompliant || 0;
        needCheckSum += item.reviewSummary.needCheck || 0;
        missingSum += item.reviewSummary.missing || 0;
        engineerReviewSum += item.reviewSummary.engineerReviewCount || 0;
      }
    } else if (item.type === 'CHAT') {
      chatCount++;
    } else if (item.type === 'PARSE_FILE') {
      parseCount++;
    } else if (item.type === 'EXPORT') {
      exportCount++;
    } else {
      otherCount++;
    }
  }

  return {
    totalCount: historyCache.length,
    reviewCount,
    chatCount,
    parseCount,
    exportCount,
    otherCount,
    compliantSum,
    nonCompliantSum,
    needCheckSum,
    missingSum,
    engineerReviewSum,
    lastActivityAt: historyCache[0]?.createdAt || null,
  };
}

// Export history as JSON or CSV
export function exportHistoryData(format: 'json' | 'csv' = 'json', type?: string): string {
  initHistoryStore();

  let list = [...historyCache];
  if (type && type !== 'ALL' && type !== 'all') {
    list = list.filter((item) => item.type === type.toUpperCase());
  }

  if (format === 'csv') {
    const headers = [
      'ID',
      '유형(Type)',
      '일시(Date)',
      '제목(Title)',
      '상태(Status)',
      '적합',
      '부적합',
      '누락',
      '확인필요',
      '기술사확인요망',
      '사용자이메일',
      '상세정보',
    ];

    const rows = list.map((item) => {
      const summary = item.reviewSummary || {
        compliant: 0,
        nonCompliant: 0,
        missing: 0,
        needCheck: 0,
        engineerReviewCount: 0,
      };

      const clean = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

      return [
        clean(item.id),
        clean(item.type),
        clean(item.createdAt),
        clean(item.title),
        clean(item.status),
        summary.compliant,
        summary.nonCompliant,
        summary.missing,
        summary.needCheck,
        summary.engineerReviewCount,
        clean(item.userEmail || ''),
        clean(item.details || item.userMessage || item.filename || ''),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  return JSON.stringify(list, null, 2);
}
