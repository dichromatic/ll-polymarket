<script lang="ts">
    let { data } = $props<{
        data: {
            category: {
                id: string;
                name: string;
                description: string;
            };
            upcomingEvents: Array<{
                id: string;
                name: string;
                status: string;
                markets: Array<{ id: string }>;
            }>;
            pastEvents: Array<{
                id: string;
                name: string;
                status: string;
                markets: Array<{ id: string }>;
            }>;
        }
    }>();
</script>

<div class="mb-10 text-center sm:text-left">
    <a href="/" class="text-sm font-semibold opacity-70 hover:opacity-100 flex items-center gap-1 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Explorer
    </a>
    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-primary">{data.category.name}</h1>
    <p class="text-lg opacity-70 max-w-2xl">{data.category.description || ''}</p>
</div>

<section class="mb-12">
    <div class="flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
        <h2 class="text-2xl font-bold">Tour Dates & Events</h2>
    </div>
    
    <div class="flex flex-col gap-4">
        {#each data.upcomingEvents as event}
            <a href={`/e/${event.id}`} class="card bg-base-100 shadow-sm border border-base-200 hover:border-primary transition-colors">
                <div class="card-body p-5 flex flex-row items-center justify-between">
                    <div>
                        <h3 class="font-bold text-xl">{event.name}</h3>
                        <p class="text-sm opacity-70 mt-1">
                            {event.markets.length} {event.markets.length === 1 ? 'active market' : 'active markets'}
                        </p>
                    </div>
                    <div class="badge {event.status === 'UPCOMING' ? 'badge-primary' : event.status === 'LIVE' ? 'badge-error' : 'badge-ghost'}">
                        {event.status}
                    </div>
                </div>
            </a>
        {/each}
        
        {#if data.upcomingEvents.length === 0}
            <div class="p-8 text-center bg-base-200 rounded-lg">
                <p class="opacity-70">No active events found for this category.</p>
            </div>
        {/if}
    </div>
</section>

{#if data.pastEvents?.length > 0}
<section>
    <div class="flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
        <h2 class="text-2xl font-bold opacity-80">Past Events</h2>
    </div>
    <div class="flex flex-col gap-4">
        {#each data.pastEvents as event}
            <a href={`/e/${event.id}`} class="card bg-base-100 shadow-sm border border-base-200 hover:bg-base-300 transition-colors opacity-80">
                <div class="card-body p-5 flex flex-row items-center justify-between">
                    <div>
                        <h3 class="font-bold text-lg">{event.name}</h3>
                        <p class="text-xs opacity-70 mt-1">
                            {event.markets.length} archived {event.markets.length === 1 ? 'market' : 'markets'}
                        </p>
                    </div>
                    <div class="badge badge-outline shadow-sm font-bold {event.status === 'RESOLVED' ? 'badge-success' : 'badge-ghost'}">
                        {event.status}
                    </div>
                </div>
            </a>
        {/each}
    </div>
</section>
{/if}
