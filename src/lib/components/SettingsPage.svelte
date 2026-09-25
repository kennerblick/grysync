<script lang="ts">
  import { configPath, pickPath } from "../api";
  import { t } from "../i18n.svelte";
  import { locales, type LanguagePref, type MessageKey } from "../locales";
  import type { Theme } from "../model";
  import { store } from "../store.svelte";

  const s = $derived(store.state.settings);
  let path = $state("");
  configPath().then((p) => (path = p), () => {});

  const themes: { id: Theme; label: MessageKey }[] = [
    { id: "system", label: "settings.themeSystem" },
    { id: "dark", label: "settings.themeDark" },
    { id: "light", label: "settings.themeLight" },
  ];

  const languages: { id: LanguagePref; label: string }[] = $derived([
    { id: "system", label: t("settings.languageSystem") },
    ...locales,
  ]);

  async function browse() {
    const p = await pickPath(false, t("settings.chooseRsync"));
    if (p) {
      s.rsyncPath = p;
      store.detect();
    }
  }
</script>

<div class="page">
  <section class="card">
    <h3>{t("settings.rsync")}</h3>
    <p class="muted">{t("settings.rsyncHelp")}</p>
    <div class="line">
      <input bind:value={s.rsyncPath} placeholder="rsync" onchange={() => store.detect()} />
      <button class="btn" onclick={browse}>{t("common.browse")}</button>
      <button class="btn" onclick={() => store.detect()}>{t("settings.detect")}</button>
    </div>
    {#if store.info}
      <div class="found">
        <span class="badge ok">{t("settings.found")}</span>
        <span>{store.info.flavor} {store.info.version}</span>
        {#if store.info.protocol}<span class="muted">{t("settings.protocol", { n: store.info.protocol })}</span>{/if}
      </div>
      {#if store.info.flavor === "openrsync"}
        <p class="warn">{t("settings.openrsync")}</p>
      {/if}
      <details>
        <summary class="muted">{t("settings.versionDetails")}</summary>
        <pre class="mono">{store.info.raw}</pre>
      </details>
    {:else if store.infoError}
      <div class="found"><span class="badge danger">{t("settings.notFound")}</span><span>{store.infoError}</span></div>
    {/if}
  </section>

  <section class="card">
    <h3>{t("settings.appearance")}</h3>
    <div class="rows">
      <div class="row">
        <span>{t("settings.language")}</span>
        <div class="segmented">
          {#each languages as l}
            <button class:on={s.language === l.id} onclick={() => (s.language = l.id)}>{l.label}</button>
          {/each}
        </div>
      </div>
      <div class="row">
        <span>{t("settings.theme")}</span>
        <div class="segmented">
          {#each themes as th}
            <button class:on={s.theme === th.id} onclick={() => (s.theme = th.id)}>{t(th.label)}</button>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <section class="card">
    <h3>{t("settings.safety")}</h3>
    <label class="check">
      <button class="switch" class:on={s.confirmDangerous} aria-label={t("settings.confirm")} onclick={() => (s.confirmDangerous = !s.confirmDangerous)}></button>
      {t("settings.confirm")}
    </label>
  </section>

  <section class="card">
    <h3>{t("settings.storage")}</h3>
    <p class="muted">{t("settings.storageText", { path })}</p>
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

  .rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .row > span {
    width: 90px;
    color: var(--muted);
    font-size: 13px;
  }

  .check {
    display: flex;
    gap: 12px;
    align-items: center;
  }
</style>
