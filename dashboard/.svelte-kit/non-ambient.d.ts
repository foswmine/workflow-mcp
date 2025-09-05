
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
		RouteId(): "/" | "/api" | "/api/dashboard" | "/api/plans" | "/api/plans/[id]" | "/api/prds" | "/api/prds/[id]" | "/api/tasks" | "/api/tasks/[id]" | "/database" | "/gantt" | "/kanban" | "/plans" | "/plans/new" | "/prds" | "/prds/new" | "/tasks" | "/tasks/new";
		RouteParams(): {
			"/api/plans/[id]": { id: string };
			"/api/prds/[id]": { id: string };
			"/api/tasks/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/api": { id?: string };
			"/api/dashboard": Record<string, never>;
			"/api/plans": { id?: string };
			"/api/plans/[id]": { id: string };
			"/api/prds": { id?: string };
			"/api/prds/[id]": { id: string };
			"/api/tasks": { id?: string };
			"/api/tasks/[id]": { id: string };
			"/database": Record<string, never>;
			"/gantt": Record<string, never>;
			"/kanban": Record<string, never>;
			"/plans": Record<string, never>;
			"/plans/new": Record<string, never>;
			"/prds": Record<string, never>;
			"/prds/new": Record<string, never>;
			"/tasks": Record<string, never>;
			"/tasks/new": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/dashboard" | "/api/dashboard/" | "/api/plans" | "/api/plans/" | `/api/plans/${string}` & {} | `/api/plans/${string}/` & {} | "/api/prds" | "/api/prds/" | `/api/prds/${string}` & {} | `/api/prds/${string}/` & {} | "/api/tasks" | "/api/tasks/" | `/api/tasks/${string}` & {} | `/api/tasks/${string}/` & {} | "/database" | "/database/" | "/gantt" | "/gantt/" | "/kanban" | "/kanban/" | "/plans" | "/plans/" | "/plans/new" | "/plans/new/" | "/prds" | "/prds/" | "/prds/new" | "/prds/new/" | "/tasks" | "/tasks/" | "/tasks/new" | "/tasks/new/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}