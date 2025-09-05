<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let form = {
		title: '',
		description: '',
		status: 'active',
		priority: 'medium',
		start_date: '',
		end_date: '',
		completion_percentage: 0
	};

	let loading = false;
	let error = null;

	// 오늘 날짜를 기본값으로 설정
	const today = new Date();
	const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
	const defaultStartDate = today.toISOString().split('T')[0];
	const defaultEndDate = nextMonth.toISOString().split('T')[0];

	onMount(() => {
		// 기본값 설정
		form.start_date = defaultStartDate;
		form.end_date = defaultEndDate;
	});

	async function handleSubmit() {
		if (!form.title.trim()) {
			error = '제목을 입력해주세요';
			return;
		}

		// 날짜 유효성 검사
		if (form.start_date && form.end_date) {
			const startDate = new Date(form.start_date);
			const endDate = new Date(form.end_date);
			
			if (endDate <= startDate) {
				error = '종료 날짜는 시작 날짜보다 이후여야 합니다';
				return;
			}
		}

		try {
			loading = true;
			error = null;

			const planData = {
				...form,
				title: form.title.trim(),
				description: form.description?.trim() || '',
				start_date: form.start_date || null,
				end_date: form.end_date || null,
				completion_percentage: Math.min(100, Math.max(0, parseInt(form.completion_percentage) || 0))
			};

			const response = await fetch('/api/plans', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(planData)
			});

			if (response.ok) {
				const result = await response.json();
				goto('/plans');
			} else {
				const errorData = await response.json();
				error = errorData.message || '계획 생성 중 오류가 발생했습니다';
			}
		} catch (e) {
			error = '네트워크 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	// 진행률 업데이트 함수
	function updateProgress(event) {
		const value = parseInt(event.target.value);
		form.completion_percentage = Math.min(100, Math.max(0, value));
	}
</script>

<svelte:head>
	<title>새 계획 작성 - WorkflowMCP</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">새 계획 작성</h1>
			<p class="text-gray-600 mt-1">새로운 계획을 생성합니다</p>
		</div>
		<a href="/plans" class="btn btn-secondary">
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
						placeholder="계획 제목을 입력하세요"
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
						placeholder="계획에 대한 상세 설명을 입력하세요"
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
							<option value="active">활성</option>
							<option value="inactive">비활성</option>
							<option value="completed">완료</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="start_date" class="block text-sm font-medium text-gray-700 mb-1">
							시작 일자
						</label>
						<input
							id="start_date"
							type="date"
							bind:value={form.start_date}
							class="form-input w-full"
						/>
					</div>

					<div>
						<label for="end_date" class="block text-sm font-medium text-gray-700 mb-1">
							종료 일자
						</label>
						<input
							id="end_date"
							type="date"
							bind:value={form.end_date}
							class="form-input w-full"
						/>
					</div>
				</div>

				<div>
					<label for="completion_percentage" class="block text-sm font-medium text-gray-700 mb-1">
						진행률 ({form.completion_percentage}%)
					</label>
					<div class="space-y-2">
						<input
							id="completion_percentage"
							type="range"
							min="0"
							max="100"
							step="5"
							bind:value={form.completion_percentage}
							on:input={updateProgress}
							class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
						/>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div 
								class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
								style="width: {form.completion_percentage}%"
							></div>
						</div>
						<input
							type="number"
							min="0"
							max="100"
							bind:value={form.completion_percentage}
							on:input={updateProgress}
							class="form-input w-24 text-center"
							placeholder="0"
						/>
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
						{form.title || '계획 제목'}
					</h3>
					<div class="flex space-x-2">
						<span class="badge {form.status === 'completed' ? 'bg-blue-100 text-blue-800' : form.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
							{form.status === 'completed' ? '완료' : form.status === 'active' ? '활성' : '비활성'}
						</span>
						<span class="badge {form.priority === 'high' ? 'bg-red-100 text-red-800' : form.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
							{form.priority === 'high' ? '높음' : form.priority === 'medium' ? '보통' : '낮음'}
						</span>
					</div>
				</div>

				{#if form.description}
					<p class="text-gray-600 text-sm mb-3">{form.description}</p>
				{/if}

				{#if form.completion_percentage > 0}
					<div class="mb-3">
						<div class="flex justify-between text-xs text-gray-600 mb-1">
							<span>진행률</span>
							<span>{form.completion_percentage}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div 
								class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
								style="width: {form.completion_percentage}%"
							></div>
						</div>
					</div>
				{/if}

				{#if form.start_date || form.end_date}
					<div class="text-xs text-gray-500 mb-2">
						{#if form.start_date}
							<div>시작: {new Date(form.start_date).toLocaleDateString('ko-KR')}</div>
						{/if}
						{#if form.end_date}
							<div>종료: {new Date(form.end_date).toLocaleDateString('ko-KR')}</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- 액션 버튼 -->
		<div class="flex justify-end space-x-3">
			<a href="/plans" class="btn btn-secondary">취소</a>
			<button 
				type="submit" 
				class="btn btn-primary" 
				disabled={loading || !form.title.trim()}
			>
				{loading ? '생성 중...' : '계획 생성'}
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