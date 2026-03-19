<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	type FeedbackType = "helpful" | "not_helpful" | "other";
	type FeedbackState = "idle" | "submitting" | "submitted" | "feedback_form" | "failed";

	let state: FeedbackState = $state("idle");
	let selectedType: FeedbackType | null = $state(null);
	let feedbackText: string = $state("");
	let submittedType: FeedbackType | null = $state(null);
	let failMessage: string = $state("");

	const handleFeedbackClick = async (type: FeedbackType) => {
		if (state === "submitting" || state === "submitted") return;

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
				submittedType = type;
				state = "submitted";
			} else {
				failMessage = "Request failed";
				submittedType = type;
				state = "failed";
			}
		} catch {
			failMessage = "Network error";
			submittedType = type;
			state = "failed";
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

	const retry = () => {
		state = "idle";
		submittedType = null;
		failMessage = "";
	};
</script>

<div class="feedback-container mt-8 p-6 rounded-2xl border border-[var(--line-divider)]" class:success-helpful={state === "submitted" && submittedType === "helpful"} class:success-not-helpful={state === "submitted" && submittedType === "not_helpful"} class:success-other={state === "submitted" && submittedType === "other"} class:fail={state === "failed"}>
	{#if state === "idle" || state === "submitting"}
		<div class="flex flex-col sm:flex-row items-center gap-4">
			<div class="flex items-center gap-2 text-[var(--text-secondary)] text-base">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 1 .024-.083c1.438-.164 2.403-.513 3.197-1.116a.375.375 0 0 1 .207-.043c.21.014.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c.62-.273 1.218-.69 1.698-1.186a.375.375 0 0 1 .207-.043c.21.015.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c1.064-.31 1.853-.92 2.254-1.69a.375.375 0 0 1 .207-.043" />
				</svg>
				<span class="font-medium">{i18n(I18nKey.feedbackPrompt)}</span>
			</div>
			<div class="flex gap-3">
				<button
					onclick={() => handleFeedbackClick("helpful")}
					disabled={state === "submitting"}
					class="feedback-btn px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span>👍</span>
					<span>{i18n(I18nKey.helpful)}</span>
				</button>
				<button
					onclick={() => handleFeedbackClick("not_helpful")}
					disabled={state === "submitting"}
					class="feedback-btn px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span>👎</span>
					<span>{i18n(I18nKey.notHelpful)}</span>
				</button>
				<button
					onclick={() => handleFeedbackClick("other")}
					disabled={state === "submitting"}
					class="feedback-btn px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span>💬</span>
					<span>{i18n(I18nKey.otherFeedback)}</span>
				</button>
			</div>
		</div>
	{:else if state === "feedback_form"}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-2 text-[var(--text-secondary)] text-base">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 1 .024-.083c1.438-.164 2.403-.513 3.197-1.116a.375.375 0 0 1 .207-.043c.21.014.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c.62-.273 1.218-.69 1.698-1.186a.375.375 0 0 1 .207-.043c.21.015.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c1.064-.31 1.853-.92 2.254-1.69a.375.375 0 0 1 .207-.043" />
				</svg>
				<span class="font-medium">{i18n(I18nKey.otherFeedbackHint)}</span>
			</div>
			<textarea
				bind:value={feedbackText}
				placeholder={i18n(I18nKey.feedbackPlaceholder)}
				rows="3"
				class="w-full px-4 py-3 rounded-xl bg-[var(--btn-plain-bg)] border border-[var(--line-divider)] text-base resize-none focus:outline-none focus:border-[var(--primary)] transition-colors"
			></textarea>
			<div class="flex gap-3 justify-end">
				<button
					onclick={cancelFeedback}
					class="px-5 py-2.5 rounded-xl text-base font-medium border border-[var(--line-divider)] transition-all hover:bg-[var(--btn-plain-bg-hover)]"
				>
					{i18n(I18nKey.cancel)}
				</button>
				<button
					onclick={handleOtherSubmit}
					disabled={state === "submitting" || !feedbackText.trim()}
					class="px-5 py-2.5 rounded-xl text-base font-medium bg-[var(--primary)] text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{i18n(I18nKey.submit)}
				</button>
			</div>
		</div>
	{:else if state === "submitted" || state === "failed"}
		<div class="flex items-center justify-center gap-3 py-3">
			{#if state === "submitted"}
				{#if submittedType === "helpful"}
					<span class="text-3xl">👍</span>
					<div class="flex flex-col">
						<span class="text-lg font-medium text-[var(--primary)]">{i18n(I18nKey.thankYouHelpful)}</span>
						<svg class="w-6 h-6 text-[var(--primary)] mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
					</div>
				{:else if submittedType === "not_helpful"}
					<span class="text-3xl">👎</span>
					<div class="flex flex-col">
						<span class="text-lg font-medium text-[var(--not-helpful)]">{i18n(I18nKey.thankYouNotHelpful)}</span>
						<svg class="w-6 h-6 text-[var(--not-helpful)] mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
					</div>
				{:else}
					<span class="text-3xl">💬</span>
					<div class="flex flex-col">
						<span class="text-lg font-medium text-[var(--text-secondary)]">{i18n(I18nKey.thankYouOtherFeedback)}</span>
						<svg class="w-6 h-6 text-[var(--text-secondary)] mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
					</div>
				{/if}
			{:else}
				<span class="text-3xl">
					{#if submittedType === "helpful"}👍{:else if submittedType === "not_helpful"}👎{:else}💬{/if}
				</span>
				<div class="flex flex-col">
					<span class="text-lg font-medium text-[var(--fail-color)]">{failMessage}</span>
					<button onclick={retry} class="text-base text-[var(--text-secondary)] underline mt-1 hover:text-[var(--primary)] transition-colors">
						Retry
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.feedback-container {
		background: var(--card-bg);
		transition: all 0.3s ease;
	}
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

	:global(.success-helpful) {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
		border-color: rgba(34, 197, 94, 0.3);
		animation: fadeIn 0.3s ease;
	}
	:global(.success-not-helpful) {
		background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05));
		border-color: rgba(249, 115, 22, 0.3);
		animation: fadeIn 0.3s ease;
	}
	:global(.success-other) {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
		border-color: rgba(59, 130, 246, 0.3);
		animation: fadeIn 0.3s ease;
	}
	:global(.fail) {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
		border-color: rgba(239, 68, 68, 0.3);
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.98);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
