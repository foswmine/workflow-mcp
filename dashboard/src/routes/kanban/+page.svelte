<script>
	import { onMount } from 'svelte';
	import KanbanBoard from '$lib/components/KanbanBoard.svelte';
	
	let tasks = [];
	let prds = [];
	let loading = true;
	let error = null;

	onMount(async () => {
		try {
			const [tasksResponse, prdsResponse] = await Promise.all([
				fetch('/api/tasks'),
				fetch('/api/prds')
			]);

			if (tasksResponse.ok && prdsResponse.ok) {
				tasks = await tasksResponse.json();
				prds = await prdsResponse.json();
			} else {
				error = 'Failed to load data';
			}
		} catch (e) {
			error = 'Error loading data: ' + e.message;
		} finally {
			loading = false;
		}
	});

	async function updateTaskStatus(taskId, newStatus) {
		try {
			const response = await fetch(`/api/tasks/${taskId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				// Update local state
				tasks = tasks.map(task => 
					task.id === taskId ? { ...task, status: newStatus } : task
				);
			} else {
				throw new Error('Failed to update task status');
			}
		} catch (e) {
			console.error('Error updating task:', e);
			error = 'Failed to update task status';
		}
	}
</script>

<svelte:head>
	<title>칸반 보드 - WorkflowMCP Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">칸반 보드</h1>
		<div class="flex space-x-4">
			<a href="/tasks/new" class="btn btn-primary">새 작업 추가</a>
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
		<KanbanBoard {tasks} {prds} on:updateStatus={(e) => updateTaskStatus(e.detail.taskId, e.detail.status)} />
	{/if}
</div>