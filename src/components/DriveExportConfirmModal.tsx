import React, { useState } from 'react';
import { HardDrive, AlertCircle, Check, Loader2, FileText } from 'lucide-react';
import { saveReportToDrive, getAccessToken } from '../services/googleDriveService';

interface DriveExportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string;
  defaultFileName: string;
  onSuccess: (fileInfo: { id: string; name: string }) => void;
}

export const DriveExportConfirmModal: React.FC<DriveExportConfirmModalProps> = ({
  isOpen,
  onClose,
  reportContent,
  defaultFileName,
  onSuccess,
}) => {
  const [fileName, setFileName] = useState(defaultFileName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmSave = async () => {
    if (!fileName.trim()) {
      setError('파일명을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveReportToDrive(fileName.trim(), reportContent, 'text/markdown');
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Save to drive error:', err);
      setError(err.message || 'Google Drive에 파일을 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-white border-2 border-[#141414] w-full max-w-lg shadow-2xl text-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141414] text-white border-b border-[#141414]">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider">
              GOOGLE_DRIVE_EXPORT [검토 보고서 드라이브 저장]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm font-mono px-1.5 py-0.5 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs font-sans">
          <div className="p-3 bg-amber-50 border border-amber-600 text-amber-900 text-xs font-mono flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">저장 확인 (사용자 승인 요청)</div>
              <div>
                사용자 구글 드라이브(Google Drive) 루트 디렉토리에 기술 검토 결과 보고서 파일을 신규 생성합니다. 진행하시겠습니까?
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-[#141414] uppercase mb-1">
              생성할 파일명 (File Name)
            </label>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#141414]/60" />
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#141414] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                placeholder="파일명 입력 (.md)"
              />
            </div>
          </div>

          <div className="border border-[#141414] bg-[#E4E3E0]/20 p-2.5 max-h-32 overflow-y-auto">
            <div className="text-[10px] font-mono text-[#141414]/70 mb-1 font-bold">
              [파일 내용 미리보기 - 마크다운 보고서]
            </div>
            <pre className="text-[10px] font-mono whitespace-pre-wrap text-[#141414]/80">
              {reportContent.slice(0, 400)}
              {reportContent.length > 400 ? '...' : ''}
            </pre>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-500 text-red-900 text-xs font-mono">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#E4E3E0] border-t border-[#141414] flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-1.5 text-xs font-mono border border-[#141414] bg-white hover:bg-neutral-100 transition-colors"
          >
            취소 (Cancel)
          </button>
          <button
            onClick={handleConfirmSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-1.5 text-xs font-mono font-bold bg-[#141414] text-white hover:bg-black transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                드라이브 저장 중...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                드라이브에 저장 승인
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
