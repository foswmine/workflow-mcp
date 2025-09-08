<script>
	import { onMount } from 'svelte';

	let designs = [];
	let loading = true;
	let error = null;

	onMount(async () => {
		await loadDesigns();
	});

	async function loadDesigns() {
		try {
			loading = true;
			const response = await fetch('/api/designs');
			if (response.ok) {
				designs = await response.json();
			} else {
				error = '설계 목록을 불러올 수 없습니다';
			}
		} catch (e) {
			error = '설계 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function updateDesignStatus(id, status) {
		try {
			const response = await fetch(`/api/designs/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			});

			if (response.ok) {
				await loadDesigns();
			} else {
				alert('설계 상태 변경 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('상태 변경 중 오류: ' + e.message);
		}
	}

	async function deleteDesign(id) {
		if (!confirm('이 설계를 삭제하시겠습니까?')) return;
		
		try {
			const response = await fetch(`/api/designs/${id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await loadDesigns();
			} else {
				alert('설계 삭제 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('삭제 중 오류: ' + e.message);
		}
	}

	function getStatusColor(status) {
		switch (status) {
			case 'implemented': return 'bg-green-100 text-green-800';
			case 'approved': return 'bg-blue-100 text-blue-800';
			case 'review': return 'bg-yellow-100 text-yellow-800';
			case 'draft': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status) {
		switch (status) {
			case 'implemented': return '구현완료';
			case 'approved': return '승인됨';
			case 'review': return '검토중';
			case 'draft': return '초안';
			default: return status;
		}
	}

	function getTypeColor(type) {
		switch (type) {
			case 'system': return 'bg-purple-100 text-purple-800';
			case 'architecture': return 'bg-indigo-100 text-indigo-800';
			case 'ui_ux': return 'bg-pink-100 text-pink-800';
			case 'database': return 'bg-green-100 text-green-800';
			case 'api': return 'bg-orange-100 text-orange-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getTypeLabel(type) {
		switch (type) {
			case 'system': return '시스템';
			case 'architecture': return '아키텍처';
			case 'ui_ux': return 'UI/UX';
			case 'database': return '데이터베이스';
			case 'api': return 'API';
			default: return type;
		}
	}

	function getPriorityColor(priority) {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-800';
			case 'medium': return 'bg-yellow-100 text-yellow-800';
			case 'low': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getPriorityLabel(priority) {
		switch (priority) {
			case 'high': return '높음';
			case 'medium': return '보통';
			case 'low': return '낮음';
			default: return priority;
		}
	}

	// 상태별 그룹화
	$: designsByStatus = {
		draft: designs.filter(d => d.status === 'draft'),
		review: designs.filter(d => d.status === 'review'),  
		approved: designs.filter(d => d.status === 'approved'),
		implemented: designs.filter(d => d.status === 'implemented')
	};
</script>

<svelte:head>
	<title>설계 관리 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">설계 관리</h1>
			<p class="text-gray-600 mt-1">시스템 설계를 관리합니다</p>
		</div>
		<a href="/designs/new" class="btn btn-primary">
			🎨 새 설계 추가
		</a>
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
				on:click={loadDesigns}
			>
				다시 시도
			</button>
		</div>
	{:else if designs.length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">🎨</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">설계가 없습니다</h3>
			<p class="text-gray-600 mb-6">첫 번째 설계를 추가해보세요</p>
			<a href="/designs/new" class="btn btn-primary">
				새 설계 추가
			</a>
		</div>
	{:else}
		<!-- 상태별 칸반 보드 -->
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- 초안 -->
			<div class="bg-gray-50 rounded-lg p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
					<span class="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
					초안 ({designsByStatus.draft.length})
				</h2>
				<div class="space-y-3">
					{#each designsByStatus.draft as design}
						<div class="card bg-white hover:shadow-md transition-shadow">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 text-sm line-clamp-2">
									{design.title}
								</h3>
								<span class="badge {getPriorityColor(design.priority)} ml-2 flex-shrink-0">
									{getPriorityLabel(design.priority)}
								</span>
							</div>

							<div class="mb-2">
								<span class="badge {getTypeColor(design.design_type)} text-xs">
									{getTypeLabel(design.design_type)}
								</span>
							</div>

							{#if design.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">
									{design.description}
								</p>
							{/if}

							{#if design.requirement_id}
								<div class="text-xs text-blue-600 mb-3">
									📄 연관 요구사항
								</div>
							{/if}

							<div class="flex space-x-1 mb-2">
								<a 
									href="/designs/{design.id}" 
									class="flex-1 text-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
								>
									상세보기
								</a>
								<a 
									href="/designs/{design.id}/edit" 
									class="flex-1 text-center text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
								>
									편집
								</a>
							</div>
							<div class="flex space-x-1">
								<button 
									class="flex-1 text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
									on:click={() => updateDesignStatus(design.id, 'review')}
								>
									검토 요청
								</button>
								<button 
									class="text-xs px-2 py-1 text-red-600 hover:text-red-800"
									on:click={() => deleteDesign(design.id)}
								>
									삭제
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 검토중 -->
			<div class="bg-yellow-50 rounded-lg p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
					<span class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
					검토중 ({designsByStatus.review.length})
				</h2>
				<div class="space-y-3">
					{#each designsByStatus.review as design}
						<div class="card bg-white hover:shadow-md transition-shadow border-l-4 border-yellow-500">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 text-sm line-clamp-2">
									{design.title}
								</h3>
								<span class="badge {getPriorityColor(design.priority)} ml-2 flex-shrink-0">
									{getPriorityLabel(design.priority)}
								</span>
							</div>

							<div class="mb-2">
								<span class="badge {getTypeColor(design.design_type)} text-xs">
									{getTypeLabel(design.design_type)}
								</span>
							</div>

							{#if design.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">
									{design.description}
								</p>
							{/if}

							<div class="flex space-x-1 mb-2">
								<a 
									href="/designs/{design.id}" 
									class="flex-1 text-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
								>
									상세보기
								</a>
								<a 
									href="/designs/{design.id}/edit" 
									class="flex-1 text-center text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
								>
									편집
								</a>
							</div>
							<div class="flex space-x-1">
								<button 
									class="flex-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
									on:click={() => updateDesignStatus(design.id, 'approved')}
								>
									승인
								</button>
								<button 
									class="flex-1 text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
									on:click={() => updateDesignStatus(design.id, 'draft')}
								>
									초안으로
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 승인됨 -->
			<div class="bg-blue-50 rounded-lg p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
					<span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
					승인됨 ({designsByStatus.approved.length})
				</h2>
				<div class="space-y-3">
					{#each designsByStatus.approved as design}
						<div class="card bg-white hover:shadow-md transition-shadow border-l-4 border-blue-500">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 text-sm line-clamp-2">
									{design.title}
								</h3>
								<span class="badge {getPriorityColor(design.priority)} ml-2 flex-shrink-0">
									{getPriorityLabel(design.priority)}
								</span>
							</div>

							<div class="mb-2">
								<span class="badge {getTypeColor(design.design_type)} text-xs">
									{getTypeLabel(design.design_type)}
								</span>
							</div>

							{#if design.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">
									{design.description}
								</p>
							{/if}

							<div class="flex space-x-1 mb-2">
								<a 
									href="/designs/{design.id}" 
									class="flex-1 text-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
								>
									상세보기
								</a>
								<a 
									href="/designs/{design.id}/edit" 
									class="flex-1 text-center text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
								>
									편집
								</a>
							</div>
							<div class="flex space-x-1">
								<button 
									class="flex-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
									on:click={() => updateDesignStatus(design.id, 'implemented')}
								>
									구현완료
								</button>
								<button 
									class="flex-1 text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
									on:click={() => updateDesignStatus(design.id, 'review')}
								>
									재검토
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 구현완료 -->
			<div class="bg-green-50 rounded-lg p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
					<span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
					구현완료 ({designsByStatus.implemented.length})
				</h2>
				<div class="space-y-3">
					{#each designsByStatus.implemented as design}
						<div class="card bg-white hover:shadow-md transition-shadow border-l-4 border-green-500 opacity-75">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 text-sm line-clamp-2">
									{design.title}
								</h3>
								<span class="badge {getPriorityColor(design.priority)} ml-2 flex-shrink-0">
									{getPriorityLabel(design.priority)}
								</span>
							</div>

							<div class="mb-2">
								<span class="badge {getTypeColor(design.design_type)} text-xs">
									{getTypeLabel(design.design_type)}
								</span>
							</div>

							{#if design.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">
									{design.description}
								</p>
							{/if}

							<div class="flex space-x-1 mb-2">
								<a 
									href="/designs/{design.id}" 
									class="flex-1 text-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
								>
									상세보기
								</a>
								<a 
									href="/designs/{design.id}/edit" 
									class="flex-1 text-center text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
								>
									편집
								</a>
							</div>
							<div class="flex space-x-1">
								<button 
									class="flex-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
									on:click={() => updateDesignStatus(design.id, 'approved')}
								>
									재승인
								</button>
								<button 
									class="text-xs px-2 py-1 text-red-600 hover:text-red-800"
									on:click={() => deleteDesign(design.id)}
								>
									삭제
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- 전체 통계 -->
		<div class="bg-gray-50 rounded-lg p-4">
			<h3 class="text-sm font-medium text-gray-700 mb-2">전체 통계</h3>
			<div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
				<div>
					<div class="text-gray-500">전체 설계</div>
					<div class="text-lg font-semibold text-gray-900">{designs.length}</div>
				</div>
				<div>
					<div class="text-gray-500">초안</div>
					<div class="text-lg font-semibold text-gray-600">{designsByStatus.draft.length}</div>
				</div>
				<div>
					<div class="text-gray-500">검토중</div>
					<div class="text-lg font-semibold text-yellow-600">{designsByStatus.review.length}</div>
				</div>
				<div>
					<div class="text-gray-500">승인됨</div>
					<div class="text-lg font-semibold text-blue-600">{designsByStatus.approved.length}</div>
				</div>
				<div>
					<div class="text-gray-500">구현완료</div>
					<div class="text-lg font-semibold text-green-600">{designsByStatus.implemented.length}</div>
				</div>
			</div>
		</div>
	{/if}
</div>

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
</style>