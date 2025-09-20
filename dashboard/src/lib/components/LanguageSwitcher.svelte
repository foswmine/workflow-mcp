<script>
  import { locale, _ } from 'svelte-i18n';
  import { saveLocale } from '../i18n/index.js';
  import {
    languageConfig,
    statusStyles,
    statusLabels,
    readyLanguages,
    developmentLanguages
  } from '../i18n/language-config.js';

  let isOpen = false;
  let showAdvanced = false;

  // 현재 locale을 reactive하게 추적
  $: currentLocale = $locale || 'ko'; // 기본값을 한국어로 설정

  // 언어 변경 함수
  function changeLanguage(newLocale) {
    // 불완전한 번역 언어 선택 시 경고 (개발 환경에서만)
    const config = languageConfig[newLocale];
    if (config && !config.ready && typeof window !== 'undefined') {
      const fallbackLang = ['zh-CN', 'ja', 'ko'].includes(newLocale) ? '한국어' : '영어';
      const confirmChange = confirm(
        `이 언어는 번역이 ${config.completeness.toFixed(1)}%만 완성되었습니다. 누락된 텍스트는 ${fallbackLang}로 표시됩니다. 계속하시겠습니까?`
      );
      if (!confirmChange) {
        isOpen = false;
        return;
      }
    }

    locale.set(newLocale);
    saveLocale(newLocale);
    isOpen = false;
    showAdvanced = false;
  }

  // 드롭다운 외부 클릭 시 닫기
  function handleClickOutside(event) {
    if (!event.target.closest('.language-switcher')) {
      isOpen = false;
    }
  }

  $: if (typeof window !== 'undefined') {
    if (isOpen) {
      window.addEventListener('click', handleClickOutside);
    } else {
      window.removeEventListener('click', handleClickOutside);
    }
  }
</script>

<div class="relative language-switcher">
  <button
    on:click={() => isOpen = !isOpen}
    class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
    type="button"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
    <span>{languageConfig[currentLocale]?.native || currentLocale}</span>
    <svg class="w-4 h-4 transition-transform" class:rotate-180={isOpen} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div class="absolute right-0 z-50 mt-2 w-64 rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5">
      <!-- 준비된 언어들 -->
      <div class="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
        권장 언어
      </div>
      {#each readyLanguages as localeCode}
        {@const config = languageConfig[localeCode]}
        {@const styles = statusStyles[config.status]}
        <button
          on:click={() => changeLanguage(localeCode)}
          class="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
          class:bg-blue-50={localeCode === currentLocale}
          class:text-blue-900={localeCode === currentLocale}
          type="button"
        >
          <span class="flex-1 text-left text-gray-700">{config.native}</span>
          <div class="flex items-center space-x-2">
            <span class="text-xs px-2 py-1 rounded-full {styles.badgeClass}">
              {Math.round(config.completeness)}%
            </span>
            {#if localeCode === currentLocale}
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </div>
        </button>
      {/each}

      <!-- 개발 중인 언어들 -->
      {#if developmentLanguages.length > 0}
        <div class="border-t border-gray-100 mt-2 pt-2">
          <button
            on:click={() => showAdvanced = !showAdvanced}
            class="flex items-center w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
            type="button"
          >
            <span class="flex-1 text-left">개발 중인 언어 ({developmentLanguages.length}개)</span>
            <svg class="w-3 h-3 transition-transform" class:rotate-180={showAdvanced} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if showAdvanced}
            {#each developmentLanguages as localeCode}
              {@const config = languageConfig[localeCode]}
              {@const styles = statusStyles[config.status]}
              <button
                on:click={() => changeLanguage(localeCode)}
                class="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none {styles.bgClass} {styles.borderClass} border-l-2 ml-2 mr-1 rounded"
                class:bg-blue-50={localeCode === currentLocale}
                class:text-blue-900={localeCode === currentLocale}
                type="button"
              >
                <span class="flex-1 text-left {styles.textClass}">{config.native}</span>
                <div class="flex items-center space-x-2">
                  <span class="text-xs px-2 py-1 rounded-full {styles.badgeClass}">
                    {Math.round(config.completeness)}%
                  </span>
                  {#if localeCode === currentLocale}
                    <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </div>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .rotate-180 {
    transform: rotate(180deg);
  }
</style>