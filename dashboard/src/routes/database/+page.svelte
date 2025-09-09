<script>
	import { onMount } from 'svelte';
	import DatabaseTable from '$lib/components/DatabaseTable.svelte';
	
	let selectedTable = 'projects';
	let tables = {
		projects: { name: '프로젝트', data: [], columns: [] },
		prds: { name: 'PRDs', data: [], columns: [] },
		designs: { name: '설계', data: [], columns: [] },
		tasks: { name: '작업', data: [], columns: [] },
		tests: { name: '테스트', data: [], columns: [] }
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
			{ name: 'estimatedHours', label: '예상시간', type: 'number' },
			{ name: 'dueDate', label: '마감일', type: 'date' },
			{ name: 'createdAt', label: '생성일', type: 'datetime', readonly: true },
			{ name: 'updatedAt', label: '수정일', type: 'datetime', readonly: true }
		],
		projects: [
			{ name: 'id', label: 'ID', type: 'text', readonly: true },
			{ name: 'name', label: '이름', type: 'text' },
			{ name: 'description', label: '설명', type: 'textarea' },
			{ name: 'status', label: '상태', type: 'select', options: ['active', 'inactive', 'completed', 'cancelled'] },
			{ name: 'start_date', label: '시작일', type: 'date' },
			{ name: 'end_date', label: '종료일', type: 'date' },
			{ name: 'timeline', label: '타임라인', type: 'json' },
			{ name: 'created_at', label: '생성일', type: 'datetime', readonly: true },
			{ name: 'updated_at', label: '수정일', type: 'datetime', readonly: true }
		],
		designs: [
			{ name: 'id', label: 'ID', type: 'text', readonly: true },
			{ name: 'title', label: '제목', type: 'text' },
			{ name: 'description', label: '설명', type: 'textarea' },
			{ name: 'design_type', label: '설계 유형', type: 'select', options: ['system', 'architecture', 'ui_ux', 'database', 'api'] },
			{ name: 'status', label: '상태', type: 'select', options: ['draft', 'review', 'approved', 'implemented'] },
			{ name: 'priority', label: '우선순위', type: 'select', options: ['Low', 'Medium', 'High'] },
			{ name: 'details', label: '세부사항', type: 'textarea' },
			{ name: 'requirement_id', label: '요구사항 ID', type: 'text' },
			{ name: 'created_at', label: '생성일', type: 'datetime', readonly: true },
			{ name: 'updated_at', label: '수정일', type: 'datetime', readonly: true }
		],
		tests: [
			{ name: 'id', label: 'ID', type: 'text', readonly: true },
			{ name: 'title', label: '제목', type: 'text' },
			{ name: 'description', label: '설명', type: 'textarea' },
			{ name: 'type', label: '테스트 유형', type: 'select', options: ['unit', 'integration', 'system', 'acceptance', 'regression'] },
			{ name: 'status', label: '상태', type: 'select', options: ['draft', 'ready', 'active', 'deprecated'] },
			{ name: 'priority', label: '우선순위', type: 'select', options: ['Low', 'Medium', 'High'] },
			{ name: 'complexity', label: '복잡도', type: 'select', options: ['Low', 'Medium', 'High'] },
			{ name: 'automation_status', label: '자동화 상태', type: 'select', options: ['manual', 'automated', 'semi_automated'] },
			{ name: 'preconditions', label: '전제조건', type: 'textarea' },
			{ name: 'test_steps', label: '테스트 단계', type: 'textarea' },
			{ name: 'expected_result', label: '예상결과', type: 'textarea' },
			{ name: 'task_id', label: '작업 ID', type: 'text' },
			{ name: 'design_id', label: '설계 ID', type: 'text' },
			{ name: 'prd_id', label: 'PRD ID', type: 'text' },
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
			// API 호출을 개별적으로 처리하여 오류 방지
			const [projectsData, prdsData, designsData, tasksData, testsData] = await Promise.all([
				fetch('/api/projects').then(r => r.ok ? r.json() : []).catch(() => []),
				fetch('/api/prds').then(r => r.ok ? r.json() : []).catch(() => []),
				fetch('/api/designs').then(r => r.ok ? r.json() : []).catch(() => []),
				fetch('/api/tasks').then(r => r.ok ? r.json() : []).catch(() => []),
				fetch('/api/tests').then(r => r.ok ? r.json() : []).catch(() => [])
			]);

			tables.projects.data = projectsData;
			tables.projects.columns = tableSchemas.projects;
			
			tables.prds.data = prdsData;
			tables.prds.columns = tableSchemas.prds;
			
			tables.designs.data = designsData;
			tables.designs.columns = tableSchemas.designs;
			
			tables.tasks.data = tasksData;
			tables.tasks.columns = tableSchemas.tasks;
			
			tables.tests.data = testsData;
			tables.tests.columns = tableSchemas.tests;
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