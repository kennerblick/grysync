<script lang="ts">
  import { exitMessage } from "../args";
  import { formatDuration } from "../format";
  import { store } from "../store.svelte";

  let errorsOnly = $state(false);
  let follow = $state(true);
  let consoleEl: HTMLDivElement | undefined = $state();

  const shown = $derived(errorsOnly ? store.lines.filter((l) => l.stream !== "out") : store.lines);

  $effect(() => {
    shown.length;
    if (follow && consoleEl) queueMicrotask(() => consoleEl && (consoleEl.scrollTop = consoleEl.scrollHeight));
  });

  // Itemized lines look like ">f+++++++++ path" or "*deleting path".
  function kind(text: string): string {
    if (text.startsWith("*deleting")) return "del";
    if (/^[<>ch.*][fdLDS][.+?cstpoguaxnbN ]{9}/.test(text)) return "item";
    return "";
  }
</script>

<div class="page">
  <section class="card log">
    <header>
      <h3>Output</h3>
      <div class="tools">
        <label><input type="checkbox" bind:checked={errorsOnly} /> Errors only</label>
        <label><input type="checkbox" bind:checked={follow} /> Follow</label>
        <button
          class="btn small"
          onclick={() => navigator.clipboard.writeText(store.lines.map((l) => l.text).join("\n"))}
          disabled={!store.lines.length}>Copy log</button
        >
      </div>
    </header>
    <div class="console mono" bind:this={consoleEl}>
      {#each shown as l}
        <div class="l {l.stream} {kind(l.text)}">{l.text}</div>
      {:else}
        <div class="muted">No output yet. Press Dry run to preview what rsync would do.</div>
      {/each}
    </div>
  </section>

  <section class="card">
    <header>
      <h3>History</h3>
      {#if store.state.history.length}
        <button class="btn small ghost" onclick={() => (store.state.history = [])}>Clear</button>
      {/if}
    </header>
    {#if store.state.history.length}
      <ul class="history">
        {#each store.state.history as h}
          <li>
            <span class="badge {h.cancelled ? 'warn' : h.code === 0 ? 'ok' : 'danger'}">
              {h.cancelled ? "stopped" : h.code === 0 ? "ok" : `code ${h.code ?? "?"}`}
            </span>
            <div class="h-main">
              <div>
                <strong>{h.profileName}</strong>
                {#if h.dryRun}<span class="badge accent">dry run</span>{/if}
                <span class="muted">· {new Date(h.startedAt).toLocaleString()} · {formatDuration(h.durationMs)}</span>
              </div>
              <div class="muted small">{exitMessage(h.code)}</div>
              <code class="small cmd" title={h.command}>{h.command}</code>
            </div>
            <button class="icon-btn" title="Copy command" onclick={() => navigator.clipboard.writeText(h.command)}>⧉</button>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="muted">Runs will be listed here.</div>
    {/if}
  </section>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 12px;
  }

  h3 {
    font-size: 15px;
  }

  .tools {
    display: flex;
    gap: 14px;
    align-items: center;
    font-size: 13px;
    color: var(--muted);
  }

  .tools label {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .console {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    height: 46vh;
    overflow: auto;
    font-size: 12.5px;
    line-height: 1.55;
    user-select: text;
  }

  .l {
    white-space: pre-wrap;
    word-break: break-all;
  }

  .l.err {
    color: var(--danger);
  }

  .l.sys {
    color: var(--accent);
  }

  .l.item {
    color: var(--ok);
  }

  .l.del {
    color: var(--warn);
  }

  .history {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .history li {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 10px 0;
    border-top: 1px solid var(--border);
  }

  .history li:first-child {
    border-top: none;
  }

  .h-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .small {
    font-size: 12px;
  }

  .cmd {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--muted);
  }
</style>
