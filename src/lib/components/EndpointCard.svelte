<script lang="ts">
  import { pickPath } from "../api";
  import { endpointToArg } from "../args";
  import { t } from "../i18n.svelte";
  import type { MessageKey } from "../locales";
  import type { Endpoint, EndpointKind } from "../model";

  let { endpoint: e, isSource = false }: { endpoint: Endpoint; isSource?: boolean } = $props();

  const kinds: { id: EndpointKind; label: MessageKey }[] = [
    { id: "local", label: "endpoint.local" },
    { id: "ssh", label: "endpoint.ssh" },
    { id: "daemon", label: "endpoint.daemon" },
  ];

  const hasSlash = $derived(/[\\/]$/.test(e.path));
  const preview = $derived(e.path || e.host ? endpointToArg(e) : "");

  function toggleContents() {
    if (hasSlash) e.path = e.path.length > 1 ? e.path.replace(/[\\/]+$/, "") : e.path;
    else if (e.path) e.path += "/";
  }

  async function browse() {
    const path = await pickPath(true, t(isSource ? "endpoint.chooseSource" : "endpoint.chooseDest"));
    if (path) e.path = isSource && hasSlash && !/[\\/]$/.test(path) ? path + "/" : path;
  }
</script>

<section class="card endpoint">
  <header>
    <h3>{t(isSource ? "endpoint.source" : "endpoint.dest")}</h3>
    <div class="segmented">
      {#each kinds as k}
        <button class:on={e.kind === k.id} onclick={() => (e.kind = k.id)}>{t(k.label)}</button>
      {/each}
    </div>
  </header>

  {#if e.kind === "local"}
    <label class="field">
      <span>{t("endpoint.folder")}</span>
      <div class="line">
        <input bind:value={e.path} placeholder={isSource ? "/home/me/Documents/" : "/media/backup/Documents"} />
        <button class="btn" onclick={browse}>{t("common.browse")}</button>
      </div>
    </label>
  {:else}
    <div class="grid">
      <label class="field">
        <span>{t("endpoint.user")}</span>
        <input bind:value={e.user} placeholder={t("endpoint.optional")} />
      </label>
      <label class="field">
        <span>{t("endpoint.host")}</span>
        <input bind:value={e.host} placeholder="nas.local" />
      </label>
      {#if e.kind === "daemon"}
        <label class="field small">
          <span>{t("endpoint.port")}</span>
          <input bind:value={e.port} placeholder="873" inputmode="numeric" />
        </label>
      {/if}
    </div>
    <label class="field">
      <span>{t(e.kind === "daemon" ? "endpoint.modulePath" : "endpoint.remotePath")}</span>
      <input bind:value={e.path} placeholder={e.kind === "daemon" ? "backup/documents/" : "/srv/backup/"} />
    </label>
  {/if}

  {#if isSource}
    <button class="contents" onclick={toggleContents} disabled={!e.path}>
      <span class="switch" class:on={hasSlash}></span>
      <span>
        <strong>{t("endpoint.contents")}</strong>
        <span class="muted">{t(hasSlash ? "endpoint.contentsOn" : "endpoint.contentsOff")}</span>
      </span>
    </button>
  {/if}

  {#if preview}
    <code class="preview" title={t("endpoint.previewTitle")}>{preview}</code>
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
