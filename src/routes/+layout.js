import { db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// --- 1. THE HYBRID SMART SWITCH ---
// Vercel gets SSR (true), Mobile gets SPA (false)
const isMobile = import.meta.env.VITE_MOBILE_BUILD === 'true';
export const ssr = !isMobile;
export const trailingSlash = 'always';


// --- 2. UNIVERSAL LOAD FUNCTION ---
// This runs on the server for Vercel, and directly on the phone for Capacitor
export const load = async ({ url }) => {
  // 1. CHECK: Are we on an admin page?
  if (!url.pathname.startsWith('/admin')) {
    return { userOrg: null };
  }

  // 2. GET THE ID FROM THE URL
  const orgId = url.searchParams.get('orgId');

  if (!orgId) {
    return { userOrg: null };
  }

  try {
    // 3. FETCH THE SPECIFIC ORG
    const orgRef = doc(db, 'orgs', orgId);
    const orgSnap = await getDoc(orgRef);
    
    // Default fallback data
    let navData = {
      orgID: orgId, 
      orgName: "Loading...",
      followers: 0,
      image: null, 
      foundedYear: "..."
    };

    if (orgSnap.exists()) {
      const d = orgSnap.data();
      navData = {
        orgID: orgSnap.id, 
        orgName: d.orgName || d.name || "Unnamed Org", 
        followers: d.followers || 0,
        image: d.image || "/blankUser.png",
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