<script>
	import { onMount } from 'svelte';
	import GanttChart from '$lib/components/GanttChart.svelte';
	
	let tasks = [];
	let plans = [];
	let loading = true;
	let error = null;
	let selectedView = 'tasks'; // 'tasks' or 'plans'

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			const [tasksResponse, plansResponse] = await Promise.all([
				fetch('/api/tasks'),
				fetch('/api/plans')
			]);

			if (tasksResponse.ok && plansResponse.ok) {
				tasks = await tasksResponse.json();
				plans = await plansResponse.json();
			} else {
				error = 'Failed to load data';
			}
		} catch (e) {
			error = 'Error loading data: ' + e.message;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>간트 차트 - WorkflowMCP Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">간트 차트</h1>
		<div class="flex items-center space-x-4">
			<!-- View Selector -->
			<div class="flex bg-gray-100 rounded-lg p-1">
				<button 
					class="px-3 py-1 text-sm rounded-md transition-colors {selectedView === 'tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
					on:click={() => selectedView = 'tasks'}
				>
					작업 기반
				</button>
				<button 
					class="px-3 py-1 text-sm rounded-md transition-colors {selectedView === 'plans' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
					on:click={() => selectedView = 'plans'}
				>
					계획 기반
				</button>
			</div>
			
			<button on:click={loadData} class="btn btn-secondary">
				🔄 새로고침
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center items-center h-96">
			<div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{:else}
		<!-- Chart Container -->
		<div class="card">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900">
					{selectedView === 'tasks' ? '작업별 타임라인' : '계획별 타임라인'}
				</h3>
				<div class="text-sm text-gray-500">
					총 {selectedView === 'tasks' ? tasks.length : plans.length}개 항목
				</div>
			</div>
			
			<GanttChart 
				data={selectedView === 'tasks' ? tasks : plans}
				type={selectedView}
			/>
		</div>

		<!-- Legend -->
		<div class="card">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">범례</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="flex items-center space-x-2">
					<div class="w-4 h-4 bg-gray-400 rounded"></div>
					<span class="text-sm text-gray-600">대기중</span>
				</div>
				<div class="flex items-center space-x-2">
					<div class="w-4 h-4 bg-blue-500 rounded"></div>
					<span class="text-sm text-gray-600">진행중</span>
				</div>
				<div class="flex items-center space-x-2">
					<div class="w-4 h-4 bg-green-500 rounded"></div>
					<span class="text-sm text-gray-600">완료</span>
				</div>
				<div class="flex items-center space-x-2">
					<div class="w-4 h-4 bg-red-500 rounded"></div>
					<span class="text-sm text-gray-600">지연</span>
				</div>
			</div>
		</div>
	{/if}
</div>