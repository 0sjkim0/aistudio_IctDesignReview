import React, { useState } from 'react';
import { Calculator, X, CheckCircle2, AlertCircle, Plus, Trash2, RotateCcw } from 'lucide-react';

interface QuantityCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuantityCalculator: React.FC<QuantityCalculatorProps> = ({ isOpen, onClose }) => {
  const [segments, setSegments] = useState<number[]>([320, 300, 300, 40]);
  const [newSegment, setNewSegment] = useState<string>('');
  const [marginRate, setMarginRate] = useState<number>(5); // Default 5%
  const [enteredTotal, setEnteredTotal] = useState<string>('1008'); // Value from specification to check

  if (!isOpen) return null;

  const rawSum = segments.reduce((acc, curr) => acc + curr, 0);
  const calculatedTotal = Math.round(rawSum * (1 + marginRate / 100) * 100) / 100;

  const enteredVal = parseFloat(enteredTotal);
  const isMatch = !isNaN(enteredVal) && Math.abs(enteredVal - calculatedTotal) < 0.01;

  const handleAddSegment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newSegment);
    if (!isNaN(val) && val > 0) {
      setSegments([...segments, val]);
      setNewSegment('');
    }
  };

  const handleRemoveSegment = (idx: number) => {
    setSegments(segments.filter((_, i) => i !== idx));
  };

  const handleResetExample = () => {
    setSegments([320, 300, 300, 40]);
    setMarginRate(5);
    setEnteredTotal('1008');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#141414]/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#141414] w-full max-w-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#141414] bg-[#141414] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white text-[#141414] flex items-center justify-center font-mono font-bold text-xs">
              <Calculator className="w-3.5 h-3.5 text-[#141414]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">CALCULATOR</span>
                <span className="bg-white text-[#141414] text-[9px] font-mono px-1 font-bold">ARTICLE_12</span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                수량산출 여유율 검산기 (제12조 & 품셈)
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

        {/* Body */}
        <div className="p-4 space-y-4 text-xs text-[#141414] font-mono bg-white">
          {/* Rule banner */}
          <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] text-[#141414] leading-relaxed font-sans text-xs">
            <strong>제12조 제1항 & 제2항 기준 :</strong> 실측 연장에 5% 이상의 여유율을 가산하며, 수량산출서의 합계는 항목별 산출량 총합에 여유율을 가산한 계산값과 일치하여야 합니다.
          </div>

          {/* Segments input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[#141414] text-xs">1. 구간별 실측 연장 목록 (m)</span>
              <button
                onClick={handleResetExample}
                className="text-[11px] text-blue-700 hover:underline flex items-center font-bold"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                예시 데이터 복원 (960m)
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {segments.map((seg, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 bg-[#E4E3E0] border border-[#141414] text-[#141414] font-mono text-xs"
                >
                  {seg}m
                  <button
                    onClick={() => handleRemoveSegment(idx)}
                    className="ml-1.5 text-[#141414]/60 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddSegment} className="flex gap-1.5">
              <input
                type="number"
                step="any"
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value)}
                placeholder="구간 실측 연장 입력 (예: 120)"
                className="flex-1 px-2.5 py-1 bg-white border border-[#141414] text-xs font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-[#141414] text-white font-bold hover:bg-black border border-[#141414] transition-colors flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />
                ADD
              </button>
            </form>
          </div>

          {/* Formula calculation box */}
          <div className="p-3 bg-white border border-[#141414] space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[#141414]/70">실측 연장 합계:</span>
              <span className="font-bold text-[#141414] text-xs">{rawSum.toLocaleString()} m</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-[#141414]/70 flex items-center">
                법정 최소 여유율:
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={marginRate}
                  onChange={(e) => setMarginRate(parseFloat(e.target.value) || 0)}
                  className="w-12 ml-1.5 px-1 py-0.2 bg-white border border-[#141414] text-center text-xs"
                />
                %
              </span>
              <span className="text-[#141414]">× {(1 + marginRate / 100).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-[#141414] flex items-center justify-between font-mono">
              <span className="font-bold text-[#141414]">법정 계산 합계값 (기준값):</span>
              <span className="font-bold text-emerald-700 text-sm">
                {calculatedTotal.toLocaleString()} m
              </span>
            </div>
          </div>

          {/* Comparison with Specification Total */}
          <div className="p-3 border border-[#141414] space-y-2.5 bg-white">
            <label className="block font-bold text-[#141414] text-xs">
              2. 시방서 또는 수량산출서 기재 합계값 대조
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="any"
                  value={enteredTotal}
                  onChange={(e) => setEnteredTotal(e.target.value)}
                  placeholder="시방서 기재 최종 합계 (m)"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#141414] text-xs font-mono focus:outline-none font-bold"
                />
                <span className="absolute right-2.5 top-1.5 text-[#141414]/50 font-mono">m</span>
              </div>
            </div>

            {/* Verdict */}
            {enteredTotal !== '' && (
              <div
                className={`p-2.5 border text-xs font-sans ${
                  isMatch
                    ? 'bg-emerald-50 border-[#141414] text-emerald-950'
                    : 'bg-rose-50 border-[#141414] text-rose-950'
                }`}
              >
                {isMatch ? (
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold font-mono block text-emerald-800">[적합] 수량산출서 합계 일치</span>
                      <span className="text-[11px] text-emerald-900 leading-normal">
                        기재값({enteredVal}m)이 실측 합계({rawSum}m)에 여유율 {marginRate}%를 가산한 값({calculatedTotal}m)과 정확히 일치합니다.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold font-mono block text-rose-800">[부적합 / 계산 오류] 수량산출서 불일치</span>
                      <span className="text-[11px] text-rose-900 leading-normal">
                        시방서 기재값은 {enteredVal || 0}m이나, 법정 계산값은 {calculatedTotal}m이어야 합니다. (제12조 제2항 위반)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#141414] bg-[#E4E3E0] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#141414] text-white hover:bg-black font-bold font-mono text-xs border border-[#141414] transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
