<script>
	import { onMount } from 'svelte';

	let testCases = [];
	let tasks = [];
	let loading = true;
	let error = null;
	let showLinkModal = false;
	let selectedTestCase = null;

	// 필터링 옵션
	let selectedStatus = '';
	let selectedType = '';
	let sortOrder = 'created_desc'; // 기본값: 최근 등록순

	const testTypes = [
		{ value: 'unit', label: '단위 테스트' },
		{ value: 'integration', label: '통합 테스트' },
		{ value: 'system', label: '시스템 테스트' },
		{ value: 'acceptance', label: '인수 테스트' },
		{ value: 'regression', label: '회귀 테스트' }
	];

	const testStatuses = [
		{ value: 'draft', label: '초안' },
		{ value: 'ready', label: '준비완료' },
		{ value: 'active', label: '활성' },
		{ value: 'inactive', label: '비활성' }
	];

	const sortOptions = [
		{ value: 'created_desc', label: '최근 등록순' },
		{ value: 'created_asc', label: '오래된 등록순' },
		{ value: 'updated_desc', label: '최근 수정순' },
		{ value: 'updated_asc', label: '오래된 수정순' },
		{ value: 'title_asc', label: '제목순 (가-하)' },
		{ value: 'title_desc', label: '제목순 (하-가)' }
	];

	onMount(async () => {
		await loadTestCases();
		await loadTasks();
	});

	async function loadTestCases() {
		try {
			loading = true;
			let url = '/api/tests';
			const params = new URLSearchParams();
			
			if (selectedStatus) params.append('status', selectedStatus);
			if (selectedType) params.append('type', selectedType);
			
			if (params.toString()) {
				url += '?' + params.toString();
			}

			const response = await fetch(url);
			if (response.ok) {
				testCases = await response.json();
			} else {
				error = '테스트 케이스 목록을 불러올 수 없습니다';
			}
		} catch (e) {
			error = '테스트 케이스 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function loadTasks() {
		try {
			const response = await fetch('/api/tasks');
			if (response.ok) {
				tasks = await response.json();
			}
		} catch (e) {
			console.error('작업 목록 로딩 실패:', e.message);
		}
	}

	async function executeTestCase(id) {
		try {
			const response = await fetch(`/api/tests/${id}/execute`, {
				method: 'POST'
			});
			
			if (response.ok) {
				alert('테스트 케이스가 실행되었습니다');
				await loadTestCases();
			} else {
				alert('테스트 실행에 실패했습니다');
			}
		} catch (e) {
			alert('테스트 실행 중 오류: ' + e.message);
		}
	}

	async function deleteTestCase(id) {
		if (!confirm('이 테스트 케이스를 삭제하시겠습니까?')) return;
		
		try {
			const response = await fetch(`/api/tests/${id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await loadTestCases();
			} else {
				alert('테스트 케이스 삭제 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('삭제 중 오류: ' + e.message);
		}
	}

	function openLinkModal(testCase) {
		selectedTestCase = { ...testCase };
		showLinkModal = true;
	}

	async function linkToTask(testCaseId, taskId) {
		try {
			const response = await fetch(`/api/tests/${testCaseId}/link`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ task_id: taskId })
			});

			if (response.ok) {
				alert('작업에 성공적으로 연결되었습니다');
				showLinkModal = false;
				selectedTestCase = null;
				await loadTestCases();
			} else {
				alert('작업 연결에 실패했습니다');
			}
		} catch (e) {
			alert('연결 중 오류: ' + e.message);
		}
	}

	function getStatusColor(status) {
		switch (status) {
			case 'ready': return 'bg-green-100 text-green-800';
			case 'active': return 'bg-blue-100 text-blue-800';
			case 'inactive': return 'bg-red-100 text-red-800';
			case 'draft': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status) {
		switch (status) {
			case 'ready': return '준비완료';
			case 'active': return '활성';
			case 'inactive': return '비활성';
			case 'draft': return '초안';
			default: return status;
		}
	}

	function getTypeColor(type) {
		switch (type) {
			case 'unit': return 'bg-blue-100 text-blue-800';
			case 'integration': return 'bg-purple-100 text-purple-800';
			case 'system': return 'bg-green-100 text-green-800';
			case 'acceptance': return 'bg-orange-100 text-orange-800';
			case 'regression': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getTypeLabel(type) {
		const typeMap = testTypes.find(t => t.value === type);
		return typeMap ? typeMap.label : type;
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

	// 반응형 필터링 및 정렬
	$: filteredAndSortedTestCases = (() => {
		// 먼저 필터링
		let filtered = testCases.filter(testCase => {
			if (selectedStatus && testCase.status !== selectedStatus) return false;
			if (selectedType && testCase.type !== selectedType) return false;
			return true;
		});

		// 그다음 정렬
		const sorted = [...filtered].sort((a, b) => {
			switch (sortOrder) {
				case 'created_desc':
					return new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime();
				case 'created_asc':
					return new Date(a.created_at || a.createdAt || '').getTime() - new Date(b.created_at || b.createdAt || '').getTime();
				case 'updated_desc':
					return new Date(b.updated_at || b.updatedAt || '').getTime() - new Date(a.updated_at || a.updatedAt || '').getTime();
				case 'updated_asc':
					return new Date(a.updated_at || a.updatedAt || '').getTime() - new Date(b.updated_at || b.updatedAt || '').getTime();
				case 'title_asc':
					return (a.title || '').localeCompare(b.title || '', 'ko');
				case 'title_desc':
					return (b.title || '').localeCompare(a.title || '', 'ko');
				default:
					return 0;
			}
		});

		return sorted;
	})();

	// 반응형 필터링 업데이트
	$: if (selectedStatus || selectedType) {
		loadTestCases();
	}
</script>

<svelte:head>
	<title>테스트 케이스 관리 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">테스트 케이스 관리</h1>
			<p class="text-gray-600 mt-1">프로젝트 테스트 케이스를 관리합니다</p>
		</div>
		<a href="/tests/new" class="btn btn-primary">
			🧪 새 테스트 케이스 추가
		</a>
	</div>

	<!-- 필터링 섹션 -->
	<div class="bg-white p-4 rounded-lg border border-gray-200 flex flex-wrap gap-4">
		<div>
			<label class="text-sm font-medium text-gray-700 mb-1 block">📅 상태 필터</label>
			<select bind:value={selectedStatus} class="form-select text-sm">
				<option value="">📦 전체 상태</option>
				{#each testStatuses as status}
					<option value={status.value}>{status.label}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="text-sm font-medium text-gray-700 mb-1 block">🔍 유형 필터</label>
			<select bind:value={selectedType} class="form-select text-sm">
				<option value="">📊 전체 유형</option>
				{#each testTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="text-sm font-medium text-gray-700 mb-1 block">⬇️ 정렬 순서</label>
			<select bind:value={sortOrder} class="form-select text-sm">
				{#each sortOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
		<div class="ml-auto flex items-end">
			<div class="text-sm text-gray-600">
				📊 총 <strong>{filteredAndSortedTestCases.length}</strong>개
			</div>
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
				on:click={loadTestCases}
			>
				다시 시도
			</button>
		</div>
	{:else if filteredAndSortedTestCases.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">🧪</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">테스트 케이스가 없습니다</h3>
			<p class="text-gray-600 mb-6">첫 번째 테스트 케이스를 추가해보세요</p>
			<a href="/tests/new" class="btn btn-primary">
				새 테스트 케이스 추가
			</a>
		</div>
	{:else}
		<!-- 테스트 케이스 목록 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredAndSortedTestCases as testCase}
				<div class="card bg-white hover:shadow-md transition-shadow">
					<div class="card-header d-flex justify-content-between align-items-start">
						<h6 class="card-title mb-0 font-medium text-gray-900">{testCase.title}</h6>
						<div class="d-flex gap-1 ml-2 flex-shrink-0">
							<span class="badge {getStatusColor(testCase.status)}">{getStatusLabel(testCase.status)}</span>
							<span class="badge {getPriorityColor(testCase.priority)}">{getPriorityLabel(testCase.priority)}</span>
						</div>
					</div>
					
					<div class="card-body">
						<p class="text-sm text-gray-600 mb-2">
							<strong>유형:</strong> 
							<span class="badge {getTypeColor(testCase.type)} text-xs ml-1">
								{getTypeLabel(testCase.type)}
							</span>
						</p>
						
						{#if testCase.description}
							<p class="text-sm text-gray-600 mb-3 line-clamp-2">{testCase.description}</p>
						{/if}

						{#if testCase.task_id}
							<p class="text-sm text-blue-600 mb-2">
								<strong>연결된 작업:</strong> 
								{tasks.find(t => t.id === testCase.task_id)?.title || testCase.task_id}
							</p>
						{/if}
						
						{#if testCase.summary}
							<div class="mb-2">
								<small class="text-gray-500">
									실행: <strong>{testCase.summary.execution_count}</strong>회, 
									성공률: <strong>{testCase.summary.pass_rate}</strong>%
									{#if testCase.summary.last_status}
										, 최근: <span class="badge {testCase.summary.last_status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">{testCase.summary.last_status}</span>
									{/if}
								</small>
							</div>
						{/if}

						{#if testCase.tags && testCase.tags.length > 0}
							<div class="mb-2">
								{#each testCase.tags as tag}
									<span class="badge bg-light text-dark me-1 text-xs">{tag}</span>
								{/each}
							</div>
						{/if}
					</div>
					
					<div class="card-footer">
						<div class="flex space-x-1 mb-2">
							<a 
								href="/tests/{testCase.id}" 
								class="flex-1 text-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
							>
								상세보기
							</a>
							<a 
								href="/tests/{testCase.id}/edit" 
								class="flex-1 text-center text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
							>
								편집
							</a>
						</div>
						<div class="flex space-x-1">
							<button 
								class="flex-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
								on:click={() => executeTestCase(testCase.id)}
							>
								실행
							</button>
							<button 
								class="flex-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
								on:click={() => openLinkModal(testCase)}
							>
								작업 연결
							</button>
							<button 
								class="text-xs px-2 py-1 text-red-600 hover:text-red-800"
								on:click={() => deleteTestCase(testCase.id)}
							>
								삭제
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- 전체 통계 -->
		<div class="bg-gray-50 rounded-lg p-4">
			<h3 class="text-sm font-medium text-gray-700 mb-2">전체 통계</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
				<div>
					<div class="text-gray-500">전체 테스트</div>
					<div class="text-lg font-semibold text-gray-900">{testCases.length}</div>
				</div>
				<div>
					<div class="text-gray-500">활성</div>
					<div class="text-lg font-semibold text-blue-600">{testCases.filter(t => t.status === 'active').length}</div>
				</div>
				<div>
					<div class="text-gray-500">준비완료</div>
					<div class="text-lg font-semibold text-green-600">{testCases.filter(t => t.status === 'ready').length}</div>
				</div>
				<div>
					<div class="text-gray-500">실행율</div>
					<div class="text-lg font-semibold text-purple-600">
						{testCases.length > 0 ? Math.round((testCases.filter(t => t.summary?.execution_count > 0).length / testCases.length) * 100) : 0}%
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- 작업 연결 모달 -->
{#if showLinkModal && selectedTestCase}
<div class="modal show d-block" style="background-color: rgba(0,0,0,0.5);">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">작업에 연결</h5>
				<button type="button" class="btn-close" on:click={() => showLinkModal = false}></button>
			</div>
			<div class="modal-body">
				<p><strong>테스트 케이스:</strong> {selectedTestCase.title}</p>
				<div class="mb-3">
					<label class="form-label">연결할 작업 선택:</label>
					<select class="form-select" bind:value={selectedTestCase.selected_task_id}>
						<option value="">작업을 선택하세요</option>
						{#each tasks as task}
							<option value={task.id}>{task.title}</option>
						{/each}
					</select>
				</div>
				{#if selectedTestCase.task_id}
					<div class="alert alert-info">
						현재 연결된 작업: {tasks.find(t => t.id === selectedTestCase.task_id)?.title || '알 수 없음'}
					</div>
				{/if}
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" on:click={() => showLinkModal = false}>
					취소
				</button>
				<button 
					type="button" 
					class="btn btn-primary" 
					disabled={!selectedTestCase.selected_task_id}
					on:click={() => linkToTask(selectedTestCase.id, selectedTestCase.selected_task_id)}
				>
					연결
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

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

	.card {
		transition: transform 0.2s;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
	}
	
	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	.card-header {
		padding: 1rem 1rem 0.5rem 1rem;
		border-bottom: 1px solid #f3f4f6;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.card-body {
		padding: 0.5rem 1rem;
	}

	.card-footer {
		padding: 0.5rem 1rem 1rem 1rem;
		border-top: 1px solid #f3f4f6;
		background-color: #f9fafb;
	}
</style>