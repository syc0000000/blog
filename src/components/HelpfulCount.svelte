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
			const res = await fetch(`/api/feedback/${slug}/count`);
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
		<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.59a.375.375 0 0 1 .257-.13c.482-.114.985-.285 1.526-.525a48.55 48.55 0 0 0 1.729-2.666.375.375 0 0 1 .328-.17.375.375 0 0 1 .328.17c.53.24 1.104.411 1.729 2.666a.375.375 0 0 1-.032.216.375.375 0 0 1-.144.104.375.375 0 0 1-.216.032.375.375 0 0 1-.17-.032 44.42 44.42 0 0 0-1.729-2.666.375.375 0 0 0-.17-.257.375.375 0 0 0-.144-.104.375.375 0 0 0-.216-.032.375.375 0 0 0-.257.032 44.42 44.42 0 0 0-1.729 2.666 9.041 9.041 0 0 1-2.861 2.4.375.375 0 0 1-.257.13.375.375 0 0 1-.257-.13 9.041 9.041 0 0 1-2.861-2.4c-.303-.634-.626-1.306-1.031-1.99a.375.375 0 0 1 .032-.216.375.375 0 0 1 .144-.104.375.375 0 0 1 .216-.032c.114-.007.228-.019.342-.035a48.55 48.55 0 0 1 1.729 2.666.375.375 0 0 1-.17.328.375.375 0 0 1-.328.17Z" />
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
