<script lang="ts">
    import MarketCard from './MarketCard.svelte';
    
    export let markets: Array<{
        id: string;
        question: string;
        status: string;
        tier: string;
        liquidity_b: number;
        outcomes: Array<{
            id: string;
            name: string;
            sharesOutstanding: number;
        }>;
    }> = [];
</script>

{#if markets.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each markets as market (market.id)}
            <MarketCard {market} />
        {/each}
    </div>
{:else}
    <div class="flex flex-col items-center justify-center p-12 bg-base-200 rounded-xl border border-base-300 border-dashed text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 class="font-bold text-lg">No active markets found</h3>
        <p class="text-sm opacity-70 mt-1">Check back later or propose a new market on Discord.</p>
    </div>
{/if}
