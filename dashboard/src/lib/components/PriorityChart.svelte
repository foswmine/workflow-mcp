<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	export let data = [];
	
	let canvas;
	let chart;

	const priorityColors = {
		low: '#10b981',      // 초록색 (emerald-500) - 낮음
		medium: '#3b82f6',   // 파란색 (blue-500) - 보통  
		high: '#f59e0b',     // 주황색 (amber-500) - 높음
		critical: '#ef4444'  // 빨간색 (red-500) - 긴급
	};

	// Helper function to get color with case-insensitive matching
	function getPriorityColor(priority) {
		if (!priority) return '#6b7280';
		const normalizedPriority = priority.toLowerCase();
		return priorityColors[normalizedPriority] || '#6b7280';
	}

	const priorityLabels = {
		low: '낮음',
		medium: '보통',
		high: '높음',
		critical: '긴급'
	};

	// Helper function to get Korean label with case-insensitive matching
	function getPriorityLabel(priority) {
		if (!priority) return priority;
		const normalizedPriority = priority.toLowerCase();
		return priorityLabels[normalizedPriority] || priority;
	}

	onMount(() => {
		if (canvas) {
			const ctx = canvas.getContext('2d');
			
			// 빈 데이터일 때 기본 데이터로 초기화
			const chartData = data.length > 0 ? data : [
				{ priority: 'low', count: 0, completed: 0 }
			];
			
			chart = new Chart(ctx, {
				type: 'doughnut',
				data: {
					labels: chartData.map(item => getPriorityLabel(item.priority)),
					datasets: [{
						data: chartData.map(item => item.count),
						backgroundColor: chartData.map(item => getPriorityColor(item.priority)),
						borderWidth: 2,
						borderColor: '#ffffff'
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							display: true,
							position: 'bottom'
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									const priority = chartData[context.dataIndex];
									const percentage = ((priority.count / chartData.reduce((sum, p) => sum + p.count, 0)) * 100).toFixed(1);
									return `${context.label}: ${priority.count}개 (${percentage}%) - 완료: ${priority.completed}개`;
								}
							}
						}
					}
				}
			});
		}

		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});
</script>

<div class="w-full h-64 relative">
	{#if data.length > 0}
		<canvas bind:this={canvas} class="w-full h-full"></canvas>
	{:else}
		<div class="flex items-center justify-center h-full text-gray-500">
			데이터가 없습니다
		</div>
	{/if}
</div>