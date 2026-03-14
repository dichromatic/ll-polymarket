<script lang="ts">
    import { LMSR } from '$lib/amm/lmsr';

    let { outcomes, template = 'BINARY', liquidityB = 100 } = $props<{
        outcomes: Array<{
            id: string;
            name: string;
            sharesOutstanding: number;
        }>;
        template?: string;
        liquidityB?: number;
    }>();

    let totalShares = $derived(outcomes.reduce((acc: number, o: { sharesOutstanding: number }) => acc + o.sharesOutstanding, 0));
    let prices = $derived(
        outcomes.length
            ? LMSR.getPrices(liquidityB, outcomes.map((o) => o.sharesOutstanding))
            : []
    );

    let outcomesWithPrices = $derived(
        outcomes.map((outcome, index) => ({
            ...outcome,
            price: prices[index] ?? 0
        }))
    );

    // For sorting multiple choice by implied probability
    let sortedOutcomes = $derived([...outcomesWithPrices].sort((a, b) => b.price - a.price));
</script>

<div class="card bg-base-100 shadow-md border border-base-200">
    <div class="card-body">
        <h2 class="card-title text-xl mb-6">Probability Distribution</h2>
        
        {#if totalShares === 0}
            <div class="text-center p-6 bg-base-200 rounded-lg opacity-70">
                <p class="font-semibold mb-2">No liquidity yet.</p>
                <p class="text-sm">Probabilities are evenly distributed.</p>
            </div>
        {:else if template === 'BINARY' && outcomes.length >= 2}
            <!-- Tug of War View -->
            {@const leftPct = Math.round((prices[0] ?? 0) * 100)}
            {@const rightPct = 100 - leftPct}
            
            <div class="flex flex-col gap-4 mt-2">
                <div class="flex justify-between items-end px-1">
                    <div class="text-left font-bold">
                        <div class="text-lg text-primary">{outcomes[0].name}</div>
                        <div class="text-3xl font-mono">{leftPct}%</div>
                    </div>
                    <div class="text-right font-bold">
                        <div class="text-lg text-secondary">{outcomes[1].name}</div>
                        <div class="text-3xl font-mono">{rightPct}%</div>
                    </div>
                </div>
                
                <div class="w-full bg-base-200 h-10 rounded-xl overflow-hidden shadow-inner flex relative">
                    <div class="h-full bg-primary transition-all duration-1000 ease-out" style="width: {leftPct}%"></div>
                    <div class="w-1 h-full bg-base-100 z-10 -ml-0.5"></div>
                    <div class="h-full bg-secondary transition-all duration-1000 ease-out" style="width: {rightPct}%"></div>
                </div>
            </div>

        {:else if template === 'NUMERIC_BUCKET'}
            <!-- Histogram View -->
            <div class="flex items-end justify-between gap-2 h-48 mt-4 pt-8">
                {#each outcomesWithPrices as outcome}
                    {@const pct = Math.round((outcome.price ?? 0) * 100)}
                    <div class="flex flex-col items-center justify-end h-full w-full group">
                        <span class="text-sm font-mono font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{pct}%</span>
                        <div 
                            class="w-full max-w-[4rem] bg-accent rounded-t-md transition-all duration-1000 ease-out flex-shrink-0 relative overflow-hidden shadow-sm hover:brightness-110"
                            style="height: {Math.max(5, pct)}%"
                        >
                            {#if pct > 0}
                                <div class="absolute inset-x-0 top-0 h-1 bg-white/30"></div>
                            {/if}
                        </div>
                        <span class="mt-3 text-xs font-bold truncate w-full text-center px-1" title={outcome.name}>{outcome.name}</span>
                    </div>
                {/each}
            </div>

        {:else}
            <!-- Ranked List View (MULTIPLE_CHOICE, MULTI_WINNER) -->
            <div class="space-y-5">
                {#each sortedOutcomes as outcome, i}
                    {@const pct = Math.max(1, Math.round((outcome.price ?? 0) * 100))}
                    {@const isTop = i === 0}
                    <div>
                        <div class="flex justify-between items-end mb-1.5 px-1">
                            <span class="font-bold text-base flex items-center gap-2">
                                {#if isTop}
                                    <span class="text-warning text-lg leading-none">★</span>
                                {/if}
                                <span class="truncate max-w-[200px] md:max-w-[250px]">{outcome.name}</span>
                            </span>
                            <span class="text-xl font-extrabold font-mono {isTop ? 'text-primary' : 'text-base-content/80'}">{pct}%</span>
                        </div>
                        <div class="w-full bg-base-200 rounded-full h-5 overflow-hidden relative shadow-inner">
                            <div 
                                class="h-5 rounded-full {isTop ? 'bg-primary' : 'bg-base-content/40'} transition-all duration-1000 ease-out shadow-sm" 
                                style="width: {pct}%"
                            ></div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
