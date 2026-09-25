<script lang="ts">
  import { categories, options, type CategoryId } from "../options";
  import { categoryLabel, t } from "../i18n.svelte";
  import { store } from "../store.svelte";

  export type View = "sync" | CategoryId | "activity" | "settings";

  let { view = $bindable(), search = $bindable() }: { view: View; search: string } = $props();

  // Number of options switched on per category, shown as a small counter.
  const counts = $derived.by(() => {
    const c: Record<string, number> = {};
    for (const o of options) {
      const v = store.profile.options[o.id];
      const on = Array.isArray(v) ? v.length > 0 : v !== undefined && v !== false && v !== "" && v !== 0;
      if (on) c[o.category] = (c[o.category] ?? 0) + 1;
    }
    c.filters = (c.filters ?? 0) + store.profile.filters.filter((f) => f.enabled).length;
    return c;
  });

  function go(v: View) {
    view = v;
    search = "";
  }
</script>

<aside>
  <div class="brand">
    <div class="logo">⟳</div>
    <div>
      <div class="name">grysync</div>
      <div class="tag">{t("app.tagline")}</div>
    </div>
  </div>

  <input class="search" type="search" placeholder={t("nav.search", { n: options.length })} bind:value={search} />

  <div class="section">
    <div class="section-title">
      {t("nav.profiles")}
      <button class="icon-btn" title={t("nav.newProfile")} onclick={() => { store.addProfile(); go("sync"); }}>＋</button>
    </div>
    {#each store.state.profiles as p (p.id)}
      <button
        class="item profile"
        class:on={p.id === store.state.activeId}
        onclick={() => { store.state.activeId = p.id; go("sync"); }}
      >
        <span class="dot"></span>
        <span class="label">{p.name || t("profile.untitled")}</span>
      </button>
    {/each}
  </div>

  <nav class="section">
    <div class="section-title">{t("nav.configure")}</div>
    <button class="item" class:on={view === "sync" && !search} onclick={() => go("sync")}>
      <span class="ico">⇆</span><span class="label">{t("nav.sourceTarget")}</span>
    </button>
    {#each categories.filter((c) => c.id !== "essentials") as c}
      <button class="item" class:on={view === c.id && !search} onclick={() => go(c.id)}>
        <span class="ico">{c.icon}</span>
        <span class="label">{categoryLabel(c)}</span>
        {#if counts[c.id]}<span class="count">{counts[c.id]}</span>{/if}
      </button>
    {/each}
  </nav>

  <nav class="section bottom">
    <button class="item" class:on={view === "activity" && !search} onclick={() => go("activity")}>
      <span class="ico">☰</span><span class="label">{t("nav.activity")}</span>
      {#if store.status === "running"}<span class="pulse"></span>{/if}
    </button>
    <button class="item" class:on={view === "settings" && !search} onclick={() => go("settings")}>
      <span class="ico">⚙</span><span class="label">{t("nav.settings")}</span>
    </button>
    <div class="version">
      {#if store.info}
        <span class="badge ok">{store.info.flavor} {store.info.version}</span>
      {:else if store.infoError}
        <button class="badge danger as-link" onclick={() => go("settings")}>{t("nav.rsyncNotFound")}</button>
      {:else}
        <span class="badge">{t("nav.detecting")}</span>
      {/if}
    </div>
  </nav>
</aside>

<style>
  aside {
    grid-row: 1 / span 2;
    background: var(--bg-2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px 12px;
    overflow-y: auto;
    min-height: 0;
  }

  .brand {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 2px 6px 4px;
  }

  .logo {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--accent-grad);
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 20px;
    font-weight: 700;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 45%, transparent);
  }

  .name {
    font-weight: 700;
    font-size: 16px;
    letter-spacing: -0.01em;
  }

  .tag {
    font-size: 11.5px;
    color: var(--muted);
  }

  .search {
    padding: 8px 12px;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--muted);
    font-weight: 700;
    padding: 0 8px 4px;
    min-height: 28px;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
    color: var(--text);
  }

  .item:hover {
    background: var(--hover);
  }

  .item.on {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--text);
  }

  .item.on .ico {
    color: var(--accent);
  }

  .ico {
    width: 18px;
    text-align: center;
    color: var(--muted);
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    font-size: 11px;
    font-weight: 700;
    background: var(--accent);
    color: #fff;
    border-radius: 999px;
    padding: 0 7px;
    line-height: 18px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border);
    margin: 0 5px;
  }

  .profile.on .dot {
    background: var(--accent-grad);
  }

  .bottom {
    margin-top: auto;
  }

  .version {
    padding: 10px 8px 0;
  }

  .as-link {
    cursor: pointer;
  }

  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ok);
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }
</style>
