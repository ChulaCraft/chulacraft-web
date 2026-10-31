// events.category values (20261020000001) and how cards label them.
export const EVENT_CATEGORIES = [
  { value: "build", label: "Build challenge" },
  { value: "community", label: "Community" },
  { value: "survival", label: "Survival" },
  { value: "minigame", label: "Minigames" },
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number]["value"];

export const toCategory = (value: unknown): EventCategory | null =>
  EVENT_CATEGORIES.find((c) => c.value === value)?.value ?? null;

export const categoryLabel = (value: string | null | undefined) =>
  EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? null;
