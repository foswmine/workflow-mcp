<script>
	import '../app.css';
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="bg-white shadow-lg border-b">
		<div class="max-w-7xl mx-auto px-4">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<h1 class="text-xl font-bold text-gray-900">WorkflowMCP Dashboard</h1>
					</div>
					<div class="hidden md:ml-6 md:flex md:space-x-8">
						<a href="/" class="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">대시보드</a>
						<a href="/prds" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">요구사항 정리</a>
						<a href="/designs" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">설계 관리</a>
						<a href="/tasks" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">작업 관리</a>
						<a href="/tests" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">테스트 관리</a>
						<a href="/documents" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">문서 관리</a>
						<a href="/kanban" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">칸반 보드</a>
						<a href="/gantt" class="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">간트 차트</a>
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