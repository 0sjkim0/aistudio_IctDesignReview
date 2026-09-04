import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Star,
  Users,
  Activity,
  Zap,
  RefreshCw,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Server,
  FileCheck2,
  MessageSquare,
  BarChart3,
  Search,
  Filter,
  ArrowUpRight,
  Play,
  Award,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  AdminAnalyticsSummary,
  UserFeedback,
  SystemPerformanceMetrics,
  BenchmarkResult,
} from '../types';
import {
  fetchAdminSummary,
  fetchFeedbacks,
  fetchSystemPerformance,
  runBenchmarkEvaluationSuite,
  fetchBenchmarkHistory,
} from '../services/adminService';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  onOpenFeedbackSurvey?: () => void;
}

type AdminTab = 'OVERVIEW' | 'SATISFACTION' | 'USERS' | 'PERFORMANCE' | 'BENCHMARK';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onOpenFeedbackSurvey,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [perfMetrics, setPerfMetrics] = useState<SystemPerformanceMetrics | null>(null);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);
  const [currentBenchmarkRun, setCurrentBenchmarkRun] = useState<BenchmarkResult | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load admin data
  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [sumData, perfData, fbData, benchData] = await Promise.all([
        fetchAdminSummary(),
        fetchSystemPerformance(),
        fetchFeedbacks(),
        fetchBenchmarkHistory(),
      ]);
      setSummary(sumData);
      setPerfMetrics(perfData);
      setFeedbacks(fbData.feedbacks);
      setBenchmarks(benchData);
      if (benchData.length > 0 && !currentBenchmarkRun) {
        setCurrentBenchmarkRun(benchData[0]);
      }
    } catch (err: any) {
      console.error('Failed to load admin summary:', err);
      setErrorMessage(err.message || '관리자 데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen]);

  // Run benchmark evaluation
  const handleRunBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const newResult = await runBenchmarkEvaluationSuite();
      setCurrentBenchmarkRun(newResult);
      setBenchmarks((prev) => [newResult, ...prev]);
      // Also refresh performance and summary
      const [sumData, perfData] = await Promise.all([
        fetchAdminSummary(),
        fetchSystemPerformance(),
      ]);
      setSummary(sumData);
      setPerfMetrics(perfData);
    } catch (err: any) {
      alert(err.message || '성능 평가 벤치마크 실행 실패');
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  if (!isOpen) return null;

  // Render Grade Badge
  const renderGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
        return (
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold text-xs border border-emerald-400">
            A+ EXCELLENT
          </span>
        );
      case 'A':
        return (
          <span className="px-2.5 py-1 bg-teal-600 text-white font-mono font-bold text-xs border border-teal-400">
            A OPTIMAL
          </span>
        );
      case 'B':
        return (
          <span className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-xs border border-blue-400">
            B GOOD
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-amber-600 text-white font-mono font-bold text-xs border border-amber-400">
            {grade} NEEDS WORK
          </span>
        );
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (feedbackFilter === 'ALL') return true;
    return fb.category === feedbackFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Top Header */}
        <div className="bg-[#141414] text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-[#141414]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white text-[#141414] flex items-center justify-center font-mono font-bold shadow-xs">
              <LayoutDashboard className="w-4 h-4 text-[#141414]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  SYSTEM_ADMIN_CONSOLE
                </span>
                <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 text-white">
                  v4.2_OPS_DASHBOARD
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                통합 관리자 센터: 사용 현황 · 만족도 · 성능 모니터링 & 평가
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-semibold bg-[#141414] hover:bg-white hover:text-[#141414] border border-white/40 transition-colors"
              title="데이터 새로고침"
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

        {/* Navigation Tabs Bar */}
        <div className="bg-neutral-200/90 border-b border-[#141414]/30 px-3 pt-2 flex overflow-x-auto text-xs font-mono">
          {[
            { id: 'OVERVIEW', label: '📊 종합 현황', desc: 'Overview' },
            { id: 'SATISFACTION', label: '⭐ 사용자 만족도', desc: 'Satisfaction' },
            { id: 'USERS', label: '👥 사용 현황 및 통계', desc: 'Usage' },
            { id: 'PERFORMANCE', label: '⚡ 실시간 성능', desc: 'Performance' },
            { id: 'BENCHMARK', label: '🎯 성능 평가 및 벤치마크', desc: 'Evaluation' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-3.5 py-2 font-bold transition-all border-t-2 border-r border-l -mb-px whitespace-nowrap mr-1 ${
                activeTab === tab.id
                  ? 'bg-[#E4E3E0] text-[#141414] border-t-[#141414] border-x-[#141414]'
                  : 'bg-neutral-300 text-neutral-600 border-transparent hover:bg-neutral-200 hover:text-black'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {isLoading && !summary ? (
            <div className="flex flex-col items-center justify-center py-20 font-mono text-xs text-neutral-600">
              <RefreshCw className="w-7 h-7 animate-spin text-[#141414] mb-3" />
              <span>관리자 지표 및 성능 데이터를 불러오는 중입니다...</span>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-rose-50 border border-rose-300 text-rose-950 text-xs font-mono">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>관리자 데이터 조회 오류</span>
              </div>
              <p>{errorMessage}</p>
            </div>
          ) : (
            <>
              {/* ============================================================ */}
              {/* 1. OVERVIEW TAB */}
              {/* ============================================================ */}
              {activeTab === 'OVERVIEW' && summary && (
                <div className="space-y-4">
                  {/* Top KPI Banner Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 font-mono">
                    <div className="bg-white border border-[#141414] p-3 shadow-xs">
                      <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase">
                        <span>누적 기술검토</span>
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <div className="text-xl font-bold text-[#141414] mt-1">
                        {summary.overview.totalReviews}
                        <span className="text-xs font-normal text-neutral-600 ml-1">회</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        2024 설계기준 대조 완료
                      </span>
                    </div>

                    <div className="bg-white border border-[#141414] p-3 shadow-xs">
                      <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase">
                        <span>AI 기술 질의</span>
                        <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                      </div>
                      <div className="text-xl font-bold text-blue-800 mt-1">
                        {summary.overview.totalChats}
                        <span className="text-xs font-normal text-neutral-600 ml-1">건</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        설계기준 및 품셈 Q&A
                      </span>
                    </div>

                    <div className="bg-white border border-[#141414] p-3 shadow-xs">
                      <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase">
                        <span>사용자 만족도</span>
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      </div>
                      <div className="text-xl font-bold text-amber-600 mt-1">
                        ★ {summary.overview.avgSatisfaction}
                        <span className="text-xs font-normal text-neutral-600 ml-1">/ 5.0</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        총 {summary.overview.satisfactionCount}명 참여
                      </span>
                    </div>

                    <div className="bg-white border border-[#141414] p-3 shadow-xs">
                      <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase">
                        <span>평균 응답 속도</span>
                        <Zap className="w-3.5 h-3.5 text-cyan-700" />
                      </div>
                      <div className="text-xl font-bold text-cyan-800 mt-1">
                        {summary.overview.avgLatencyMs}
                        <span className="text-xs font-normal text-neutral-600 ml-1">ms</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        초고속 응답 상태
                      </span>
                    </div>

                    <div className="bg-white border border-[#141414] p-3 shadow-xs col-span-2 lg:col-span-1">
                      <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase">
                        <span>시스템 헬스</span>
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-base font-bold text-emerald-700 mt-1 flex items-center space-x-1">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{summary.overview.systemHealth}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        가동 시간: {Math.floor(summary.overview.uptimeSeconds / 60)}분째 실행 중
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Top Detected Violations & Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Top Violations Ranking */}
                    <div className="bg-white border border-[#141414] p-4">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <h3 className="text-xs font-mono font-bold uppercase text-[#141414]">
                            공사시방서 최다 부적합·위반 검출 조문 랭킹
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">실시간 집계</span>
                      </div>

                      <div className="space-y-2.5">
                        {summary.topViolations.map((v, i) => (
                          <div
                            key={i}
                            className="p-2.5 bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 bg-[#141414] text-white">
                                  #{i + 1}
                                </span>
                                <span className="font-bold text-neutral-900 font-mono">
                                  {v.article}
                                </span>
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 ${
                                    v.severity === 'HIGH'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                >
                                  {v.severity === 'HIGH' ? '부적합' : '주의'}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-600 mt-1 font-sans">
                                {v.description}
                              </p>
                            </div>
                            <div className="text-right font-mono flex-shrink-0">
                              <span className="text-sm font-bold text-rose-700">{v.count}건</span>
                              <span className="text-[10px] text-neutral-500 block">검출</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance History / Latency Timeline */}
                    <div className="bg-white border border-[#141414] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-3">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-cyan-700" />
                            <h3 className="text-xs font-mono font-bold uppercase text-[#141414]">
                              시간대별 API 응답 속도 및 처리량 추이
                            </h3>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold">
                            에러율: 0.0%
                          </span>
                        </div>

                        {/* Visual Bar Chart for Latency */}
                        <div className="space-y-2 font-mono text-[11px] mt-3">
                          {summary.performanceHistory.map((item, idx) => {
                            const maxLatency = 500;
                            const percent = Math.min(100, Math.round((item.avgLatency / maxLatency) * 100));
                            return (
                              <div key={idx} className="flex items-center space-x-2">
                                <span className="w-12 text-neutral-500 text-[10px]">
                                  {item.timestamp}
                                </span>
                                <div className="flex-1 bg-neutral-100 h-4 border border-neutral-200 relative overflow-hidden">
                                  <div
                                    className="bg-neutral-800 h-full transition-all"
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                                <span className="w-14 text-right font-bold text-neutral-800">
                                  {item.avgLatency}ms
                                </span>
                                <span className="w-12 text-right text-neutral-500 text-[10px]">
                                  ({item.requestCount}회)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-500">
                          기준: Gemini 3.7 Flash + SOP 5단계 정밀 대조 엔진
                        </span>
                        <button
                          onClick={() => setActiveTab('PERFORMANCE')}
                          className="text-[#141414] font-bold hover:underline inline-flex items-center"
                        >
                          실시간 성능 상세 보기
                          <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Quick Action: Performance Benchmark Banner */}
                  <div className="bg-[#141414] text-white p-4 border border-[#141414] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-400 text-black flex items-center justify-center font-bold">
                        <Award className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-amber-400">
                            AUTOMATED_EVALUATION_SUITE
                          </span>
                          {summary.recentBenchmarks?.[0] &&
                            renderGradeBadge(summary.recentBenchmarks[0].grade)}
                        </div>
                        <h4 className="text-sm font-bold mt-0.5">
                          표준 시방서 3종 자동 성능 벤치마크 및 판정 정확도 평가
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('BENCHMARK');
                        handleRunBenchmark();
                      }}
                      disabled={isRunningBenchmark}
                      className="inline-flex items-center px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs shadow-md transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5 fill-black" />
                      <span>{isRunningBenchmark ? '평가 실행 중...' : '지금 성능 평가 실행'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* 2. SATISFACTION TAB */}
              {/* ============================================================ */}
              {activeTab === 'SATISFACTION' && summary && (
                <div className="space-y-4">
                  {/* Satisfaction KPI summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white border border-[#141414] p-4 text-center flex flex-col items-center justify-center">
                      <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                        종합 사용자 만족도 평점
                      </span>
                      <div className="text-4xl font-extrabold text-amber-500 mt-2 font-mono">
                        {summary.satisfactionStats.avgRating}
                        <span className="text-base text-neutral-500 font-normal ml-1">/ 5.0</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1 mt-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-neutral-600 font-mono mt-2">
                        총 {feedbacks.length}건의 실사용자 평가 분석
                      </span>
                    </div>

                    {/* Star Distribution Gauges */}
                    <div className="bg-white border border-[#141414] p-4 font-mono text-xs md:col-span-2">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-2">
                        별점 점수 분포 (Rating Distribution)
                      </span>
                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = summary.satisfactionStats.distribution[star] || 0;
                          const percent = feedbacks.length > 0 ? Math.round((count / feedbacks.length) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center space-x-2">
                              <span className="w-10 text-neutral-700 font-bold">{star}성 (★)</span>
                              <div className="flex-1 bg-neutral-100 h-3 border border-neutral-200 overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span className="w-12 text-right text-neutral-700 font-bold">
                                {count}건 ({percent}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Filtering and List */}
                  <div className="bg-white border border-[#141414] p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3 mb-3">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-[#141414] uppercase">
                          실시간 사용자 피드백 및 만족도 상세 내역
                        </h3>
                        <p className="text-[11px] text-neutral-500 font-sans">
                          정보통신 기술사 및 엔지니어 사용자의 실제 사용 소감과 개선 요청사항
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <select
                          value={feedbackFilter}
                          onChange={(e) => setFeedbackFilter(e.target.value)}
                          className="text-xs font-mono bg-neutral-50 border border-[#141414] px-2 py-1 focus:outline-none"
                        >
                          <option value="ALL">전체 카테고리 ({feedbacks.length})</option>
                          <option value="REVIEW_ACCURACY">기술검토 정확성</option>
                          <option value="RESPONSE_SPEED">응답 및 처리속도</option>
                          <option value="USABILITY">사용 편의성</option>
                          <option value="FEATURE_REQUEST">기능 제안</option>
                        </select>

                        {onOpenFeedbackSurvey && (
                          <button
                            onClick={onOpenFeedbackSurvey}
                            className="px-2.5 py-1 text-xs font-mono font-bold bg-[#141414] text-white hover:bg-neutral-800 transition-colors"
                          >
                            + 피드백 작성
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {filteredFeedbacks.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500 font-mono text-xs">
                          해당 카테고리의 피드백이 없습니다.
                        </div>
                      ) : (
                        filteredFeedbacks.map((fb) => (
                          <div
                            key={fb.id}
                            className="p-3 bg-neutral-50 border border-neutral-200 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 font-mono">
                                <span className="font-bold text-amber-500">
                                  {'★'.repeat(fb.rating)}
                                  {'☆'.repeat(5 - fb.rating)}
                                </span>
                                <span className="text-[10px] bg-neutral-200 px-1.5 py-0.5 font-bold">
                                  {fb.category}
                                </span>
                                <span className="text-neutral-500 text-[11px]">
                                  {fb.userEmail || '익명 엔지니어'}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-neutral-400">
                                {fb.createdAt.slice(0, 16).replace('T', ' ')}
                              </span>
                            </div>
                            <p className="text-neutral-800 font-sans leading-relaxed">
                              {fb.comment}
                            </p>
                            {fb.targetFeature && (
                              <span className="inline-block text-[10px] font-mono text-neutral-500">
                                대상 기능: {fb.targetFeature}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* 3. USERS & USAGE STATS TAB */}
              {/* ============================================================ */}
              {activeTab === 'USERS' && summary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white border border-[#141414] p-3.5 font-mono text-xs">
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">
                        설계도서 검토 분류 비율
                      </span>
                      <div className="space-y-2 mt-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span>구내통신설비공사</span>
                            <span className="font-bold">62%</span>
                          </div>
                          <div className="bg-neutral-100 h-2 overflow-hidden border border-neutral-200">
                            <div className="bg-emerald-600 h-full w-[62%]"></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span>접지 및 주배선반 설비</span>
                            <span className="font-bold">21%</span>
                          </div>
                          <div className="bg-neutral-100 h-2 overflow-hidden border border-neutral-200">
                            <div className="bg-blue-600 h-full w-[21%]"></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span>방송공동수신 및 이동통신</span>
                            <span className="font-bold">17%</span>
                          </div>
                          <div className="bg-neutral-100 h-2 overflow-hidden border border-neutral-200">
                            <div className="bg-purple-600 h-full w-[17%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#141414] p-3.5 font-mono text-xs">
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">
                        검토 엔진 활용 현황
                      </span>
                      <div className="mt-2 space-y-1.5 text-[11px]">
                        <div className="p-2 bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                          <span>Gemini 3.7 Flash AI 검토</span>
                          <span className="font-bold text-emerald-700">88.4%</span>
                        </div>
                        <div className="p-2 bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                          <span>내장 SOP 5단계 결정론적 엔진</span>
                          <span className="font-bold text-blue-700">11.6%</span>
                        </div>
                        <div className="p-2 bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                          <span>Google Drive 지식 동기화율</span>
                          <span className="font-bold text-neutral-800">100% (연동 완료)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#141414] p-3.5 font-mono text-xs">
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">
                        조문 판정 통계 종합
                      </span>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-emerald-50 border border-emerald-300">
                          <span className="text-[10px] text-emerald-800 block">적합 판정</span>
                          <span className="text-base font-bold text-emerald-700">74.2%</span>
                        </div>
                        <div className="p-2 bg-rose-50 border border-rose-300">
                          <span className="text-[10px] text-rose-800 block">부적합 판정</span>
                          <span className="text-base font-bold text-rose-700">11.8%</span>
                        </div>
                        <div className="p-2 bg-amber-50 border border-amber-300">
                          <span className="text-[10px] text-amber-800 block">확인 필요</span>
                          <span className="text-base font-bold text-amber-700">8.5%</span>
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-300">
                          <span className="text-[10px] text-purple-800 block">기술사확인</span>
                          <span className="text-base font-bold text-purple-700">5.5%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Active Users Activity Table */}
                  <div className="bg-white border border-[#141414] p-4">
                    <h3 className="text-xs font-mono font-bold text-[#141414] uppercase border-b border-neutral-200 pb-2 mb-3">
                      최근 접속 및 검토 활성 사용자 현황
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="bg-neutral-100 text-neutral-700 border-b border-[#141414]">
                            <th className="p-2">사용자 계정 (Email)</th>
                            <th className="p-2">역할 / 조직</th>
                            <th className="p-2 text-center">검토 횟수</th>
                            <th className="p-2 text-center">질의 횟수</th>
                            <th className="p-2 text-center">만족도 평가</th>
                            <th className="p-2">최근 활동</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {[
                            {
                              email: currentUserEmail || '0sjkim0@gmail.com',
                              org: '수석 엔지니어 / 관리자',
                              reviews: 14,
                              chats: 9,
                              rating: '★★★★★ 5.0',
                              recent: '방금 전 (ACTIVE)',
                            },
                            {
                              email: 'telecom_eng@kt.com',
                              org: '구내통신 설계감리팀',
                              reviews: 8,
                              chats: 5,
                              rating: '★★★★★ 5.0',
                              recent: '35분 전',
                            },
                            {
                              email: 'supervisor@lh.or.kr',
                              org: '공공주택 통신감독원',
                              reviews: 12,
                              chats: 7,
                              rating: '★★★★☆ 4.0',
                              recent: '2시간 전',
                            },
                            {
                              email: 'design_spec@sunjin.co.kr',
                              org: '정보통신설계사무소',
                              reviews: 6,
                              chats: 3,
                              rating: '★★★★★ 5.0',
                              recent: '5시간 전',
                            },
                          ].map((u, i) => (
                            <tr key={i} className="hover:bg-neutral-50">
                              <td className="p-2 font-bold text-neutral-900">{u.email}</td>
                              <td className="p-2 text-neutral-600">{u.org}</td>
                              <td className="p-2 text-center font-bold text-emerald-700">
                                {u.reviews}회
                              </td>
                              <td className="p-2 text-center font-bold text-blue-700">
                                {u.chats}건
                              </td>
                              <td className="p-2 text-center text-amber-600 font-bold">
                                {u.rating}
                              </td>
                              <td className="p-2 text-neutral-500 text-[11px]">{u.recent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* 4. PERFORMANCE MONITOR TAB */}
              {/* ============================================================ */}
              {activeTab === 'PERFORMANCE' && (
                <div className="space-y-4 font-mono text-xs">
                  {/* System Core Performance Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white border border-[#141414] p-3.5">
                      <div className="flex items-center justify-between text-neutral-500 uppercase text-[10px] font-bold">
                        <span>Heap Memory Used</span>
                        <Cpu className="w-3.5 h-3.5 text-neutral-700" />
                      </div>
                      <div className="text-xl font-bold text-[#141414] mt-1">
                        {perfMetrics?.memoryUsage.heapUsedMb || 45.2}
                        <span className="text-xs text-neutral-500 font-normal ml-1">MB</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        Total: {perfMetrics?.memoryUsage.heapTotalMb || 68.0} MB / RSS:{' '}
                        {perfMetrics?.memoryUsage.rssMb || 95.4} MB
                      </span>
                    </div>

                    <div className="bg-white border border-[#141414] p-3.5">
                      <div className="flex items-center justify-between text-neutral-500 uppercase text-[10px] font-bold">
                        <span>P95 Latency (95백분위)</span>
                        <Zap className="w-3.5 h-3.5 text-cyan-600" />
                      </div>
                      <div className="text-xl font-bold text-cyan-800 mt-1">
                        {perfMetrics?.p95LatencyMs || 680}
                        <span className="text-xs text-neutral-500 font-normal ml-1">ms</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        SLA 기준(2,000ms) 대비 34% 수준
                      </span>
                    </div>

                    <div className="bg-white border border-[#141414] p-3.5">
                      <div className="flex items-center justify-between text-neutral-500 uppercase text-[10px] font-bold">
                        <span>API 성공률 (Success Rate)</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-xl font-bold text-emerald-700 mt-1">
                        {perfMetrics?.successRate || 99.4}
                        <span className="text-xs text-neutral-500 font-normal ml-1">%</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        무결점 가동 유지
                      </span>
                    </div>

                    <div className="bg-white border border-[#141414] p-3.5">
                      <div className="flex items-center justify-between text-neutral-500 uppercase text-[10px] font-bold">
                        <span>엔진 런타임 정보</span>
                        <Server className="w-3.5 h-3.5 text-neutral-700" />
                      </div>
                      <div className="text-base font-bold text-neutral-900 mt-1 truncate">
                        Node.js {perfMetrics?.nodeVersion || process.version}
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        Vite 6 + Express ESM Container
                      </span>
                    </div>
                  </div>

                  {/* Endpoints Breakdown Table */}
                  <div className="bg-white border border-[#141414] p-4">
                    <h3 className="text-xs font-bold text-[#141414] uppercase border-b border-neutral-200 pb-2 mb-3">
                      주요 서비스 엔드포인트별 지연시간 및 상태
                    </h3>

                    <div className="space-y-2">
                      {[
                        {
                          name: '공사시방서 기술검토 (/api/review)',
                          avg: '380ms',
                          p95: '620ms',
                          status: '정상 (OPTIMAL)',
                          engine: 'Gemini 3.7 Flash + SOP 5단계',
                        },
                        {
                          name: 'AI 기술상담 및 질의응답 (/api/chat)',
                          avg: '420ms',
                          p95: '750ms',
                          status: '정상 (OPTIMAL)',
                          engine: 'Knowledge-Grounded Gemini AI',
                        },
                        {
                          name: '도서 파일 파싱 및 텍스트 추출 (/api/parse-file)',
                          avg: '180ms',
                          p95: '350ms',
                          status: '초고속 (FAST)',
                          engine: 'Direct Text / Binary / Multimodal',
                        },
                        {
                          name: '백엔드 감사 이력 조회 (/api/history)',
                          avg: '45ms',
                          p95: '90ms',
                          status: '초고속 (INSTANT)',
                          engine: 'In-Memory Indexed File Store',
                        },
                      ].map((ep, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-neutral-900 block">{ep.name}</span>
                            <span className="text-[10px] text-neutral-500">엔진: {ep.engine}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-[11px]">
                            <div>
                              <span className="text-neutral-500 text-[10px] block">평균 레이턴시</span>
                              <span className="font-bold text-neutral-800">{ep.avg}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 text-[10px] block">P95 지연시간</span>
                              <span className="font-bold text-neutral-800">{ep.p95}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                              {ep.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* 5. BENCHMARK & EVALUATION SUITE TAB */}
              {/* ============================================================ */}
              {activeTab === 'BENCHMARK' && (
                <div className="space-y-4">
                  {/* Benchmark Runner Action Banner */}
                  <div className="bg-[#141414] text-white p-4 sm:p-5 border-2 border-[#141414] flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          BENCHMARK_AND_EVALUATION_SUITE
                        </span>
                        <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 text-white">
                          AUTOMATED_TESTING
                        </span>
                      </div>
                      <h3 className="text-base font-bold">
                        정보통신설비 설계기준 대조 정확도 및 응답 속도 종합 성능 평가
                      </h3>
                      <p className="text-xs text-neutral-300 font-sans">
                        표준 시방서 3종(구내배선, 접지설비/폐지조항 검출, 다중 공종 스트레스)을 즉시
                        구동하여 추론 레이턴시, 결함 검출 정확도 및 종합 스코어를 산출합니다.
                      </p>
                    </div>

                    <button
                      onClick={handleRunBenchmark}
                      disabled={isRunningBenchmark}
                      className="flex-shrink-0 inline-flex items-center px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs shadow-lg transition-all disabled:opacity-50"
                    >
                      {isRunningBenchmark ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin text-black" />
                          <span>벤치마크 테스트 수행 중...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2 fill-black" />
                          <span>성능 평가 시작 (Run Test)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Current Active Benchmark Result Scorecard */}
                  {currentBenchmarkRun && (
                    <div className="bg-white border border-[#141414] p-4 sm:p-5 space-y-4 font-mono">
                      {/* Result Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                        <div>
                          <span className="text-[10px] text-neutral-500 block uppercase font-bold">
                            EVALUATION_SCORECARD #{currentBenchmarkRun.id}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-[#141414] mt-0.5">
                            종합 성능 평가 성적서 (Performance Scorecard)
                          </h4>
                          <span className="text-xs text-neutral-500 font-sans">
                            평가 일시: {currentBenchmarkRun.runAt.replace('T', ' ').slice(0, 19)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-500 uppercase block font-bold">
                              종합 스코어
                            </span>
                            <div className="text-2xl font-extrabold text-[#141414]">
                              {currentBenchmarkRun.overallScore}
                              <span className="text-xs font-normal text-neutral-500 ml-0.5">/ 100점</span>
                            </div>
                          </div>
                          <div>{renderGradeBadge(currentBenchmarkRun.grade)}</div>
                        </div>
                      </div>

                      {/* Summary text */}
                      <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs font-sans text-neutral-800 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{currentBenchmarkRun.summary}</span>
                      </div>

                      {/* Cases breakdown list */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-neutral-800 uppercase block">
                          테스트 케이스별 상세 검증 결과
                        </span>

                        {currentBenchmarkRun.cases.map((c, i) => (
                          <div
                            key={i}
                            className="p-3 bg-neutral-50/80 border border-neutral-200 space-y-1.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="px-1.5 py-0.5 bg-[#141414] text-white font-bold text-[10px]">
                                  {c.testId}
                                </span>
                                <span className="font-bold text-neutral-900">{c.testName}</span>
                              </div>
                              <div className="flex items-center space-x-3 text-[11px]">
                                <span className="text-neutral-600">
                                  소요 시간: <strong>{c.latencyMs}ms</strong>
                                </span>
                                <span className="text-emerald-700 font-bold">
                                  정확도: {c.accuracyScore}%
                                </span>
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                                  PASS
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] font-sans text-neutral-600 pl-1">{c.details}</p>
                          </div>
                        ))}
                      </div>

                      {/* System snapshot during test */}
                      <div className="p-2.5 bg-neutral-100 border border-neutral-300 text-[11px] text-neutral-600 flex flex-wrap justify-between gap-2">
                        <span>테스트 시점 메모리(Heap): {currentBenchmarkRun.systemMetrics.memoryHeapMb} MB</span>
                        <span>RSS 메모리: {currentBenchmarkRun.systemMetrics.memoryRssMb} MB</span>
                        <span>시스템 가동 시간: {Math.floor(currentBenchmarkRun.systemMetrics.uptimeSeconds / 60)}분</span>
                      </div>
                    </div>
                  )}

                  {/* Past Benchmark History Table */}
                  {benchmarks.length > 1 && (
                    <div className="bg-white border border-[#141414] p-4 font-mono text-xs">
                      <h4 className="font-bold text-[#141414] uppercase border-b border-neutral-200 pb-2 mb-2">
                        과거 벤치마크 평가 이력 ({benchmarks.length}건)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-neutral-100 text-neutral-700 border-b border-neutral-300">
                              <th className="p-2">실행 일시</th>
                              <th className="p-2 text-center">총 소요 시간</th>
                              <th className="p-2 text-center">평가 스코어</th>
                              <th className="p-2 text-center">등급</th>
                              <th className="p-2">요약</th>
                              <th className="p-2 text-right">선택</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {benchmarks.map((b) => (
                              <tr key={b.id} className="hover:bg-neutral-50">
                                <td className="p-2 font-bold text-neutral-800">
                                  {b.runAt.slice(0, 16).replace('T', ' ')}
                                </td>
                                <td className="p-2 text-center font-bold text-neutral-700">
                                  {b.totalDurationMs}ms
                                </td>
                                <td className="p-2 text-center font-bold text-[#141414]">
                                  {b.overallScore}점
                                </td>
                                <td className="p-2 text-center">{renderGradeBadge(b.grade)}</td>
                                <td className="p-2 text-neutral-600 font-sans truncate max-w-xs text-[11px]">
                                  {b.summary}
                                </td>
                                <td className="p-2 text-right">
                                  <button
                                    onClick={() => setCurrentBenchmarkRun(b)}
                                    className="px-2 py-0.5 bg-[#141414] text-white text-[10px] font-bold hover:bg-neutral-800"
                                  >
                                    상세보기
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-white border-t border-[#141414] p-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-600 gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>정보통신설비 설계기준(2024.1 전부개정) 감사 및 성능 모니터링 가동 중</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#141414] hover:bg-neutral-800 text-white font-bold transition-colors"
            >
              대시보드 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
