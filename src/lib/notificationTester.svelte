<script>
  import { db } from "$lib/firebase";
  import { authStore } from "../store/auth.js";
  import { collection, addDoc, serverTimestamp } from "firebase/firestore";

  let sending = $state(false);

  async function sendTestNotification() {
    if (!$authStore?.user?.uid) {
      alert("You must be logged in to test this!");
      return;
    }

    sending = true;
    try {
      await addDoc(collection(db, "notifications"), {
        recipientUid: $authStore.user.uid,
        title: "Test Alert! 🔔",
        body: "This is a manual notification sent via the test button.",
        link: "/profile",
        read: false,
        createdAt: serverTimestamp()
      });
      console.log("Notification sent successfully!");
    } catch (err) {
      console.error("Error sending notification:", err);
    } finally {
      sending = false;
    }
  }
</script>

<button 
  class="test-btn" 
  onclick={sendTestNotification} 
  disabled={sending}
>
  {sending ? "Sending..." : "🚀 Trigger Test Notification"}
</button>

<style>
  .test-btn {
    background-color: #2CA58D;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .test-btn:hover { transform: scale(1.05); }
  .test-btn:disabled { background-color: #ccc; }
</style>