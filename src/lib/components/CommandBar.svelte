<script lang="ts">
  import { buildArgs, commandLine, validate } from "../args";
  import { exitMessage, t } from "../i18n.svelte";
  import { store } from "../store.svelte";
  import { formatBytes, formatDuration } from "../format";

  let { onRun, onOpenActivity }: { onRun: (dry: boolean) => void; onOpenActivity: () => void } = $props();

  const args = $derived(buildArgs(store.profile));
  const command = $derived(commandLine(store.program, args));
  const issues = $derived(validate(store.profile, store.info?.version));
  const errors = $derived(issues.filter((i) => i.level === "error"));
  const running = $derived(store.status === "running");

  let expanded = $state(false);
  let showIssues = $state(false);
  let copied = $state(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }

  const p = $derived(store.progress);
</script>

<footer class="bar">
  {#if showIssues && issues.length}
    <ul class="issues">
      {#each issues as i}
        <li class={i.level}><span class="dot"></span>{t(i.key, i.params)}</li>
      {/each}
    </ul>
  {/if}

  {#if store.status !== "idle"}
    <button class="status {store.status}" onclick={onOpenActivity} title={t("run.showActivity")}>
      <div class="track">
        <div
          class="fill"
          class:indeterminate={running && !p}
          style:width={running ? `${p?.percent ?? 100}%` : "100%"}
        ></div>
      </div>
      <div class="stats">
        {#if running}
          <strong>{t(store.dryRun ? "run.dryRunning" : "run.syncing")} {p ? `${p.percent}%` : "…"}</strong>
          {#if p}
            <span>{formatBytes(p.bytes)}</span>
            <span>{p.rate}</span>
            <span>{t("run.eta", { eta: p.eta })}</span>
            {#if p.transferred !== null}<span>{t("run.files", { n: p.transferred })}</span>{/if}
            {#if p.incremental}<span class="muted">{t("run.scanning")}</span>{/if}
          {/if}
        {:else}
          <strong>
            {t(store.status === "success" ? "run.done" : store.status === "cancelled" ? "run.stopped" : "run.failed")}
            {store.dryRun ? t("run.dryRunSuffix") : ""}
          </strong>
          <span>{exitMessage(store.exitCode)}</span>
          <span>{formatDuration(store.durationMs)}</span>
          {#if p}<span>{formatBytes(p.bytes)}</span>{/if}
        {/if}
        <span class="link">{t("run.viewLog")}</span>
      </div>
    </button>
  {/if}

  <div class="main">
    <div class="cmd" class:expanded>
      <span class="prompt">$</span>
      <code title={command}>{command}</code>
      <div class="cmd-actions">
        <button class="icon-btn" title={t(expanded ? "run.collapse" : "run.expand")} onclick={() => (expanded = !expanded)}>{expanded ? "▾" : "▸"}</button>
        <button class="icon-btn" title={t("run.copy")} onclick={copy}>{copied ? "✓" : "⧉"}</button>
      </div>
    </div>

    <label class="progress-toggle" title={t("run.liveProgressTitle")}>
      <input type="checkbox" bind:checked={store.profile.liveProgress} />
      {t("run.liveProgress")}
    </label>

    {#if issues.length}
      <button class="issue-btn" class:has-errors={errors.length > 0} onclick={() => (showIssues = !showIssues)}>
        {errors.length
          ? t(errors.length === 1 ? "run.errorsOne" : "run.errorsMany", { n: errors.length })
          : t(issues.length === 1 ? "run.hintsOne" : "run.hintsMany", { n: issues.length })}
      </button>
    {/if}

    {#if running}
      <button class="btn danger" onclick={() => store.cancel()}>{t("run.stop")}</button>
    {:else}
      <button class="btn" disabled={errors.length > 0} onclick={() => onRun(true)}>{t("run.dryRun")}</button>
      <button class="btn primary" disabled={errors.length > 0} onclick={() => onRun(false)}>{t("run.run")}</button>
    {/if}
  </div>
</footer>

<style>
  .bar {
    min-width: 0;
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg-2) 92%, transparent);
    backdrop-filter: blur(12px);
    padding: 10px 20px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .main {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cmd {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 6px 6px 6px 12px;
  }

  .prompt {
    color: var(--accent);
    font-family: var(--mono);
    padding-top: 4px;
  }

  .cmd code {
    flex: 1;
    min-width: 0;
    padding-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: text;
  }

  .cmd.expanded code {
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 30vh;
    overflow: auto;
  }

  .cmd-actions {
    display: flex;
    flex: none;
  }

  .progress-toggle {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 12.5px;
    color: var(--muted);
    white-space: nowrap;
    cursor: pointer;
  }

  .issue-btn {
    border: 1px solid color-mix(in srgb, var(--warn) 50%, transparent);
    color: var(--warn);
    background: color-mix(in srgb, var(--warn) 10%, transparent);
    border-radius: 999px;
    padding: 4px 11px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .issue-btn.has-errors {
    border-color: color-mix(in srgb, var(--danger) 50%, transparent);
    color: var(--danger);
    background: color-mix(in srgb, var(--danger) 10%, transparent);
  }

  .issues {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }

  .issues li {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex: none;
    background: var(--muted);
  }

  .issues .error .dot {
    background: var(--danger);
  }

  .issues .warn .dot {
    background: var(--warn);
  }

  .issues .info .dot {
    background: var(--accent-2);
  }

  .status {
    border: none;
    background: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .track {
    height: 6px;
    border-radius: 999px;
    background: var(--panel-2);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: var(--accent-grad);
    border-radius: 999px;
    transition: width 0.25s ease;
  }

  .fill.indeterminate {
    width: 30% !important;
    animation: slide 1.1s ease-in-out infinite;
  }

  @keyframes slide {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(340%);
    }
  }

  .status.success .fill {
    background: var(--ok);
  }

  .status.failed .fill {
    background: var(--danger);
  }

  .status.cancelled .fill {
    background: var(--warn);
  }

  .stats {
    display: flex;
    gap: 16px;
    font-size: 12.5px;
    color: var(--muted);
    align-items: baseline;
    flex-wrap: wrap;
  }

  .stats strong {
    color: var(--text);
  }

  .link {
    margin-left: auto;
    color: var(--accent);
  }
</style>
