<script>
	import { onMount } from 'svelte';
	import DatabaseTable from '$lib/components/DatabaseTable.svelte';
	
	let selectedTable = 'prds';
	let tables = {
		prds: { name: 'PRDs', data: [], columns: [] },
		tasks: { name: '작업', data: [], columns: [] },
		plans: { name: '계획', data: [], columns: [] }
	};
	
	let loading = false;
	let error = null;

	const tableSchemas = {
		prds: [
			{ name: 'id', label: 'ID', type: 'text', readonly: true },
			{ name: 'title', label: '제목', type: 'text' },
			{ name: 'description', label: '설명', type: 'textarea' },
			{ name: 'requirements', label: '요구사항', type: 'json-array' },
			{ name: 'priority', label: '우선순위', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
			{ name: 'status', label: '상태', type: 'select', options: ['draft', 'active', 'completed', 'cancelled'] },
			{ name: 'created_at', label: '생성일', type: 'datetime', readonly: true },
			{ name: 'updated_at', label: '수정일', type: 'datetime', readonly: true }
		],
		tasks: [
			{ name: 'id', label: 'ID', type: 'text', readonly: true },
			{ name: 'title', label: '제목', type: 'text' },
			{ name: 'description', label: '설명', type: 'textarea' },
			{ name: 'status', label: '상태', type: 'select', options: ['pending', 'in_progress', 'completed', 'cancelled'] },
			{ name: 'priority', label: '우선순위', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
			{ name: 'assignee', label: '담당자', type: 'text' },
			{ name: 'estimated_hours', label: '예상시간', type: 'number' },
			{ name: 'due_date', label: '마감일', type: 'date' },
			{ name: 'plan_id', label: '계획 ID', type: 'text' },
			{ name: 'created_at', label: '생성일', type: 'datetime', readonly: true },
			{ name: 'updated_at', label: '수정일', type: 'datetime', readonly: true }
		],
		plans: [
			{ name: 'id', label: 'ID', type: 'text', readonly: true },
			{ name: 'title', label: '제목', type: 'text' },
			{ name: 'description', label: '설명', type: 'textarea' },
			{ name: 'milestones', label: '마일스톤', type: 'json-array' },
			{ name: 'status', label: '상태', type: 'select', options: ['draft', 'active', 'completed', 'cancelled'] },
			{ name: 'start_date', label: '시작일', type: 'date' },
			{ name: 'end_date', label: '종료일', type: 'date' },
			{ name: 'prd_id', label: 'PRD ID', type: 'text' },
			{ name: 'progress', label: '진행률', type: 'json' },
			{ name: 'created_at', label: '생성일', type: 'datetime', readonly: true },
			{ name: 'updated_at', label: '수정일', type: 'datetime', readonly: true }
		]
	};

	onMount(() => {
		loadTableData();
	});

	async function loadTableData() {
		loading = true;
		error = null;
		
		try {
			const responses = await Promise.all([
				fetch('/api/prds'),
				fetch('/api/tasks'),
				fetch('/api/plans')
			]);

			const [prdsData, tasksData, plansData] = await Promise.all(
				responses.map(r => r.json())
			);

			tables.prds.data = prdsData;
			tables.prds.columns = tableSchemas.prds;
			
			tables.tasks.data = tasksData;
			tables.tasks.columns = tableSchemas.tasks;
			
			tables.plans.data = plansData;
			tables.plans.columns = tableSchemas.plans;
		} catch (e) {
			error = 'Error loading data: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function handleSave(event) {
		const { table, item, isNew } = event.detail;
		
		try {
			const url = isNew ? `/api/${table}` : `/api/${table}/${item.id}`;
			const method = isNew ? 'POST' : 'PUT';
			
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(item)
			});

			if (response.ok) {
				// Reload data to reflect changes
				await loadTableData();
			} else {
				throw new Error(`Failed to ${isNew ? 'create' : 'update'} ${table} item`);
			}
		} catch (e) {
			error = `Error saving ${table}: ` + e.message;
		}
	}

	async function handleDelete(event) {
		const { table, id } = event.detail;
		
		if (!confirm('정말로 삭제하시겠습니까?')) {
			return;
		}
		
		try {
			const response = await fetch(`/api/${table}/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Reload data to reflect changes
				await loadTableData();
			} else {
				throw new Error(`Failed to delete ${table} item`);
			}
		} catch (e) {
			error = `Error deleting ${table}: ` + e.message;
		}
	}
</script>

<svelte:head>
	<title>데이터베이스 관리 - WorkflowMCP Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">데이터베이스 관리</h1>
		<button on:click={loadTableData} class="btn btn-secondary">
			🔄 새로고침
		</button>
	</div>

	<!-- Table Selection -->
	<div class="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
		{#each Object.entries(tables) as [key, table]}
			<button
				class="px-4 py-2 text-sm rounded-md transition-colors {selectedTable === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
				on:click={() => selectedTable = key}
			>
				{table.name} ({table.data.length})
			</button>
		{/each}
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
		</div>
	{:else}
		<DatabaseTable
			tableName={selectedTable}
			data={tables[selectedTable].data}
			columns={tables[selectedTable].columns}
			on:save={handleSave}
			on:delete={handleDelete}
		/>
	{/if}
</div>