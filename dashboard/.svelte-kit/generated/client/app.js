export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/database": [3],
		"/deployments": [4],
		"/deployments/create": [5],
		"/deployments/[id]": [6],
		"/designs": [7],
		"/designs/new": [8],
		"/designs/[id]": [9],
		"/designs/[id]/edit": [10],
		"/documents": [11],
		"/documents/[id]": [12],
		"/environments": [13],
		"/environments/new": [14],
		"/environments/[id]": [15],
		"/gantt": [16],
		"/incidents/[id]": [17],
		"/kanban": [18],
		"/network": [19],
		"/operations": [20],
		"/prds": [21],
		"/prds/new": [22],
		"/prds/[id]": [23],
		"/prds/[id]/edit": [24],
		"/projects": [25],
		"/projects/new": [26],
		"/projects/[id]": [27],
		"/projects/[id]/edit": [28],
		"/tasks": [29],
		"/tasks/new": [30],
		"/tasks/[id]": [31],
		"/tasks/[id]/edit": [32],
		"/tests": [33],
		"/tests/new": [34],
		"/tests/[id]": [35],
		"/tests/[id]/edit": [36]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.svelte';