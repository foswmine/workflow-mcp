<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let environments = [];
	let projects = [];
	let loading = false;
	let error = null;

	// Form data
	let formData = {
		title: '',
		description: '',
		environment_id: '',
		project_id: '',
		version: '',
		deployment_type: 'rolling',
		scheduled_at: '',
		rollback_version: '',
		tags: '',
		notes: '',
		deployment_config: {
			timeout: 300,
			max_parallel: 2,
			health_check_enabled: true
		}
	};

	onMount(async () => {
		await Promise.all([loadEnvironments(), loadProjects()]);
	});

	async function loadEnvironments() {
		try {
			const response = await fetch('/api/environments');
			if (response.ok) {
				environments = await response.json();
			}
		} catch (e) {
			console.error('환경 로딩 실패:', e);
		}
	}

	async function loadProjects() {
		try {
			const response = await fetch('/api/projects');
			if (response.ok) {
				const result = await response.json();
				projects = result.projects || result;
			}
		} catch (e) {
			console.error('프로젝트 로딩 실패:', e);
		}
	}

	async function createDeployment() {
		if (!formData.title || !formData.description || !formData.environment_id || !formData.version) {
			error = '필수 필드를 모두 입력해주세요';
			return;
		}

		try {
			loading = true;
			error = null;

			const deploymentData = {
				...formData,
				tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
				scheduled_at: formData.scheduled_at || null,
				deployment_config: formData.deployment_config
			};

			const response = await fetch('/api/deployments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(deploymentData)
			});

			if (response.ok) {
				const deployment = await response.json();
				goto(`/deployments/${deployment.id}`);
			} else {
				const result = await response.json();
				error = result.error || '배포 생성에 실패했습니다';
			}
		} catch (e) {
			error = '배포 생성 중 오류: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function generateScheduledDateTime() {
		const now = new Date();
		now.setHours(now.getHours() + 1); // 1시간 후로 설정
		formData.scheduled_at = now.toISOString().slice(0, 16);
	}

	function generateVersion() {
		const now = new Date();
		formData.version = `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;
	}
</script>

<svelte:head>
	<title>새 배포 생성 - WorkflowMCP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">새 배포 생성</h1>
		<p class="text-gray-600 mt-2">새로운 배포를 계획하고 설정합니다</p>
	</div>

	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
			{error}
		</div>
	{/if}

	<form on:submit|preventDefault={createDeployment} class="space-y-6">
		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="md:col-span-2">
					<label class="block text-sm font-medium text-gray-700 mb-2" for="title">
						배포 제목 *
					</label>
					<input
						type="text"
						id="title"
						bind:value={formData.title}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="예: 프로덕션 v2.1.0 배포"
						required
					/>
				</div>

				<div class="md:col-span-2">
					<label class="block text-sm font-medium text-gray-700 mb-2" for="description">
						설명 *
					</label>
					<textarea
						id="description"
						bind:value={formData.description}
						rows="3"
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="배포 내용과 목적을 설명해주세요"
						required
					></textarea>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="environment">
						대상 환경 *
					</label>
					<select
						id="environment"
						bind:value={formData.environment_id}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						required
					>
						<option value="">환경을 선택하세요</option>
						{#each environments as env}
							<option value={env.id}>{env.name} ({env.environment_type})</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="project">
						프로젝트 (선택사항)
					</label>
					<select
						id="project"
						bind:value={formData.project_id}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">프로젝트를 선택하세요</option>
						{#each projects as project}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">배포 설정</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="version">
						버전 *
					</label>
					<div class="flex gap-2">
						<input
							type="text"
							id="version"
							bind:value={formData.version}
							class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="v1.0.0"
							required
						/>
						<button
							type="button"
							on:click={generateVersion}
							class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
						>
							자동생성
						</button>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="deployment_type">
						배포 방식
					</label>
					<select
						id="deployment_type"
						bind:value={formData.deployment_type}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="rolling">롤링 배포</option>
						<option value="blue_green">블루-그린 배포</option>
						<option value="canary">카나리 배포</option>
						<option value="hotfix">핫픽스 배포</option>
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="scheduled_at">
						예정 시간 (선택사항)
					</label>
					<div class="flex gap-2">
						<input
							type="datetime-local"
							id="scheduled_at"
							bind:value={formData.scheduled_at}
							class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<button
							type="button"
							on:click={generateScheduledDateTime}
							class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
						>
							1시간 후
						</button>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="rollback_version">
						롤백 버전 (선택사항)
					</label>
					<input
						type="text"
						id="rollback_version"
						bind:value={formData.rollback_version}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="문제 발생 시 롤백할 버전"
					/>
				</div>
			</div>
		</div>

		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">추가 설정</h2>
			
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="tags">
						태그 (쉼표로 구분)
					</label>
					<input
						type="text"
						id="tags"
						bind:value={formData.tags}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="production, urgent, feature-release"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="notes">
						추가 메모
					</label>
					<textarea
						id="notes"
						bind:value={formData.notes}
						rows="3"
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="배포와 관련된 추가 정보나 주의사항"
					></textarea>
				</div>
			</div>
		</div>

		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">배포 구성</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="timeout">
						타임아웃 (초)
					</label>
					<input
						type="number"
						id="timeout"
						bind:value={formData.deployment_config.timeout}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						min="60"
						max="3600"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2" for="max_parallel">
						최대 병렬 수
					</label>
					<input
						type="number"
						id="max_parallel"
						bind:value={formData.deployment_config.max_parallel}
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						min="1"
						max="10"
					/>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						id="health_check"
						bind:checked={formData.deployment_config.health_check_enabled}
						class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
					/>
					<label class="ml-2 block text-sm font-medium text-gray-700" for="health_check">
						헬스체크 활성화
					</label>
				</div>
			</div>
		</div>

		<div class="flex justify-end gap-3">
			<button
				type="button"
				on:click={() => history.back()}
				class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
			>
				취소
			</button>
			<button
				type="submit"
				disabled={loading}
				class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg"
			>
				{loading ? '생성 중...' : '배포 생성'}
			</button>
		</div>
	</form>
</div>