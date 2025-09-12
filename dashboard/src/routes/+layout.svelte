<script>
	import '../app.css';
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="bg-white shadow-lg border-b">
		<div class="max-w-7xl mx-auto px-4">
			<!-- 2줄 네비게이션 구조 -->
			<div class="py-3">
				<!-- 첫 번째 줄: 대시보드 + 핵심 관리 기능 -->
				<div class="flex items-center justify-center mb-2">
					<div class="flex space-x-6">
						<a href="/" class="text-gray-900 hover:text-blue-600 px-3 py-1 text-sm font-medium border-b-2 border-blue-600">대시보드</a>
						<a href="/projects" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">프로젝트</a>
						<a href="/prds" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">요구사항</a>
						<a href="/designs" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">설계</a>
						<a href="/tasks" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">작업</a>
						<a href="/tests" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">테스트</a>
						<a href="/documents" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">문서</a>
					</div>
				</div>

				<!-- 두 번째 줄: 운영 및 시각화 기능 -->
				<div class="flex items-center justify-center">
					<div class="flex space-x-6">
						<a href="/deployments" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">배포</a>
						<a href="/operations" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">운영</a>
						<a href="/environments" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">환경</a>
						<a href="/kanban" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">칸반 보드</a>
						<a href="/gantt" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">간트 차트</a>
						<a href="/network" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">관계도</a>
						<a href="/database" class="text-gray-500 hover:text-blue-600 px-3 py-1 text-sm font-medium">DB 관리</a>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto py-6 px-4">
		<slot />
	</main>
</div>