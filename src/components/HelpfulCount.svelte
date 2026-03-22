<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	let count: number = $state(0);
	let loaded: boolean = $state(false);

	const CACHE_KEY = `helpful_count_${slug}`;
	const CACHE_DURATION = 60 * 1000; // 1 minute in ms

	interface CacheData {
		count: number;
		timestamp: number;
	}

	function getCachedCount(): CacheData | null {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (cached) {
				return JSON.parse(cached) as CacheData;
			}
		} catch {}
		return null;
	}

	function setCachedCount(count: number): void {
		try {
			const data: CacheData = { count, timestamp: Date.now() };
			localStorage.setItem(CACHE_KEY, JSON.stringify(data));
		} catch {}
	}

	async function fetchCount(): Promise<void> {
		// Check cache first
		const cached = getCachedCount();
		if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
			count = cached.count;
			loaded = true;
			return;
		}

		try {
			const apiUrl = import.meta.env.DEV
				? `http://localhost:8080/api/feedback/${encodeURIComponent(slug)}/count`
				: `/api/feedback/${encodeURIComponent(slug)}/count`;
			const res = await fetch(apiUrl);
			if (res.ok) {
				const data = await res.json();
				count = data.count ?? 0;
				setCachedCount(count);
			}
		} catch {}
		loaded = true;
	}

	// Initial fetch
	fetchCount();

	// Refresh every minute
	setInterval(fetchCount, CACHE_DURATION);
</script>

{#if loaded && count > 0}
	<div class="helpful-count flex items-center gap-1.5 text-sm font-medium">
		<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3a4 4 0 0 0 4-4V6a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1-2 2h-7a3 3 0 0 1-3-3"/>
		</svg>
		<span>{i18n(I18nKey.helpfulCount).replace("{count}", count.toString())}</span>
	</div>
{/if}

<style>
	.helpful-count {
		color: var(--text-secondary);
	}

	.helpful-count:hover {
		color: var(--primary);
	}
</style>
