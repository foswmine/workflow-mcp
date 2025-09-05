<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let form = {
		title: '',
		description: '',
		status: 'pending',
		priority: 'medium',
		due_date: '',
		plan_id: null
	};

	let plans = [];
	let loading = false;
	let error = null;

	onMount(async () => {
		await loadPlans();
	});

	async function loadPlans() {
		try {
			const response = await fetch('/api/plans');
			if (response.ok) {
				plans = await response.json();
			}
		} catch (e) {
			console.error('Failed to load plans:', e);
		}
	}

	async function handleSubmit() {
		if (!form.title.trim()) {
			error = '제목을 입력해주세요';
			return;
		}

		try {
			loading = true;
			error = null;

			const taskData = {
				...form,
				title: form.title.trim(),
				description: form.description?.trim() || '',
				plan_id: form.plan_id || null,
				due_date: form.due_date || null
			};

			const response = await fetch('/api/tasks', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(taskData)
			});

			if (response.ok) {
				const result = await response.json();
				goto('/tasks');
			} else {
				const errorData = await response.json();
				error = errorData.message || '작업 생성 중 오류가 발생했습니다';
			}
		} catch (e) {
			error = '네트워크 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	// 오늘 날짜를 기본값으로 설정
	const today = new Date();
	const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
	const defaultDueDate = nextWeek.toISOString().split('T')[0];
</script>

<svelte:head>
	<title>새 작업 추가 - WorkflowMCP</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">새 작업 추가</h1>
			<p class="text-gray-600 mt-1">새로운 작업을 생성합니다</p>
		</div>
		<a href="/tasks" class="btn btn-secondary">
			← 목록으로
		</a>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		<!-- 기본 정보 -->
		<div class="card">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
			
			<div class="space-y-4">
				<div>
					<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
						제목 *
					</label>
					<input
						id="title"
						type="text"
						bind:value={form.title}
						class="form-input w-full"
						placeholder="작업 제목을 입력하세요"
						required
					/>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
						설명
					</label>
					<textarea
						id="description"
						bind:value={form.description}
						rows="4"
						class="form-textarea w-full"
						placeholder="작업에 대한 상세 설명을 입력하세요"
					></textarea>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="priority" class="block text-sm font-medium text-gray-700 mb-1">
							우선순위
						</label>
						<select id="priority" bind:value={form.priority} class="form-select w-full">
							<option value="low">낮음</option>
							<option value="medium">보통</option>
							<option value="high">높음</option>
						</select>
					</div>

					<div>
						<label for="status" class="block text-sm font-medium text-gray-700 mb-1">
							상태
						</label>
						<select id="status" bind:value={form.status} class="form-select w-full">
							<option value="pending">대기중</option>
							<option value="in_progress">진행중</option>
							<option value="completed">완료</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="due_date" class="block text-sm font-medium text-gray-700 mb-1">
							마감 일자
						</label>
						<input
							id="due_date"
							type="date"
							bind:value={form.due_date}
							class="form-input w-full"
							placeholder={defaultDueDate}
						/>
					</div>

					<div>
						<label for="plan_id" class="block text-sm font-medium text-gray-700 mb-1">
							연결된 계획
						</label>
						<select id="plan_id" bind:value={form.plan_id} class="form-select w-full">
							<option value={null}>계획 선택 (선택사항)</option>
							{#each plans as plan}
								<option value={plan.id}>{plan.title}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- 미리보기 -->
		<div class="card bg-gray-50">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">미리보기</h2>
			
			<div class="bg-white p-4 rounded-lg border">
				<div class="flex items-start justify-between mb-2">
					<h3 class="font-medium text-gray-900">
						{form.title || '작업 제목'}
					</h3>
					<div class="flex space-x-2">
						<span class="badge {form.status === 'completed' ? 'bg-green-100 text-green-800' : form.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
							{form.status === 'completed' ? '완료' : form.status === 'in_progress' ? '진행중' : '대기중'}
						</span>
						<span class="badge {form.priority === 'high' ? 'bg-red-100 text-red-800' : form.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
							{form.priority === 'high' ? '높음' : form.priority === 'medium' ? '보통' : '낮음'}
						</span>
					</div>
				</div>

				{#if form.description}
					<p class="text-gray-600 text-sm mb-3">{form.description}</p>
				{/if}

				{#if form.due_date}
					<div class="text-xs text-gray-500 mb-2">
						마감: {new Date(form.due_date).toLocaleDateString('ko-KR')}
					</div>
				{/if}

				{#if form.plan_id}
					{@const selectedPlan = plans.find(p => p.id == form.plan_id)}
					{#if selectedPlan}
						<div class="text-xs text-blue-600">
							📅 {selectedPlan.title}
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- 액션 버튼 -->
		<div class="flex justify-end space-x-3">
			<a href="/tasks" class="btn btn-secondary">취소</a>
			<button 
				type="submit" 
				class="btn btn-primary" 
				disabled={loading || !form.title.trim()}
			>
				{loading ? '생성 중...' : '작업 생성'}
			</button>
		</div>
	</form>
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
</style>