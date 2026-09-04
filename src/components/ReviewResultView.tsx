import React, { useState } from 'react';
import { ReviewResult, ReviewItem, JudgmentType } from '../types';
import {
  Copy,
  Check,
  Download,
  Printer,
  Search,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  HardDrive,
  Star,
} from 'lucide-react';

interface ReviewResultViewProps {
  result: ReviewResult;
  onSaveToDrive?: (reportContent: string, defaultName: string) => void;
  onOpenFeedback?: () => void;
}

export const ReviewResultView: React.FC<ReviewResultViewProps> = ({ result, onSaveToDrive, onOpenFeedback }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedMd, setCopiedMd] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (no: number) => {
    setExpandedRows((prev) => ({ ...prev, [no]: !prev[no] }));
  };

  const getJudgmentBadge = (judgment: JudgmentType) => {
    switch (judgment) {
      case '적합':
        return <span className="text-emerald-700 font-bold font-mono">적합</span>;
      case '부적합':
        return <span className="text-rose-700 font-bold font-mono">부적합</span>;
      case '누락':
        return <span className="text-blue-700 font-bold font-mono underline">누락</span>;
      case '확인 필요':
      default:
        return <span className="text-amber-700 font-bold font-mono">확인 필요</span>;
    }
  };

  const getConfidenceBadge = (conf: '상' | '중' | '하') => {
    switch (conf) {
      case '상':
        return <span className="font-mono font-bold text-[#141414]">상</span>;
      case '중':
        return <span className="font-mono text-[#141414]/80">중</span>;
      case '하':
      default:
        return <span className="font-mono text-rose-700 font-bold underline">하</span>;
    }
  };

  // Filter items
  const filteredItems = result.items.filter((item) => {
    if (filterType === 'defects' && item.judgment !== '부적합' && item.judgment !== '누락') return false;
    if (filterType === 'engineer-review' && item.confidence !== '하' && !item.remarks.includes('[기술사 확인 요망]')) return false;
    if (filterType === 'compliant' && item.judgment !== '적합') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchItem = item.item.toLowerCase().includes(q);
      const matchSpec = item.specification.toLowerCase().includes(q);
      const matchStd = item.standard.toLowerCase().includes(q);
      const matchArt = item.basisArticle.toLowerCase().includes(q);
      const matchRem = item.remarks.toLowerCase().includes(q);
      return matchItem || matchSpec || matchStd || matchArt || matchRem;
    }
    return true;
  });

  const generateMarkdownTable = () => {
    const header = '| No | 검토 항목 | 시방서 기재 | 기준값 | 근거 조항 | 판정 | 확신도 | 비고 |';
    const divider = '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |';
    const rows = result.items.map(
      (it) =>
        `| ${it.no} | ${it.item.replace(/\|/g, '/')} | ${it.specification.replace(/\|/g, '/')} | ${it.standard.replace(/\|/g, '/')} | ${it.basisArticle.replace(/\|/g, '/')} | ${it.judgment} | ${it.confidence} | ${it.remarks.replace(/\|/g, '/')} |`
    );
    return `${header}\n${divider}\n${rows.join('\n')}\n\n${result.disclaimer}`;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownTable();
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadCsv = () => {
    const headers = ['No', '검토 항목', '시방서 기재', '기준값', '근거 조항', '판정', '확신도', '비고'];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...result.items.map((it) =>
        [
          it.no,
          `"${it.item.replace(/"/g, '""')}"`,
          `"${it.specification.replace(/"/g, '""')}"`,
          `"${it.standard.replace(/"/g, '""')}"`,
          `"${it.basisArticle.replace(/"/g, '""')}"`,
          `"${it.judgment}"`,
          `"${it.confidence}"`,
          `"${it.remarks.replace(/"/g, '""')}"`,
        ].join(',')
      ),
      '',
      `"${result.disclaimer}"`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `정보통신설비_설계도서_기술검토서_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-[#141414] p-3 sm:p-5 flex flex-col space-y-4">
      {/* Top Header & Status Bar */}
      <div className="border-b border-[#141414] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-[#141414]" />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#141414] font-mono">
                TECHNICAL_AUDIT_REPORT_TABLE
              </h2>
              {result.title && (
                <span className="text-[10px] font-mono bg-[#141414] text-white px-2 py-0.5 font-bold">
                  {result.title}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#141414]/70 mt-0.5">
              「정보통신설비 설계기준」 및 「표준품셈」 조문 단위 1:1 대조 판정 결과서
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {onOpenFeedback && (
            <button
              id="btn-feedback-result"
              onClick={onOpenFeedback}
              className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono font-bold text-black bg-amber-400 hover:bg-amber-300 border border-amber-500 transition-colors shadow-xs"
              title="검토 결과 만족도 평가 및 피드백 남기기"
            >
              <Star className="w-3.5 h-3.5 mr-1 fill-black text-black" />
              <span>만족도 평가</span>
            </button>
          )}

          {onSaveToDrive && (
            <button
              id="btn-save-drive"
              onClick={() => {
                const fullReport = `# 정보통신설비 공사시방서 기술검토 보고서
작성일시: ${new Date().toLocaleString('ko-KR')}
검토 대상: ${result.title || '제출 공사시방서'}

## 1. 검토 요약 (Summary)
- 총 검토 항목: ${result.summary.total}건
- 적합: ${result.summary.compliant}건
- 부적합: ${result.summary.nonCompliant}건
- 누락: ${result.summary.missing}건
- 확인 필요: ${result.summary.needCheck}건
- 기술사 확인 요망 항목: ${result.summary.engineerReviewCount}건

## 2. 8열 기술 검토 매트릭스 (Review Matrix)
${generateMarkdownTable()}

## 3. 제4조 13개 필수 기재 항목 검토
${result.missingChecklistItems.length > 0 ? result.missingChecklistItems.map((m) => `- ❌ 누락/미비: ${m}`).join('\n') : '- ✅ 필수 기재 13개 항목 모두 충족'}

## 4. 제18조 상호 불일치 검토
${result.internalInconsistencies.length > 0 ? result.internalInconsistencies.map((i) => `- ⚠ 불일치: ${i}`).join('\n') : '- ✅ 도면 및 산출서 간 불일치 사항 없음'}

## 5. 제19조 폐지 조항 인용 검토
${result.deprecatedCitations.length > 0 ? result.deprecatedCitations.map((d) => `- ❌ 폐지 조항 인용 오류: ${d}`).join('\n') : '- ✅ 2024 전부개정 기준 유효 조항 준수'}

---
${result.disclaimer}
`;
                const dateStr = new Date().toISOString().slice(0, 10);
                const defaultName = `정보통신설비_기술검토서_${result.title ? result.title.replace(/\s+/g, '_') : '공사시방서'}_${dateStr}.md`;
                onSaveToDrive(fullReport, defaultName);
              }}
              className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-800 hover:text-white border border-emerald-700 transition-colors"
              title="검토 결과 보고서를 Google Drive에 저장"
            >
              <HardDrive className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              <span>SAVE_TO_DRIVE</span>
            </button>
          )}

          <button
            id="btn-copy-md"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono font-bold text-[#141414] bg-white hover:bg-[#141414] hover:text-white border border-[#141414] transition-colors"
            title="마크다운 표 복사"
          >
            {copiedMd ? (
              <>
                <Check className="w-3 h-3 mr-1 text-emerald-600" />
                <span>COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                <span>COPY_TABLE</span>
              </>
            )}
          </button>

          <button
            id="btn-export-csv"
            onClick={handleDownloadCsv}
            className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono font-bold text-[#141414] bg-white hover:bg-[#141414] hover:text-white border border-[#141414] transition-colors"
            title="CSV 파일 다운로드"
          >
            <Download className="w-3 h-3 mr-1" />
            <span>EXPORT_CSV</span>
          </button>

          <button
            id="btn-print"
            onClick={() => window.print()}
            className="inline-flex items-center px-2 py-1 text-[11px] font-mono text-[#141414] bg-white hover:bg-[#141414] hover:text-white border border-[#141414] transition-colors"
            title="인쇄"
          >
            <Printer className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Summary Stat Grid (High Density) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="border border-[#141414] bg-[#E4E3E0]/30 p-2 text-left">
          <span className="text-[9px] font-mono font-bold uppercase text-[#141414]/60 block">TOTAL_ITEMS</span>
          <span className="text-lg font-mono font-bold text-[#141414] mt-0.5 block">{result.summary.total}</span>
        </div>
        <div className="border border-[#141414] bg-emerald-50/40 p-2 text-left">
          <span className="text-[9px] font-mono font-bold uppercase text-emerald-800/80 block">COMPLIANT (적합)</span>
          <span className="text-lg font-mono font-bold text-emerald-700 mt-0.5 block">{result.summary.compliant}</span>
        </div>
        <div className="border border-[#141414] bg-rose-50/40 p-2 text-left">
          <span className="text-[9px] font-mono font-bold uppercase text-rose-800/80 block">DEFECTS (부적합)</span>
          <span className="text-lg font-mono font-bold text-rose-700 mt-0.5 block">{result.summary.nonCompliant}</span>
        </div>
        <div className="border border-[#141414] bg-amber-50/40 p-2 text-left">
          <span className="text-[9px] font-mono font-bold uppercase text-amber-800/80 block">MISSING (누락)</span>
          <span className="text-lg font-mono font-bold text-amber-700 mt-0.5 block">{result.summary.missing}</span>
        </div>
        <div className="border border-[#141414] bg-slate-50 p-2 text-left">
          <span className="text-[9px] font-mono font-bold uppercase text-[#141414]/60 block">CHECK_REQ (확인 필요)</span>
          <span className="text-lg font-mono font-bold text-[#141414] mt-0.5 block">{result.summary.needCheck}</span>
        </div>
        <div className="border border-[#141414] bg-purple-50/40 p-2 text-left">
          <span className="text-[9px] font-mono font-bold uppercase text-purple-900 block">ENGINEER_REQ (기술사 요망)</span>
          <span className="text-lg font-mono font-bold text-purple-800 mt-0.5 block">
            {result.summary.engineerReviewCount}
          </span>
        </div>
      </div>

      {/* Critical Finding Callouts */}
      {(result.deprecatedCitations?.length > 0 ||
        result.internalInconsistencies?.length > 0 ||
        result.missingChecklistItems?.length > 0) && (
        <div className="space-y-2">
          {/* 1. Deprecated Citations (Article 19) */}
          {result.deprecatedCitations && result.deprecatedCitations.length > 0 && (
            <div className="p-2.5 bg-rose-50 border border-[#141414] text-xs text-rose-950 font-mono">
              <div className="font-bold flex items-center space-x-1 mb-1 text-rose-900">
                <span className="w-2 h-2 bg-rose-600 inline-block" />
                <span>[제19조 경과조치 위반] 폐지된 구 조항 인용 발견 (근거 오류)</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-900">
                {result.deprecatedCitations.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Internal Inconsistencies (Article 18) */}
          {result.internalInconsistencies && result.internalInconsistencies.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-[#141414] text-xs text-amber-950 font-mono">
              <div className="font-bold flex items-center space-x-1 mb-1 text-amber-900">
                <span className="w-2 h-2 bg-amber-600 inline-block" />
                <span>[제18조 상호 일치 위반] 도서 내부 불일치 및 수량 검산 오차</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900">
                {result.internalInconsistencies.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Missing Checklist Items (Article 4) */}
          {result.missingChecklistItems && result.missingChecklistItems.length > 0 && (
            <div className="p-2.5 bg-blue-50 border border-[#141414] text-xs text-blue-950 font-mono">
              <div className="font-bold flex items-center space-x-1 mb-1 text-blue-900">
                <span className="w-2 h-2 bg-blue-600 inline-block" />
                <span>[제4조 필수 기재사항 누락 의심] 공사시방서 필수 항목 미기재</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-900">
                {result.missingChecklistItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold border transition-colors ${
              filterType === 'all'
                ? 'bg-[#141414] text-white border-[#141414]'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0] border-[#141414]/30'
            }`}
          >
            ALL ({result.items.length})
          </button>
          <button
            onClick={() => setFilterType('defects')}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold border transition-colors ${
              filterType === 'defects'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-rose-700 hover:bg-rose-50 border-rose-600/40'
            }`}
          >
            DEFECTS/MISSING ({result.summary.nonCompliant + result.summary.missing})
          </button>
          <button
            onClick={() => setFilterType('engineer-review')}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold border transition-colors ${
              filterType === 'engineer-review'
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-white text-purple-700 hover:bg-purple-50 border-purple-600/40'
            }`}
          >
            TECH_CONFIRM_REQ ({result.summary.engineerReviewCount})
          </button>
          <button
            onClick={() => setFilterType('compliant')}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold border transition-colors ${
              filterType === 'compliant'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-600/40'
            }`}
          >
            COMPLIANT ({result.summary.compliant})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3 h-3 absolute left-2.5 top-2 text-[#141414]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER_ITEMS..."
            className="w-full pl-7 pr-2 py-1 text-xs font-mono bg-white border border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] text-[#141414]"
          />
        </div>
      </div>

      {/* Main High-Density Table */}
      <div className="overflow-x-auto border border-[#141414]">
        <table className="w-full border-collapse text-[11px] border border-[#141414] bg-white">
          <thead className="bg-[#141414] text-white">
            <tr>
              <th className="border border-[#141414] p-2 w-10 text-center font-mono font-bold">No</th>
              <th className="border border-[#141414] p-2 text-left font-bold min-w-[130px]">검토 항목</th>
              <th className="border border-[#141414] p-2 text-left font-bold min-w-[150px]">시방서 기재</th>
              <th className="border border-[#141414] p-2 text-left font-bold min-w-[150px]">기준값</th>
              <th className="border border-[#141414] p-2 text-left font-bold min-w-[110px]">근거 조항</th>
              <th className="border border-[#141414] p-2 text-center font-bold w-20">판정</th>
              <th className="border border-[#141414] p-2 text-center font-bold w-16">확신도</th>
              <th className="border border-[#141414] p-2 text-left font-bold min-w-[150px]">비고</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-[#141414] p-6 text-center text-[#141414]/50 font-mono">
                  NO_ITEMS_MATCH_CURRENT_FILTER
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isExpanded = !!expandedRows[item.no];
                const isEngineerRequired =
                  item.confidence === '하' || item.remarks.includes('[기술사 확인 요망]');
                const isNonCompliant = item.judgment === '부적합' || item.judgment === '누락';

                let rowBg = 'hover:bg-neutral-100/60';
                if (isNonCompliant) rowBg = 'bg-rose-50/40 hover:bg-rose-50';
                else if (isEngineerRequired) rowBg = 'bg-yellow-50 hover:bg-yellow-100/70';

                return (
                  <React.Fragment key={item.no}>
                    <tr
                      onClick={() => item.detailReason && toggleRow(item.no)}
                      className={`${rowBg} transition-colors cursor-pointer`}
                    >
                      <td className="border border-[#141414] p-2 text-center font-mono font-bold text-[#141414]">
                        {item.no < 10 ? `0${item.no}` : item.no}
                      </td>
                      <td className="border border-[#141414] p-2 font-sans font-semibold text-[#141414]">
                        <div className="flex items-center justify-between">
                          <span>{item.item}</span>
                          {item.detailReason && (
                            <span className="text-[10px] text-blue-700 ml-1">
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border border-[#141414] p-2 text-[#141414] font-mono leading-relaxed">
                        {item.judgment === '누락' ? (
                          <span className="text-blue-700 underline font-semibold">{item.specification}</span>
                        ) : (
                          item.specification
                        )}
                      </td>
                      <td className="border border-[#141414] p-2 text-[#141414] font-mono leading-relaxed font-semibold">
                        {item.judgment === '부적합' ? (
                          <span className="text-rose-700 font-bold">{item.standard}</span>
                        ) : (
                          item.standard
                        )}
                      </td>
                      <td className="border border-[#141414] p-2 text-[#141414] font-mono">
                        {item.basisArticle.includes('폐지') || item.basisArticle.includes('오류') || item.basisArticle.includes('없음') ? (
                          <span className="text-rose-700 font-bold">{item.basisArticle}</span>
                        ) : (
                          <span>{item.basisArticle}</span>
                        )}
                      </td>
                      <td className="border border-[#141414] p-2 text-center font-mono font-bold">
                        {getJudgmentBadge(item.judgment)}
                      </td>
                      <td className="border border-[#141414] p-2 text-center font-mono">
                        {getConfidenceBadge(item.confidence)}
                      </td>
                      <td className="border border-[#141414] p-2 font-mono text-[10px]">
                        {item.remarks.includes('[기술사 확인 요망]') ? (
                          <span className="text-rose-700 font-bold bg-rose-50 border border-rose-300 px-1 py-0.5 block">
                            [기술사 확인 요망]
                          </span>
                        ) : (
                          <span className="text-[#141414]">{item.remarks || '-'}</span>
                        )}
                      </td>
                    </tr>

                    {/* Detailed Reason Accordion */}
                    {isExpanded && item.detailReason && (
                      <tr className="bg-[#E4E3E0]/40 text-xs text-[#141414]">
                        <td colSpan={8} className="border border-[#141414] p-3 font-sans">
                          <div className="flex items-start space-x-2">
                            <span className="font-bold text-[#141414] font-mono uppercase flex-shrink-0 text-[11px]">
                              [AUDIT_REASON]:
                            </span>
                            <span className="leading-relaxed text-[11px]">{item.detailReason}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mandatory Disclaimer Footer (Exact High Density Style) */}
      <footer className="mt-2 bg-white border border-[#141414] p-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
          <div className="max-w-2xl">
            <h3 className="text-[10px] font-bold font-mono uppercase mb-1 opacity-50">
              System Disclaimer (기술 검토 법정 고지)
            </h3>
            <p className="text-xs sm:text-sm font-bold text-[#141414] tracking-tight leading-relaxed">
              {result.disclaimer}
            </p>
          </div>
          <div className="text-left sm:text-right font-mono text-[10px] opacity-60">
            <p>TIMESTAMP: {new Date().toISOString().replace('T', ' ').slice(0, 19)}</p>
            <p className="uppercase">HASH: 8A4F-2E9C-3B11-STRICT</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

