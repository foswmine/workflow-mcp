<script>
	import { onMount, onDestroy } from 'svelte';
	import { Network } from 'vis-network/standalone';

	export let data = { nodes: [], edges: [] };
	export let selectedTypes = ['prd', 'design', 'task', 'test'];
	export let selectedProject = null;

	let container;
	let network;
	let filteredData = { nodes: [], edges: [] };

	// Network options
	const options = {
		nodes: {
			shape: 'box',
			margin: 10,
			widthConstraint: {
				minimum: 80,
				maximum: 200
			},
			heightConstraint: {
				minimum: 40
			},
			font: {
				size: 12,
				color: '#333',
				face: 'Arial'
			},
			borderWidth: 2,
			shadow: {
				enabled: true,
				color: 'rgba(0,0,0,0.1)',
				size: 5,
				x: 2,
				y: 2
			}
		},
		edges: {
			arrows: {
				to: {
					enabled: true,
					scaleFactor: 1.2
				}
			},
			color: {
				color: '#666',
				highlight: '#2196F3',
				hover: '#2196F3'
			},
			font: {
				size: 10,
				color: '#666',
				strokeWidth: 2,
				strokeColor: '#fff'
			},
			smooth: {
				type: 'continuous',
				forceDirection: 'none'
			},
			width: 2
		},
		groups: {
			prd: {
				color: {
					background: '#3498db',
					border: '#2980b9',
					highlight: {
						background: '#5dade2',
						border: '#2980b9'
					}
				},
				font: { color: '#fff' }
			},
			design: {
				color: {
					background: '#e74c3c',
					border: '#c0392b',
					highlight: {
						background: '#ec7063',
						border: '#c0392b'
					}
				},
				font: { color: '#fff' }
			},
			task: {
				color: {
					background: '#2ecc71',
					border: '#27ae60',
					highlight: {
						background: '#58d68d',
						border: '#27ae60'
					}
				},
				font: { color: '#fff' }
			},
			test: {
				color: {
					background: '#f39c12',
					border: '#d68910',
					highlight: {
						background: '#f8c471',
						border: '#d68910'
					}
				},
				font: { color: '#fff' }
			}
		},
		physics: {
			enabled: true,
			stabilization: {
				enabled: true,
				iterations: 100,
				updateInterval: 25
			},
			barnesHut: {
				gravitationalConstant: -8000,
				centralGravity: 0.3,
				springLength: 120,
				springConstant: 0.04,
				damping: 0.09,
				avoidOverlap: 0.1
			}
		},
		interaction: {
			hover: true,
			selectConnectedEdges: true,
			tooltipDelay: 200
		},
		layout: {
			improvedLayout: true,
			randomSeed: 42
		}
	};

	// Filter data based on selected types and project
	function filterData() {
		if (!data.nodes || !data.edges) {
			filteredData = { nodes: [], edges: [] };
			return;
		}

		// Filter nodes by type
		const filteredNodes = data.nodes.filter(node => 
			selectedTypes.includes(node.type)
		);

		// Get node IDs for edge filtering
		const nodeIds = new Set(filteredNodes.map(node => node.id));

		// Filter edges - only include edges where both nodes are visible
		const filteredEdges = data.edges.filter(edge => 
			nodeIds.has(edge.from) && nodeIds.has(edge.to)
		);

		filteredData = {
			nodes: filteredNodes,
			edges: filteredEdges
		};
	}

	// Update network when filtered data changes
	function updateNetwork() {
		if (!network || !filteredData) return;

		try {
			// Apply group styling to nodes
			const styledNodes = filteredData.nodes.map(node => ({
				...node,
				group: node.type,
				chosen: {
					node: function(values, id, selected, hovering) {
						values.borderWidth = selected ? 4 : 2;
					}
				}
			}));

			// Update network data
			network.setData({
				nodes: styledNodes,
				edges: filteredData.edges
			});

			// Re-run physics simulation
			network.startSimulation();
		} catch (error) {
			console.error('Error updating network:', error);
		}
	}

	// Initialize network
	function initNetwork() {
		if (!container || !filteredData) return;

		try {
			network = new Network(container, filteredData, options);

			// Add event listeners
			network.on('click', function(params) {
				if (params.nodes.length > 0) {
					const nodeId = params.nodes[0];
					const node = filteredData.nodes.find(n => n.id === nodeId);
					if (node) {
						// Dispatch custom event for node selection
						const event = new CustomEvent('nodeSelected', {
							detail: node
						});
						container.dispatchEvent(event);
					}
				}
			});

			network.on('hoverNode', function(params) {
				container.style.cursor = 'pointer';
			});

			network.on('blurNode', function(params) {
				container.style.cursor = 'default';
			});

			// Fit network to container after stabilization
			network.once('stabilizationIterationsDone', function() {
				network.fit({
					animation: {
						duration: 500,
						easingFunction: 'easeInOutQuad'
					}
				});
			});

		} catch (error) {
			console.error('Error initializing network:', error);
		}
	}

	// Focus on specific nodes
	export function focusNode(nodeId) {
		if (!network) return;
		
		network.focus(nodeId, {
			scale: 1.5,
			animation: {
				duration: 1000,
				easingFunction: 'easeInOutQuad'
			}
		});
		network.selectNodes([nodeId]);
	}

	// Fit network to view
	export function fitNetwork() {
		if (!network) return;
		
		network.fit({
			animation: {
				duration: 500,
				easingFunction: 'easeInOutQuad'
			}
		});
	}

	// Change layout
	export function setLayout(layoutType) {
		if (!network) return;

		const layoutOptions = {
			hierarchical: {
				enabled: true,
				direction: 'UD',
				sortMethod: 'directed',
				levelSeparation: 100,
				nodeSpacing: 120
			},
			random: {
				enabled: false
			}
		};

		if (layoutType === 'hierarchical') {
			network.setOptions({
				layout: layoutOptions.hierarchical,
				physics: {
					enabled: false
				}
			});
		} else if (layoutType === 'physics') {
			network.setOptions({
				layout: layoutOptions.random,
				physics: options.physics
			});
			network.startSimulation();
		}
	}

	// Reactive updates
	$: {
		filterData();
	}

	$: if (network && filteredData) {
		updateNetwork();
	}

	onMount(() => {
		filterData();
		initNetwork();
	});

	onDestroy(() => {
		if (network) {
			network.destroy();
		}
	});
</script>

<div class="network-container">
	<div class="network-wrapper" bind:this={container}></div>
	
	{#if filteredData.nodes.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🔗</div>
			<h3>관계 데이터가 없습니다</h3>
			<p>선택한 필터 조건에 맞는 관계가 없습니다.</p>
		</div>
	{/if}
</div>

<style>
	.network-container {
		position: relative;
		width: 100%;
		height: 600px;
		background: #fafafa;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
	}

	.network-wrapper {
		width: 100%;
		height: 100%;
	}

	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: #666;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
		color: #333;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.7;
	}

	:global(.vis-network) {
		outline: none;
	}

	:global(.vis-tooltip) {
		background: rgba(0, 0, 0, 0.8) !important;
		color: white !important;
		border-radius: 4px !important;
		padding: 8px 12px !important;
		font-size: 12px !important;
		max-width: 300px !important;
	}
</style>