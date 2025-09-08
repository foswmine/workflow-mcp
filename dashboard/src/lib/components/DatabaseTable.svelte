<script>
	import { createEventDispatcher } from 'svelte';
	
	export let tableName = '';
	export let data = [];
	export let columns = [];
	
	const dispatch = createEventDispatcher();
	
	let editingItem = null;
	let isNewItem = false;
	let showAddForm = false;
	let viewingItem = null;

	function startEdit(item) {
		editingItem = { ...item };
		isNewItem = false;
		showAddForm = false;
	}

	function startNew() {
		editingItem = {};
		isNewItem = true;
		showAddForm = true;
		viewingItem = null;
	}

	function cancelEdit() {
		editingItem = null;
		isNewItem = false;
		showAddForm = false;
	}

	function viewItem(item) {
		viewingItem = item;
		editingItem = null;
		showAddForm = false;
	}

	function closeView() {
		viewingItem = null;
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
			case 'json-array':
				if (Array.isArray(value)) {
					return `[${value.length}개 항목]`;
				}
				try {
					const arr = JSON.parse(value);
					return Array.isArray(arr) ? `[${arr.length}개 항목]` : value;
				} catch {
					return value;
				}
			case 'json':
				if (typeof value === 'object' && value !== null) {
					return JSON.stringify(value).substring(0, 100) + '...';
				}
				return value;
			default:
				return value;
		}
	}

	function parseJsonArray(value) {
		if (!value) return [];
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	function handleInputChange(column, value) {
		if (column.type === 'number') {
			editingItem[column.name] = value === '' ? null : Number(value);
		} else {
			editingItem[column.name] = value;
		}
	}

	function updateJsonArrayItem(fieldName, index, value) {
		const currentArray = parseJsonArray(editingItem[fieldName] || '[]');
		currentArray[index] = value;
		editingItem[fieldName] = JSON.stringify(currentArray);
	}

	function addJsonArrayItem(fieldName) {
		const currentArray = parseJsonArray(editingItem[fieldName] || '[]');
		currentArray.push('');
		editingItem[fieldName] = JSON.stringify(currentArray);
	}

	function removeJsonArrayItem(fieldName, index) {
		const currentArray = parseJsonArray(editingItem[fieldName] || '[]');
		currentArray.splice(index, 1);
		editingItem[fieldName] = JSON.stringify(currentArray);
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
									{:else if column.type === 'json-array'}
										<div class="space-y-2">
											{#each parseJsonArray(editingItem[column.name] || '[]') as item, index}
												<div class="flex items-center space-x-2">
													<input 
														class="form-input text-sm flex-1"
														type="text"
														value={item}
														on:input={(e) => updateJsonArrayItem(column.name, index, e.target.value)}
													>
													<button 
														type="button"
														class="text-red-600 hover:text-red-800"
														on:click={() => removeJsonArrayItem(column.name, index)}
													>
														삭제
													</button>
												</div>
											{/each}
											<button 
												type="button"
												class="text-blue-600 hover:text-blue-800 text-sm"
												on:click={() => addJsonArrayItem(column.name)}
											>
												+ 항목 추가
											</button>
										</div>
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
										{:else if column.type === 'json-array'}
											<div class="space-y-1">
												{#each parseJsonArray(editingItem[column.name] || '[]') as item, index}
													<div class="flex items-center space-x-1">
														<input 
															class="form-input text-xs flex-1"
															type="text"
															value={item}
															on:input={(e) => updateJsonArrayItem(column.name, index, e.target.value)}
														>
														<button 
															type="button"
															class="text-red-500 hover:text-red-700 text-xs"
															on:click={() => removeJsonArrayItem(column.name, index)}
														>
															×
														</button>
													</div>
												{/each}
												<button 
													type="button"
													class="text-blue-500 hover:text-blue-700 text-xs"
													on:click={() => addJsonArrayItem(column.name)}
												>
													+ 추가
												</button>
											</div>
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
									<button on:click={() => viewItem(item)} class="text-indigo-600 hover:text-indigo-900">상세</button>
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

<!-- Detail View Modal -->
{#if viewingItem}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<!-- Header -->
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold text-gray-900">
						{tableName.charAt(0).toUpperCase() + tableName.slice(1)} 상세 보기
					</h3>
					<button on:click={closeView} class="text-gray-400 hover:text-gray-600">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

				<!-- Content -->
				<div class="space-y-6 max-h-96 overflow-y-auto">
					<!-- 원본 JSON 데이터 섹션 -->
					{#if viewingItem.document_content}
						<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<h4 class="text-lg font-semibold text-blue-900 mb-3">📄 원본 JSON 문서 내용</h4>
							<pre class="whitespace-pre-wrap text-sm bg-white p-4 rounded border max-h-80 overflow-y-auto font-mono border-2 border-blue-300">{JSON.stringify(viewingItem.document_content, null, 2)}</pre>
						</div>
					{/if}

					<!-- 기본 필드들 -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						{#each columns as column}
							<div class="space-y-2">
								<label class="block text-sm font-medium text-gray-700">
									{column.label}
								</label>
								<div class="p-3 bg-gray-50 rounded-md">
									{#if column.type === 'json-array'}
										<div class="space-y-1">
											{#each parseJsonArray(viewingItem[column.name]) as item, index}
												<div class="flex items-center space-x-2">
													<span class="text-xs text-gray-500">{index + 1}.</span>
													<span class="text-sm">{typeof item === 'object' ? JSON.stringify(item) : item}</span>
												</div>
											{/each}
											{#if parseJsonArray(viewingItem[column.name]).length === 0}
												<span class="text-sm text-gray-400">항목이 없습니다</span>
											{/if}
										</div>
									{:else if column.type === 'json'}
										<div class="text-sm">
											{#if typeof viewingItem[column.name] === 'object' && viewingItem[column.name] !== null}
												<pre class="whitespace-pre-wrap text-xs bg-white p-2 rounded border max-h-40 overflow-y-auto">{JSON.stringify(viewingItem[column.name], null, 2)}</pre>
											{:else}
												{viewingItem[column.name] || '-'}
											{/if}
										</div>
									{:else if column.type === 'textarea'}
										<div class="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
											{viewingItem[column.name] || '-'}
										</div>
									{:else}
										<div class="text-sm">
											{formatValue(viewingItem[column.name], column)}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Footer -->
				<div class="flex justify-end mt-6 pt-6 border-t">
					<button on:click={() => startEdit(viewingItem)} class="mr-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
						수정하기
					</button>
					<button on:click={closeView} class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
						닫기
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}