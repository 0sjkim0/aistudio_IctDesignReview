import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker using unpkg or dynamic import
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Extracts text from various file formats completely client-side.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. Plain Text / Markdown / Code / CSV formats
  if (['txt', 'md', 'text', 'csv', 'json', 'log', 'xml', 'html', 'rtf', 'tsv'].includes(ext) || file.type.startsWith('text/')) {
    const text = await file.text();
    if (!text.trim()) {
      throw new Error('선택한 파일이 비어 있습니다.');
    }
    return text;
  }

  // 2. PDF Document
  if (ext === 'pdf' || file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
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

      if (fullText.trim()) {
        return fullText.trim();
      }
    } catch (pdfErr) {
      console.warn('PDF.js client extraction failed, attempting binary stream extraction fallback:', pdfErr);
    }
  }

  // 3. Fallback: Generic binary text extraction for HWP, DOCX, etc.
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(arrayBuffer);

    // Extract printable Korean / English / numeric characters
    const cleanText = rawText
      .replace(/[^\uAC00-\uD7A3\u3131-\u318Ea-zA-Z0-9\s.,!?:;()[\]{}<>'"~@#$%^&*_=+\-\/\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length > 50) {
      return `[${file.name} 텍스트 추출]\n\n${cleanText}`;
    }
  } catch (rawErr) {
    console.warn('Raw extraction fallback failed:', rawErr);
  }

  throw new Error(`'${file.name}' 파일의 텍스트를 직접 읽어올 수 없습니다. 파일 내용을 복사하여 직접 텍스트 영역에 붙여넣어 주세요.`);
}
