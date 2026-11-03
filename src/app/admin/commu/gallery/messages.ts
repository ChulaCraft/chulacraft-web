export const GALLERY_ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change the gallery.",
  NOT_FOUND: "That group or picture no longer exists.",
  INVALID: "Give the group a topic (up to 60 characters) and keep the detail under 300.",
  NO_FILE: "Pick a picture to upload.",
  NO_ALT: "Describe the picture (up to 200 characters) for people who can't see it.",
  BAD_IMAGE_TYPE: "That file isn't a PNG, JPEG, WebP or GIF image.",
  IMAGE_TOO_LARGE: "That picture is bigger than 2 MB. Please upload a smaller one.",
  UPLOAD_FAILED: "The picture couldn't be uploaded. Nothing was changed.",
  FAILED: "That didn't save. Please try again."
};

export const GALLERY_DONE: Record<string, string> = {
  "group-created": "Group created. Add its pictures below.",
  "group-saved": "Group saved.",
  "cover-saved": "Cover saved.",
  "cover-removed": "Cover removed. The first picture is used instead.",
  "group-deleted": "Group and its pictures deleted.",
  added: "Picture added.",
  saved: "Picture saved.",
  "moved-group": "Picture moved to the other group.",
  moved: "Order saved.",
  deleted: "Picture deleted."
};
