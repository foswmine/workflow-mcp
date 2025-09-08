<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let design = null;
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
			const response = await fetch(`/api/designs/${$page.params.id}`);
			if (response.ok) {
				design = await response.json();
			} else {
				error = '설계를 찾을 수 없습니다';
			}
		} catch (e) {
			error = '데이터를 불러오는 중 오류가 발생했습니다';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{design?.title || '설계 상세보기'} - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">설계 상세보기</h1>
			<p class="text-gray-600 mt-1">시스템 설계 문서 상세 정보</p>
		</div>
		<div class="flex space-x-3">
			<a href="/designs" class="btn btn-secondary">← 목록으로</a>
			{#if design}
				<a href="/designs/{design.id}/edit" class="btn btn-primary">편집</a>
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
	{:else if design}
		<div class="space-y-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
						<div class="text-gray-900 font-medium">{design.title}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">설계 타입</label>
						<span class="badge {design.design_type === 'system' ? 'bg-blue-100 text-blue-800' : design.design_type === 'architecture' ? 'bg-purple-100 text-purple-800' : design.design_type === 'ui_ux' ? 'bg-pink-100 text-pink-800' : design.design_type === 'database' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
							{design.design_type === 'system' ? '시스템' : design.design_type === 'architecture' ? '아키텍처' : design.design_type === 'ui_ux' ? 'UI/UX' : design.design_type === 'database' ? '데이터베이스' : 'API'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
						<span class="badge {design.priority === 'high' ? 'bg-red-100 text-red-800' : design.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
							{design.priority === 'high' ? '높음' : design.priority === 'medium' ? '보통' : '낮음'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
						<span class="badge {design.status === 'draft' ? 'bg-gray-100 text-gray-800' : design.status === 'review' ? 'bg-yellow-100 text-yellow-800' : design.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
							{design.status === 'draft' ? '초안' : design.status === 'review' ? '검토중' : design.status === 'approved' ? '승인됨' : '구현완료'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">생성일</label>
						<div class="text-gray-600">{formatDate(design.created_at)}</div>
					</div>
					{#if design.requirement_id}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">연관 요구사항</label>
							<div class="text-gray-600">{design.requirement_id}</div>
						</div>
					{/if}
				</div>
				
				{#if design.description}
					<div class="mt-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
						<div class="text-gray-900 whitespace-pre-wrap">{design.description}</div>
					</div>
				{/if}
			</div>

			<!-- 설계 상세사항 -->
			{#if design.design_details}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">설계 상세사항</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{design.design_details}</div>
				</div>
			{/if}

			<!-- 다이어그램 -->
			{#if design.diagrams}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">다이어그램</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{design.diagrams}</div>
				</div>
			{/if}

			<!-- 인수 조건 -->
			{#if design.acceptance_criteria}
				{@const criteria = (() => {
					try {
						if (typeof design.acceptance_criteria === 'string') {
							return JSON.parse(design.acceptance_criteria || '[]');
						} else if (Array.isArray(design.acceptance_criteria)) {
							return design.acceptance_criteria;
						} else {
							return [];
						}
					} catch {
						return [];
					}
				})()}
				{#if criteria && criteria.length > 0}
					<div class="card">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">인수 조건</h2>
						<div class="space-y-3">
							{#each criteria as criterion, index}
								<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
									<span class="text-sm text-gray-500 font-medium min-w-0">{index + 1}.</span>
									<span class="text-sm text-gray-700">{criterion}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}

			<!-- 태그 -->
			{#if design.tags}
				{@const tags = (() => {
					try {
						if (typeof design.tags === 'string') {
							return JSON.parse(design.tags || '[]');
						} else if (Array.isArray(design.tags)) {
							return design.tags;
						} else {
							return [];
						}
					} catch {
						return [];
					}
				})()}
				{#if tags && tags.length > 0}
					<div class="card">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">태그</h2>
						<div class="flex flex-wrap gap-2">
							{#each tags as tag}
								<span class="badge bg-gray-100 text-gray-800">{tag}</span>
							{/each}
						</div>
					</div>
				{/if}
			{/if}

			<!-- 노트 -->
			{#if design.notes}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">노트</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{design.notes}</div>
				</div>
			{/if}

			<!-- 메타데이터 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">메타데이터</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
						<div class="text-gray-600 font-mono">{design.id}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">최종 수정일</label>
						<div class="text-gray-600">{formatDate(design.updated_at)}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">버전</label>
						<div class="text-gray-600">{design.version || 1}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">생성자</label>
						<div class="text-gray-600">{design.created_by || 'system'}</div>
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