import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/database.js';

export async function GET() {
	try {
		const database = await getDatabase();
		
		// Get all relationships between different entity types
		const relationships = await database.all(`
			-- PRD to Design relationships (requirement_id in designs points to PRD)
			SELECT 
				'prd' as source_type, 
				p.id as source_id, 
				p.title as source_label,
				p.status as source_status,
				'design' as target_type, 
				d.id as target_id, 
				d.title as target_label,
				d.status as target_status,
				'specifies' as relationship_type,
				'PRD → Design' as relationship_label
			FROM prds p
			JOIN designs d ON p.id = d.requirement_id
			WHERE d.requirement_id IS NOT NULL

			UNION ALL

			-- Design to Task relationships (design_id in tasks points to design)
			SELECT 
				'design' as source_type, 
				d.id as source_id, 
				d.title as source_label,
				d.status as source_status,
				'task' as target_type, 
				t.id as target_id, 
				t.title as target_label,
				t.status as target_status,
				'guides' as relationship_type,
				'Design → Task' as relationship_label
			FROM designs d
			JOIN tasks t ON d.id = t.design_id
			WHERE t.design_id IS NOT NULL

			UNION ALL

			-- Task to Test relationships (task_id in test_cases points to task)
			SELECT 
				'task' as source_type, 
				t.id as source_id, 
				t.title as source_label,
				t.status as source_status,
				'test' as target_type, 
				tc.id as target_id, 
				tc.title as target_label,
				tc.status as target_status,
				'validates' as relationship_type,
				'Task → Test' as relationship_label
			FROM tasks t
			JOIN test_cases tc ON t.id = tc.task_id
			WHERE tc.task_id IS NOT NULL

			UNION ALL

			-- PRD to Task relationships (via project_id)
			SELECT 
				'prd' as source_type, 
				p.id as source_id, 
				p.title as source_label,
				p.status as source_status,
				'task' as target_type, 
				t.id as target_id, 
				t.title as target_label,
				t.status as target_status,
				'implements' as relationship_type,
				'PRD → Task' as relationship_label
			FROM prds p
			JOIN tasks t ON p.project_id = t.project_id
			WHERE p.project_id IS NOT NULL AND t.project_id IS NOT NULL

			UNION ALL

			-- Task dependency relationships
			SELECT 
				'task' as source_type, 
				t2.id as source_id, 
				t2.title as source_label,
				t2.status as source_status,
				'task' as target_type, 
				t1.id as target_id, 
				t1.title as target_label,
				t1.status as target_status,
				'depends_on' as relationship_type,
				'Task → Task' as relationship_label
			FROM task_dependencies td
			JOIN tasks t1 ON td.dependent_task_id = t1.id
			JOIN tasks t2 ON td.prerequisite_task_id = t2.id

			ORDER BY source_type, source_id, target_type, target_id
		`);

		// Transform data for vis.js format
		const nodesMap = new Map();
		const edges = [];

		relationships.forEach((rel, index) => {
			// Add source node
			const sourceKey = `${rel.source_type}_${rel.source_id}`;
			if (!nodesMap.has(sourceKey)) {
				nodesMap.set(sourceKey, {
					id: sourceKey,
					label: rel.source_label,
					type: rel.source_type,
					status: rel.source_status,
					entity_id: rel.source_id,
					title: `${rel.source_type.toUpperCase()}: ${rel.source_label}\nStatus: ${rel.source_status}`
				});
			}

			// Add target node
			const targetKey = `${rel.target_type}_${rel.target_id}`;
			if (!nodesMap.has(targetKey)) {
				nodesMap.set(targetKey, {
					id: targetKey,
					label: rel.target_label,
					type: rel.target_type,
					status: rel.target_status,
					entity_id: rel.target_id,
					title: `${rel.target_type.toUpperCase()}: ${rel.target_label}\nStatus: ${rel.target_status}`
				});
			}

			// Add edge
			edges.push({
				id: `edge_${index}`,
				from: sourceKey,
				to: targetKey,
				label: rel.relationship_type,
				title: rel.relationship_label,
				relationship_type: rel.relationship_type
			});
		});

		const nodes = Array.from(nodesMap.values());

		// Get project information for context
		const projects = await database.all(`
			SELECT id, name, status 
			FROM projects 
			ORDER BY name
		`);

		// Get entity counts for statistics
		const stats = await database.get(`
			SELECT 
				(SELECT COUNT(*) FROM prds) as total_prds,
				(SELECT COUNT(*) FROM designs) as total_designs,
				(SELECT COUNT(*) FROM tasks) as total_tasks,
				(SELECT COUNT(*) FROM test_cases) as total_tests,
				COUNT(DISTINCT CASE WHEN source_type = 'prd' OR target_type = 'prd' THEN source_id END) as connected_prds,
				COUNT(DISTINCT CASE WHEN source_type = 'design' OR target_type = 'design' THEN source_id END) as connected_designs,
				COUNT(DISTINCT CASE WHEN source_type = 'task' OR target_type = 'task' THEN source_id END) as connected_tasks,
				COUNT(DISTINCT CASE WHEN source_type = 'test' OR target_type = 'test' THEN source_id END) as connected_tests
			FROM (${relationships.map(() => 'SELECT ? as source_type, ? as source_id, ? as target_type, ? as target_id').join(' UNION ALL ')})
		`, relationships.flatMap(r => [r.source_type, r.source_id, r.target_type, r.target_id]));

		return json({
			nodes,
			edges,
			projects,
			stats: {
				total_nodes: nodes.length,
				total_edges: edges.length,
				...stats
			}
		});
	} catch (error) {
		console.error('Error fetching relationships:', error);
		return json(
			{
				error: 'Failed to fetch relationships',
				details: error.message,
				nodes: [],
				edges: [],
				projects: [],
				stats: {
					total_nodes: 0,
					total_edges: 0,
					total_prds: 0,
					total_designs: 0,
					total_tasks: 0,
					total_tests: 0,
					connected_prds: 0,
					connected_designs: 0,
					connected_tasks: 0,
					connected_tests: 0
				}
			},
			{ status: 500 }
		);
	}
}