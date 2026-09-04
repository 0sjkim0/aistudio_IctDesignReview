import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SopTracker } from './components/SopTracker';
import { DocumentInput } from './components/DocumentInput';
import { ReviewResultView } from './components/ReviewResultView';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { QuantityCalculator } from './components/QuantityCalculator';
import { SopGuideModal } from './components/SopGuideModal';
import { AgentChatDrawer } from './components/AgentChatDrawer';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { DriveExportConfirmModal } from './components/DriveExportConfirmModal';
import { HistoryManagerModal } from './components/HistoryManagerModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { FeedbackModal } from './components/FeedbackModal';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { ReviewResult, SampleDocument, ModelConfig, KnowledgeDoc, HistoryStats } from './types';
import { runDeterministicSopReview } from './utils/deterministicReviewer';
import {
  initAuth,
  getStoredKnowledgeDocs,
  syncAllKnowledgeFromFolder,
  KNOWLEDGE_FOLDER_ID,
  KNOWLEDGE_FOLDER_URL,
} from './services/googleDriveService';
import { fetchHistoryStats, recordHistoryEvent } from './services/historyService';
import { MessageSquare, AlertCircle, CheckCircle2, HardDrive, RefreshCw } from 'lucide-react';
import { User } from 'firebase/auth';

export default function App() {
  const [documentText, setDocumentText] = useState<string>(SAMPLE_DOCUMENTS[0].content);
  const [selectedSample, setSelectedSample] = useState<SampleDocument | null>(SAMPLE_DOCUMENTS[0]);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [currentSopStep, setCurrentSopStep] = useState<number>(0);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Google User Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // History Stats & Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);

  // Dynamic Google Drive Knowledge Docs State
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>(() => getStoredKnowledgeDocs());
  const [isSyncingFolder, setIsSyncingFolder] = useState<boolean>(false);
  const [syncProgressText, setSyncProgressText] = useState<string | undefined>(undefined);

  // Model Parameter Configuration State
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    temperature: 0.1,
    useStructuredOutput: true,
    strictness: 'strict',
    topP: 0.95,
  });

  // Modals & Drawers
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSopGuideOpen, setIsSopGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveExportModalOpen, setIsDriveExportModalOpen] = useState(false);
  const [driveExportData, setDriveExportData] = useState<{ content: string; defaultName: string }>({
    content: '',
    defaultName: '기술검토보고서.md',
  });

  // Refresh history aggregate stats
  const refreshHistoryStats = async () => {
    try {
      const stats = await fetchHistoryStats();
      setHistoryStats(stats);
    } catch {
      // Background sync, ignore error if backend starting
    }
  };

  // Initialize Firebase Auth listener on mount and load history stats
  useEffect(() => {
    refreshHistoryStats();
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Sync Knowledge Folder Handler
  const handleSyncKnowledgeFolder = async () => {
    if (!currentUser) {
      setIsDriveModalOpen(true);
      return;
    }

    setIsSyncingFolder(true);
    setSyncProgressText('구글 드라이브 지식 폴더 파일 목록 조회 중...');
    setErrorMessage(null);

    try {
      const docs = await syncAllKnowledgeFromFolder(KNOWLEDGE_FOLDER_ID, (current, total, name) => {
        setSyncProgressText(`[${current}/${total}] '${name}' 텍스트 추출 중...`);
      });

      setKnowledgeDocs(docs);
      setInfoMessage(`구글 드라이브 지식 폴더에서 ${docs.length}개 문서를 성공적으로 동기화하여 AI 판단 근거로 탑재했습니다.`);
    } catch (err: any) {
      console.error('Knowledge sync failed:', err);
      setErrorMessage(`지식 폴더 동기화 실패: ${err.message || '파일을 불러오지 못했습니다.'}`);
    } finally {
      setIsSyncingFolder(false);
      setSyncProgressText(undefined);
    }
  };

  const handleStartReview = async () => {
    if (!documentText.trim() || isReviewing) return;

    setIsReviewing(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setCurrentSopStep(1);

    // Step simulation timers for visual SOP progression
    const t1 = setTimeout(() => setCurrentSopStep(2), 600);
    const t2 = setTimeout(() => setCurrentSopStep(3), 1200);
    const t3 = setTimeout(() => setCurrentSopStep(4), 1800);
    const t4 = setTimeout(() => setCurrentSopStep(5), 2400);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
        },
        body: JSON.stringify({
          documentText,
          config: modelConfig,
          userEmail: currentUser?.email,
          knowledgeDocs: knowledgeDocs.map((d) => ({
            name: d.name,
            content: d.content,
            mimeType: d.mimeType,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '검토 처리 중 오류가 발생했습니다.');
      }

      setReviewResult(data);
      setCurrentSopStep(5);
      refreshHistoryStats();
    } catch (err: any) {
      console.warn('API review failed, falling back to offline rule-based SOP engine:', err);
      // Run deterministic rule engine based on 2024 revised standards
      const fallback = runDeterministicSopReview(documentText);
      setReviewResult(fallback);
      setCurrentSopStep(5);
      setInfoMessage('설계기준(2024 전부개정) 내장 조문 분석 및 SOP 5단계 정밀 대조 엔진으로 검토를 완료했습니다.');

      // Record offline deterministic review to backend history store
      recordHistoryEvent({
        type: 'REVIEW',
        title: fallback.title || selectedSample?.title || '정보통신공사 공사시방서 기술 검토',
        status: (fallback.summary?.nonCompliant > 0 || fallback.summary?.needCheck > 0) ? 'WARNING' : 'SUCCESS',
        details: `규정 대조 엔진 검토 (적합 ${fallback.summary?.compliant || 0}, 부적합 ${fallback.summary?.nonCompliant || 0}, 누락 ${fallback.summary?.missing || 0}, 확인필요 ${fallback.summary?.needCheck || 0}, 기술사확인 ${fallback.summary?.engineerReviewCount || 0})`,
        documentSnippet: documentText.slice(0, 300),
        documentLength: documentText.length,
        engineType: 'DETERMINISTIC_FALLBACK',
        modelConfig: modelConfig,
        reviewSummary: fallback.summary,
        reviewResult: fallback,
        userEmail: currentUser?.email || undefined,
      })
        .then(() => refreshHistoryStats())
        .catch((e) => console.warn('Failed to record fallback review history:', e));
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      setIsReviewing(false);
    }
  };

  const handleDriveFileImported = (text: string, fileName: string) => {
    setDocumentText(text);
    setSelectedSample(null);
    setInfoMessage(`Google Drive에서 '${fileName}' 시방서 파일을 성공적으로 불러왔습니다.`);
  };

  const handleOpenDriveExport = (content: string, defaultName: string) => {
    if (!currentUser) {
      setIsDriveModalOpen(true);
      return;
    }
    setDriveExportData({ content, defaultName });
    setIsDriveExportModalOpen(true);
  };

  const handleLoadReviewFromHistory = (result: ReviewResult, snippet?: string) => {
    setReviewResult(result);
    setCurrentSopStep(5);
    if (snippet && snippet.length > 50) {
      setDocumentText(snippet);
    }
    setInfoMessage(`이력에서 '${result.title || '기술 검토 보고서'}' 결과를 성공적으로 불러왔습니다.`);
    setTimeout(() => {
      const el = document.getElementById('review-results-container');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans selection:bg-[#141414] selection:text-white">
      {/* Navigation Header */}
      <Header
        onOpenKnowledge={() => setIsKnowledgeOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenHelp={() => setIsSopGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDrive={() => setIsDriveModalOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        modelConfig={modelConfig}
        currentUser={currentUser}
        knowledgeDocsCount={knowledgeDocs.length}
        historyCount={historyStats?.totalCount || 0}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {/* SOP Workflow Bar */}
        <SopTracker currentStep={currentSopStep} isReviewing={isReviewing} />

        {/* Info / Fallback Notice */}
        {infoMessage && (
          <div className="mb-4 p-3 bg-neutral-100 border border-[#141414] text-xs text-[#141414] font-mono flex items-start justify-between space-x-2">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5 uppercase">[NOTICE]: 알림</span>
                <p className="text-[11px] text-[#141414]/90 font-sans">{infoMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setInfoMessage(null)}
              className="text-xs font-bold hover:underline"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-[#141414] text-xs text-rose-950 font-mono flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 uppercase">[ERROR_ALERT]: 검토 처리 중 오류 발생</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Stacked Layout: Input on top, Result below */}
        <div className="space-y-4">
          {/* Document Input Section */}
          <DocumentInput
            documentText={documentText}
            setDocumentText={setDocumentText}
            selectedSample={selectedSample}
            setSelectedSample={setSelectedSample}
            onStartReview={handleStartReview}
            isReviewing={isReviewing}
            onOpenDrive={() => setIsDriveModalOpen(true)}
            knowledgeDocs={knowledgeDocs}
            onOpenKnowledgeBase={() => setIsKnowledgeOpen(true)}
          />

          {/* Review Results Section */}
          {reviewResult && (
            <div id="review-results-container" className="scroll-mt-16">
              <ReviewResultView
                result={reviewResult}
                onSaveToDrive={handleOpenDriveExport}
                onOpenFeedback={() => setIsFeedbackOpen(true)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating Chat Consultation Button (High Density Style) */}
      <button
        id="btn-open-chat"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center px-3 py-2 bg-[#141414] hover:bg-black text-white font-mono text-xs font-bold uppercase tracking-wider border border-[#141414] shadow-md transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
        <span>AGENT_CONSULTATION (질의응답)</span>
      </button>

      {/* Modals & Drawers */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentUserEmail={currentUser?.email || undefined}
        onOpenFeedbackSurvey={() => {
          setIsAdminOpen(false);
          setIsFeedbackOpen(true);
        }}
      />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        currentUserEmail={currentUser?.email || undefined}
        targetFeature="공사시방서 기술검토"
      />
      <KnowledgeBaseModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
        knowledgeDocs={knowledgeDocs}
        onSyncFolder={handleSyncKnowledgeFolder}
        isSyncingFolder={isSyncingFolder}
        syncProgressText={syncProgressText}
        onOpenDriveLogin={() => setIsDriveModalOpen(true)}
        isLoggedIn={!!currentUser}
      />
      <QuantityCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
      <SopGuideModal
        isOpen={isSopGuideOpen}
        onClose={() => setIsSopGuideOpen(false)}
      />
      <AgentChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        documentContext={documentText}
        knowledgeDocs={knowledgeDocs}
        onOpenKnowledgeBase={() => setIsKnowledgeOpen(true)}
        currentUserEmail={currentUser?.email || undefined}
        onChatSent={refreshHistoryStats}
      />
      <ModelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={modelConfig}
        onChangeConfig={setModelConfig}
      />
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onSelectFileText={handleDriveFileImported}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />
      <DriveExportConfirmModal
        isOpen={isDriveExportModalOpen}
        onClose={() => setIsDriveExportModalOpen(false)}
        reportContent={driveExportData.content}
        defaultFileName={driveExportData.defaultName}
        onSuccess={(fileInfo) => {
          setInfoMessage(`Google Drive에 '${fileInfo.name}' 보고서가 성공적으로 저장되었습니다.`);
          recordHistoryEvent({
            type: 'EXPORT',
            title: `Google Drive 보고서 저장: ${fileInfo.name}`,
            details: `Google Drive에 '${fileInfo.name}' 기술검토서가 성공적으로 보관되었습니다.`,
            metadata: { fileId: fileInfo.id, fileName: fileInfo.name },
            userEmail: currentUser?.email || undefined,
          })
            .then(() => refreshHistoryStats())
            .catch(() => {});
        }}
      />
      <HistoryManagerModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadReview={handleLoadReviewFromHistory}
        onHistoryUpdated={refreshHistoryStats}
      />
    </div>
  );
}
