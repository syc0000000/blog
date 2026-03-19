<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	type FeedbackType = "helpful" | "not_helpful" | "other";
	type FeedbackState = "idle" | "submitting" | "submitted" | "feedback_form";

	let state: FeedbackState = $state("idle");
	let selectedType: FeedbackType | null = $state(null);
	let feedbackText: string = $state("");
	let submitted = $state(false);
	let submittedType: FeedbackType | null = $state(null);

	const handleFeedbackClick = async (type: FeedbackType) => {
		if (submitted || state === "submitting") return;

		if (type === "other") {
			state = "feedback_form";
			selectedType = type;
			return;
		}

		state = "submitting";
		selectedType = type;

		try {
			const response = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slug, type, content: "" }),
			});

			if (response.ok) {
				submitted = true;
				submittedType = type;
				state = "submitted";
			} else {
				state = "idle";
				selectedType = null;
			}
		} catch {
			state = "idle";
			selectedType = null;
		}
	};

	const handleOtherSubmit = async () => {
		if (!feedbackText.trim() || state === "submitting") return;

		state = "submitting";
		try {
			const response = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slug, type: selectedType, content: feedbackText }),
			});

			if (response.ok) {
				submitted = true;
				submittedType = selectedType;
				state = "submitted";
			} else {
				state = "feedback_form";
			}
		} catch {
			state = "feedback_form";
		}
	};

	const cancelFeedback = () => {
		state = "idle";
		selectedType = null;
		feedbackText = "";
	};
</script>

<div class="feedback-container mt-8 p-6 rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)]">
	{#if state === "idle" || state === "submitting"}
		<div class="flex flex-col sm:flex-row items-center gap-4">
			<div class="flex items-center gap-2 text-[var(--text-secondary)]">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 1 .024-.083c1.438-.164 2.403-.513 3.197-1.116a.375.375 0 0 1 .207-.043c.21.014.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c.62-.273 1.218-.69 1.698-1.186a.375.375 0 0 1 .207.043c.21.015.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c1.064-.31 1.853-.92 2.254-1.69a.375.375 0 0 1 .207-.043" />
				</svg>
				<span class="font-medium">{i18n(I18nKey.feedbackPrompt)}</span>
			</div>
			<div class="flex gap-3">
				<button
					onclick={() => handleFeedbackClick("helpful")}
					disabled={state === "submitting"}
					class="feedback-btn px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-base">👍</span>
					<span>{i18n(I18nKey.helpful)}</span>
				</button>
				<button
					onclick={() => handleFeedbackClick("not_helpful")}
					disabled={state === "submitting"}
					class="feedback-btn px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-base">👎</span>
					<span>{i18n(I18nKey.notHelpful)}</span>
				</button>
				<button
					onclick={() => handleFeedbackClick("other")}
					disabled={state === "submitting"}
					class="feedback-btn px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-base">💬</span>
					<span>{i18n(I18nKey.otherFeedback)}</span>
				</button>
			</div>
		</div>
	{:else if state === "feedback_form"}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-2 text-[var(--text-secondary)]">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 1 .024-.083c1.438-.164 2.403-.513 3.197-1.116a.375.375 0 0 1 .207-.043c.21.014.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c.62-.273 1.218-.69 1.698-1.186a.375.375 0 0 1 .207-.043c.21.015.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c1.064-.31 1.853-.92 2.254-1.69a.375.375 0 0 1 .207-.043" />
				</svg>
				<span class="font-medium">{i18n(I18nKey.otherFeedbackHint)}</span>
			</div>
			<textarea
				bind:value={feedbackText}
				placeholder={i18n(I18nKey.feedbackPlaceholder)}
				rows="3"
				class="w-full px-4 py-3 rounded-xl bg-[var(--btn-plain-bg)] border border-[var(--line-divider)] text-sm resize-none focus:outline-none focus:border-[var(--primary)] transition-colors"
			></textarea>
			<div class="flex gap-3 justify-end">
				<button
					onclick={cancelFeedback}
					class="px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--line-divider)] transition-all hover:bg-[var(--btn-plain-bg-hover)]"
				>
					{i18n(I18nKey.cancel)}
				</button>
				<button
					onclick={handleOtherSubmit}
					disabled={state === "submitting" || !feedbackText.trim()}
					class="px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--primary)] text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{i18n(I18nKey.submit)}
				</button>
			</div>
		</div>
	{:else if state === "submitted"}
		<div class="flex items-center justify-center gap-3 py-2">
			{#if submittedType === "helpful"}
				<span class="text-2xl">👍</span>
			{:else if submittedType === "not_helpful"}
				<span class="text-2xl">👎</span>
			{:else}
				<span class="text-2xl">💬</span>
			{/if}
			<span class="text-[var(--text-secondary)] font-medium">
				{#if submittedType === "helpful"}
					{i18n(I18nKey.thankYouHelpful)}
				{:else if submittedType === "not_helpful"}
					{i18n(I18nKey.thankYouNotHelpful)}
				{:else}
					{i18n(I18nKey.thankYouOtherFeedback)}
				{/if}
			</span>
		</div>
	{/if}
</div>

<style>
	.feedback-btn {
		background: var(--btn-plain-bg);
		color: var(--text-secondary);
	}
	.feedback-btn:hover:not(:disabled) {
		border-color: var(--primary);
		color: var(--primary);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	.feedback-btn:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: none;
	}
</style>
