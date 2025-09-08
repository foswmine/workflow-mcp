<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let title = '';
  let description = '';
  let design_type = 'system';
  let requirement_id = '';
  let details = '';
  let priority = 'medium';
  let prds = [];
  let isSubmitting = false;

  const designTypes = [
    { value: 'system', label: '시스템 설계' },
    { value: 'architecture', label: '아키텍처 설계' },
    { value: 'ui_ux', label: 'UI/UX 설계' },
    { value: 'database', label: '데이터베이스 설계' },
    { value: 'api', label: 'API 설계' }
  ];

  const priorities = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  onMount(async () => {
    try {
      const response = await fetch('/api/prds');
      if (response.ok) {
        prds = await response.json();
      }
    } catch (error) {
      console.error('PRD 목록 로드 실패:', error);
    }
  });

  async function handleSubmit() {
    if (!title || !description) {
      alert('제목과 설명을 입력해주세요.');
      return;
    }

    isSubmitting = true;
    
    try {
      const designData = {
        title,
        description,
        design_type,
        details,
        priority,
        requirement_id: requirement_id || null
      };

      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(designData)
      });

      if (response.ok) {
        alert('설계가 성공적으로 생성되었습니다!');
        goto('/designs');
      } else {
        const error = await response.json();
        alert(`설계 생성 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('설계 생성 오류:', error);
      alert('설계 생성 중 오류가 발생했습니다.');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">새 설계 추가</h1>
      <p class="text-gray-600 mt-1">시스템 설계를 추가합니다</p>
    </div>
    <a href="/designs" class="btn btn-secondary">← 설계 목록으로</a>
  </div>

  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">설계 정보</h2>
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
            placeholder="예: 사용자 인증 시스템 설계"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label for="design_type" class="block text-sm font-medium text-gray-700 mb-2">
            설계 유형 *
          </label>
          <select
            id="design_type"
            bind:value={design_type}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {#each designTypes as type}
              <option value={type.value}>{type.label}</option>
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

        <div class="md:col-span-2">
          <label for="requirement_id" class="block text-sm font-medium text-gray-700 mb-2">
            관련 요구사항 (선택)
          </label>
          <select
            id="requirement_id"
            bind:value={requirement_id}
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
            placeholder="설계에 대한 간단한 설명을 입력하세요"
            required
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div class="md:col-span-2">
          <label for="details" class="block text-sm font-medium text-gray-700 mb-2">
            상세 명세
          </label>
          <textarea
            id="details"
            bind:value={details}
            placeholder="구체적인 설계 명세를 입력하세요 (선택사항)"
            rows="8"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
      </div>

      <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <a href="/designs" class="btn btn-secondary">취소</a>
        <button 
          type="submit" 
          class="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? '생성 중...' : '설계 생성'}
        </button>
      </div>
    </form>
  </div>
</div>