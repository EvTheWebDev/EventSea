<script>
  /** @type {{ open?: boolean; message?: string; onClose?: () => void }} */
  let { open = false, message = "", onClose = () => {} } = $props();

  /** @param {MouseEvent} event */
  function closeOnBackdrop(event) {
    if (event.currentTarget === event.target) {
      onClose();
    }
  }

  /** @param {KeyboardEvent} event */
  function closeOnEscape(event) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

{#if open}
  <div
    class="search-modal-overlay"
    role="button"
    aria-label="Close search result"
    onclick={closeOnBackdrop}
    onkeydown={closeOnEscape}
    tabindex="0"
  >
    <div
      class="search-modal"
      role="alertdialog"
      aria-modal="true"
      aria-label="Search result"
    >
      <button
        class="search-modal-close"
        aria-label="Close"
        onclick={() => onClose()}>×</button
      >
      <p class="search-modal-message">{message}</p>
    </div>
  </div>
{/if}

<style>
  .search-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(17, 9, 58, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .search-modal {
    position: relative;
    width: min(460px, 100%);
    background: white;
    border-radius: 18px;
    padding: 40px 32px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border: 2px solid #1b065e1a;
    text-align: center;
  }

  .search-modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid #1b065e;
    background: white;
    color: #1b065e;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    transition:
      background 160ms ease,
      color 160ms ease;
  }

  .search-modal-close:hover,
  .search-modal-close:focus-visible {
    background: #1b065e;
    color: white;
  }

  .search-modal-message {
    margin: 12px 0 0;
    padding: 8px 0;
    color: #1b065e;
    font-size: 1.2rem;
    font-family: "Mont-Semi";
    line-height: 1.4;
  }
</style>
