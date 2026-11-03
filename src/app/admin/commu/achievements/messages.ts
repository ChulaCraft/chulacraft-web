export const ACHIEVEMENT_ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change achievements.",
  NOT_FOUND: "That achievement no longer exists. Refresh and try again.",
  BAD_IMAGE_TYPE: "That file isn't a PNG, JPEG, WebP or GIF image.",
  IMAGE_TOO_LARGE: "That image is bigger than 2 MB. Please upload a smaller one.",
  UPLOAD_FAILED: "The image couldn't be uploaded. Nothing was changed.",
  INVALID: "Pick one of the listed tiers. The rest of the achievement was saved.",
  ROLE_NOT_ALLOWED: "That Discord role isn't on the list admins allow. The rest of the achievement was saved; pick another role or none.",
  FAILED: "The change couldn't be saved. Please try again."
};

/** The New page's wording. INVALID and ROLE_NOT_ALLOWED differ from the edit
 *  wording above: a refused create removes the new achievement, so nothing was
 *  saved. A file input can't be refilled, hence "pick the image again". */
export const NEW_ACHIEVEMENT_ERRORS: Record<string, string> = {
  ...ACHIEVEMENT_ERRORS,
  NAME_INVALID: "Give the achievement a name of 1 to 80 characters.",
  DESCRIPTION_TOO_LONG: "The description is longer than 500 characters. Shorten it and try again.",
  BAD_IMAGE_TYPE: "That file isn't a PNG, JPEG, WebP or GIF image. Pick the image again.",
  IMAGE_TOO_LARGE: "That image is bigger than 2 MB. Pick a smaller image.",
  UPLOAD_FAILED: "The image couldn't be uploaded, so nothing was created. Pick the image again and retry.",
  INVALID: "Pick one of the listed tiers. Nothing was created; pick the image again if you chose one.",
  ROLE_NOT_ALLOWED: "That Discord role isn't on the list admins allow. Nothing was created; pick another role or none, and pick the image again if you chose one.",
  FAILED: "The achievement couldn't be created. Nothing was saved; pick the image again if you chose one and retry."
};

