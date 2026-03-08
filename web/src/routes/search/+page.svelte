<script lang="ts">
    import MarketList from '$lib/components/MarketList.svelte';
    import MarketFilterBar from '$lib/components/MarketFilterBar.svelte';

    let { data } = $props<{
        data: {
            markets: Array<any>;
            filters: {
                q: string;
                tier: string | null;
                template: string | null;
                status: string;
            }
        }
    }>();
</script>

<div class="mb-10 text-center sm:text-left">
    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Market Explorer</h1>
    <p class="text-lg opacity-70">Search and filter active and past prediction markets.</p>
</div>

<!-- Tabs for OPEN / RESOLVED -->
<div class="tabs tabs-boxed mb-6 bg-base-200 max-w-xs p-1">
    <a href="?status=OPEN{data.filters.q ? '&q=' + encodeURIComponent(data.filters.q) : ''}" 
       class="tab flex-1 {data.filters.status === 'OPEN' ? 'tab-active font-bold bg-base-100 shadow-sm' : ''}">
        Active Markets
    </a>
    <a href="?status=RESOLVED{data.filters.q ? '&q=' + encodeURIComponent(data.filters.q) : ''}" 
       class="tab flex-1 {data.filters.status === 'RESOLVED' ? 'tab-active font-bold bg-base-100 shadow-sm' : ''}">
        Resolved
    </a>
</div>

<MarketFilterBar currentFilters={data.filters} />

<section class="mb-12">
    {#if data.markets.length === 0}
        <div class="p-8 text-center bg-base-200 rounded-lg">
            <p class="opacity-70">No markets found matching your criteria.</p>
        </div>
    {:else}
        <MarketList markets={data.markets} />
    {/if}
</section>
