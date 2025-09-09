<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	export let data = [];
	export let type = 'tasks'; // 'tasks' or 'projects'
	
	let container;
	let width = 800;
	let height = 400;
	
	const margin = { top: 20, right: 30, bottom: 40, left: 200 };

	onMount(() => {
		if (container) {
			const resizeObserver = new ResizeObserver(() => {
				updateDimensions();
				renderChart();
			});
			resizeObserver.observe(container);
			
			updateDimensions();
			renderChart();
			
			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	function updateDimensions() {
		if (container) {
			width = container.clientWidth;
			height = Math.max(400, data.length * 40 + margin.top + margin.bottom);
		}
	}

	function renderChart() {
		if (!container || data.length === 0) return;

		// Clear previous chart
		d3.select(container).select('svg').remove();

		const svg = d3.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height);

		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Process data for gantt chart
		const processedData = processData(data);
		
		if (processedData.length === 0) {
			// Show "No data" message
			g.append('text')
				.attr('x', chartWidth / 2)
				.attr('y', chartHeight / 2)
				.attr('text-anchor', 'middle')
				.attr('class', 'text-gray-500')
				.text('표시할 데이터가 없습니다');
			return;
		}

		// Set up scales with safe date handling
		const allDates = processedData.flatMap(d => [d.startDate, d.endDate]).filter(date => date && !isNaN(date.getTime()));
		const dateExtent = d3.extent(allDates);
		
		// Ensure we have valid date range
		const xScale = d3.scaleTime()
			.domain(dateExtent.length === 2 && dateExtent[0] && dateExtent[1] ? dateExtent : [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)])
			.range([0, chartWidth]);

		const yScale = d3.scaleBand()
			.domain(processedData.map(d => d.name).filter(name => name))
			.range([0, chartHeight])
			.padding(0.1);

		// Add x-axis
		g.append('g')
			.attr('transform', `translate(0,${chartHeight})`)
			.call(d3.axisBottom(xScale)
				.tickFormat(d3.timeFormat('%m/%d')));

		// Add y-axis
		g.append('g')
			.call(d3.axisLeft(yScale));

		// Add bars
		g.selectAll('.gantt-bar')
			.data(processedData)
			.enter()
			.append('rect')
			.attr('class', 'gantt-bar')
			.attr('x', d => {
				const x = xScale(d.startDate);
				return isNaN(x) ? 0 : x;
			})
			.attr('y', d => {
				const y = yScale(d.name);
				return isNaN(y) ? 0 : y;
			})
			.attr('width', d => {
				const startX = xScale(d.startDate);
				const endX = xScale(d.endDate);
				if (isNaN(startX) || isNaN(endX)) {
					return 10; // fallback 너비
				}
				const width = endX - startX;
				return Math.max(width, 10); // 최소 10px 너비 보장
			})
			.attr('height', () => {
				const height = yScale.bandwidth();
				return isNaN(height) ? 20 : height; // fallback 높이
			})
			.attr('fill', d => getStatusColor(d.status))
			.attr('opacity', 0.8)
			.on('mouseover', function(event, d) {
				// Show tooltip
				const tooltip = g.append('g')
					.attr('class', 'tooltip');
				
				const tooltipBg = tooltip.append('rect')
					.attr('fill', 'black')
					.attr('opacity', 0.8)
					.attr('rx', 3);
				
				const tooltipText = tooltip.append('text')
					.attr('fill', 'white')
					.attr('font-size', '12px')
					.attr('text-anchor', 'middle');
				
				tooltipText.append('tspan')
					.attr('x', 0)
					.attr('dy', '1.2em')
					.text(d.name);
				
				tooltipText.append('tspan')
					.attr('x', 0)
					.attr('dy', '1.2em')
					.text(`${d.startDate.toLocaleDateString('ko-KR')} - ${d.endDate.toLocaleDateString('ko-KR')}`);
				
				tooltipText.append('tspan')
					.attr('x', 0)
					.attr('dy', '1.2em')
					.text(`상태: ${getStatusLabel(d.status)}`);
				
				const bbox = tooltipText.node().getBBox();
				tooltipBg
					.attr('x', bbox.x - 8)
					.attr('y', bbox.y - 4)
					.attr('width', bbox.width + 16)
					.attr('height', bbox.height + 8);
				
				tooltip.attr('transform', `translate(${xScale(d.startDate) + (xScale(d.endDate) - xScale(d.startDate)) / 2}, ${yScale(d.name) - 10})`);
			})
			.on('mouseout', function() {
				g.select('.tooltip').remove();
			});

		// Add today line
		const today = new Date();
		if (today >= xScale.domain()[0] && today <= xScale.domain()[1]) {
			g.append('line')
				.attr('x1', xScale(today))
				.attr('x2', xScale(today))
				.attr('y1', 0)
				.attr('y2', chartHeight)
				.attr('stroke', 'red')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '4,4')
				.attr('opacity', 0.7);
			
			g.append('text')
				.attr('x', xScale(today))
				.attr('y', -5)
				.attr('text-anchor', 'middle')
				.attr('font-size', '12px')
				.attr('fill', 'red')
				.text('오늘');
		}
	}

	function processData(items) {
		console.log('=== processData debug ===');
		console.log('Type:', type, 'Items:', items.length);
		
		return items
			.filter(item => {
				if (type === 'tasks') {
					return item.createdAt; // Tasks must have created date
				} else {
					return item.created_at || item.createdAt; // Projects might use either format
				}
			})
			.map(item => {
				let startDate, endDate;
				
				if (type === 'tasks') {
					startDate = new Date(item.createdAt);
					endDate = item.dueDate ? new Date(item.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 1 week from now
				} else {
					// For projects, handle different date field formats
					const createDate = item.created_at || item.createdAt;
					startDate = new Date(createDate);
					
					// Use project's start_date if available, otherwise use created_at
					if (item.start_date) {
						startDate = new Date(item.start_date);
					}
					
					// Use project's end_date if available, otherwise default to 30 days from start
					if (item.end_date) {
						endDate = new Date(item.end_date);
					} else {
						endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
					}
					
					// Try to parse timeline if it exists (fallback)
					if (item.timeline) {
						try {
							const timeline = JSON.parse(item.timeline);
							if (timeline.start_date) {
								startDate = new Date(timeline.start_date);
							}
							if (timeline.end_date) {
								endDate = new Date(timeline.end_date);
							}
						} catch (e) {
							// Use default values already set above
						}
					}
				}

				// 날짜 유효성 검증
				if (!startDate || isNaN(startDate.getTime())) {
					startDate = new Date(); // 현재 날짜로 fallback
				}
				if (!endDate || isNaN(endDate.getTime())) {
					endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후로 fallback
				}

				// endDate가 startDate보다 이전이면 최소 1일 후로 설정
				if (endDate <= startDate) {
					endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 1일 후
				}

				// 프로젝트는 name, 작업은 title 필드 사용
				const itemTitle = item.name || item.title || 'Untitled';
				
				const result = {
					name: itemTitle.length > 30 ? itemTitle.substring(0, 30) + '...' : itemTitle,
					startDate,
					endDate,
					status: item.status || 'pending',
					originalItem: item
				};
				
				console.log('Processed item:', result.name, 'Start:', result.startDate, 'End:', result.endDate);
				return result;
			})
			.sort((a, b) => a.startDate - b.startDate);
	}

	function getStatusColor(status) {
		switch (status) {
			case 'completed': return '#10b981'; // green
			case 'in_progress': return '#3b82f6'; // blue
			case 'pending': return '#9ca3af'; // gray
			case 'active': return '#10b981'; // green
			case 'inactive': return '#9ca3af'; // gray
			default: return '#6b7280'; // default gray
		}
	}

	function getStatusLabel(status) {
		switch (status) {
			case 'completed': return '완료';
			case 'in_progress': return '진행중';
			case 'pending': return '대기중';
			case 'active': return '활성';
			case 'inactive': return '비활성';
			default: return status;
		}
	}

	$: {
		if (container) {
			renderChart();
		}
	}
</script>

<div bind:this={container} class="w-full min-h-96 overflow-x-auto">
	{#if data.length === 0}
		<div class="flex items-center justify-center h-64 text-gray-500">
			표시할 데이터가 없습니다
		</div>
	{/if}
</div>

<style>
	:global(.gantt-bar) {
		cursor: pointer;
		transition: opacity 0.2s ease;
	}
	
	:global(.gantt-bar:hover) {
		opacity: 1 !important;
	}
</style>