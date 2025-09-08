<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let documents = [];
	let filteredDocuments = [];
	let loading = true;
	let error = null;
	
	// 필터 상태
	let filters = {
		search: '',
		doc_type: '',
		category: '',
		status: ''
	};

	// 문서 유형 옵션
	const docTypes = [
		'test_guide', 'test_results', 'analysis', 'report', 
		'checklist', 'specification', 'meeting_notes', 'decision_log'
	];

	// 상태 옵션
	const statusOptions = ['draft', 'review', 'approved', 'archived'];

	onMount(async () => {
		await loadDocuments();
	});

	async function loadDocuments() {
		try {
			loading = true;
			const response = await fetch('/api/documents');
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const data = await response.json();
			documents = data || [];
			filterDocuments();
		} catch (err) {
			console.error('Error loading documents:', err);
			error = err.message;
			documents = [];
		} finally {
			loading = false;
		}
	}

	function filterDocuments() {
		filteredDocuments = documents.filter(doc => {
			const matchesSearch = !filters.search || 
				doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
				(doc.summary && doc.summary.toLowerCase().includes(filters.search.toLowerCase()));
			
			const matchesType = !filters.doc_type || doc.doc_type === filters.doc_type;
			const matchesCategory = !filters.category || doc.category === filters.category;
			const matchesStatus = !filters.status || doc.status === filters.status;

			return matchesSearch && matchesType && matchesCategory && matchesStatus;
		});
	}

	function handleFilterChange() {
		filterDocuments();
	}

	function getUniqueCategories() {
		const categories = [...new Set(documents.map(doc => doc.category).filter(Boolean))];
		return categories;
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getDocTypeDisplayName(type) {
		const typeMap = {
			'test_guide': '테스트 가이드',
			'test_results': '테스트 결과',
			'analysis': '분석',
			'report': '보고서',
			'checklist': '체크리스트',
			'specification': '사양서',
			'meeting_notes': '회의록',
			'decision_log': '의사결정 로그'
		};
		return typeMap[type] || type;
	}

	function getStatusDisplayName(status) {
		const statusMap = {
			'draft': '초안',
			'review': '검토 중',
			'approved': '승인됨',
			'archived': '보관됨'
		};
		return statusMap[status] || status;
	}

	function getStatusBadgeClass(status) {
		const statusClasses = {
			'draft': 'bg-gray-100 text-gray-800',
			'review': 'bg-yellow-100 text-yellow-800',
			'approved': 'bg-green-100 text-green-800',
			'archived': 'bg-blue-100 text-blue-800'
		};
		return statusClasses[status] || 'bg-gray-100 text-gray-800';
	}
</script>

<svelte:head>
	<title>문서 관리 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<div class="sm:flex sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">문서 관리</h1>
			<p class="mt-2 text-sm text-gray-700">프로젝트 문서를 관리하고 검색하세요.</p>
		</div>
		<div class="mt-4 sm:mt-0">
			<button
				type="button"
				on:click={loadDocuments}
				class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				새로고침
			</button>
		</div>
	</div>

	<!-- 필터 섹션 -->
	<div class="bg-white shadow rounded-lg p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">필터</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div>
				<label for="search" class="block text-sm font-medium text-gray-700">검색</label>
				<input
					id="search"
					type="text"
					bind:value={filters.search}
					on:input={handleFilterChange}
					placeholder="제목 또는 요약으로 검색..."
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="doc_type" class="block text-sm font-medium text-gray-700">문서 유형</label>
				<select
					id="doc_type"
					bind:value={filters.doc_type}
					on:change={handleFilterChange}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				>
					<option value="">모든 유형</option>
					{#each docTypes as type}
						<option value={type}>{getDocTypeDisplayName(type)}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="category" class="block text-sm font-medium text-gray-700">카테고리</label>
				<select
					id="category"
					bind:value={filters.category}
					on:change={handleFilterChange}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				>
					<option value="">모든 카테고리</option>
					{#each getUniqueCategories() as category}
						<option value={category}>{category}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="status" class="block text-sm font-medium text-gray-700">상태</label>
				<select
					id="status"
					bind:value={filters.status}
					on:change={handleFilterChange}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				>
					<option value="">모든 상태</option>
					{#each statusOptions as status}
						<option value={status}>{getStatusDisplayName(status)}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- 문서 목록 -->
	<div class="bg-white shadow rounded-lg">
		<div class="px-6 py-4 border-b border-gray-200">
			<h3 class="text-lg font-medium text-gray-900">
				문서 목록 
				{#if !loading}
					<span class="text-sm text-gray-500">({filteredDocuments.length}개)</span>
				{/if}
			</h3>
		</div>

		{#if loading}
			<div class="px-6 py-12 text-center">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p class="mt-2 text-sm text-gray-600">문서를 불러오는 중...</p>
			</div>
		{:else if error}
			<div class="px-6 py-12 text-center">
				<div class="text-red-400 mb-4">
					<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<h3 class="text-sm font-medium text-gray-900">오류 발생</h3>
				<p class="mt-1 text-sm text-gray-500">{error}</p>
				<button
					on:click={loadDocuments}
					class="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
				>
					다시 시도
				</button>
			</div>
		{:else if filteredDocuments.length === 0}
			<div class="px-6 py-12 text-center">
				<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<h3 class="mt-2 text-sm font-medium text-gray-900">문서가 없습니다</h3>
				<p class="mt-1 text-sm text-gray-500">
					{documents.length === 0 ? '아직 생성된 문서가 없습니다.' : '필터 조건에 맞는 문서가 없습니다.'}
				</p>
			</div>
		{:else}
			<div class="overflow-hidden">
				<ul class="divide-y divide-gray-200">
					{#each filteredDocuments as doc (doc.id)}
						<li class="px-6 py-4 hover:bg-gray-50">
							<div class="flex items-center justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center space-x-3">
										<h4 class="text-sm font-medium text-gray-900 truncate">
											{doc.title}
										</h4>
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(doc.status)}">
											{getStatusDisplayName(doc.status)}
										</span>
									</div>
									
									<div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
										<span>📋 {getDocTypeDisplayName(doc.doc_type)}</span>
										{#if doc.category}
											<span>📂 {doc.category}</span>
										{/if}
										<span>🆔 {doc.id}</span>
									</div>

									{#if doc.summary}
										<p class="mt-2 text-sm text-gray-600 line-clamp-2">
											{doc.summary}
										</p>
									{/if}

									<div class="mt-2 flex items-center space-x-4 text-xs text-gray-400">
										<span>생성: {formatDate(doc.created_at)}</span>
										<span>수정: {formatDate(doc.updated_at)}</span>
										{#if doc.linked_entities_count > 0}
											<span>🔗 {doc.linked_entities_count}개 연결</span>
										{/if}
									</div>
								</div>

								<div class="flex-shrink-0 ml-4">
									<button
										class="text-blue-600 hover:text-blue-900 text-sm font-medium"
										on:click={() => window.open(`/documents/${doc.id}`, '_blank')}
									>
										상세보기
									</button>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>