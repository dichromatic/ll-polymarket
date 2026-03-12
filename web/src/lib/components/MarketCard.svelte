<script lang="ts">
    export let market: any; // Using any for brevity here

    // Calculate total volume (sum of all UO outstanding)
    const totalVolume = market.outcomes ? market.outcomes.reduce((acc: number, outcome: any) => acc + outcome.sharesOutstanding, 0) : 0;
</script>

<a href={`/m/${market.id}`} class="card w-full h-full bg-base-100 shadow-md hover:shadow-xl border border-base-300 hover:border-primary transition-all duration-300 group block relative flex flex-col">
    
    <!-- Status Top Border Indicator -->
    <div class="absolute top-0 left-0 w-full h-1 
        {market.status === 'RESOLVED' ? 'bg-success' : 
         market.status === 'OPEN' ? 'bg-primary' : 
         market.status === 'VOIDED' ? 'bg-error' : 'bg-base-300'}">
    </div>

    <div class="card-body p-5 pt-6 flex-1 flex flex-col">
        <!-- Optional Breadcrumb context (if loaded) -->
        {#if market.event}
            <div class="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-2 truncate group-hover:text-primary transition-colors">
                {market.event.category.name} <span class="mx-1">•</span> {market.event.name}
            </div>
        {/if}

        <div class="flex justify-between items-start gap-4 mb-4">
            <h2 class="card-title text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                {market.question}
            </h2>
        </div>

        <div class="flex flex-col gap-2 mb-4">
            <!-- Sort outcomes by UO descending, taking max 4 -->
            {#each [...market.outcomes].sort((a, b) => b.sharesOutstanding - a.sharesOutstanding).slice(0, 4) as outcome}
                <div class="flex justify-between items-center px-3 py-2 bg-base-200/50 rounded-md border border-base-200/50 group-hover:bg-base-200 transition-colors">
                    <span class="font-medium text-sm truncate pr-2 {outcome.isWinner ? 'text-success font-bold' : ''}">
                        {outcome.name} {outcome.isWinner ? '✓' : ''}
                    </span>
                    <span class="text-xs font-mono opacity-80 whitespace-nowrap">
                        {Math.round(outcome.sharesOutstanding)} UO
                    </span>
                </div>
            {/each}
            {#if market.outcomes.length > 4}
                <div class="text-xs text-center opacity-50 mt-1 italic">
                    + {market.outcomes.length - 4} more options
                </div>
            {/if}
        </div>

        <div class="mt-auto pt-4 border-t border-base-200 flex items-center justify-between">
            <div class="flex gap-2 items-center">
                {#if market.status === 'RESOLVED'}
                    <span class="badge badge-success badge-sm font-bold">RESOLVED</span>
                {:else if market.status === 'OPEN'}
                    <span class="badge badge-primary badge-sm font-bold">LIVE</span>
                {:else}
                    <span class="badge badge-ghost badge-sm font-bold">{market.status}</span>
                {/if}

                <span class="badge badge-outline badge-sm text-[10px] opacity-60 border-base-300">
                    {market.tier === 'MAIN_BOARD' ? 'Main' : 'Sandbox'}
                </span>
            </div>
            
            <div class="text-xs font-mono opacity-70">
                Vol: {Math.round(totalVolume).toLocaleString()} UO
            </div>
        </div>
    </div>
</a>
