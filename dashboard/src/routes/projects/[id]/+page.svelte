<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let project = null;
	let relatedPRDs = [];
	let relatedTasks = [];
	let relatedDocuments = [];
	let loading = true;
	let error = null;

	$: projectId = $page.params.id;

	onMount(async () => {
		await loadProjectData();
	});

	async function loadProjectData() {
		try {
			loading = true;
			error = null;

			// 프로젝트 정보 로드
			const projectResponse = await fetch(`/api/projects/${projectId}`);
			if (!projectResponse.ok) {
				if (projectResponse.status === 404) {
					error = '프로젝트를 찾을 수 없습니다.';
				} else {
					error = '프로젝트 정보를 불러오는 중 오류가 발생했습니다.';
				}
				return;
			}
			project = await projectResponse.json();

			// project_links 테이블에서 연결된 항목들 로드
			const linksResponse = await fetch(`/api/projects/${projectId}/links`);
			if (linksResponse.ok) {
				const linksData = await linksResponse.json();
				if (linksData.success) {
					relatedPRDs = linksData.links.prds || [];
					relatedTasks = linksData.links.tasks || [];
					relatedDocuments = linksData.links.documents || [];
				}
			}

		} catch (e) {
			error = '데이터를 불러오는 중 오류가 발생했습니다: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function getStatusText(status) {
		const statusMap = {
			'active': '활성',
			'planning': '계획중',
			'on_hold': '보류',
			'completed': '완료',
			'cancelled': '취소'
		};
		return statusMap[status] || status;
	}

	function getPriorityText(priority) {
		const priorityMap = {
			'high': '높음',
			'medium': '보통',
			'low': '낮음'
		};
		return priorityMap[priority] || priority;
	}

	function getPriorityClass(priority) {
		const classMap = {
			'high': 'bg-red-100 text-red-800',
			'medium': 'bg-yellow-100 text-yellow-800',
			'low': 'bg-green-100 text-green-800'
		};
		return classMap[priority] || 'bg-gray-100 text-gray-800';
	}

	function getStatusClass(status) {
		const classMap = {
			'active': 'bg-green-100 text-green-800',
			'planning': 'bg-blue-100 text-blue-800',
			'on_hold': 'bg-yellow-100 text-yellow-800',
			'completed': 'bg-gray-100 text-gray-800',
			'cancelled': 'bg-red-100 text-red-800'
		};
		return classMap[status] || 'bg-gray-100 text-gray-800';
	}

	function getTaskStatusText(status) {
		const statusMap = {
			'pending': '대기중',
			'in_progress': '진행중',
			'completed': '완료',
			'blocked': '차단됨'
		};
		return statusMap[status] || status;
	}

	function getTaskStatusClass(status) {
		const classMap = {
			'pending': 'bg-gray-100 text-gray-800',
			'in_progress': 'bg-blue-100 text-blue-800',
			'completed': 'bg-green-100 text-green-800',
			'blocked': 'bg-red-100 text-red-800'
		};
		return classMap[status] || 'bg-gray-100 text-gray-800';
	}

	function getDocumentStatusText(status) {
		const statusMap = {
			'draft': '초안',
			'review': '검토중',
			'approved': '승인됨',
			'archived': '보관됨'
		};
		return statusMap[status] || status;
	}

	function getDocumentStatusClass(status) {
		const classMap = {
			'draft': 'bg-gray-100 text-gray-800',
			'review': 'bg-yellow-100 text-yellow-800',
			'approved': 'bg-green-100 text-green-800',
			'archived': 'bg-blue-100 text-blue-800'
		};
		return classMap[status] || 'bg-gray-100 text-gray-800';
	}

	function getDocumentTypeText(docType) {
		const typeMap = {
			'test_guide': '테스트 가이드',
			'test_results': '테스트 결과',
			'analysis': '분석',
			'report': '보고서',
			'checklist': '체크리스트',
			'specification': '사양서',
			'meeting_notes': '회의록',
			'decision_log': '의사결정'
		};
		return typeMap[docType] || docType;
	}

	// 진행률 계산
	$: completedTasks = relatedTasks.filter(task => task.status === 'completed').length;
	$: totalTasks = relatedTasks.length;
	$: progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
</script>

<svelte:head>
	<title>{project?.name || '프로젝트'} - WorkflowMCP</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="text-gray-600">프로젝트 정보를 불러오는 중...</div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
			<div class="mt-2">
				<a href="/projects" class="text-red-600 hover:text-red-800 underline">
					프로젝트 목록으로 돌아가기
				</a>
			</div>
		</div>
	{:else if project}
		<!-- 프로젝트 헤더 -->
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<div class="flex items-center space-x-3 mb-2">
					<h1 class="text-3xl font-bold text-gray-900">{project.name}</h1>
					<span class="badge {getStatusClass(project.status)}">
						{getStatusText(project.status)}
					</span>
					<span class="badge {getPriorityClass(project.priority)}">
						{getPriorityText(project.priority)}
					</span>
				</div>
				{#if project.description}
					<p class="text-gray-600 text-lg">{project.description}</p>
				{/if}
			</div>
			<div class="flex space-x-3">
				<a href="/projects/{projectId}/edit" class="btn btn-secondary">
					편집
				</a>
				<a href="/projects" class="btn btn-secondary">
					← 목록으로
				</a>
			</div>
		</div>

		<!-- 프로젝트 정보 카드 -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">프로젝트 정보</h2>
				<div class="space-y-3">
					<div>
						<dt class="text-sm font-medium text-gray-500">관리자</dt>
						<dd class="text-sm text-gray-900">{project.manager || '미지정'}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">시작일</dt>
						<dd class="text-sm text-gray-900">
							{project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}
						</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">종료일</dt>
						<dd class="text-sm text-gray-900">
							{project.end_date ? new Date(project.end_date).toLocaleDateString('ko-KR') : '미정'}
						</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">생성일</dt>
						<dd class="text-sm text-gray-900">
							{new Date(project.created_at).toLocaleDateString('ko-KR')}
						</dd>
					</div>
					{#if project.tags && project.tags.length > 0}
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-1">태그</dt>
							<dd class="flex flex-wrap gap-1">
								{#each project.tags as tag}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										{tag}
									</span>
								{/each}
							</dd>
						</div>
					{/if}
				</div>
			</div>

			<!-- 진행 상황 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">진행 상황</h2>
				<div class="space-y-4">
					<div>
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium text-gray-700">전체 진행률</span>
							<span class="text-sm text-gray-600">{progressPercentage}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div 
								class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
								style="width: {progressPercentage}%"
							></div>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="text-center">
							<div class="text-2xl font-bold text-blue-600">{completedTasks}</div>
							<div class="text-sm text-gray-600">완료된 작업</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-gray-600">{totalTasks}</div>
							<div class="text-sm text-gray-600">전체 작업</div>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<div class="text-center">
							<div class="text-xl font-bold text-green-600">{relatedPRDs.length}</div>
							<div class="text-sm text-gray-600">연결된 PRD</div>
						</div>
						<div class="text-center">
							<div class="text-xl font-bold text-purple-600">{relatedDocuments.length}</div>
							<div class="text-sm text-gray-600">연결된 문서</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 메모 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">메모</h2>
				<div class="text-sm text-gray-600">
					{#if project.notes}
						<pre class="whitespace-pre-wrap">{project.notes}</pre>
					{:else}
						<span class="text-gray-400">메모가 없습니다.</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- 연결된 PRD -->
		{#if relatedPRDs.length > 0}
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-semibold text-gray-900">연결된 PRD ({relatedPRDs.length}개)</h2>
					<a href="/prds/new" class="btn btn-primary btn-sm">
						새 PRD 추가
					</a>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each relatedPRDs as prd}
						<div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 truncate">{prd.title}</h3>
								<span class="badge {getStatusClass(prd.status)} ml-2">
									{getStatusText(prd.status)}
								</span>
							</div>
							{#if prd.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">{prd.description}</p>
							{/if}
							<div class="flex items-center justify-between">
								<span class="badge {getPriorityClass(prd.priority)}">
									{getPriorityText(prd.priority)}
								</span>
								<a href="/prds/{prd.entity_id || prd.id}" class="text-blue-600 hover:text-blue-800 text-sm">
									상세보기
								</a>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- 연결된 작업 -->
		{#if relatedTasks.length > 0}
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-semibold text-gray-900">연결된 작업 ({relatedTasks.length}개)</h2>
					<a href="/tasks/new" class="btn btn-primary btn-sm">
						새 작업 추가
					</a>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each relatedTasks as task}
						<div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 truncate">{task.title}</h3>
								<span class="badge {getTaskStatusClass(task.status)} ml-2">
									{getTaskStatusText(task.status)}
								</span>
							</div>
							{#if task.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
							{/if}
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2">
									<span class="badge {getPriorityClass(task.priority)}">
										{getPriorityText(task.priority)}
									</span>
									{#if task.assignee}
										<span class="text-xs text-gray-500">
											👤 {task.assignee}
										</span>
									{/if}
								</div>
								<a href="/tasks/{task.entity_id || task.id}" class="text-blue-600 hover:text-blue-800 text-sm">
									상세보기
								</a>
							</div>
							{#if task.due_date}
								<div class="text-xs text-gray-500 mt-2">
									📅 {new Date(task.due_date).toLocaleDateString('ko-KR')}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="card">
				<div class="text-center py-8">
					<div class="text-gray-400 mb-4">
						<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
						</svg>
					</div>
					<p class="text-gray-600 mb-4">아직 연결된 작업이 없습니다.</p>
					<a href="/tasks/new" class="btn btn-primary">
						첫 번째 작업 추가하기
					</a>
				</div>
			</div>
		{/if}

		<!-- 연결된 문서 -->
		{#if relatedDocuments.length > 0}
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-semibold text-gray-900">연결된 문서 ({relatedDocuments.length}개)</h2>
					<a href="/documents" class="btn btn-secondary btn-sm">
						문서 관리
					</a>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each relatedDocuments as document}
						<div class="bg-purple-50 rounded-lg p-4 hover:bg-purple-100 transition-colors border border-purple-200">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 truncate">{document.title}</h3>
								<span class="badge {getDocumentStatusClass(document.status)} ml-2">
									{getDocumentStatusText(document.status)}
								</span>
							</div>
							{#if document.summary}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">{document.summary}</p>
							{/if}
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2">
									<span class="badge bg-purple-100 text-purple-800">
										📋 {getDocumentTypeText(document.doc_type)}
									</span>
								</div>
								<a href="/documents/{document.entity_id || document.id}" class="text-purple-600 hover:text-purple-800 text-sm">
									상세보기
								</a>
							</div>
							{#if document.linked_at}
								<div class="text-xs text-gray-500 mt-2">
									🔗 {new Date(document.linked_at).toLocaleDateString('ko-KR')}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>