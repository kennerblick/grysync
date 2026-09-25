<script lang="ts">
  import { pickPath } from "../api";
  import { compareVersions, type RsyncOption } from "../options";
  import { choiceLabel, optionHelp, optionLabel, optionPlaceholder, t } from "../i18n.svelte";
  import { store } from "../store.svelte";

  let { option: o }: { option: RsyncOption } = $props();

  const opts = $derived(store.profile.options);
  const value = $derived(opts[o.id]);
  const active = $derived(
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== false && value !== "" && value !== 0,
  );
  const unsupported = $derived(
    !!o.since && !!store.info && compareVersions(store.info.version, o.since) < 0,
  );
  const flagText = $derived(
    o.shortOnly ? `-${o.short}` : `--${o.id}${o.short ? `, -${o.short}` : ""}`,
  );

  function set(v: boolean | number | string | string[] | undefined) {
    if (v === undefined || v === false || v === "" || v === 0) delete opts[o.id];
    else opts[o.id] = v;
  }

  const list = $derived(Array.isArray(value) ? value : []);

  function setListItem(i: number, v: string) {
    const next = [...list];
    next[i] = v;
    set(next);
  }

  function removeListItem(i: number) {
    const next = list.filter((_, j) => j !== i);
    set(next.length ? next : undefined);
  }

  async function browse() {
    const path = await pickPath(o.pick !== "file", optionLabel(o));
    if (path) set(path);
  }
</script>

<div class="row" class:active class:danger={o.danger && active}>
  <div class="text">
    <div class="title">
      <span class="label">{optionLabel(o)}</span>
      <code class="flag">{flagText}</code>
      {#if o.danger}<span class="badge danger">{t("option.destructive")}</span>{/if}
      {#if o.since}
        <span class="badge" class:warn={unsupported} title={t("option.requires", { v: o.since })}>≥ {o.since}</span>
      {/if}
    </div>
    <div class="help">{optionHelp(o)}</div>
    {#if unsupported && active}
      <div class="unsupported">{t("option.unsupported", { v: store.info?.version ?? "" })}</div>
    {/if}
  </div>

  <div class="control" class:wide={o.kind !== "flag" && o.kind !== "count"}>
    {#if o.kind === "flag"}
      <button
        class="switch"
        class:on={value === true}
        class:danger={o.danger}
        role="switch"
        aria-checked={value === true}
        aria-label={optionLabel(o)}
        onclick={() => set(value !== true)}
      ></button>
    {:else if o.kind === "count"}
      <div class="segmented" role="radiogroup" aria-label={optionLabel(o)}>
        {#each [0, 1, 2, 3] as n}
          <button class:on={(Number(value) || 0) === n} onclick={() => set(n)}>{n === 0 ? t("option.off") : "×" + n}</button>
        {/each}
      </div>
    {:else if o.kind === "select"}
      <select value={typeof value === "string" ? value : ""} onchange={(e) => set(e.currentTarget.value)}>
        <option value="">{t("option.default")}</option>
        {#each o.choices ?? [] as c}
          <option value={c.value}>{choiceLabel(o, c.value, c.label)}</option>
        {/each}
      </select>
    {:else if o.kind === "list"}
      <div class="list">
        {#each list as item, i}
          <div class="line">
            <input value={item} placeholder={optionPlaceholder(o)} oninput={(e) => setListItem(i, e.currentTarget.value)} />
            <button class="icon-btn" title={t("option.remove")} onclick={() => removeListItem(i)}>✕</button>
          </div>
        {/each}
        <button class="btn small" onclick={() => set([...list, ""])}>{t("option.add")}</button>
      </div>
    {:else}
      <div class="line">
        <input
          type={o.kind === "number" ? "number" : "text"}
          value={value ?? ""}
          placeholder={optionPlaceholder(o)}
          oninput={(e) => set(e.currentTarget.value)}
        />
        {#if o.kind === "path"}
          <button class="btn small" onclick={browse}>{t("common.browse")}</button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .row {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s;
  }

  .row:hover {
    background: var(--panel-2);
  }

  .row.active {
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
    background: color-mix(in srgb, var(--accent) 6%, transparent);
  }

  .row.danger {
    border-color: color-mix(in srgb, var(--danger) 45%, transparent);
    background: color-mix(in srgb, var(--danger) 7%, transparent);
  }

  .text {
    min-width: 0;
    flex: 1;
  }

  .title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .label {
    font-weight: 600;
  }

  .flag {
    color: var(--accent);
    font-size: 12px;
  }

  .help {
    color: var(--muted);
    font-size: 13px;
    margin-top: 3px;
  }

  .unsupported {
    color: var(--warn);
    font-size: 12.5px;
    margin-top: 4px;
  }

  .control {
    flex: none;
    display: flex;
    justify-content: flex-end;
    padding-top: 2px;
  }

  .control.wide {
    width: min(340px, 45%);
  }

  .line {
    display: flex;
    gap: 6px;
    align-items: center;
    width: 100%;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    align-items: flex-start;
  }
</style>
