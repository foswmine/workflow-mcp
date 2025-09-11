<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let environments = [];
	let deployments = [];
	let systemHealth = [];
	let loading = true;
	let error = null;
	let filterType = '';
	let filterStatus = '';

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			await Promise.all([
				loadEnvironments(),
				loadDeployments(),
				loadSystemHealth()
			]);
		} catch (e) {
			error = '데이터 로딩 중 오류: ' + e.message;
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

	async function loadDeployments() {
		try {
			const response = await fetch('/api/deployments');
			if (response.ok) {
				deployments = await response.json();
			}
		} catch (e) {
			console.error('배포 로딩 중 오류:', e);
		}
	}

	async function loadSystemHealth() {
		try {
			const response = await fetch('/api/system-health');
			if (response.ok) {
				const healthData = await response.json();
				systemHealth = healthData.environments || [];
			}
		} catch (e) {
			console.error('시스템 상태 로딩 중 오류:', e);
		}
	}

	function createEnvironment() {
		goto('/environments/new');
	}

	async function updateEnvironmentStatus(id, status) {
		try {
			const response = await fetch(`/api/environments/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			});

			if (response.ok) {
				await loadEnvironments();
			} else {
				alert('환경 상태 변경 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('상태 변경 중 오류: ' + e.message);
		}
	}

	async function deleteEnvironment(id, name) {
		if (!confirm(`정말로 "${name}" 환경을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;

		try {
			const response = await fetch(`/api/environments/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadEnvironments();
				alert('환경이 삭제되었습니다');
			} else {
				const errorData = await response.json();
				alert('환경 삭제 중 오류가 발생했습니다: ' + (errorData.error || '알 수 없는 오류'));
			}
		} catch (e) {
			alert('환경 삭제 중 오류: ' + e.message);
		}
	}

	function getEnvironmentTypeColor(type) {
		const colors = {
			'development': 'bg-blue-100 text-blue-800 border-blue-200',
			'staging': 'bg-yellow-100 text-yellow-800 border-yellow-200',
			'production': 'bg-red-100 text-red-800 border-red-200',
			'testing': 'bg-green-100 text-green-800 border-green-200'
		};
		return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
	}

	function getStatusColor(status) {
		const colors = {
			'active': 'bg-green-100 text-green-800',
			'inactive': 'bg-gray-100 text-gray-800',
			'maintenance': 'bg-yellow-100 text-yellow-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getHealthStatusColor(status) {
		const colors = {
			'healthy': 'text-green-600',
			'warning': 'text-yellow-600',
			'critical': 'text-red-600'
		};
		return colors[status] || 'text-gray-600';
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString('ko-KR');
	}

	function getEnvironmentHealth(envId) {
		return systemHealth.find(h => h.environment_id === envId);
	}

	function getRecentDeployments(envId) {
		return deployments
			.filter(d => d.environment_id === envId)
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
			.slice(0, 3);
	}

	function calculateUptime(percentage) {
		return percentage ? `${percentage.toFixed(1)}%` : 'N/A';
	}

	// Filtering
	$: filteredEnvironments = environments.filter(env => {
		const typeMatch = !filterType || env.environment_type === filterType;
		const statusMatch = !filterStatus || env.status === filterStatus;
		return typeMatch && statusMatch;
	});

	$: environmentTypes = [...new Set(environments.map(e => e.environment_type))];
</script>

<svelte:head>
	<title>환경 관리 - WorkflowMCP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold text-gray-900">환경 관리</h1>
		<div class="flex gap-2">
			<button 
				on:click={createEnvironment}
				class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
			>
				새 환경 생성
			</button>
			<button 
				on:click={loadData}
				class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
			>
				새로고침
			</button>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white p-4 rounded-lg shadow mb-6">
		<div class="flex flex-wrap gap-4 items-center">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">환경 유형 필터</label>
				<select bind:value={filterType} class="border border-gray-300 rounded-md px-3 py-2">
					<option value="">전체 유형</option>
					{#each environmentTypes as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>
			
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">상태 필터</label>
				<select bind:value={filterStatus} class="border border-gray-300 rounded-md px-3 py-2">
					<option value="">전체 상태</option>
					<option value="active">활성</option>
					<option value="inactive">비활성</option>
					<option value="maintenance">점검중</option>
				</select>
			</div>
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
		<!-- Environment Overview -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-500">총 환경 수</h3>
				<p class="text-2xl font-bold text-blue-600">{environments.length}</p>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-500">활성 환경</h3>
				<p class="text-2xl font-bold text-green-600">
					{environments.filter(e => e.status === 'active').length}
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-500">프로덕션 환경</h3>
				<p class="text-2xl font-bold text-red-600">
					{environments.filter(e => e.environment_type === 'production').length}
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-500">점검중</h3>
				<p class="text-2xl font-bold text-yellow-600">
					{environments.filter(e => e.status === 'maintenance').length}
				</p>
			</div>
		</div>

		<!-- Environments List -->
		<div class="grid gap-6">
			{#each filteredEnvironments as environment (environment.id)}
				{@const health = getEnvironmentHealth(environment.id)}
				{@const recentDeploys = getRecentDeployments(environment.id)}
				
				<div class="bg-white rounded-lg shadow border-l-4 {getEnvironmentTypeColor(environment.environment_type).split(' ')[2]} p-6">
					<div class="flex justify-between items-start mb-4">
						<div>
							<div class="flex items-center gap-3 mb-2">
								<h3 class="text-xl font-semibold text-gray-900">{environment.name}</h3>
								<span class="px-3 py-1 rounded-full text-sm font-medium {getEnvironmentTypeColor(environment.environment_type)}">
									{environment.environment_type}
								</span>
								<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(environment.status)}">
									{environment.status}
								</span>
							</div>
							{#if environment.description}
								<p class="text-gray-600">{environment.description}</p>
							{/if}
							{#if environment.url}
								<a href={environment.url} target="_blank" rel="noopener" 
								   class="text-blue-600 hover:text-blue-800 text-sm">
									{environment.url} ↗
								</a>
							{/if}
						</div>
						
						<div class="flex flex-col items-end gap-2">
							{#if health}
								<div class="text-right">
									<div class="font-medium {getHealthStatusColor(health.status)}">
										{health.status || 'unknown'}
									</div>
									<div class="text-sm text-gray-500">
										업타임: {calculateUptime(health.uptime_percentage)}
									</div>
									{#if health.response_time}
										<div class="text-sm text-gray-500">
											응답시간: {health.response_time}ms
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					{#if environment.tags && environment.tags.length > 0}
						<div class="mb-4">
							<span class="font-semibold text-gray-700">태그:</span>
							{#each Array.isArray(environment.tags) ? environment.tags : JSON.parse(environment.tags || '[]') as tag}
								<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{tag}</span>
							{/each}
						</div>
					{/if}

					<!-- Recent Deployments -->
					{#if recentDeploys.length > 0}
						<div class="mb-4">
							<h4 class="font-semibold text-gray-700 mb-2">최근 배포</h4>
							<div class="space-y-2">
								{#each recentDeploys as deploy}
									<div class="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
										<div>
											<span class="font-medium">{deploy.title}</span>
											<span class="text-gray-500">- {deploy.version}</span>
										</div>
										<div class="text-right">
											<div class="px-2 py-1 rounded text-xs {getStatusColor(deploy.status)}">
												{deploy.status}
											</div>
											<div class="text-gray-500 text-xs">
												{formatDate(deploy.created_at)}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="flex justify-between items-center text-sm text-gray-500">
						<div>
							생성: {formatDate(environment.created_at)} | 
							수정: {formatDate(environment.updated_at)}
						</div>
						<div class="flex gap-2">
							{#if environment.status === 'active'}
								<button 
									on:click={() => updateEnvironmentStatus(environment.id, 'maintenance')}
									class="text-yellow-600 hover:text-yellow-800"
								>
									점검 모드
								</button>
							{:else if environment.status === 'maintenance'}
								<button 
									on:click={() => updateEnvironmentStatus(environment.id, 'active')}
									class="text-green-600 hover:text-green-800"
								>
									활성화
								</button>
							{/if}
							
							<button 
								on:click={() => window.location.href = `/environments/${environment.id}`}
								class="text-blue-600 hover:text-blue-800"
							>
								상세보기
							</button>

							<button 
								on:click={() => deleteEnvironment(environment.id, environment.name)}
								class="text-red-600 hover:text-red-800"
								title="환경 삭제"
							>
								삭제
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="bg-gray-50 rounded-lg p-8 text-center">
					<p class="text-gray-500">환경이 없습니다.</p>
					<button 
						class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
						on:click={createEnvironment}
					>
						첫 번째 환경 생성하기
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>