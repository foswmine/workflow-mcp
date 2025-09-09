
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/dashboard" | "/api/designs" | "/api/designs/[id]" | "/api/documents" | "/api/documents/[id]" | "/api/prds" | "/api/prds/[id]" | "/api/prds/[id]/designs" | "/api/prds/[id]/tasks" | "/api/projects" | "/api/projects/[id]" | "/api/projects/[id]/links" | "/api/relationships" | "/api/tasks" | "/api/tasks/[id]" | "/api/tasks/[id]/connections" | "/api/tasks/[id]/tests" | "/api/tests" | "/api/tests/link-task" | "/api/tests/[id]" | "/api/tests/[id]/connections" | "/api/tests/[id]/execute" | "/api/tests/[id]/executions" | "/database" | "/designs" | "/designs/new" | "/designs/[id]" | "/designs/[id]/edit" | "/documents" | "/documents/[id]" | "/gantt" | "/kanban" | "/network" | "/prds" | "/prds/new" | "/prds/[id]" | "/prds/[id]/edit" | "/projects" | "/projects/new" | "/projects/[id]" | "/projects/[id]/edit" | "/tasks" | "/tasks/new" | "/tasks/[id]" | "/tasks/[id]/edit" | "/tests" | "/tests/new" | "/tests/[id]" | "/tests/[id]/edit";
		RouteParams(): {
			"/api/designs/[id]": { id: string };
			"/api/documents/[id]": { id: string };
			"/api/prds/[id]": { id: string };
			"/api/prds/[id]/designs": { id: string };
			"/api/prds/[id]/tasks": { id: string };
			"/api/projects/[id]": { id: string };
			"/api/projects/[id]/links": { id: string };
			"/api/tasks/[id]": { id: string };
			"/api/tasks/[id]/connections": { id: string };
			"/api/tasks/[id]/tests": { id: string };
			"/api/tests/[id]": { id: string };
			"/api/tests/[id]/connections": { id: string };
			"/api/tests/[id]/execute": { id: string };
			"/api/tests/[id]/executions": { id: string };
			"/designs/[id]": { id: string };
			"/designs/[id]/edit": { id: string };
			"/documents/[id]": { id: string };
			"/prds/[id]": { id: string };
			"/prds/[id]/edit": { id: string };
			"/projects/[id]": { id: string };
			"/projects/[id]/edit": { id: string };
			"/tasks/[id]": { id: string };
			"/tasks/[id]/edit": { id: string };
			"/tests/[id]": { id: string };
			"/tests/[id]/edit": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/api": { id?: string };
			"/api/dashboard": Record<string, never>;
			"/api/designs": { id?: string };
			"/api/designs/[id]": { id: string };
			"/api/documents": { id?: string };
			"/api/documents/[id]": { id: string };
			"/api/prds": { id?: string };
			"/api/prds/[id]": { id: string };
			"/api/prds/[id]/designs": { id: string };
			"/api/prds/[id]/tasks": { id: string };
			"/api/projects": { id?: string };
			"/api/projects/[id]": { id: string };
			"/api/projects/[id]/links": { id: string };
			"/api/relationships": Record<string, never>;
			"/api/tasks": { id?: string };
			"/api/tasks/[id]": { id: string };
			"/api/tasks/[id]/connections": { id: string };
			"/api/tasks/[id]/tests": { id: string };
			"/api/tests": { id?: string };
			"/api/tests/link-task": Record<string, never>;
			"/api/tests/[id]": { id: string };
			"/api/tests/[id]/connections": { id: string };
			"/api/tests/[id]/execute": { id: string };
			"/api/tests/[id]/executions": { id: string };
			"/database": Record<string, never>;
			"/designs": { id?: string };
			"/designs/new": Record<string, never>;
			"/designs/[id]": { id: string };
			"/designs/[id]/edit": { id: string };
			"/documents": { id?: string };
			"/documents/[id]": { id: string };
			"/gantt": Record<string, never>;
			"/kanban": Record<string, never>;
			"/network": Record<string, never>;
			"/prds": { id?: string };
			"/prds/new": Record<string, never>;
			"/prds/[id]": { id: string };
			"/prds/[id]/edit": { id: string };
			"/projects": { id?: string };
			"/projects/new": Record<string, never>;
			"/projects/[id]": { id: string };
			"/projects/[id]/edit": { id: string };
			"/tasks": { id?: string };
			"/tasks/new": Record<string, never>;
			"/tasks/[id]": { id: string };
			"/tasks/[id]/edit": { id: string };
			"/tests": { id?: string };
			"/tests/new": Record<string, never>;
			"/tests/[id]": { id: string };
			"/tests/[id]/edit": { id: string }
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/dashboard" | "/api/dashboard/" | "/api/designs" | "/api/designs/" | `/api/designs/${string}` & {} | `/api/designs/${string}/` & {} | "/api/documents" | "/api/documents/" | `/api/documents/${string}` & {} | `/api/documents/${string}/` & {} | "/api/prds" | "/api/prds/" | `/api/prds/${string}` & {} | `/api/prds/${string}/` & {} | `/api/prds/${string}/designs` & {} | `/api/prds/${string}/designs/` & {} | `/api/prds/${string}/tasks` & {} | `/api/prds/${string}/tasks/` & {} | "/api/projects" | "/api/projects/" | `/api/projects/${string}` & {} | `/api/projects/${string}/` & {} | `/api/projects/${string}/links` & {} | `/api/projects/${string}/links/` & {} | "/api/relationships" | "/api/relationships/" | "/api/tasks" | "/api/tasks/" | `/api/tasks/${string}` & {} | `/api/tasks/${string}/` & {} | `/api/tasks/${string}/connections` & {} | `/api/tasks/${string}/connections/` & {} | `/api/tasks/${string}/tests` & {} | `/api/tasks/${string}/tests/` & {} | "/api/tests" | "/api/tests/" | "/api/tests/link-task" | "/api/tests/link-task/" | `/api/tests/${string}` & {} | `/api/tests/${string}/` & {} | `/api/tests/${string}/connections` & {} | `/api/tests/${string}/connections/` & {} | `/api/tests/${string}/execute` & {} | `/api/tests/${string}/execute/` & {} | `/api/tests/${string}/executions` & {} | `/api/tests/${string}/executions/` & {} | "/database" | "/database/" | "/designs" | "/designs/" | "/designs/new" | "/designs/new/" | `/designs/${string}` & {} | `/designs/${string}/` & {} | `/designs/${string}/edit` & {} | `/designs/${string}/edit/` & {} | "/documents" | "/documents/" | `/documents/${string}` & {} | `/documents/${string}/` & {} | "/gantt" | "/gantt/" | "/kanban" | "/kanban/" | "/network" | "/network/" | "/prds" | "/prds/" | "/prds/new" | "/prds/new/" | `/prds/${string}` & {} | `/prds/${string}/` & {} | `/prds/${string}/edit` & {} | `/prds/${string}/edit/` & {} | "/projects" | "/projects/" | "/projects/new" | "/projects/new/" | `/projects/${string}` & {} | `/projects/${string}/` & {} | `/projects/${string}/edit` & {} | `/projects/${string}/edit/` & {} | "/tasks" | "/tasks/" | "/tasks/new" | "/tasks/new/" | `/tasks/${string}` & {} | `/tasks/${string}/` & {} | `/tasks/${string}/edit` & {} | `/tasks/${string}/edit/` & {} | "/tests" | "/tests/" | "/tests/new" | "/tests/new/" | `/tests/${string}` & {} | `/tests/${string}/` & {} | `/tests/${string}/edit` & {} | `/tests/${string}/edit/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}