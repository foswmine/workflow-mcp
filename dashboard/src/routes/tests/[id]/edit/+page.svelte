<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let form = {
		title: '',
		description: '',
		type: 'unit',
		priority: 'medium',
		status: 'draft',
		preconditions: '',
		test_steps: '',
		expected_result: '',
		tags: [],
		task_id: ''
	};
	
	let newTag = '';
	let loading = false;
	let error = null;
	let initialLoading = true;
	let tasks = [];
	
	const testTypes = [
		{ value: 'unit', label: '단위 테스트' },
		{ value: 'integration', label: '통합 테스트' },
		{ value: 'system', label: '시스템 테스트' },
		{ value: 'acceptance', label: '인수 테스트' },
		{ value: 'regression', label: '회귀 테스트' }
	];

	const statuses = [
		{ value: 'draft', label: '초안' },
		{ value: 'ready', label: '준비완료' },
		{ value: 'active', label: '활성' },
		{ value: 'inactive', label: '비활성' }
	];

	const priorities = [
		{ value: 'high', label: '높음' },
		{ value: 'medium', label: '보통' },
		{ value: 'low', label: '낮음' }
	];
	
	onMount(async () => {
		try {
			// 테스트 케이스 정보 로드
			const response = await fetch(`/api/tests/${$page.params.id}`);
			if (response.ok) {
				const testCase = await response.json();
				form = {
					title: testCase.title || '',
					description: testCase.description || '',
					type: testCase.type || 'unit',
					priority: testCase.priority?.toLowerCase() || 'medium',
					status: testCase.status || 'draft',
					preconditions: testCase.preconditions || '',
					test_steps: testCase.test_steps || '',
					expected_result: testCase.expected_result || '',
					tags: Array.isArray(testCase.tags) ? testCase.tags : [],
					task_id: testCase.task_id || ''
				};
			} else {
				error = '테스트 케이스를 찾을 수 없습니다';
			}
			
			// 작업 목록 로드
			try {
				const tasksResponse = await fetch('/api/tasks');
				if (tasksResponse.ok) {
					tasks = await tasksResponse.json();
				}
			} catch (e) {
				console.error('작업 목록 로드 실패:', e);
			}
			
		} catch (e) {
			error = '데이터를 불러오는 중 오류가 발생했습니다';
		} finally {
			initialLoading = false;
		}
	});
	
	function addTag() {
		if (newTag.trim() && !form.tags.includes(newTag.trim())) {
			form.tags = [...form.tags, newTag.trim()];
			newTag = '';
		}
	}
	
	function removeTag(index) {
		form.tags = form.tags.filter((_, i) => i !== index);
	}
	
	async function handleSubmit() {
		if (!form.title.trim()) {
			error = '제목을 입력해주세요';
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			const response = await fetch(`/api/tests/${$page.params.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: form.title.trim(),
					description: form.description.trim(),
					type: form.type,
					priority: form.priority.charAt(0).toUpperCase() + form.priority.slice(1), // Medium, High, Low 형식으로 변환
					status: form.status,
					preconditions: form.preconditions.trim(),
					test_steps: form.test_steps.trim(),
					expected_result: form.expected_result.trim(),
					tags: form.tags,
					task_id: form.task_id || null
				})
			});
			
			if (response.ok) {
				goto(`/tests/${$page.params.id}`);
			} else {
				const result = await response.json();
				error = result.error || '테스트 케이스 수정에 실패했습니다';
			}
		} catch (e) {
			error = '수정 중 오류가 발생했습니다';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>테스트 케이스 편집 - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">테스트 케이스 편집</h1>
			<p class="text-gray-600 mt-1">테스트 케이스 정보를 수정합니다</p>
		</div>
		<div class="flex space-x-3">
			<a href="/tests/{$page.params.id}" class="btn btn-secondary">← 상세보기로</a>
			<a href="/tests" class="btn btn-secondary">목록으로</a>
		</div>
	</div>

	{#if initialLoading}
		<div class="flex justify-center py-12">
			<div class="text-gray-500">데이터를 불러오는 중...</div>
		</div>
	{:else if error && initialLoading}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{:else}
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">기본 정보</h2>
				
				{#if error}
					<div class="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
						<div class="text-red-800">{error}</div>
					</div>
				{/if}
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="md:col-span-2">
						<label for="title" class="block text-sm font-medium text-gray-700 mb-2">
							제목 *
						</label>
						<input
							type="text"
							id="title"
							bind:value={form.title}
							placeholder="예: 사용자 로그인 기능 테스트"
							required
							class="input-field"
						/>
					</div>

					<div>
						<label for="type" class="block text-sm font-medium text-gray-700 mb-2">
							테스트 유형 *
						</label>
						<select id="type" bind:value={form.type} required class="input-field">
							{#each testTypes as testType}
								<option value={testType.value}>{testType.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
							우선순위
						</label>
						<select id="priority" bind:value={form.priority} class="input-field">
							{#each priorities as p}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="status" class="block text-sm font-medium text-gray-700 mb-2">
							상태
						</label>
						<select id="status" bind:value={form.status} class="input-field">
							{#each statuses as s}
								<option value={s.value}>{s.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="task_id" class="block text-sm font-medium text-gray-700 mb-2">
							관련 작업
						</label>
						<select id="task_id" bind:value={form.task_id} class="input-field">
							<option value="">-- 관련 작업 선택 --</option>
							{#each tasks as task}
								<option value={task.id}>{task.title}</option>
							{/each}
						</select>
					</div>

					<div class="md:col-span-2">
						<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
							설명 *
						</label>
						<textarea
							id="description"
							bind:value={form.description}
							placeholder="테스트 케이스의 목적과 범위를 상세히 설명해주세요"
							required
							rows="4"
							class="input-field"
						></textarea>
					</div>

					<div class="md:col-span-2">
						<label for="preconditions" class="block text-sm font-medium text-gray-700 mb-2">
							전제조건
						</label>
						<textarea
							id="preconditions"
							bind:value={form.preconditions}
							placeholder="테스트 실행 전에 필요한 조건들을 입력하세요"
							rows="3"
							class="input-field"
						></textarea>
					</div>

					<div class="md:col-span-2">
						<label for="test_steps" class="block text-sm font-medium text-gray-700 mb-2">
							테스트 단계
						</label>
						<textarea
							id="test_steps"
							bind:value={form.test_steps}
							placeholder="구체적인 테스트 실행 단계를 순서대로 입력하세요"
							rows="6"
							class="input-field"
						></textarea>
					</div>

					<div class="md:col-span-2">
						<label for="expected_result" class="block text-sm font-medium text-gray-700 mb-2">
							예상결과
						</label>
						<textarea
							id="expected_result"
							bind:value={form.expected_result}
							placeholder="테스트 성공 시 예상되는 결과를 입력하세요"
							rows="4"
							class="input-field"
						></textarea>
					</div>
				</div>
			</div>

			<!-- 태그 관리 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">태그</h2>
				
				<div class="space-y-4">
					<div class="flex space-x-2">
						<input
							type="text"
							bind:value={newTag}
							placeholder="새 태그 입력"
							class="input-field flex-1"
							on:keypress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
						/>
						<button type="button" on:click={addTag} class="btn btn-secondary">
							추가
						</button>
					</div>
					
					{#if form.tags.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each form.tags as tag, index}
								<span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
									{tag}
									<button
										type="button"
										on:click={() => removeTag(index)}
										class="ml-2 text-blue-600 hover:text-blue-800"
									>
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- 제출 버튼 -->
			<div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
				<a href="/tests/{$page.params.id}" class="btn btn-secondary">취소</a>
				<button 
					type="submit" 
					class="btn btn-primary"
					disabled={loading}
				>
					{loading ? '저장 중...' : '테스트 케이스 저장'}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.card {
		@apply bg-white rounded-lg shadow p-6;
	}
	
	.input-field {
		@apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}
	
	.btn {
		@apply px-4 py-2 rounded-md font-medium transition-colors;
	}
	
	.btn-primary {
		@apply bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400;
	}
	
	.btn-secondary {
		@apply bg-gray-200 text-gray-900 hover:bg-gray-300;
	}
</style>