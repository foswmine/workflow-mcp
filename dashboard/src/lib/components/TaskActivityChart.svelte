<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	export let data = [];
	
	let canvas;
	let chart;

	onMount(() => {
		if (canvas) {
			const ctx = canvas.getContext('2d');
			
			// 빈 데이터일 때 기본 데이터로 초기화
			const chartData = data.length > 0 ? data : [
				{ date: new Date().toISOString().split('T')[0], task_count: 0, completed_count: 0 }
			];
			
			chart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: chartData.map(item => new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })),
					datasets: [
						{
							label: '전체 작업',
							data: chartData.map(item => item.task_count),
							borderColor: 'rgb(59, 130, 246)',
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							fill: true,
							tension: 0.4
						},
						{
							label: '완료된 작업',
							data: chartData.map(item => item.completed_count),
							borderColor: 'rgb(34, 197, 94)',
							backgroundColor: 'rgba(34, 197, 94, 0.1)',
							fill: true,
							tension: 0.4
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						y: {
							beginAtZero: true,
							ticks: {
								precision: 0
							}
						}
					},
					plugins: {
						legend: {
							display: true,
							position: 'bottom'
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