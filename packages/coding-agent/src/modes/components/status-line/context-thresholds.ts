import { formatNumber } from "@oh-my-pi/pi-utils";
import type { ThemeColor } from "../../../modes/theme/theme";

export type ContextUsageLevel = "normal" | "warning" | "purple" | "error";

const CONTEXT_WARNING_PERCENT_THRESHOLD = 50;
const CONTEXT_WARNING_TOKEN_THRESHOLD = 150_000;
const CONTEXT_PURPLE_PERCENT_THRESHOLD = 70;
const CONTEXT_PURPLE_TOKEN_THRESHOLD = 270_000;
const CONTEXT_ERROR_PERCENT_THRESHOLD = 90;
const CONTEXT_ERROR_TOKEN_THRESHOLD = 500_000;

function reachesThreshold(
	contextPercent: number,
	contextWindow: number,
	percentThreshold: number,
	tokenThreshold: number,
): boolean {
	if (!Number.isFinite(contextPercent) || contextPercent <= 0) {
		return false;
	}

	if (!Number.isFinite(contextWindow) || contextWindow <= 0) {
		return contextPercent >= percentThreshold;
	}

	const tokenPercentThreshold = (tokenThreshold / contextWindow) * 100;
	return contextPercent >= Math.min(percentThreshold, tokenPercentThreshold);
}

export function getContextUsageLevel(contextPercent: number, contextWindow: number): ContextUsageLevel {
	if (
		reachesThreshold(contextPercent, contextWindow, CONTEXT_ERROR_PERCENT_THRESHOLD, CONTEXT_ERROR_TOKEN_THRESHOLD)
	) {
		return "error";
	}

	if (
		reachesThreshold(contextPercent, contextWindow, CONTEXT_PURPLE_PERCENT_THRESHOLD, CONTEXT_PURPLE_TOKEN_THRESHOLD)
	) {
		return "purple";
	}

	if (
		reachesThreshold(
			contextPercent,
			contextWindow,
			CONTEXT_WARNING_PERCENT_THRESHOLD,
			CONTEXT_WARNING_TOKEN_THRESHOLD,
		)
	) {
		return "warning";
	}

	return "normal";
}

/**
 * Format context usage. When `format` is provided, it is treated as a format
 * template with percent escapes: `%t` = used tokens, `%p` = percent used,
 * `%w` = window size, `%%` = literal `%`. Unknown escapes pass through.
 *
 * Without a format, renders `<percent>%/<window>` when the window is known,
 * or `<tokens>/?` when it is not (avoids `0.0%/0` looking like real empty
 * context instead of missing provider metadata).
 */
export function formatContextUsage(
	contextPercent: number | null | undefined,
	contextWindow: number,
	usedTokens?: number,
	format?: string,
): string {
	if (typeof format !== "string" || format.length === 0) {
		if (!Number.isFinite(contextWindow) || contextWindow <= 0) {
			return `${formatNumber(usedTokens ?? 0)}/?`;
		}
		const pct = contextPercent === null || contextPercent === undefined ? "?" : `${contextPercent.toFixed(1)}%`;
		return `${pct}/${formatNumber(contextWindow)}`;
	}

	const pct = contextPercent === null || contextPercent === undefined ? "?" : `${contextPercent.toFixed(1)}%`;
	const tokens = usedTokens !== undefined ? formatNumber(usedTokens) : "?";
	const window = Number.isFinite(contextWindow) && contextWindow > 0 ? formatNumber(contextWindow) : "?";

	// Single-pass regex replacement to prevent `%p` output from being reinterpreted
	// by later escapes (e.g. `%pw` should render as `50.0%w`, not `50.01M`).
	return format.replace(/%(?:%|[tpw])/g, match => {
		switch (match) {
			case "%%":
				return "%";
			case "%t":
				return tokens;
			case "%p":
				return pct;
			case "%w":
				return window;
			default:
				return match;
		}
	});
}

export function getContextUsageThemeColor(level: ContextUsageLevel): ThemeColor {
	switch (level) {
		case "error":
			return "error";
		case "purple":
			return "thinkingHigh";
		case "warning":
			return "warning";
		case "normal":
			return "statusLineContext";
	}
}
