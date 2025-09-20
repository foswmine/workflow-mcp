<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import StatCard from '$lib/components/StatCard.svelte';
	import TaskActivityChart from '$lib/components/TaskActivityChart.svelte';
	import PriorityChart from '$lib/components/PriorityChart.svelte';

	let dashboardData = {
		stats: {
			total_prds: 0,
			total_tasks: 0,
			total_plans: 0,
			completed_tasks: 0,
			in_progress_tasks: 0,
			pending_tasks: 0,
			active_prds: 0,
			active_plans: 0
		},
		activity: [],
		priority: []
	};

	let loading = true;
	let error = null;

	onMount(async () => {
		try {
			const response = await fetch('/api/dashboard');
			if (response.ok) {
				dashboardData = await response.json();
			} else {
				error = 'Failed to load dashboard data';
			}
		} catch (e) {
			error = 'Error loading dashboard: ' + e.message;
		} finally {
			loading = false;
		}
	});

	$: completionRate = dashboardData.stats.total_tasks > 0 
		? (dashboardData.stats.completed_tasks / dashboardData.stats.total_tasks * 100).toFixed(1)
		: 0;
</script>

<svelte:head>
	<title>WorkflowMCP Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">{$_('dashboard.title')}</h1>
		<div class="text-sm text-gray-500">
			{$_('dashboard.last_updated')} {new Date().toLocaleString('ko-KR')}
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{:else}
		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<StatCard
				title={$_('dashboard.total_prds')}
				value={dashboardData.stats.total_prds}
				subtext="{dashboardData.stats.active_prds}{$_('dashboard.active_suffix')}"
				icon="📋"
				color="blue"
			/>
			<StatCard
				title={$_('dashboard.total_tasks')}
				value={dashboardData.stats.total_tasks}
				subtext="{completionRate}{$_('dashboard.completion_suffix')}"
				icon="✅"
				color="green"
			/>
			<StatCard
				title={$_('dashboard.in_progress_tasks')}
				value={dashboardData.stats.in_progress_tasks}
				subtext="{dashboardData.stats.pending_tasks}{$_('dashboard.pending_suffix')}"
				icon="🔄"
				color="yellow"
			/>
			<StatCard
				title={$_('dashboard.total_plans')}
				value={dashboardData.stats.total_plans}
				subtext="{dashboardData.stats.active_plans}{$_('dashboard.active_suffix')}"
				icon="📅"
				color="purple"
			/>
		</div>

		<!-- Charts Section -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Task Activity Chart -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">{$_('dashboard.task_activity_trend')}</h3>
				<TaskActivityChart data={dashboardData.activity} />
			</div>

			<!-- Priority Distribution -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">{$_('dashboard.priority_distribution')}</h3>
				<PriorityChart data={dashboardData.priority} />
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="card">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">{$_('dashboard.quick_actions')}</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<a href="/prds/new" class="btn btn-primary text-center">
					{$_('dashboard.new_prd')}
				</a>
				<a href="/tasks/new" class="btn btn-success text-center">
					{$_('dashboard.new_task')}
				</a>
				<a href="/plans/new" class="btn btn-secondary text-center">
					{$_('dashboard.new_plan')}
				</a>
			</div>
		</div>

		<!-- Recent Activity -->
		{#if dashboardData.activity.length > 0}
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">{$_('dashboard.recent_activity')}</h3>
				<div class="space-y-2">
					{#each dashboardData.activity.slice(-7) as activity}
						<div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
							<div class="text-sm text-gray-600">
								{new Date(activity.date).toLocaleDateString('ko-KR')}
							</div>
							<div class="flex space-x-4 text-sm">
								<span class="text-blue-600">{$_('dashboard.tasks_count')} {activity.task_count}{$_('dashboard.tasks_suffix')}</span>
								<span class="text-green-600">{$_('dashboard.completed_count')} {activity.completed_count}{$_('dashboard.tasks_suffix')}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>