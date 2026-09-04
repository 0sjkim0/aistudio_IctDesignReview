import React from 'react';
import { CheckCircle2, Clock, Search, Layers, Scale, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface SopTrackerProps {
  currentStep: number; // 0: 대기, 1~5: 진행중 또는 완료
  isReviewing: boolean;
}

export const SopTracker: React.FC<SopTrackerProps> = ({ currentStep, isReviewing }) => {
  const steps = [
    {
      step: 1,
      title: '문서 구성 파악 (13개 항목)',
      desc: '필수 기재사항 확인',
    },
    {
      step: 2,
      title: '수치 및 부등호 대조',
      desc: '규격·면적·저항값 대조',
    },
    {
      step: 3,
      title: '조항 현행성 (제19조)',
      desc: '폐지 조항 인용 검증',
    },
    {
      step: 4,
      title: '내부 정합성 (제18조)',
      desc: '층수·수량 여유율 검산',
    },
    {
      step: 5,
      title: '최종 결과 표 정리',
      desc: '판정 표 & 기술사 확인 요망',
    },
  ];

  return (
    <div className="bg-white border border-[#141414] p-3 sm:p-4 mb-4">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#141414]/20">
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#141414] bg-[#E4E3E0] px-2 py-0.5 border border-[#141414]">
            SOP_WORKFLOW_ENGINE
          </span>
          <h2 className="text-xs font-bold text-[#141414] tracking-tight uppercase">
            기술 검토 Agent 표준 운영 절차 (SOP 5단계)
          </h2>
        </div>
        {isReviewing ? (
          <div className="flex items-center space-x-1.5 text-[11px] text-blue-700 font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>ANALYZING_DOCUMENT_STAGE_0{currentStep}</span>
          </div>
        ) : (
          <div className="text-[10px] font-mono text-[#141414]/60 uppercase">
            STATUS: {currentStep === 5 ? 'COMPLETED' : 'STANDBY'}
          </div>
        )}
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {steps.map((item) => {
          const isDone = currentStep > item.step || (currentStep === 5 && !isReviewing);
          const isCurrent = isReviewing && currentStep === item.step;

          let badgeStyle = 'border border-[#141414] bg-white text-[#141414]';
          let itemStyle = 'border border-[#141414]/30 bg-[#E4E3E0]/30 opacity-70';
          let titleStyle = 'text-[#141414] font-medium';

          if (isDone) {
            badgeStyle = 'bg-[#141414] text-white border border-[#141414]';
            itemStyle = 'border border-[#141414] bg-white opacity-100';
            titleStyle = 'text-[#141414] font-bold';
          } else if (isCurrent) {
            badgeStyle = 'bg-blue-600 text-white border border-blue-600 animate-pulse';
            itemStyle = 'border-2 border-blue-600 bg-blue-50/50 opacity-100';
            titleStyle = 'text-blue-700 font-bold';
          }

          return (
            <div
              key={item.step}
              className={`p-2 transition-all flex items-start space-x-2 ${itemStyle}`}
            >
              <div
                className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-mono font-bold mt-0.5 ${badgeStyle}`}
              >
                {item.step}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[11px] leading-tight truncate ${titleStyle}`}>
                  {item.title}
                </div>
                <div className="text-[10px] text-[#141414]/60 font-mono truncate mt-0.5">
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

