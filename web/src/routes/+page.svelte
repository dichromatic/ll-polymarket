<script lang="ts">
    let { data } = $props<{
        data: {
            categories: Array<{
                id: string;
                name: string;
                description: string;
            }>;
            featuredEvents: Array<{
                id: string;
                name: string;
                category: {
                    name: string;
                }
            }>;
            pastEvents: Array<{
                id: string;
                name: string;
                category: {
                    name: string;
                }
            }>;
        }
    }>();
</script>

<div class="mb-12 text-center sm:text-left">
    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Concert Tours & Festivals</h1>
    <p class="text-lg opacity-70">Explore active predictions on the biggest live events.</p>
</div>

{#if data.featuredEvents.length > 0}
<section class="mb-16">
    <div class="flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        <h2 class="text-2xl font-bold">Trending Live Events</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each data.featuredEvents as event}
            <a href={`/e/${event.id}`} class="card bg-base-200 hover:bg-base-300 transition-colors shadow-sm outline outline-1 outline-base-content/10">
                <div class="card-body p-6">
                    <span class="text-xs font-bold text-primary uppercase tracking-widest">{event.category.name}</span>
                    <h3 class="card-title text-xl mt-1">{event.name}</h3>
                </div>
            </a>
        {/each}
    </div>
</section>
{/if}

<section>
    <h2 class="text-2xl font-bold mb-6 border-b border-base-300 pb-2">All Active Tours</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each data.categories as category}
            <a href={`/c/${category.id}`} class="card image-full bg-base-100 shadow-xl overflow-hidden group">
                <figure class="bg-neutral">
                    <!-- Placeholder gradient since we don't have images in the DB -->
                    <div class="w-full h-48 bg-gradient-to-br from-primary/40 to-secondary/40 group-hover:scale-105 transition-transform duration-500"></div>
                </figure>
                <div class="card-body">
                    <h2 class="card-title text-3xl">{category.name}</h2>
                    <p class="mt-2 text-base-content/80 text-sm overflow-hidden text-ellipsis line-clamp-2 md:line-clamp-3">
                        {category.description || 'Join the predictions for this event.'}
                    </p>
                    <div class="card-actions justify-end mt-4">
                        <button class="btn btn-primary btn-sm">View Dates</button>
                    </div>
                </div>
            </a>
        {/each}
    </div>
</section>

{#if data.pastEvents?.length > 0}
<section class="mt-16">
    <div class="flex items-center gap-2 mb-6 border-b border-base-300 pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h2 class="text-2xl font-bold opacity-80">Past Events</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each data.pastEvents as event}
            <a href={`/e/${event.id}`} class="card bg-base-100 hover:bg-base-200 transition-colors shadow-sm outline outline-1 outline-base-content/10 opacity-70">
                <div class="card-body p-5">
                    <span class="text-[10px] font-bold opacity-70 uppercase tracking-widest">{event.category.name}</span>
                    <h3 class="card-title text-base mt-1 leading-tight">{event.name}</h3>
                </div>
            </a>
        {/each}
    </div>
</section>
{/if}
