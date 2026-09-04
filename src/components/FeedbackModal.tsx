import React, { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquare, Send, ThumbsUp } from 'lucide-react';
import { submitUserFeedback } from '../services/adminService';
import { UserFeedback } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  targetFeature?: string;
  onSubmitted?: (feedback: UserFeedback) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  targetFeature = '공사시방서 기술검토',
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<UserFeedback['category']>('REVIEW_ACCURACY');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('평가 의견 또는 피드백을 간단히 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await submitUserFeedback({
        userEmail: currentUserEmail || '0sjkim0@gmail.com',
        rating,
        category,
        comment: comment.trim(),
        targetFeature,
      });

      setIsSuccess(true);
      onSubmitted?.(result);
      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || '피드백 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3">
      <div className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-lg shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-[#141414] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-amber-400 text-black flex items-center justify-center font-bold">
              <Star className="w-4 h-4 fill-black text-black" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase">
                USER_SATISFACTION_SURVEY
              </span>
              <h3 className="text-sm font-bold">시스템 만족도 및 개선 의견 평가</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 text-center bg-white">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3 animate-bounce" />
            <h4 className="text-base font-bold text-[#141414]">소중한 평가가 등록되었습니다!</h4>
            <p className="text-xs text-neutral-600 mt-1 font-mono">
              제출해주신 피드백은 관리자 대시보드 만족도 통계 및 검토 엔진 고도화에 즉시 반영됩니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Rating Stars */}
            <div className="bg-white p-3 border border-[#141414] text-center">
              <label className="block text-xs font-mono font-bold text-neutral-700 mb-2">
                시스템 만족도 평점 (1 ~ 5점)
              </label>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          active
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-neutral-300 fill-neutral-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 mt-1 block">
                {rating === 5 && '★★★★★ 매우 만족 (설계기준 대조 정확 및 신속)'}
                {rating === 4 && '★★★★☆ 만족 (실무 업무에 유용함)'}
                {rating === 3 && '★★★☆☆ 보통 (보완 필요 사항 있음)'}
                {rating === 2 && '★★☆☆☆ 아쉬움 (일부 기능 개선 요망)'}
                {rating === 1 && '★☆☆☆☆ 매우 불만족'}
              </span>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 mb-1.5">
                평가 부문 (Category)
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: 'REVIEW_ACCURACY', label: '기술검토 정확성' },
                  { id: 'RESPONSE_SPEED', label: '응답 및 처리 속도' },
                  { id: 'USABILITY', label: '사용 편의성' },
                  { id: 'FEATURE_REQUEST', label: '추가 기능 제안' },
                ].map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id as any)}
                    className={`px-2.5 py-1.5 text-left border transition-colors ${
                      category === cat.id
                        ? 'bg-[#141414] text-white border-[#141414] font-bold'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Feature Context */}
            <div className="bg-neutral-100 p-2 border border-neutral-300 text-xs font-mono flex items-center justify-between text-neutral-700">
              <span>평가 대상:</span>
              <span className="font-bold text-[#141414]">{targetFeature}</span>
            </div>

            {/* Comment textarea */}
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                상세 평가 의견 및 개선 건의사항
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="2024 전부개정 설계기준 대조 정확도, 조문 근거 제시, 속도 등에 대한 구체적인 의견을 남겨주세요."
                rows={4}
                className="w-full p-2.5 bg-white border border-[#141414] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 font-mono font-bold">{errorMessage}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-300">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono bg-white border border-[#141414] hover:bg-neutral-100 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-1.5 text-xs font-mono font-bold bg-[#141414] text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>{isSubmitting ? '제출 중...' : '만족도 평가 제출'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
