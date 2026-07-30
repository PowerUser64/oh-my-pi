import { describe, expect, test } from "bun:test";
import { formatContextUsage } from "../src/modes/components/status-line/context-thresholds";

describe("formatContextUsage", () => {
	describe("default behavior (no format string)", () => {
		test("renders percent/window when window is known", () => {
			expect(formatContextUsage(50, 1_000_000)).toBe("50.0%/1M");
		});

		test("renders tokens/? when window is unknown", () => {
			expect(formatContextUsage(50, 0, 500_000)).toBe("500K/?");
		});

		test("renders 0/? when window is invalid and no tokens provided", () => {
			expect(formatContextUsage(50, -1)).toBe("0/?");
		});

		test("renders ? for percent when contextPercent is null", () => {
			expect(formatContextUsage(null, 1_000_000)).toBe("?/1M");
		});

		test("renders ? for percent when contextPercent is undefined", () => {
			expect(formatContextUsage(undefined, 1_000_000)).toBe("?/1M");
		});
	});

	describe("format string with escapes", () => {
		test("replaces %t with tokens", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%t")).toBe("500K");
		});

		test("replaces %p with percent", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%p")).toBe("50.0%");
		});

		test("replaces %w with window", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%w")).toBe("1M");
		});

		test("replaces %% with literal percent", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%%")).toBe("%");
		});

		test("handles multiple escapes", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%t/%w")).toBe("500K/1M");
		});

		test("handles mixed text and escapes", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%p of %w")).toBe("50.0% of 1M");
		});

		test("handles literal percent with text", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%% usage: %p")).toBe("% usage: 50.0%");
		});

		test("passes through unknown escapes", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%x")).toBe("%x");
		});

		test("handles null percent in format", () => {
			expect(formatContextUsage(null, 1_000_000, 500_000, "%p")).toBe("?");
		});

		test("handles undefined percent in format", () => {
			expect(formatContextUsage(undefined, 1_000_000, 500_000, "%p")).toBe("?");
		});

		test("handles invalid window in format", () => {
			expect(formatContextUsage(50, 0, 500_000, "%w")).toBe("?");
		});

		test("handles missing tokens in format", () => {
			expect(formatContextUsage(50, 1_000_000, undefined, "%t")).toBe("?");
		});

		test("treats empty format string as no format (falls through to default)", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "")).toBe("50.0%/1M");
		});

		test("handles format with no escapes", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "context")).toBe("context");
		});

		test("handles consecutive %% escapes", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%%%%")).toBe("%%");
		});

		test("handles complex format string", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%t tokens (%p) of %w")).toBe("500K tokens (50.0%) of 1M");
		});
		test("handles %p followed by w without reparsing", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, "%pw")).toBe("50.0%w");
		});

		test("handles non-string format (falls through to default)", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, undefined as unknown as string)).toBe("50.0%/1M");
		});

		test("handles number format (falls through to default)", () => {
			expect(formatContextUsage(50, 1_000_000, 500_000, 123 as unknown as string)).toBe("50.0%/1M");
		});
	});
});
