<script lang="ts">
    import MarketList from '$lib/components/MarketList.svelte';
    import MarketFilterBar from '$lib/components/MarketFilterBar.svelte';

    let { data } = $props<{
        data: {
            event: {
                id: string;
                name: string;
                description: string;
                status: string;
                category: {
                    id: string;
                    name: string;
                }
            };
            activeMarkets: Array<any>;
            resolvedMarkets: Array<any>;
            filters: {
                q: string;
                tier: string | null;
                template: string | null;
            }
        }
    }>();
</script>

<div class="mb-10 text-center sm:text-left">
    <a href={`/c/${data.event.category.id}`} class="text-sm font-semibold opacity-70 hover:opacity-100 flex items-center gap-1 mb-4 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        {data.event.category.name}
    </a>
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">{data.event.name}</h1>
            <p class="text-lg opacity-70 max-w-2xl">{data.event.description || ''}</p>
        </div>
        <div>
            <div class="badge badge-lg {data.event.status === 'UPCOMING' ? 'badge-primary' : data.event.status === 'LIVE' ? 'badge-error' : 'badge-ghost'}">
                {data.event.status}
            </div>
        </div>
    </div>
</div>

<MarketFilterBar currentFilters={data.filters} />

<section class="mb-12">
    <div class="flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
        <h2 class="text-2xl font-bold border-l-4 border-primary pl-3">Live Predictions</h2>
    </div>
    
    {#if data.activeMarkets.length === 0}
        <div class="p-8 text-center bg-base-200 rounded-lg">
            <p class="opacity-70">No active markets found for this event right now.</p>
        </div>
    {:else}
        <MarketList markets={data.activeMarkets} />
    {/if}
</section>

{#if data.resolvedMarkets?.length > 0}
<section>
    <div class="flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
        <h2 class="text-2xl font-bold opacity-80">Past Markets</h2>
    </div>
    <div class="opacity-80">
        <MarketList markets={data.resolvedMarkets} />
    </div>
</section>
{/if}
