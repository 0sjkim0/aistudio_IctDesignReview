import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  RefreshCw,
  Search,
  Download,
  Trash2,
  FileCheck2,
  MessageSquare,
  FileText,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Filter,
  BarChart3,
  Calendar,
  Clock,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { HistoryItem, HistoryStats, ReviewResult } from '../types';
import {
  fetchHistory,
  deleteHistoryItem,
  clearAllHistory,
} from '../services/historyService';

interface HistoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadReview?: (result: ReviewResult, documentText?: string) => void;
  onHistoryUpdated?: () => void;
}

export const HistoryManagerModal: React.FC<HistoryManagerModalProps> = ({
  isOpen,
  onClose,
  onLoadReview,
  onHistoryUpdated,
}) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load history list from backend
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchHistory({
        type: selectedType,
        search: searchQuery,
      });
      setItems(data.items);
      setStats(data.stats);
    } catch (err: any) {
      console.error('Failed to load history:', err);
      setErrorMessage(err.message || '이력 데이터를 가져오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedType]);

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Delete single item
  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('이 이력 항목을 영구 삭제하시겠습니까?')) return;

    try {
      await deleteHistoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showNotice('이력 항목이 성공적으로 삭제되었습니다.');
      onHistoryUpdated?.();
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  // Clear all history
  const handleClearHistory = async () => {
    const confirmMsg =
      selectedType === 'ALL'
        ? '전체 사용 이력 및 감사 로그를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
        : `'${selectedType}' 유형의 이력 항목을 모두 삭제하시겠습니까?`;

    if (!window.confirm(confirmMsg)) return;

    setIsClearing(true);
    try {
      await clearAllHistory(selectedType);
      showNotice(
        selectedType === 'ALL'
          ? '모든 이력이 초기화되었습니다.'
          : `'${selectedType}' 유형의 이력이 초기화되었습니다.`
      );
      await loadData();
      onHistoryUpdated?.();
    } catch (err: any) {
      alert(err.message || '초기화 실패');
    } finally {
      setIsClearing(false);
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 3500);
  };

  // Format relative and full time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      let relative = '';
      if (diffSec < 60) relative = '방금 전';
      else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}분 전`;
      else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}시간 전`;
      else relative = `${Math.floor(diffSec / 86400)}일 전`;

      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');

      return {
        relative,
        full: `${y}-${m}-${d} ${h}:${min}:${s}`,
      };
    } catch {
      return { relative: '', full: isoString };
    }
  };

  // Type badge helper
  const renderTypeBadge = (type: HistoryItem['type']) => {
    switch (type) {
      case 'REVIEW':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-900/40 text-emerald-300 border border-emerald-600 text-[10px] font-mono font-bold">
            <FileCheck2 className="w-3 h-3 mr-1" />
            기술검토
          </span>
        );
      case 'CHAT':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-500 text-[10px] font-mono font-bold">
            <MessageSquare className="w-3 h-3 mr-1" />
            기술질의
          </span>
        );
      case 'PARSE_FILE':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-900/40 text-purple-300 border border-purple-500 text-[10px] font-mono font-bold">
            <FileText className="w-3 h-3 mr-1" />
            파일추출
          </span>
        );
      case 'EXPORT':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-900/40 text-amber-300 border border-amber-500 text-[10px] font-mono font-bold">
            <HardDrive className="w-3 h-3 mr-1" />
            드라이브저장
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800 text-neutral-300 border border-neutral-600 text-[10px] font-mono font-bold">
            기타활동
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Top Header */}
        <div className="bg-[#141414] text-white p-3 sm:p-4 flex items-center justify-between border-b border-[#141414]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-white text-[#141414] flex items-center justify-center font-mono font-bold">
              <History className="w-4 h-4 text-[#141414]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  BACKEND_AUDIT_LOGS
                </span>
                <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 text-white">
                  PERSISTENT_JSON_STORE
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                시스템 사용 이력 및 검토 히스토리 관리
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-semibold bg-[#141414] hover:bg-white hover:text-[#141414] border border-white/40 transition-colors"
              title="이력 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="bg-emerald-100 border-b border-emerald-500 px-4 py-2 text-xs font-mono text-emerald-900 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="font-bold text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Top Aggregated Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-neutral-200/80 border-b border-[#141414]/30 text-xs font-mono">
            <div className="bg-[#E4E3E0] border border-[#141414] p-2.5">
              <span className="text-[10px] text-neutral-600 block uppercase font-bold">
                총 사용 이력
              </span>
              <div className="text-lg font-bold text-[#141414] mt-0.5">
                {stats.totalCount}
                <span className="text-xs font-normal text-neutral-600 ml-1">건</span>
              </div>
              <span className="text-[10px] text-neutral-500 block truncate">
                최근 활동: {stats.lastActivityAt ? formatTime(stats.lastActivityAt).relative : '-'}
              </span>
            </div>

            <div className="bg-[#E4E3E0] border border-[#141414] p-2.5">
              <span className="text-[10px] text-neutral-600 block uppercase font-bold">
                기술 검토 누적
              </span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">
                {stats.reviewCount}
                <span className="text-xs font-normal text-neutral-600 ml-1">회 검토</span>
              </div>
              <span className="text-[10px] text-neutral-600 block">
                적합 {stats.compliantSum} / 부적합 {stats.nonCompliantSum}
              </span>
            </div>

            <div className="bg-[#E4E3E0] border border-[#141414] p-2.5">
              <span className="text-[10px] text-neutral-600 block uppercase font-bold">
                기술 질의응답
              </span>
              <div className="text-lg font-bold text-blue-700 mt-0.5">
                {stats.chatCount}
                <span className="text-xs font-normal text-neutral-600 ml-1">건 상담</span>
              </div>
              <span className="text-[10px] text-neutral-500 block">AI 규정 대조 Q&A</span>
            </div>

            <div className="bg-[#E4E3E0] border border-[#141414] p-2.5">
              <span className="text-[10px] text-neutral-600 block uppercase font-bold">
                기술사 확인 요망
              </span>
              <div className="text-lg font-bold text-amber-700 mt-0.5">
                {stats.engineerReviewSum}
                <span className="text-xs font-normal text-neutral-600 ml-1">항목</span>
              </div>
              <span className="text-[10px] text-neutral-600 block">
                주의/확인필요 {stats.needCheckSum}건
              </span>
            </div>
          </div>
        )}

        {/* Filter, Search & Export Bar */}
        <div className="p-3 border-b border-[#141414]/30 bg-[#E4E3E0] flex flex-wrap items-center justify-between gap-2.5">
          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-mono">
            {[
              { id: 'ALL', label: '전체 이력' },
              { id: 'REVIEW', label: '기술 검토' },
              { id: 'CHAT', label: 'AI 질의응답' },
              { id: 'PARSE_FILE', label: '파일 추출' },
              { id: 'EXPORT', label: '드라이브 저장' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-2.5 py-1 text-xs font-bold transition-colors border whitespace-nowrap ${
                  selectedType === tab.id
                    ? 'bg-[#141414] text-white border-[#141414]'
                    : 'bg-white text-[#141414] border-[#141414]/40 hover:border-[#141414]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input and Export Actions */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, 내용, 질문 검색..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Export buttons */}
            <a
              href={`/api/history/export?format=csv&type=${selectedType}`}
              download
              className="inline-flex items-center px-2 py-1 text-[11px] font-mono font-bold bg-white text-[#141414] border border-[#141414] hover:bg-neutral-100 transition-colors"
              title="CSV 엑셀 형식 다운로드 (UTF-8 BOM 포함)"
            >
              <Download className="w-3 h-3 mr-1 text-emerald-700" />
              <span>CSV</span>
            </a>

            <a
              href={`/api/history/export?format=json&type=${selectedType}`}
              download
              className="inline-flex items-center px-2 py-1 text-[11px] font-mono font-bold bg-white text-[#141414] border border-[#141414] hover:bg-neutral-100 transition-colors"
              title="JSON 원본 데이터 다운로드"
            >
              <Download className="w-3 h-3 mr-1 text-blue-700" />
              <span>JSON</span>
            </a>

            {/* Clear button */}
            <button
              onClick={handleClearHistory}
              disabled={isClearing || items.length === 0}
              className="inline-flex items-center px-2 py-1 text-[11px] font-mono font-bold text-rose-700 bg-white border border-rose-400 hover:bg-rose-50 transition-colors disabled:opacity-40"
              title="현재 필터된 이력 비우기"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              <span>초기화</span>
            </button>
          </div>
        </div>

        {/* Content List Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 font-mono text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-[#141414] mb-2" />
              <span>백엔드 사용 이력 데이터베이스 조회 중...</span>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-rose-50 border border-rose-300 text-rose-950 text-xs font-mono">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>이력 조회 오류</span>
              </div>
              <p>{errorMessage}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#141414]/30 bg-white/40">
              <History className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs font-mono font-bold text-neutral-700">기록된 이력이 없습니다.</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                공사시방서 검토를 실행하거나 기술 질문을 전송하면 백엔드에 자동으로 안전하게 기록됩니다.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const time = formatTime(item.createdAt);
              const isExpanded = expandedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#141414] transition-all hover:shadow-xs"
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="p-3 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <div className="flex items-start sm:items-center space-x-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedItemId(isExpanded ? null : item.id);
                        }}
                        className="text-neutral-500 hover:text-black mt-0.5 sm:mt-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {renderTypeBadge(item.type)}
                        <span className="text-xs font-bold text-[#141414] hover:underline">
                          {item.title}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Timestamp & Quick Action */}
                    <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs font-mono text-neutral-500 pl-6 sm:pl-0">
                      <div className="flex items-center space-x-1.5" title={time.full}>
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span className="text-neutral-700 font-semibold">{time.relative}</span>
                        <span className="text-[10px] text-neutral-400 hidden md:inline">
                          ({time.full})
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {/* Load Review button if this is a review result */}
                        {item.type === 'REVIEW' && item.reviewResult && onLoadReview && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadReview(item.reviewResult, item.documentSnippet);
                              onClose();
                            }}
                            className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold bg-[#141414] text-white hover:bg-neutral-800 transition-colors"
                            title="이 검토 결과를 메인 화면에 즉시 불러옵니다."
                          >
                            <RotateCcw className="w-3 h-3 mr-1 text-emerald-400" />
                            <span>결과 불러오기</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="항목 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="px-3 py-2 bg-neutral-50/70 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100">
                    <div className="text-[11px] text-neutral-700 flex-1">
                      {item.details && <span>{item.details}</span>}
                      {item.userMessage && (
                        <div className="font-sans text-neutral-800">
                          <span className="font-bold font-mono text-blue-700 mr-1">[Q]:</span>
                          <span>{item.userMessage}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats pills for review */}
                    {item.type === 'REVIEW' && item.reviewSummary && (
                      <div className="flex items-center space-x-1.5 font-mono text-[10px] font-bold">
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300">
                          적합 {item.reviewSummary.compliant}
                        </span>
                        {item.reviewSummary.nonCompliant > 0 && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-900 border border-rose-300">
                            부적합 {item.reviewSummary.nonCompliant}
                          </span>
                        )}
                        {item.reviewSummary.needCheck > 0 && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300">
                            확인필요 {item.reviewSummary.needCheck}
                          </span>
                        )}
                        {item.reviewSummary.engineerReviewCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 border border-purple-300">
                            기술사확인 {item.reviewSummary.engineerReviewCount}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta info for Parse */}
                    {item.type === 'PARSE_FILE' && (
                      <div className="flex items-center space-x-2 font-mono text-[10px] text-neutral-600">
                        {item.fileSize && <span>크기: {item.fileSize}</span>}
                        {item.extractedLength && (
                          <span>추출: {item.extractedLength.toLocaleString()}자</span>
                        )}
                        {item.parseMethod && (
                          <span className="bg-neutral-200 px-1 py-0.2">{item.parseMethod}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Detailed Audit Inspection */}
                  {isExpanded && (
                    <div className="p-3 sm:p-4 bg-neutral-100 text-xs font-mono space-y-3 border-t border-neutral-200">
                      {/* Meta Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 border border-neutral-300 text-[11px]">
                        <div>
                          <span className="text-neutral-500 block">기록 ID:</span>
                          <span className="font-bold text-neutral-800">{item.id}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">생성 일시 (ISO):</span>
                          <span className="text-neutral-800">{item.createdAt}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">사용자 계정:</span>
                          <span className="text-neutral-800">
                            {item.userEmail || '시스템 로컬 사용자 (Local)'}
                          </span>
                        </div>
                      </div>

                      {/* Review Engine & Configuration */}
                      {item.type === 'REVIEW' && (
                        <div className="bg-white p-3 border border-neutral-300 space-y-2">
                          <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                            <span className="font-bold text-[#141414]">검토 엔진 및 파라미터</span>
                            <span className="text-[10px] bg-neutral-200 px-1.5 py-0.5 font-bold">
                              {item.engineType || 'GEMINI_AI'}
                            </span>
                          </div>
                          {item.modelConfig && (
                            <div className="text-[11px] text-neutral-700 flex flex-wrap gap-3">
                              <span>Temperature: {item.modelConfig.temperature}</span>
                              <span>
                                Structured Output:{' '}
                                {item.modelConfig.useStructuredOutput ? 'YES' : 'NO'}
                              </span>
                              <span>Strictness: {item.modelConfig.strictness}</span>
                            </div>
                          )}
                          {item.documentSnippet && (
                            <div className="mt-2">
                              <span className="text-neutral-500 text-[10px] block mb-1">
                                검토 대상 원문 스니펫:
                              </span>
                              <pre className="p-2 bg-neutral-50 border border-neutral-200 text-[11px] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto text-neutral-800">
                                {item.documentSnippet}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Chat Dialog Full Content */}
                      {item.type === 'CHAT' && item.chatReply && (
                        <div className="bg-white p-3 border border-neutral-300 space-y-2">
                          <span className="font-bold text-[#141414] block border-b border-neutral-200 pb-1">
                            AI 답변 전문
                          </span>
                          <div className="p-2.5 bg-neutral-50 border border-neutral-200 text-[11px] font-sans whitespace-pre-wrap leading-relaxed text-neutral-800">
                            {item.chatReply}
                          </div>
                        </div>
                      )}

                      {/* Action Bar inside Expanded View */}
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        {item.type === 'REVIEW' && item.reviewResult && onLoadReview && (
                          <button
                            onClick={() => {
                              onLoadReview(item.reviewResult, item.documentSnippet);
                              onClose();
                            }}
                            className="inline-flex items-center px-3 py-1 bg-[#141414] text-white font-bold text-xs hover:bg-neutral-800 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            <span>현재 화면에 검토 결과 탑재</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="inline-flex items-center px-2.5 py-1 text-xs text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span>이 항목 영구 삭제</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-[#141414] p-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-600 gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>백엔드 스토리지(/data/history.json)와 실시간 동기화 중</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#141414] hover:bg-neutral-800 text-white font-bold transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
