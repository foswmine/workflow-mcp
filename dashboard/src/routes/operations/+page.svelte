<script>
	import { onMount } from 'svelte';

	let incidents = [];
	let systemHealth = [];
	let performanceMetrics = [];
	let alertRules = [];
	let loading = true;
	let error = null;
	let selectedTimeRange = '24h';
	let showIncidentModal = false;
	let newIncident = {
		title: '',
		description: '',
		severity: 'medium',
		incident_type: 'outage'
	};

	onMount(async () => {
		await loadOperationalData();
	});

	async function loadOperationalData() {
		try {
			loading = true;
			await Promise.all([
				loadIncidents(),
				loadSystemHealth(),
				loadPerformanceMetrics(),
				loadAlertRules()
			]);
		} catch (e) {
			error = '운영 데이터 로딩 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function loadIncidents() {
		try {
			const response = await fetch('/api/incidents?sort_by=created_desc&limit=10');
			if (response.ok) {
				const data = await response.json();
				incidents = Array.isArray(data) ? data : [];
			}
		} catch (e) {
			console.error('인시던트 로딩 중 오류:', e);
			incidents = [];
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
			systemHealth = [];
		}
	}

	async function loadPerformanceMetrics() {
		try {
			const response = await fetch(`/api/performance-metrics?time_range=${selectedTimeRange}`);
			if (response.ok) {
				const metricsData = await response.json();
				performanceMetrics = metricsData.metrics || [];
			}
		} catch (e) {
			console.error('성능 메트릭 로딩 중 오류:', e);
			performanceMetrics = [];
		}
	}

	async function loadAlertRules() {
		try {
			const response = await fetch('/api/alert-rules');
			if (response.ok) {
				const data = await response.json();
				alertRules = Array.isArray(data) ? data : (data.alert_rules || []);
			}
		} catch (e) {
			console.error('알림 규칙 로딩 중 오류:', e);
			alertRules = [];
		}
	}

	function createIncident() {
		showIncidentModal = true;
		// 폼 초기화
		newIncident = {
			title: '',
			description: '',
			severity: 'medium',
			incident_type: 'outage'
		};
	}

	async function submitIncident() {
		if (!newIncident.title.trim() || !newIncident.description.trim()) {
			alert('제목과 설명을 입력해주세요.');
			return;
		}

		try {
			const response = await fetch('/api/incidents', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: newIncident.title,
					description: newIncident.description,
					severity: newIncident.severity,
					incident_type: newIncident.incident_type,
					status: 'open'
				})
			});

			if (response.ok) {
				await loadIncidents();
				showIncidentModal = false;
				alert('인시던트가 생성되었습니다');
			} else {
				alert('인시던트 생성 중 오류가 발생했습니다');
			}
		} catch (e) {
			alert('인시던트 생성 중 오류: ' + e.message);
		}
	}

	function getStatusColor(status) {
		const colors = {
			'open': 'bg-red-100 text-red-800',
			'investigating': 'bg-yellow-100 text-yellow-800',
			'identified': 'bg-blue-100 text-blue-800',
			'monitoring': 'bg-purple-100 text-purple-800',
			'resolved': 'bg-green-100 text-green-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getSeverityColor(severity) {
		const colors = {
			'critical': 'bg-red-500 text-white',
			'high': 'bg-orange-500 text-white',
			'medium': 'bg-yellow-500 text-white',
			'low': 'bg-green-500 text-white'
		};
		return colors[severity] || 'bg-gray-500 text-white';
	}

	function getHealthStatusColor(status) {
		const colors = {
			'healthy': 'text-green-600',
			'warning': 'text-yellow-600',
			'critical': 'text-red-600',
			'unknown': 'text-gray-600'
		};
		return colors[status] || 'text-gray-600';
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString('ko-KR');
	}

	function calculateUptime(percentage) {
		return percentage ? `${percentage.toFixed(2)}%` : 'N/A';
	}

	$: activeIncidents = Array.isArray(incidents) ? incidents.filter(i => i.status !== 'resolved') : [];
	$: criticalAlerts = Array.isArray(alertRules) ? alertRules.filter(a => a.severity === 'critical' && a.enabled) : [];
</script>

<svelte:head>
	<title>운영 대시보드 - WorkflowMCP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold text-gray-900">운영 대시보드</h1>
		<div class="flex gap-2">
			<button 
				on:click={createIncident}
				class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
			>
				인시던트 생성
			</button>
			<button 
				on:click={loadOperationalData}
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
		<!-- Overview Cards -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-500">활성 인시던트</h3>
				<p class="text-2xl font-bold text-red-600">{activeIncidents.length}</p>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-500">시스템 상태</h3>
				<p class="text-2xl font-bold text-green-600">
					{systemHealth.filter(h => h.status === 'healthy').length}/{systemHealth.length}
				</p>
				<p class="text-sm text-gray-500">정상 환경</p>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-500">평균 업타임</h3>
				<p class="text-2xl font-bold text-blue-600">
					{calculateUptime(systemHealth.reduce((acc, h) => acc + (h.uptime_percentage || 0), 0) / systemHealth.length)}
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-500">중요 알림 규칙</h3>
				<p class="text-2xl font-bold text-yellow-600">{criticalAlerts.length}</p>
				<p class="text-sm text-gray-500">활성화됨</p>
			</div>
		</div>

		<!-- Active Incidents -->
		<div class="bg-white rounded-lg shadow mb-8">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">활성 인시던트</h2>
			</div>
			<div class="p-6">
				{#if activeIncidents.length === 0}
					<p class="text-gray-500 text-center py-4">현재 활성 인시던트가 없습니다</p>
				{:else}
					<div class="space-y-4">
						{#each activeIncidents.slice(0, 5) as incident}
							<div class="border-l-4 border-red-400 pl-4 py-2">
								<div class="flex justify-between items-start">
									<div>
										<h3 class="font-medium text-gray-900">{incident.title}</h3>
										<p class="text-sm text-gray-600 mt-1">{incident.description}</p>
										<div class="flex items-center gap-2 mt-2">
											<span class="px-2 py-1 rounded-full text-xs font-medium {getSeverityColor(incident.severity)}">
												{incident.severity}
											</span>
											<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(incident.status)}">
												{incident.status}
											</span>
											<span class="text-xs text-gray-500">{formatDate(incident.created_at)}</span>
										</div>
									</div>
									<button 
										class="text-blue-600 hover:text-blue-800 text-sm"
										on:click={() => window.location.href = `/incidents/${incident.id}`}
									>
										상세보기
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- System Health -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-xl font-semibold text-gray-900">시스템 상태</h2>
				</div>
				<div class="p-6">
					{#if systemHealth.length === 0}
						<p class="text-gray-500 text-center py-4">시스템 상태 데이터가 없습니다</p>
					{:else}
						<div class="space-y-4">
							{#each systemHealth as health}
								<div class="flex justify-between items-center">
									<div>
										<span class="font-medium">{health.environment_id}</span>
										<div class="text-sm text-gray-500">
											업타임: {calculateUptime(health.uptime_percentage)} | 
											응답시간: {health.response_time || 'N/A'}ms
										</div>
									</div>
									<span class="font-medium {getHealthStatusColor(health.status)}">
										{health.status || 'unknown'}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex justify-between items-center">
						<h2 class="text-xl font-semibold text-gray-900">성능 메트릭</h2>
						<select bind:value={selectedTimeRange} on:change={loadPerformanceMetrics} class="border border-gray-300 rounded px-2 py-1 text-sm">
							<option value="1h">1시간</option>
							<option value="6h">6시간</option>
							<option value="24h">24시간</option>
							<option value="7d">7일</option>
							<option value="30d">30일</option>
						</select>
					</div>
				</div>
				<div class="p-6">
					{#if performanceMetrics.length === 0}
						<p class="text-gray-500 text-center py-4">성능 메트릭 데이터가 없습니다</p>
					{:else}
						<div class="space-y-3">
							{#each performanceMetrics.slice(0, 8) as metric}
								<div class="flex justify-between items-center">
									<div>
										<span class="font-medium">{metric.metric_name}</span>
										<span class="text-sm text-gray-500">({metric.environment_id})</span>
									</div>
									<span class="text-right">
										<span class="font-bold">{metric.aggregated_value?.toFixed(2) || 'N/A'}</span>
										<span class="text-sm text-gray-500 ml-1">{metric.unit || ''}</span>
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Recent Activity & Navigation -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-xl font-semibold text-gray-900">최근 활동</h2>
				</div>
				<div class="p-6">
					<div class="space-y-3">
						{#each incidents.slice(0, 5) as incident}
							<div class="flex justify-between items-center text-sm">
								<div>
									<span class="font-medium">{incident.title}</span>
									<span class="text-gray-500">- {incident.status}</span>
								</div>
								<span class="text-gray-400">{formatDate(incident.created_at)}</span>
							</div>
						{:else}
							<p class="text-gray-500 text-center py-4">최근 활동이 없습니다</p>
						{/each}
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-xl font-semibold text-gray-900">빠른 액세스</h2>
				</div>
				<div class="p-6">
					<div class="grid grid-cols-2 gap-4">
						<button 
							on:click={() => window.location.href = '/incidents'}
							class="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
						>
							<h3 class="font-medium text-gray-900">인시던트 관리</h3>
							<p class="text-sm text-gray-500 mt-1">모든 인시던트 보기</p>
						</button>
						
						<button 
							on:click={() => window.location.href = '/deployments'}
							class="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
						>
							<h3 class="font-medium text-gray-900">배포 센터</h3>
							<p class="text-sm text-gray-500 mt-1">배포 상태 확인</p>
						</button>
						
						<button 
							on:click={() => window.location.href = '/environments'}
							class="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
						>
							<h3 class="font-medium text-gray-900">환경 관리</h3>
							<p class="text-sm text-gray-500 mt-1">환경 상태 보기</p>
						</button>
						
						<button 
							on:click={() => window.location.href = '/alerts'}
							class="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
						>
							<h3 class="font-medium text-gray-900">알림 규칙</h3>
							<p class="text-sm text-gray-500 mt-1">알림 설정 관리</p>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- 인시던트 생성 모달 -->
{#if showIncidentModal}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
		<div class="flex items-center justify-between p-6 border-b border-gray-200">
			<h3 class="text-lg font-semibold text-gray-900">새 인시던트 생성</h3>
			<button
				on:click={() => showIncidentModal = false}
				class="text-gray-400 hover:text-gray-600"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
		</div>

		<div class="p-6 space-y-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					제목 *
				</label>
				<input
					type="text"
					bind:value={newIncident.title}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="인시던트 제목을 입력해주세요"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					설명 *
				</label>
				<textarea
					bind:value={newIncident.description}
					rows="4"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="인시던트 상세 설명을 입력해주세요"
				></textarea>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					심각도
				</label>
				<select
					bind:value={newIncident.severity}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="low">Low (낮음)</option>
					<option value="medium">Medium (보통)</option>
					<option value="high">High (높음)</option>
					<option value="critical">Critical (심각)</option>
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					인시던트 유형
				</label>
				<select
					bind:value={newIncident.incident_type}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="outage">Outage (장애)</option>
					<option value="performance">Performance (성능)</option>
					<option value="security">Security (보안)</option>
					<option value="data">Data (데이터)</option>
					<option value="deployment">Deployment (배포)</option>
				</select>
			</div>
		</div>

		<div class="flex justify-end gap-3 p-6 border-t border-gray-200">
			<button
				on:click={() => showIncidentModal = false}
				class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
			>
				취소
			</button>
			<button
				on:click={submitIncident}
				class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
			>
				인시던트 생성
			</button>
		</div>
	</div>
</div>
{/if}