// src/lib/server/events.js
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