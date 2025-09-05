<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let prds = [];
	let loading = true;
	let error = null;

	onMount(async () => {
		await loadPRDs();
	});

	async function loadPRDs() {
		try {
			loading = true;
			const response = await fetch('/api/prds');
			if (response.ok) {
				prds = await response.json();
			} else {
				error = 'PRD 목록을 불러올 수 없습니다';
			}
		} catch (e) {
			error = 'PRD 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function deletePRD(id) {
		if (!confirm('이 PRD를 삭제하시겠습니까?')) return;
		
		try {
			const response = await fetch(`/api/prds/${id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await loadPRDs();
			} else {
				alert('PRD 삭제 중 오류가 발생했습니다');
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
	<title>PRD 관리 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">PRD 관리</h1>
			<p class="text-gray-600 mt-1">프로젝트 요구사항 문서를 관리합니다</p>
		</div>
		<a href="/prds/new" class="btn btn-primary">
			📋 새 PRD 작성
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
				on:click={loadPRDs}
			>
				다시 시도
			</button>
		</div>
	{:else if prds.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">📋</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">PRD가 없습니다</h3>
			<p class="text-gray-600 mb-6">첫 번째 PRD를 작성해보세요</p>
			<a href="/prds/new" class="btn btn-primary">
				새 PRD 작성
			</a>
		</div>
	{:else}
		<!-- PRD 카드 그리드 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each prds as prd}
				<div class="card hover:shadow-lg transition-shadow">
					<div class="flex items-start justify-between mb-3">
						<h3 class="text-lg font-semibold text-gray-900 line-clamp-2">
							{prd.title}
						</h3>
						<div class="flex space-x-1 ml-2">
							<span class="badge {getStatusColor(prd.status)}">
								{getStatusLabel(prd.status)}
							</span>
							<span class="badge {getPriorityColor(prd.priority)}">
								{getPriorityLabel(prd.priority)}
							</span>
						</div>
					</div>

					<p class="text-gray-600 text-sm mb-4 line-clamp-3">
						{prd.description || '설명이 없습니다'}
					</p>

					<!-- 통계 -->
					<div class="flex items-center justify-between text-sm text-gray-500 mb-4">
						<div class="flex items-center space-x-4">
							<span class="flex items-center">
								<span class="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
								작업 {prd.task_count || 0}개
							</span>
							<span class="flex items-center">
								<span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
								완료 {prd.completed_tasks || 0}개
							</span>
						</div>
					</div>

					<!-- 날짜 정보 -->
					<div class="text-xs text-gray-400 mb-4">
						<div>생성: {new Date(prd.created_at).toLocaleDateString('ko-KR')}</div>
						<div>수정: {new Date(prd.updated_at).toLocaleDateString('ko-KR')}</div>
					</div>

					<!-- 액션 버튼 -->
					<div class="flex space-x-2">
						<a 
							href="/prds/{prd.id}" 
							class="flex-1 text-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
						>
							상세보기
						</a>
						<a 
							href="/prds/{prd.id}/edit" 
							class="flex-1 text-center px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
						>
							편집
						</a>
						<button 
							class="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
							on:click={() => deletePRD(prd.id)}
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
					<div class="text-gray-500">전체 PRD</div>
					<div class="text-lg font-semibold text-gray-900">{prds.length}</div>
				</div>
				<div>
					<div class="text-gray-500">활성 PRD</div>
					<div class="text-lg font-semibold text-green-600">
						{prds.filter(p => p.status === 'active').length}
					</div>
				</div>
				<div>
					<div class="text-gray-500">전체 작업</div>
					<div class="text-lg font-semibold text-blue-600">
						{prds.reduce((sum, p) => sum + (p.task_count || 0), 0)}
					</div>
				</div>
				<div>
					<div class="text-gray-500">완료 작업</div>
					<div class="text-lg font-semibold text-purple-600">
						{prds.reduce((sum, p) => sum + (p.completed_tasks || 0), 0)}
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