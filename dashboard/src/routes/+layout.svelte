<script>
	import '../app.css';
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="bg-white shadow-lg border-b">
		<div class="max-w-7xl mx-auto px-4">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<div class="hidden md:flex md:space-x-8">
						<a href="/" class="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">대시보드</a>
						<a href="/projects" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">프로젝트</a>
						<a href="/prds" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">요구사항</a>
						<a href="/designs" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">설계</a>
						<a href="/tasks" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">작업</a>
						<a href="/tests" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">테스트</a>
						<a href="/documents" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">문서</a>
						<a href="/kanban" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">칸반 보드</a>
						<a href="/gantt" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">간트 차트</a>
						<a href="/network" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">관계도</a>
						<a href="/database" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">DB 관리</a>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto py-6 px-4">
		<slot />
	</main>
</div>