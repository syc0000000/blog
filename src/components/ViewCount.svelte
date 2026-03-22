<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";
	import * as FingerprintJS from "@fingerprintjs/fingerprintjs";
	import { onMount } from "svelte";

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	let count: number = $state(0);
	let loaded: boolean = $state(false);

	const CACHE_KEY = `view_count_${slug}`;
	const CACHE_DURATION = 60 * 1000;
	const VIEW_KEY = `viewed_${slug}`;

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
		const cached = getCachedCount();
		if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
			count = cached.count;
			loaded = true;
			return;
		}

		try {
			const apiUrl = import.meta.env.DEV
				? `http://localhost:8080/api/views/${encodeURIComponent(slug)}`
				: `/api/views/${encodeURIComponent(slug)}`;
			const res = await fetch(apiUrl);
			if (res.ok) {
				const data = await res.json();
				count = data.count ?? 0;
				setCachedCount(count);
			}
		} catch {}
		loaded = true;
	}

	async function recordView(visitorId: string): Promise<void> {
		// Check if already viewed this session
		try {
			if (sessionStorage.getItem(VIEW_KEY)) {
				return;
			}
		} catch {}

		try {
			const apiUrl = import.meta.env.DEV
				? `http://localhost:8080/api/views/${encodeURIComponent(slug)}`
				: `/api/views/${encodeURIComponent(slug)}`;
			await fetch(apiUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ visitorId }),
			});
			try {
				sessionStorage.setItem(VIEW_KEY, "1");
			} catch {}
		} catch {}
	}

	onMount(async () => {
		await fetchCount();

		// Get FingerprintJS visitor ID and record view
		try {
			const fp = await FingerprintJS.load();
			const result = await fp.get();
			if (result.visitorId) {
				recordView(result.visitorId);
			}
		} catch {}
	});

	// Refresh every minute
	setInterval(fetchCount, CACHE_DURATION);
</script>

{#if loaded && count > 0}
	<div class="view-count flex items-center gap-1.5 text-sm font-medium">
		<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
			<circle cx="12" cy="12" r="3"/>
		</svg>
		<span>{i18n(I18nKey.viewCount).replace("{count}", count.toString())}</span>
	</div>
{/if}

<style>
	.view-count {
		color: var(--text-secondary);
	}

	.view-count:hover {
		color: var(--primary);
	}
</style>
