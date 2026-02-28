<script lang="ts">
  import { icons } from "../lib/icons";
  import { selectLibrary } from "../lib/store";
</script>

<div class="empty-state">
  <div class="empty-content">
    <div class="hero-glow"></div>
    <div class="hero-icon">
      {@html icons.camera}
    </div>

    <h1 class="title">Welcome to Galleria Expressive</h1>
    <p class="subtitle">
      Your premium gallery experience starts here.<br />
      Import a folder to begin organizing your photos.
    </p>

    <button class="cta-btn" on:click={selectLibrary}>
      <span class="cta-icon">{@html icons.plus}</span>
      Open Photo Library
    </button>

    <div class="features">
      <div class="feature-chip">
        <span class="feature-icon">{@html icons.search}</span>
        <span>Smart Search</span>
      </div>
      <div class="feature-chip">
        <span class="feature-icon">{@html icons.grid}</span>
        <span>Beautiful Grid</span>
      </div>
      <div class="feature-chip">
        <span class="feature-icon">{@html icons.tag}</span>
        <span>Tag & Organize</span>
      </div>
    </div>
  </div>
</div>

<style>
  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-8);
    animation: fadeIn var(--duration-slow) var(--ease-emphasized-decel);
  }

  .empty-content {
    text-align: center;
    max-width: 440px;
    position: relative;
  }

  /* ── M3 Hero Glow ── */
  .hero-glow {
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    width: 220px;
    height: 220px;
    background: radial-gradient(
      circle,
      var(--accent-subtle) 0%,
      transparent 70%
    );
    border-radius: 50%;
    pointer-events: none;
    animation: breathe 4s ease-in-out infinite;
  }

  /* ── M3 Hero Icon (Large rounded container) ── */
  .hero-icon {
    position: relative;
    width: 88px;
    height: 88px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--sp-8);
    background: var(--accent-container);
    border-radius: var(--radius-2xl);
    color: var(--accent-on-container);
  }

  .hero-icon :global(svg) {
    width: 40px;
    height: 40px;
  }

  /* ── M3 Typography ── */
  .title {
    font-size: var(--text-2xl);
    font-weight: 700;
    letter-spacing: var(--letter-tight);
    color: var(--text-primary);
    margin-bottom: var(--sp-3);
  }

  .subtitle {
    font-size: var(--text-md);
    color: var(--text-secondary);
    line-height: 1.7;
    margin-bottom: var(--sp-10);
  }

  /* ── M3 Filled Button (CTA) ── */
  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-6);
    background: var(--accent);
    color: var(--text-on-accent);
    border-radius: var(--radius-full);
    font-size: var(--text-md);
    font-weight: 600;
    box-shadow: var(--shadow-md);
    transition: var(--transition-base);
    min-height: 48px;
  }

  .cta-btn:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-1px);
  }

  .cta-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .cta-icon {
    display: flex;
  }

  .cta-icon :global(svg) {
    width: 18px;
    height: 18px;
  }

  /* ── M3 Assist Chips (Feature Indicators) ── */
  .features {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin-top: var(--sp-10);
  }

  .feature-chip {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-secondary);
    padding: 8px 16px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--radius-full);
    transition: var(--transition-fast);
  }

  .feature-chip:hover {
    background: var(--accent-subtle);
  }

  .feature-icon {
    display: flex;
    color: var(--accent);
  }

  .feature-icon :global(svg) {
    width: 16px;
    height: 16px;
  }
</style>
