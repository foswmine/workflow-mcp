<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let project = null;
	let form = {
		name: '',
		description: '',
		status: 'active',
		priority: 'medium',
		start_date: '',
		end_date: '',
		manager: '',
		tags: '',
		progress: 0,
		notes: ''
	};
	
	// 단순화된 연결 항목 리스트 (편집용)
	let editingPRDs = [];      // 편집 중인 연결 PRD 리스트
	let editingTasks = [];     // 편집 중인 연결 작업 리스트
	let editingDocuments = []; // 편집 중인 연결 문서 리스트
	
	// 전체 항목들 (드롭다운용)
	let allPRDs = [];
	let allTasks = [];
	let allDocuments = [];
	
	// 드롭다운에서 선택된 항목들
	let selectedPRDToAdd = '';
	let selectedTaskToAdd = '';
	let selectedDocumentToAdd = '';
	
	// 추가 가능한 항목들 (이미 편집 리스트에 있는 것 제외)
	$: availablePRDs = allPRDs.filter(prd => 
		!editingPRDs.some(editing => editing.id === prd.id)
	);
	
	$: availableTasks = allTasks.filter(task => 
		!editingTasks.some(editing => editing.id === task.id)
	);
	
	$: availableDocuments = allDocuments.filter(doc => 
		!editingDocuments.some(editing => editing.id === doc.id)
	);
	
	let loading = false;
	let error = null;
	let loadingProject = true;

	$: projectId = $page.params.id;

	onMount(async () => {
		await Promise.all([
			loadProject(),
			loadAllItems(),
			loadConnectedItems()
		]);
	});

	async function loadProject() {
		try {
			loadingProject = true;
			const response = await fetch(`/api/projects/${projectId}`);
			
			if (!response.ok) {
				if (response.status === 404) {
					error = '프로젝트를 찾을 수 없습니다.';
				} else {
					error = '프로젝트 정보를 불러오는 중 오류가 발생했습니다.';
				}
				return;
			}

			project = await response.json();
			
			// 폼에 기존 데이터 채우기
			form.name = project.name || '';
			form.description = project.description || '';
			form.status = project.status || 'active';
			form.priority = project.priority || 'medium';
			form.start_date = project.start_date ? project.start_date.split('T')[0] : '';
			form.end_date = project.end_date ? project.end_date.split('T')[0] : '';
			form.manager = project.manager || '';
			form.tags = Array.isArray(project.tags) ? project.tags.join(', ') : '';
			form.progress = project.progress || 0;
			form.notes = project.notes || '';

		} catch (e) {
			error = '프로젝트 정보를 불러오는 중 오류가 발생했습니다: ' + e.message;
		} finally {
			loadingProject = false;
		}
	}

	async function loadConnectedItems() {
		try {
			// project_links 테이블에서 연결된 항목들 로드
			const linksResponse = await fetch(`/api/projects/${projectId}/links`);
			if (linksResponse.ok) {
				const linksData = await linksResponse.json();
				if (linksData.success) {
					const connectedPRDs = linksData.links.prds || [];
					const connectedTasks = linksData.links.tasks || [];
					
					// 편집용 리스트에 연결된 항목들을 복사
					editingPRDs = connectedPRDs.map(linked => {
						const fullPRD = allPRDs.find(prd => prd.id === (linked.entity_id || linked.id));
						return fullPRD || { 
							id: linked.entity_id || linked.id, 
							title: linked.title, 
							description: '연결된 PRD',
							status: linked.status 
						};
					});

					editingTasks = connectedTasks.map(linked => {
						const fullTask = allTasks.find(task => task.id === (linked.entity_id || linked.id));
						return fullTask || { 
							id: linked.entity_id || linked.id, 
							title: linked.title, 
							description: '연결된 작업',
							status: linked.status 
						};
					});
					
					const connectedDocuments = linksData.links.documents || [];
					editingDocuments = connectedDocuments.map(linked => {
						const fullDoc = allDocuments.find(doc => doc.id === (linked.entity_id || linked.id));
						return fullDoc || { 
							id: linked.entity_id || linked.id, 
							title: linked.title, 
							doc_type: '연결된 문서',
							status: linked.status || 'draft'
						};
					});
				}
			}

		} catch (e) {
			console.error('연결된 항목 로드 실패:', e);
		}
	}

	async function loadAllItems() {
		try {
			// 모든 PRD 로드
			const prdsResponse = await fetch('/api/prds');
			if (prdsResponse.ok) {
				allPRDs = await prdsResponse.json();
			}

			// 모든 작업 로드
			const tasksResponse = await fetch('/api/tasks');
			if (tasksResponse.ok) {
				allTasks = await tasksResponse.json();
			}

			// 모든 문서 로드
			const documentsResponse = await fetch('/api/documents');
			if (documentsResponse.ok) {
				const documentsData = await documentsResponse.json();
				allDocuments = documentsData.documents || [];
			}

		} catch (e) {
			console.error('전체 항목 로드 실패:', e);
		}
	}

	async function handleSubmit() {
		if (!form.name.trim()) {
			error = '프로젝트 이름을 입력해주세요';
			return;
		}

		try {
			loading = true;
			error = null;

			const updateData = {
				name: form.name.trim(),
				description: form.description?.trim() || '',
				status: form.status,
				priority: form.priority,
				start_date: form.start_date || null,
				end_date: form.end_date || null,
				manager: form.manager?.trim() || '',
				tags: form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
				progress: Number(form.progress) || 0,
				notes: form.notes?.trim() || ''
			};

			const response = await fetch(`/api/projects/${projectId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				// 프로젝트 업데이트 성공 후 연결 관계를 전체 교체 방식으로 저장
				await saveAllConnections();
				goto(`/projects/${projectId}`);
			} else {
				const errorData = await response.json();
				error = errorData.message || '프로젝트 수정 중 오류가 발생했습니다';
			}
		} catch (e) {
			error = '네트워크 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function deleteProject() {
		if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
			return;
		}

		try {
			loading = true;
			const response = await fetch(`/api/projects/${projectId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				goto('/projects');
			} else {
				const errorData = await response.json();
				error = errorData.message || '프로젝트 삭제 중 오류가 발생했습니다';
			}
		} catch (e) {
			error = '네트워크 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	// PRD 연결/해제 함수들 (project_links API 사용)
	async function connectPRD(prdId) {
		try {
			const response = await fetch(`/api/projects/${projectId}/links`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					entity_type: 'prd', 
					entity_id: prdId,
					link_type: 'direct' 
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (e) {
			console.error('PRD 연결 오류:', e);
			throw new Error('PRD 연결 중 오류가 발생했습니다: ' + e.message);
		}
	}

	async function disconnectPRD(prdId) {
		try {
			const response = await fetch(`/api/projects/${projectId}/links`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					entity_type: 'prd', 
					entity_id: prdId 
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (e) {
			console.error('PRD 연결 해제 오류:', e);
			throw new Error('PRD 연결 해제 중 오류가 발생했습니다: ' + e.message);
		}
	}

	// 작업 연결/해제 함수들 (project_links API 사용)
	async function connectTask(taskId) {
		try {
			const response = await fetch(`/api/projects/${projectId}/links`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					entity_type: 'task', 
					entity_id: taskId,
					link_type: 'direct' 
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (e) {
			console.error('작업 연결 오류:', e);
			throw new Error('작업 연결 중 오류가 발생했습니다: ' + e.message);
		}
	}

	async function disconnectTask(taskId) {
		try {
			const response = await fetch(`/api/projects/${projectId}/links`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					entity_type: 'task', 
					entity_id: taskId 
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (e) {
			console.error('작업 연결 해제 오류:', e);
			throw new Error('작업 연결 해제 중 오류가 발생했습니다: ' + e.message);
		}
	}

	// 문서 연결/해제 함수들
	async function connectDocument(docId) {
		try {
			const response = await fetch(`/api/projects/${projectId}/links`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					entity_type: 'document', 
					entity_id: docId,
					link_type: 'direct' 
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (e) {
			console.error('문서 연결 오류:', e);
			throw new Error('문서 연결 중 오류가 발생했습니다: ' + e.message);
		}
	}

	async function disconnectDocument(docId) {
		try {
			const response = await fetch(`/api/projects/${projectId}/links`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					entity_type: 'document', 
					entity_id: docId 
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (e) {
			console.error('문서 연결 해제 오류:', e);
			throw new Error('문서 연결 해제 중 오류가 발생했습니다: ' + e.message);
		}
	}

	// 전체 교체 방식 연결 저장 함수
	async function saveAllConnections() {
		console.log('🔄 전체 연결 관계 저장 시작');
		console.log('저장할 PRDs:', editingPRDs);
		console.log('저장할 Tasks:', editingTasks);
		console.log('저장할 Documents:', editingDocuments);
		
		try {
			// 1단계: 기존 모든 연결 삭제
			console.log('🗑️ 기존 연결 모두 삭제 중...');
			const deleteResponse = await fetch(`/api/projects/${projectId}/links/all`, {
				method: 'DELETE'
			});
			
			if (!deleteResponse.ok && deleteResponse.status !== 404) {
				console.warn('기존 연결 삭제 중 경고:', await deleteResponse.text());
			}

			// 2단계: 새로운 PRD 연결들 생성
			for (const prd of editingPRDs) {
				console.log(`PRD ${prd.id} (${prd.title}) 연결 중...`);
				await connectPRD(prd.id);
				console.log(`✅ PRD ${prd.id} 연결 완료`);
			}

			// 3단계: 새로운 작업 연결들 생성
			for (const task of editingTasks) {
				console.log(`Task ${task.id} (${task.title}) 연결 중...`);
				await connectTask(task.id);
				console.log(`✅ Task ${task.id} 연결 완료`);
			}

			// 4단계: 새로운 문서 연결들 생성
			for (const doc of editingDocuments) {
				console.log(`Document ${doc.id} (${doc.title}) 연결 중...`);
				await connectDocument(doc.id);
				console.log(`✅ Document ${doc.id} 연결 완료`);
			}

			console.log('🎉 전체 연결 관계 저장 완료');
			console.log(`📊 총 연결: PRD ${editingPRDs.length}개, 작업 ${editingTasks.length}개, 문서 ${editingDocuments.length}개`);

		} catch (e) {
			console.error('❌ 연결 관계 저장 중 오류:', e);
			error = '연결 관계 저장 중 오류가 발생했습니다: ' + e.message;
			throw e; // 에러를 다시 던져서 저장 프로세스를 중단
		}
	}

	// 단순화된 항목 관리 핸들러들
	function handleAddPRD() {
		if (!selectedPRDToAdd) return;
		
		const selectedPRD = availablePRDs.find(prd => prd.id === selectedPRDToAdd);
		if (selectedPRD) {
			// 편집 리스트에 바로 추가
			editingPRDs = [...editingPRDs, selectedPRD];
		}
		selectedPRDToAdd = ''; // 선택 초기화
	}

	function handleAddTask() {
		if (!selectedTaskToAdd) return;
		
		const selectedTask = availableTasks.find(task => task.id === selectedTaskToAdd);
		if (selectedTask) {
			// 편집 리스트에 바로 추가
			editingTasks = [...editingTasks, selectedTask];
		}
		selectedTaskToAdd = ''; // 선택 초기화
	}

	function removePRD(prdId) {
		editingPRDs = editingPRDs.filter(prd => prd.id !== prdId);
	}

	function removeTask(taskId) {
		editingTasks = editingTasks.filter(task => task.id !== taskId);
	}

	function handleAddDocument() {
		if (!selectedDocumentToAdd) return;
		
		const selectedDocument = availableDocuments.find(doc => doc.id === selectedDocumentToAdd);
		if (selectedDocument) {
			// 편집 리스트에 바로 추가
			editingDocuments = [...editingDocuments, selectedDocument];
		}
		selectedDocumentToAdd = ''; // 선택 초기화
	}

	function removeDocument(docId) {
		editingDocuments = editingDocuments.filter(doc => doc.id !== docId);
	}

</script><svelte:head>
	<title>{project?.name ? `${project.name} 편집` : '프로젝트 편집'} - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	{#if loadingProject}
		<div class="flex justify-center items-center h-64">
			<div class="text-gray-600">프로젝트 정보를 불러오는 중...</div>
		</div>
	{:else if error && !project}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
			<div class="mt-2">
				<a href="/projects" class="text-red-600 hover:text-red-800 underline">
					프로젝트 목록으로 돌아가기
				</a>
			</div>
		</div>
	{:else}
		<!-- 헤더 -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">프로젝트 편집</h1>
				<p class="text-gray-600 mt-1">프로젝트 정보를 수정합니다</p>
			</div>
			<div class="flex space-x-3">
				<a href="/projects/{projectId}" class="btn btn-secondary">
					← 프로젝트 상세
				</a>
				<a href="/projects" class="btn btn-secondary">
					목록으로
				</a>
			</div>
		</div>

		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-md p-4">
				<div class="text-red-800">{error}</div>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
				
				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
							프로젝트 이름 *
						</label>
						<input
							id="name"
							type="text"
							bind:value={form.name}
							class="form-input w-full"
							placeholder="프로젝트 이름을 입력하세요"
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
							placeholder="프로젝트에 대한 상세 설명을 입력하세요"
						></textarea>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label for="status" class="block text-sm font-medium text-gray-700 mb-1">
								상태
							</label>
							<select id="status" bind:value={form.status} class="form-select w-full">
								<option value="active">활성</option>
								<option value="planning">계획중</option>
								<option value="on_hold">보류</option>
								<option value="completed">완료</option>
								<option value="cancelled">취소</option>
							</select>
						</div>

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
							<label for="progress" class="block text-sm font-medium text-gray-700 mb-1">
								진행률 (%)
							</label>
							<input
								id="progress"
								type="number"
								min="0"
								max="100"
								bind:value={form.progress}
								class="form-input w-full"
								placeholder="0"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="start_date" class="block text-sm font-medium text-gray-700 mb-1">
								시작일
							</label>
							<input
								id="start_date"
								type="date"
								bind:value={form.start_date}
								class="form-input w-full"
							/>
						</div>

						<div>
							<label for="end_date" class="block text-sm font-medium text-gray-700 mb-1">
								종료일
							</label>
							<input
								id="end_date"
								type="date"
								bind:value={form.end_date}
								class="form-input w-full"
							/>
						</div>
					</div>

					<div>
						<label for="manager" class="block text-sm font-medium text-gray-700 mb-1">
							프로젝트 관리자
						</label>
						<input
							id="manager"
							type="text"
							bind:value={form.manager}
							class="form-input w-full"
							placeholder="관리자 이름을 입력하세요"
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
							placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 웹개발, 프론트엔드, React)"
						/>
						<p class="text-sm text-gray-500 mt-1">쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다</p>
					</div>

					<div>
						<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
							메모
						</label>
						<textarea
							id="notes"
							bind:value={form.notes}
							rows="3"
							class="form-textarea w-full"
							placeholder="프로젝트 관련 메모나 참고사항을 입력하세요"
						></textarea>
					</div>
				</div>
			</div>

			<!-- 연결된 항목 관리 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">연결된 항목 관리</h2>
				
				<!-- 연결 요구사항 리스트 -->
				<div class="mb-6">
					<h3 class="text-lg font-medium text-gray-900 mb-3">연결 요구사항 리스트</h3>
					
					<!-- 편집 중인 PRD 리스트 -->
					{#if editingPRDs.length > 0}
						<div class="space-y-3 mb-4">
							{#each editingPRDs as prd}
								<div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900">{prd.title}</h4>
										<p class="text-sm text-gray-600">{prd.description || '설명 없음'}</p>
										<div class="flex items-center space-x-2 mt-2">
											<span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
												{prd.status === 'active' ? '활성' : prd.status}
											</span>
											<span class="text-xs text-gray-500">ID: {prd.id}</span>
										</div>
									</div>
									<button
										type="button"
										on:click={() => removePRD(prd.id)}
										class="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
									>
										제거
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">연결된 요구사항이 없습니다.</p>
					{/if}

					<!-- 새 PRD 추가 -->
					{#if availablePRDs.length > 0}
						<div class="border-t pt-4">
							<h4 class="text-sm font-medium text-gray-700 mb-3">요구사항 추가</h4>
							<div class="flex items-center space-x-3">
								<select 
									bind:value={selectedPRDToAdd} 
									class="flex-1 form-select"
								>
									<option value="">추가할 요구사항 선택...</option>
									{#each availablePRDs as prd}
										<option value={prd.id}>{prd.title}</option>
									{/each}
								</select>
								<button
									type="button"
									on:click={handleAddPRD}
									disabled={!selectedPRDToAdd}
									class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									추가
								</button>
							</div>
						</div>
					{:else}
						<p class="text-sm text-gray-500 p-2 bg-gray-50 rounded">추가 가능한 요구사항이 없습니다.</p>
					{/if}
				</div>

				<!-- 연결 작업 리스트 -->
				<div class="mb-6">
					<h3 class="text-lg font-medium text-gray-900 mb-3">연결 작업 리스트</h3>
					
					<!-- 편집 중인 작업 리스트 -->
					{#if editingTasks.length > 0}
						<div class="space-y-3 mb-4">
							{#each editingTasks as task}
								<div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900">{task.title}</h4>
										<p class="text-sm text-gray-600">{task.description || '설명 없음'}</p>
										<div class="flex items-center space-x-2 mt-2">
											<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
												{task.status === 'completed' ? '완료' : task.status === 'in_progress' ? '진행중' : task.status === 'blocked' ? '차단됨' : '대기중'}
											</span>
											{#if task.assignee}
												<span class="text-xs text-gray-500">담당: {task.assignee}</span>
											{/if}
											<span class="text-xs text-gray-500">ID: {task.id}</span>
										</div>
									</div>
									<button
										type="button"
										on:click={() => removeTask(task.id)}
										class="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
									>
										제거
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">연결된 작업이 없습니다.</p>
					{/if}

					<!-- 새 작업 추가 -->
					{#if availableTasks.length > 0}
						<div class="border-t pt-4">
							<h4 class="text-sm font-medium text-gray-700 mb-3">작업 추가</h4>
							<div class="flex items-center space-x-3">
								<select 
									bind:value={selectedTaskToAdd} 
									class="flex-1 form-select"
								>
									<option value="">추가할 작업 선택...</option>
									{#each availableTasks as task}
										<option value={task.id}>
											{task.title} 
											({task.status === 'completed' ? '완료' : task.status === 'in_progress' ? '진행중' : task.status === 'blocked' ? '차단됨' : '대기중'})
										</option>
									{/each}
								</select>
								<button
									type="button"
									on:click={handleAddTask}
									disabled={!selectedTaskToAdd}
									class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									추가
								</button>
							</div>
						</div>
					{:else}
						<p class="text-sm text-gray-500 p-2 bg-gray-50 rounded">추가 가능한 작업이 없습니다.</p>
					{/if}
				</div>


				<!-- 연결된 문서 -->
				<div class="mb-6">
					<h3 class="text-lg font-medium text-gray-900 mb-3">연결 문서 리스트</h3>
					
					<!-- 편집 중인 문서 리스트 -->
					{#if editingDocuments.length > 0}
						<div class="space-y-3 mb-4">
							{#each editingDocuments as doc}
								<div class="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900">{doc.title}</h4>
										<p class="text-sm text-gray-600">{doc.summary || doc.content?.substring(0, 100) || '내용 없음'}</p>
										<div class="flex items-center space-x-2 mt-2">
											<span class="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
												{doc.doc_type === 'test_guide' ? '테스트 가이드' : 
												 doc.doc_type === 'test_results' ? '테스트 결과' : 
												 doc.doc_type === 'analysis' ? '분석' : 
												 doc.doc_type === 'report' ? '보고서' : 
												 doc.doc_type === 'checklist' ? '체크리스트' : 
												 doc.doc_type === 'specification' ? '사양서' : 
												 doc.doc_type === 'meeting_notes' ? '회의록' : 
												 doc.doc_type === 'decision_log' ? '의사결정' : doc.doc_type}
											</span>
											<span class="text-xs px-2 py-1 rounded-full {doc.status === 'approved' ? 'bg-green-100 text-green-800' : doc.status === 'review' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
												{doc.status === 'approved' ? '승인됨' : doc.status === 'review' ? '검토중' : doc.status === 'draft' ? '초안' : '보관됨'}
											</span>
											<span class="text-xs text-gray-500">ID: {doc.id}</span>
										</div>
									</div>
									<button
										type="button"
										on:click={() => removeDocument(doc.id)}
										class="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
									>
										제거
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">연결된 문서가 없습니다.</p>
					{/if}

					<!-- 새 문서 추가 -->
					{#if availableDocuments.length > 0}
						<div class="border-t pt-4">
							<h4 class="text-sm font-medium text-gray-700 mb-3">문서 추가</h4>
							<div class="flex items-center space-x-3">
								<select 
									bind:value={selectedDocumentToAdd} 
									class="flex-1 form-select"
								>
									<option value="">추가할 문서 선택...</option>
									{#each availableDocuments as doc}
										<option value={doc.id}>
											{doc.title} 
											({doc.doc_type === 'test_guide' ? '테스트 가이드' : 
											 doc.doc_type === 'test_results' ? '테스트 결과' : 
											 doc.doc_type === 'analysis' ? '분석' : 
											 doc.doc_type === 'report' ? '보고서' : 
											 doc.doc_type === 'checklist' ? '체크리스트' : 
											 doc.doc_type === 'specification' ? '사양서' : 
											 doc.doc_type === 'meeting_notes' ? '회의록' : 
											 doc.doc_type === 'decision_log' ? '의사결정' : doc.doc_type})
										</option>
									{/each}
								</select>
								<button
									type="button"
									on:click={handleAddDocument}
									disabled={!selectedDocumentToAdd}
									class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									추가
								</button>
							</div>
						</div>
					{:else}
						<p class="text-sm text-gray-500 p-2 bg-gray-50 rounded">추가 가능한 문서가 없습니다.</p>
					{/if}
				</div>
			</div>

			<!-- 미리보기 -->
			<div class="card bg-gray-50">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">미리보기</h2>
				
				<div class="bg-white p-4 rounded-lg border">
					<div class="flex items-start justify-between mb-2">
						<h3 class="font-medium text-gray-900">
							{form.name || '프로젝트 이름'}
						</h3>
						<div class="flex space-x-2">
							<span class="badge bg-blue-100 text-blue-800">
								{form.status === 'active' ? '활성' : form.status === 'planning' ? '계획중' : form.status === 'on_hold' ? '보류' : form.status === 'completed' ? '완료' : '취소'}
							</span>
							<span class="badge {form.priority === 'high' ? 'bg-red-100 text-red-800' : form.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
								{form.priority === 'high' ? '높음' : form.priority === 'medium' ? '보통' : '낮음'}
							</span>
						</div>
					</div>

					{#if form.description}
						<p class="text-gray-600 text-sm mb-3">{form.description}</p>
					{/if}

					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
						{#if form.manager}
							<div>👤 관리자: {form.manager}</div>
						{/if}
						{#if form.start_date}
							<div>📅 시작: {new Date(form.start_date).toLocaleDateString('ko-KR')}</div>
						{/if}
						{#if form.end_date}
							<div>🏁 종료: {new Date(form.end_date).toLocaleDateString('ko-KR')}</div>
						{/if}
						<div>📊 진행률: {form.progress}%</div>
					</div>

					{#if form.tags}
						<div class="flex flex-wrap gap-1">
							{#each form.tags.split(',').map(tag => tag.trim()).filter(tag => tag) as tag}
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{tag}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- 액션 버튼 -->
			<div class="flex justify-between">
				<button
					type="button"
					on:click={deleteProject}
					class="btn bg-red-600 text-white hover:bg-red-700"
					disabled={loading}
				>
					프로젝트 삭제
				</button>

				<div class="flex space-x-3">
					<a href="/projects/{projectId}" class="btn btn-secondary">취소</a>
					<button 
						type="submit" 
						class="btn btn-primary" 
						disabled={loading || !form.name.trim()}
					>
						{loading ? '저장 중...' : '변경사항 저장'}
					</button>
				</div>
			</div>
		</form>
	{/if}
</div>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}
</style>