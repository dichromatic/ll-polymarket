<script lang="ts">
    import { onMount } from 'svelte';
    import { LMSR } from '$lib/amm/lmsr';

    let events: any = [];
    let loading = true;

    onMount(async () => {
        try {
            await fetch('/api/seed');
            const res = await fetch('/api/markets');
            const rawMarkets = await res.json();
            
            // In a real app we'd group by events, but for the demo dashboard 
            // we will just display all markets straight up
            events = rawMarkets.map((m: any) => {
                // We need to calculate the actual LMSR probability percentages for the UI
                const shares = m.outcomes.map((o: any) => o.sharesOutstanding);
                const prices = LMSR.getPrices(m.liquidity_b, shares);
                
                return {
                    ...m,
                    outcomes: m.outcomes.map((o: any, idx: number) => ({
                        ...o,
                        probability: Math.round(prices[idx] * 100)
                    }))
                };
            });

            loading = false;
        } catch(e) {
            console.error("Failed to load markets:", e);
        }
    });
</script>

<div class="min-h-screen bg-base-300 text-base-content font-sans">
    <div class="navbar bg-base-100 shadow-xl px-8 mb-8">
      <div class="flex-1">
        <a class="btn btn-ghost text-2xl font-bold tracking-tighter text-primary">POLYMARKET <span class="text-neutral-content font-light">CLONE</span></a>
      </div>
      <div class="flex-none gap-2">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img alt="User Avatar" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <main class="container mx-auto px-4 max-w-6xl">
        <div class="flex justify-between items-end mb-8 border-b border-base-200 pb-4">
            <div>
                <h1 class="text-4xl font-extrabold mb-2">Live Markets</h1>
                <p class="text-lg opacity-70">Predict the outcomes of upcoming community events.</p>
            </div>
            <div class="tabs tabs-boxed bg-base-200">
                <a class="tab tab-active text-primary font-bold">All Events</a> 
                <a class="tab">Tours</a> 
            </div>
        </div>

        {#if loading}
            <div class="flex justify-center items-center h-64">
                <span class="loading loading-ring loading-lg text-primary"></span>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each events as market}
                <a href="/market/{market.id}" class="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors cursor-pointer group no-underline text-base-content block">
                  <div class="card-body p-6">
                    <div class="flex justify-between items-start mb-4">
                        {#if market.isMainBoard}
                            <div class="badge badge-error badge-outline font-bold text-xs uppercase tracking-wider">Main Board</div>
                        {:else}
                            <div class="badge badge-secondary badge-outline font-bold text-xs uppercase tracking-wider">Sandbox</div>
                        {/if}
                        <div class="text-xs opacity-50 font-mono">Event: {market.event.name}</div>
                    </div>
                    
                    <h2 class="card-title text-xl mb-6 leading-snug group-hover:text-primary transition-colors">
                        {market.question}
                    </h2>
                    
                    <div class="space-y-3">
                        {#each market.outcomes as outcome}
                        <div class="flex items-center gap-3">
                            <div class="w-16 text-sm font-semibold opacity-80 truncate" title={outcome.name}>{outcome.name}</div>
                            <progress class="progress progress-primary w-full h-3" value={outcome.probability} max="100"></progress>
                            <div class="w-10 text-right text-sm font-bold text-primary">{outcome.probability}%</div>
                        </div>
                        {/each}
                    </div>
                    
                    <div class="card-actions justify-end mt-6">
                      <button class="btn btn-primary btn-sm w-full font-bold pointer-events-none">Trade</button>
                    </div>
                  </div>
                </a>
                {/each}
            </div>
        {/if}
    </main>
</div>
