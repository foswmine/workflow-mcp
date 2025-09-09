<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let task = null;
	let linkedPrd = null; // 연결된 PRD 정보
	let linkedDesign = null; // 연결된 설계 정보
	let linkedDocuments = []; // 연결된 문서들
	let additionalConnections = []; // 추가 연결들
	let loading = true;
	let error = null;
	
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
			
			return date.toLocaleString('ko-KR', {
				year: 'numeric',
				month: 'numeric', 
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});
		} catch (error) {
			console.error('Date formatting error:', error, dateValue);
			return '-';
		}
	}

	// 연결 상세 정보를 로드하는 함수
	async function loadConnectionDetails(connections) {
		const detailedConnections = [];
		
		for (const conn of connections) {
			try {
				let detailResponse;
				let entityData = null;
				
				switch (conn.entity_type) {
					case 'prd':
						detailResponse = await fetch(`/api/prds/${conn.entity_id}`);
						break;
					case 'design':
						detailResponse = await fetch(`/api/designs/${conn.entity_id}`);
						break;
					case 'test':
						detailResponse = await fetch(`/api/tests/${conn.entity_id}`);
						break;
					case 'document':
						detailResponse = await fetch(`/api/documents/${conn.entity_id}`);
						break;
					default:
						continue;
				}
				
				if (detailResponse && detailResponse.ok) {
					entityData = await detailResponse.json();
				}
				
				detailedConnections.push({
					...conn,
					entityData,
					title: entityData?.title || entityData?.name || `ID: ${conn.entity_id}`,
					type_label: getConnectionTypeLabel(conn.entity_type)
				});
			} catch (e) {
				console.error(`연결 상세 정보 로드 실패 (${conn.entity_type}:${conn.entity_id}):`, e);
			}
		}
		
		return detailedConnections;
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

	onMount(async () => {
		try {
			const response = await fetch(`/api/tasks/${$page.params.id}`);
			if (response.ok) {
				task = await response.json();
				
				// MCP로 저장된 JSON 필드들 파싱
				if (task.acceptanceCriteria && typeof task.acceptanceCriteria === 'string') {
					try {
						// 이중 JSON 인코딩된 경우 처리
						let parsed = JSON.parse(task.acceptanceCriteria);
						if (typeof parsed === 'string') {
							parsed = JSON.parse(parsed);
						}
						task.acceptanceCriteria = Array.isArray(parsed) ? parsed : [];
					} catch (e) {
						console.warn('acceptance_criteria 파싱 실패:', e);
						task.acceptanceCriteria = [];
					}
				}
				
				// 연결된 PRD가 있으면 로드
				if (task.prd_id) {
					const prdResponse = await fetch(`/api/prds/${task.prd_id}`);
					if (prdResponse.ok) {
						linkedPrd = await prdResponse.json();
					}
				}
				
				// 연결된 설계가 있으면 로드
				if (task.design_id) {
					const designResponse = await fetch(`/api/designs/${task.design_id}`);
					if (designResponse.ok) {
						linkedDesign = await designResponse.json();
					}
				}
				
				// 연결된 문서들 로드
				try {
					const documentsResponse = await fetch(`/api/documents?linked_entity_type=task&linked_entity_id=${task.id}`);
					if (documentsResponse.ok) {
						const documentsData = await documentsResponse.json();
						linkedDocuments = documentsData.documents || [];
					}
				} catch (e) {
					console.error('연결된 문서 로딩 실패:', e);
				}

				// 추가 연결들 로드
				try {
					const connectionsResponse = await fetch(`/api/tasks/${task.id}/connections`);
					if (connectionsResponse.ok) {
						const connections = await connectionsResponse.json();
						additionalConnections = await loadConnectionDetails(connections);
					}
				} catch (e) {
					console.error('추가 연결 로딩 실패:', e);
				}
			} else {
				error = '작업을 찾을 수 없습니다';
			}
		} catch (e) {
			error = '데이터를 불러오는 중 오류가 발생했습니다';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{task?.title || '작업 상세보기'} - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">작업 상세보기</h1>
			<p class="text-gray-600 mt-1">작업 상세 정보</p>
		</div>
		<div class="flex space-x-3">
			<a href="/tasks" class="btn btn-secondary">← 목록으로</a>
			{#if task}
				<a href="/tasks/{task.id}/edit" class="btn btn-primary">편집</a>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="text-gray-500">데이터를 불러오는 중...</div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<div class="text-red-800">{error}</div>
		</div>
	{:else if task}
		<div class="space-y-6">
			<!-- 기본 정보 -->
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
						<div class="text-gray-900 font-medium">{task.title}</div>
						<div class="text-xs text-gray-500 mt-1 font-mono">ID: {task.id}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
						<span class="badge {task.status === 'done' ? 'bg-green-100 text-green-800' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : task.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
							{task.status === 'done' ? '완료' : task.status === 'in_progress' ? '진행중' : task.status === 'blocked' ? '차단됨' : '대기중'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
						<span class="badge {task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
							{task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
						</span>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">담당자</label>
						<div class="text-gray-600">{task.assignee || '-'}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">예상 시간</label>
						<div class="text-gray-600">{task.estimatedHours || 0}시간</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">실제 시간</label>
						<div class="text-gray-600">{task.actualHours || 0}시간</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">마감일</label>
						<div class="text-gray-600">{task.dueDate ? formatDate(task.dueDate) : '-'}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">생성일</label>
						<div class="text-gray-600">{formatDate(task.createdAt)}</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">최종 수정일</label>
						<div class="text-gray-600">{formatDate(task.updatedAt)}</div>
					</div>
				</div>
				
				{#if task.description}
					<div class="mt-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
						<div class="text-gray-900 whitespace-pre-wrap">{task.description}</div>
					</div>
				{/if}
			</div>

			<!-- 연결된 요구사항 -->
			{#if linkedPrd}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">연결된 요구사항</h2>
					<div class="p-4 bg-gray-50 rounded-lg border">
						<div class="flex items-start justify-between mb-2">
							<div>
								<h3 class="font-medium text-gray-900 mb-1">
									<a href="/prds/{linkedPrd.id}" class="text-blue-600 hover:text-blue-800 hover:underline">
										{linkedPrd.title}
									</a>
								</h3>
								<div class="flex items-center space-x-2 mb-2">
									<span class="badge {linkedPrd.priority === 'high' ? 'bg-red-100 text-red-800' : linkedPrd.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
										{linkedPrd.priority === 'high' ? '높음' : linkedPrd.priority === 'medium' ? '보통' : '낮음'}
									</span>
									<span class="badge {linkedPrd.status === 'active' ? 'bg-green-100 text-green-800' : linkedPrd.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
										{linkedPrd.status === 'active' ? '활성' : linkedPrd.status === 'completed' ? '완료' : linkedPrd.status === 'draft' ? '초안' : linkedPrd.status}
									</span>
								</div>
							</div>
						</div>
						{#if linkedPrd.description}
							<div class="text-gray-600 text-sm">
								{linkedPrd.description.length > 150 ? linkedPrd.description.substring(0, 150) + '...' : linkedPrd.description}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- 연결된 설계 -->
			{#if linkedDesign}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">연결된 설계</h2>
					<div class="p-4 bg-gray-50 rounded-lg border">
						<div class="flex items-start justify-between mb-2">
							<div>
								<h3 class="font-medium text-gray-900 mb-1">
									<a href="/designs/{linkedDesign.id}" class="text-blue-600 hover:text-blue-800 hover:underline">
										{linkedDesign.title}
									</a>
								</h3>
								<div class="flex items-center space-x-2 mb-2">
									<span class="badge {linkedDesign.design_type === 'system' ? 'bg-blue-100 text-blue-800' : linkedDesign.design_type === 'architecture' ? 'bg-purple-100 text-purple-800' : linkedDesign.design_type === 'ui_ux' ? 'bg-pink-100 text-pink-800' : linkedDesign.design_type === 'database' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
										{linkedDesign.design_type === 'system' ? '시스템' : linkedDesign.design_type === 'architecture' ? '아키텍처' : linkedDesign.design_type === 'ui_ux' ? 'UI/UX' : linkedDesign.design_type === 'database' ? '데이터베이스' : 'API'}
									</span>
									<span class="badge {linkedDesign.priority === 'high' ? 'bg-red-100 text-red-800' : linkedDesign.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
										{linkedDesign.priority === 'high' ? '높음' : linkedDesign.priority === 'medium' ? '보통' : '낮음'}
									</span>
									<span class="badge {linkedDesign.status === 'draft' ? 'bg-gray-100 text-gray-800' : linkedDesign.status === 'review' ? 'bg-yellow-100 text-yellow-800' : linkedDesign.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
										{linkedDesign.status === 'draft' ? '초안' : linkedDesign.status === 'review' ? '검토중' : linkedDesign.status === 'approved' ? '승인됨' : '구현완료'}
									</span>
								</div>
							</div>
						</div>
						{#if linkedDesign.description}
							<div class="text-gray-600 text-sm">
								{linkedDesign.description.length > 150 ? linkedDesign.description.substring(0, 150) + '...' : linkedDesign.description}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- 연결된 문서 -->
			{#if linkedDocuments && linkedDocuments.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">연결된 문서</h2>
					<div class="space-y-3">
						{#each linkedDocuments as document}
							<div class="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
								<div class="flex items-start justify-between mb-2">
									<div class="flex-1">
										<h3 class="font-medium text-gray-900 mb-1">
											<a href="/documents/{document.id}" class="text-blue-600 hover:text-blue-800 hover:underline">
												{document.title}
											</a>
										</h3>
										<div class="flex items-center space-x-2 mb-2">
											<span class="badge bg-blue-100 text-blue-800">
												{document.doc_type === 'test_guide' ? '테스트 가이드' : 
												 document.doc_type === 'test_results' ? '테스트 결과' :
												 document.doc_type === 'analysis' ? '분석' :
												 document.doc_type === 'report' ? '보고서' :
												 document.doc_type === 'checklist' ? '체크리스트' :
												 document.doc_type === 'specification' ? '사양서' :
												 document.doc_type === 'meeting_notes' ? '회의록' :
												 document.doc_type === 'decision_log' ? '의사결정 로그' : document.doc_type}
											</span>
											{#if document.link_type}
												<span class="badge bg-green-100 text-green-800">
													{document.link_type}
												</span>
											{/if}
											{#if document.category}
												<span class="badge bg-gray-100 text-gray-800">
													{document.category}
												</span>
											{/if}
										</div>
									</div>
									<div class="text-xs text-gray-500">
										ID: {document.id}
									</div>
								</div>
								{#if document.summary}
									<div class="text-gray-600 text-sm">
										{document.summary.length > 150 ? document.summary.substring(0, 150) + '...' : document.summary}
									</div>
								{/if}
								{#if document.tags && document.tags.length > 0}
									<div class="mt-2 flex flex-wrap gap-1">
										{#each document.tags as tag}
											<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
												{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 추가 연결 -->
			{#if additionalConnections && additionalConnections.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">추가 연결</h2>
					<div class="space-y-3">
						{#each additionalConnections as connection}
							<div class="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
								<div class="flex items-start justify-between mb-2">
									<div class="flex-1">
										<h3 class="font-medium text-gray-900 mb-1">
											<a href="/{connection.entity_type}s/{connection.entity_id}" class="text-blue-600 hover:text-blue-800 hover:underline">
												{connection.title}
											</a>
										</h3>
										<div class="flex items-center space-x-2 mb-2">
											<span class="badge bg-purple-100 text-purple-800">
												{connection.type_label}
											</span>
											{#if connection.entityData?.status}
												<span class="badge bg-green-100 text-green-800">
													{connection.entityData.status}
												</span>
											{/if}
										</div>
									</div>
									<div class="text-xs text-gray-500">
										ID: {connection.entity_id}
									</div>
								</div>
								{#if connection.entityData?.description || connection.entityData?.summary}
									<div class="text-gray-600 text-sm">
										{(connection.entityData.description || connection.entityData.summary || '').length > 150 
											? (connection.entityData.description || connection.entityData.summary).substring(0, 150) + '...' 
											: (connection.entityData.description || connection.entityData.summary)}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 태그 -->
			{#if task.tags && task.tags.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">태그</h2>
					<div class="flex flex-wrap gap-2">
						{#each task.tags as tag}
							<span class="badge bg-blue-100 text-blue-800">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 상세 내용 -->
			{#if task.details}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">상세 내용</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{task.details}</div>
				</div>
			{/if}

			<!-- 완료 기준 -->
			{#if task.acceptanceCriteria && task.acceptanceCriteria.length > 0}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">완료 기준</h2>
					<div class="space-y-3">
						{#each task.acceptanceCriteria as criteria, index}
							<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
								<span class="text-sm text-gray-500 font-medium min-w-0">{index + 1}.</span>
								<span class="text-sm text-gray-700">{criteria}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 테스트 전략 -->
			{#if task.testStrategy}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">테스트 전략</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{task.testStrategy}</div>
				</div>
			{/if}

			<!-- 메모 -->
			{#if task.notes}
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">메모</h2>
					<div class="text-gray-900 whitespace-pre-wrap">{task.notes}</div>
				</div>
			{/if}

		</div>
	{/if}
</div>

<style>
	.badge {
		@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
	}
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
</style>