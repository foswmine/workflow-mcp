<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let templates = [];
	let loading = true;
	let error = '';
	let sortBy = 'updated_desc';

	const sortOptions = [
		{ value: 'updated_desc', label: '최근 수정' },
		{ value: 'created_desc', label: '최근 등록' },
		{ value: 'title_asc', label: '제목 순' }
	];

	const templateTypeLabels = {
		component: '컴포넌트',
		function: '함수',
		class: '클래스',
		module: '모듈',
		config: '설정',
		test: '테스트',
		snippet: '스니펫',
		pattern: '패턴',
		boilerplate: '보일러플레이트'
	};

	const templateTypeIcons = {
		component: '🧩',
		function: '⚡',
		class: '🏗️',
		module: '📦',
		config: '⚙️',
		test: '🧪',
		snippet: '✂️',
		pattern: '🔄',
		boilerplate: '📋'
	};

	const templateTypeColors = {
		component: 'bg-blue-100 text-blue-800',
		function: 'bg-green-100 text-green-800',
		class: 'bg-purple-100 text-purple-800',
		module: 'bg-indigo-100 text-indigo-800',
		config: 'bg-teal-100 text-teal-800',
		test: 'bg-pink-100 text-pink-800',
		snippet: 'bg-orange-100 text-orange-800',
		pattern: 'bg-yellow-100 text-yellow-800',
		boilerplate: 'bg-gray-100 text-gray-800'
	};

	const languageIcons = {
		javascript: '🟨',
		typescript: '🔷',
		python: '🐍',
		java: '☕',
		'c++': '⚙️',
		'c#': '🟦',
		go: '🐹',
		rust: '🦀',
		php: '🐘',
		ruby: '💎',
		swift: '🍎',
		kotlin: '🟪',
		html: '🌐',
		css: '🎨',
		sql: '🗄️'
	};

	onMount(loadTemplates);

	async function loadTemplates() {
		try {
			loading = true;
			error = '';
			const response = await fetch(`/api/code_templates?sort_by=${sortBy}`);
			if (!response.ok) {
				throw new Error('코드 템플릿 목록을 불러오지 못했습니다.');
			}

			const data = await response.json();
			templates = Array.isArray(data) ? data : [];
		} catch (err) {
			console.error('Failed to load code templates:', err);
			error = err.message || '코드 템플릿 목록을 불러오지 못했습니다.';
		} finally {
			loading = false;
		}
	}

	function handleSortChange(event) {
		sortBy = event.target.value;
		loadTemplates();
	}

	function getLanguageIcon(language) {
		return languageIcons[language?.toLowerCase()] || '📄';
	}

	function getTypeIcon(type) {
		return templateTypeIcons[type] || '📄';
	}

	function getTypeLabel(type) {
		return templateTypeLabels[type] || '기타';
	}

	function getTypeColor(type) {
		return templateTypeColors[type] || 'bg-blue-100 text-blue-800';
	}

	function getComplexityColor(complexity) {
		switch (complexity) {
			case 'beginner': return 'bg-green-100 text-green-800';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800';
			case 'advanced': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getComplexityLabel(complexity) {
		switch (complexity) {
			case 'beginner': return '초급';
			case 'intermediate': return '중급';
			case 'advanced': return '고급';
			default: return '미지정';
		}
	}

	async function deleteTemplate(id) {
		if (!confirm('이 코드 템플릿을 삭제하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/code_templates/${id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const details = await response.json().catch(() => ({}));
				throw new Error(details.error || '코드 템플릿 삭제에 실패했습니다.');
			}

			await loadTemplates();
			alert('코드 템플릿을 삭제했습니다.');
		} catch (err) {
			console.error('Failed to delete code template:', err);
			alert(err.message || '코드 템플릿 삭제에 실패했습니다.');
		}
	}
</script>

<svelte:head>
	<title>코드 템플릿 관리 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">코드 템플릿 관리</h1>
			<p class="text-gray-600 mt-1">재사용 가능한 코드 템플릿을 체계적으로 관리합니다</p>
		</div>
		<button
			class="btn btn-primary"
			on:click={() => goto('/code_templates/new')}
		>
			💻 새 템플릿 생성
		</button>
	</div>

	<div class="flex flex-col md:flex-row md:items-center gap-4">
		<div class="flex items-center gap-3">
			<label class="text-sm text-gray-600">정렬:</label>
			<select
				class="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
				bind:value={sortBy}
				on:change={handleSortChange}
			>
				{#each sortOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
		<button
			class="btn btn-secondary w-full md:w-auto"
			on:click={loadTemplates}
		>
			🔄 새로고침
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
			<div class="text-red-800 font-medium mb-2">오류가 발생했습니다</div>
			<p class="text-red-600 mb-4">{error}</p>
			<button class="btn btn-primary" on:click={loadTemplates}>다시 시도</button>
		</div>
	{:else if templates.length === 0}
		<div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
			<div class="text-gray-400 text-6xl mb-4">💻</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">등록된 코드 템플릿이 없습니다</h3>
			<p class="text-gray-500 mb-6">첫 번째 코드 템플릿을 생성해보세요</p>
			<button class="btn btn-primary" on:click={() => goto('/code_templates/new')}>
				💻 새 템플릿 생성
			</button>
		</div>
	{:else}
		<div class="bg-white shadow-sm rounded-lg border border-gray-200">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">언어</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">복잡도</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수정일</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each templates as template}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<span class="text-xl mr-2">{getLanguageIcon(template.language)}</span>
										<span class="text-sm font-medium text-gray-900">{template.language || 'Generic'}</span>
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm font-medium text-gray-900">{template.title}</div>
									{#if template.description}
										<div class="text-sm text-gray-500">{template.description}</div>
									{/if}
									{#if template.category}
										<div class="text-xs text-blue-600 mt-1">카테고리: {template.category}</div>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<span class="text-lg mr-2">{getTypeIcon(template.template_type)}</span>
										<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getTypeColor(template.template_type)}">
											{getTypeLabel(template.template_type)}
										</span>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getComplexityColor(template.complexity_level)}">
										{getComplexityLabel(template.complexity_level)}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{template.updated_at ? new Date(template.updated_at).toLocaleDateString() : '-'}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex justify-end space-x-3 text-sm font-medium">
										<a
											href={`/code_templates/${template.id}`}
											class="text-blue-600 hover:text-blue-900"
											on:click|preventDefault={() => goto(`/code_templates/${template.id}`)}
										>
											상세보기
										</a>
										<a
											href={`/code_templates/${template.id}/edit`}
											class="text-indigo-600 hover:text-indigo-900"
											on:click|preventDefault={() => goto(`/code_templates/${template.id}/edit`)}
										>
											편집
										</a>
										<button
											class="text-red-600 hover:text-red-900"
											on:click={() => deleteTemplate(template.id)}
										>
											삭제
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>