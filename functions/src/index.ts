import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

export const sendPostNotifications = onDocumentCreated(
  "posts/{postId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const postData = snapshot.data();

    if (postData.notifyFollowers !== true) {
      console.log("Post does not require notifications. Exiting.");
      return;
    }

    const orgId = postData.orgId;
    const orgName = postData.orgName || "An Organization";
    const postTitle = postData.title || "New Announcement";

    try {
      const followersSnapshot = await db.collection("users")
        .where("followedOrgs", "array-contains", orgId)
        .get();

      if (followersSnapshot.empty) {
        console.log(`No followers found for org ${orgId}.`);
        return;
      }

      const allTokens: string[] = [];

      followersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const userTokens = userData.fcmTokens || [];

        if (Array.isArray(userTokens) && userTokens.length > 0) {
          allTokens.push(...userTokens);
        }
      });

      if (allTokens.length === 0) {
        console.log("No registered FCM tokens found.");
        return;
      }

      const message = {
        notification: {
          title: `Update from ${orgName}`,
          body: postTitle,
        },
        data: {
          route: `/post/${event.params.postId}`,
          type: "new_post",
        },
        tokens: allTokens,
      };

      const response = await messaging.sendEachForMulticast(message);

      console.log(`Successfully sent ${response.successCount} messages.`);
      if (response.failureCount > 0) {
        console.warn(`${response.failureCount} messages failed to send.`);
      }
    } catch (error) {
      console.error("Fatal error sending post notifications:", error);
    }
  },
);
