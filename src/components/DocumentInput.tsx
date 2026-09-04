import React, { useRef, useState } from 'react';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { SampleDocument, KnowledgeDoc } from '../types';
import { extractTextFromFile } from '../utils/fileExtractor';
import { recordHistoryEvent } from '../services/historyService';
import {
  FileText,
  Play,
  Trash2,
  UploadCloud,
  AlertCircle,
  FileCheck2,
  File,
  Loader2,
  CheckCircle2,
  Info,
  HardDrive,
} from 'lucide-react';

interface DocumentInputProps {
  documentText: string;
  setDocumentText: (text: string) => void;
  selectedSample: SampleDocument | null;
  setSelectedSample: (sample: SampleDocument | null) => void;
  onStartReview: () => void;
  isReviewing: boolean;
  onOpenDrive?: () => void;
  knowledgeDocs?: KnowledgeDoc[];
  onOpenKnowledgeBase?: () => void;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
  documentText,
  setDocumentText,
  selectedSample,
  setSelectedSample,
  onStartReview,
  isReviewing,
  onOpenDrive,
  knowledgeDocs = [],
  onOpenKnowledgeBase,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    size: string;
    method?: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSelectSample = (sample: SampleDocument) => {
    setSelectedSample(sample);
    setDocumentText(sample.content);
    setUploadedFileInfo(null);
    setUploadError(null);
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    setIsParsingFile(true);

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    try {
      // 1. Primary: Direct Client-Side Browser Parsing (PDF, TXT, MD, CSV, etc.)
      // This has ZERO external API dependency and never fails with 429 quota exhaustion!
      const clientText = await extractTextFromFile(file);

      if (clientText && clientText.trim()) {
        setDocumentText(clientText);
        setSelectedSample(null);
        setUploadedFileInfo({
          name: file.name,
          size: sizeFormatted,
          method: '브라우저 내장 텍스트 추출 완료',
        });

        // Record client extraction in backend history store
        recordHistoryEvent({
          type: 'PARSE_FILE',
          title: `브라우저 파일 추출: ${file.name}`,
          filename: file.name,
          fileSize: sizeFormatted,
          extractedLength: clientText.length,
          parseMethod: 'DIRECT_TEXT',
          details: `브라우저 로컬 파서를 통해 ${file.name}에서 ${clientText.length.toLocaleString()}자 텍스트 추출 완료`,
        }).catch((err) => console.warn('Failed to record client parse history:', err));

        return;
      }
    } catch (clientErr: any) {
      console.warn('Client extraction failed, trying server parser:', clientErr);

      // 2. Secondary: Fallback to server parser
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        const response = await fetch('/api/parse-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            fileBase64: base64,
            mimeType: file.type || 'application/octet-stream',
            fileSize: sizeFormatted,
          }),
        });

        const data = await response.json();
        if (response.ok && data.text && data.text.trim()) {
          setDocumentText(data.text);
          setSelectedSample(null);
          setUploadedFileInfo({
            name: file.name,
            size: sizeFormatted,
            method: '서버 파서 추출 완료',
          });
          return;
        } else {
          throw new Error(data.error || '텍스트 추출에 실패했습니다.');
        }
      } catch (serverErr: any) {
        setUploadError(
          `'${file.name}' 파일을 읽는 중 오류가 발생했습니다 (${serverErr.message}). 파일의 텍스트 내용을 직접 복사하여 아래 입력창에 붙여넣어 주시면 즉시 기술 검토를 수행할 수 있습니다.`
        );
      }
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input value to allow re-uploading same file if desired
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const lineCount = documentText ? documentText.split('\n').length : 0;
  const charCount = documentText ? documentText.length : 0;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white border transition-colors p-3 sm:p-4 flex flex-col h-full relative ${
        isDragging
          ? 'border-2 border-dashed border-[#141414] bg-neutral-100'
          : 'border-[#141414]'
      }`}
    >
      {/* Drag overlay notice */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#E4E3E0]/90 z-20 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          <UploadCloud className="w-10 h-10 text-[#141414] mb-2 animate-bounce" />
          <p className="font-mono text-xs font-bold uppercase text-[#141414]">
            DROP_FILE_HERE_TO_ATTACH
          </p>
          <p className="text-[11px] text-[#141414]/80 font-sans mt-1">
            공사시방서 파일 (PDF, HWP, HWPX, DOCX, TXT, CSV, MD 등)을 놓아주세요.
          </p>
        </div>
      )}

      {/* Header & Sample Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#141414]">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-[#141414]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#141414] font-mono">
            INPUT_SPECIFICATION_DOCUMENT
          </h2>
          <span className="text-[10px] text-[#141414]/60 font-mono hidden sm:inline">
            [공사시방서 원문 입력 / 파일 첨부 엔진]
          </span>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70 mr-1">
            PRESETS:
          </span>
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`px-2 py-0.5 text-[11px] font-mono font-medium border transition-colors ${
                selectedSample?.id === sample.id
                  ? 'bg-[#141414] text-white border-[#141414] font-bold'
                  : 'bg-white hover:bg-[#E4E3E0] text-[#141414] border-[#141414]/40 hover:border-[#141414]'
              }`}
            >
              {sample.title.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Sample Context Banner (if selected) */}
      {selectedSample && (
        <div className="mt-2.5 p-2.5 bg-[#E4E3E0]/50 border border-[#141414] text-xs text-[#141414]">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold mb-1">
            <span>TARGET_PRESET: {selectedSample.title}</span>
            <span className="bg-[#141414] text-white px-1.5 py-0.2 uppercase text-[10px]">
              {selectedSample.category}
            </span>
          </div>
          <p className="text-[11px] text-[#141414]/80 mb-1 leading-normal">{selectedSample.description}</p>
          {selectedSample.expectedIssues.length > 0 && (
            <div className="bg-white p-2 border border-[#141414]/30 mt-1">
              <span className="font-mono text-[10px] font-bold uppercase text-[#141414] block mb-0.5">
                EXPECTED_AUDIT_POINTS:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#141414]/90 font-mono">
                {selectedSample.expectedIssues.map((issue, idx) => (
                  <li key={idx} className="truncate">{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Uploaded File Info Banner */}
      {uploadedFileInfo && !selectedSample && (
        <div className="mt-2.5 p-2 bg-emerald-50 border border-[#141414] text-xs text-emerald-950 font-mono flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-bold">ATTACHED_FILE: {uploadedFileInfo.name}</span>
            <span className="text-[10px] text-emerald-800">({uploadedFileInfo.size})</span>
          </div>
          <button
            onClick={() => {
              setUploadedFileInfo(null);
            }}
            className="text-[10px] text-emerald-800 hover:underline"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mt-2.5 p-2.5 bg-rose-50 border border-[#141414] text-xs text-rose-950 font-mono flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">[FILE_ERROR]: 파일 첨부 실패</span>
            <p className="text-[11px] text-rose-900">{uploadError}</p>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-xs font-bold text-rose-800 hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor / Textarea */}
      <div className="mt-2.5 flex-1 relative flex flex-col min-h-[300px]">
        {isParsingFile && (
          <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center p-4">
            <Loader2 className="w-6 h-6 text-[#141414] animate-spin mb-2" />
            <span className="font-mono text-xs font-bold text-[#141414]">
              PARSING_DOCUMENT_CONTENT...
            </span>
            <span className="text-[11px] text-[#141414]/70 font-sans mt-0.5">
              파일 내용을 분석하여 텍스트 및 조문을 추출하고 있습니다.
            </span>
          </div>
        )}

        <textarea
          id="specification-textarea"
          value={documentText}
          onChange={(e) => {
            setDocumentText(e.target.value);
            if (selectedSample && e.target.value !== selectedSample.content) {
              setSelectedSample(null);
            }
            if (uploadedFileInfo) {
              setUploadedFileInfo(null);
            }
          }}
          placeholder="공사시방서 전문을 직접 붙여넣거나, 하단의 [파일 첨부 / 드래그 앤 드롭]으로 파일을 업로드하세요.
(지원 형식: PDF, HWP, HWPX, DOCX, TXT, CSV, MD, JSON 등)"
          className="w-full flex-1 p-3 text-xs font-mono text-[#141414] bg-[#E4E3E0]/20 border border-[#141414] focus:outline-none focus:bg-white leading-relaxed resize-none"
        />

        {/* Footer info inside editor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-[#141414]/70 mt-2 px-0.5 gap-2">
          <div className="flex items-center space-x-3">
            <span>LINES: {lineCount}</span>
            <span>CHARS: {charCount.toLocaleString()}</span>
            <span className="hidden md:inline text-[#141414]/50">| DRAG & DROP ANY FILE TO ATTACH</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Google Drive Import Button */}
            {onOpenDrive && (
              <button
                type="button"
                onClick={onOpenDrive}
                className="inline-flex items-center px-2.5 py-1 text-[11px] text-[#141414] hover:bg-emerald-800 hover:text-white bg-emerald-50 border border-emerald-700 transition-colors font-mono font-bold cursor-pointer"
                title="구글 드라이브에서 시방서 파일 불러오기"
              >
                <HardDrive className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                Google Drive에서 가져오기
              </button>
            )}

            {/* Hidden file input supporting all document types */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.text,.pdf,.docx,.doc,.hwp,.hwpx,.csv,.xlsx,.xls,.rtf,.json,*/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingFile}
              className="inline-flex items-center px-2.5 py-1 text-[11px] text-[#141414] hover:bg-[#141414] hover:text-white bg-white border border-[#141414] transition-colors font-mono font-bold cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              로컬 파일 첨부 (PDF/HWP/TXT)
            </button>
            {documentText && (
              <button
                onClick={() => {
                  setDocumentText('');
                  setSelectedSample(null);
                  setUploadedFileInfo(null);
                  setUploadError(null);
                }}
                className="inline-flex items-center px-2 py-1 text-[11px] text-red-600 hover:bg-red-600 hover:text-white bg-white border border-red-600 transition-colors font-mono cursor-pointer"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                CLEAR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Execution Button */}
      <div className="mt-3 pt-2.5 border-t border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-[10px] font-mono text-[#141414]/70 flex flex-wrap items-center gap-1.5">
          <span>ENGINE: 「정보통신설비 설계기준 (2024 전부개정)」 & 「2026 표준품셈」</span>
          {knowledgeDocs.length > 0 ? (
            <span className="inline-flex items-center px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-400 text-[9px] font-bold">
              <HardDrive className="w-2.5 h-2.5 mr-1 text-emerald-700" />
              G-Drive 지식문서 {knowledgeDocs.length}건 연동 적용됨
            </span>
          ) : (
            onOpenKnowledgeBase && (
              <button
                type="button"
                onClick={onOpenKnowledgeBase}
                className="text-emerald-800 hover:underline inline-flex items-center text-[9px]"
              >
                <HardDrive className="w-2.5 h-2.5 mr-0.5" />
                [지식 폴더 동기화]
              </button>
            )
          )}
        </div>
        <button
          id="btn-run-review"
          onClick={onStartReview}
          disabled={!documentText.trim() || isReviewing || isParsingFile}
          className="inline-flex items-center justify-center px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#141414] hover:bg-black active:bg-neutral-900 disabled:bg-[#141414]/40 disabled:cursor-not-allowed border border-[#141414] transition-colors shadow-none cursor-pointer"
        >
          {isReviewing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              <span>RUNNING_SOP_AUDIT...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              <span>EXECUTE_AI_REVIEW (기술 검토 실행)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
