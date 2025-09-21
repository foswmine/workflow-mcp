<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let template = null;
	let loading = true;
	let error = null;

	$: templateId = $page.params.id;

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

	const complexityLabels = {
		beginner: '초급',
		intermediate: '중급',
		advanced: '고급'
	};

	onMount(async () => {
		await loadTemplate();
	});

	async function loadTemplate() {
		try {
			loading = true;
			const response = await fetch(`/api/code_templates/${templateId}`);
			if (response.ok) {
				template = await response.json();
			} else {
				error = '코드 템플릿을 불러오지 못했습니다.';
			}
		} catch (e) {
			error = '코드 템플릿을 불러오지 못했습니다: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function deleteTemplate() {
		if (!confirm('이 코드 템플릿을 삭제하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/code_templates/${templateId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				alert('코드 템플릿이 삭제되었습니다.');
				goto('/code_templates');
			} else {
				const errorData = await response.json();
				alert('코드 템플릿 삭제에 실패했습니다: ' + (errorData.error || '알 수 없는 오류'));
			}
		} catch (e) {
			alert('코드 템플릿 삭제에 실패했습니다: ' + e.message);
		}
	}

	function getLanguageIcon(language) {
		const icons = {
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
		return icons[language?.toLowerCase()] || '📄';
	}

	function getTypeColor(type) {
		const colors = {
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
		return colors[type] || 'bg-blue-100 text-blue-800';
	}

	function getComplexityColor(complexity) {
		switch (complexity) {
			case 'beginner': return 'bg-green-100 text-green-800';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800';
			case 'advanced': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	async function copyToClipboard(text) {
		try {
			await navigator.clipboard.writeText(text);
			alert('코드가 클립보드에 복사되었습니다!');
		} catch (err) {
			console.error('Failed to copy: ', err);
			alert('클립보드 복사에 실패했습니다.');
		}
	}
</script>

<svelte:head>
	<title>{template ? template.title : '로딩 중...'} - 코드 템플릿</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-3 text-gray-600">로딩 중...</span>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
			<div class="text-red-800 font-medium mb-2">오류가 발생했습니다</div>
			<p class="text-red-600 mb-4">{error}</p>
			<button
				on:click={() => goto('/code_templates')}
				class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
			>
				목록으로 돌아가기
			</button>
		</div>
	{:else if template}
		<div class="flex justify-between items-start">
			<div class="flex-1">
				<div class="flex items-center space-x-3 mb-2">
					<span class="text-2xl">{getLanguageIcon(template.language)}</span>
					<h1 class="text-3xl font-bold text-gray-900">{template.title}</h1>
				</div>
				<div class="flex items-center space-x-4 text-sm text-gray-600">
					<span>{template.language || 'Generic'}</span>
					<span>•</span>
					<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getTypeColor(template.template_type)}">
						{templateTypeLabels[template.template_type] || template.template_type}
					</span>
					<span>•</span>
					<span>수정일: {new Date(template.updated_at).toLocaleDateString()}</span>
				</div>
				{#if template.description}
					<p class="mt-3 text-gray-600">{template.description}</p>
				{/if}
			</div>
			<div class="flex space-x-3">
				<button
					on:click={() => copyToClipboard(template.code_content)}
					class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
				>
					📋 코드 복사
				</button>
				<button
					on:click={() => goto(`/code_templates/${template.id}/edit`)}
					class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
				>
					편집
				</button>
				<button
					on:click={deleteTemplate}
					class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
				>
					삭제
				</button>
				<button
					on:click={() => goto('/code_templates')}
					class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
				>
					목록으로
				</button>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex justify-between items-center mb-4">
						<h2 class="text-xl font-semibold text-gray-900">템플릿 코드</h2>
						<button
							on:click={() => copyToClipboard(template.code_content)}
							class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
						>
							📋 복사
						</button>
					</div>
					<div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
						<pre class="text-green-400 text-sm font-mono whitespace-pre-wrap">{template.code_content}</pre>
					</div>
				</div>

				{#if template.usage_instructions}
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">사용 예제</h2>
						<div class="bg-gray-50 rounded-lg p-4 border">
							<pre class="text-gray-800 text-sm font-mono whitespace-pre-wrap">{template.usage_instructions}</pre>
						</div>
					</div>
				{/if}

				{#if template.parameters && template.parameters.length > 0}
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">변수 정의</h2>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">변수명</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">기본값</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200">
									{#each template.parameters as parameter}
										<tr>
											<td class="px-4 py-2 text-sm font-mono text-blue-600">{parameter.name}</td>
											<td class="px-4 py-2 text-sm text-gray-900">{parameter.type || 'string'}</td>
											<td class="px-4 py-2 text-sm text-gray-500">{parameter.default_value || '-'}</td>
											<td class="px-4 py-2 text-sm text-gray-600">{parameter.description || '-'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				{#if template.keywords && template.keywords.length > 0}
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">키워드</h2>
						<div class="flex flex-wrap gap-2">
							{#each template.keywords as keyword}
								<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
									{keyword}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="space-y-6">
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
					<div class="space-y-3">
						<div>
							<dt class="text-sm font-medium text-gray-500">언어</dt>
							<dd class="mt-1 text-sm text-gray-900 flex items-center">
								<span class="mr-2">{getLanguageIcon(template.language)}</span>
								{template.language || 'Generic'}
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">템플릿 유형</dt>
							<dd class="mt-1">
								<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getTypeColor(template.template_type)}">
									{templateTypeLabels[template.template_type] || template.template_type}
								</span>
							</dd>
						</div>
						{#if template.complexity_level}
							<div>
								<dt class="text-sm font-medium text-gray-500">복잡도</dt>
								<dd class="mt-1">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getComplexityColor(template.complexity_level)}">
										{complexityLabels[template.complexity_level] || template.complexity_level}
									</span>
								</dd>
							</div>
						{/if}
						{#if template.framework}
							<div>
								<dt class="text-sm font-medium text-gray-500">프레임워크</dt>
								<dd class="mt-1 text-sm text-gray-900">{template.framework}</dd>
							</div>
						{/if}
						{#if template.category}
							<div>
								<dt class="text-sm font-medium text-gray-500">카테고리</dt>
								<dd class="mt-1 text-sm text-gray-900">{template.category}</dd>
							</div>
						{/if}
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">이력 정보</h3>
					<div class="space-y-3">
						<div>
							<dt class="text-sm font-medium text-gray-500">생성일</dt>
							<dd class="mt-1 text-sm text-gray-900">{new Date(template.created_at).toLocaleString()}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">수정일</dt>
							<dd class="mt-1 text-sm text-gray-900">{new Date(template.updated_at).toLocaleString()}</dd>
						</div>
						{#if template.created_by}
							<div>
								<dt class="text-sm font-medium text-gray-500">작성자</dt>
								<dd class="mt-1 text-sm text-gray-900">{template.created_by}</dd>
							</div>
						{/if}
						{#if template.quality_score}
							<div>
								<dt class="text-sm font-medium text-gray-500">품질 점수</dt>
								<dd class="mt-1 text-sm text-gray-900">{Math.round(template.quality_score * 100)}%</dd>
							</div>
						{/if}
						{#if template.usage_count}
							<div>
								<dt class="text-sm font-medium text-gray-500">사용 횟수</dt>
								<dd class="mt-1 text-sm text-gray-900">{template.usage_count}회</dd>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>