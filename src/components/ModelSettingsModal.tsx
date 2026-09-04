import React from 'react';
import { ModelConfig } from '../types';
import { Sliders, HelpCircle, RotateCcw, Cpu, Check, ShieldCheck, Code2 } from 'lucide-react';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ModelConfig;
  onChangeConfig: (newConfig: ModelConfig) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  const handleResetDefaults = () => {
    onChangeConfig({
      temperature: 0.1,
      useStructuredOutput: true,
      strictness: 'strict',
      topP: 0.95,
    });
  };

  const getPresetLabel = (temp: number) => {
    if (temp <= 0.1) return '엄격/결정론적 (조문 대조 권장)';
    if (temp <= 0.4) return '정밀 분석';
    if (temp <= 0.7) return '표준 균형';
    return '창의/유연 탐색';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-white border-2 border-[#141414] w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl text-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141414] text-white border-b border-[#141414]">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider">
              AI_ENGINE_CONFIGURATION [모델 매개변수 설정]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm font-mono px-1.5 py-0.5 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs font-sans">
          {/* Temperature Setting */}
          <div className="border border-[#141414] p-3.5 bg-[#E4E3E0]/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-xs uppercase text-[#141414]">
                  TEMPERATURE (온도)
                </span>
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 bg-[#141414] text-white">
                  {config.temperature.toFixed(2)}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#141414]/70">
                {getPresetLabel(config.temperature)}
              </span>
            </div>

            <p className="text-[11px] text-[#141414]/80 mb-3 leading-relaxed">
              출력의 무작위성을 제어합니다. 시방서 및 설계기준 검토는 환각(Hallucination) 방지와 일관된 조문 판정을 위해 <strong>0.00 ~ 0.10</strong> 설정을 강력히 권장합니다.
            </p>

            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={config.temperature}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#141414] cursor-pointer h-2 bg-neutral-200"
            />

            <div className="flex justify-between text-[10px] font-mono text-[#141414]/60 mt-1">
              <span>0.0 (완전 결정론적)</span>
              <span>0.1 (권장 기준값)</span>
              <span>0.5 (균형)</span>
              <span>1.0 (창의적)</span>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-[#141414]/20">
              <button
                onClick={() => onChangeConfig({ ...config, temperature: 0.0 })}
                className={`px-2 py-0.5 text-[10px] font-mono border ${
                  config.temperature === 0.0
                    ? 'bg-[#141414] text-white border-[#141414] font-bold'
                    : 'bg-white text-[#141414] border-[#141414]/40 hover:bg-[#E4E3E0]'
                }`}
              >
                0.00 (Strict Zero)
              </button>
              <button
                onClick={() => onChangeConfig({ ...config, temperature: 0.1 })}
                className={`px-2 py-0.5 text-[10px] font-mono border ${
                  config.temperature === 0.1
                    ? 'bg-[#141414] text-white border-[#141414] font-bold'
                    : 'bg-white text-[#141414] border-[#141414]/40 hover:bg-[#E4E3E0]'
                }`}
              >
                0.10 (SOP 기본값)
              </button>
              <button
                onClick={() => onChangeConfig({ ...config, temperature: 0.3 })}
                className={`px-2 py-0.5 text-[10px] font-mono border ${
                  config.temperature === 0.3
                    ? 'bg-[#141414] text-white border-[#141414] font-bold'
                    : 'bg-white text-[#141414] border-[#141414]/40 hover:bg-[#E4E3E0]'
                }`}
              >
                0.30 (자연어 강화)
              </button>
            </div>
          </div>

          {/* Structured Output Schema Toggle */}
          <div className="border border-[#141414] p-3.5 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Code2 className="w-4 h-4 text-[#141414] mt-0.5" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs uppercase text-[#141414]">
                      STRUCTURED OUTPUT (JSON Schema 강제)
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 ${
                        config.useStructuredOutput
                          ? 'bg-emerald-700 text-white'
                          : 'bg-neutral-300 text-neutral-800'
                      }`}
                    >
                      {config.useStructuredOutput ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#141414]/80 mt-1 leading-relaxed">
                    Google Gemini <code>responseSchema</code>를 활성화하여 8열 검토 매트릭스, 누락 항목 리스트, 상호 불일치 목록이 100% 스키마 규격에 맞춰 파싱되도록 보장합니다.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={config.useStructuredOutput}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    useStructuredOutput: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[#141414] cursor-pointer mt-0.5"
              />
            </div>
          </div>

          {/* Top-P Sampling */}
          <div className="border border-[#141414] p-3.5 bg-[#E4E3E0]/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono font-bold text-xs uppercase text-[#141414]">
                TOP-P NUCLEUS SAMPLING
              </span>
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 bg-[#141414] text-white">
                {(config.topP ?? 0.95).toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-[#141414]/80 mb-2 leading-relaxed">
              누적 확률 분포 임계값을 지정합니다. 기본값(0.95)은 최적의 조문 단어 조합을 선택하도록 유지합니다.
            </p>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={config.topP ?? 0.95}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  topP: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#141414] cursor-pointer h-2 bg-neutral-200"
            />
          </div>

          {/* Active Model Info */}
          <div className="p-3 bg-neutral-100 border border-[#141414] text-[11px] font-mono text-[#141414]/90 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#141414]" />
              <span>ACTIVE_MODEL: gemini-3.7-flash</span>
            </div>
            <p className="text-[10px] text-[#141414]/70 font-sans">
              • 지식 베이스: 2024 전부개정 정보통신설비 설계기준 + 2026 표준품셈
              <br />
              • 오프라인 백업: API 할당량 소진 시 브라우저 내장 13개 조문 규칙 엔진 자동 전환
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#E4E3E0] border-t border-[#141414] flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono text-[#141414] bg-white border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            기본값 복원 (0.10 / JSON)
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-1.5 text-xs font-mono font-bold bg-[#141414] text-white hover:bg-black transition-colors"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            설정 완료 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
