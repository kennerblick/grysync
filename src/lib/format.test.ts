import { expect, it } from "vitest";
import { formatBytes, formatDuration } from "./format";

it("formats bytes", () => {
  expect(formatBytes(0)).toBe("0 B");
  expect(formatBytes(1536)).toBe("1.5 KB");
  expect(formatBytes(5 * 1024 ** 3)).toBe("5.0 GB");
});

it("formats durations", () => {
  expect(formatDuration(4200)).toBe("4s");
  expect(formatDuration(125_000)).toBe("2m 5s");
  expect(formatDuration(3_720_000)).toBe("1h 2m");
});
