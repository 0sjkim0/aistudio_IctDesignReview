import { ReviewResult, ReviewItem } from '../types';

export function runDeterministicSopReview(docText: string): ReviewResult {
  const text = docText || '';
  const items: ReviewItem[] = [];
  const missingChecklistItems: string[] = [];
  const internalInconsistencies: string[] = [];
  const deprecatedCitations: string[] = [];

  // Extract title
  const titleMatch = text.match(/공\s*사\s*명\s*[:：]\s*([^\n\r]+)/) ||
                     text.match(/([^\n\r]+공사\s*시방서)/) ||
                     text.match(/^([^\n\r]+)/);
  const docTitle = titleMatch ? titleMatch[1].trim() : '정보통신공사 공사시방서';

  // 1. Check Deprecated Articles (제19조 경과조치)
  if (/제\s*8\s*조\s*\(?\s*배선/i.test(text) || /구\s*제\s*8\s*조/.test(text) || /제\s*8\s*조에\s*따라\s*배선/.test(text)) {
    deprecatedCitations.push('구 제8조(배선의 규격) 인용 오류 → 현행 제6조로 변경됨 (제19조 경과조치)');
  }
  if (/제\s*11\s*조\s*\(?\s*통신실/i.test(text) || /구\s*제\s*11\s*조/.test(text) || /제\s*11\s*조에\s*따른\s*통신실/.test(text)) {
    deprecatedCitations.push('구 제11조(통신실 면적) 인용 오류 → 현행 제7조로 변경됨 (제19조 경과조치)');
  }
  if (/제\s*14\s*조\s*\(?\s*접지/i.test(text) || /구\s*제\s*14\s*조/.test(text) || /제\s*14\s*조에\s*따른\s*접지저항/.test(text)) {
    deprecatedCitations.push('구 제14조(접지저항) 인용 오류 → 현행 제9조로 변경됨 (제19조 경과조치)');
  }

  // 2. Check 13 Checklist Items from Article 4
  const checklistChecks = [
    { no: 1, name: '일반사항 (공사명·규모·적용기준)', regex: /(공사명|공사위치|공사개요|적용\s*기준|규모)/ },
    { no: 2, name: '배관공사 (종류 및 규격)', regex: /(배관\s*공사|전선관|배관규격|배관\s*공종)/ },
    { no: 3, name: '배선공사 (케이블 규격)', regex: /(배선\s*공사|광케이블|Cat\.?6|동축케이블|UTP)/i },
    { no: 4, name: '구내통신선로설비 (통신실 면적/위치)', regex: /(통신실|MDF|구내통신|구내통신선로)/ },
    { no: 5, name: '단자함 및 성단설비', regex: /(단자함|성단|패치패널|110\s*블록)/ },
    { no: 6, name: '접지설비 (접지저항/접지선)', regex: /(접지설비|접지저항|접지극|접지선)/ },
    { no: 7, name: '방송공동수신설비 (MATV/신호레벨)', regex: /(방송공동수신|TV\s*수신|MATV|공동시청|안테나)/i },
    { no: 8, name: '구내방송설비 (PA/비상방송 연동)', regex: /(구내방송|비상방송|PA설비|스피커|음향)/ },
    { no: 9, name: '수량산출 및 물량 (여유율 가산)', regex: /(수량산출|물량|여유율|수량집계)/ },
    { no: 10, name: '시험 및 검사 (4대 필수시험)', regex: /(시험\s*및\s*검사|준공시험|도통시험|성능시험)/ },
    { no: 11, name: '자재의 승인 (공사감독자/감리원 승인)', regex: /(자재\s*승인|승인\s*도서|자재의\s*승인|반입\s*검사)/ },
    { no: 12, name: '안전 및 보건관리 (5대 필수항목)', regex: /(안전\s*관리|보건관리|안전보건|안전교육|보호구)/ },
    { no: 13, name: '준공서류 및 하자보수 (담보책임기간)', regex: /(준공서류|하자보수|하자담보|준공도면)/ },
  ];

  checklistChecks.forEach((chk) => {
    if (!chk.regex.test(text)) {
      missingChecklistItems.push(`제4조 제${chk.no}호 [${chk.name}] 항목 본문 누락`);
    }
  });

  let itemIdx = 1;

  // Item 1: Horizontal Conduit (제5조 제1호)
  const horizConduitMatch = text.match(/(수평|세대내|실내)[^\n\r]*?(?:배관|전선관)[^\n\r]*?(\d+)\s*(?:mm|Ø|파이|호)/i) ||
                            text.match(/가요전선관\s*(\d+)\s*mm/i);
  if (horizConduitMatch) {
    const size = parseInt(horizConduitMatch[2] || horizConduitMatch[1], 10);
    const isCompliant = size >= 22;
    items.push({
      no: itemIdx++,
      item: '수평배관 최소 규격',
      specification: `가요전선관 ${size}mm`,
      standard: '안지름 22mm 이상',
      basisArticle: '제5조 제1호',
      judgment: isCompliant ? '적합' : '부적합',
      confidence: '상',
      remarks: isCompliant ? '기준 충족 (22mm 이상)' : `기준 미달 (${size}mm < 22mm), 22mm 이상으로 설계 변경 필요`,
      detailReason: '제5조 제1호에 따라 수평배관의 최소 호칭 규격은 22mm 이상이어야 합니다.',
    });
  } else if (/배관/.test(text)) {
    items.push({
      no: itemIdx++,
      item: '수평배관 최소 규격',
      specification: '규격 수치 미기재',
      standard: '안지름 22mm 이상',
      basisArticle: '제5조 제1호',
      judgment: '누락',
      confidence: '중',
      remarks: '수평배관의 관경 규격이 명시되지 않음',
      detailReason: '제5조 제1호에 따라 수평배관 규격을 22mm 이상으로 명기해야 합니다.',
    });
  }

  // Item 2: Vertical / Riser Conduit (제5조 제2호)
  const vertConduitMatch = text.match(/(수직|간선|입상)[^\n\r]*?(?:배관|전선관)[^\n\r]*?(\d+)\s*(?:mm|Ø|파이)/i);
  if (vertConduitMatch) {
    const size = parseInt(vertConduitMatch[2], 10);
    const isCompliant = size >= 36;
    items.push({
      no: itemIdx++,
      item: '수직간선배관 최소 규격',
      specification: `배관 ${size}mm`,
      standard: '안지름 36mm 이상',
      basisArticle: '제5조 제2호',
      judgment: isCompliant ? '적합' : '부적합',
      confidence: '상',
      remarks: isCompliant ? '기준 충족 (36mm 이상)' : `기준 미달 (${size}mm < 36mm)`,
    });
  }

  // Item 3: Lead-in Conduit (제5조 제3호)
  const leadinConduitMatch = text.match(/(인입|국선인입)[^\n\r]*?(?:배관|전선관)[^\n\r]*?(\d+)\s*(?:mm|Ø|파이)/i);
  if (leadinConduitMatch) {
    const size = parseInt(leadinConduitMatch[2], 10);
    const isCompliant = size >= 54;
    items.push({
      no: itemIdx++,
      item: '인입배관 최소 규격',
      specification: `인입관 ${size}mm`,
      standard: '안지름 54mm 이상',
      basisArticle: '제5조 제3호',
      judgment: isCompliant ? '적합' : '부적합',
      confidence: '상',
      remarks: isCompliant ? '기준 충족' : `기준 미달 (${size}mm < 54mm)`,
    });
  }

  // Item 4: Cabling Specifications (제6조 & Article 19 Transitory)
  const opticalMatch = text.match(/광케이블[^\n\r]*?(SM|MM)?[^\n\r]*?(\d+)\s*(?:코어|C|Core)/i);
  const utpMatch = text.match(/Cat\.?\s*(\d+)/i);
  const citesOldArt8 = /제\s*8\s*조\s*\(?\s*배선/.test(text) || /구\s*제\s*8\s*조/.test(text);

  if (opticalMatch || utpMatch) {
    const optCore = opticalMatch ? parseInt(opticalMatch[2], 10) : 0;
    const catNum = utpMatch ? parseInt(utpMatch[1], 10) : 0;
    const isOptCompliant = !opticalMatch || optCore >= 12;
    const isCatCompliant = !utpMatch || catNum >= 6;
    const isCompliant = isOptCompliant && isCatCompliant && !citesOldArt8;

    items.push({
      no: itemIdx++,
      item: '간선 및 수평배선 규격',
      specification: `${opticalMatch ? `광 ${optCore}코어` : ''} ${utpMatch ? `Cat.${catNum}` : ''} ${citesOldArt8 ? '(제8조 인용)' : ''}`.trim(),
      standard: '간선: 광 12코어 이상 / 수평: Cat.6 이상 (현행 제6조)',
      basisArticle: citesOldArt8 ? '제6조 (구 제8조 폐지)' : '제6조 제1호·제2호',
      judgment: citesOldArt8 ? '부적합' : isCompliant ? '적합' : '부적합',
      confidence: '상',
      remarks: citesOldArt8
        ? '배선 규격은 충족하나 폐지된 구 제8조 인용 오류 (현행 제6조로 정정 필요)'
        : isCompliant
        ? '기준 충족'
        : '배선 규격 기준 미달',
      detailReason: '제6조에 따라 간선 광케이블 12코어 이상 및 수평 Cat.6 이상 설치 필수.',
    });
  }

  // Item 5: Comm Room Floor Area (제7조)
  const areaMatch = text.match(/연면적[^\n\r]*?([0-9,]+)\s*(?:㎡|m2|m²)/i);
  const roomAreaMatch = text.match(/(?:통신실|MDF실)[^\n\r]*?(?:면적|바닥면적)[^\n\r]*?([0-9.]+)\s*(?:㎡|m2|m²)/i) ||
                        text.match(/(?:바닥면적|면적)[^\n\r]*?([0-9.]+)\s*(?:㎡|m2|m²)[^\n\r]*?(?:통신실|MDF실)/i);
  const citesOldArt11 = /제\s*11\s*조\s*\(?\s*통신실/.test(text) || /구\s*제\s*11\s*조/.test(text);

  if (roomAreaMatch) {
    const rArea = parseFloat(roomAreaMatch[1]);
    const bArea = areaMatch ? parseInt(areaMatch[1].replace(/,/g, ''), 10) : 1000;
    let reqArea = 15;
    if (bArea < 500) reqArea = 10;
    else if (bArea > 3000) reqArea = 20;

    const isAreaCompliant = rArea >= reqArea;
    const isCompliant = isAreaCompliant && !citesOldArt11;

    items.push({
      no: itemIdx++,
      item: '구내통신실 바닥면적',
      specification: `바닥면적 ${rArea}㎡ ${citesOldArt11 ? '(제11조 인용)' : ''}`,
      standard: `연면적 기준 ${reqArea}㎡ 이상 (현행 제7조)`,
      basisArticle: citesOldArt11 ? '제7조 (구 제11조 폐지)' : '제7조 제1항',
      judgment: citesOldArt11 ? '부적합' : isCompliant ? '적합' : '부적합',
      confidence: '상',
      remarks: citesOldArt11
        ? `폐지된 구 제11조 인용 오류 (현행 제7조). 면적(${rArea}㎡)은 기준(${reqArea}㎡) ${isAreaCompliant ? '충족' : '미달'}`
        : isCompliant
        ? '기준 충족'
        : `면적 부족 (${rArea}㎡ < ${reqArea}㎡)`,
    });
  }

  // Item 6: Grounding Resistance (제9조)
  const groundMatch = text.match(/(?:접지저항|접지)[^\n\r]*?(\d+)\s*(?:Ω|옴|ohm)/i);
  const isIntegrated = /(종합접지|통합접지|공통접지)/.test(text);
  const citesOldArt14 = /제\s*14\s*조\s*\(?\s*접지/.test(text) || /구\s*제\s*14\s*조/.test(text);

  if (groundMatch) {
    const ohm = parseInt(groundMatch[1], 10);
    const limit = isIntegrated ? 5 : 10;
    const isOhmCompliant = ohm <= limit;
    const isCompliant = isOhmCompliant && !citesOldArt14;

    items.push({
      no: itemIdx++,
      item: `접지저항 기준 (${isIntegrated ? '종합접지' : '단독접지'})`,
      specification: `${ohm}Ω 이하 ${citesOldArt14 ? '(제14조 인용)' : ''}`,
      standard: `${limit}Ω 이하 (현행 제9조)`,
      basisArticle: citesOldArt14 ? '제9조 (구 제14조 폐지)' : '제9조 제1호',
      judgment: citesOldArt14 ? '부적합' : isCompliant ? '적합' : '부적합',
      confidence: '상',
      remarks: citesOldArt14
        ? '폐지된 구 제14조 인용 오류 (현행 제9조로 정정 필요)'
        : isCompliant
        ? '기준 충족'
        : `저항값 초과 (${ohm}Ω > ${limit}Ω 이하)`,
    });
  }

  // Item 7: MATV Signal Level (제10조)
  const matvMatch = text.match(/(\d+)\s*~\s*(\d+)\s*(?:dBμV|dBuV|dB)/i) ||
                    text.match(/신호레벨[^\n\r]*?(\d+)[^\n\r]*?(\d+)/);
  if (matvMatch) {
    const minLev = parseInt(matvMatch[1], 10);
    const maxLev = parseInt(matvMatch[2], 10);
    const isCompliant = minLev >= 47 && maxLev <= 77;
    items.push({
      no: itemIdx++,
      item: '방송공동수신 세대단자 신호레벨',
      specification: `${minLev} ~ ${maxLev} dBμV`,
      standard: '47 ~ 77 dBμV 범위 내',
      basisArticle: '제10조 제2호',
      judgment: isCompliant ? '적합' : '부적합',
      confidence: '상',
      remarks: isCompliant ? '기준 충족' : `신호레벨 범위 벗어남 (${minLev}~${maxLev} dBμV)`,
    });
  }

  // Item 8: Quantity Calculation & Margin 5% (제12조)
  const hasQuantitySection = /수량산출|여유율/.test(text);
  const marginMatch = text.match(/여유율[^\n\r]*?(\d+)\s*%/i);
  const totalQtyMatch = text.match(/합\s*계[^\n\r]*?([0-9,]+)\s*m/i) || text.match(/총\s*연장[^\n\r]*?([0-9,]+)\s*m/i);
  const sumMatches = Array.from(text.matchAll(/:\s*([0-9,]+)\s*m/gi));

  if (hasQuantitySection) {
    const margin = marginMatch ? parseInt(marginMatch[1], 10) : 0;
    const isMarginOk = margin >= 5;

    // Check internal math if numbers exist
    if (sumMatches.length >= 3 && totalQtyMatch) {
      const parts = sumMatches.slice(0, sumMatches.length - 1).map(m => parseInt(m[1].replace(/,/g, ''), 10));
      const calcRawSum = parts.reduce((a, b) => a + b, 0);
      const expectedTotal = Math.round(calcRawSum * 1.05);
      const givenTotal = parseInt(totalQtyMatch[1].replace(/,/g, ''), 10);

      const isMathExact = givenTotal === expectedTotal;
      if (!isMathExact) {
        internalInconsistencies.push(
          `수량산출서 합계 불일치: 실측합계(${calcRawSum}m) × 여유율 5% 가산 시 ${expectedTotal}m이나, 기재된 합계는 ${givenTotal}m임 (제12조 제2항 및 제18조 위반)`
        );
      }

      items.push({
        no: itemIdx++,
        item: '배관 수량산출 및 여유율(5%) 가산',
        specification: `실측합계 ${calcRawSum}m, 여유율 ${margin}%, 기재합계 ${givenTotal}m`,
        standard: `실측연장에 5% 이상 가산 (산출합계 ${expectedTotal}m 일치 필수)`,
        basisArticle: '제12조 제1항·제2항',
        judgment: (isMarginOk && isMathExact) ? '적합' : '부적합',
        confidence: '상',
        remarks: isMathExact
          ? '기준 충족 (여유율 5% 가산 및 계산 합계 일치)'
          : `산출서 합계 오차 발생 (기재값 ${givenTotal}m ≠ 정산값 ${expectedTotal}m)`,
        detailReason: '제12조 제1항 및 제2항에 따라 수량산출서의 합계는 산출량 총합에 여유율을 가산한 값과 일치해야 합니다.',
      });
    } else {
      items.push({
        no: itemIdx++,
        item: '배관 수량산출 여유율 기준',
        specification: marginMatch ? `여유율 ${margin}%` : '여유율 미표기',
        standard: '5% 이상 가산',
        basisArticle: '제12조 제1항',
        judgment: isMarginOk ? '적합' : '부적합',
        confidence: '상',
        remarks: isMarginOk ? '기준 충족' : '여유율 5% 미달 또는 미적용',
      });
    }
  }

  // Item 9: PA & Emergency Interlock (제11조)
  if (/구내방송|비상방송|PA/.test(text)) {
    const hasInterlock = /(연동|비상방송\s*겸용|소방\s*연동|비상방송\s*설비)/.test(text);
    items.push({
      no: itemIdx++,
      item: '구내방송설비 및 비상방송 연동',
      specification: hasInterlock ? '비상방송 연동 구성' : '비상방송 연동 미언급',
      standard: '층별/구역별 선택방송 및 화재안전기준 비상방송 연동',
      basisArticle: '제11조 제1호·제2호',
      judgment: hasInterlock ? '적합' : '부적합',
      confidence: hasInterlock ? '상' : '하',
      remarks: hasInterlock ? '기준 충족' : '비상방송설비 연동 조건 확인 필요 [기술사 확인 요망]',
    });
  }

  // Item 10: 4 Mandatory Tests (제13조)
  if (/시험|검사/.test(text)) {
    const hasContinuity = /도통/.test(text);
    const hasGround = /접지/.test(text);
    const hasSignal = /신호|수신/.test(text);
    const hasAcoustic = /음압|음향/.test(text);
    const testCount = [hasContinuity, hasGround, hasSignal, hasAcoustic].filter(Boolean).length;
    const isComplete = testCount === 4;

    items.push({
      no: itemIdx++,
      item: '준공 전 4대 필수 시험·검사',
      specification: `도통(${hasContinuity?'○':'✕'}), 접지저항(${hasGround?'○':'✕'}), 신호품질(${hasSignal?'○':'✕'}), 방송음압(${hasAcoustic?'○':'✕'})`,
      standard: '4대 필수 시험 (도통, 접지저항, 신호품질, 방송음압) 전 항목 실시',
      basisArticle: '제13조 제1항',
      judgment: isComplete ? '적합' : '부적합',
      confidence: '상',
      remarks: isComplete ? '기준 충족' : `필수 시험 항목 일부 누락 (${4 - testCount}개 누락)`,
    });
  }

  // Item 11: Safety Management 5 Items (제15조)
  if (/안전/.test(text)) {
    const hasOrg = /안전\s*관리\s*조직|조직/.test(text);
    const hasRisk = /위험\s*요인|대책/.test(text);
    const hasEdu = /안전\s*교육/.test(text);
    const hasPpe = /보호구|보호\s*장구/.test(text);
    const hasReport = /보고\s*체계|비상\s*연락/.test(text);
    const safetyCount = [hasOrg, hasRisk, hasEdu, hasPpe, hasReport].filter(Boolean).length;

    items.push({
      no: itemIdx++,
      item: '안전 및 보건관리 5대 필수 항목',
      specification: `조직(${hasOrg?'○':'✕'}), 위험대책(${hasRisk?'○':'✕'}), 교육(${hasEdu?'○':'✕'}), 보호구(${hasPpe?'○':'✕'}), 보고체계(${hasReport?'○':'✕'})`,
      standard: '안전조직, 위험대책, 안전교육, 보호구지급, 보고체계 5개 항목 필수 기재',
      basisArticle: '제15조 제1호~제5호',
      judgment: safetyCount === 5 ? '적합' : '부적합',
      confidence: '상',
      remarks: safetyCount === 5 ? '기준 충족' : `5대 안전관리 항목 중 ${5 - safetyCount}개 항목 누락`,
    });
  }

  // Item 12: Mutual Consistency (제18조)
  const floorMatches = Array.from(text.matchAll(/(지상\s*\d+\s*층|지하\s*\d+\s*층)/g)).map(m => m[0]);
  const uniqueFloors = Array.from(new Set(floorMatches));
  if (uniqueFloors.length > 2) {
    internalInconsistencies.push(`문서 내 층수 표기 상이: [${uniqueFloors.join(', ')}] 상호 불일치 (제18조 위반)`);
  }

  if (internalInconsistencies.length > 0) {
    items.push({
      no: itemIdx++,
      item: '설계도서 상호 일치성',
      specification: internalInconsistencies[0],
      standard: '시방서, 도면, 수량산출서 간 수치 및 규모 일치',
      basisArticle: '제18조 제1호·제2호',
      judgment: '부적합',
      confidence: '상',
      remarks: '문서 내부 상호 불일치 발견 — 즉시 대조 및 정정 필요',
    });
  }

  // Ensure minimum items exist
  if (items.length === 0) {
    items.push({
      no: 1,
      item: '시방서 형식 및 필수 기재사항',
      specification: '기재 내용 불충분',
      standard: '제4조 13개 필수 기재항목 구성',
      basisArticle: '제4조',
      judgment: '확인 필요',
      confidence: '하',
      remarks: '문서 내용이 적어 정밀 조문 대조 불가 [기술사 확인 요망]',
    });
  }

  // Summary counts
  const compliant = items.filter(i => i.judgment === '적합').length;
  const nonCompliant = items.filter(i => i.judgment === '부적합').length;
  const missing = items.filter(i => i.judgment === '누락').length;
  const needCheck = items.filter(i => i.judgment === '확인 필요').length;
  const engineerReviewCount = items.filter(i => i.confidence === '하' || i.remarks.includes('[기술사 확인 요망]')).length;

  return {
    title: docTitle,
    items,
    missingChecklistItems,
    internalInconsistencies,
    deprecatedCitations,
    summary: {
      total: items.length,
      compliant,
      nonCompliant,
      missing,
      needCheck,
      engineerReviewCount,
    },
    disclaimer: '본 결과는 검토 초안이며 기술사의 확인 후 사용해야 합니다.',
  };
}
