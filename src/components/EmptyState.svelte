<script lang="ts">
  import { icons } from "../lib/icons";
  import { selectLibrary } from "../lib/store";
  import { onMount } from "svelte";

  let mounted = false;
  onMount(() => {
    requestAnimationFrame(() => {
      mounted = true;
    });
  });
</script>

<div class="empty-state" class:mounted>
  <!-- Animated gradient orbs background -->
  <div class="orb-field">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="orb orb-4"></div>
  </div>

  <!-- Radial grid pattern overlay -->
  <div class="grid-pattern"></div>

  <!-- Main content card -->
  <div class="wizard-card">
    <!-- Stacked photo mockup -->
    <div class="photo-stack">
      <div class="stack-card stack-card-3">
        <div class="card-gradient grad-3"></div>
      </div>
      <div class="stack-card stack-card-2">
        <div class="card-gradient grad-2"></div>
      </div>
      <div class="stack-card stack-card-1">
        <div class="card-gradient grad-1"></div>
        <div class="card-icon">
          {@html icons.camera}
        </div>
      </div>
    </div>

    <!-- Typography -->
    <h1 class="hero-title">
      <span class="title-line">Welcome to</span>
      <span class="title-gradient">Galleria Expressive</span>
    </h1>

    <p class="hero-subtitle">
      Your premium photo gallery experience — organize, browse, and edit your
      entire collection with a beautiful, blazing-fast interface.
    </p>

    <!-- CTA Section -->
    <div class="cta-group">
      <button class="cta-primary" on:click={selectLibrary}>
        <span class="cta-icon">{@html icons.folderOpen}</span>
        <span class="cta-label">Import Photo Folder</span>
        <span class="cta-shine"></span>
      </button>

      <span class="cta-hint">
        <kbd>Ctrl</kbd> + <kbd>,</kbd> for settings
      </span>
    </div>

    <!-- Feature showcase -->
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon-wrap">
          {@html icons.search}
        </div>
        <span class="feature-title">Smart Search</span>
        <span class="feature-desc"
          >Find any photo by name, date, camera, or tags instantly</span
        >
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrap">
          {@html icons.edit}
        </div>
        <span class="feature-title">Pro Editing</span>
        <span class="feature-desc"
          >Non-destructive adjustments with real-time preview</span
        >
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrap">
          {@html icons.tag}
        </div>
        <span class="feature-title">Tags & Albums</span>
        <span class="feature-desc"
          >Organize your library with custom tags and collections</span
        >
      </div>
    </div>
  </div>
</div>

<style>
  /* ── Container ── */
  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-6);
    position: relative;
    overflow: hidden;
    min-height: 0;
  }

  /* ── Animated Orbs ── */
  .orb-field {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0;
    transition: opacity 1.2s ease;
  }

  .mounted .orb {
    opacity: 1;
  }

  .orb-1 {
    width: 340px;
    height: 340px;
    background: radial-gradient(circle, var(--accent-glow), transparent 70%);
    top: -5%;
    right: 10%;
    animation: orbFloat1 18s ease-in-out infinite;
  }

  .orb-2 {
    width: 280px;
    height: 280px;
    background: radial-gradient(
      circle,
      rgba(139, 92, 246, 0.15),
      transparent 70%
    );
    bottom: 5%;
    left: 5%;
    animation: orbFloat2 22s ease-in-out infinite;
  }

  .orb-3 {
    width: 200px;
    height: 200px;
    background: radial-gradient(
      circle,
      rgba(236, 72, 153, 0.12),
      transparent 70%
    );
    top: 40%;
    right: -5%;
    animation: orbFloat3 15s ease-in-out infinite;
  }

  .orb-4 {
    width: 260px;
    height: 260px;
    background: radial-gradient(
      circle,
      rgba(20, 184, 166, 0.1),
      transparent 70%
    );
    top: 10%;
    left: -5%;
    animation: orbFloat1 20s ease-in-out infinite reverse;
  }

  @keyframes orbFloat1 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -20px) scale(1.05);
    }
    66% {
      transform: translate(-20px, 15px) scale(0.95);
    }
  }

  @keyframes orbFloat2 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(-25px, 20px) scale(1.08);
    }
    66% {
      transform: translate(15px, -25px) scale(0.92);
    }
  }

  @keyframes orbFloat3 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(-15px, -30px) scale(1.1);
    }
  }

  /* ── Subtle grid pattern ── */
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
      circle at 1px 1px,
      var(--md-sys-color-outline-variant) 0.5px,
      transparent 0
    );
    background-size: 40px 40px;
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Wizard Card (Glassmorphism) ── */
  .wizard-card {
    position: relative;
    z-index: 1;
    max-width: 560px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--sp-10) var(--sp-8) var(--sp-8);
    background: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--radius-3xl);
    box-shadow:
      var(--shadow-xl),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    opacity: 0;
    transform: translateY(24px) scale(0.96);
    transition:
      opacity 0.7s var(--ease-emphasized-decel),
      transform 0.7s var(--ease-emphasized-decel);
  }

  .mounted .wizard-card {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  /* ── Stacked Photo Cards ── */
  .photo-stack {
    position: relative;
    width: 120px;
    height: 92px;
    margin-bottom: var(--sp-6);
  }

  .stack-card {
    position: absolute;
    width: 88px;
    height: 66px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: transform 0.8s var(--ease-emphasized-decel);
  }

  .stack-card-3 {
    left: 0;
    top: 8px;
    transform: rotate(-12deg);
    opacity: 0;
    animation: stackReveal3 0.6s var(--ease-emphasized-decel) 0.3s forwards;
  }

  .stack-card-2 {
    right: 0;
    top: 4px;
    transform: rotate(8deg);
    opacity: 0;
    animation: stackReveal2 0.6s var(--ease-emphasized-decel) 0.5s forwards;
  }

  .stack-card-1 {
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    width: 96px;
    height: 72px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    animation: stackReveal1 0.6s var(--ease-emphasized-decel) 0.7s forwards;
  }

  .mounted .photo-stack:hover .stack-card-3 {
    transform: rotate(-18deg) translateX(-8px);
  }
  .mounted .photo-stack:hover .stack-card-2 {
    transform: rotate(14deg) translateX(8px);
  }
  .mounted .photo-stack:hover .stack-card-1 {
    transform: translateX(-50%) translateY(-4px);
  }

  @keyframes stackReveal1 {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(12px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }
  @keyframes stackReveal2 {
    from {
      opacity: 0;
      transform: rotate(0) scale(0.85);
    }
    to {
      opacity: 1;
      transform: rotate(8deg) scale(1);
    }
  }
  @keyframes stackReveal3 {
    from {
      opacity: 0;
      transform: rotate(0) scale(0.85);
    }
    to {
      opacity: 1;
      transform: rotate(-12deg) scale(1);
    }
  }

  .card-gradient {
    width: 100%;
    height: 100%;
  }

  .grad-1 {
    background: linear-gradient(135deg, var(--accent-container), var(--accent));
  }
  .grad-2 {
    background: linear-gradient(
      135deg,
      var(--md-sys-color-tertiary-container),
      var(--md-sys-color-tertiary)
    );
  }
  .grad-3 {
    background: linear-gradient(
      135deg,
      var(--md-sys-color-secondary-container),
      var(--md-sys-color-secondary)
    );
  }

  .card-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.9);
    z-index: 1;
  }

  .card-icon :global(svg) {
    width: 28px;
    height: 28px;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
  }

  /* ── Typography ── */
  .hero-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: var(--sp-3);
    opacity: 0;
    transform: translateY(12px);
    animation: staggerIn 0.5s var(--ease-emphasized-decel) 0.9s forwards;
  }

  .title-line {
    font-size: var(--text-md);
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: var(--letter-wide);
    text-transform: uppercase;
  }

  .title-gradient {
    font-size: var(--text-3xl);
    font-weight: 800;
    letter-spacing: var(--letter-tight);
    background: linear-gradient(
      135deg,
      var(--accent) 0%,
      var(--md-sys-color-tertiary) 50%,
      var(--accent) 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 4s ease-in-out infinite;
  }

  @keyframes gradientShift {
    0%,
    100% {
      background-position: 0% center;
    }
    50% {
      background-position: 100% center;
    }
  }

  .hero-subtitle {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: 1.7;
    max-width: 420px;
    margin-bottom: var(--sp-8);
    opacity: 0;
    transform: translateY(12px);
    animation: staggerIn 0.5s var(--ease-emphasized-decel) 1s forwards;
  }

  @keyframes staggerIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── CTA Group ── */
  .cta-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    margin-bottom: var(--sp-8);
    opacity: 0;
    transform: translateY(12px);
    animation: staggerIn 0.5s var(--ease-emphasized-decel) 1.1s forwards;
  }

  .cta-primary {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--sp-3);
    padding: 14px var(--sp-8);
    background: linear-gradient(135deg, var(--accent), var(--accent-hover));
    color: var(--text-on-accent);
    border-radius: var(--radius-full);
    font-size: var(--text-md);
    font-weight: 600;
    box-shadow:
      var(--shadow-lg),
      0 0 40px var(--accent-glow);
    transition: all 0.3s var(--ease-emphasized);
    overflow: hidden;
    min-height: 52px;
  }

  .cta-primary:hover {
    box-shadow:
      var(--shadow-xl),
      0 0 60px var(--accent-glow);
    transform: translateY(-2px);
  }

  .cta-primary:active {
    transform: translateY(0) scale(0.98);
  }

  .cta-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent
    );
    animation: shine 3s ease-in-out infinite;
  }

  @keyframes shine {
    0% {
      left: -100%;
    }
    20% {
      left: 100%;
    }
    100% {
      left: 100%;
    }
  }

  .cta-icon {
    display: flex;
  }

  .cta-icon :global(svg) {
    width: 20px;
    height: 20px;
  }

  .cta-hint {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .cta-hint kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    background: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    line-height: 1;
    min-height: 18px;
  }

  /* ── Feature Cards ── */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-3);
    width: 100%;
    opacity: 0;
    transform: translateY(12px);
    animation: staggerIn 0.5s var(--ease-emphasized-decel) 1.3s forwards;
  }

  .feature-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--sp-3);
    background: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--radius-xl);
    transition: all 0.25s var(--ease-emphasized);
  }

  .feature-card:hover {
    background: var(--md-sys-color-surface-container-highest);
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow:
      var(--shadow-md),
      0 0 20px var(--accent-glow);
  }

  .feature-icon-wrap {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-subtle);
    border-radius: var(--radius-md);
    color: var(--accent);
    transition: all 0.25s var(--ease-emphasized);
  }

  .feature-card:hover .feature-icon-wrap {
    background: var(--accent-container);
    color: var(--accent-on-container);
    transform: scale(1.08);
  }

  .feature-icon-wrap :global(svg) {
    width: 20px;
    height: 20px;
  }

  .feature-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .feature-desc {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    line-height: 1.4;
  }

  /* ── Responsive ── */
  @media (max-width: 540px) {
    .wizard-card {
      padding: var(--sp-8) var(--sp-4) var(--sp-4);
      border-radius: var(--radius-2xl);
    }

    .title-gradient {
      font-size: var(--text-2xl);
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: var(--sp-2);
    }

    .feature-card {
      flex-direction: row;
      text-align: left;
      padding: var(--sp-3);
    }

    .feature-desc {
      display: none;
    }
  }
</style>
