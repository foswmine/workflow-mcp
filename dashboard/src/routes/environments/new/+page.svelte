<script>
	import { goto } from '$app/navigation';

	let form = {
		name: '',
		environment_type: 'development',
		description: '',
		url: '',
		status: 'active',
		tags: [],
		project_id: ''
	};

	let projects = [];
	let newTag = '';
	let loading = false;
	let error = null;

	// 프로젝트 목록 로드 (선택사항)
	import { onMount } from 'svelte';
	onMount(async () => {
		try {
			const response = await fetch('/api/projects');
			if (response.ok) {
				projects = await response.json();
			}
		} catch (e) {
			console.error('프로젝트 목록 로드 실패:', e);
		}
	});

	function addTag() {
		if (newTag.trim() && !form.tags.includes(newTag.trim())) {
			form.tags = [...form.tags, newTag.trim()];
			newTag = '';
		}
	}

	function removeTag(tagToRemove) {
		form.tags = form.tags.filter(tag => tag !== tagToRemove);
	}

	function handleTagKeydown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		}
	}

	async function handleSubmit() {
		if (!form.name.trim()) {
			error = '환경 이름을 입력해주세요';
			return;
		}

		try {
			loading = true;
			error = null;

			const response = await fetch('/api/environments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			});

			if (response.ok) {
				const result = await response.json();
				goto(`/environments/${result.id}`);
			} else {
				const errorData = await response.json();
				error = errorData.error || '환경 생성 중 오류가 발생했습니다';
			}
		} catch (e) {
			error = '환경 생성 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto('/environments');
	}
</script>

<svelte:head>
	<title>새 환경 생성 - WorkflowMCP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<div class="flex items-center gap-4">
			<button 
				on:click={handleCancel}
				class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
			>
				← 목록으로
			</button>
			<h1 class="text-3xl font-bold text-gray-900">새 환경 생성</h1>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow p-6">
		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<!-- 환경 이름 -->
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
					환경 이름 <span class="text-red-500">*</span>
				</label>
				<input
					id="name"
					bind:value={form.name}
					type="text"
					required
					class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="예: Production API Server"
				/>
			</div>

			<!-- 환경 유형 -->
			<div>
				<label for="environment_type" class="block text-sm font-medium text-gray-700 mb-2">
					환경 유형 <span class="text-red-500">*</span>
				</label>
				<select
					id="environment_type"
					bind:value={form.environment_type}
					required
					class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="development">Development</option>
					<option value="staging">Staging</option>
					<option value="production">Production</option>
					<option value="testing">Testing</option>
				</select>
			</div>

			<!-- 설명 -->
			<div>
				<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
					설명
				</label>
				<textarea
					id="description"
					bind:value={form.description}
					rows="3"
					class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="환경에 대한 설명을 입력해주세요"
				></textarea>
			</div>

			<!-- URL -->
			<div>
				<label for="url" class="block text-sm font-medium text-gray-700 mb-2">
					URL
				</label>
				<input
					id="url"
					bind:value={form.url}
					type="url"
					class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="https://api.example.com"
				/>
			</div>

			<!-- 상태 -->
			<div>
				<label for="status" class="block text-sm font-medium text-gray-700 mb-2">
					상태
				</label>
				<select
					id="status"
					bind:value={form.status}
					class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="active">활성</option>
					<option value="inactive">비활성</option>
					<option value="maintenance">점검중</option>
				</select>
			</div>

			<!-- 태그 -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					태그
				</label>
				<div class="flex flex-wrap gap-2 mb-2">
					{#each form.tags as tag}
						<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
							{tag}
							<button
								type="button"
								on:click={() => removeTag(tag)}
								class="text-blue-500 hover:text-blue-700"
							>
								×
							</button>
						</span>
					{/each}
				</div>
				<div class="flex gap-2">
					<input
						bind:value={newTag}
						on:keydown={handleTagKeydown}
						type="text"
						placeholder="태그를 입력하고 Enter를 누르세요"
						class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<button
						type="button"
						on:click={addTag}
						class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
					>
						추가
					</button>
				</div>
			</div>

			<!-- 프로젝트 (선택사항) -->
			{#if projects.length > 0}
				<div>
					<label for="project_id" class="block text-sm font-medium text-gray-700 mb-2">
						프로젝트 (선택사항)
					</label>
					<select
						id="project_id"
						bind:value={form.project_id}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">프로젝트 선택 안함</option>
						{#each projects as project}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- 제출 버튼 -->
			<div class="flex justify-end gap-4 pt-6 border-t">
				<button
					type="button"
					on:click={handleCancel}
					class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
				>
					취소
				</button>
				<button
					type="submit"
					disabled={loading || !form.name.trim()}
					class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
				>
					{#if loading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{/if}
					{loading ? '생성 중...' : '환경 생성'}
				</button>
			</div>
		</form>
	</div>
</div>