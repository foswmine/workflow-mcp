<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let title = '';
  let description = '';
  let type = 'unit';
  let status = 'draft';
  let priority = 'medium';
  let preconditions = '';
  let test_steps = '';
  let expected_result = '';
  let tags = '';
  let task_id = '';
  let design_id = '';
  let prd_id = '';
  let tasks = [];
  let designs = [];
  let prds = [];
  let isSubmitting = false;

  const testTypes = [
    { value: 'unit', label: '단위 테스트' },
    { value: 'integration', label: '통합 테스트' },
    { value: 'system', label: '시스템 테스트' },
    { value: 'acceptance', label: '인수 테스트' },
    { value: 'regression', label: '회귀 테스트' }
  ];

  const statuses = [
    { value: 'draft', label: '초안' },
    { value: 'ready', label: '준비완료' },
    { value: 'active', label: '활성' },
    { value: 'inactive', label: '비활성' }
  ];

  const priorities = [
    { value: 'high', label: '높음' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '낮음' }
  ];

  onMount(async () => {
    try {
      // 모든 관련 데이터를 병렬로 로드
      const [tasksResponse, designsResponse, prdsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/designs'),
        fetch('/api/prds')
      ]);
      
      if (tasksResponse.ok) {
        tasks = await tasksResponse.json();
      }
      
      if (designsResponse.ok) {
        designs = await designsResponse.json();
      }
      
      if (prdsResponse.ok) {
        prds = await prdsResponse.json();
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  });

  async function handleSubmit() {
    if (!title || !description) {
      alert('제목과 설명을 입력해주세요.');
      return;
    }

    isSubmitting = true;
    
    try {
      const testCaseData = {
        title,
        description,
        type,
        status,
        priority,
        preconditions,
        test_steps,
        expected_result,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        task_id: task_id || null,
        design_id: design_id || null,
        prd_id: prd_id || null
      };

      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCaseData)
      });

      if (response.ok) {
        alert('테스트 케이스가 성공적으로 생성되었습니다!');
        goto('/tests');
      } else {
        const error = await response.json();
        alert(`테스트 케이스 생성 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('테스트 케이스 생성 오류:', error);
      alert('테스트 케이스 생성 중 오류가 발생했습니다.');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>새 테스트 케이스 추가 - WorkflowMCP</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">새 테스트 케이스 추가</h1>
      <p class="text-gray-600 mt-1">새로운 테스트 케이스를 추가합니다</p>
    </div>
    <a href="/tests" class="btn btn-secondary">← 테스트 목록으로</a>
  </div>

  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">테스트 케이스 정보</h2>
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="md:col-span-2">
          <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
            제목 *
          </label>
          <input
            type="text"
            id="title"
            bind:value={title}
            placeholder="예: 사용자 로그인 기능 테스트"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
            테스트 유형 *
          </label>
          <select
            id="type"
            bind:value={type}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {#each testTypes as testType}
              <option value={testType.value}>{testType.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
            우선순위
          </label>
          <select
            id="priority"
            bind:value={priority}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {#each priorities as p}
              <option value={p.value}>{p.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
            상태
          </label>
          <select
            id="status"
            bind:value={status}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {#each statuses as s}
              <option value={s.value}>{s.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="task_id" class="block text-sm font-medium text-gray-700 mb-2">
            관련 작업 (선택)
          </label>
          <select
            id="task_id"
            bind:value={task_id}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- 관련 작업 선택 --</option>
            {#each tasks as task}
              <option value={task.id}>{task.title}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="design_id" class="block text-sm font-medium text-gray-700 mb-2">
            관련 설계 (선택)
          </label>
          <select
            id="design_id"
            bind:value={design_id}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- 관련 설계 선택 --</option>
            {#each designs as design}
              <option value={design.id}>{design.title}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="prd_id" class="block text-sm font-medium text-gray-700 mb-2">
            관련 요구사항 (선택)
          </label>
          <select
            id="prd_id"
            bind:value={prd_id}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- 관련 요구사항 선택 --</option>
            {#each prds as prd}
              <option value={prd.id}>{prd.title}</option>
            {/each}
          </select>
        </div>

        <div class="md:col-span-2">
          <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
            설명 *
          </label>
          <textarea
            id="description"
            bind:value={description}
            placeholder="테스트 케이스의 목적과 범위를 상세히 설명해주세요"
            required
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div class="md:col-span-2">
          <label for="preconditions" class="block text-sm font-medium text-gray-700 mb-2">
            전제조건
          </label>
          <textarea
            id="preconditions"
            bind:value={preconditions}
            placeholder="테스트 실행 전에 필요한 조건들을 입력하세요"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div class="md:col-span-2">
          <label for="test_steps" class="block text-sm font-medium text-gray-700 mb-2">
            테스트 단계
          </label>
          <textarea
            id="test_steps"
            bind:value={test_steps}
            placeholder="구체적인 테스트 실행 단계를 순서대로 입력하세요"
            rows="5"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div class="md:col-span-2">
          <label for="expected_result" class="block text-sm font-medium text-gray-700 mb-2">
            예상결과
          </label>
          <textarea
            id="expected_result"
            bind:value={expected_result}
            placeholder="테스트 성공 시 예상되는 결과를 입력하세요"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div class="md:col-span-2">
          <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
            태그 (쉼표로 구분)
          </label>
          <input
            type="text"
            id="tags"
            bind:value={tags}
            placeholder="예: authentication, login, unit-test"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <a href="/tests" class="btn btn-secondary">취소</a>
        <button 
          type="submit" 
          class="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? '생성 중...' : '테스트 케이스 생성'}
        </button>
      </div>
    </form>
  </div>
</div>