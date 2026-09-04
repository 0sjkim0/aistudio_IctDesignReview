import React from 'react';
import { HelpCircle, X, Shield, CheckSquare, ListOrdered, FileSpreadsheet } from 'lucide-react';

interface SopGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SopGuideModal: React.FC<SopGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#141414]/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#141414] w-full max-w-3xl flex flex-col overflow-hidden shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#141414] bg-[#141414] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white text-[#141414] flex items-center justify-center font-mono font-bold text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-[#141414]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">SOP_DIRECTIVES</span>
                <span className="bg-white text-[#141414] text-[9px] font-mono px-1 font-bold">GUIDELINES</span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                기술 검토 Agent 운영 지침 및 표준 행동 수칙
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

        {/* Content */}
        <div className="p-4 space-y-4 text-xs text-[#141414] overflow-y-auto bg-white">
          {/* 1. Role */}
          <div className="p-3 bg-[#E4E3E0] border border-[#141414]">
            <h4 className="font-bold text-xs font-mono uppercase text-[#141414] flex items-center mb-1">
              <Shield className="w-3.5 h-3.5 mr-1 text-[#141414]" />
              [역할] 정보통신설비 기술 검토자
            </h4>
            <p className="text-xs leading-relaxed font-sans text-[#141414]">
              당신은 정보통신설비 설계도서를 검토하는 기술 검토자입니다. 제출된 공사시방서가 「정보통신설비 설계기준」에 적합한지 조문 단위로 대조해 판정합니다.
            </p>
          </div>

          {/* 2. Behavioral Principles */}
          <div className="p-3 bg-white border border-[#141414] space-y-2">
            <h4 className="font-bold text-xs font-mono uppercase text-[#141414] flex items-center">
              <CheckSquare className="w-3.5 h-3.5 mr-1 text-[#141414]" />
              [행동 원칙 5대 수칙]
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-[#141414] leading-relaxed font-sans">
              <li>판단의 근거는 지식 파일에 있는 조문에서만 가져온다. 일반 상식이나 다른 기준으로 답하지 않는다.</li>
              <li>근거를 찾지 못하면 <strong>「근거 조항 없음 — 확인 필요」</strong>라고 적는다. 추정하지 않는다.</li>
              <li>수치는 시방서 기재값과 기준값을 나란히 적고, 부등호 방향(이상/이하)까지 확인한다.</li>
              <li>값이 맞더라도 인용한 조항 번호가 폐지된 것이면 근거 오류로 본다. (제19조 경과조치)</li>
              <li>문서에 없는 것을 찾아야 할 때는 별도로 주어진 체크리스트와 본문을 1:1로 대조한다.</li>
            </ol>
          </div>

          {/* 3. SOP 5 Steps */}
          <div className="p-3 bg-white border border-[#141414] space-y-2 font-mono">
            <h4 className="font-bold text-xs uppercase text-[#141414] flex items-center">
              <ListOrdered className="w-3.5 h-3.5 mr-1 text-[#141414]" />
              [SOP 5단계 검토 절차]
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 bg-[#E4E3E0] border border-[#141414]">
                <strong>STEP_1 (항목 파악) :</strong> 대상 문서의 목차와 본문 구성을 훑어 어떤 항목이 기재되어 있는지 파악 (13개 체크리스트).
              </div>
              <div className="p-2 bg-[#E4E3E0] border border-[#141414]">
                <strong>STEP_2 (수치 대조) :</strong> 기재된 수치를 기준 조문의 수치(규격, 면적, 저항값, 여유율 등)와 1:1 대조.
              </div>
              <div className="p-2 bg-[#E4E3E0] border border-[#141414]">
                <strong>STEP_3 (조항 유효성) :</strong> 인용된 조항 번호가 현행 조항인지 제19조(경과조치)로 유효성 확인.
              </div>
              <div className="p-2 bg-[#E4E3E0] border border-[#141414]">
                <strong>STEP_4 (교차 검증) :</strong> 문서 내부에서 어긋나는 기재(층수·규모·수량 합계 계산)가 있는지 교차 검산.
              </div>
              <div className="p-2 bg-[#E4E3E0] border border-[#141414]">
                <strong>STEP_5 (결과 표 작성) :</strong> 결과를 [출력 규칙]의 8열 매트릭스로 정리하고 확신도 및 경고문 출력.
              </div>
            </div>
          </div>

          {/* 4. Output Rules & Checkpoint */}
          <div className="p-3 bg-amber-50 border border-[#141414] space-y-2 font-mono text-xs text-amber-950">
            <h4 className="font-bold uppercase text-amber-900 flex items-center">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-amber-800" />
              [출력 규칙 & 체크포인트]
            </h4>
            <ul className="list-disc list-inside space-y-1 leading-relaxed">
              <li>표 형식 : <code>| No | 검토 항목 | 시방서 기재 | 기준값 | 근거 조항 | 판정 | 확신도 | 비고 |</code></li>
              <li>판정 : <strong>적합 / 부적합 / 누락 / 확인 필요</strong> 중 하나로만 표기</li>
              <li>확신도 : <strong>상 / 중 / 하</strong> 로만 표기</li>
              <li>확신도가 '하'인 행의 비고 : 반드시 <strong>[기술사 확인 요망]</strong> 기재</li>
              <li>최종 출력 시 표 아래 필수 문장 :<br />
                <span className="font-bold text-amber-900">
                  「본 결과는 검토 초안이며 기술사의 확인 후 사용해야 합니다.」
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#141414] bg-[#E4E3E0] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#141414] text-white hover:bg-black font-bold font-mono text-xs border border-[#141414] transition-colors"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};
