<script>
	import { onMount } from 'svelte';

	let tasks = [];
	let loading = true;
	let error = null;

	onMount(async () => {
		await loadTasks();
	});

	async function loadTasks() {
		try {
			loading = true;
			const response = await fetch('/api/tasks');
			if (response.ok) {
				tasks = await response.json();
			} else {
				error = '작업 목록을 불러올 수 없습니다';
			}
		} catch (e) {
			error = '작업 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function updateTaskStatus(id, status) {
		try {
			const response = await fetch(`/api/tasks/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			});

			if (response.ok) {
				await loadTasks();
			} else {
				alert('작업 상태 변경 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('상태 변경 중 오류: ' + e.message);
		}
	}

	async function deleteTask(id) {
		if (!confirm('이 작업을 삭제하시겠습니까?')) return;
		
		try {
			const response = await fetch(`/api/tasks/${id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await loadTasks();
			} else {
				alert('작업 삭제 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('삭제 중 오류: ' + e.message);
		}
	}

	function getStatusColor(status) {
		switch (status) {
			case 'completed': return 'bg-green-100 text-green-800';
			case 'in_progress': return 'bg-blue-100 text-blue-800';
			case 'pending': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status) {
		switch (status) {
			case 'completed': return '완료';
			case 'in_progress': return '진행중';
			case 'pending': return '대기중';
			default: return status;
		}
	}

	function getPriorityColor(priority) {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-800';
			case 'medium': return 'bg-yellow-100 text-yellow-800';
			case 'low': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getPriorityLabel(priority) {
		switch (priority) {
			case 'high': return '높음';
			case 'medium': return '보통';
			case 'low': return '낮음';
			default: return priority;
		}
	}

	// 상태별 그룹화
	$: tasksByStatus = {
		pending: tasks.filter(t => t.status === 'pending'),
		in_progress: tasks.filter(t => t.status === 'in_progress'),  
		completed: tasks.filter(t => t.status === 'completed')
	};
</script>

<svelte:head>
	<title>작업 관리 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">작업 관리</h1>
			<p class="text-gray-600 mt-1">프로젝트 작업을 관리합니다</p>
		</div>
		<a href="/tasks/new" class="btn btn-primary">
			✅ 새 작업 추가
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
			<button 
				class="mt-2 text-sm text-red-600 hover:text-red-800"
				on:click={loadTasks}
			>
				다시 시도
			</button>
		</div>
	{:else if tasks.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">✅</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">작업이 없습니다</h3>
			<p class="text-gray-600 mb-6">첫 번째 작업을 추가해보세요</p>
			<a href="/tasks/new" class="btn btn-primary">
				새 작업 추가
			</a>
		</div>
	{:else}
		<!-- 상태별 칸반 보드 -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- 대기중 -->
			<div class="bg-gray-50 rounded-lg p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
					<span class="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
					대기중 ({tasksByStatus.pending.length})
				</h2>
				<div class="space-y-3">
					{#each tasksByStatus.pending as task}
						<div class="card bg-white hover:shadow-md transition-shadow">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 text-sm line-clamp-2">
									{task.title}
								</h3>
								<span class="badge {getPriorityColor(task.priority)} ml-2 flex-shrink-0">
									{getPriorityLabel(task.priority)}
								</span>
							</div>

							{#if task.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">
									{task.description}
								</p>
							{/if}

							{#if task.due_date}
								<div class="text-xs text-gray-500 mb-3">
									마감: {new Date(task.due_date).toLocaleDateString('ko-KR')}
								</div>
							{/if}

							{#if task.plan_title}
								<div class="text-xs text-blue-600 mb-3">
									📅 {task.plan_title}
								</div>
							{/if}

							<div class="flex space-x-1">
								<button 
									class="flex-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
									on:click={() => updateTaskStatus(task.id, 'in_progress')}
								>
									시작
								</button>
								<button 
									class="text-xs px-2 py-1 text-red-600 hover:text-red-800"
									on:click={() => deleteTask(task.id)}
								>
									삭제
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 진행중 -->
			<div class="bg-blue-50 rounded-lg p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
					<span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
					진행중 ({tasksByStatus.in_progress.length})
				</h2>
				<div class="space-y-3">
					{#each tasksByStatus.in_progress as task}
						<div class="card bg-white hover:shadow-md transition-shadow border-l-4 border-blue-500">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 text-sm line-clamp-2">
									{task.title}
								</h3>
								<span class="badge {getPriorityColor(task.priority)} ml-2 flex-shrink-0">
									{getPriorityLabel(task.priority)}
								</span>
							</div>

							{#if task.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">
									{task.description}
								</p>
							{/if}

							{#if task.due_date}
								<div class="text-xs text-gray-500 mb-3">
									마감: {new Date(task.due_date).toLocaleDateString('ko-KR')}
								</div>
							{/if}

							{#if task.plan_title}
								<div class="text-xs text-blue-600 mb-3">
									📅 {task.plan_title}
								</div>
							{/if}

							<div class="flex space-x-1">
								<button 
									class="flex-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
									on:click={() => updateTaskStatus(task.id, 'completed')}
								>
									완료
								</button>
								<button 
									class="flex-1 text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
									on:click={() => updateTaskStatus(task.id, 'pending')}
								>
									대기
								</button>
								<button 
									class="text-xs px-2 py-1 text-red-600 hover:text-red-800"
									on:click={() => deleteTask(task.id)}
								>
									삭제
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 완료 -->
			<div class="bg-green-50 rounded-lg p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
					<span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
					완료 ({tasksByStatus.completed.length})
				</h2>
				<div class="space-y-3">
					{#each tasksByStatus.completed as task}
						<div class="card bg-white hover:shadow-md transition-shadow border-l-4 border-green-500 opacity-75">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 text-sm line-clamp-2">
									{task.title}
								</h3>
								<span class="badge {getPriorityColor(task.priority)} ml-2 flex-shrink-0">
									{getPriorityLabel(task.priority)}
								</span>
							</div>

							{#if task.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">
									{task.description}
								</p>
							{/if}

							{#if task.due_date}
								<div class="text-xs text-gray-500 mb-3">
									마감: {new Date(task.due_date).toLocaleDateString('ko-KR')}
								</div>
							{/if}

							{#if task.plan_title}
								<div class="text-xs text-blue-600 mb-3">
									📅 {task.plan_title}
								</div>
							{/if}

							<div class="flex space-x-1">
								<button 
									class="flex-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
									on:click={() => updateTaskStatus(task.id, 'in_progress')}
								>
									재시작
								</button>
								<button 
									class="text-xs px-2 py-1 text-red-600 hover:text-red-800"
									on:click={() => deleteTask(task.id)}
								>
									삭제
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- 전체 통계 -->
		<div class="bg-gray-50 rounded-lg p-4">
			<h3 class="text-sm font-medium text-gray-700 mb-2">전체 통계</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
				<div>
					<div class="text-gray-500">전체 작업</div>
					<div class="text-lg font-semibold text-gray-900">{tasks.length}</div>
				</div>
				<div>
					<div class="text-gray-500">진행중</div>
					<div class="text-lg font-semibold text-blue-600">{tasksByStatus.in_progress.length}</div>
				</div>
				<div>
					<div class="text-gray-500">완료</div>
					<div class="text-lg font-semibold text-green-600">{tasksByStatus.completed.length}</div>
				</div>
				<div>
					<div class="text-gray-500">완료율</div>
					<div class="text-lg font-semibold text-purple-600">
						{tasks.length > 0 ? Math.round((tasksByStatus.completed.length / tasks.length) * 100) : 0}%
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}
</style>