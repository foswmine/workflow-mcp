<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let prd = null;
	let linkedDesigns = [];
	let linkedDocuments = [];
	let linkedTasks = {
		direct: [],
		indirect: [],
		all: []
	};
	let taskStatistics = {
		total: 0,
		direct: 0,
		indirect: 0,
		completed: 0,
		progress: 0
	};
	let loading = true;
	let error = null;
	
	function formatDate(dateValue) {
		if (!dateValue) return '-';
		
		try {
			let date;
			
			// ISO 문자열 형식인지 확인 (예: 2025-09-05T10:23:42.534Z)
			if (typeof dateValue === 'string' && dateValue.includes('T')) {
				date = new Date(dateValue);
			}
			// Unix timestamp 형식인지 확인 (예: 1757249412158.0)
			else if (typeof dateValue === 'string' && /^\d+\.?\d*$/.test(dateValue)) {
				date = new Date(parseFloat(dateValue));
			}
			// 이미 숫자인 경우
			else if (typeof dateValue === 'number') {
				date = new Date(dateValue);
			}
			// 기타 경우 직접 파싱 시도
			else {
				date = new Date(dateValue);
			}
			
			// 유효한 날짜인지 확인
			if (isNaN(date.getTime())) {
				return '-';
			}
			
			// 날짜와 시간을 모두 표시
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
			// PRD 기본 정보, 연결된 설계, 연결된 작업을 병렬로 로드
			const [prdResponse, designsResponse, tasksResponse] = await Promise.all([
				fetch(`/api/prds/${$page.params.id}`),
				fetch(`/api/prds/${$page.params.id}/designs`),
				fetch(`/api/prds/${$page.params.id}/tasks`)
			]);

			if (prdResponse.ok) {
				prd = await prdResponse.json();
			} else {
				error = 'PRD를 찾을 수 없습니다';
			}

			if (designsResponse.ok) {
				const designsData = await designsResponse.json();
				linkedDesigns = designsData.designs || [];
			}

			if (tasksResponse.ok) {
				const tasksData = await tasksResponse.json();
				linkedTasks = tasksData.tasks || { direct: [], indirect: [], all: [] };
				taskStatistics = tasksData.statistics || {
					total: 0, direct: 0, indirect: 0, completed: 0, progress: 0
				};
			}
		} catch (e) {
			console.error('Data loading error:', e);
			error = '데이터를 불러오는 중 오류가 발생했습니다';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{prd?.title || 'PRD 상세보기'} - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">PRD 상세보기</h1>
			<p class="text-gray-600 mt-1">프로젝트 요구사항 문서 상세 정보</p>
		</div>
		<div class="flex space-x-3">
			<a href="/prds" class="btn btn-secondary">← 목록으로</a>
			{#if prd}
				<a href="/prds/{prd.id}/edit" class="btn btn-primary">편집</a>
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
	{:else if prd}
		<div class="space-y-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
						<div class="text-gray-900 font-medium">{prd.title}</div>
						<div class="text-xs text-gray-500 mt-1 font-mono">ID: {prd.id}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
						<span class="badge {prd.priority === 'high' ? 'bg-red-100 text-red-800' : prd.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
							{prd.priority === 'high' ? '높음' : prd.priority === 'medium' ? '보통' : '낮음'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
						<span class="badge {prd.status === 'active' ? 'bg-green-100 text-green-800' : prd.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
							{prd.status === 'active' ? '활성' : prd.status === 'completed' ? '완료' : prd.status === 'draft' ? '초안' : prd.status}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">생성일</label>
						<div class="text-gray-600">{formatDate(prd.created_at)}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">최종 수정일</label>
						<div class="text-gray-600">{formatDate(prd.updated_at)}</div>
					</div>
				</div>
				
				{#if prd.description}
					<div class="mt-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
						<div class="text-gray-900 whitespace-pre-wrap">{prd.description}</div>
					</div>
				{/if}
			</div>

			<!-- 요구사항 -->
			{#if prd.requirements && prd.requirements.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">요구사항</h2>
					<div class="space-y-3">
						{#each prd.requirements as requirement, index}
							<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
								<span class="text-sm text-gray-500 font-medium min-w-0">{index + 1}.</span>
								<span class="text-sm text-gray-700">
									{typeof requirement === 'string' ? requirement : (requirement.title || requirement.description)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 인수 조건 -->
			{#if prd.acceptance_criteria && prd.acceptance_criteria.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">인수 조건</h2>
					<div class="space-y-3">
						{#each prd.acceptance_criteria as criteria, index}
							<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
								<span class="text-sm text-gray-500 font-medium min-w-0">{index + 1}.</span>
								<span class="text-sm text-gray-700">{criteria}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 연결된 설계 -->
			{#if linkedDesigns && linkedDesigns.length > 0}
				<div class="card">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-gray-900">📐 연결된 설계 ({linkedDesigns.length}개)</h2>
					</div>
					<div class="grid gap-3">
						{#each linkedDesigns as design}
							<div class="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-2 mb-2">
											<span class="text-lg">{design.typeIcon || '📋'}</span>
											<h3 class="font-medium text-gray-900">
												<a href="/designs/{design.id}" class="text-blue-600 hover:text-blue-800 hover:underline">
													{design.title}
												</a>
											</h3>
										</div>
										<div class="flex items-center space-x-2 mb-2">
											<span class="badge badge-status-{design.statusColor}">
												{design.status === 'draft' ? '초안' : 
												 design.status === 'review' ? '검토중' : 
												 design.status === 'approved' ? '승인' :
												 design.status === 'implemented' ? '구현완료' : design.status}
											</span>
											<span class="badge badge-gray">
												{design.design_type === 'system' ? '시스템' :
												 design.design_type === 'architecture' ? '아키텍처' :
												 design.design_type === 'ui_ux' ? 'UI/UX' :
												 design.design_type === 'database' ? '데이터베이스' :
												 design.design_type === 'api' ? 'API' : design.design_type}
											</span>
										</div>
										{#if design.description}
											<p class="text-gray-600 text-sm">
												{design.description.length > 100 ? 
												 design.description.substring(0, 100) + '...' : design.description}
											</p>
										{/if}
										{#if design.daysFromLastUpdate !== null}
											<div class="text-xs text-gray-500 mt-2">
												{design.daysFromLastUpdate === 0 ? '오늘 수정됨' :
												 `${design.daysFromLastUpdate}일 전 수정됨`}
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 연결된 작업 -->
			{#if taskStatistics.total > 0}
				<div class="card">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-gray-900">📋 연결된 작업 ({taskStatistics.total}개)</h2>
						<div class="flex items-center space-x-4">
							<div class="text-sm text-gray-600">
								진행률: <span class="font-semibold text-blue-600">{taskStatistics.progress}%</span>
							</div>
							<div class="w-24 bg-gray-200 rounded-full h-2">
								<div class="bg-blue-600 h-2 rounded-full" style="width: {taskStatistics.progress}%"></div>
							</div>
						</div>
					</div>

					<!-- 통계 요약 -->
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
						<div class="text-center">
							<div class="text-lg font-semibold text-gray-900">{taskStatistics.total}</div>
							<div class="text-sm text-gray-600">전체</div>
						</div>
						<div class="text-center">
							<div class="text-lg font-semibold text-blue-600">{taskStatistics.direct}</div>
							<div class="text-sm text-gray-600">직접 연결</div>
						</div>
						<div class="text-center">
							<div class="text-lg font-semibold text-purple-600">{taskStatistics.indirect}</div>
							<div class="text-sm text-gray-600">간접 연결</div>
						</div>
						<div class="text-center">
							<div class="text-lg font-semibold text-green-600">{taskStatistics.completed}</div>
							<div class="text-sm text-gray-600">완료</div>
						</div>
					</div>

					<!-- 직접 연결 작업 -->
					{#if linkedTasks.direct && linkedTasks.direct.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-medium text-gray-900 mb-3">직접 연결 작업 ({linkedTasks.direct.length}개)</h3>
							<div class="grid gap-3">
								{#each linkedTasks.direct as task}
									<div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<h4 class="font-medium text-gray-900">
													<a href="/tasks/{task.id}" class="text-blue-700 hover:text-blue-900 hover:underline">
														{task.title}
													</a>
												</h4>
												<div class="flex items-center space-x-2 mt-1">
													<span class="badge {task.status === 'done' || task.status === 'completed' ? 'badge-green' : 
																		task.status === 'in_progress' ? 'badge-blue' : 
																		task.status === 'blocked' ? 'badge-red' : 'badge-gray'}">
														{task.status === 'done' || task.status === 'completed' ? '완료' : 
														 task.status === 'in_progress' ? '진행중' : 
														 task.status === 'blocked' ? '차단됨' : '대기중'}
													</span>
													<span class="badge {task.priority === 'high' ? 'badge-red' : 
																		task.priority === 'medium' ? 'badge-yellow' : 'badge-green'}">
														{task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
													</span>
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- 간접 연결 작업 -->
					{#if linkedTasks.indirect && linkedTasks.indirect.length > 0}
						<div>
							<h3 class="text-lg font-medium text-gray-900 mb-3">간접 연결 작업 ({linkedTasks.indirect.length}개)</h3>
							<div class="grid gap-3">
								{#each linkedTasks.indirect as task}
									<div class="p-3 bg-purple-50 rounded-lg border border-purple-200">
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<h4 class="font-medium text-gray-900">
													<a href="/tasks/{task.id}" class="text-purple-700 hover:text-purple-900 hover:underline">
														{task.title}
													</a>
												</h4>
												<div class="flex items-center space-x-2 mt-1">
													<span class="badge {task.status === 'done' || task.status === 'completed' ? 'badge-green' : 
																		task.status === 'in_progress' ? 'badge-blue' : 
																		task.status === 'blocked' ? 'badge-red' : 'badge-gray'}">
														{task.status === 'done' || task.status === 'completed' ? '완료' : 
														 task.status === 'in_progress' ? '진행중' : 
														 task.status === 'blocked' ? '차단됨' : '대기중'}
													</span>
													<span class="text-xs text-purple-600">설계를 통한 연결</span>
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}

		</div>
	{/if}
</div>

<style>
	.badge {
		@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
	}
	
	/* Badge color variations */
	.badge-green { @apply bg-green-100 text-green-800; }
	.badge-blue { @apply bg-blue-100 text-blue-800; }
	.badge-red { @apply bg-red-100 text-red-800; }
	.badge-yellow { @apply bg-yellow-100 text-yellow-800; }
	.badge-purple { @apply bg-purple-100 text-purple-800; }
	.badge-gray { @apply bg-gray-100 text-gray-800; }
	
	/* Badge status colors */
	.badge-status-green { @apply bg-green-100 text-green-800; }
	.badge-status-blue { @apply bg-blue-100 text-blue-800; }
	.badge-status-yellow { @apply bg-yellow-100 text-yellow-800; }
	.badge-status-gray { @apply bg-gray-100 text-gray-800; }
	
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