<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let form = {
		title: '',
		description: '',
		status: 'pending',
		priority: 'medium',
		assignee: '',
		estimatedHours: 0,
		actualHours: 0,
		dueDate: '',
		prd_id: null,
		design_id: null,
		tags: '',
		notes: '',
		details: '',
		acceptanceCriteria: [],
		testStrategy: ''
	};
	
	let newCriteria = '';
	let loading = false;
	let error = null;
	let initialLoading = true;
	let designs = [];
	let prds = [];
	let tests = [];
	let documents = [];
	let additionalLinks = [];
	let availableEntities = {
		prd: [],
		design: [],
		test: [],
		document: []
	};

	// 새 연결 추가를 위한 변수들
	let newConnectionType = '';
	let newConnectionEntityId = '';
	let showingConnections = [];
	
	function formatDate(dateValue) {
		if (!dateValue) return '-';
		
		try {
			let date;
			
			if (typeof dateValue === 'string' && dateValue.includes('T')) {
				date = new Date(dateValue);
			} else if (typeof dateValue === 'string' && /^\d+\.?\d*$/.test(dateValue)) {
				date = new Date(parseFloat(dateValue));
			} else if (typeof dateValue === 'number') {
				date = new Date(dateValue);
			} else {
				date = new Date(dateValue);
			}
			
			if (isNaN(date.getTime())) {
				return '-';
			}
			
			return date.toISOString().split('T')[0];
		} catch (error) {
			console.error('Date formatting error:', error, dateValue);
			return '-';
		}
	}
	
	onMount(async () => {
		try {
			// Load designs, PRDs, tests, and documents in parallel
			const [designsResponse, prdsResponse, testsResponse, documentsResponse] = await Promise.all([
				fetch('/api/designs'),
				fetch('/api/prds'),
				fetch('/api/tests'),
				fetch('/api/documents')
			]);
			
			if (designsResponse.ok) {
				designs = await designsResponse.json();
				availableEntities.design = designs;
			}
			
			if (prdsResponse.ok) {
				prds = await prdsResponse.json();
				availableEntities.prd = prds;
			}

			if (testsResponse.ok) {
				const testsData = await testsResponse.json();
				tests = testsData;
				availableEntities.test = testsData;
			}

			if (documentsResponse.ok) {
				const documentsData = await documentsResponse.json();
				documents = documentsData.documents || documentsData;
				availableEntities.document = documents;
			}
			
			// Load task data
			const response = await fetch(`/api/tasks/${$page.params.id}`);
			if (response.ok) {
				const task = await response.json();
				form = {
					title: task.title || '',
					description: task.description || '',
					status: task.status || 'pending',
					priority: task.priority?.toLowerCase() || 'medium',
					assignee: task.assignee || '',
					estimatedHours: task.estimatedHours || 0,
					actualHours: task.actualHours || 0,
					dueDate: formatDate(task.dueDate) || '',
					design_id: task.design_id || task.designId || task.planId || null,
					prd_id: task.prd_id || null,
					tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
					notes: task.notes || '',
					details: task.details || '',
					acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [],
					testStrategy: task.testStrategy || ''
				};

				// 기존 추가 연결들을 로드
				await loadExistingConnections();
			} else {
				error = '작업을 찾을 수 없습니다';
			}
		} catch (e) {
			error = '데이터를 불러오는 중 오류가 발생했습니다';
		} finally {
			initialLoading = false;
		}
	});
	
	function addCriteria() {
		if (newCriteria.trim()) {
			form.acceptanceCriteria = [...form.acceptanceCriteria, newCriteria.trim()];
			newCriteria = '';
		}
	}
	
	function removeCriteria(index) {
		form.acceptanceCriteria = form.acceptanceCriteria.filter((_, i) => i !== index);
	}

	// 기존 연결들을 로드하는 함수
	async function loadExistingConnections() {
		try {
			const response = await fetch(`/api/tasks/${$page.params.id}/connections`);
			if (response.ok) {
				const connections = await response.json();
				showingConnections = connections.map(conn => ({
					...conn,
					isNew: false
				}));
			}
		} catch (e) {
			console.error('연결 정보 로드 오류:', e);
		}
	}

	// 새 연결을 추가하는 함수
	function addNewConnection() {
		if (!newConnectionType || !newConnectionEntityId) {
			return;
		}

		const newConnection = {
			id: Date.now(), // 임시 ID
			entity_type: newConnectionType,
			entity_id: newConnectionEntityId,
			isNew: true
		};

		showingConnections = [...showingConnections, newConnection];
		newConnectionType = '';
		newConnectionEntityId = '';
	}

	// 연결을 제거하는 함수
	function removeConnection(index) {
		showingConnections = showingConnections.filter((_, i) => i !== index);
	}

	// 연결 유형별 표시 이름을 반환하는 함수
	function getConnectionTypeLabel(type) {
		const labels = {
			prd: '요구사항',
			design: '설계',
			test: '테스트',
			document: '문서',
			other: '기타'
		};
		return labels[type] || type;
	}

	// 엔터티 이름을 가져오는 함수
	function getEntityName(type, id) {
		const entities = availableEntities[type] || [];
		const entity = entities.find(e => e.id === id);
		return entity ? entity.title || entity.name || `ID: ${id}` : `ID: ${id}`;
	}
	
	async function handleSubmit() {
		if (!form.title.trim()) {
			error = '제목을 입력해주세요';
			return;
		}
		
		try {
			loading = true;
			error = null;
			
			const taskData = {
				...form,
				title: form.title.trim(),
				description: form.description?.trim() || '',
				dueDate: form.dueDate || null,
				tags: form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
				estimatedHours: Number(form.estimatedHours) || 0,
				actualHours: Number(form.actualHours) || 0,
				acceptanceCriteria: form.acceptanceCriteria,
				additionalConnections: showingConnections
			};
			
			const response = await fetch(`/api/tasks/${$page.params.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(taskData)
			});
			
			if (response.ok) {
				goto(`/tasks/${$page.params.id}`);
			} else {
				const errorData = await response.json();
				error = errorData.message || '작업 수정 중 오류가 발생했습니다';
			}
		} catch (e) {
			error = '네트워크 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}
	
	function handleKeyPress(e, action) {
		if (e.key === 'Enter') {
			e.preventDefault();
			action();
		}
	}
</script>

<svelte:head>
	<title>작업 편집 - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">작업 편집</h1>
			<p class="text-gray-600 mt-1">작업 정보를 수정합니다</p>
		</div>
		<a href="/tasks/{$page.params.id}" class="btn btn-secondary">
			← 상세보기로
		</a>
	</div>

	{#if initialLoading}
		<div class="flex justify-center py-12">
			<div class="text-gray-500">데이터를 불러오는 중...</div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{:else}
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
				
				<div class="space-y-4">
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
							제목 *
						</label>
						<input
							id="title"
							type="text"
							bind:value={form.title}
							class="form-input w-full"
							placeholder="작업 제목을 입력하세요"
							required
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
							설명
						</label>
						<textarea
							id="description"
							bind:value={form.description}
							rows="4"
							class="form-textarea w-full"
							placeholder="작업에 대한 상세 설명을 입력하세요"
						></textarea>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="priority" class="block text-sm font-medium text-gray-700 mb-1">
								우선순위
							</label>
							<select id="priority" bind:value={form.priority} class="form-select w-full">
								<option value="low">낮음</option>
								<option value="medium">보통</option>
								<option value="high">높음</option>
							</select>
						</div>

						<div>
							<label for="status" class="block text-sm font-medium text-gray-700 mb-1">
								상태
							</label>
							<select id="status" bind:value={form.status} class="form-select w-full">
								<option value="pending">대기중</option>
								<option value="in_progress">진행중</option>
								<option value="completed">완료</option>
								<option value="done">완료</option>
								<option value="blocked">차단됨</option>
							</select>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="dueDate" class="block text-sm font-medium text-gray-700 mb-1">
								마감 일자
							</label>
							<input
								id="dueDate"
								type="date"
								bind:value={form.dueDate}
								class="form-input w-full"
							/>
						</div>

						<div>
							<label for="prd_id" class="block text-sm font-medium text-gray-700 mb-1">
								연결된 요구사항
							</label>
							<select id="prd_id" bind:value={form.prd_id} class="form-select w-full">
								<option value={null}>요구사항 선택 (선택사항)</option>
								{#each prds as prd}
									<option value={prd.id}>{prd.title}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="design_id" class="block text-sm font-medium text-gray-700 mb-1">
								연결된 설계
							</label>
							<select id="design_id" bind:value={form.design_id} class="form-select w-full">
								<option value={null}>설계 선택 (선택사항)</option>
								{#each designs as design}
									<option value={design.id}>{design.title}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>

			<!-- 추가 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">추가 정보</h2>
				
				<div class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="assignee" class="block text-sm font-medium text-gray-700 mb-1">
								담당자
							</label>
							<input
								id="assignee"
								type="text"
								bind:value={form.assignee}
								class="form-input w-full"
								placeholder="담당자 이름을 입력하세요"
							/>
						</div>

						<div>
							<label for="estimatedHours" class="block text-sm font-medium text-gray-700 mb-1">
								예상 소요 시간 (시간)
							</label>
							<input
								id="estimatedHours"
								type="number"
								min="0"
								step="0.5"
								bind:value={form.estimatedHours}
								class="form-input w-full"
								placeholder="0"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="actualHours" class="block text-sm font-medium text-gray-700 mb-1">
								실제 소요 시간 (시간)
							</label>
							<input
								id="actualHours"
								type="number"
								min="0"
								step="0.5"
								bind:value={form.actualHours}
								class="form-input w-full"
								placeholder="0"
							/>
						</div>

						<div>
							<label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
								태그
							</label>
							<input
								id="tags"
								type="text"
								bind:value={form.tags}
								class="form-input w-full"
								placeholder="태그를 쉼표로 구분하여 입력하세요"
							/>
						</div>
					</div>

					<div>
						<label for="details" class="block text-sm font-medium text-gray-700 mb-1">
							상세 내용
						</label>
						<textarea
							id="details"
							bind:value={form.details}
							rows="3"
							class="form-textarea w-full"
							placeholder="작업의 상세한 요구사항이나 구현 방법을 입력하세요"
						></textarea>
					</div>

					<div>
						<label for="testStrategy" class="block text-sm font-medium text-gray-700 mb-1">
							테스트 전략
						</label>
						<textarea
							id="testStrategy"
							bind:value={form.testStrategy}
							rows="3"
							class="form-textarea w-full"
							placeholder="이 작업을 테스트하는 방법을 입력하세요"
						></textarea>
					</div>

					<div>
						<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
							메모
						</label>
						<textarea
							id="notes"
							bind:value={form.notes}
							rows="2"
							class="form-textarea w-full"
							placeholder="기타 메모사항을 입력하세요"
						></textarea>
					</div>
				</div>
			</div>

			<!-- 추가 연결 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">추가 연결</h2>
				
				<!-- 기존 연결 목록 -->
				{#if showingConnections.length > 0}
					<div class="space-y-2 mb-4">
						{#each showingConnections as connection, index}
							<div class="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
								<span class="text-sm font-medium text-blue-800">
									{getConnectionTypeLabel(connection.entity_type)}
								</span>
								<span class="text-sm text-blue-600 flex-1">
									{getEntityName(connection.entity_type, connection.entity_id)}
								</span>
								<button
									type="button"
									class="text-red-600 hover:text-red-800 text-sm"
									on:click={() => removeConnection(index)}
								>
									삭제
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- 새 연결 추가 -->
				<div class="space-y-3">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
						<!-- 연결 유형 선택 -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								연결 유형
							</label>
							<select bind:value={newConnectionType} class="form-select w-full">
								<option value="">유형 선택</option>
								<option value="prd">요구사항</option>
								<option value="design">설계</option>
								<option value="test">테스트</option>
								<option value="document">문서</option>
								<option value="other">기타</option>
							</select>
						</div>

						<!-- 항목 선택 -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								항목 선택
							</label>
							<select bind:value={newConnectionEntityId} class="form-select w-full" disabled={!newConnectionType}>
								<option value="">항목 선택</option>
								{#if newConnectionType && availableEntities[newConnectionType]}
									{#each availableEntities[newConnectionType] as entity}
										<option value={entity.id}>
											{entity.title || entity.name || `ID: ${entity.id}`}
										</option>
									{/each}
								{/if}
							</select>
						</div>

						<!-- 추가 버튼 -->
						<div class="flex items-end">
							<button
								type="button"
								class="btn btn-primary w-full"
								on:click={addNewConnection}
								disabled={!newConnectionType || !newConnectionEntityId}
							>
								연결 추가
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- 완료 기준 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">완료 기준</h2>
				
				<div class="space-y-3">
					<div class="flex space-x-2">
						<input
							type="text"
							bind:value={newCriteria}
							class="form-input flex-1"
							placeholder="새 완료 기준을 입력하세요"
							on:keypress={(e) => handleKeyPress(e, addCriteria)}
						/>
						<button
							type="button"
							class="btn btn-primary"
							on:click={addCriteria}
							disabled={!newCriteria.trim()}
						>
							추가
						</button>
					</div>

					{#if form.acceptanceCriteria.length > 0}
						<div class="space-y-2">
							{#each form.acceptanceCriteria as criteria, index}
								<div class="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
									<span class="text-sm text-gray-600 min-w-0 flex-1">{criteria}</span>
									<button
										type="button"
										class="text-red-600 hover:text-red-800 text-sm"
										on:click={() => removeCriteria(index)}
									>
										삭제
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- 액션 버튼 -->
			<div class="flex justify-end space-x-3">
				<a href="/tasks/{$page.params.id}" class="btn btn-secondary">취소</a>
				<button 
					type="submit" 
					class="btn btn-primary" 
					disabled={loading || !form.title.trim()}
				>
					{loading ? '저장 중...' : '작업 저장'}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.card {
		@apply bg-white rounded-lg shadow p-6;
	}
	.btn {
		@apply px-4 py-2 rounded-md font-medium transition-colors;
	}
	.btn-primary {
		@apply bg-blue-600 text-white hover:bg-blue-700;
	}
	.btn-secondary {
		@apply bg-gray-200 text-gray-900 hover:bg-gray-300;
	}
	.form-input {
		@apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}
	.form-select {
		@apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}
	.form-textarea {
		@apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}
</style>