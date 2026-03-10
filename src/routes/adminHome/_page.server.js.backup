import { db } from '$lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { error } from '@sveltejs/kit';
// Import the new function alongside the old one if needed (or just the new one)
import { getEventsByIds } from '$lib/server/events'; 

export const load = async () => {
const orgsRef = collection(db, 'orgs');
  const allOrgs = await getDocs(orgsRef);
  console.log("--- AVAILABLE ORG IDs ---");
  allOrgs.forEach(doc => {
    console.log(`ID: ${doc.id} | Name: ${doc.data().orgName}`);
  });
  console.log("-------------------------");


  const testOrgId = "xB0ABinqEJVHA4ifZUVF"; 

  try {
    // 1. Fetch Org
    const orgRef = doc(db, 'orgs', testOrgId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) throw error(404, 'Organization not found');

    const orgData = orgSnap.data();
    
    // 2. Fetch Events using the new helper
    // We simply pass the array of IDs straight to the helper!
    const upcomingEvents = await getEventsByIds(orgData.upcomingEvents || []);

    return {
      orgStats: {
        followers: orgData.followers || 0,
        rsvps: orgData.rsvps || 0,
        orgName: orgData.orgName || "Unknown Org"
      },
      upcomingEvents // Pass the clean result to the page
    };

  } catch (err) {
    console.error("Error loading dashboard:", err);
    throw error(500, "Could not load dashboard data");
  }
};