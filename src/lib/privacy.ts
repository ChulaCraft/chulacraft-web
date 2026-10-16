// Privacy choices, shared by /settings and the admin player page.
export const LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: "public", label: "Anyone signed in" },
  { value: "friends", label: "Friends only" },
  { value: "private", label: "Nobody" }
];

export const PRIVACY_FIELDS = [
  ["profile", "Profile", "Whether anybody can open your profile at all."],
  ["minecraft", "Minecraft names", "The usernames linked to your account."],
  ["achievements", "Achievements", "The badges you have earned."],
  ["friends", "Friend list", "Who you are friends with."]
] as const;

export type Privacy = Record<(typeof PRIVACY_FIELDS)[number][0], string>;
