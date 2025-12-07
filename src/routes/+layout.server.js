import { db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const load = async ({ url }) => {
  // 1. CHECK: Are we on an admin page?
  if (!url.pathname.startsWith('/admin')) {
    return { userOrg: null };
  }

  // 2. GET THE ID FROM THE URL
  // This is the magic step. We grab ?orgId=... from the browser bar
  const orgId = url.searchParams.get('orgId');

  // If no ID is in the URL (e.g. they just typed /adminHome), return null.
  // The page component will handle redirecting them to login/select.
  if (!orgId) {
    return { userOrg: null };
  }

  try {
    // 3. FETCH THE SPECIFIC ORG
    const orgRef = doc(db, 'orgs', orgId);
    const orgSnap = await getDoc(orgRef);
    
    // Default fallback data
    let navData = {
      orgID: orgId, // Keep the ID so the nav links work!
      name: "Loading...",
      followers: 0,
      image: null, 
      foundedYear: "..."
    };

    if (orgSnap.exists()) {
      const d = orgSnap.data();
      navData = {
        orgID: orgSnap.id, // Ensure ID is included in the object
        name: d.name || d.orgName || "Unnamed Org", // Check both common field names
        followers: d.followers || 0,
        image: d.image || null,
        foundedYear: d.foundedYear || "2025" 
      };
    }

    return {
      userOrg: navData
    };

  } catch (err) {
    console.error("Layout Load Error:", err);
    return { userOrg: null };
  }
};