<script lang="ts">
  import { pickPath } from "../api";
  import { presets, type Preset } from "../model";
  import { options } from "../options";
  import { store } from "../store.svelte";
  import EndpointCard from "./EndpointCard.svelte";
  import OptionRow from "./OptionRow.svelte";

  const p = $derived(store.profile);
  const usesSsh = $derived(p.source.kind === "ssh" || p.dest.kind === "ssh");
  const essentials = options.filter((o) => o.category === "essentials");

  function swap() {
    const s = p.source;
    p.source = p.dest;
    p.dest = s;
  }

  function isActive(preset: Preset): boolean {
    const a = JSON.stringify(Object.entries(preset.options).sort());
    const b = JSON.stringify(Object.entries($state.snapshot(p.options)).sort());
    return a === b;
  }

  function apply(preset: Preset) {
    p.options = structuredClone(preset.options);
  }

  async function browseKey() {
    const path = await pickPath(false, "Choose SSH private key");
    if (path) p.ssh.identity = path;
  }
</script>

<div class="page">
  <div class="endpoints">
    <EndpointCard endpoint={p.source} title="Source" isSource />
    <button class="swap" title="Swap source and destination" onclick={swap}>⇄</button>
    <EndpointCard endpoint={p.dest} title="Destination" />
  </div>

  {#if usesSsh}
    <section class="card ssh">
      <h3>SSH connection</h3>
      <div class="grid">
        <label>
          <span>Port</span>
          <input bind:value={p.ssh.port} placeholder="22" inputmode="numeric" />
        </label>
        <label>
          <span>Private key</span>
          <div class="line">
            <input bind:value={p.ssh.identity} placeholder="~/.ssh/id_ed25519" />
            <button class="btn" onclick={browseKey}>Browse…</button>
          </div>
        </label>
        <label>
          <span>Extra ssh options</span>
          <input bind:value={p.ssh.extra} placeholder="-o StrictHostKeyChecking=accept-new" />
        </label>
      </div>
      <p class="muted">
        grysync cannot answer password prompts — use key-based authentication (ssh-agent works). Set "Remote shell" under
        Remote &amp; network to take full control of the ssh command.
      </p>
    </section>
  {/if}

  <section class="card">
    <h3>Quick start</h3>
    <p class="muted">Pick a starting point — it replaces the current options. Fine-tune everything afterwards.</p>
    <div class="presets">
      {#each presets as preset}
        <button class="preset" class:on={isActive(preset)} onclick={() => apply(preset)}>
          <strong>{preset.label}</strong>
          <span>{preset.help}</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="card options">
    <h3>Essentials</h3>
    {#each essentials as o (o.id)}
      <OptionRow option={o} />
    {/each}
  </section>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .endpoints {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 12px;
    align-items: stretch;
  }

  .swap {
    align-self: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--panel);
    color: var(--accent);
    font-size: 18px;
    cursor: pointer;
    box-shadow: var(--shadow);
  }

  .swap:hover {
    border-color: var(--accent);
  }

  h3 {
    font-size: 15px;
    margin-bottom: 6px;
  }

  p {
    margin: 0 0 12px;
    font-size: 13px;
  }

  .ssh p {
    margin: 12px 0 0;
  }

  .grid {
    display: grid;
    grid-template-columns: 100px minmax(0, 1.3fr) minmax(0, 1fr);
    gap: 10px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  label > span {
    font-size: 12px;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .line {
    display: flex;
    gap: 8px;
  }

  .presets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 10px;
  }

  .preset {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--panel-2);
    cursor: pointer;
    transition: border-color 0.15s, transform 0.1s;
  }

  .preset:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .preset.on {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--panel-2));
  }

  .preset span {
    font-size: 12.5px;
    color: var(--muted);
  }

  .options {
    padding: 14px 8px;
  }

  .options h3 {
    padding: 0 12px;
  }

  @media (max-width: 1050px) {
    .endpoints {
      grid-template-columns: 1fr;
    }

    .swap {
      justify-self: center;
      transform: rotate(90deg);
    }
  }
</style>
