import PocketBase from "pocketbase";

const BASE_URL = "https://pocketbase-production-a72b.up.railway.app";

export const pb = new PocketBase(BASE_URL);

export function getImageUrl(
  collectionId: string,
  recordId: string,
  imageFileName: string,
  thumb = false
) {
  return `${BASE_URL}/api/files/${collectionId}/${recordId}/${imageFileName}${
    thumb ? "?thumb=100x100" : ""
  }`;
}
