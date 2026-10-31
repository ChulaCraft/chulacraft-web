export const TEAM_ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change the team page.",
  NOT_FOUND: "That person, generation or linked player no longer exists.",
  INVALID_GEN: "Give the generation a name, up to 40 characters. E.g. Gen 0.",
  INVALID: "Fill in a name (up to 60 characters), keep the role under 60 and the bio under 300.",
  BAD_PLAYER: "That player link doesn't look right. Paste the address of their player page.",
  BAD_LINK: "Links have to start with https://.",
  BAD_IMAGE_TYPE: "That file isn't a PNG, JPEG, WebP or GIF image.",
  IMAGE_TOO_LARGE: "That photo is bigger than 2 MB. Please upload a smaller one.",
  UPLOAD_FAILED: "The photo couldn't be uploaded. Nothing was changed.",
  FAILED: "That didn't save. Please try again."
};

export const TEAM_DONE: Record<string, string> = {
  "gen-created": "Generation created. Add its people below.",
  "gen-saved": "Generation renamed.",
  "gen-deleted": "Generation and everyone in it removed.",
  added: "Added to the team page.",
  saved: "Saved.",
  moved: "Order saved.",
  deleted: "Removed from the team page."
};
