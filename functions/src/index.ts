import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";


admin.initializeApp();

/**
 * Triggered when a new event is created.
 */
export const fanOutEventNotification = onDocumentCreated("events/{eventId}", async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const eventSnapshot = event.data;
    if (!eventSnapshot) return;

    const eventData = eventSnapshot.data();
   const shouldNotify = eventData.notifyFollowers || eventData.NOTIFY_FOLLOWERS;

if (!shouldNotify) {
    console.log("Notify Followers was not checked. Skipping fan-out.");
    return;
}

    const db = getFirestore();
    const orgId = eventData["ORG_ID"] || eventData["orgId"];

    if (!orgId) return;

    try {
        const orgSnap = await db.collection("orgs").doc(orgId).get();
        const orgData = orgSnap.data();
        if (!orgSnap.exists || !orgData) return;

        const followers: string[] = orgData.followers || [];
        const orgName: string = orgData.orgName || "An organization you follow";

        if (followers.length === 0) return;

        const batch = db.batch();
        followers.forEach((uid: string) => {
            const notificationRef = db.collection("notifications").doc();
            batch.set(notificationRef, {
                recipientUid: uid,
                title: `New Event: ${eventData.TITLE}`,
                body: `${orgName} just posted an event for ${eventData.DATE}!`,
                link: `/events/${event.params.eventId}`,
                read: false,
                createdAt: FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log(`Fanned out ${followers.length} notifications.`);
    } catch (error) {
        console.error("Fan-out failed:", error);
    }
});


export const sendRSVPReminders = onSchedule("every 5 minutes", async (event) => {
    const db = getFirestore();
    const now = new Date();
    
    // 1. Define our "Target Window" (30 minutes from now)
    const targetWindowStart = new Date(now.getTime() + 27 * 60000); 
    const targetWindowEnd = new Date(now.getTime() + 33 * 60000);

    // 2. Query for events happening TODAY
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    try {
        const todaysEvents = await db.collection("events")
            .where("DATE", ">=", Timestamp.fromDate(startOfToday))
            .where("DATE", "<=", Timestamp.fromDate(endOfToday))
            .get();

        const batch = db.batch();
        let totalSent = 0;

        todaysEvents.forEach((doc) => {
            const data = doc.data();
            const startTimeStr = data.START_TIME; // e.g., "15:30"

            if (!startTimeStr) return;

            // 3. Convert START_TIME string to a Date object for comparison
            const [hours, minutes] = startTimeStr.split(':').map(Number);
            const eventTime = new Date();
            eventTime.setHours(hours, minutes, 0, 0);

            // 4. Check if the event falls within our 6-minute reminder window
            if (eventTime >= targetWindowStart && eventTime <= targetWindowEnd) {
                const rsvps: string[] = data.rsvps || [];
                
                rsvps.forEach((uid) => {
                    const notifyRef = db.collection("notifications").doc();
                    batch.set(notifyRef, {
                        recipientUid: uid,
                        title: "Starting Soon! ⏳",
                        body: `${data.TITLE} begins at ${startTimeStr}. See you there!`,
                        link: `/events/${doc.id}`,
                        read: false,
                        createdAt: FieldValue.serverTimestamp(),
                        type: "RSVP_REMINDER"
                    });
                    totalSent++;
                });
            }
        });

        if (totalSent > 0) {
            await batch.commit();
            console.log(`Successfully sent ${totalSent} RSVP reminders.`);
        } else {
            console.log("Sweep complete: No events in the 30-minute window.");
        }
    } catch (error) {
        console.error("Scheduled reminder sweep failed:", error);
    }
});