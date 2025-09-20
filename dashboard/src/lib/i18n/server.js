// 서버사이드용 i18n 설정
import { register, init } from 'svelte-i18n';

// 번역 파일 등록 (서버에서는 동기적으로 로드)
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

// 서버에서 즉시 초기화
init({
  fallbackLocale: 'ko',
  initialLocale: 'ko',
});

export const supportedLocales = ['ko', 'en', 'zh-CN', 'ja', 'pt-BR', 'de', 'hi', 'es', 'ru', 'id'];