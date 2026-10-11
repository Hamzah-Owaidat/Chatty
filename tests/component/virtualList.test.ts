import { describe, it, expect } from "vitest";
import { countPrepended } from "@/utils/virtualList";

const key = (item: { id: string }) => item.id;
const items = (...ids: string[]) => ids.map((id) => ({ id }));

describe("countPrepended", () => {
  it("counts the items inserted before the previous first item", () => {
    expect(countPrepended(items("c", "d"), items("a", "b", "c", "d"), key)).toBe(2);
  });

  it("is 0 when items are only appended", () => {
    expect(countPrepended(items("a", "b"), items("a", "b", "c"), key)).toBe(0);
  });

  it("is 0 when the list was replaced", () => {
    expect(countPrepended(items("a", "b"), items("x", "y"), key)).toBe(0);
  });

  it("is 0 when either list is empty", () => {
    expect(countPrepended([], items("a"), key)).toBe(0);
    expect(countPrepended(items("a"), [], key)).toBe(0);
  });
});
