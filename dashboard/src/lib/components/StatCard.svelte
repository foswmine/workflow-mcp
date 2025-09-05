<script>
	export let title;
	export let value;
	export let subtext = '';
	export let icon = '';
	export let color = 'blue';

	const colorClasses = {
		blue: 'bg-blue-50 border-blue-200 text-blue-800',
		green: 'bg-green-50 border-green-200 text-green-800',
		yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
		purple: 'bg-purple-50 border-purple-200 text-purple-800',
		red: 'bg-red-50 border-red-200 text-red-800'
	};
</script>

<div class="card">
	<div class="flex items-center">
		{#if icon}
			<div class="flex-shrink-0">
				<div class="w-8 h-8 flex items-center justify-center rounded-full {colorClasses[color]}">
					<span class="text-lg">{icon}</span>
				</div>
			</div>
		{/if}
		<div class="ml-4 flex-1">
			<div class="text-sm font-medium text-gray-500">{title}</div>
			<div class="mt-1 text-2xl font-bold text-gray-900">{value}</div>
			{#if subtext}
				<div class="text-xs text-gray-500">{subtext}</div>
			{/if}
		</div>
	</div>
</div>