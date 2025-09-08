<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let prd = null;
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
			const response = await fetch(`/api/prds/${$page.params.id}`);
			if (response.ok) {
				prd = await response.json();
			} else {
				error = 'PRD를 찾을 수 없습니다';
			}
		} catch (e) {
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

			<!-- 메타데이터 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">메타데이터</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
						<div class="text-gray-600 font-mono">{prd.id}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">최종 수정일</label>
						<div class="text-gray-600">{formatDate(prd.updated_at)}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">연결된 작업</label>
						<div class="text-gray-600">{prd.task_count || 0}개</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">완료된 작업</label>
						<div class="text-gray-600">{prd.completed_tasks || 0}개</div>
					</div>
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