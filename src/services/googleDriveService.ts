import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleDriveFile, KnowledgeDoc } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Google Drive Shared Knowledge Folder Configuration
export const KNOWLEDGE_FOLDER_ID = '130_ODKMoiup3SdE7wxQWBiFpceF_vqVr';
export const KNOWLEDGE_FOLDER_URL = 'https://drive.google.com/drive/folders/130_ODKMoiup3SdE7wxQWBiFpceF_vqVr?usp=sharing';
export const STORAGE_KEY_KNOWLEDGE = `gdrive_knowledge_docs_${KNOWLEDGE_FOLDER_ID}`;

// Initialize Firebase App safely (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive scopes
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize Firebase Auth listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might need re-fetching or sign in
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Perform Google Sign-In with popup.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google 계정 인증 토큰을 획득하지 못했습니다.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve current cached access token.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Logout from Firebase.
 */
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * List files from user's Google Drive.
 */
export const listDriveFiles = async (
  searchQuery?: string,
  pageSize = 25
): Promise<GoogleDriveFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive 접근 권한이 필요합니다. 먼저 로그인해주세요.');
  }

  let q = "trashed = false";
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/'/g, "\\'");
    q += ` and (name contains '${escaped}' or fullText contains '${escaped}')`;
  }

  const params = new URLSearchParams({
    q: q,
    pageSize: pageSize.toString(),
    fields: 'files(id, name, mimeType, iconLink, modifiedTime, size)',
    orderBy: 'modifiedTime desc',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Google Drive 파일 목록 조회 실패 (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Fetch and extract text content from a Google Drive file.
 */
export const fetchDriveFileContent = async (file: GoogleDriveFile): Promise<string> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive 접근 권한이 필요합니다. 먼저 로그인해주세요.');
  }

  const { id, mimeType, name } = file;

  // 1. Google Docs -> Export as text/plain
  if (mimeType === 'application/vnd.google-apps.document') {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/plain`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Google 문서 내보내기 실패 (${res.status})`);
    return await res.text();
  }

  // 2. Google Spreadsheets -> Export as text/csv
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/csv`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Google 스프레드시트 내보내기 실패 (${res.status})`);
    return await res.text();
  }

  // 3. PDF File -> Download binary stream & parse using pdfjs-dist
  if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`PDF 파일 다운로드 실패 (${res.status})`);

    const arrayBuffer = await res.arrayBuffer();
    try {
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += `[페이지 ${i}]\n${pageText}\n\n`;
      }
      if (fullText.trim()) return fullText.trim();
    } catch (e) {
      console.warn('PDF.js parsing failed on Google Drive file:', e);
    }
  }

  // 4. Plain Text, Markdown, CSV, JSON, HWP/Word fallback
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`파일 다운로드 실패 (${res.status})`);

  const text = await res.text();
  return text;
};

/**
 * Save review report or document into user's Google Drive.
 * Must be called after explicit user confirmation in the UI.
 */
export const saveReportToDrive = async (
  fileName: string,
  content: string,
  mimeType = 'text/plain'
): Promise<{ id: string; name: string }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive 접근 권한이 필요합니다. 먼저 로그인해주세요.');
  }

  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Drive 저장 실패 (${response.status}): ${err}`);
  }

  const result = await response.json();
  return result;
};

/**
 * List all files located in the specific Google Drive Knowledge Folder.
 */
export const listFilesInKnowledgeFolder = async (
  folderId = KNOWLEDGE_FOLDER_ID
): Promise<GoogleDriveFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive 접근 권한이 필요합니다. 먼저 로그인해주세요.');
  }

  const q = `'${folderId}' in parents and trashed = false`;
  const params = new URLSearchParams({
    q: q,
    pageSize: '50',
    fields: 'files(id, name, mimeType, iconLink, modifiedTime, size)',
    orderBy: 'modifiedTime desc',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`지식 폴더 파일 목록 조회 실패 (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Synchronize and extract all documents from the Knowledge Folder into KnowledgeDoc objects.
 */
export const syncAllKnowledgeFromFolder = async (
  folderId = KNOWLEDGE_FOLDER_ID,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<KnowledgeDoc[]> => {
  const files = await listFilesInKnowledgeFolder(folderId);
  const results: KnowledgeDoc[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(i + 1, files.length, file.name);
    }
    try {
      const content = await fetchDriveFileContent(file);
      if (content && content.trim()) {
        results.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          content: content.trim(),
          modifiedTime: file.modifiedTime,
          size: file.size,
          extractedLength: content.trim().length,
          syncedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(`지식 문서 [${file.name}] 텍스트 추출 중 오류:`, err);
    }
  }

  // Save to localStorage for instant offline/re-use availability
  saveStoredKnowledgeDocs(results);
  return results;
};

/**
 * Get locally cached knowledge docs from localStorage.
 */
export const getStoredKnowledgeDocs = (): KnowledgeDoc[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KNOWLEDGE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/**
 * Save knowledge docs to localStorage cache.
 */
export const saveStoredKnowledgeDocs = (docs: KnowledgeDoc[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_KNOWLEDGE, JSON.stringify(docs));
  } catch (e) {
    console.warn('Failed to cache knowledge docs in localStorage:', e);
  }
};

/**
 * Clear cached knowledge docs.
 */
export const clearStoredKnowledgeDocs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_KNOWLEDGE);
  } catch {}
};
