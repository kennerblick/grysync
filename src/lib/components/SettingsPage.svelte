<script lang="ts">
  import { configPath, pickPath } from "../api";
  import type { Theme } from "../model";
  import { store } from "../store.svelte";

  const s = $derived(store.state.settings);
  let path = $state("");
  configPath().then((p) => (path = p), () => {});

  const themes: { id: Theme; label: string }[] = [
    { id: "system", label: "System" },
    { id: "dark", label: "Dark" },
    { id: "light", label: "Light" },
  ];

  async function browse() {
    const p = await pickPath(false, "Choose the rsync executable");
    if (p) {
      s.rsyncPath = p;
      store.detect();
    }
  }
</script>

<div class="page">
  <section class="card">
    <h3>rsync executable</h3>
    <p class="muted">
      Leave empty to use <code>rsync</code> from your PATH. On Windows, point this to e.g. cwRsync or the rsync from
      MSYS2/Git for Windows.
    </p>
    <div class="line">
      <input bind:value={s.rsyncPath} placeholder="rsync" onchange={() => store.detect()} />
      <button class="btn" onclick={browse}>Browse…</button>
      <button class="btn" onclick={() => store.detect()}>Detect</button>
    </div>
    {#if store.info}
      <div class="found">
        <span class="badge ok">found</span>
        <span>{store.info.flavor} {store.info.version}</span>
        {#if store.info.protocol}<span class="muted">protocol {store.info.protocol}</span>{/if}
      </div>
      {#if store.info.flavor === "openrsync"}
        <p class="warn">
          This is openrsync (shipped with macOS), which supports only a subset of rsync's options. Install the real rsync,
          e.g. <code>brew install rsync</code>, to use every option.
        </p>
      {/if}
      <details>
        <summary class="muted">Version details</summary>
        <pre class="mono">{store.info.raw}</pre>
      </details>
    {:else if store.infoError}
      <div class="found"><span class="badge danger">not found</span><span>{store.infoError}</span></div>
    {/if}
  </section>

  <section class="card">
    <h3>Appearance</h3>
    <div class="segmented">
      {#each themes as t}
        <button class:on={s.theme === t.id} onclick={() => (s.theme = t.id)}>{t.label}</button>
      {/each}
    </div>
  </section>

  <section class="card">
    <h3>Safety</h3>
    <label class="check">
      <button class="switch" class:on={s.confirmDangerous} aria-label="Confirm" onclick={() => (s.confirmDangerous = !s.confirmDangerous)}></button>
      Ask for confirmation before a run that deletes or moves files
    </label>
  </section>

  <section class="card">
    <h3>Storage</h3>
    <p class="muted">Profiles, settings and history are stored in <code>{path}</code>.</p>
    {#if store.saveError}<p class="warn">{store.saveError}</p>{/if}
  </section>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 780px;
  }

  h3 {
    font-size: 15px;
    margin-bottom: 8px;
  }

  p {
    margin: 0 0 12px;
    font-size: 13px;
  }

  .line {
    display: flex;
    gap: 8px;
  }

  .found {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 12px;
    font-size: 13px;
  }

  .warn {
    color: var(--warn);
    margin-top: 10px;
  }

  details {
    margin-top: 10px;
    font-size: 13px;
  }

  pre {
    white-space: pre-wrap;
    font-size: 12px;
    color: var(--muted);
  }

  .check {
    display: flex;
    gap: 12px;
    align-items: center;
  }
</style>
