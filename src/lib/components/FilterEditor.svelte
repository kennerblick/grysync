<script lang="ts">
  import { uid, type FilterAction } from "../model";
  import { t } from "../i18n.svelte";
  import { store } from "../store.svelte";

  const rules = $derived(store.profile.filters);

  const common = [".git/", "node_modules/", ".DS_Store", "Thumbs.db", "*.tmp", "*.swp", ".cache/", "__pycache__/", ".Trash-*/", "lost+found/"];

  function add(action: FilterAction, pattern = "") {
    rules.push({ id: uid(), action, pattern, enabled: true });
  }

  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= rules.length) return;
    const [r] = rules.splice(i, 1);
    rules.splice(j, 0, r);
  }
</script>

<section class="card filters">
  <header>
    <div>
      <h3>{t("filters.title")}</h3>
      <p class="muted">{t("filters.help")}</p>
    </div>
  </header>

  {#if rules.length}
    <ol class="rules">
      {#each rules as r, i (r.id)}
        <li class:off={!r.enabled}>
          <span class="n">{i + 1}</span>
          <select bind:value={r.action} class="action {r.action}">
            <option value="exclude">{t("filters.exclude")}</option>
            <option value="include">{t("filters.include")}</option>
            <option value="filter">{t("filters.filter")}</option>
          </select>
          <input
            class="mono"
            bind:value={r.pattern}
            placeholder={r.action === "filter" ? "- *.bak   |   : .rsync-filter" : "*.log"}
          />
          <button class="switch" class:on={r.enabled} aria-label={t("filters.enabled")} onclick={() => (r.enabled = !r.enabled)}></button>
          <button class="icon-btn" title={t("filters.up")} onclick={() => move(i, -1)} disabled={i === 0}>↑</button>
          <button class="icon-btn" title={t("filters.down")} onclick={() => move(i, 1)} disabled={i === rules.length - 1}>↓</button>
          <button class="icon-btn" title={t("filters.delete")} onclick={() => rules.splice(i, 1)}>✕</button>
        </li>
      {/each}
    </ol>
  {:else}
    <div class="empty muted">{t("filters.empty")}</div>
  {/if}

  <div class="actions">
    <button class="btn" onclick={() => add("exclude")}>{t("filters.addExclude")}</button>
    <button class="btn" onclick={() => add("include")}>{t("filters.addInclude")}</button>
    <button class="btn" onclick={() => add("filter")}>{t("filters.addRaw")}</button>
  </div>

  <div class="quick">
    <span class="muted">{t("filters.quick")}</span>
    {#each common as c}
      <button
        class="chip mono"
        disabled={rules.some((r) => r.action === "exclude" && r.pattern === c)}
        onclick={() => add("exclude", c)}>{c}</button
      >
    {/each}
  </div>
</section>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  h3 {
    font-size: 15px;
    margin-bottom: 4px;
  }

  p {
    margin: 0;
    font-size: 13px;
    max-width: 75ch;
  }

  .rules {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  li.off {
    opacity: 0.5;
  }

  .n {
    width: 20px;
    text-align: right;
    color: var(--muted);
    font-size: 12px;
  }

  .action {
    width: 130px;
    flex: none;
  }

  .action.exclude {
    color: var(--danger);
  }

  .action.include {
    color: var(--ok);
  }

  .empty {
    padding: 16px;
    text-align: center;
    border: 1px dashed var(--border);
    border-radius: var(--radius-sm);
  }

  .actions,
  .quick {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .chip {
    border: 1px solid var(--border);
    background: var(--panel-2);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 12px;
    cursor: pointer;
  }

  .chip:hover:not(:disabled) {
    border-color: var(--accent);
  }

  .chip:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
