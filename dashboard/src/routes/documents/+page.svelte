<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let documents = [];
	let filteredDocuments = [];
	let loading = true;
	let error = null;
	
	// 새 문서 생성 폼 상태
	let showCreateForm = false;
	let createFormData = {
		title: '',
		content: '',
		doc_type: '',
		category: '',
		tags: '',
		summary: ''
	};
	let availableCategories = [];
	let availableTags = [];
	let creatingDocument = false;

	// 문서 편집 폼 상태
	let showEditForm = false;
	let editFormData = {
		id: null,
		title: '',
		content: '',
		doc_type: '',
		category: '',
		tags: '',
		summary: '',
		status: ''
	};
	let updatingDocument = false;
	
	// 필터 상태
	let filters = {
		search: '',
		doc_type: '',
		category: '',
		status: ''
	};
	
	// 정렬 옵션
	let sortBy = 'updated'; // 'updated', 'created', 'title'

	// 문서 유형 옵션
	const docTypes = [
		'test_guide', 'test_results', 'analysis', 'report', 
		'checklist', 'specification', 'meeting_notes', 'decision_log'
	];

	// 상태 옵션
	const statusOptions = ['draft', 'review', 'approved', 'archived'];

	onMount(async () => {
		await Promise.all([
			loadDocuments(),
			loadDocumentCategories()
		]);
	});

	async function loadDocuments() {
		try {
			loading = true;
			const response = await fetch('/api/documents');
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const data = await response.json();
			documents = data.documents || [];
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
		// 필터링
		let filtered = documents.filter(doc => {
			const matchesSearch = !filters.search || 
				doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
				(doc.summary && doc.summary.toLowerCase().includes(filters.search.toLowerCase()));
			
			const matchesType = !filters.doc_type || doc.doc_type === filters.doc_type;
			const matchesCategory = !filters.category || doc.category === filters.category;
			const matchesStatus = !filters.status || doc.status === filters.status;

			return matchesSearch && matchesType && matchesCategory && matchesStatus;
		});
		
		// 정렬
		filteredDocuments = filtered.sort((a, b) => {
			switch (sortBy) {
				case 'updated':
					return new Date(b.updated_at) - new Date(a.updated_at);
				case 'created':
					return new Date(b.created_at) - new Date(a.created_at);
				case 'title':
					return a.title.localeCompare(b.title);
				default:
					return new Date(b.updated_at) - new Date(a.updated_at);
			}
		});
	}

	function handleFilterChange() {
		filterDocuments();
	}
	
	// 정렬 옵션 변경 시 재정렬
	$: if (sortBy && documents.length > 0) {
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

	// 문서 분류 정보 로드
	async function loadDocumentCategories() {
		try {
			const response = await fetch('/api/document-categories');
			if (response.ok) {
				const data = await response.json();
				availableCategories = data.categories || [];
				availableTags = data.tags || [];
			}
		} catch (err) {
			console.error('Error loading document categories:', err);
		}
	}

	// 새 문서 생성
	async function createDocument() {
		if (!createFormData.title.trim() || !createFormData.content.trim()) {
			alert('제목과 내용을 입력해주세요.');
			return;
		}

		try {
			creatingDocument = true;
			
			// 태그를 배열로 변환
			const tags = createFormData.tags
				.split(',')
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0);

			const response = await fetch('/api/documents', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: createFormData.title,
					content: createFormData.content,
					doc_type: createFormData.doc_type || 'analysis',
					category: createFormData.category,
					tags: tags,
					summary: createFormData.summary
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create document');
			}

			const result = await response.json();
			
			// 폼 초기화
			createFormData = {
				title: '',
				content: '',
				doc_type: '',
				category: '',
				tags: '',
				summary: ''
			};
			showCreateForm = false;
			
			// 문서 목록 새로고침
			await loadDocuments();
			
			alert('문서가 성공적으로 생성되었습니다!');
		} catch (err) {
			console.error('Error creating document:', err);
			alert('문서 생성 중 오류가 발생했습니다: ' + err.message);
		} finally {
			creatingDocument = false;
		}
	}

	// 편집 모달 열기
	function openEditModal(doc) {
		editFormData = {
			id: doc.id,
			title: doc.title,
			content: doc.content || '',
			doc_type: doc.doc_type || '',
			category: doc.category || '',
			tags: Array.isArray(doc.tags) ? doc.tags.join(', ') : (doc.tags || ''),
			summary: doc.summary || '',
			status: doc.status || 'draft'
		};
		showEditForm = true;
	}

	// 문서 업데이트
	async function updateDocument() {
		if (!editFormData.title.trim() || !editFormData.content.trim()) {
			alert('제목과 내용을 입력해주세요.');
			return;
		}

		try {
			updatingDocument = true;
			
			// 태그를 배열로 변환
			const tags = editFormData.tags
				.split(',')
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0);

			const response = await fetch(`/api/documents/${editFormData.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: editFormData.title,
					content: editFormData.content,
					doc_type: editFormData.doc_type || 'analysis',
					category: editFormData.category,
					tags: tags,
					summary: editFormData.summary,
					status: editFormData.status
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update document');
			}

			const result = await response.json();
			
			// 폼 초기화
			editFormData = {
				id: null,
				title: '',
				content: '',
				doc_type: '',
				category: '',
				tags: '',
				summary: '',
				status: ''
			};
			showEditForm = false;
			
			// 문서 목록 새로고침
			await loadDocuments();
			
			alert('문서가 성공적으로 수정되었습니다!');
		} catch (err) {
			console.error('Error updating document:', err);
			alert('문서 수정 중 오류가 발생했습니다: ' + err.message);
		} finally {
			updatingDocument = false;
		}
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
		<div class="mt-4 sm:mt-0 flex items-center gap-4">
			<!-- 정렬 옵션 -->
			<div class="flex items-center gap-2">
				<label class="text-sm text-gray-600">정렬:</label>
				<select 
					bind:value={sortBy}
					class="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
				>
					<option value="updated">최근 수정</option>
					<option value="created">최근 등록</option>
					<option value="title">제목 순</option>
				</select>
			</div>
			<button
				type="button"
				on:click={() => showCreateForm = true}
				class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-2"
			>
				<svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
				</svg>
				새 문서
			</button>
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

								<div class="flex-shrink-0 ml-4 space-x-2">
									<button
										class="text-green-600 hover:text-green-900 text-sm font-medium"
										on:click={() => openEditModal(doc)}
									>
										편집
									</button>
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

<!-- 새 문서 생성 모달 -->
{#if showCreateForm}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-medium text-gray-900">새 문서 생성</h3>
				<button
					type="button"
					on:click={() => showCreateForm = false}
					class="text-gray-400 hover:text-gray-600"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<form on:submit|preventDefault={createDocument} class="space-y-6">
				<!-- 제목 -->
				<div>
					<label for="title" class="block text-sm font-medium text-gray-700">제목 *</label>
					<input
						id="title"
						type="text"
						bind:value={createFormData.title}
						required
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						placeholder="문서 제목을 입력하세요"
					/>
				</div>

				<!-- 문서 유형 및 카테고리 -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="doc_type" class="block text-sm font-medium text-gray-700">문서 유형</label>
						<select
							id="doc_type"
							bind:value={createFormData.doc_type}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="">선택하세요</option>
							{#each docTypes as type}
								<option value={type}>{getDocTypeDisplayName(type)}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="category" class="block text-sm font-medium text-gray-700">카테고리</label>
						<input
							id="category"
							type="text"
							bind:value={createFormData.category}
							list="categoryList"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="카테고리 입력 또는 선택"
						/>
						<datalist id="categoryList">
							{#each availableCategories as category}
								<option value={category.value}>{category.value} ({category.count}개)</option>
							{/each}
						</datalist>
					</div>
				</div>

				<!-- 태그 -->
				<div>
					<label for="tags" class="block text-sm font-medium text-gray-700">태그</label>
					<input
						id="tags"
						type="text"
						bind:value={createFormData.tags}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						placeholder="태그를 쉼표로 구분하여 입력 (예: 테스트, 분석, 개발)"
					/>
					<p class="mt-1 text-xs text-gray-500">
						자주 사용되는 태그: 
						{#each availableTags.slice(0, 5) as tag}
							<button
								type="button"
								on:click={() => {
									const currentTags = createFormData.tags.split(',').map(t => t.trim()).filter(t => t);
									if (!currentTags.includes(tag.value)) {
										createFormData.tags = [...currentTags, tag.value].join(', ');
									}
								}}
								class="text-blue-600 hover:text-blue-800 mx-1"
							>
								{tag.value}
							</button>
						{/each}
					</p>
				</div>

				<!-- 요약 -->
				<div>
					<label for="summary" class="block text-sm font-medium text-gray-700">요약</label>
					<textarea
						id="summary"
						bind:value={createFormData.summary}
						rows="2"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						placeholder="문서의 간단한 요약을 입력하세요"
					></textarea>
				</div>

				<!-- 내용 -->
				<div>
					<label for="content" class="block text-sm font-medium text-gray-700">내용 *</label>
					<textarea
						id="content"
						bind:value={createFormData.content}
						rows="10"
						required
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						placeholder="Markdown 형식으로 문서 내용을 작성하세요"
					></textarea>
				</div>

				<!-- 버튼 -->
				<div class="flex justify-end space-x-3">
					<button
						type="button"
						on:click={() => showCreateForm = false}
						class="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						취소
					</button>
					<button
						type="submit"
						disabled={creatingDocument || !createFormData.title.trim() || !createFormData.content.trim()}
						class="px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
					>
						{#if creatingDocument}
							<div class="inline-flex items-center">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								생성 중...
							</div>
						{:else}
							문서 생성
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- 문서 편집 모달 -->
{#if showEditForm}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-medium text-gray-900">문서 편집</h3>
				<button
					type="button"
					on:click={() => showEditForm = false}
					class="text-gray-400 hover:text-gray-600"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<form on:submit|preventDefault={updateDocument} class="space-y-6">
				<!-- 제목 -->
				<div>
					<label for="edit-title" class="block text-sm font-medium text-gray-700">제목 *</label>
					<input
						id="edit-title"
						type="text"
						bind:value={editFormData.title}
						required
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						placeholder="문서 제목을 입력하세요"
					/>
				</div>

				<!-- 문서 유형, 카테고리, 상태 -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="edit-doc_type" class="block text-sm font-medium text-gray-700">문서 유형</label>
						<select
							id="edit-doc_type"
							bind:value={editFormData.doc_type}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="">선택하세요</option>
							{#each docTypes as type}
								<option value={type}>{getDocTypeDisplayName(type)}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="edit-category" class="block text-sm font-medium text-gray-700">카테고리</label>
						<input
							id="edit-category"
							type="text"
							bind:value={editFormData.category}
							list="editCategoryList"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="카테고리 입력 또는 선택"
						/>
						<datalist id="editCategoryList">
							{#each availableCategories as category}
								<option value={category.value}>{category.value} ({category.count}개)</option>
							{/each}
						</datalist>
					</div>

					<div>
						<label for="edit-status" class="block text-sm font-medium text-gray-700">상태</label>
						<select
							id="edit-status"
							bind:value={editFormData.status}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							{#each statusOptions as status}
								<option value={status}>{getStatusDisplayName(status)}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- 태그 -->
				<div>
					<label for="edit-tags" class="block text-sm font-medium text-gray-700">태그</label>
					<input
						id="edit-tags"
						type="text"
						bind:value={editFormData.tags}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						placeholder="태그를 쉼표로 구분하여 입력 (예: 테스트, 분석, 개발)"
					/>
					<p class="mt-1 text-xs text-gray-500">
						자주 사용되는 태그: 
						{#each availableTags.slice(0, 5) as tag}
							<button
								type="button"
								on:click={() => {
									const currentTags = editFormData.tags.split(',').map(t => t.trim()).filter(t => t);
									if (!currentTags.includes(tag.value)) {
										editFormData.tags = [...currentTags, tag.value].join(', ');
									}
								}}
								class="text-blue-600 hover:text-blue-800 mx-1"
							>
								{tag.value}
							</button>
						{/each}
					</p>
				</div>

				<!-- 요약 -->
				<div>
					<label for="edit-summary" class="block text-sm font-medium text-gray-700">요약</label>
					<textarea
						id="edit-summary"
						bind:value={editFormData.summary}
						rows="2"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						placeholder="문서의 간단한 요약을 입력하세요"
					></textarea>
				</div>

				<!-- 내용 -->
				<div>
					<label for="edit-content" class="block text-sm font-medium text-gray-700">내용 *</label>
					<textarea
						id="edit-content"
						bind:value={editFormData.content}
						rows="10"
						required
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						placeholder="Markdown 형식으로 문서 내용을 작성하세요"
					></textarea>
				</div>

				<!-- 버튼 -->
				<div class="flex justify-end space-x-3">
					<button
						type="button"
						on:click={() => showEditForm = false}
						class="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						취소
					</button>
					<button
						type="submit"
						disabled={updatingDocument || !editFormData.title.trim() || !editFormData.content.trim()}
						class="px-4 py-2 border border-transparent rounded-md shadow-sm bg-green-600 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
					>
						{#if updatingDocument}
							<div class="inline-flex items-center">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								수정 중...
							</div>
						{:else}
							문서 수정
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}