<script lang="ts">
  import { pickPath } from "../api";
  import { endpointToArg } from "../args";
  import type { Endpoint, EndpointKind } from "../model";

  let { endpoint: e, title, isSource = false }: { endpoint: Endpoint; title: string; isSource?: boolean } = $props();

  const kinds: { id: EndpointKind; label: string }[] = [
    { id: "local", label: "Local" },
    { id: "ssh", label: "SSH" },
    { id: "daemon", label: "rsync daemon" },
  ];

  const hasSlash = $derived(/[\\/]$/.test(e.path));
  const preview = $derived(e.path || e.host ? endpointToArg(e) : "");

  function toggleContents() {
    if (hasSlash) e.path = e.path.length > 1 ? e.path.replace(/[\\/]+$/, "") : e.path;
    else if (e.path) e.path += "/";
  }

  async function browse() {
    const path = await pickPath(true, `Choose ${title.toLowerCase()} folder`);
    if (path) e.path = isSource && hasSlash && !/[\\/]$/.test(path) ? path + "/" : path;
  }
</script>

<section class="card endpoint">
  <header>
    <h3>{title}</h3>
    <div class="segmented">
      {#each kinds as k}
        <button class:on={e.kind === k.id} onclick={() => (e.kind = k.id)}>{k.label}</button>
      {/each}
    </div>
  </header>

  {#if e.kind === "local"}
    <label class="field">
      <span>Folder</span>
      <div class="line">
        <input bind:value={e.path} placeholder={isSource ? "/home/me/Documents/" : "/media/backup/Documents"} />
        <button class="btn" onclick={browse}>Browse…</button>
      </div>
    </label>
  {:else}
    <div class="grid">
      <label class="field">
        <span>User</span>
        <input bind:value={e.user} placeholder="optional" />
      </label>
      <label class="field">
        <span>Host</span>
        <input bind:value={e.host} placeholder="nas.local" />
      </label>
      {#if e.kind === "daemon"}
        <label class="field small">
          <span>Port</span>
          <input bind:value={e.port} placeholder="873" inputmode="numeric" />
        </label>
      {/if}
    </div>
    <label class="field">
      <span>{e.kind === "daemon" ? "Module / path" : "Remote path"}</span>
      <input bind:value={e.path} placeholder={e.kind === "daemon" ? "backup/documents/" : "/srv/backup/"} />
    </label>
  {/if}

  {#if isSource}
    <button class="contents" onclick={toggleContents} disabled={!e.path}>
      <span class="switch" class:on={hasSlash}></span>
      <span>
        <strong>Copy folder contents</strong>
        <span class="muted">
          {hasSlash ? "Trailing / — the contents are copied into the destination." : "No trailing / — the folder itself is created inside the destination."}
        </span>
      </span>
    </button>
  {/if}

  {#if preview}
    <code class="preview" title="As passed to rsync">{preview}</code>
  {/if}
</section>

<style>
  .endpoint {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  h3 {
    font-size: 15px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  .field > span {
    font-size: 12px;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
    gap: 10px;
  }

  .field.small {
    width: 90px;
  }

  .line {
    display: flex;
    gap: 8px;
  }

  .contents {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    text-align: left;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    cursor: pointer;
  }

  .contents:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .contents > span:last-child {
    display: flex;
    flex-direction: column;
    font-size: 13px;
  }

  .preview {
    color: var(--accent-2);
    word-break: break-all;
    font-size: 12.5px;
  }
</style>
