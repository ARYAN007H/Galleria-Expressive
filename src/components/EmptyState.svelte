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

    <h1 class="title">Welcome to ifoto</h1>
    <p class="subtitle">
      Your premium gallery experience starts here.<br />
      Import a folder to begin organizing your photos.
    </p>

    <button class="cta-btn" on:click={selectLibrary}>
      <span class="cta-icon">{@html icons.plus}</span>
      Open Photo Library
    </button>

    <div class="features">
      <div class="feature">
        <span class="feature-icon">{@html icons.search}</span>
        <span>Smart Search</span>
      </div>
      <div class="feature">
        <span class="feature-icon">{@html icons.grid}</span>
        <span>Beautiful Grid</span>
      </div>
      <div class="feature">
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
    animation: fadeIn var(--duration-slow) var(--ease-out);
  }

  .empty-content {
    text-align: center;
    max-width: 420px;
    position: relative;
  }

  .hero-glow {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 200px;
    background: radial-gradient(
      circle,
      var(--accent-subtle) 0%,
      transparent 70%
    );
    border-radius: 50%;
    pointer-events: none;
    animation: breathe 4s ease-in-out infinite;
  }

  .hero-icon {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--sp-6);
    background: var(--accent-subtle);
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius-2xl);
    color: var(--accent);
    box-shadow: var(--shadow-glow);
  }

  .hero-icon :global(svg) {
    width: 38px;
    height: 38px;
  }

  .title {
    font-size: var(--text-2xl);
    font-weight: 700;
    letter-spacing: var(--letter-tight);
    color: var(--text-primary);
    margin-bottom: var(--sp-3);
  }

  .subtitle {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: var(--sp-8);
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-6);
    background: var(--accent);
    color: var(--text-on-accent);
    border-radius: var(--radius-full);
    font-size: var(--text-base);
    font-weight: 600;
    box-shadow: var(--shadow-md), var(--shadow-glow);
    transition: var(--transition-base);
  }

  .cta-btn:hover {
    transform: translateY(-1px);
    box-shadow:
      var(--shadow-lg),
      0 0 0 6px var(--accent-subtle);
  }

  .cta-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .cta-icon {
    display: flex;
  }

  .cta-icon :global(svg) {
    width: 16px;
    height: 16px;
  }

  .features {
    display: flex;
    justify-content: center;
    gap: var(--sp-6);
    margin-top: var(--sp-10);
  }

  .feature {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .feature-icon {
    display: flex;
    color: var(--text-quaternary);
  }

  .feature-icon :global(svg) {
    width: 15px;
    height: 15px;
  }
</style>
