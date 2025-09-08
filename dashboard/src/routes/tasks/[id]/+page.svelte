<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let task = null;
	let loading = true;
	let error = null;
	
	function formatDate(dateValue) {
		if (!dateValue) return '-';
		
		try {
			let date;
			
			if (typeof dateValue === 'string' && dateValue.includes('T')) {
				date = new Date(dateValue);
			} else if (typeof dateValue === 'string' && /^\d+\.?\d*$/.test(dateValue)) {
				date = new Date(parseFloat(dateValue));
			} else if (typeof dateValue === 'number') {
				date = new Date(dateValue);
			} else {
				date = new Date(dateValue);
			}
			
			if (isNaN(date.getTime())) {
				return '-';
			}
			
			return date.toLocaleString('ko-KR', {
				year: 'numeric',
				month: 'numeric', 
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});
		} catch (error) {
			console.error('Date formatting error:', error, dateValue);
			return '-';
		}
	}

	onMount(async () => {
		try {
			const response = await fetch(`/api/tasks/${$page.params.id}`);
			if (response.ok) {
				task = await response.json();
			} else {
				error = '작업을 찾을 수 없습니다';
			}
		} catch (e) {
			error = '데이터를 불러오는 중 오류가 발생했습니다';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{task?.title || '작업 상세보기'} - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">작업 상세보기</h1>
			<p class="text-gray-600 mt-1">작업 상세 정보</p>
		</div>
		<div class="flex space-x-3">
			<a href="/tasks" class="btn btn-secondary">← 목록으로</a>
			{#if task}
				<a href="/tasks/{task.id}/edit" class="btn btn-primary">편집</a>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="text-gray-500">데이터를 불러오는 중...</div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{:else if task}
		<div class="space-y-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
						<div class="text-gray-900 font-medium">{task.title}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
						<span class="badge {task.status === 'done' ? 'bg-green-100 text-green-800' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : task.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
							{task.status === 'done' ? '완료' : task.status === 'in_progress' ? '진행중' : task.status === 'blocked' ? '차단됨' : '대기중'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
						<span class="badge {task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
							{task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">담당자</label>
						<div class="text-gray-600">{task.assignee || '-'}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">예상 시간</label>
						<div class="text-gray-600">{task.estimatedHours || 0}시간</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">실제 시간</label>
						<div class="text-gray-600">{task.actualHours || 0}시간</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">마감일</label>
						<div class="text-gray-600">{task.dueDate ? formatDate(task.dueDate) : '-'}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">생성일</label>
						<div class="text-gray-600">{formatDate(task.createdAt)}</div>
					</div>
				</div>
				
				{#if task.description}
					<div class="mt-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
						<div class="text-gray-900 whitespace-pre-wrap">{task.description}</div>
					</div>
				{/if}
			</div>

			<!-- 태그 -->
			{#if task.tags && task.tags.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">태그</h2>
					<div class="flex flex-wrap gap-2">
						{#each task.tags as tag}
							<span class="badge bg-blue-100 text-blue-800">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 상세 내용 -->
			{#if task.details}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">상세 내용</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{task.details}</div>
				</div>
			{/if}

			<!-- 완료 기준 -->
			{#if task.acceptanceCriteria && task.acceptanceCriteria.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">완료 기준</h2>
					<div class="space-y-3">
						{#each task.acceptanceCriteria as criteria, index}
							<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
								<span class="text-sm text-gray-500 font-medium min-w-0">{index + 1}.</span>
								<span class="text-sm text-gray-700">{criteria}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 테스트 전략 -->
			{#if task.testStrategy}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">테스트 전략</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{task.testStrategy}</div>
				</div>
			{/if}

			<!-- 메모 -->
			{#if task.notes}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">메모</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{task.notes}</div>
				</div>
			{/if}

			<!-- 메타데이터 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">메타데이터</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
						<div class="text-gray-600 font-mono">{task.id}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">최종 수정일</label>
						<div class="text-gray-600">{formatDate(task.updatedAt)}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">버전</label>
						<div class="text-gray-600">v{task.version || 1}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">생성자</label>
						<div class="text-gray-600">{task.createdBy || 'system'}</div>
					</div>
					{#if task.completedAt}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">완료일</label>
							<div class="text-gray-600">{formatDate(task.completedAt)}</div>
						</div>
					{/if}
					{#if task.statusChangedAt}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">상태 변경일</label>
							<div class="text-gray-600">{formatDate(task.statusChangedAt)}</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.badge {
		@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
	}
	.card {
		@apply bg-white rounded-lg shadow p-6;
	}
	.btn {
		@apply px-4 py-2 rounded-md font-medium transition-colors;
	}
	.btn-primary {
		@apply bg-blue-600 text-white hover:bg-blue-700;
	}
	.btn-secondary {
		@apply bg-gray-200 text-gray-900 hover:bg-gray-300;
	}
</style>