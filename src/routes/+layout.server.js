import { db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const load = async ({ url }) => {
  // 1. CHECK: Are we actually on an admin page?
  // We check if the path starts with '/admin'. 
  // If not, we return null immediately to save database reads and avoid errors.
  if (!url.pathname.startsWith('/admin')) {
    return { userOrg: null };
  }

  // 2. If we ARE on an admin page, fetch the data
  // (Eventually, you will get this ID from the authenticated user's session)
  const testOrgId = "xB0ABinqEJVHA4ifZUVF"; 

  try {
    const orgRef = doc(db, 'orgs', testOrgId);
    const orgSnap = await getDoc(orgRef);
    
    let navData = {
      name: "Your Org",
      followers: 0,
      image: "https://via.placeholder.com/150", 
      foundedYear: "2024"
    };

    if (orgSnap.exists()) {
      const d = orgSnap.data();
      navData = {
        name: d.orgName || "Unnamed Org",
        followers: d.followers || 0,
        image: d.image || "https://via.placeholder.com/150",
        foundedYear: d.foundedYear || "2025" 
      };
    }

    return {
      userOrg: navData
    };

  } catch (err) {
    console.error("Layout Load Error:", err);
    // If it fails, return null so the UI handles it gracefully
    return { userOrg: null };
  }
};