<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { _, isLoading } from 'svelte-i18n';
	import { initI18n } from '../lib/i18n/index.js';
	import LanguageSwitcher from '../lib/components/LanguageSwitcher.svelte';
	// i18n 초기화
	if (typeof window !== 'undefined') {
		initI18n();
	}

	// --- 데이터 정의 ---
	const mainMenus = [
		{ path: '/projects', labelKey: 'nav.projects' },
		{ path: '/prds', labelKey: 'nav.requirements' },
		{ path: '/designs', labelKey: 'nav.designs' },
		{ path: '/tasks', labelKey: 'nav.tasks' },
		{ path: '/tests', labelKey: 'nav.tests' },
		{ path: '/documents', labelKey: 'nav.documents' }
	];

	const subMenus = [
		{ path: '/deployments', labelKey: 'nav.deployments' },
		{ path: '/operations', labelKey: 'nav.operations' },
		{ path: '/environments', labelKey: 'nav.environments' },
		{ path: '/kanban', labelKey: 'nav.kanban' },
		{ path: '/gantt', labelKey: 'nav.gantt' },
		{ path: '/network', labelKey: 'nav.network' },
		{ path: '/database', labelKey: 'nav.database' }
	];

	// --- 반응형 상태 ---
	// $page.url.pathname을 직접 사용하여 Svelte의 반응성을 최대한 활용합니다.
	// $: 구문 대신 템플릿에서 직접 $page.url.pathname을 참조합니다.

	// --- 활성 메뉴 확인 함수 ---
	// 현재 경로와 메뉴 경로를 비교하여 활성 상태를 결정합니다.
	// startsWith를 사용하여 하위 경로에서도 부모 메뉴가 활성화되도록 합니다.
	function isActive(menuPath, currentPath) {
		// 루트 경로는 정확히 일치할 때만 활성화
		if (menuPath === '/') {
			return currentPath === '/';
		}
		// 다른 경로는 해당 경로로 시작하는 모든 하위 경로를 포함하여 활성화
		return currentPath.startsWith(menuPath);
	}
</script>

<div class="min-h-screen bg-gray-50 font-sans">
	<!-- 상단 네비게이션 바 -->
	<nav class="bg-white shadow-sm sticky top-0 z-50">
		<div class="max-w-screen-xl mx-auto px-4">
			<!-- 메인 네비게이션 -->
			<div class="flex items-center justify-between h-16">
				<!-- 로고 -->
				<a href="/" class="flex-shrink-0 flex items-center space-x-2">
					<svg class="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 7L12 12L22 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 12V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
					<span class="text-2xl font-bold text-gray-800 tracking-tight">WorkflowMCP</span>
				</a>

				<!-- 메인 메뉴 (데스크탑) -->
				<div class="hidden md:flex items-center space-x-2">
					{#each mainMenus as menu}
						<a
							href={menu.path}
							class="px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ease-in-out"
							class:bg-blue-600={isActive(menu.path, $page.url.pathname)}
							class:text-white={isActive(menu.path, $page.url.pathname)}
							class:shadow-md={isActive(menu.path, $page.url.pathname)}
							class:text-gray-600={!isActive(menu.path, $page.url.pathname)}
							class:hover:bg-gray-100={!isActive(menu.path, $page.url.pathname)}
							class:hover:text-gray-900={!isActive(menu.path, $page.url.pathname)}
						>
							{$isLoading ? menu.path.slice(1) : $_(menu.labelKey)}
						</a>
					{/each}
				</div>

				<!-- 오른쪽 영역 -->
				<div class="flex items-center">
					<LanguageSwitcher />
					<!-- 모바일 메뉴 버튼 (필요 시 추가) -->
				</div>
			</div>

			<!-- 서브 네비게이션 -->
			<div class="h-12 flex items-center justify-center border-t border-gray-200">
				<div class="flex space-x-2">
					{#each subMenus as menu}
						<a
							href={menu.path}
							class="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ease-in-out"
							class:bg-blue-100={isActive(menu.path, $page.url.pathname)}
							class:text-blue-700={isActive(menu.path, $page.url.pathname)}
							class:font-bold={isActive(menu.path, $page.url.pathname)}
							class:text-gray-500={!isActive(menu.path, $page.url.pathname)}
							class:hover:bg-gray-100={!isActive(menu.path, $page.url.pathname)}
							class:hover:text-gray-700={!isActive(menu.path, $page.url.pathname)}
						>
							{$isLoading ? menu.path.slice(1) : $_(menu.labelKey)}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</nav>

	<!-- 메인 콘텐츠 -->
	<main class="max-w-screen-xl mx-auto py-8 px-4">
		<slot />
	</main>

	<!-- 푸터 -->
	<footer class="bg-white border-t mt-12">
		<div class="max-w-screen-xl mx-auto py-6 px-4 text-center text-sm text-gray-500">
			<p>&copy; {new Date().getFullYear()} WorkflowMCP. All rights reserved.</p>
		</div>
	</footer>
</div>
