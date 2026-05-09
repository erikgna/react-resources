import { atom, computed } from "nanostores";

export const $count = atom(0);
export const $doubled = computed($count, (n) => n * 2);
export const $label = computed($count, (n) =>
  n > 0 ? "positive" : n < 0 ? "negative" : "zero"
);
