<script>
  import { authStore } from "../../store/auth";
  import { db } from "../../lib/firebase";
  import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
  import Icon from "@iconify/svelte";
  import { fade, slide } from "svelte/transition";

  let notifications = $state([]);
  let showDropdown = $state(false);
  
  // Count only unread notifications for the red badge
  let unreadCount = $derived(notifications.filter(n => !n.read).length);

  // 1. Real-time Listener
  $effect(() => {
    if (!$authStore?.user?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientUid", "==", $authStore.user.uid),
      orderBy("createdAt", "desc")
    );

    // This listener updates the 'notifications' state whenever the DB changes
    const unsubscribe = onSnapshot(q, (snapshot) => {
      notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });

    return unsubscribe; // Cleanup on destroy
  });

  // 2. Mark as Read
  async function markAsRead(id) {
    const notifyRef = doc(db, "notifications", id);
    await updateDoc(notifyRef, { read: true });
  }

  // 3. Mark All as Read
  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }));
    await Promise.all(promises);
  }
</script>

<div class="bell-container">
  <button class="bell-btn" onclick={() => showDropdown = !showDropdown}>
    <Icon icon="mdi:bell-outline" width="28" height="28" />
    {#if unreadCount > 0}
      <span class="badge" transition:fade>{unreadCount}</span>
    {/if}
  </button>

  {#if showDropdown}
    <div class="dropdown" transition:slide>
      <div class="dropdown-header">
        <h3>Notifications</h3>
        {#if unreadCount > 0}
          <button class="clear-btn" onclick={markAllRead}>Mark all read</button>
        {/if}
      </div>

      <div class="notification-list">
        {#each notifications as n (n.id)}
          <div class="notification-item" class:unread={!n.read} onclick={() => markAsRead(n.id)}>
            <div class="dot"></div>
            <div class="text-content">
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              <small>{n.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
            </div>
          </div>
        {:else}
          <div class="empty-state">No notifications yet!</div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .bell-container { position: relative; display: inline-block; }
  
  .bell-btn {
    background: none; border: none; cursor: pointer; color: white;
    display: flex; align-items: center; padding: 8px; position: relative;
  }

  @media (max-width: 850px) {
    .bell-btn {
      padding: 8px;
      color: white;
    }
  }

  .badge {
    position: absolute; top: 5px; right: 5px;
    background: #ff4d4d; color: white; font-size: 10px;
    font-weight: bold; padding: 2px 6px; border-radius: 10px;
    border: 2px solid white;
  }

  .dropdown {
    position: absolute; right: 0; top: 50px;
    width: 320px; background: white; border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 1000;
    overflow: hidden;
  }

  .dropdown-header {
    padding: 15px; border-bottom: 1px solid #eee;
    display: flex; justify-content: space-between; align-items: center;
  }

  .dropdown-header h3 { margin: 0; font-size: 1rem; color: #1B065E; }

  .clear-btn { background: none; border: none; color: #2CA58D; cursor: pointer; font-size: 0.8rem; }

  .notification-list { max-height: 400px; overflow-y: auto; }

  .notification-item {
    display: flex; gap: 12px; padding: 12px 15px;
    border-bottom: 1px solid #f9f9f9; cursor: pointer; transition: background 0.2s;
  }

  .notification-item:hover { background: #f4f4f9; }

  .notification-item.unread { background: #f0f7f6; }
  .notification-item.unread .dot { background: #2CA58D; }

  .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; background: transparent; }

  .text-content strong { display: block; font-size: 0.9rem; color: #1B065E; }
  .text-content p { margin: 2px 0; font-size: 0.85rem; color: #666; }
  .text-content small { font-size: 0.75rem; color: #aaa; }

  .empty-state { padding: 40px 20px; text-align: center; color: #999; }
</style>