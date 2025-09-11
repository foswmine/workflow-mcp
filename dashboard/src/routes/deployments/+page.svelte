<script>
	import { onMount } from 'svelte';

	let deployments = [];
	let environments = [];
	let loading = true;
	let error = null;
	let sortBy = 'scheduled'; // 'scheduled', 'created', 'status'
	let filterStatus = '';
	let filterEnvironment = '';

	onMount(async () => {
		await Promise.all([loadDeployments(), loadEnvironments()]);
	});

	async function loadDeployments() {
		try {
			loading = true;
			const response = await fetch('/api/deployments');
			if (response.ok) {
				deployments = await response.json();
			} else {
				error = '배포 목록을 불러올 수 없습니다';
			}
		} catch (e) {
			error = '배포 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function loadEnvironments() {
		try {
			const response = await fetch('/api/environments');
			if (response.ok) {
				environments = await response.json();
			}
		} catch (e) {
			console.error('환경 로딩 중 오류:', e);
		}
	}

	async function executeDeployment(id) {
		if (!confirm('이 배포를 실행하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/deployments/${id}/execute`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					status: 'completed',
					execution_log: 'Deployment executed successfully via dashboard'
				})
			});

			if (response.ok) {
				await loadDeployments();
				alert('배포가 실행되었습니다');
			} else {
				alert('배포 실행 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('배포 실행 중 오류: ' + e.message);
		}
	}

	async function rollbackDeployment(id) {
		const reason = prompt('롤백 사유를 입력해주세요:');
		if (!reason) return;

		try {
			const response = await fetch(`/api/deployments/${id}/rollback`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					rollback_reason: reason,
					rollback_notes: 'Rollback executed via dashboard'
				})
			});

			if (response.ok) {
				await loadDeployments();
				alert('배포가 롤백되었습니다');
			} else {
				alert('배포 롤백 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('롤백 중 오류: ' + e.message);
		}
	}

	async function deleteDeployment(id, title) {
		if (!confirm(`정말로 "${title}" 배포를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;

		try {
			const response = await fetch(`/api/deployments/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadDeployments();
				alert('배포가 삭제되었습니다');
			} else {
				const errorData = await response.json();
				alert('배포 삭제 중 오류가 발생했습니다: ' + (errorData.error || '알 수 없는 오류'));
			}
		} catch (e) {
			alert('배포 삭제 중 오류: ' + e.message);
		}
	}

	function getStatusColor(status) {
		const colors = {
			'planned': 'bg-blue-100 text-blue-800',
			'in_progress': 'bg-yellow-100 text-yellow-800',
			'completed': 'bg-green-100 text-green-800',
			'failed': 'bg-red-100 text-red-800',
			'rolled_back': 'bg-purple-100 text-purple-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getDeploymentTypeColor(type) {
		const colors = {
			'blue_green': 'bg-blue-50 border-blue-200',
			'rolling': 'bg-green-50 border-green-200',
			'canary': 'bg-yellow-50 border-yellow-200',
			'hotfix': 'bg-red-50 border-red-200'
		};
		return colors[type] || 'bg-gray-50 border-gray-200';
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString('ko-KR');
	}

	// Filtering and sorting
	$: filteredDeployments = deployments.filter(deployment => {
		const statusMatch = !filterStatus || deployment.status === filterStatus;
		const envMatch = !filterEnvironment || deployment.environment_id === filterEnvironment;
		return statusMatch && envMatch;
	});

	$: sortedDeployments = filteredDeployments.sort((a, b) => {
		switch (sortBy) {
			case 'created':
				return new Date(b.created_at) - new Date(a.created_at);
			case 'status':
				return a.status.localeCompare(b.status);
			case 'scheduled':
			default:
				const aDate = new Date(a.scheduled_at || a.created_at);
				const bDate = new Date(b.scheduled_at || b.created_at);
				return bDate - aDate;
		}
	});
</script>

<svelte:head>
	<title>배포 센터 - WorkflowMCP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold text-gray-900">배포 센터</h1>
		<button 
			class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
			on:click={() => window.location.href = '/deployments/create'}
		>
			새 배포 생성
		</button>
	</div>

	<!-- Filters and Sort -->
	<div class="bg-white p-4 rounded-lg shadow mb-6">
		<div class="flex flex-wrap gap-4 items-center">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">정렬</label>
				<select bind:value={sortBy} class="border border-gray-300 rounded-md px-3 py-2">
					<option value="scheduled">예정 시간순</option>
					<option value="created">생성 시간순</option>
					<option value="status">상태순</option>
				</select>
			</div>
			
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">상태 필터</label>
				<select bind:value={filterStatus} class="border border-gray-300 rounded-md px-3 py-2">
					<option value="">전체</option>
					<option value="planned">계획됨</option>
					<option value="in_progress">진행중</option>
					<option value="completed">완료</option>
					<option value="failed">실패</option>
					<option value="rolled_back">롤백됨</option>
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">환경 필터</label>
				<select bind:value={filterEnvironment} class="border border-gray-300 rounded-md px-3 py-2">
					<option value="">전체 환경</option>
					{#each environments as env}
						<option value={env.id}>{env.name} ({env.environment_type})</option>
					{/each}
				</select>
			</div>

			<button 
				on:click={loadDeployments}
				class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
			>
				새로고침
			</button>
		</div>
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
	{:else}
		<div class="grid gap-6">
			{#each sortedDeployments as deployment (deployment.id)}
				<div class="bg-white rounded-lg shadow border {getDeploymentTypeColor(deployment.deployment_type)} p-6">
					<div class="flex justify-between items-start mb-4">
						<div>
							<h3 class="text-xl font-semibold text-gray-900">{deployment.name || deployment.title}</h3>
							<p class="text-gray-600 mt-1">{deployment.description}</p>
						</div>
						
						<div class="flex items-center gap-2">
							<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(deployment.status)}">
								{deployment.status.replace('_', ' ')}
							</span>
							<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
								{(deployment.deployment_type || deployment.deploy_strategy || 'rolling').replace('_', ' ')}
							</span>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
						<div>
							<span class="font-semibold text-gray-700">버전:</span>
							<span class="ml-2">{deployment.version}</span>
						</div>
						<div>
							<span class="font-semibold text-gray-700">환경:</span>
							<span class="ml-2">
								{environments.find(e => e.id === (deployment.environment_id || deployment.environment))?.name || deployment.environment_id || deployment.environment}
							</span>
						</div>
						<div>
							<span class="font-semibold text-gray-700">예정 시간:</span>
							<span class="ml-2">{formatDate(deployment.scheduled_at || deployment.started_at)}</span>
						</div>
					</div>

					{#if deployment.executed_at}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
							<div>
								<span class="font-semibold">실행 시간:</span>
								<span class="ml-2">{formatDate(deployment.executed_at)}</span>
							</div>
							{#if deployment.actual_duration}
								<div>
									<span class="font-semibold">실행 시간:</span>
									<span class="ml-2">{deployment.actual_duration}분</span>
								</div>
							{/if}
						</div>
					{/if}

					{#if deployment.tags && deployment.tags.length > 0}
						<div class="mb-4">
							<span class="font-semibold text-gray-700">태그:</span>
							{#each Array.isArray(deployment.tags) ? deployment.tags : JSON.parse(deployment.tags || '[]') as tag}
								<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{tag}</span>
							{/each}
						</div>
					{/if}

					<div class="flex justify-end gap-2">
						{#if deployment.status === 'planned'}
							<button 
								on:click={() => executeDeployment(deployment.id)}
								class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
							>
								배포 실행
							</button>
						{/if}

						{#if deployment.status === 'completed'}
							<button 
								on:click={() => rollbackDeployment(deployment.id)}
								class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
							>
								롤백
							</button>
						{/if}

						<button 
							on:click={() => window.location.href = `/deployments/${deployment.id}`}
							class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
						>
							상세보기
						</button>

						<button 
							on:click={() => deleteDeployment(deployment.id, deployment.name || deployment.title)}
							class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
							title="배포 삭제"
						>
							삭제
						</button>
					</div>
				</div>
			{:else}
				<div class="bg-gray-50 rounded-lg p-8 text-center">
					<p class="text-gray-500">배포가 없습니다.</p>
					<button 
						class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
						on:click={() => window.location.href = '/deployments/create'}
					>
						첫 번째 배포 생성하기
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>