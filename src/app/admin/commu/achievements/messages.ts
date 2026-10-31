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
