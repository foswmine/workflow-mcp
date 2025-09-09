<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let form = {
		name: '',
		description: '',
		status: 'planning',
		priority: 'Medium',
		start_date: '',
		end_date: '',
		manager: '',
		tags: '',
		notes: '',
		created_by: 'dashboard'
	};

	let loading = false;
	let error = null;

	// 오늘 날짜를 기본값으로 설정
	const today = new Date();
	const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
	const defaultStartDate = today.toISOString().split('T')[0];
	const defaultEndDate = nextMonth.toISOString().split('T')[0];

	async function handleSubmit() {
		if (!form.name.trim()) {
			error = '프로젝트 이름을 입력해주세요';
			return;
		}

		try {
			loading = true;
			error = null;

			const projectData = {
				...form,
				name: form.name.trim(),
				description: form.description?.trim() || '',
				start_date: form.start_date || null,
				end_date: form.end_date || null,
				tags: form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
				manager: form.manager?.trim() || '',
				notes: form.notes?.trim() || ''
			};

			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(projectData)
			});

			if (response.ok) {
				const result = await response.json();
				goto('/projects');
			} else {
				const errorData = await response.json();
				error = errorData.error || '프로젝트 생성 중 오류가 발생했습니다';
			}
		} catch (e) {
			error = '네트워크 오류: ' + e.message;
		} finally {
			loading = false;
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

	function getPriorityLabel(priority) {
		switch (priority) {
			case 'High': return '높음';
			case 'Medium': return '보통';
			case 'Low': return '낮음';
			default: return priority;
		}
	}
</script>

<svelte:head>
	<title>새 프로젝트 생성 - WorkflowMCP</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">새 프로젝트 생성</h1>
			<p class="text-gray-600 mt-1">새로운 프로젝트를 생성합니다</p>
		</div>
		<a href="/projects" class="btn btn-secondary">
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
					<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
						프로젝트 이름 *
					</label>
					<input
						id="name"
						type="text"
						bind:value={form.name}
						class="form-input w-full"
						placeholder="프로젝트 이름을 입력하세요"
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
						placeholder="프로젝트에 대한 상세 설명을 입력하세요"
					></textarea>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="status" class="block text-sm font-medium text-gray-700 mb-1">
							상태
						</label>
						<select id="status" bind:value={form.status} class="form-select w-full">
							<option value="planning">계획중</option>
							<option value="active">진행중</option>
							<option value="on_hold">보류</option>
							<option value="completed">완료</option>
						</select>
					</div>

					<div>
						<label for="priority" class="block text-sm font-medium text-gray-700 mb-1">
							우선순위
						</label>
						<select id="priority" bind:value={form.priority} class="form-select w-full">
							<option value="High">높음</option>
							<option value="Medium">보통</option>
							<option value="Low">낮음</option>
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- 일정 정보 -->
		<div class="card">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">일정 정보</h2>
			
			<div class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="start_date" class="block text-sm font-medium text-gray-700 mb-1">
							시작 날짜
						</label>
						<input
							id="start_date"
							type="date"
							bind:value={form.start_date}
							class="form-input w-full"
							placeholder={defaultStartDate}
						/>
					</div>

					<div>
						<label for="end_date" class="block text-sm font-medium text-gray-700 mb-1">
							종료 날짜
						</label>
						<input
							id="end_date"
							type="date"
							bind:value={form.end_date}
							class="form-input w-full"
							placeholder={defaultEndDate}
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- 관리 정보 -->
		<div class="card">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">관리 정보</h2>
			
			<div class="space-y-4">
				<div>
					<label for="manager" class="block text-sm font-medium text-gray-700 mb-1">
						프로젝트 매니저
					</label>
					<input
						id="manager"
						type="text"
						bind:value={form.manager}
						class="form-input w-full"
						placeholder="프로젝트 매니저 이름을 입력하세요"
					/>
				</div>

				<div>
					<label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
						태그
					</label>
					<input
						id="tags"
						type="text"
						bind:value={form.tags}
						class="form-input w-full"
						placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 웹개발, 모바일, 긴급)"
					/>
					<p class="text-sm text-gray-500 mt-1">쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다</p>
				</div>

				<div>
					<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
						메모
					</label>
					<textarea
						id="notes"
						bind:value={form.notes}
						rows="3"
						class="form-textarea w-full"
						placeholder="프로젝트 관련 메모사항을 입력하세요"
					></textarea>
				</div>
			</div>
		</div>

		<!-- 미리보기 -->
		<div class="card bg-gray-50">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">미리보기</h2>
			
			<div class="bg-white p-4 rounded-lg border">
				<div class="flex items-start justify-between mb-4">
					<div class="flex-1">
						<h3 class="font-semibold text-lg text-gray-900 mb-2">
							{form.name || '프로젝트 이름'}
						</h3>
						{#if form.description}
							<p class="text-sm text-gray-600 mb-3">
								{form.description}
							</p>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2 mb-3">
					<span class="badge {form.status === 'active' ? 'bg-green-100 text-green-800' : form.status === 'planning' ? 'bg-purple-100 text-purple-800' : form.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">
						{getStatusLabel(form.status)}
					</span>
					<span class="badge {form.priority === 'High' ? 'bg-red-100 text-red-800' : form.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
						{getPriorityLabel(form.priority)}
					</span>
				</div>

				{#if form.start_date || form.end_date}
					<div class="text-xs text-gray-500 mb-3">
						{#if form.start_date}
							시작: {new Date(form.start_date).toLocaleDateString('ko-KR')}
						{/if}
						{#if form.end_date}
							{form.start_date ? ' ~ ' : ''}종료: {new Date(form.end_date).toLocaleDateString('ko-KR')}
						{/if}
					</div>
				{/if}

				{#if form.manager}
					<div class="text-xs text-blue-600 mb-3">
						👤 {form.manager}
					</div>
				{/if}
			</div>
		</div>

		<!-- 액션 버튼 -->
		<div class="flex justify-end space-x-3">
			<a href="/projects" class="btn btn-secondary">취소</a>
			<button 
				type="submit" 
				class="btn btn-primary" 
				disabled={loading || !form.name.trim()}
			>
				{loading ? '생성 중...' : '프로젝트 생성'}
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

	.card {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}
</style>