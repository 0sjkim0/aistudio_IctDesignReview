import React, { useState, useEffect } from 'react';
import {
  googleSignIn,
  listDriveFiles,
  fetchDriveFileContent,
  logout,
  getAccessToken,
} from '../services/googleDriveService';
import { GoogleDriveFile } from '../types';
import {
  HardDrive,
  Search,
  FileText,
  FileCode,
  File,
  Check,
  RefreshCw,
  LogOut,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFileText: (text: string, fileName: string) => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onSelectFileText,
  currentUser,
  onUserChange,
}) => {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadFiles();
    }
  }, [isOpen, currentUser]);

  const loadFiles = async (query?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await listDriveFiles(query);
      setFiles(fetched);
    } catch (err: any) {
      console.error('Failed to list files:', err);
      setError(err.message || 'Google Drive 파일 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChange(res.user);
        setStatusMessage(`${res.user.displayName || res.user.email} 계정으로 연결되었습니다.`);
        await loadFiles();
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onUserChange(null);
      setFiles([]);
      setStatusMessage('Google 계정 연결이 해제되었습니다.');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(searchQuery);
  };

  const handleImportFile = async (file: GoogleDriveFile) => {
    setSelectedFileId(file.id);
    setIsImporting(true);
    setError(null);
    try {
      setStatusMessage(`'${file.name}' 파일을 Google Drive에서 다운로드 및 분석 중...`);
      const text = await fetchDriveFileContent(file);
      if (!text.trim()) {
        throw new Error('파일에서 텍스트를 추출할 수 없거나 내용이 비어 있습니다.');
      }
      onSelectFileText(text, file.name);
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      setError(`파일 가져오기 실패: ${err.message}`);
    } finally {
      setIsImporting(false);
      setSelectedFileId(null);
    }
  };

  if (!isOpen) return null;

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-4 h-4 text-red-600 shrink-0" />;
    }
    if (mimeType.includes('document') || name.endsWith('.docx') || name.endsWith('.hwp')) {
      return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    if (mimeType.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
      return <FileText className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (mimeType.includes('text') || name.endsWith('.txt') || name.endsWith('.md')) {
      return <FileCode className="w-4 h-4 text-neutral-600 shrink-0" />;
    }
    return <File className="w-4 h-4 text-neutral-500 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-white border-2 border-[#141414] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141414] text-white border-b border-[#141414]">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider">
              GOOGLE_DRIVE_INTEGRATION [구글 드라이브 시방서 연동]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm font-mono px-1.5 py-0.5 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Account Status / Login Section */}
          <div className="p-3 bg-[#E4E3E0]/30 border border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {currentUser ? (
              <div className="flex items-center space-x-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User Profile"
                    className="w-7 h-7 rounded-full border border-[#141414]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center font-mono text-xs">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-mono font-bold text-xs text-[#141414] flex items-center gap-1.5">
                    <span>{currentUser.displayName || 'Google 계정'}</span>
                    <span className="text-[10px] bg-emerald-700 text-white font-mono px-1.5 py-0.2">
                      CONNECTED
                    </span>
                  </div>
                  <div className="text-[11px] text-[#141414]/70 font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-mono font-bold text-xs text-[#141414]">
                  GOOGLE DRIVE 연동 필요
                </div>
                <div className="text-[11px] text-[#141414]/70">
                  Google 계정으로 로그인하여 드라이브 내 공사시방서(PDF, Google Docs, TXT 등)를 직접 불러오세요.
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {currentUser ? (
                <>
                  <button
                    onClick={() => loadFiles(searchQuery)}
                    disabled={isLoading}
                    className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono border border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono border border-[#141414] bg-white text-red-700 hover:bg-red-700 hover:text-white transition-colors"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    로그아웃
                  </button>
                </>
              ) : (
                /* Google Official Styled Sign-in Button */
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-[#141414] hover:bg-neutral-100 text-xs font-mono font-bold shadow-xs transition-colors"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-500 text-red-900 text-xs font-mono flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-2 bg-emerald-50 border border-emerald-600 text-emerald-900 text-xs font-mono">
              ✓ {statusMessage}
            </div>
          )}

          {currentUser ? (
            <>
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="드라이브 파일명 검색 (예: 시방서, 통신, 구내, PDF)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-[#141414] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#141414]/50" />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold hover:bg-black transition-colors"
                >
                  검색
                </button>
              </form>

              {/* Files Table List */}
              <div className="border border-[#141414] bg-white max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#141414]/60 font-mono text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-[#141414]" />
                    <span>Google Drive 파일 목록 조회 중...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-10 text-center text-[#141414]/60 font-mono text-xs">
                    <FolderOpen className="w-6 h-6 mx-auto mb-2 text-[#141414]/40" />
                    드라이브에 일치하는 파일이 없습니다.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#141414] text-white font-mono text-[10px] uppercase">
                        <th className="py-1.5 px-3">파일명</th>
                        <th className="py-1.5 px-3 w-28">최종 수정</th>
                        <th className="py-1.5 px-3 w-20 text-right">불러오기</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]/15 font-mono text-xs">
                      {files.map((file) => {
                        const isThisImporting = isImporting && selectedFileId === file.id;
                        return (
                          <tr
                            key={file.id}
                            className="hover:bg-[#E4E3E0]/30 transition-colors"
                          >
                            <td className="py-2 px-3">
                              <div className="flex items-center space-x-2">
                                {getFileIcon(file.mimeType, file.name)}
                                <span className="font-semibold text-[#141414] truncate max-w-xs sm:max-w-md">
                                  {file.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-[11px] text-[#141414]/70">
                              {file.modifiedTime
                                ? new Date(file.modifiedTime).toLocaleDateString('ko-KR')
                                : '-'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => handleImportFile(file)}
                                disabled={isImporting}
                                className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-[#141414] text-white hover:bg-black disabled:opacity-50 transition-colors"
                              >
                                {isThisImporting ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  '선택'
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center bg-[#E4E3E0]/20 border border-dashed border-[#141414]/40 p-6 space-y-3">
              <HardDrive className="w-8 h-8 mx-auto text-[#141414]/60" />
              <p className="text-xs text-[#141414]/80 font-sans max-w-md mx-auto">
                상단의 <strong>[Sign in with Google]</strong> 버튼을 눌러 계정을 연동하면, 본인의 구글 드라이브에 저장된 시방서 문서를 즉시 불러와 2024 전부개정 설계기준 기술 검토를 진행할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#E4E3E0] border-t border-[#141414] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#141414]/70">
            • 지원 파일: Google Docs, PDF, TXT, MD, CSV, JSON
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-mono font-bold bg-white border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
