<script>
	import { onMount } from 'svelte';
	import NetworkGraph from '$lib/components/NetworkGraph.svelte';

	let networkComponent;
	let data = { nodes: [], edges: [] };
	let projects = [];
	let stats = {};
	let loading = true;
	let error = null;

	// Filter states
	let selectedTypes = ['prd', 'design', 'task', 'test'];
	let selectedProject = null;
	let searchQuery = '';
	let showFilters = true;
	let selectedLayout = 'physics';

	// Detail panel
	let selectedNode = null;
	let showDetailPanel = false;

	// Load data from API
	async function loadData() {
		try {
			loading = true;
			error = null;

			const response = await fetch('/api/relationships');
			const result = await response.json();

			if (response.ok) {
				data = { nodes: result.nodes, edges: result.edges };
				projects = result.projects || [];
				stats = result.stats || {};
			} else {
				error = result.error || 'Failed to load relationship data';
				data = { nodes: [], edges: [] };
			}
		} catch (e) {
			error = 'Network error: ' + e.message;
			data = { nodes: [], edges: [] };
		} finally {
			loading = false;
		}
	}

	// Handle type filter changes
	function toggleType(type) {
		if (selectedTypes.includes(type)) {
			selectedTypes = selectedTypes.filter(t => t !== type);
		} else {
			selectedTypes = [...selectedTypes, type];
		}
	}

	// Handle search
	function handleSearch() {
		if (!searchQuery.trim() || !networkComponent) return;

		const matchingNodes = data.nodes.filter(node => 
			node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
			node.type.toLowerCase().includes(searchQuery.toLowerCase())
		);

		if (matchingNodes.length > 0) {
			networkComponent.focusNode(matchingNodes[0].id);
		}
	}

	// Handle node selection
	function handleNodeSelected(event) {
		selectedNode = event.detail;
		showDetailPanel = true;
	}

	// Layout controls
	function changeLayout(layout) {
		selectedLayout = layout;
		if (networkComponent) {
			networkComponent.setLayout(layout);
		}
	}

	// Network controls
	function fitNetwork() {
		if (networkComponent) {
			networkComponent.fitNetwork();
		}
	}

	// Get type label in Korean
	function getTypeLabel(type) {
		const labels = {
			prd: 'PRD',
			design: '설계',
			task: '작업',
			test: '테스트'
		};
		return labels[type] || type;
	}

	// Get status color
	function getStatusColor(status) {
		switch (status) {
			case 'completed':
			case 'done':
				return 'text-green-600 bg-green-50';
			case 'in_progress':
			case 'in-progress':
				return 'text-blue-600 bg-blue-50';
			case 'pending':
				return 'text-yellow-600 bg-yellow-50';
			case 'blocked':
				return 'text-red-600 bg-red-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>관계도 - WorkflowMCP Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">프로젝트 관계도</h1>
			<p class="text-gray-600 mt-1">PRD, 설계, 작업, 테스트 간의 관계를 시각화합니다</p>
		</div>
		
		<div class="flex items-center space-x-2">
			<button 
				on:click={() => showFilters = !showFilters}
				class="btn btn-secondary"
			>
				{showFilters ? '필터 숨기기' : '필터 보기'}
			</button>
			<button on:click={loadData} class="btn btn-secondary" disabled={loading}>
				🔄 새로고침
			</button>
		</div>
	</div>

	<!-- Statistics -->
	{#if stats && Object.keys(stats).length > 0}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="stat-card">
				<div class="stat-number">{stats.total_nodes || 0}</div>
				<div class="stat-label">전체 노드</div>
			</div>
			<div class="stat-card">
				<div class="stat-number">{stats.total_edges || 0}</div>
				<div class="stat-label">전체 관계</div>
			</div>
			<div class="stat-card">
				<div class="stat-number">{stats.connected_prds || 0}/{stats.total_prds || 0}</div>
				<div class="stat-label">연결된 PRD</div>
			</div>
			<div class="stat-card">
				<div class="stat-number">{stats.connected_tasks || 0}/{stats.total_tasks || 0}</div>
				<div class="stat-label">연결된 작업</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
		<!-- Filters Panel -->
		{#if showFilters}
			<div class="lg:col-span-1">
				<div class="card space-y-6">
					<h3 class="text-lg font-semibold text-gray-900">필터 및 컨트롤</h3>
					
					<!-- Search -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">검색</label>
						<div class="flex space-x-2">
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="노드명 검색..."
								class="form-input flex-1"
								on:keydown={(e) => e.key === 'Enter' && handleSearch()}
							/>
							<button 
								on:click={handleSearch} 
								class="btn btn-primary px-3"
								disabled={!searchQuery.trim()}
							>
								🔍
							</button>
						</div>
					</div>

					<!-- Type Filters -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">표시할 타입</label>
						<div class="space-y-2">
							{#each ['prd', 'design', 'task', 'test'] as type}
								<label class="flex items-center">
									<input
										type="checkbox"
										checked={selectedTypes.includes(type)}
										on:change={() => toggleType(type)}
										class="mr-2"
									/>
									<span class="type-badge type-{type}">
										{getTypeLabel(type)}
									</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Project Filter -->
					{#if projects.length > 0}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">프로젝트</label>
							<select bind:value={selectedProject} class="form-select w-full">
								<option value={null}>모든 프로젝트</option>
								{#each projects as project}
									<option value={project.id}>{project.name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Layout Controls -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">레이아웃</label>
						<div class="space-y-2">
							<button 
								class="w-full btn {selectedLayout === 'physics' ? 'btn-primary' : 'btn-secondary'}"
								on:click={() => changeLayout('physics')}
							>
								물리 시뮬레이션
							</button>
							<button 
								class="w-full btn {selectedLayout === 'hierarchical' ? 'btn-primary' : 'btn-secondary'}"
								on:click={() => changeLayout('hierarchical')}
							>
								계층형
							</button>
						</div>
					</div>

					<!-- Network Controls -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">뷰 컨트롤</label>
						<button 
							on:click={fitNetwork}
							class="w-full btn btn-secondary"
						>
							🎯 전체 보기
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Network Graph -->
		<div class="{showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}">
			{#if loading}
				<div class="flex justify-center items-center h-96">
					<div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
				</div>
			{:else if error}
				<div class="bg-red-50 border border-red-200 rounded-md p-4">
					<div class="text-red-800">{error}</div>
					<button 
						class="mt-2 text-sm text-red-600 hover:text-red-800"
						on:click={loadData}
					>
						다시 시도
					</button>
				</div>
			{:else}
				<div class="card p-0 overflow-hidden">
					<NetworkGraph 
						bind:this={networkComponent}
						{data}
						{selectedTypes}
						{selectedProject}
						on:nodeSelected={handleNodeSelected}
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Detail Panel Modal -->
	{#if showDetailPanel && selectedNode}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-gray-900">상세 정보</h3>
					<button 
						on:click={() => showDetailPanel = false}
						class="text-gray-400 hover:text-gray-600"
					>
						✕
					</button>
				</div>
				
				<div class="space-y-4">
					<div>
						<div class="type-badge type-{selectedNode.type} mb-2">
							{getTypeLabel(selectedNode.type)}
						</div>
						<h4 class="font-medium text-gray-900">{selectedNode.label}</h4>
					</div>
					
					{#if selectedNode.status}
						<div>
							<span class="text-sm text-gray-500">상태:</span>
							<span class="ml-2 px-2 py-1 text-xs rounded-full {getStatusColor(selectedNode.status)}">
								{selectedNode.status}
							</span>
						</div>
					{/if}
					
					<div>
						<span class="text-sm text-gray-500">ID:</span>
						<span class="ml-2 font-mono text-sm">{selectedNode.entity_id}</span>
					</div>
				</div>
				
				<div class="mt-6 flex justify-end space-x-2">
					<button 
						on:click={() => showDetailPanel = false}
						class="btn btn-secondary"
					>
						닫기
					</button>
					<a 
						href="/{selectedNode.type}s/{selectedNode.entity_id}" 
						class="btn btn-primary"
					>
						상세보기
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.stat-card {
		@apply bg-white rounded-lg p-4 shadow-sm border;
	}
	
	.stat-number {
		@apply text-2xl font-bold text-gray-900;
	}
	
	.stat-label {
		@apply text-sm text-gray-500 mt-1;
	}

	.type-badge {
		@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
	}
	
	.type-prd {
		@apply bg-blue-100 text-blue-800;
	}
	
	.type-design {
		@apply bg-red-100 text-red-800;
	}
	
	.type-task {
		@apply bg-green-100 text-green-800;
	}
	
	.type-test {
		@apply bg-yellow-100 text-yellow-800;
	}
</style>