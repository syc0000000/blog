<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	type FeedbackType = "helpful" | "not_helpful" | "other";
	type FeedbackState = "idle" | "feedback_form";

	let state: FeedbackState = $state("idle");
	let selectedType: FeedbackType | null = $state(null);
	let feedbackText: string = $state("");
	let submittedType: FeedbackType | null = $state(null);
	let rippleStyle: string = $state("");

	const handleFeedbackClick = async (type: FeedbackType, event: MouseEvent) => {
		if (state === "feedback_form") return;

		if (type === "other") {
			state = "feedback_form";
			selectedType = type;
			return;
		}

		// Calculate ripple from click position relative to container
		const target = event.currentTarget as HTMLElement;
		const container = target.closest('.feedback-container') as HTMLElement;
		const containerRect = container.getBoundingClientRect();
		const x = event.clientX - containerRect.left;
		const y = event.clientY - containerRect.top;
		const size = Math.max(containerRect.width, containerRect.height) * 2;
		rippleStyle = `left: ${x - size / 2}px; top: ${y - size / 2}px; width: ${size}px; height: ${size}px;`;

		selectedType = type;
		submittedType = type;
		state = "idle";

		// Fire and forget
		fetch("/api/feedback", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slug, type, content: "" }),
		}).catch(() => {});
	};

	const handleOtherSubmit = async () => {
		if (!feedbackText.trim()) return;

		selectedType = "other";
		submittedType = "other";
		state = "idle";
		feedbackText = "";

		// Fire and forget
		fetch("/api/feedback", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slug, type: "other", content: feedbackText }),
		}).catch(() => {});
	};

	const cancelFeedback = () => {
		state = "idle";
		selectedType = null;
		feedbackText = "";
	};
</script>

<div class="feedback-container p-6 rounded-2xl border" class:feedback-helpful={submittedType === "helpful"} class:feedback-not-helpful={submittedType === "not_helpful"} class:feedback-other={submittedType === "other"}>
	{#if !submittedType}
		{#if state === "idle"}
			<div class="flex flex-col sm:flex-row items-center gap-4 relative z-10">
				<div class="flex items-center gap-2 text-[var(--text-secondary)] text-base">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 1 .024-.083c1.438-.164 2.403-.513 3.197-1.116a.375.375 0 0 1 .207-.043c.21.014.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c.62-.273 1.218-.69 1.698-1.186a.375.375 0 0 1 .207-.043c.21.015.42.032.63.05.13.015.258.029.386.044a5.955 5.955 0 0 0 3.898-.044c1.064-.31 1.853-.92 2.254-1.69a.375.375 0 0 1 .207-.043" />
					</svg>
					<span class="font-medium">{i18n(I18nKey.feedbackPrompt)}</span>
				</div>
				<div class="flex gap-3">
					<button
						onclick={(e) => handleFeedbackClick("helpful", e)}
						class="feedback-btn px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all"
					>
						<span>{i18n(I18nKey.helpful)}</span>
					</button>
					<button
						onclick={(e) => handleFeedbackClick("not_helpful", e)}
						class="feedback-btn px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all"
					>
						<span>{i18n(I18nKey.notHelpful)}</span>
					</button>
					<button
						onclick={(e) => handleFeedbackClick("other", e)}
						class="feedback-btn px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 border border-[var(--line-divider)] transition-all"
					>
						<span>{i18n(I18nKey.otherFeedback)}</span>
					</button>
				</div>
			</div>
		{:else if state === "feedback_form"}
			<div class="flex flex-col gap-4 relative z-10">
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
						disabled={!feedbackText.trim()}
						class="px-5 py-2.5 rounded-xl text-base font-medium bg-[var(--primary)] text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{i18n(I18nKey.submit)}
					</button>
				</div>
			</div>
		{/if}

		<div class="ripple-overlay" style={rippleStyle}></div>
	{:else}
		<div class="flex items-center justify-center gap-4 success-content">
			<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
			</svg>
			<span class="text-lg font-medium">
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
	.feedback-container {
		background: var(--card-bg);
		position: relative;
		overflow: hidden;
		transition: background 0.4s ease, border-color 0.4s ease;
	}

	.feedback-helpful {
		border-color: rgba(34, 197, 94, 0.5);
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.06));
	}
	.feedback-not-helpful {
		border-color: rgba(249, 115, 22, 0.5);
		background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(249, 115, 22, 0.06));
	}
	.feedback-other {
		border-color: rgba(59, 130, 246, 0.5);
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
	}

	.ripple-overlay {
		position: absolute;
		border-radius: 50%;
		transform: scale(0);
		animation: ripple-expand 0.5s ease-out forwards;
		pointer-events: none;
	}

	.feedback-helpful .ripple-overlay {
		background: rgba(34, 197, 94, 0.25);
	}
	.feedback-not-helpful .ripple-overlay {
		background: rgba(249, 115, 22, 0.25);
	}
	.feedback-other .ripple-overlay {
		background: rgba(59, 130, 246, 0.25);
	}

	.feedback-btn {
		background: var(--btn-plain-bg);
		color: var(--text-secondary);
	}
	.feedback-btn:hover {
		border-color: var(--primary);
		color: var(--primary);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	.feedback-btn:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.success-content {
		animation: content-appear 0.3s ease-out 0.15s both;
	}

	@keyframes ripple-expand {
		to {
			transform: scale(1);
		}
	}

	@keyframes content-appear {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
