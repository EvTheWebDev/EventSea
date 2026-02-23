import { db } from '$lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function getAllEvents() {
  const eventsRef = collection(db, 'events');
  const eventsSnapshot = await getDocs(eventsRef);

  const events = await Promise.all(
    eventsSnapshot.docs.map(async (eventDoc) => {
      const eventData = eventDoc.data();
      
      // 1. Handle Org Logic
      const orgId = eventData.ORG_ID; 
      let orgName = "Unknown Org";
      
      if (orgId && typeof orgId === 'string') {
        const orgRef = doc(db, 'orgs', orgId);
        const orgSnap = await getDoc(orgRef);
        if (orgSnap.exists()) {
            orgName = orgSnap.data().Name;
        }
      }

      // 2. Handle Date Logic
      // We create a safe string version of the date immediately
      let safeDate = "No Date";
      if (eventData.DATE && typeof eventData.DATE.toDate === 'function') {
          safeDate = eventData.DATE.toDate().toString();
      } else if (eventData.DATE) {
          safeDate = eventData.DATE.toString();
      }

      return {
        id: eventDoc.id,
        ...eventData,     // Copies everything... including the BAD 'DATE' object
        DATE: safeDate,   // <--- CRITICAL FIX: Overwrite 'DATE' with the string!
        orgName
      };
    })
  );

  return events;
}

/**
 * Fetches a specific list of events based on an array of IDs.
 * Used for Org Dashboards, Saved Events, etc.
 * * @param {string[]} eventIds - Array of document IDs to fetch
 */
export async function getEventsByIds(eventIds) {
  if (!eventIds || eventIds.length === 0) return [];

  // We map over the IDs and fetch each specific document
  const eventPromises = eventIds.map(async (eventId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) return null;

      const eventData = eventSnap.data();

      // --- REUSED LOGIC: Org Name Lookup ---
      // We repeat this logic so this function works even on pages 
      // where we don't know the org name yet (like a "Saved Events" page)
      let orgName = "Unknown Org";
      const orgId = eventData.ORG_ID;
      
      if (orgId && typeof orgId === 'string') {
        const orgRef = doc(db, 'orgs', orgId);
        const orgSnap = await getDoc(orgRef);
        if (orgSnap.exists()) orgName = orgSnap.data().name;
      }

      // --- REUSED LOGIC: Date Serialization ---
      let safeDate = "No Date";
      if (eventData.DATE && typeof eventData.DATE.toDate === 'function') {
         safeDate = eventData.DATE.toDate().toString();
      } else if (eventData.DATE) {
         safeDate = eventData.DATE.toString();
      }

      return {
        id: eventSnap.id,
        ...eventData,
        DATE: safeDate,
        orgName
      };

    } catch (err) {
      console.error(`Failed to load event ${eventId}:`, err);
      return null;
    }
  });

  // Wait for all to finish and filter out any failed/null loads
  const results = await Promise.all(eventPromises);
  return results.filter(e => e !== null);
}

/**
 * Takes an array of UIDs and returns an array of user objects (name, email, etc.)
 * @param {string[]} uids 
 */
export async function getAdminDetails(uids) {
    if (!uids || uids.length === 0) return [];

    const userPromises = uids.map(async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                    uid: userSnap.id,
                    name: userData.name || userData.displayName || 'Unknown Admin',
                    email: userData.email || 'No Email Provided',
                    pfp: userData.pfp || userData.photoURL || ''
                };
            }
            return null;
        } catch (err) {
            console.error(`Error fetching user ${uid}:`, err);
            return null;
        }
    });

    const results = await Promise.all(userPromises);
    // Filter out any nulls (users that didn't exist in the database)
    return results.filter(user => user !== null);
}