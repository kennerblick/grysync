<script lang="ts">
  import { buildArgs, commandLine, deletesFiles } from "./lib/args";
  import ActivityPage from "./lib/components/ActivityPage.svelte";
  import CommandBar from "./lib/components/CommandBar.svelte";
  import OptionsPage from "./lib/components/OptionsPage.svelte";
  import SettingsPage from "./lib/components/SettingsPage.svelte";
  import Sidebar, { type View } from "./lib/components/Sidebar.svelte";
  import SyncPage from "./lib/components/SyncPage.svelte";
  import { categories, type CategoryId } from "./lib/options";
  import { t } from "./lib/i18n.svelte";
  import { store } from "./lib/store.svelte";

  let view = $state<View>("sync");
  let search = $state("");
  let confirming = $state(false);

  store.init();

  const isCategory = $derived(categories.some((c) => c.id === view));
  const title = $derived(
    search
      ? t("app.searchTitle", { q: search })
      : view === "activity"
        ? t("nav.activity")
        : view === "settings"
          ? t("nav.settings")
          : null,
  );

  function run(dry: boolean) {
    if (!dry && store.state.settings.confirmDangerous && deletesFiles(store.profile) && store.profile.options["dry-run"] !== true) {
      confirming = true;
      return;
    }
    go(dry);
  }

  function go(dry: boolean) {
    confirming = false;
    store.start(dry);
    view = "activity";
    search = "";
  }

  function onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && store.status !== "running") {
      e.preventDefault();
      run(e.shiftKey);
    }
    if (e.key === "Escape") confirming = false;
  }
</script>

<svelte:window onkeydown={onKey} />

{#if store.loaded}
  <div class="app">
    <Sidebar bind:view bind:search />

    <main>
      <header class="top">
        {#if title}
          <h1>{title}</h1>
        {:else}
          <input class="profile-name" bind:value={store.profile.name} aria-label={t("profile.name")} />
          <div class="top-actions">
            <button class="btn small ghost" onclick={() => store.addProfile(store.profile)}>{t("profile.duplicate")}</button>
            <button
              class="btn small ghost"
              disabled={store.state.profiles.length <= 1}
              onclick={() => store.deleteProfile(store.profile.id)}>{t("profile.delete")}</button
            >
          </div>
        {/if}
      </header>

      <div class="content">
        {#if search}
          <OptionsPage category={null} {search} />
        {:else if view === "sync"}
          <SyncPage />
        {:else if isCategory}
          <OptionsPage category={view as CategoryId} />
        {:else if view === "activity"}
          <ActivityPage />
        {:else if view === "settings"}
          <SettingsPage />
        {/if}
      </div>
    </main>

    <CommandBar onRun={run} onOpenActivity={() => { view = "activity"; search = ""; }} />
  </div>

  {#if confirming}
    <div class="backdrop" role="presentation" onclick={() => (confirming = false)}>
      <div class="dialog card" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
        <h2>{t("confirm.title")}</h2>
        <p class="muted">{t("confirm.text", { name: store.profile.name })}</p>
        <code class="cmd">{commandLine(store.program, buildArgs(store.profile))}</code>
        <div class="dialog-actions">
          <button class="btn" onclick={() => (confirming = false)}>{t("common.cancel")}</button>
          <button class="btn" onclick={() => go(true)}>{t("confirm.dryFirst")}</button>
          <button class="btn danger" onclick={() => go(false)}>{t("confirm.runAnyway")}</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .app {
    display: grid;
    grid-template-columns: 272px minmax(0, 1fr);
    grid-template-rows: 1fr auto;
    height: 100%;
  }

  main {
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .top {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 28px 12px;
    background: linear-gradient(var(--bg) 75%, transparent);
  }

  h1 {
    font-size: 22px;
  }

  .profile-name {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.01em;
    background: transparent;
    border-color: transparent;
    padding: 4px 8px;
    margin-left: -9px;
    max-width: 520px;
  }

  .profile-name:hover {
    border-color: var(--border);
  }

  .top-actions {
    margin-left: auto;
    display: flex;
    gap: 4px;
  }

  .content {
    padding: 4px 28px 28px;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.5);
    backdrop-filter: blur(3px);
    display: grid;
    place-items: center;
    z-index: 10;
  }

  .dialog {
    width: min(560px, 92vw);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dialog h2 {
    font-size: 18px;
  }

  .dialog p {
    margin: 0;
  }

  .cmd {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    word-break: break-all;
    max-height: 140px;
    overflow: auto;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
