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

<div class="feedback-container mt-8 p-4 rounded-xl bg-[var(--btn-plain-bg)]">
	{#if state === "idle" || state === "submitting"}
		<div class="flex flex-col sm:flex-row items-center gap-3">
			<span class="text-sm text-[var(--text-secondary)] mr-2">
				{i18n(I18nKey.feedbackPrompt)}
			</span>
			<div class="flex gap-2">
				<button
					onclick={() => handleFeedbackClick("helpful")}
					disabled={state === "submitting"}
					class="btn-card px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition hover:bg-[var(--primary)]/10 disabled:opacity-50"
				>
					<span class="text-lg">👍</span>
					<span>{i18n(I18nKey.helpful)}</span>
				</button>
				<button
					onclick={() => handleFeedbackClick("not_helpful")}
					disabled={state === "submitting"}
					class="btn-card px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition hover:bg-[var(--primary)]/10 disabled:opacity-50"
				>
					<span class="text-lg">👎</span>
					<span>{i18n(I18nKey.notHelpful)}</span>
				</button>
				<button
					onclick={() => handleFeedbackClick("other")}
					disabled={state === "submitting"}
					class="btn-card px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition hover:bg-[var(--primary)]/10 disabled:opacity-50"
				>
					<span class="text-lg">💬</span>
					<span>{i18n(I18nKey.otherFeedback)}</span>
				</button>
			</div>
		</div>
	{:else if state === "feedback_form"}
		<div class="flex flex-col gap-3">
			<div class="text-sm text-[var(--text-secondary)]">
				{i18n(I18nKey.otherFeedbackHint)}
			</div>
			<textarea
				bind:value={feedbackText}
				placeholder={i18n(I18nKey.feedbackPlaceholder)}
				rows="3"
				class="w-full px-3 py-2 rounded-lg bg-[var(--btn-plain-bg)] border border-[var(--line-divider)] text-sm resize-none focus:outline-none focus:border-[var(--primary)]"
			></textarea>
			<div class="flex gap-2 justify-end">
				<button
					onclick={cancelFeedback}
					class="px-4 py-2 rounded-lg text-sm transition hover:bg-[var(--btn-plain-bg-hover)]"
				>
					{i18n(I18nKey.cancel)}
				</button>
				<button
					onclick={handleOtherSubmit}
					disabled={state === "submitting" || !feedbackText.trim()}
					class="btn-card px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 hover:bg-[var(--primary)]/10"
				>
					{i18n(I18nKey.submit)}
				</button>
			</div>
		</div>
	{:else if state === "submitted"}
		<div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
			{#if submittedType === "helpful"}
				<span class="text-lg">👍</span>
				<span>{i18n(I18nKey.thankYouHelpful)}</span>
			{:else if submittedType === "not_helpful"}
				<span class="text-lg">👎</span>
				<span>{i18n(I18nKey.thankYouNotHelpful)}</span>
			{:else}
				<span class="text-lg">💬</span>
				<span>{i18n(I18nKey.thankYouOtherFeedback)}</span>
			{/if}
		</div>
	{/if}
</div>
