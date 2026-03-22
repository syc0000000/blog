export interface AnimeItem {
	title: string;
	status: "watching" | "completed" | "planned" | "onhold" | "dropped";
	rating: number;
	cover: string;
	description: string;
	episodes: string;
	year: string;
	genre: string[];
	studio: string;
	link: string;
	progress: number;
	totalEpisodes: number;
}

const localAnimeList: AnimeItem[] = [
	{
		title: "Lycoris Recoil",
		status: "completed",
		rating: 9.8,
		cover: "https://img.owmc.cn/npmcdn@main/bangumitracker/cover/lycoris-recoil.jpg",
		description: "少女们的枪战",
		episodes: "12 episodes",
		year: "2022",
		genre: ["Action", "Slice of life"],
		studio: "A-1 Pictures",
		link: "https://bgm.tv/subject/352702",
		progress: 12,
		totalEpisodes: 12,
	},
	{
		title: "Yowamushi Pedal",
		status: "watching",
		rating: 9.5,
		cover: "https://img.owmc.cn/npmcdn@main/bangumitracker/cover/yowamushi-pedal.jpg",
		description: "自行车竞速的热血故事",
		episodes: "12 episodes",
		year: "2015",
		genre: ["Sports", "Drama"],
		studio: "Nexus",
		link: "https://bgm.tv/subject/159759",
		progress: 8,
		totalEpisodes: 12,
	},
	{
		title: "Love Live! Sunshine!!",
		status: "watching",
		rating: 9.2,
		cover: "https://img.owmc.cn/npmcdn@main/bangumitracker/cover/love-live-sunshine.jpg",
		description: "校园偶像物語",
		episodes: "13 episodes",
		year: "2016",
		genre: ["Music", "School"],
		studio: "Sunrise",
		link: "https://bgm.tv/subject/193714",
		progress: 5,
		totalEpisodes: 13,
	},
];

export default localAnimeList;
