<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let form = {
		title: '',
		description: '',
		design_type: 'system',
		priority: 'medium',
		status: 'draft',
		requirement_id: '',
		design_details: '',
		diagrams: '',
		acceptance_criteria: [],
		tags: [],
		notes: ''
	};
	
	let newCriteria = '';
	let newTag = '';
	let loading = false;
	let error = null;
	let initialLoading = true;
	
	onMount(async () => {
		try {
			const response = await fetch(`/api/designs/${$page.params.id}`);
			if (response.ok) {
				const design = await response.json();
				form = {
					title: design.title || '',
					description: design.description || '',
					design_type: design.design_type || 'system',
					priority: design.priority?.toLowerCase() || 'medium',
					status: design.status || 'draft',
					requirement_id: design.requirement_id || '',
					design_details: design.design_details || '',
					diagrams: design.diagrams || '',
					acceptance_criteria: (() => {
						try {
							if (typeof design.acceptance_criteria === 'string') {
								if (design.acceptance_criteria === '[object Object]') return [];
								return JSON.parse(design.acceptance_criteria || '[]');
							}
							return Array.isArray(design.acceptance_criteria) ? design.acceptance_criteria : [];
						} catch {
							return [];
						}
					})(),
					tags: (() => {
						try {
							if (typeof design.tags === 'string') {
								if (design.tags === '[object Object]') return [];
								return JSON.parse(design.tags || '[]');
							}
							return Array.isArray(design.tags) ? design.tags : [];
						} catch {
							return [];
						}
					})(),
					notes: design.notes || ''
				};
			} else {
				error = '설계를 찾을 수 없습니다';
			}
		} catch (e) {
			error = '데이터를 불러오는 중 오류가 발생했습니다';
		} finally {
			initialLoading = false;
		}
	});
	
	function addCriteria() {
		if (newCriteria.trim()) {
			form.acceptance_criteria = [...form.acceptance_criteria, newCriteria.trim()];
			newCriteria = '';
		}
	}
	
	function removeCriteria(index) {
		form.acceptance_criteria = form.acceptance_criteria.filter((_, i) => i !== index);
	}
	
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
		
		try {
			loading = true;
			error = null;
			
			const response = await fetch(`/api/designs/${$page.params.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...form,
					details: form.design_details // DesignManager에서 details 파라미터를 예상함
				})
			});
			
			if (response.ok) {
				goto(`/designs/${$page.params.id}`);
			} else {
				const errorData = await response.json();
				error = errorData.message || '설계 수정 중 오류가 발생했습니다';
			}
		} catch (e) {
			error = '네트워크 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}
	
	function handleKeyPress(e, action) {
		if (e.key === 'Enter') {
			e.preventDefault();
			action();
		}
	}
</script>

<svelte:head>
	<title>설계 편집 - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">설계 편집</h1>
			<p class="text-gray-600 mt-1">시스템 설계 문서를 수정합니다</p>
		</div>
		<a href="/designs/{$page.params.id}" class="btn btn-secondary">
			← 상세보기로
		</a>
	</div>

	{#if initialLoading}
		<div class="flex justify-center py-12">
			<div class="text-gray-500">데이터를 불러오는 중...</div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{:else}
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="md:col-span-2">
						<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
							제목 *
						</label>
						<input
							id="title"
							type="text"
							bind:value={form.title}
							class="form-input w-full"
							placeholder="설계 제목을 입력하세요"
							required
						/>
					</div>

					<div>
						<label for="design_type" class="block text-sm font-medium text-gray-700 mb-1">
							설계 타입
						</label>
						<select id="design_type" bind:value={form.design_type} class="form-select w-full">
							<option value="system">시스템</option>
							<option value="architecture">아키텍처</option>
							<option value="ui_ux">UI/UX</option>
							<option value="database">데이터베이스</option>
							<option value="api">API</option>
						</select>
					</div>

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
							<option value="draft">초안</option>
							<option value="review">검토중</option>
							<option value="approved">승인됨</option>
							<option value="implemented">구현완료</option>
						</select>
					</div>

					<div>
						<label for="requirement_id" class="block text-sm font-medium text-gray-700 mb-1">
							연관 요구사항 ID
						</label>
						<input
							id="requirement_id"
							type="text"
							bind:value={form.requirement_id}
							class="form-input w-full"
							placeholder="연관된 PRD ID (선택사항)"
						/>
					</div>

					<div class="md:col-span-2">
						<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
							설명
						</label>
						<textarea
							id="description"
							bind:value={form.description}
							rows="4"
							class="form-textarea w-full"
							placeholder="설계에 대한 상세 설명을 입력하세요"
						></textarea>
					</div>
				</div>
			</div>

			<!-- 설계 상세사항 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">설계 상세사항</h2>
				<textarea
					bind:value={form.design_details}
					rows="8"
					class="form-textarea w-full"
					placeholder="설계의 상세한 내용을 입력하세요..."
				></textarea>
			</div>

			<!-- 다이어그램 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">다이어그램</h2>
				<textarea
					bind:value={form.diagrams}
					rows="6"
					class="form-textarea w-full"
					placeholder="다이어그램 설명이나 텍스트 기반 다이어그램을 입력하세요..."
				></textarea>
			</div>

			<!-- 인수 조건 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">인수 조건</h2>
				
				<div class="space-y-3">
					<div class="flex space-x-2">
						<input
							type="text"
							bind:value={newCriteria}
							class="form-input flex-1"
							placeholder="새 인수 조건을 입력하세요"
							on:keypress={(e) => handleKeyPress(e, addCriteria)}
						/>
						<button
							type="button"
							class="btn btn-primary"
							on:click={addCriteria}
							disabled={!newCriteria.trim()}
						>
							추가
						</button>
					</div>

					{#if form.acceptance_criteria.length > 0}
						<div class="space-y-2">
							{#each form.acceptance_criteria as criteria, index}
								<div class="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
									<span class="text-sm text-gray-600 min-w-0 flex-1">{criteria}</span>
									<button
										type="button"
										class="text-red-600 hover:text-red-800 text-sm"
										on:click={() => removeCriteria(index)}
									>
										삭제
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- 태그 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">태그</h2>
				
				<div class="space-y-3">
					<div class="flex space-x-2">
						<input
							type="text"
							bind:value={newTag}
							class="form-input flex-1"
							placeholder="새 태그를 입력하세요"
							on:keypress={(e) => handleKeyPress(e, addTag)}
						/>
						<button
							type="button"
							class="btn btn-primary"
							on:click={addTag}
							disabled={!newTag.trim()}
						>
							추가
						</button>
					</div>

					{#if form.tags.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each form.tags as tag, index}
								<span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
									{tag}
									<button
										type="button"
										class="text-gray-500 hover:text-red-600"
										on:click={() => removeTag(index)}
									>
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- 노트 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">노트</h2>
				<textarea
					bind:value={form.notes}
					rows="4"
					class="form-textarea w-full"
					placeholder="추가적인 메모나 노트를 입력하세요..."
				></textarea>
			</div>

			<!-- 액션 버튼 -->
			<div class="flex justify-end space-x-3">
				<a href="/designs/{$page.params.id}" class="btn btn-secondary">취소</a>
				<button 
					type="submit" 
					class="btn btn-primary" 
					disabled={loading || !form.title.trim()}
				>
					{loading ? '저장 중...' : '설계 저장'}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
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
	.form-input {
		@apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}
	.form-select {
		@apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}
	.form-textarea {
		@apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}
</style>