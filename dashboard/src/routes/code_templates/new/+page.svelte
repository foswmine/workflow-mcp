<script>
	import { goto } from '$app/navigation';

	let loading = false;

	const templateTypes = [
		{ value: 'component', label: '컴포넌트' },
		{ value: 'function', label: '함수' },
		{ value: 'class', label: '클래스' },
		{ value: 'module', label: '모듈' },
		{ value: 'config', label: '설정' },
		{ value: 'test', label: '테스트' },
		{ value: 'snippet', label: '스니펫' },
		{ value: 'pattern', label: '패턴' },
		{ value: 'boilerplate', label: '보일러플레이트' }
	];

	const complexityLevels = [
		{ value: 'beginner', label: '초급' },
		{ value: 'intermediate', label: '중급' },
		{ value: 'advanced', label: '고급' }
	];

	let formData = {
		template_type: 'snippet',
		title: '',
		description: '',
		language: '',
		framework: '',
		category: 'snippet',
		subcategory: '',
		template_code: '',
		usage_example: '',
		variables: '',
		tags: '',
		complexity_level: 'intermediate'
	};

	function insertVariable() {
		const varExample = '{\n  "name": "variable_name",\n  "type": "string",\n  "default_value": "default",\n  "description": "Variable description"\n}';

		if (!formData.variables.trim()) {
			formData.variables = `[${varExample}]`;
		} else {
			try {
				const current = JSON.parse(formData.variables);
				if (Array.isArray(current)) {
					current.push(JSON.parse(varExample));
					formData.variables = JSON.stringify(current, null, 2);
				}
			} catch (e) {
				formData.variables += `\n,${varExample}`;
			}
		}
	}

	async function handleSubmit() {
		if (!formData.title.trim()) {
			alert('제목을 입력해주세요.');
			return;
		}

		if (!formData.description.trim()) {
			alert('설명을 입력해주세요.');
			return;
		}

		if (!formData.language.trim()) {
			alert('언어를 입력해주세요.');
			return;
		}

		if (!formData.template_code.trim()) {
			alert('템플릿 코드를 입력해주세요.');
			return;
		}

		try {
			loading = true;

			let parsedVariables = [];
			if (formData.variables.trim()) {
				try {
					parsedVariables = JSON.parse(formData.variables);
				} catch (e) {
					alert('변수 JSON 형식이 올바르지 않습니다.');
					return;
				}
			}

			const tagsArray = formData.tags
				? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
				: [];

			const requestData = {
				template_type: formData.template_type,
				title: formData.title,
				description: formData.description,
				code_content: formData.template_code,
				language: formData.language,
				framework: formData.framework || null,
				category: formData.category,
				subcategory: formData.subcategory || null,
				usage_instructions: formData.usage_example || null,
				parameters: parsedVariables,
				tags: tagsArray,
				keywords: tagsArray,
				complexity_level: formData.complexity_level,
				created_by: 'dashboard_user'
			};

			const response = await fetch('/api/code_templates', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestData)
			});

			if (response.ok) {
				alert('코드 템플릿이 생성되었습니다.');
				goto('/code_templates');
			} else {
				const errorData = await response.json();
				alert('코드 템플릿 생성에 실패했습니다: ' + (errorData.error || '알 수 없는 오류'));
			}
		} catch (e) {
			alert('코드 템플릿 생성에 실패했습니다: ' + e.message);
		} finally {
			loading = false;
		}
	}

	function cancel() {
		goto('/code_templates');
	}
</script>

<svelte:head>
	<title>새 코드 템플릿 생성 - WorkflowMCP</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">새 코드 템플릿 생성</h1>
			<p class="mt-2 text-gray-600">재사용 가능한 코드 스니펫과 보일러플레이트를 생성합니다</p>
		</div>
		<button
			type="button"
			on:click={cancel}
			class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
		>
			취소
		</button>
	</div>

	<div class="bg-white rounded-lg shadow border border-gray-200">
		<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label for="template_type" class="block text-sm font-medium text-gray-700 mb-2">템플릿 유형 *</label>
					<select
						id="template_type"
						bind:value={formData.template_type}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each templateTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="category" class="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
					<select
						id="category"
						bind:value={formData.category}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each templateTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label for="title" class="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
					<input
						type="text"
						id="title"
						bind:value={formData.title}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="템플릿 제목을 입력하세요"
						required
					/>
				</div>

				<div>
					<label for="language" class="block text-sm font-medium text-gray-700 mb-2">언어 *</label>
					<input
						type="text"
						id="language"
						bind:value={formData.language}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="예: javascript, python, java"
						required
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label for="framework" class="block text-sm font-medium text-gray-700 mb-2">프레임워크</label>
					<input
						type="text"
						id="framework"
						bind:value={formData.framework}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="예: react, express, django"
					/>
				</div>

				<div>
					<label for="subcategory" class="block text-sm font-medium text-gray-700 mb-2">하위 카테고리</label>
					<input
						type="text"
						id="subcategory"
						bind:value={formData.subcategory}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="세부 분류"
					/>
				</div>
			</div>

			<div>
				<label for="description" class="block text-sm font-medium text-gray-700 mb-2">설명 *</label>
				<textarea
					id="description"
					bind:value={formData.description}
					rows="4"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="템플릿의 용도와 특징을 설명하세요"
					required
				></textarea>
			</div>

			<div>
				<label for="template_code" class="block text-sm font-medium text-gray-700 mb-2">템플릿 코드 *</label>
				<textarea
					id="template_code"
					bind:value={formData.template_code}
					rows="12"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					placeholder="코드 템플릿을 입력하세요..."
					required
				></textarea>
				<p class="mt-1 text-sm text-gray-500">동적 섹션에는 {{variable_name}}과 같은 플레이스홀더를 사용하세요.</p>
			</div>

			<div>
				<label for="usage_example" class="block text-sm font-medium text-gray-700 mb-2">사용 예제</label>
				<textarea
					id="usage_example"
					bind:value={formData.usage_example}
					rows="6"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					placeholder="템플릿 사용 방법과 예제를 작성하세요"
				></textarea>
			</div>

			<div>
				<div class="flex justify-between items-center mb-2">
					<label for="variables" class="block text-sm font-medium text-gray-700">변수 정의</label>
					<button
						type="button"
						on:click={insertVariable}
						class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-medium transition-colors"
					>
						+ 변수 추가
					</button>
				</div>
				<textarea
					id="variables"
					bind:value={formData.variables}
					rows="6"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					placeholder="변수 설명자의 JSON 배열을 제공하세요"
				></textarea>
				<p class="mt-1 text-sm text-gray-500">변수 설명자의 JSON 배열을 제공하세요.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label for="tags" class="block text-sm font-medium text-gray-700 mb-2">태그</label>
					<input
						type="text"
						id="tags"
						bind:value={formData.tags}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="태그를 쉼표로 구분하여 입력하세요"
					/>
					<p class="mt-1 text-sm text-gray-500">태그를 쉼표(,)로 구분해주세요.</p>
				</div>

				<div>
					<label for="complexity_level" class="block text-sm font-medium text-gray-700 mb-2">복잡도</label>
					<select
						id="complexity_level"
						bind:value={formData.complexity_level}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each complexityLevels as level}
							<option value={level.value}>{level.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
				<button
					type="button"
					on:click={cancel}
					class="btn btn-secondary"
				>
					취소
				</button>
				<button
					type="submit"
					disabled={loading}
					class="btn btn-primary"
				>
					{loading ? '저장 중...' : '템플릿 저장'}
				</button>
			</div>
		</form>
	</div>
</div>