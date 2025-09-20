import { register, init, getLocaleFromNavigator, locale } from 'svelte-i18n';

import { supportedLocales, languageConfig, readyLanguages } from './language-config.js';

// 번역 파일 등록
register('ko', () => import('./locales/ko.json'));
register('en', () => import('./locales/en.json'));
register('zh-CN', () => import('./locales/zh-CN.json'));
register('ja', () => import('./locales/ja.json'));
register('pt-BR', () => import('./locales/pt-BR.json'));
register('de', () => import('./locales/de.json'));
register('hi', () => import('./locales/hi.json'));
register('es', () => import('./locales/es.json'));
register('ru', () => import('./locales/ru.json'));
register('id', () => import('./locales/id.json'));

// 로컬 스토리지에서 저장된 언어 가져오기
function getSavedLocale() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('locale');
  }
  return null;
}

// 언어 설정을 로컬 스토리지에 저장
export function saveLocale(newLocale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', newLocale);
  }
}

// 지능적인 폴백 언어 결정
function getSmartFallbackLocale(targetLocale) {
  // 1. 타겟 언어가 준비된 언어(75%+ 완성도)라면 영어 폴백
  if (readyLanguages.includes(targetLocale)) {
    return 'en';
  }

  // 2. 타겟 언어가 불완전하다면 품질 기반 폴백 선택
  const targetConfig = languageConfig[targetLocale];

  // 아시아 언어군: 한국어 → 영어 폴백
  if (['zh-CN', 'ja', 'ko'].includes(targetLocale)) {
    return targetConfig?.completeness >= 85 ? 'en' : 'ko';
  }

  // 유럽 언어군: 영어 → 한국어 폴백
  if (['de', 'es', 'pt-BR', 'ru'].includes(targetLocale)) {
    return targetConfig?.completeness >= 85 ? 'ko' : 'en';
  }

  // 기타 언어: 영어 폴백
  return 'en';
}

// 다중 폴백 체인 생성
function createFallbackChain(targetLocale) {
  const chain = [targetLocale];
  const primary = getSmartFallbackLocale(targetLocale);
  const secondary = primary === 'en' ? 'ko' : 'en';

  if (primary !== targetLocale) chain.push(primary);
  if (secondary !== targetLocale && secondary !== primary) chain.push(secondary);

  return chain;
}

// i18n 초기화
export function initI18n() {
  const savedLocale = getSavedLocale();
  const browserLocale = getLocaleFromNavigator();

  // 기본 언어는 한국어, 저장된 언어가 있으면 우선 사용
  let initialLocale = 'ko';

  if (savedLocale && supportedLocales.includes(savedLocale)) {
    initialLocale = savedLocale;
  } else if (browserLocale && supportedLocales.includes(browserLocale)) {
    initialLocale = browserLocale;
  }

  // 지능적인 폴백 체인 생성
  const fallbackChain = createFallbackChain(initialLocale);
  const primaryFallback = fallbackChain[1] || 'en';

  init({
    fallbackLocale: primaryFallback,
    initialLocale: initialLocale,
  });

  // 개발 환경에서 폴백 정보 로깅
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.log(`🌐 i18n 초기화: ${initialLocale}, 폴백 체인: ${fallbackChain.join(' → ')}`);
  }
}

// SSR 환경에서 즉시 초기화 (지능적인 폴백 적용)
const ssrFallbackChain = createFallbackChain('ko');
init({
  fallbackLocale: ssrFallbackChain[1] || 'en',
  initialLocale: 'ko',
});

export { locale };