// Helper utilities that DO NOT import from init-firebase.
// Keep this file dependency-free to avoid circular imports.

import { list } from "firebase/storage";

/**
 * Paginate a Storage folder ref and call onPage(result) for each page.
 * Usage:
 *   import { storage } from "@/utils/init-firebase";
 *   import { ref } from "firebase/storage";
 *   import { listPages } from "@/utils/init-firebase-data";
 *   const rootRef = ref(storage, "images/users/UID/closet");
 *   await listPages(rootRef, (res) => { ...res.items... });
 */
export async function listPages(rootRef, onPage) {
  let pageToken;
  do {
    const res = await list(rootRef, { maxResults: 1000, pageToken });
    onPage?.(res);
    pageToken = res.nextPageToken;
  } while (pageToken);
}
