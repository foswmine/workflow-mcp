<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  export let data;

  let incident = null;
  let loading = true;
  let error = null;
  let showEditModal = false;
  let editForm = {
    title: '',
    description: '',
    severity: '',
    incident_type: '',
    status: '',
    resolution_notes: ''
  };

  onMount(async () => {
    await loadIncident();
  });

  async function loadIncident() {
    try {
      loading = true;
      const response = await fetch(`/api/incidents/${$page.params.id}`);
      
      if (!response.ok) {
        throw new Error('인시던트를 찾을 수 없습니다');
      }
      
      incident = await response.json();
      
      // Initialize edit form
      editForm = {
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        incident_type: incident.incident_type,
        status: incident.status,
        resolution_notes: incident.resolution_notes || ''
      };
      
      error = null;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function updateIncident() {
    try {
      const response = await fetch(`/api/incidents/${incident.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('인시던트 수정에 실패했습니다');
      }

      await loadIncident();
      showEditModal = false;
      alert('인시던트가 수정되었습니다');
    } catch (err) {
      alert('오류: ' + err.message);
    }
  }

  function getSeverityColor(severity) {
    const colors = {
      'critical': 'bg-red-100 text-red-800',
      'high': 'bg-orange-100 text-orange-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  }

  function getStatusColor(status) {
    const colors = {
      'open': 'bg-red-100 text-red-800',
      'investigating': 'bg-yellow-100 text-yellow-800',
      'identified': 'bg-blue-100 text-blue-800',
      'monitoring': 'bg-purple-100 text-purple-800',
      'resolved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('ko-KR');
  }
</script>

<svelte:head>
  <title>{incident ? `인시던트: ${incident.title}` : '인시던트 상세'} - WorkflowMCP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Navigation -->
  <div class="mb-6">
    <nav class="flex" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-3">
        <li class="inline-flex items-center">
          <a href="/operations" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
            운영 관리
          </a>
        </li>
        <li>
          <div class="flex items-center">
            <span class="text-gray-400">/</span>
            <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">인시던트 상세</span>
          </div>
        </li>
      </ol>
    </nav>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2">로딩 중...</span>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {:else if incident}
    <!-- Header -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{incident.title}</h1>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-sm font-medium {getSeverityColor(incident.severity)}">
            {incident.severity}
          </span>
          <span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(incident.status)}">
            {incident.status}
          </span>
          <span class="text-sm text-gray-500">
            생성일: {formatDate(incident.created_at)}
          </span>
        </div>
      </div>
      <div class="flex gap-2">
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          on:click={() => showEditModal = true}
        >
          수정
        </button>
        <button 
          class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          on:click={loadIncident}
        >
          새로고침
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Description -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">인시던트 설명</h2>
          <p class="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
        </div>

        <!-- Resolution Notes -->
        {#if incident.resolution_notes}
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">해결 방안</h2>
            <p class="text-gray-700 whitespace-pre-wrap">{incident.resolution_notes}</p>
          </div>
        {/if}

        <!-- Affected Services -->
        {#if incident.affected_services && incident.affected_services.length > 0}
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">영향받는 서비스</h2>
            <div class="flex flex-wrap gap-2">
              {#each incident.affected_services as service}
                <span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {service}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Sidebar Info -->
      <div class="space-y-6">
        <!-- Basic Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">ID</dt>
              <dd class="text-sm text-gray-900 font-mono">{incident.id}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">유형</dt>
              <dd class="text-sm text-gray-900">{incident.incident_type}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">생성일</dt>
              <dd class="text-sm text-gray-900">{formatDate(incident.created_at)}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">수정일</dt>
              <dd class="text-sm text-gray-900">{formatDate(incident.updated_at)}</dd>
            </div>
            {#if incident.detected_at}
              <div>
                <dt class="text-sm font-medium text-gray-500">탐지일</dt>
                <dd class="text-sm text-gray-900">{formatDate(incident.detected_at)}</dd>
              </div>
            {/if}
          </dl>
        </div>

        <!-- Tags -->
        {#if incident.tags && incident.tags.length > 0}
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">태그</h2>
            <div class="flex flex-wrap gap-2">
              {#each incident.tags as tag}
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  #{tag}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Edit Modal -->
{#if showEditModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
      <h2 class="text-xl font-semibold mb-4">인시던트 수정</h2>
      
      <form on:submit|preventDefault={updateIncident} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input 
            type="text" 
            bind:value={editForm.title}
            class="form-input"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <textarea 
            bind:value={editForm.description}
            class="form-textarea h-24"
            required
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">심각도</label>
            <select bind:value={editForm.severity} class="form-select">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select bind:value={editForm.status} class="form-select">
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">유형</label>
          <select bind:value={editForm.incident_type} class="form-select">
            <option value="outage">Outage</option>
            <option value="performance">Performance</option>
            <option value="security">Security</option>
            <option value="data">Data</option>
            <option value="deployment">Deployment</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">해결 방안</label>
          <textarea 
            bind:value={editForm.resolution_notes}
            class="form-textarea h-24"
            placeholder="해결 방안을 입력하세요..."
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <button 
            type="button"
            class="btn btn-secondary"
            on:click={() => showEditModal = false}
          >
            취소
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
          >
            수정
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}