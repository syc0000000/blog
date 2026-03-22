import fs from "node:fs";
import path from "node:path";

import localAnimeList, { type AnimeItem } from "../data/anime";
import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { siteConfig } from "../config";

export type { AnimeItem };

type AnimeStatus = "watching" | "completed" | "planned" | "onhold" | "dropped";

const validStatuses: AnimeStatus[] = ["watching", "completed", "planned", "onhold", "dropped"];

export function getStatusMap(): Record<
	string,
	{ text: string; class: string; icon: string }
> {
	return {
		watching: {
			text: i18n(I18nKey.animeStatusWatching),
			class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
			icon: "▶",
		},
		completed: {
			text: i18n(I18nKey.animeStatusCompleted),
			class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
			icon: "✓",
		},
		planned: {
			text: i18n(I18nKey.animeStatusPlanned),
			class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
			icon: "❤",
		},
		onhold: {
			text: i18n(I18nKey.animeStatusOnHold),
			class: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
			icon: "⏸",
		},
		dropped: {
			text: i18n(I18nKey.animeStatusDropped),
			class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
			icon: "✗",
		},
	};
}

interface RawAnimeItem {
	title?: string;
	cover?: string;
	link?: string;
	status?: string;
	rating?: number | string;
	progress?: number | string;
	totalEpisodes?: number | string;
	description?: string;
	year?: string;
	studio?: string;
	genre?: string[];
}

function normalizeStatus(status: string | undefined): AnimeStatus {
	if (status && validStatuses.includes(status as AnimeStatus)) {
		return status as AnimeStatus;
	}
	return "planned";
}

function loadBangumiData(): AnimeItem[] {
	const dataPath = path.join(process.cwd(), "src/data/bangumi-data.json");

	if (!fs.existsSync(dataPath)) {
		console.warn("[Anime] Bangumi data file not found:", dataPath);
		return [];
	}

	try {
		const fileContent = fs.readFileSync(dataPath, "utf-8");
		const rawData = JSON.parse(fileContent) as RawAnimeItem[];

		return rawData.map((item) => ({
			title: item.title || "Unknown",
			cover: item.cover || "",
			link: item.link || "",
			status: normalizeStatus(item.status),
			rating: Number(item.rating) || 0,
			progress: Number(item.progress) || 0,
			totalEpisodes: Number(item.totalEpisodes) || 12,
			description: item.description || "",
			year: item.year || "",
			studio: item.studio || "",
			genre: Array.isArray(item.genre) ? item.genre : [],
			episodes: `${item.totalEpisodes || 12} episodes`,
		}));
	} catch (error) {
		console.error("[Anime] Failed to parse bangumi-data.json:", error);
		return [];
	}
}

export function getAnimeList(): AnimeItem[] {
	const bangumiConfig = siteConfig.bangumi;
	const isDev = import.meta.env.DEV;
	const shouldFetchOnDev = bangumiConfig?.fetchOnDev ?? false;

	// Check if we should skip loading bangumi data in dev mode
	const skipBangumi = isDev && !shouldFetchOnDev;

	// If bangumi userId is set and not the default, try to load bangumi data
	if (
		bangumiConfig?.userId &&
		bangumiConfig.userId !== "your-bangumi-id" &&
		!skipBangumi
	) {
		const bangumiData = loadBangumiData();
		if (bangumiData.length > 0) {
			return bangumiData;
		}
	}

	// Fall back to local data
	return localAnimeList;
}
