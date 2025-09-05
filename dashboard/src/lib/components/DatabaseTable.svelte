<script>
	import { createEventDispatcher } from 'svelte';
	
	export let tableName = '';
	export let data = [];
	export let columns = [];
	
	const dispatch = createEventDispatcher();
	
	let editingItem = null;
	let isNewItem = false;
	let showAddForm = false;

	function startEdit(item) {
		editingItem = { ...item };
		isNewItem = false;
		showAddForm = false;
	}

	function startNew() {
		editingItem = {};
		isNewItem = true;
		showAddForm = true;
	}

	function cancelEdit() {
		editingItem = null;
		isNewItem = false;
		showAddForm = false;
	}

	function saveItem() {
		if (editingItem) {
			dispatch('save', { 
				table: tableName, 
				item: editingItem, 
				isNew: isNewItem 
			});
			cancelEdit();
		}
	}

	function deleteItem(id) {
		dispatch('delete', { table: tableName, id });
	}

	function formatValue(value, column) {
		if (value === null || value === undefined) return '-';
		
		switch (column.type) {
			case 'datetime':
				return new Date(value).toLocaleString('ko-KR');
			case 'date':
				return new Date(value).toLocaleDateString('ko-KR');
			case 'textarea':
				return value.length > 50 ? value.substring(0, 50) + '...' : value;
			default:
				return value;
		}
	}

	function handleInputChange(column, value) {
		if (column.type === 'number') {
			editingItem[column.name] = value === '' ? null : Number(value);
		} else {
			editingItem[column.name] = value;
		}
	}
</script>

<div class="space-y-4">
	<!-- Add New Button -->
	<div class="flex justify-between items-center">
		<h3 class="text-lg font-semibold text-gray-900">
			{tableName.charAt(0).toUpperCase() + tableName.slice(1)} 테이블
		</h3>
		<button on:click={startNew} class="btn btn-primary">
			+ 새 항목 추가
		</button>
	</div>

	<!-- Table -->
	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						{#each columns as column}
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{column.label}
							</th>
						{/each}
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							작업
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#if showAddForm}
						<!-- Add Form Row -->
						<tr class="bg-blue-50">
							{#each columns as column}
								<td class="px-6 py-4 whitespace-nowrap text-sm">
									{#if column.readonly}
										<span class="text-gray-500">자동 생성</span>
									{:else if column.type === 'select'}
										<select 
											class="form-select text-sm"
											bind:value={editingItem[column.name]}
										>
											<option value="">선택하세요</option>
											{#each column.options as option}
												<option value={option}>{option}</option>
											{/each}
										</select>
									{:else if column.type === 'textarea'}
										<textarea 
											class="form-textarea text-sm"
											rows="3"
											bind:value={editingItem[column.name]}
										></textarea>
									{:else if column.type === 'number'}
										<input 
											class="form-input text-sm"
											type="number"
											bind:value={editingItem[column.name]}
										>
									{:else if column.type === 'date'}
										<input 
											class="form-input text-sm"
											type="date"
											bind:value={editingItem[column.name]}
										>
									{:else}
										<input 
											class="form-input text-sm"
											type="text"
											bind:value={editingItem[column.name]}
										>
									{/if}
								</td>
							{/each}
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
								<button on:click={saveItem} class="text-green-600 hover:text-green-900">저장</button>
								<button on:click={cancelEdit} class="text-gray-600 hover:text-gray-900">취소</button>
							</td>
						</tr>
					{/if}

					{#each data as item (item.id)}
						<tr class={editingItem && editingItem.id === item.id ? 'bg-yellow-50' : ''}>
							{#each columns as column}
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{#if editingItem && editingItem.id === item.id}
										{#if column.readonly}
											<span class="text-gray-500">{formatValue(item[column.name], column)}</span>
										{:else if column.type === 'select'}
											<select 
												class="form-select text-sm"
												value={editingItem[column.name]}
												on:change={(e) => handleInputChange(column, e.target.value)}
											>
												<option value="">선택하세요</option>
												{#each column.options as option}
													<option value={option}>{option}</option>
												{/each}
											</select>
										{:else if column.type === 'textarea'}
											<textarea 
												class="form-textarea text-sm"
												rows="3"
												value={editingItem[column.name] || ''}
												on:input={(e) => handleInputChange(column, e.target.value)}
											></textarea>
										{:else}
											<input 
												class="form-input text-sm"
												type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
												value={editingItem[column.name] || ''}
												on:input={(e) => handleInputChange(column, e.target.value)}
											>
										{/if}
									{:else}
										{formatValue(item[column.name], column)}
									{/if}
								</td>
							{/each}
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
								{#if editingItem && editingItem.id === item.id}
									<button on:click={saveItem} class="text-green-600 hover:text-green-900">저장</button>
									<button on:click={cancelEdit} class="text-gray-600 hover:text-gray-900">취소</button>
								{:else}
									<button on:click={() => startEdit(item)} class="text-blue-600 hover:text-blue-900">수정</button>
									<button on:click={() => deleteItem(item.id)} class="text-red-600 hover:text-red-900">삭제</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.length === 0}
			<div class="text-center py-12">
				<div class="text-gray-500">데이터가 없습니다</div>
			</div>
		{/if}
	</div>

	<!-- Table Info -->
	<div class="text-sm text-gray-500">
		총 {data.length}개 항목
	</div>
</div>