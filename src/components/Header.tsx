import React from 'react';
import { BookOpen, Calculator, FileCheck2, HelpCircle, ShieldAlert, Cpu, Sliders, HardDrive, History, LayoutDashboard, Star } from 'lucide-react';
import { ModelConfig } from '../types';
import { User } from 'firebase/auth';

interface HeaderProps {
  onOpenKnowledge: () => void;
  onOpenCalculator: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenDrive: () => void;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  onOpenFeedback: () => void;
  modelConfig: ModelConfig;
  currentUser: User | null;
  knowledgeDocsCount?: number;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenKnowledge,
  onOpenCalculator,
  onOpenHelp,
  onOpenSettings,
  onOpenDrive,
  onOpenHistory,
  onOpenAdmin,
  onOpenFeedback,
  modelConfig,
  currentUser,
  knowledgeDocsCount = 0,
  historyCount = 0,
}) => {
  return (
    <header className="bg-[#141414] border-b border-[#141414] text-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 rounded-none bg-white text-[#141414] flex items-center justify-center font-mono font-bold text-xs border border-white flex-shrink-0">
              <FileCheck2 className="w-4 h-4 text-[#141414]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Agent Engine v2.4
                </span>
                <span className="hidden sm:inline-block text-[#141414] bg-white text-[10px] font-mono px-1.5 py-0.2 font-bold uppercase">
                  T:{modelConfig.temperature.toFixed(2)}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-white/90 tracking-tight truncate max-w-[200px] sm:max-w-none">
                정보통신설비 설계도서 기술 검토 Agent
              </h1>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            {/* Admin Dashboard Button */}
            <button
              id="btn-open-admin"
              onClick={onOpenAdmin}
              className="inline-flex items-center px-2 sm:px-2.5 py-1 text-[11px] font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 border border-cyan-300 transition-colors shadow-xs"
              title="관리자 페이지: 사용 현황, 만족도, 대시보드, 시스템 성능 모니터링 & 평가"
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1 text-black" />
              <span>관리자</span>
            </button>

            {/* Satisfaction / Feedback Button */}
            <button
              id="btn-open-feedback"
              onClick={onOpenFeedback}
              className="inline-flex items-center px-2 sm:px-2.5 py-1 text-[11px] font-mono font-semibold text-white bg-[#141414] hover:bg-amber-400 hover:text-black border border-amber-400/70 transition-colors"
              title="시스템 만족도 평가 및 개선 의견 제출"
            >
              <Star className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span className="hidden sm:inline">만족도</span>
            </button>

            <button
              id="btn-open-history"
              onClick={onOpenHistory}
              className="inline-flex items-center px-2 sm:px-2.5 py-1 text-[11px] font-mono font-semibold text-white bg-[#141414] hover:bg-white hover:text-[#141414] border border-white/40 hover:border-white transition-colors"
              title="백엔드 사용 이력 및 검토 히스토리 관리"
            >
              <History className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span className="hidden sm:inline">사용 이력</span>
              {typeof historyCount === 'number' && historyCount > 0 && (
                <span className="ml-1 px-1 bg-cyan-900/70 border border-cyan-400 text-cyan-200 text-[10px] font-bold">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              id="btn-open-drive"
              onClick={onOpenDrive}
              className={`hidden md:inline-flex items-center px-2 sm:px-2.5 py-1 text-[11px] font-mono font-semibold transition-colors border ${
                currentUser
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 hover:bg-emerald-900'
                  : 'bg-[#141414] text-white hover:bg-white hover:text-[#141414] border-white/40 hover:border-white'
              }`}
              title="Google Drive 시방서 파일 연동"
            >
              <HardDrive className={`w-3.5 h-3.5 mr-1 ${currentUser ? 'text-emerald-400' : 'text-cyan-400'}`} />
              <span>{currentUser ? 'G-Drive' : 'Google Drive'}</span>
            </button>

            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="hidden lg:inline-flex items-center px-2 py-1 text-[11px] font-mono font-semibold text-white bg-[#141414] hover:bg-white hover:text-[#141414] border border-white/40 hover:border-white transition-colors"
              title="Temperature & Structured Output 모델 설정"
            >
              <Sliders className="w-3.5 h-3.5 mr-1 text-purple-400" />
              <span>T:{modelConfig.temperature.toFixed(1)}</span>
            </button>

            <button
              id="btn-open-calc"
              onClick={onOpenCalculator}
              className="hidden md:inline-flex items-center px-2 py-1 text-[11px] font-mono font-semibold text-white bg-[#141414] hover:bg-white hover:text-[#141414] border border-white/30 hover:border-white transition-colors"
              title="수량산출 여유율 검산기"
            >
              <Calculator className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>검산기</span>
            </button>

            <button
              id="btn-open-knowledge"
              onClick={onOpenKnowledge}
              className={`inline-flex items-center px-2 sm:px-2.5 py-1 text-[11px] font-mono font-semibold transition-colors border ${
                knowledgeDocsCount > 0
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 hover:bg-emerald-900'
                  : 'text-white bg-[#141414] hover:bg-white hover:text-[#141414] border-white/30 hover:border-white'
              }`}
              title="설계기준, 표준품셈 및 G-Drive 지식 문서 열람"
            >
              <BookOpen className={`w-3.5 h-3.5 mr-1 ${knowledgeDocsCount > 0 ? 'text-emerald-400' : 'text-blue-400'}`} />
              <span>지식 {knowledgeDocsCount > 0 && `(${knowledgeDocsCount})`}</span>
            </button>

            <button
              id="btn-open-sop-guide"
              onClick={onOpenHelp}
              className="hidden sm:inline-flex items-center px-2 py-1 text-[11px] font-mono font-semibold text-white/80 hover:text-white bg-[#141414] hover:bg-white hover:text-[#141414] border border-white/20 hover:border-white transition-colors"
              title="검토 지침 및 SOP 안내"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span>지침</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


