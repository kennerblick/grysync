<script lang="ts">
  import { categories, matchesSearch, options, type CategoryId } from "../options";
  import { categoryBlurb, categoryLabel, t } from "../i18n.svelte";
  import { optionSearchTexts } from "../locales";
  import FilterEditor from "./FilterEditor.svelte";
  import OptionRow from "./OptionRow.svelte";

  let { category, search = "" }: { category: CategoryId | null; search?: string } = $props();

  const groups = $derived(
    categories
      .filter((c) => (search ? true : c.id === category))
      .map((c) => ({
        ...c,
        items: options.filter((o) => o.category === c.id && matchesSearch(o, search, optionSearchTexts(o))),
      }))
      .filter((g) => g.items.length || (!search && g.id === "filters")),
  );
</script>

<div class="page">
  {#if category === "filters" && !search}
    <FilterEditor />
  {/if}

  {#each groups as g (g.id)}
    <section class="card">
      <header>
        <h3>{g.icon} {categoryLabel(g)}</h3>
        <span class="muted">{categoryBlurb(g)}</span>
      </header>
      {#each g.items as o (o.id)}
        <OptionRow option={o} />
      {/each}
    </section>
  {:else}
    <div class="card empty muted">{t("options.noMatch", { q: search })}</div>
  {/each}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .card {
    padding: 14px 8px;
  }

  header {
    display: flex;
    gap: 12px;
    align-items: baseline;
    padding: 0 12px 6px;
    flex-wrap: wrap;
  }

  h3 {
    font-size: 15px;
  }

  header span {
    font-size: 13px;
  }

  .empty {
    padding: 30px;
    text-align: center;
  }
</style>
