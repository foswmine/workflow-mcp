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
	() => import('./nodes/28')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/database": [3],
		"/designs": [4],
		"/designs/new": [5],
		"/designs/[id]": [6],
		"/designs/[id]/edit": [7],
		"/documents": [8],
		"/documents/[id]": [9],
		"/gantt": [10],
		"/kanban": [11],
		"/network": [12],
		"/prds": [13],
		"/prds/new": [14],
		"/prds/[id]": [15],
		"/prds/[id]/edit": [16],
		"/projects": [17],
		"/projects/new": [18],
		"/projects/[id]": [19],
		"/projects/[id]/edit": [20],
		"/tasks": [21],
		"/tasks/new": [22],
		"/tasks/[id]": [23],
		"/tasks/[id]/edit": [24],
		"/tests": [25],
		"/tests/new": [26],
		"/tests/[id]": [27],
		"/tests/[id]/edit": [28]
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