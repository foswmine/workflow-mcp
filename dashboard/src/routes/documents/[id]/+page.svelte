<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let document = null;
	let loading = true;
	let error = null;
	let editing = false;
	let editForm = {
		title: '',
		content: '',
		summary: '',
		status: '',
		tags: []
	};

	$: documentId = $page.params.id;

	onMount(async () => {
		await loadDocument();
	});

	async function loadDocument() {
		try {
			loading = true;
			const response = await fetch(`/api/documents/${documentId}`);
			
			if (!response.ok) {
				if (response.status === 404) {
					error = '문서를 찾을 수 없습니다.';
				} else {
					error = '문서를 불러오는 중 오류가 발생했습니다.';
				}
				return;
			}
			
			document = await response.json();
			
			// 편집 폼 초기화
			editForm = {
				title: document.title,
				content: document.content,
				summary: document.summary || '',
				status: document.status,
				tags: document.tags || []
			};
		} catch (err) {
			console.error('Error loading document:', err);
			error = '문서를 불러오는 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	}

	async function saveDocument() {
		try {
			const response = await fetch(`/api/documents/${documentId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editForm)
			});

			if (!response.ok) {
				throw new Error('문서 저장에 실패했습니다.');
			}

			// 문서 다시 로드
			await loadDocument();
			editing = false;
		} catch (err) {
			console.error('Error saving document:', err);
			alert('문서 저장 중 오류가 발생했습니다.');
		}
	}

	function cancelEdit() {
		editing = false;
		// 원본 데이터로 복원
		editForm = {
			title: document.title,
			content: document.content,
			summary: document.summary || '',
			status: document.status,
			tags: document.tags || []
		};
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
	<title>{document ? document.title : '문서 보기'} - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<!-- 헤더 -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<button
				on:click={() => goto('/documents')}
				class="flex items-center text-gray-500 hover:text-gray-700"
			>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				문서 목록으로 돌아가기
			</button>
		</div>
		
		{#if document && !editing}
			<button
				on:click={() => editing = true}
				class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
			>
				편집
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="mt-2 text-sm text-gray-600">문서를 불러오는 중...</p>
		</div>
	{:else if error}
		<div class="text-center py-12">
			<div class="text-red-400 mb-4">
				<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
			<h3 class="text-sm font-medium text-gray-900">오류 발생</h3>
			<p class="mt-1 text-sm text-gray-500">{error}</p>
		</div>
	{:else if document}
		{#if editing}
			<!-- 편집 모드 -->
			<div class="bg-white shadow rounded-lg p-6">
				<div class="space-y-6">
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700">제목</label>
						<input
							id="title"
							type="text"
							bind:value={editForm.title}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="summary" class="block text-sm font-medium text-gray-700">요약</label>
						<input
							id="summary"
							type="text"
							bind:value={editForm.summary}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="status" class="block text-sm font-medium text-gray-700">상태</label>
						<select
							id="status"
							bind:value={editForm.status}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="draft">초안</option>
							<option value="review">검토 중</option>
							<option value="approved">승인됨</option>
							<option value="archived">보관됨</option>
						</select>
					</div>

					<div>
						<label for="content" class="block text-sm font-medium text-gray-700">내용</label>
						<textarea
							id="content"
							bind:value={editForm.content}
							rows="20"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
						></textarea>
					</div>

					<div class="flex justify-end space-x-3">
						<button
							on:click={cancelEdit}
							class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
						>
							취소
						</button>
						<button
							on:click={saveDocument}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
						>
							저장
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- 읽기 모드 -->
			<div class="bg-white shadow rounded-lg overflow-hidden">
				<!-- 문서 헤더 -->
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h1 class="text-2xl font-bold text-gray-900 mb-2">{document.title}</h1>
							<div class="text-xs text-gray-500 mt-1 font-mono">ID: {document.id}</div>
							
							<div class="flex items-center space-x-4 text-sm text-gray-500">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(document.status)}">
									{getStatusDisplayName(document.status)}
								</span>
								<span>📋 {getDocTypeDisplayName(document.doc_type)}</span>
								{#if document.category}
									<span>📂 {document.category}</span>
								{/if}
								<span>🆔 {document.id}</span>
							</div>

							{#if document.summary}
								<p class="mt-2 text-gray-600">{document.summary}</p>
							{/if}

							{#if document.tags && document.tags.length > 0}
								<div class="mt-2 flex flex-wrap gap-2">
									{#each document.tags as tag}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
											{tag}
										</span>
									{/each}
								</div>
							{/if}

							<div class="mt-4 text-xs text-gray-400 space-y-1">
								<div>생성: {formatDate(document.created_at)} (작성자: {document.created_by})</div>
								<div>수정: {formatDate(document.updated_at)} (버전: {document.version})</div>
								{#if document.links && document.links.length > 0}
									<div>연결: {document.links.length}개 항목</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- 문서 내용 -->
				<div class="px-6 py-6">
					<div class="max-w-none text-sm">
						{@html document.content.replace(/\n/g, '<br>').replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mb-3">$1</h1>').replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-800 mb-2 mt-4">$1</h2>').replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-gray-700 mb-2 mt-3">$1</h3>').replace(/^\- (.+)$/gm, '<li class="ml-4">• $1</li>').replace(/^\*\*(.+?)\*\*/gm, '<strong>$1</strong>').replace(/✅/g, '<span class="text-green-600">✅</span>')}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>