<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let deployment = null;
	let environments = [];
	let loading = true;
	let error = null;

	$: deploymentId = $page.params.id;

	onMount(async () => {
		await Promise.all([loadDeployment(), loadEnvironments()]);
	});

	async function loadDeployment() {
		try {
			loading = true;
			const response = await fetch(`/api/deployments/${deploymentId}`);
			if (response.ok) {
				deployment = await response.json();
			} else {
				const errorData = await response.json();
				error = errorData.error || '배포 정보를 찾을 수 없습니다';
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

	async function executeDeployment() {
		if (!confirm('이 배포를 실행하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/deployments/${deploymentId}/execute`, {
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
				await loadDeployment();
				alert('배포가 실행되었습니다');
			} else {
				alert('배포 실행 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('배포 실행 중 오류: ' + e.message);
		}
	}

	async function rollbackDeployment() {
		const reason = prompt('롤백 사유를 입력해주세요:');
		if (!reason) return;

		try {
			const response = await fetch(`/api/deployments/${deploymentId}/rollback`, {
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
				await loadDeployment();
				alert('배포가 롤백되었습니다');
			} else {
				alert('배포 롤백 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('롤백 중 오류: ' + e.message);
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

	function goBack() {
		goto('/deployments');
	}
</script>

<svelte:head>
	<title>{deployment ? `배포: ${deployment.name || deployment.title}` : '배포 상세보기'} - WorkflowMCP</title>
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
			<h1 class="text-3xl font-bold text-gray-900">배포 상세보기</h1>
		</div>
		
		{#if deployment}
			<div class="flex items-center gap-2">
				<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(deployment.status)}">
					{deployment.status.replace('_', ' ')}
				</span>
				<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
					{(deployment.deployment_type || deployment.deploy_strategy || 'rolling').replace('_', ' ')}
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
	{:else if deployment}
		<div class="bg-white rounded-lg shadow border {getDeploymentTypeColor(deployment.deployment_type)} p-8">
			<!-- Header Section -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-gray-900 mb-2">{deployment.name || deployment.title}</h2>
				<p class="text-gray-600 text-lg">{deployment.description}</p>
			</div>

			<!-- Basic Information Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				<div class="bg-gray-50 p-4 rounded-lg">
					<h3 class="font-semibold text-gray-700 mb-2">기본 정보</h3>
					<div class="space-y-2">
						<div>
							<span class="text-sm text-gray-500">버전:</span>
							<span class="ml-2 font-medium">{deployment.version}</span>
						</div>
						<div>
							<span class="text-sm text-gray-500">환경:</span>
							<span class="ml-2 font-medium">
								{environments.find(e => e.id === (deployment.environment_id || deployment.environment))?.name || deployment.environment_id || deployment.environment}
							</span>
						</div>
						<div>
							<span class="text-sm text-gray-500">배포 타입:</span>
							<span class="ml-2 font-medium">{(deployment.deployment_type || 'rolling').replace('_', ' ')}</span>
						</div>
					</div>
				</div>

				<div class="bg-gray-50 p-4 rounded-lg">
					<h3 class="font-semibold text-gray-700 mb-2">일정</h3>
					<div class="space-y-2">
						<div>
							<span class="text-sm text-gray-500">생성일:</span>
							<span class="ml-2 font-medium">{formatDate(deployment.created_at)}</span>
						</div>
						<div>
							<span class="text-sm text-gray-500">예정 시간:</span>
							<span class="ml-2 font-medium">{formatDate(deployment.scheduled_at || deployment.started_at)}</span>
						</div>
						{#if deployment.executed_at}
							<div>
								<span class="text-sm text-gray-500">실행 시간:</span>
								<span class="ml-2 font-medium">{formatDate(deployment.executed_at)}</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="bg-gray-50 p-4 rounded-lg">
					<h3 class="font-semibold text-gray-700 mb-2">상태 정보</h3>
					<div class="space-y-2">
						<div>
							<span class="text-sm text-gray-500">현재 상태:</span>
							<span class="ml-2">
								<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(deployment.status)}">
									{deployment.status.replace('_', ' ')}
								</span>
							</span>
						</div>
						{#if deployment.rollback_version}
							<div>
								<span class="text-sm text-gray-500">롤백 버전:</span>
								<span class="ml-2 font-medium">{deployment.rollback_version}</span>
							</div>
						{/if}
						<div>
							<span class="text-sm text-gray-500">마지막 업데이트:</span>
							<span class="ml-2 font-medium">{formatDate(deployment.updated_at)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Configuration Section -->
			{#if deployment.deployment_config && Object.keys(deployment.deployment_config).length > 0}
				<div class="mb-8">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">배포 설정</h3>
					<div class="bg-gray-50 p-4 rounded-lg">
						<pre class="text-sm overflow-auto">{JSON.stringify(deployment.deployment_config, null, 2)}</pre>
					</div>
				</div>
			{/if}

			<!-- Tags Section -->
			{#if deployment.tags && deployment.tags.length > 0}
				<div class="mb-8">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">태그</h3>
					<div class="flex flex-wrap gap-2">
						{#each Array.isArray(deployment.tags) ? deployment.tags : (typeof deployment.tags === 'string' ? JSON.parse(deployment.tags || '[]') : []) as tag}
							<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Notes Section -->
			{#if deployment.notes}
				<div class="mb-8">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">노트</h3>
					<div class="bg-gray-50 p-4 rounded-lg">
						<p class="whitespace-pre-wrap">{deployment.notes}</p>
					</div>
				</div>
			{/if}

			<!-- Actions Section -->
			<div class="flex justify-end gap-4 pt-6 border-t">
				{#if deployment.status === 'planned'}
					<button 
						on:click={executeDeployment}
						class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
					>
						배포 실행
					</button>
				{/if}

				{#if deployment.status === 'completed'}
					<button 
						on:click={rollbackDeployment}
						class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
					>
						롤백
					</button>
				{/if}

				<button 
					on:click={goBack}
					class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
				>
					목록으로
				</button>
			</div>
		</div>
	{/if}
</div>