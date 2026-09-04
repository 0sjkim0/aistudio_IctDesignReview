import React, { useState } from 'react';
import { KNOWLEDGE_ARTICLES } from '../data/knowledgeBase';
import {
  BookOpen,
  X,
  Search,
  Scale,
  FileCheck,
  AlertTriangle,
  ExternalLink,
  Layers,
  HardDrive,
  RefreshCw,
  FileText,
  FileCode,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { KnowledgeDoc } from '../types';
import { KNOWLEDGE_FOLDER_ID, KNOWLEDGE_FOLDER_URL } from '../services/googleDriveService';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeDocs: KnowledgeDoc[];
  onSyncFolder: () => Promise<void>;
  isSyncingFolder: boolean;
  syncProgressText?: string;
  onOpenDriveLogin?: () => void;
  isLoggedIn: boolean;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  knowledgeDocs,
  onSyncFolder,
  isSyncingFolder,
  syncProgressText,
  onOpenDriveLogin,
  isLoggedIn,
}) => {
  const [activeTab, setActiveTab] = useState<'standards' | 'cost' | 'checklist' | 'gdrive'>('standards');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredArticles = KNOWLEDGE_ARTICLES.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.articleNo.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.keyValues?.some((k) => k.toLowerCase().includes(q))
    );
  });

  const getDocIcon = (mimeType: string, name: string) => {
    if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-4 h-4 text-red-600 shrink-0" />;
    }
    if (mimeType.includes('document') || name.endsWith('.docx') || name.endsWith('.hwp')) {
      return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    if (mimeType.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
      return <FileText className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    return <FileCode className="w-4 h-4 text-neutral-600 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#141414]/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#141414] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#141414] bg-[#141414] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white text-[#141414] flex items-center justify-center font-mono font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5 text-[#141414]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">KNOWLEDGE_BASE</span>
                <span className="bg-white text-[#141414] text-[9px] font-mono px-1 font-bold">2024_REVISED</span>
                {knowledgeDocs.length > 0 && (
                  <span className="bg-emerald-600 text-white text-[9px] font-mono px-1.5 font-bold">
                    GDRIVE_{knowledgeDocs.length}_DOCS_SYNCED
                  </span>
                )}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                설계기준 조문, 표준품셈 및 구글 드라이브 지식 베이스
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 hover:bg-neutral-800 transition-colors font-mono text-xs border border-white/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar & Search */}
        <div className="px-4 py-2 bg-[#E4E3E0] border-b border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 font-mono text-[11px] font-bold">
            <button
              onClick={() => setActiveTab('standards')}
              className={`px-2.5 py-1 border transition-colors ${
                activeTab === 'standards'
                  ? 'bg-[#141414] text-white border-[#141414]'
                  : 'bg-white text-[#141414] hover:bg-neutral-200 border-[#141414]/40'
              }`}
            >
              설계기준 (제1~20조)
            </button>
            <button
              onClick={() => setActiveTab('cost')}
              className={`px-2.5 py-1 border transition-colors ${
                activeTab === 'cost'
                  ? 'bg-[#141414] text-white border-[#141414]'
                  : 'bg-white text-[#141414] hover:bg-neutral-200 border-[#141414]/40'
              }`}
            >
              표준품셈 & 할증
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-2.5 py-1 border transition-colors ${
                activeTab === 'checklist'
                  ? 'bg-[#141414] text-white border-[#141414]'
                  : 'bg-white text-[#141414] hover:bg-neutral-200 border-[#141414]/40'
              }`}
            >
              13개 체크리스트
            </button>
            <button
              onClick={() => setActiveTab('gdrive')}
              className={`px-2.5 py-1 border transition-colors flex items-center space-x-1 ${
                activeTab === 'gdrive'
                  ? 'bg-emerald-900 text-white border-emerald-950'
                  : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border-emerald-700/60'
              }`}
            >
              <HardDrive className="w-3 h-3 text-emerald-500" />
              <span>G-Drive 지식 폴더 ({knowledgeDocs.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3 h-3 absolute left-2.5 top-2 text-[#141414]/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH_ARTICLES..."
              className="w-full pl-7 pr-2 py-1 text-xs font-mono bg-white border border-[#141414] focus:outline-none"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {/* Tab 4: Google Drive Knowledge Folder */}
          {activeTab === 'gdrive' && (
            <div className="space-y-4 text-xs font-sans text-[#141414]">
              {/* Folder Connection Header Card */}
              <div className="p-3.5 bg-emerald-50/70 border-2 border-emerald-800 space-y-2.5 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/30 pb-2">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                        <span>GOOGLE DRIVE 지식 문서 저장소 연동</span>
                        <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 font-mono font-bold">
                          ACTIVE_GROUNDING
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-900/80 break-all font-mono">
                        폴더 ID: <strong>{KNOWLEDGE_FOLDER_ID}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={KNOWLEDGE_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold bg-white text-emerald-900 border border-emerald-800 hover:bg-emerald-900 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      드라이브에서 폴더 열기
                    </a>

                    {isLoggedIn ? (
                      <button
                        onClick={onSyncFolder}
                        disabled={isSyncingFolder}
                        className="inline-flex items-center px-3 py-1 text-[11px] font-bold bg-emerald-800 text-white hover:bg-emerald-950 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {isSyncingFolder ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            <span>동기화 중...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            <span>지식 문서 동기화</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={onOpenDriveLogin}
                        className="inline-flex items-center px-3 py-1 text-[11px] font-bold bg-[#141414] text-white hover:bg-black transition-colors"
                      >
                        Google 로그인 후 동기화
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] font-sans text-emerald-950/90 leading-relaxed">
                  위 구글 드라이브 지정 폴더(<code>130_ODKMoiup3SdE7wxQWBiFpceF_vqVr</code>)에 정보통신설비 설계기준, 지침, 표준품셈, 사내 표준 등 지식 문서를 업로드한 후 <strong>[지식 문서 동기화]</strong>를 누르면, AI 기술검토 및 Agent 상담 시 이 폴더 내 모든 문서를 <strong>최우선 판단 근거(Grounding Reference)</strong>로 활용합니다.
                </p>

                {syncProgressText && (
                  <div className="p-2 bg-white border border-emerald-600 text-emerald-900 text-xs flex items-center space-x-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    <span>{syncProgressText}</span>
                  </div>
                )}
              </div>

              {/* Synced Document List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold uppercase text-[#141414]">
                    동기화된 지식 문서 목록 ({knowledgeDocs.length}건 탑재됨)
                  </span>
                  <span className="text-[11px] text-[#141414]/60">
                    {knowledgeDocs.length > 0
                      ? `최근 동기화: ${new Date(knowledgeDocs[0].syncedAt).toLocaleTimeString('ko-KR')}`
                      : '동기화된 문서 없음'}
                  </span>
                </div>

                {knowledgeDocs.length === 0 ? (
                  <div className="border border-dashed border-[#141414]/40 bg-[#E4E3E0]/20 p-8 text-center space-y-2">
                    <FolderOpen className="w-8 h-8 mx-auto text-[#141414]/40" />
                    <div className="font-mono text-xs font-bold text-[#141414]">
                      아직 동기화된 드라이브 지식 문서가 없습니다.
                    </div>
                    <p className="text-[11px] text-[#141414]/70 max-w-md mx-auto">
                      상단의 [지식 문서 동기화] 버튼을 누르면 연동된 구글 드라이브 폴더의 모든 문서(PDF, Google Docs, TXT 등)를 읽어와 AI 판단 근거로 즉시 장착합니다.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#141414] divide-y divide-[#141414]/20">
                    {knowledgeDocs.map((doc) => {
                      const isPreviewing = previewDocId === doc.id;
                      return (
                        <div key={doc.id} className="p-3 bg-white hover:bg-neutral-50 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              {getDocIcon(doc.mimeType, doc.name)}
                              <span className="font-mono font-bold text-xs text-[#141414] truncate">
                                {doc.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-400 shrink-0">
                                {doc.extractedLength.toLocaleString()} 자 추출됨
                              </span>
                            </div>

                            <button
                              onClick={() => setPreviewDocId(isPreviewing ? null : doc.id)}
                              className="px-2 py-0.5 text-[11px] font-mono border border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-colors shrink-0"
                            >
                              {isPreviewing ? '내용 닫기' : '내용 미리보기'}
                            </button>
                          </div>

                          {isPreviewing && (
                            <div className="mt-2.5 p-2.5 bg-[#E4E3E0]/40 border border-[#141414] max-h-48 overflow-y-auto">
                              <pre className="text-[10px] font-mono whitespace-pre-wrap text-[#141414]/90">
                                {doc.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 1: 설계기준 */}
          {activeTab === 'standards' && (
            <div className="space-y-3">
              {/* Deprecated vs Current Summary Notice */}
              <div className="p-2.5 bg-amber-50 border border-[#141414] text-xs text-amber-950 font-mono">
                <div className="font-bold flex items-center space-x-1 mb-1 text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 inline" />
                  <span>[제19조 경과조치] 구 조항 폐지 및 조문 이동 대응표:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 font-mono text-[11px] mt-1">
                  <div className="bg-white p-1.5 border border-[#141414]/30">
                    구 제8조(배선 규격) → <strong>현행 제6조</strong>
                  </div>
                  <div className="bg-white p-1.5 border border-[#141414]/30">
                    구 제11조(통신실 면적) → <strong>현행 제7조</strong>
                  </div>
                  <div className="bg-white p-1.5 border border-[#141414]/30">
                    구 제14조(접지저항) → <strong>현행 제9조</strong>
                  </div>
                </div>
              </div>

              {/* Articles List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredArticles.map((art) => (
                  <div
                    key={art.articleNo}
                    className="p-3 border border-[#141414] bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#141414]/20">
                        <span className="text-[10px] font-mono font-bold bg-[#141414] text-white px-1.5 py-0.2">
                          {art.articleNo}
                        </span>
                        <span className="text-xs font-bold text-[#141414]">{art.title}</span>
                      </div>
                      <p className="text-xs text-[#141414]/90 whitespace-pre-line leading-relaxed font-sans">
                        {art.content}
                      </p>
                    </div>

                    {art.keyValues && art.keyValues.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#141414]/10 flex flex-wrap gap-1">
                        {art.keyValues.map((k, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono font-medium bg-[#E4E3E0] text-[#141414] px-1.5 py-0.2 border border-[#141414]/30"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: 표준품셈 */}
          {activeTab === 'cost' && (
            <div className="space-y-4 text-xs text-[#141414]">
              {/* Section 1: Principles */}
              <div className="p-3 bg-white border border-[#141414] space-y-2">
                <h4 className="font-bold text-xs font-mono uppercase text-[#141414] flex items-center">
                  <Scale className="w-3.5 h-3.5 mr-1 text-[#141414]" />
                  1. 수량 산출의 원칙 (표준품셈)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-[#141414]/90 font-sans">
                  <li>① 배관·배선의 물량은 설계도면상의 실측 연장을 기준으로 산출한다.</li>
                  <li>② 산출한 실측 연장에 「정보통신설비 설계기준」 제12조에 따른 여유율 5% 이상을 가산한다.</li>
                  <li>③ 수량산출서의 합계는 항목별 산출량의 총합에 여유율을 가산한 값과 일치하여야 한다.</li>
                  <li>④ 단자함·성단·시험은 개소 또는 회선 단위로 산출한다.</li>
                </ul>
                <div className="p-2 bg-[#E4E3E0] border border-[#141414] text-[#141414] font-mono text-[11px] mt-2">
                  <strong>[검산 예시]</strong> 항목별 합계 320m + 300m + 300m + 40m = 960m<br />
                  여유율 5% 가산 : 960m × 1.05 = <strong>1,008m</strong> (수량산출서 합계와 일치 필수)
                </div>
              </div>

              {/* Section 2: 품셈표 */}
              <div className="border border-[#141414] overflow-hidden">
                <div className="bg-[#141414] text-white px-3 py-1.5 font-mono text-xs font-bold uppercase">
                  2. 표준품셈 단위 소요품 (인/단위)
                </div>
                <table className="min-w-full border-collapse text-[11px] font-mono bg-white">
                  <thead className="bg-[#E4E3E0] text-[#141414] font-bold border-b border-[#141414]">
                    <tr>
                      <th className="border border-[#141414] p-1.5 text-left">공종</th>
                      <th className="border border-[#141414] p-1.5 text-left">규격</th>
                      <th className="border border-[#141414] p-1.5 text-center">단위</th>
                      <th className="border border-[#141414] p-1.5 text-right">정보통신기사</th>
                      <th className="border border-[#141414] p-1.5 text-right">보통인부</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">배관</td><td className="border border-[#141414] p-1.5">합성수지제 가요전선관 22mm</td><td className="border border-[#141414] p-1.5 text-center">m</td><td className="border border-[#141414] p-1.5 text-right">0.080</td><td className="border border-[#141414] p-1.5 text-right">0.010</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">배관</td><td className="border border-[#141414] p-1.5">합성수지제 가요전선관 28mm</td><td className="border border-[#141414] p-1.5 text-center">m</td><td className="border border-[#141414] p-1.5 text-right">0.092</td><td className="border border-[#141414] p-1.5 text-right">0.012</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">배관</td><td className="border border-[#141414] p-1.5">합성수지제 가요전선관 36mm</td><td className="border border-[#141414] p-1.5 text-center">m</td><td className="border border-[#141414] p-1.5 text-right">0.110</td><td className="border border-[#141414] p-1.5 text-right">0.014</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">배관</td><td className="border border-[#141414] p-1.5">합성수지제 가요전선관 54mm</td><td className="border border-[#141414] p-1.5 text-center">m</td><td className="border border-[#141414] p-1.5 text-right">0.145</td><td className="border border-[#141414] p-1.5 text-right">0.018</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">배선</td><td className="border border-[#141414] p-1.5">연선케이블 Cat.6 (4페어)</td><td className="border border-[#141414] p-1.5 text-center">m</td><td className="border border-[#141414] p-1.5 text-right">0.021</td><td className="border border-[#141414] p-1.5 text-right">0.003</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">배선</td><td className="border border-[#141414] p-1.5">광케이블 SM 12코어</td><td className="border border-[#141414] p-1.5 text-center">m</td><td className="border border-[#141414] p-1.5 text-right">0.038</td><td className="border border-[#141414] p-1.5 text-right">0.006</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">단자함</td><td className="border border-[#141414] p-1.5">세대·실 단자함 300×400×80</td><td className="border border-[#141414] p-1.5 text-center">개</td><td className="border border-[#141414] p-1.5 text-right">0.62</td><td className="border border-[#141414] p-1.5 text-right">0.08</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">단자함</td><td className="border border-[#141414] p-1.5">층 단자함 400×500×100</td><td className="border border-[#141414] p-1.5 text-center">개</td><td className="border border-[#141414] p-1.5 text-right">0.95</td><td className="border border-[#141414] p-1.5 text-right">0.12</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">단자함</td><td className="border border-[#141414] p-1.5">주단자함 600×800×150</td><td className="border border-[#141414] p-1.5 text-center">개</td><td className="border border-[#141414] p-1.5 text-right">1.85</td><td className="border border-[#141414] p-1.5 text-right">0.24</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">접지</td><td className="border border-[#141414] p-1.5">접지극 매설 및 접지선 포설</td><td className="border border-[#141414] p-1.5 text-center">개소</td><td className="border border-[#141414] p-1.5 text-right">1.20</td><td className="border border-[#141414] p-1.5 text-right">0.30</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">시험</td><td className="border border-[#141414] p-1.5">배선 도통 및 성능시험</td><td className="border border-[#141414] p-1.5 text-center">회선</td><td className="border border-[#141414] p-1.5 text-right">0.05</td><td className="border border-[#141414] p-1.5 text-right">0.01</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: 할증 */}
              <div className="border border-[#141414] overflow-hidden">
                <div className="bg-[#141414] text-white px-3 py-1.5 font-mono text-xs font-bold uppercase">
                  3. 법정 할증 및 가산율
                </div>
                <table className="min-w-full border-collapse text-[11px] font-mono bg-white">
                  <thead className="bg-[#E4E3E0] text-[#141414] font-bold border-b border-[#141414]">
                    <tr>
                      <th className="border border-[#141414] p-1.5 text-left">구분</th>
                      <th className="border border-[#141414] p-1.5 text-center w-24">가산율</th>
                      <th className="border border-[#141414] p-1.5 text-left">적용 조건</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-[#141414] p-1.5 font-bold text-blue-700">배관 여유율</td><td className="border border-[#141414] p-1.5 text-center font-bold">5% 이상</td><td className="border border-[#141414] p-1.5">설계기준 제12조 제1항 — 모든 배관 물량에 적용</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">고소작업</td><td className="border border-[#141414] p-1.5 text-center font-bold">20%</td><td className="border border-[#141414] p-1.5">바닥에서 5미터를 초과하는 높이의 작업</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">야간작업</td><td className="border border-[#141414] p-1.5 text-center font-bold">25%</td><td className="border border-[#141414] p-1.5">22시부터 06시까지 수행하는 작업</td></tr>
                    <tr><td className="border border-[#141414] p-1.5 font-bold">협소부위</td><td className="border border-[#141414] p-1.5 text-center font-bold">15%</td><td className="border border-[#141414] p-1.5">천장 내부 등 작업공간이 제한되는 부위</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: 체크리스트 */}
          {activeTab === 'checklist' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] text-[#141414]">
                <strong>[제4조 13개 필수 기재항목 점검]</strong> 시방서 본문에 해당 항목이 없으면 「누락」으로 판정하며 목차에만 있고 본문이 없는 경우도 동일하게 판정합니다.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { no: 1, title: '일반사항', desc: '공사명·위치·규모(층수·연면적)·적용 기준 기재 여부' },
                  { no: 2, title: '배관공사', desc: '배관 종류와 최소 규격(수평 22mm, 수직 36mm, 인입 54mm)' },
                  { no: 3, title: '배선공사', desc: '간선(광 12코어), 수평(Cat.6), 방송용 동축 배선 규격' },
                  { no: 4, title: '구내통신선로설비', desc: '구내통신실 위치·면적, 선로 구성 기재' },
                  { no: 5, title: '단자함 및 성단', desc: '주단자함·층단자함·세대단자함 규격 및 성단 방식' },
                  { no: 6, title: '접지설비', desc: '접지방식, 접지저항 기준(단독 10Ω, 종합 5Ω), 접지선 규격(6㎟)' },
                  { no: 7, title: '방송공동수신설비', desc: '수신 대상 방송, 세대 인출구 신호레벨 (47~77 dBμV)' },
                  { no: 8, title: '구내방송설비', desc: '층별/구역별 선택방송 구성 및 비상방송 겸용 여부' },
                  { no: 9, title: '수량산출 및 물량', desc: '항목별 산출량, 여유율(5%), 합계 기재 및 상호 일치' },
                  { no: 10, title: '시험 및 검사', desc: '준공 전 4대 필수 시험 항목 기재 (도통, 접지, 신호, 음압)' },
                  { no: 11, title: '자재의 승인', desc: '자재 승인 절차 및 감리원 제출서류 기재' },
                  { no: 12, title: '안전 및 보건관리', desc: '안전조직, 위험요인 대책, 안전교육, 보호구, 보고체계 5대 항목' },
                  { no: 13, title: '준공서류 및 하자보수', desc: '준공 제출서류 목록 및 하자담보책임기간 명시' },
                ].map((item) => (
                  <div key={item.no} className="p-2.5 bg-white border border-[#141414]">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="w-4 h-4 bg-[#141414] text-white flex items-center justify-center text-[10px] font-bold">
                        {item.no}
                      </span>
                      <span className="font-bold text-[#141414] font-sans">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-[#141414]/80 font-sans">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#141414] bg-[#E4E3E0] flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#141414]/70">※ 지식 파일: 2024 전부개정 설계기준, 2026 표준품셈 및 G-Drive 지식문서</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#141414] text-white hover:bg-black font-bold border border-[#141414] transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
