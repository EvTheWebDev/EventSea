// src/routes/post/[postId]/+page.js
import { db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
export const ssr = false;
export const prerender = false;
export const load = async ({ params }) => {
  // SvelteKit automatically extracts whatever is in the URL 
  // where the [postId] folder is and puts it in the params object.
  const postId = params.postId;

  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { post: null }; // We'll handle the "Not Found" state in the UI
    }

    return {
      post: {
        id: postSnap.id,
        ...postSnap.data()
      }
    };
  } catch (err) {
    console.error("Error fetching post:", err);
    return { post: null };
  }
};