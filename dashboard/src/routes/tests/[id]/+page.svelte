<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let testCase = null;
	let loading = true;
	let error = null;
	let relatedTask = null;
	let executions = [];
	
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
			const response = await fetch(`/api/tests/${$page.params.id}`);
			if (response.ok) {
				testCase = await response.json();
				
				// 연결된 작업 정보 가져오기
				if (testCase.task_id) {
					try {
						const taskResponse = await fetch(`/api/tasks/${testCase.task_id}`);
						if (taskResponse.ok) {
							relatedTask = await taskResponse.json();
						}
					} catch (e) {
						console.error('작업 정보 로딩 실패:', e);
					}
				}

				// 실행 이력 가져오기
				try {
					const executionsResponse = await fetch(`/api/tests/${$page.params.id}/executions`);
					if (executionsResponse.ok) {
						executions = await executionsResponse.json();
					}
				} catch (e) {
					console.error('실행 이력 로딩 실패:', e);
				}
			} else {
				error = '테스트 케이스를 찾을 수 없습니다';
			}
		} catch (e) {
			error = '데이터를 불러오는 중 오류가 발생했습니다';
		} finally {
			loading = false;
		}
	});

	async function executeTestCase() {
		try {
			const response = await fetch(`/api/tests/${testCase.id}/execute`, {
				method: 'POST'
			});
			
			if (response.ok) {
				alert('테스트 케이스가 실행되었습니다');
				// 실행 이력 새로고침
				location.reload();
			} else {
				alert('테스트 실행에 실패했습니다');
			}
		} catch (e) {
			alert('테스트 실행 중 오류: ' + e.message);
		}
	}
</script>

<svelte:head>
	<title>{testCase?.title || '테스트 케이스 상세보기'} - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">테스트 케이스 상세보기</h1>
			<p class="text-gray-600 mt-1">테스트 케이스 상세 정보</p>
		</div>
		<div class="flex space-x-3">
			<a href="/tests" class="btn btn-secondary">← 목록으로</a>
			{#if testCase}
				<button 
					class="btn btn-success"
					on:click={executeTestCase}
				>
					🧪 실행
				</button>
				<a href="/tests/{testCase.id}/edit" class="btn btn-primary">편집</a>
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
	{:else if testCase}
		<div class="space-y-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
						<div class="text-gray-900 font-medium">{testCase.title}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">테스트 유형</label>
						<span class="badge {testCase.type === 'unit' ? 'bg-blue-100 text-blue-800' : testCase.type === 'integration' ? 'bg-purple-100 text-purple-800' : testCase.type === 'system' ? 'bg-green-100 text-green-800' : testCase.type === 'acceptance' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}">
							{testCase.type === 'unit' ? '단위 테스트' : testCase.type === 'integration' ? '통합 테스트' : testCase.type === 'system' ? '시스템 테스트' : testCase.type === 'acceptance' ? '인수 테스트' : '회귀 테스트'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
						<span class="badge {testCase.priority === 'High' ? 'bg-red-100 text-red-800' : testCase.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
							{testCase.priority === 'High' ? '높음' : testCase.priority === 'Medium' ? '보통' : '낮음'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
						<span class="badge {testCase.status === 'draft' ? 'bg-gray-100 text-gray-800' : testCase.status === 'ready' ? 'bg-green-100 text-green-800' : testCase.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}">
							{testCase.status === 'draft' ? '초안' : testCase.status === 'ready' ? '준비완료' : testCase.status === 'active' ? '활성' : '비활성'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">생성일</label>
						<div class="text-gray-600">{formatDate(testCase.created_at)}</div>
					</div>
					{#if relatedTask}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">연결된 작업</label>
							<a href="/tasks/{relatedTask.id}" class="text-blue-600 hover:text-blue-800 font-medium">
								{relatedTask.title}
							</a>
						</div>
					{/if}
				</div>
				
				{#if testCase.description}
					<div class="mt-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
						<div class="text-gray-900 whitespace-pre-wrap">{testCase.description}</div>
					</div>
				{/if}
			</div>

			<!-- 실행 통계 -->
			{#if testCase.summary}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">실행 통계</h2>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div class="text-center p-4 bg-gray-50 rounded-lg">
							<div class="text-2xl font-bold text-gray-900">{testCase.summary.execution_count}</div>
							<div class="text-sm text-gray-600">총 실행 횟수</div>
						</div>
						<div class="text-center p-4 bg-green-50 rounded-lg">
							<div class="text-2xl font-bold text-green-600">{testCase.summary.pass_rate}%</div>
							<div class="text-sm text-gray-600">성공률</div>
						</div>
						{#if testCase.summary.last_status}
							<div class="text-center p-4 {testCase.summary.last_status === 'pass' ? 'bg-green-50' : 'bg-red-50'} rounded-lg">
								<div class="text-2xl font-bold {testCase.summary.last_status === 'pass' ? 'text-green-600' : 'text-red-600'}">
									{testCase.summary.last_status === 'pass' ? '성공' : '실패'}
								</div>
								<div class="text-sm text-gray-600">최근 실행 결과</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- 전제조건 -->
			{#if testCase.preconditions}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">전제조건</h2>
					<div class="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{testCase.preconditions}</div>
				</div>
			{/if}

			<!-- 테스트 단계 -->
			{#if testCase.test_steps}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">테스트 단계</h2>
					<div class="text-gray-900 whitespace-pre-wrap bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">{testCase.test_steps}</div>
				</div>
			{/if}

			<!-- 예상결과 -->
			{#if testCase.expected_result}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">예상결과</h2>
					<div class="text-gray-900 whitespace-pre-wrap bg-green-50 p-4 rounded-lg border-l-4 border-green-400">{testCase.expected_result}</div>
				</div>
			{/if}

			<!-- 태그 -->
			{#if testCase.tags && testCase.tags.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">태그</h2>
					<div class="flex flex-wrap gap-2">
						{#each testCase.tags as tag}
							<span class="badge bg-gray-100 text-gray-800">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 실행 이력 -->
			{#if executions && executions.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">실행 이력</h2>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">실행 시간</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결과</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세부사항</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each executions as execution}
									<tr>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatDate(execution.executed_at)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="badge {execution.result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
												{execution.result === 'pass' ? '성공' : '실패'}
											</span>
										</td>
										<td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
											{execution.details || '-'}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- 메타데이터 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">메타데이터</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
						<div class="text-gray-600 font-mono">{testCase.id}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">최종 수정일</label>
						<div class="text-gray-600">{formatDate(testCase.updated_at)}</div>
					</div>
					{#if testCase.created_by}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">생성자</label>
							<div class="text-gray-600">{testCase.created_by}</div>
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
	.btn-success {
		@apply bg-green-600 text-white hover:bg-green-700;
	}
</style>