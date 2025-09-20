/**
 * 언어별 설정 및 번역 완성도 정보
 * 번역 완성도 데이터는 2025-09-20 분석 결과 기준
 */

export const languageConfig = {
  'ko': {
    native: '한국어',
    english: 'Korean',
    completeness: 100.0,
    status: 'excellent', // excellent(90%+), good(75-89%), limited(50-74%), poor(<50%)
    missingKeys: 0,
    ready: true
  },
  'en': {
    native: 'English',
    english: 'English',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  },
  'zh-CN': {
    native: '中文',
    english: 'Chinese (Simplified)',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  },
  'ja': {
    native: '日本語',
    english: 'Japanese',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  },
  'pt-BR': {
    native: 'Português',
    english: 'Portuguese (Brazilian)',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  },
  'de': {
    native: 'Deutsch',
    english: 'German',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  },
  'es': {
    native: 'Español',
    english: 'Spanish',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  },
  'hi': {
    native: 'हिंदी',
    english: 'Hindi',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  },
  'id': {
    native: 'Bahasa Indonesia',
    english: 'Indonesian',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  },
  'ru': {
    native: 'Русский',
    english: 'Russian',
    completeness: 100.0,
    status: 'excellent',
    missingKeys: 0,
    ready: true
  }
};

/**
 * 상태별 스타일 클래스
 */
export const statusStyles = {
  excellent: {
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
    borderClass: 'border-green-200',
    badgeClass: 'bg-green-100 text-green-800'
  },
  good: {
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-800'
  },
  limited: {
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-700',
    borderClass: 'border-yellow-200',
    badgeClass: 'bg-yellow-100 text-yellow-800'
  },
  poor: {
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    badgeClass: 'bg-red-100 text-red-800'
  }
};

/**
 * 준비된 언어 목록 (사용자에게 기본적으로 보여줄 언어들)
 */
export const readyLanguages = Object.keys(languageConfig).filter(
  locale => languageConfig[locale].ready
);

/**
 * 개발 중인 언어 목록 (고급 사용자가 선택할 수 있는 언어들)
 */
export const developmentLanguages = Object.keys(languageConfig).filter(
  locale => !languageConfig[locale].ready
);

/**
 * 모든 지원 언어 목록
 */
export const supportedLocales = Object.keys(languageConfig);

/**
 * 언어 상태 텍스트
 */
export const statusLabels = {
  excellent: '완료',
  good: '양호',
  limited: '제한적',
  poor: '불완전'
};