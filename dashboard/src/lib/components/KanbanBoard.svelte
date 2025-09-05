<script>
	import { createEventDispatcher } from 'svelte';
	import KanbanColumn from './KanbanColumn.svelte';
	
	export let tasks = [];
	export let prds = [];
	
	const dispatch = createEventDispatcher();

	const columns = [
		{ id: 'pending', title: '대기중', color: 'bg-gray-50 border-gray-200' },
		{ id: 'in_progress', title: '진행중', color: 'bg-blue-50 border-blue-200' },
		{ id: 'completed', title: '완료', color: 'bg-green-50 border-green-200' }
	];

	// Group tasks by status
	$: tasksByStatus = tasks.reduce((acc, task) => {
		const status = task.status || 'pending';
		if (!acc[status]) acc[status] = [];
		acc[status].push(task);
		return acc;
	}, {});

	// Create PRD lookup for task titles
	$: prdLookup = prds.reduce((acc, prd) => {
		acc[prd.id] = prd.title;
		return acc;
	}, {});

	function handleTaskMove(event) {
		const { taskId, newStatus } = event.detail;
		dispatch('updateStatus', { taskId, status: newStatus });
	}

	function handleDragStart(event, task) {
		event.dataTransfer.setData('text/plain', task.id);
		event.dataTransfer.effectAllowed = 'move';
	}

	function handleDrop(event, columnId) {
		event.preventDefault();
		const taskId = parseInt(event.dataTransfer.getData('text/plain'));
		const task = tasks.find(t => t.id === taskId);
		
		if (task && task.status !== columnId) {
			dispatch('updateStatus', { taskId, status: columnId });
		}
	}

	function handleDragOver(event) {
		event.preventDefault();
	}
</script>

<div class="flex space-x-6 overflow-x-auto pb-6">
	{#each columns as column (column.id)}
		<div 
			class="flex-shrink-0 w-80"
			on:drop={(e) => handleDrop(e, column.id)}
			on:dragover={handleDragOver}
		>
			<KanbanColumn
				title={column.title}
				tasks={tasksByStatus[column.id] || []}
				{prdLookup}
				colorClass={column.color}
				on:taskMove={handleTaskMove}
				on:dragStart={handleDragStart}
			/>
		</div>
	{/each}
</div>

<style>
	:global(.kanban-card) {
		cursor: grab;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	:global(.kanban-card:hover) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	:global(.kanban-card:active) {
		cursor: grabbing;
	}
</style>