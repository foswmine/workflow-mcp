<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let environment = null;
	let deployments = [];
	let loading = true;
	let error = null;
	let editing = false;
	let editForm = {
		name: '',
		description: '',
		url: '',
		status: '',
		tags: []
	};

	$: environmentId = $page.params.id;

	onMount(async () => {
		await Promise.all([loadEnvironment(), loadDeployments()]);
	});

	async function loadEnvironment() {
		try {
			loading = true;
			const response = await fetch(`/api/environments/${environmentId}`);
			if (response.ok) {
				environment = await response.json();
				// 편집 폼 초기화
				editForm = {
					name: environment.name,
					description: environment.description || '',
					url: environment.url || '',
					status: environment.status,
					tags: Array.isArray(environment.tags) ? environment.tags : []
				};
			} else {
				const errorData = await response.json();
				error = errorData.error || '환경 정보를 찾을 수 없습니다';
			}
		} catch (e) {
			error = '환경 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function loadDeployments() {
		try {
			const response = await fetch('/api/deployments');
			if (response.ok) {
				const allDeployments = await response.json();
				deployments = allDeployments.filter(d => d.environment_id === environmentId);
			}
		} catch (e) {
			console.error('배포 로딩 중 오류:', e);
		}
	}

	async function updateEnvironment() {
		if (!confirm('환경 정보를 업데이트하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/environments/${environmentId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...editForm,
					updated_at: new Date().toISOString()
				})
			});

			if (response.ok) {
				await loadEnvironment();
				editing = false;
				alert('환경 정보가 업데이트되었습니다');
			} else {
				alert('환경 업데이트 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('업데이트 중 오류: ' + e.message);
		}
	}

	async function updateStatus(newStatus) {
		if (!confirm(`환경 상태를 '${newStatus}'로 변경하시겠습니까?`)) return;

		try {
			const response = await fetch(`/api/environments/${environmentId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					status: newStatus,
					updated_at: new Date().toISOString()
				})
			});

			if (response.ok) {
				await loadEnvironment();
				alert('환경 상태가 변경되었습니다');
			} else {
				alert('상태 변경 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('상태 변경 중 오류: ' + e.message);
		}
	}

	function getEnvironmentTypeColor(type) {
		const colors = {
			'development': 'bg-blue-50 border-blue-200',
			'staging': 'bg-yellow-50 border-yellow-200',
			'production': 'bg-red-50 border-red-200',
			'testing': 'bg-green-50 border-green-200'
		};
		return colors[type] || 'bg-gray-50 border-gray-200';
	}

	function getStatusColor(status) {
		const colors = {
			'active': 'bg-green-100 text-green-800',
			'inactive': 'bg-gray-100 text-gray-800',
			'maintenance': 'bg-yellow-100 text-yellow-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getDeploymentStatusColor(status) {
		const colors = {
			'planned': 'bg-blue-100 text-blue-800',
			'in_progress': 'bg-yellow-100 text-yellow-800',
			'completed': 'bg-green-100 text-green-800',
			'failed': 'bg-red-100 text-red-800',
			'rolled_back': 'bg-purple-100 text-purple-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString('ko-KR');
	}

	function goBack() {
		goto('/environments');
	}

	function addTag() {
		const newTag = prompt('새 태그를 입력해주세요:');
		if (newTag && !editForm.tags.includes(newTag)) {
			editForm.tags = [...editForm.tags, newTag];
		}
	}

	function removeTag(tagToRemove) {
		editForm.tags = editForm.tags.filter(tag => tag !== tagToRemove);
	}
</script>

<svelte:head>
	<title>{environment ? `환경: ${environment.name}` : '환경 상세보기'} - WorkflowMCP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<div class="flex items-center gap-4">
			<button 
				on:click={goBack}
				class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
			>
				← 목록으로
			</button>
			<h1 class="text-3xl font-bold text-gray-900">환경 상세보기</h1>
		</div>
		
		{#if environment}
			<div class="flex items-center gap-2">
				<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(environment.status)}">
					{environment.status}
				</span>
				<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
					{environment.environment_type}
				</span>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2">로딩 중...</span>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{error}
		</div>
		<button 
			on:click={goBack}
			class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
		>
			목록으로 돌아가기
		</button>
	{:else if environment}
		<div class="bg-white rounded-lg shadow border {getEnvironmentTypeColor(environment.environment_type)} p-8">
			{#if !editing}
				<!-- 보기 모드 -->
				<div class="mb-8">
					<h2 class="text-2xl font-bold text-gray-900 mb-2">{environment.name}</h2>
					{#if environment.description}
						<p class="text-gray-600 text-lg">{environment.description}</p>
					{/if}
					{#if environment.url}
						<a href={environment.url} target="_blank" rel="noopener" 
						   class="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-2">
							{environment.url} ↗
						</a>
					{/if}
				</div>

				<!-- 기본 정보 -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					<div class="bg-gray-50 p-4 rounded-lg">
						<h3 class="font-semibold text-gray-700 mb-2">환경 정보</h3>
						<div class="space-y-2">
							<div>
								<span class="text-sm text-gray-500">환경 타입:</span>
								<span class="ml-2 font-medium">{environment.environment_type}</span>
							</div>
							<div>
								<span class="text-sm text-gray-500">상태:</span>
								<span class="ml-2">
									<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(environment.status)}">
										{environment.status}
									</span>
								</span>
							</div>
							{#if environment.project_id}
								<div>
									<span class="text-sm text-gray-500">프로젝트 ID:</span>
									<span class="ml-2 font-medium text-xs">{environment.project_id}</span>
								</div>
							{/if}
						</div>
					</div>

					<div class="bg-gray-50 p-4 rounded-lg">
						<h3 class="font-semibold text-gray-700 mb-2">생성 정보</h3>
						<div class="space-y-2">
							<div>
								<span class="text-sm text-gray-500">생성일:</span>
								<span class="ml-2 font-medium">{formatDate(environment.created_at)}</span>
							</div>
							<div>
								<span class="text-sm text-gray-500">수정일:</span>
								<span class="ml-2 font-medium">{formatDate(environment.updated_at)}</span>
							</div>
						</div>
					</div>

					<div class="bg-gray-50 p-4 rounded-lg">
						<h3 class="font-semibold text-gray-700 mb-2">배포 통계</h3>
						<div class="space-y-2">
							<div>
								<span class="text-sm text-gray-500">총 배포:</span>
								<span class="ml-2 font-medium">{deployments.length}개</span>
							</div>
							<div>
								<span class="text-sm text-gray-500">완료된 배포:</span>
								<span class="ml-2 font-medium">{deployments.filter(d => d.status === 'completed').length}개</span>
							</div>
							<div>
								<span class="text-sm text-gray-500">실패한 배포:</span>
								<span class="ml-2 font-medium">{deployments.filter(d => d.status === 'failed').length}개</span>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- 편집 모드 -->
				<div class="mb-8">
					<h2 class="text-2xl font-bold text-gray-900 mb-6">환경 편집</h2>
					
					<div class="space-y-6">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">환경 이름</label>
							<input 
								bind:value={editForm.name}
								type="text" 
								class="w-full border border-gray-300 rounded-md px-3 py-2"
								required
							>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
							<textarea 
								bind:value={editForm.description}
								rows="3" 
								class="w-full border border-gray-300 rounded-md px-3 py-2"
							></textarea>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
							<input 
								bind:value={editForm.url}
								type="url" 
								class="w-full border border-gray-300 rounded-md px-3 py-2"
								placeholder="https://example.com"
							>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
							<select bind:value={editForm.status} class="border border-gray-300 rounded-md px-3 py-2">
								<option value="active">활성</option>
								<option value="inactive">비활성</option>
								<option value="maintenance">점검중</option>
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">태그</label>
							<div class="flex flex-wrap gap-2 mb-2">
								{#each editForm.tags as tag}
									<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
										{tag}
										<button 
											on:click={() => removeTag(tag)}
											class="text-blue-500 hover:text-blue-700"
										>
											×
										</button>
									</span>
								{/each}
								<button 
									on:click={addTag}
									class="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300"
								>
									+ 태그 추가
								</button>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- 태그 섹션 (보기 모드) -->
			{#if !editing && environment.tags && environment.tags.length > 0}
				<div class="mb-8">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">태그</h3>
					<div class="flex flex-wrap gap-2">
						{#each Array.isArray(environment.tags) ? environment.tags : [] as tag}
							<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 배포 이력 섹션 -->
			{#if !editing && deployments.length > 0}
				<div class="mb-8">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">배포 이력</h3>
					<div class="bg-gray-50 rounded-lg overflow-hidden">
						<div class="max-h-64 overflow-y-auto">
							{#each deployments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) as deployment}
								<div class="border-b border-gray-200 last:border-b-0 p-4 hover:bg-gray-100">
									<div class="flex justify-between items-start">
										<div>
											<h4 class="font-medium text-gray-900">{deployment.title}</h4>
											<p class="text-sm text-gray-600">버전 {deployment.version}</p>
											<p class="text-xs text-gray-500">{formatDate(deployment.created_at)}</p>
										</div>
										<span class="px-2 py-1 rounded text-xs font-medium {getDeploymentStatusColor(deployment.status)}">
											{deployment.status}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- 액션 버튼들 -->
			<div class="flex justify-between items-center pt-6 border-t">
				<div class="flex gap-2">
					{#if !editing}
						{#if environment.status === 'active'}
							<button 
								on:click={() => updateStatus('maintenance')}
								class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
							>
								점검 모드로 변경
							</button>
						{:else if environment.status === 'maintenance'}
							<button 
								on:click={() => updateStatus('active')}
								class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
							>
								활성화
							</button>
						{:else if environment.status === 'inactive'}
							<button 
								on:click={() => updateStatus('active')}
								class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
							>
								활성화
							</button>
						{/if}
					{/if}
				</div>

				<div class="flex gap-2">
					{#if editing}
						<button 
							on:click={() => editing = false}
							class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
						>
							취소
						</button>
						<button 
							on:click={updateEnvironment}
							class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
						>
							저장
						</button>
					{:else}
						<button 
							on:click={() => editing = true}
							class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
						>
							편집
						</button>
						<button 
							on:click={goBack}
							class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
						>
							목록으로
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>