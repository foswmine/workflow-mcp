<script>
	import { onMount } from 'svelte';

	let projects = [];
	let loading = true;
	let error = null;
	let sortBy = 'updated'; // 'updated', 'created', 'name', 'status', 'priority'

	onMount(async () => {
		await loadProjects();
	});

	async function loadProjects() {
		try {
			loading = true;
			const sortParam = getSortParam(sortBy);
			const response = await fetch(`/api/projects?sort=${sortParam}`);
			if (response.ok) {
				projects = await response.json();
			} else {
				error = '프로젝트 목록을 불러올 수 없습니다';
			}
		} catch (e) {
			error = '프로젝트 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function getSortParam(sortBy) {
		switch(sortBy) {
			case 'updated': return 'updated_desc';
			case 'created': return 'created_desc';
			case 'name': return 'name_asc';
			case 'status': return 'status';
			case 'priority': return 'priority';
			default: return 'updated_desc';
		}
	}

	// 정렬 변경 시 프로젝트 목록 재로드
	async function handleSortChange() {
		await loadProjects();
	}

	async function deleteProject(id) {
		if (!confirm('이 프로젝트를 삭제하시겠습니까? 연관된 데이터가 있는 경우 삭제가 불가능합니다.')) return;
		
		try {
			const response = await fetch(`/api/projects/${id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await loadProjects();
			} else {
				const errorData = await response.json();
				alert('프로젝트 삭제 중 오류가 발생했습니다: ' + (errorData.error || 'Unknown error'));
			}
		} catch (e) {
			alert('삭제 중 오류: ' + e.message);
		}
	}

	function getStatusColor(status) {
		switch (status) {
			case 'planning': return 'bg-purple-100 text-purple-800';
			case 'active': return 'bg-green-100 text-green-800';
			case 'on_hold': return 'bg-yellow-100 text-yellow-800';
			case 'completed': return 'bg-blue-100 text-blue-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status) {
		switch (status) {
			case 'planning': return '계획중';
			case 'active': return '진행중';
			case 'on_hold': return '보류';
			case 'completed': return '완료';
			default: return status;
		}
	}

	function getPriorityColor(priority) {
		switch (priority) {
			case 'High': return 'bg-red-100 text-red-800';
			case 'Medium': return 'bg-yellow-100 text-yellow-800';
			case 'Low': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getPriorityLabel(priority) {
		switch (priority) {
			case 'High': return '높음';
			case 'Medium': return '보통';
			case 'Low': return '낮음';
			default: return priority;
		}
	}

	function formatDate(dateValue) {
		if (!dateValue) return '-';
		
		try {
			let date = new Date(dateValue);
			
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

	// 정렬된 프로젝트 목록
	$: sortedProjects = projects.sort((a, b) => {
		switch (sortBy) {
			case 'updated':
				return new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt);
			case 'created':
				return new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt);
			case 'name':
				return a.name.localeCompare(b.name);
			case 'status':
				return a.status.localeCompare(b.status);
			case 'priority':
				const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
				return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
			default:
				return new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt);
		}
	});
</script>

<svelte:head>
	<title>프로젝트 관리 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">프로젝트 관리</h1>
			<p class="text-gray-600 mt-1">전체 프로젝트를 관리합니다</p>
		</div>
		<div class="flex items-center gap-4">
			<!-- 정렬 옵션 -->
			<div class="flex items-center gap-2">
				<label class="text-sm text-gray-600">정렬:</label>
				<select 
					bind:value={sortBy}
					on:change={handleSortChange}
					class="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
				>
					<option value="updated">최근 수정</option>
					<option value="created">최근 생성</option>
					<option value="name">이름 순</option>
					<option value="status">상태 순</option>
					<option value="priority">우선순위 순</option>
				</select>
			</div>
			<a href="/projects/new" class="btn btn-primary">
				새 프로젝트 생성
			</a>
		</div>
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
				on:click={loadProjects}
			>
				다시 시도
			</button>
		</div>
	{:else if projects.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">📋</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
			<p class="text-gray-600 mb-6">첫 번째 프로젝트를 생성해보세요</p>
			<a href="/projects/new" class="btn btn-primary">
				새 프로젝트 생성
			</a>
		</div>
	{:else}
		<!-- 프로젝트 카드 그리드 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each sortedProjects as project}
				<div class="card bg-white hover:shadow-lg transition-shadow">
					<div class="flex items-start justify-between mb-4">
						<div class="flex-1">
							<h3 class="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
								{project.name}
							</h3>
							<p class="text-sm text-gray-600 mb-3 line-clamp-3">
								{project.description || '설명 없음'}
							</p>
						</div>
					</div>

					<!-- 상태 및 우선순위 -->
					<div class="flex items-center gap-2 mb-3">
						<span class="badge {getStatusColor(project.status)}">
							{getStatusLabel(project.status)}
						</span>
						<span class="badge {getPriorityColor(project.priority)}">
							{getPriorityLabel(project.priority)}
						</span>
					</div>

					<!-- 진행률 -->
					<div class="mb-3">
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs text-gray-600">진행률</span>
							<span class="text-xs font-medium text-gray-900">{project.progress || 0}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div 
								class="bg-blue-600 h-2 rounded-full" 
								style="width: {project.progress || 0}%"
							></div>
						</div>
					</div>

					<!-- 프로젝트 통계 -->
					{#if project.totalTasks !== undefined}
						<div class="text-xs text-gray-500 mb-3 grid grid-cols-3 gap-1">
							<div>작업: {project.totalTasks || 0}</div>
							<div>PRD: {project.totalPrds || 0}</div>
							<div>문서: {project.totalDocuments || 0}</div>
						</div>
					{/if}

					<!-- 날짜 정보 -->
					<div class="text-xs text-gray-500 mb-4">
						{#if project.start_date}
							<div>시작: {formatDate(project.start_date)}</div>
						{/if}
						{#if project.end_date}
							<div>종료: {formatDate(project.end_date)}</div>
						{/if}
						<div>수정: {formatDate(project.updated_at || project.updatedAt)}</div>
					</div>

					<!-- 관리자 정보 -->
					{#if project.manager}
						<div class="text-xs text-blue-600 mb-4">
							👤 {project.manager}
						</div>
					{/if}

					<!-- 태그 -->
					{#if project.tags && project.tags.length > 0}
						<div class="flex flex-wrap gap-1 mb-4">
							{#each project.tags.slice(0, 3) as tag}
								<span class="badge bg-gray-100 text-gray-600 text-xs">
									{tag}
								</span>
							{/each}
							{#if project.tags.length > 3}
								<span class="text-xs text-gray-500">+{project.tags.length - 3}</span>
							{/if}
						</div>
					{/if}

					<!-- 액션 버튼 -->
					<div class="flex space-x-2 pt-3 border-t border-gray-100">
						<a
							href="/projects/{project.id}"
							class="flex-1 text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-center"
						>
							상세보기
						</a>
						<a
							href="/projects/{project.id}/edit"
							class="flex-1 text-xs px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 text-center"
						>
							편집
						</a>
						<button 
							class="text-xs px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
							on:click={() => deleteProject(project.id)}
						>
							삭제
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- 전체 통계 -->
		<div class="bg-gray-50 rounded-lg p-6 mt-8">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">전체 통계</h3>
			<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-900">{projects.length}</div>
					<div class="text-sm text-gray-600">전체 프로젝트</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">
						{projects.filter(p => p.status === 'active').length}
					</div>
					<div class="text-sm text-gray-600">진행중</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-purple-600">
						{projects.filter(p => p.status === 'planning').length}
					</div>
					<div class="text-sm text-gray-600">계획중</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-blue-600">
						{projects.filter(p => p.status === 'completed').length}
					</div>
					<div class="text-sm text-gray-600">완료</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-orange-600">
						{Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) || 0}%
					</div>
					<div class="text-sm text-gray-600">평균 진행률</div>
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

	.card {
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}
</style>