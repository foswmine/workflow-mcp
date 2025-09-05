<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let plans = [];
	let loading = true;
	let error = null;

	onMount(async () => {
		await loadPlans();
	});

	async function loadPlans() {
		try {
			loading = true;
			const response = await fetch('/api/plans');
			if (response.ok) {
				plans = await response.json();
			} else {
				error = '계획 목록을 불러올 수 없습니다';
			}
		} catch (e) {
			error = '계획 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function deletePlan(id) {
		if (!confirm('이 계획을 삭제하시겠습니까?')) return;
		
		try {
			const response = await fetch(`/api/plans/${id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await loadPlans();
			} else {
				alert('계획 삭제 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('삭제 중 오류: ' + e.message);
		}
	}

	function getStatusColor(status) {
		switch (status) {
			case 'active': return 'bg-green-100 text-green-800';
			case 'inactive': return 'bg-gray-100 text-gray-800';
			case 'completed': return 'bg-blue-100 text-blue-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status) {
		switch (status) {
			case 'active': return '활성';
			case 'inactive': return '비활성';
			case 'completed': return '완료';
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
</script>

<svelte:head>
	<title>계획 관리 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">계획 관리</h1>
			<p class="text-gray-600 mt-1">프로젝트 계획을 관리합니다</p>
		</div>
		<a href="/plans/new" class="btn btn-primary">
			📅 새 계획 작성
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
				on:click={loadPlans}
			>
				다시 시도
			</button>
		</div>
	{:else if plans.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">📅</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">계획이 없습니다</h3>
			<p class="text-gray-600 mb-6">첫 번째 계획을 작성해보세요</p>
			<a href="/plans/new" class="btn btn-primary">
				새 계획 작성
			</a>
		</div>
	{:else}
		<!-- 계획 카드 그리드 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each plans as plan}
				<div class="card hover:shadow-lg transition-shadow">
					<div class="flex items-start justify-between mb-3">
						<h3 class="text-lg font-semibold text-gray-900 line-clamp-2">
							{plan.title}
						</h3>
						<div class="flex space-x-1 ml-2">
							<span class="badge {getStatusColor(plan.status)}">
								{getStatusLabel(plan.status)}
							</span>
							<span class="badge {getPriorityColor(plan.priority)}">
								{getPriorityLabel(plan.priority)}
							</span>
						</div>
					</div>

					<p class="text-gray-600 text-sm mb-4 line-clamp-3">
						{plan.description || '설명이 없습니다'}
					</p>

					<!-- 진행률 -->
					{#if plan.completion_percentage !== null}
						<div class="mb-4">
							<div class="flex justify-between text-xs text-gray-600 mb-1">
								<span>진행률</span>
								<span>{plan.completion_percentage}%</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
									style="width: {plan.completion_percentage}%"
								></div>
							</div>
						</div>
					{/if}

					<!-- 날짜 정보 -->
					<div class="text-sm text-gray-500 mb-4">
						{#if plan.start_date && plan.end_date}
							<div class="flex items-center mb-1">
								<span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
								시작: {new Date(plan.start_date).toLocaleDateString('ko-KR')}
							</div>
							<div class="flex items-center">
								<span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
								종료: {new Date(plan.end_date).toLocaleDateString('ko-KR')}
							</div>
						{/if}
					</div>

					<!-- 통계 -->
					<div class="flex items-center justify-between text-sm text-gray-500 mb-4">
						<div class="flex items-center space-x-4">
							<span class="flex items-center">
								<span class="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
								작업 {plan.task_count || 0}개
							</span>
							<span class="flex items-center">
								<span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
								완료 {plan.completed_tasks || 0}개
							</span>
						</div>
					</div>

					<!-- 날짜 정보 -->
					<div class="text-xs text-gray-400 mb-4">
						<div>생성: {new Date(plan.created_at).toLocaleDateString('ko-KR')}</div>
						<div>수정: {new Date(plan.updated_at).toLocaleDateString('ko-KR')}</div>
					</div>

					<!-- 액션 버튼 -->
					<div class="flex space-x-2">
						<a 
							href="/plans/{plan.id}" 
							class="flex-1 text-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
						>
							상세보기
						</a>
						<a 
							href="/plans/{plan.id}/edit" 
							class="flex-1 text-center px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
						>
							편집
						</a>
						<button 
							class="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
							on:click={() => deletePlan(plan.id)}
						>
							삭제
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- 페이지 하단 통계 -->
		<div class="bg-gray-50 rounded-lg p-4">
			<h3 class="text-sm font-medium text-gray-700 mb-2">전체 통계</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
				<div>
					<div class="text-gray-500">전체 계획</div>
					<div class="text-lg font-semibold text-gray-900">{plans.length}</div>
				</div>
				<div>
					<div class="text-gray-500">활성 계획</div>
					<div class="text-lg font-semibold text-green-600">
						{plans.filter(p => p.status === 'active').length}
					</div>
				</div>
				<div>
					<div class="text-gray-500">전체 작업</div>
					<div class="text-lg font-semibold text-blue-600">
						{plans.reduce((sum, p) => sum + (p.task_count || 0), 0)}
					</div>
				</div>
				<div>
					<div class="text-gray-500">완료 작업</div>
					<div class="text-lg font-semibold text-purple-600">
						{plans.reduce((sum, p) => sum + (p.completed_tasks || 0), 0)}
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
	
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
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