<script>
	import { createEventDispatcher } from 'svelte';
	
	export let title;
	export let tasks = [];
	export let prdLookup = {};
	export let colorClass = 'bg-gray-50 border-gray-200';
	
	const dispatch = createEventDispatcher();

	function getPriorityColor(priority) {
		switch (priority) {
			case 'critical': return 'border-l-red-800 bg-red-50';
			case 'high': return 'border-l-red-500 bg-red-50';
			case 'medium': return 'border-l-yellow-500 bg-yellow-50';
			case 'low': return 'border-l-green-500 bg-green-50';
			default: return 'border-l-gray-300 bg-white';
		}
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('ko-KR', { 
			month: 'short', 
			day: 'numeric' 
		});
	}

	function handleDragStart(event, task) {
		dispatch('dragStart', { event, task });
	}
</script>

<div class="h-full">
	<!-- Column Header -->
	<div class="border-2 border-dashed {colorClass} rounded-lg p-4 mb-4">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold text-gray-900">{title}</h3>
			<span class="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
				{tasks.length}
			</span>
		</div>
	</div>

	<!-- Task Cards -->
	<div class="space-y-3">
		{#each tasks as task (task.id)}
			<div 
				class="kanban-card card border-l-4 {getPriorityColor(task.priority)}"
				draggable="true"
				on:dragstart={(e) => handleDragStart(e, task)}
			>
				<div class="p-4">
					<div class="flex items-start justify-between mb-2">
						<h4 class="text-sm font-medium text-gray-900 line-clamp-2">
							{task.title}
						</h4>
						<div class="ml-2 flex-shrink-0">
							{#if task.priority === 'critical'}
								<span class="text-red-600">🔥</span>
							{:else if task.priority === 'high'}
								<span class="text-red-500">⚠️</span>
							{:else if task.priority === 'medium'}
								<span class="text-yellow-500">📋</span>
							{:else}
								<span class="text-green-500">📝</span>
							{/if}
						</div>
					</div>

					{#if task.description}
						<p class="text-xs text-gray-600 mb-3 line-clamp-2">
							{task.description}
						</p>
					{/if}

					<!-- PRD Reference -->
					{#if task.prd_id && prdLookup[task.prd_id]}
						<div class="mb-3">
							<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
								📋 {prdLookup[task.prd_id]}
							</span>
						</div>
					{/if}

					<!-- Tags -->
					{#if task.tags}
						{@const parsedTags = (() => {
							try {
								// tags가 이미 배열이면 그대로 사용
								if (Array.isArray(task.tags)) return task.tags;
								// 문자열이면 JSON 파싱 시도
								if (typeof task.tags === 'string') {
									// JSON 배열 형태인지 확인
									if (task.tags.startsWith('[') && task.tags.endsWith(']')) {
										return JSON.parse(task.tags);
									}
									// 쉼표로 구분된 문자열인지 확인
									return task.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
								}
								return [];
							} catch (e) {
								// JSON 파싱 실패 시 쉼표로 구분된 문자열로 처리
								if (typeof task.tags === 'string') {
									return task.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
								}
								return [];
							}
						})()}
						{#if parsedTags.length > 0}
							<div class="flex flex-wrap gap-1 mb-3">
								{#each parsedTags as tag}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
										{tag}
									</span>
								{/each}
							</div>
						{/if}
					{/if}

					<!-- Due Date -->
					{#if task.due_date}
						<div class="flex items-center text-xs text-gray-500 mb-2">
							<span class="mr-1">📅</span>
							{formatDate(task.due_date)}
						</div>
					{/if}

					<!-- Task Info -->
					<div class="flex items-center justify-between text-xs text-gray-500">
						<span>#{task.id}</span>
						<span class="capitalize priority-{task.priority}">
							{task.priority === 'critical' ? '긴급' :
							 task.priority === 'high' ? '높음' :
							 task.priority === 'medium' ? '보통' : '낮음'}
						</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>