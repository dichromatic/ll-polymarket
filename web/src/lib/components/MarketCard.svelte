<script lang="ts">
    export let market: any; // Using any for brevity here
</script>

<!-- The Card UI -->
<div class="card w-full bg-base-100 shadow-xl border border-base-300 hover:border-primary transition-colors">
    <div class="card-body">
        <div class="flex justify-between items-start mb-2">
            <h2 class="card-title text-xl font-bold">{market.question}</h2>
            <div class="badge badge-outline">{market.tier}</div>
        </div>

        <div class="flex flex-col gap-2 my-4">
            {#each market.outcomes as outcome}
                <div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span class="font-semibold">{outcome.name}</span>
                    <span class="text-sm opacity-70">{Math.round(outcome.sharesOutstanding)} shares</span>
                </div>
            {/each}
        </div>

        <div class="card-actions justify-end mt-4">
            {#if market.status === 'RESOLVED'}
                <div class="badge badge-success p-3 font-bold">RESOLVED</div>
                <a href={`/m/${market.id}`} class="btn btn-outline btn-sm sm:w-auto">View Results</a>
            {:else if market.status === 'OPEN'}
                <a href={`/m/${market.id}`} class="btn btn-primary w-full sm:w-auto">View Market</a>
            {:else}
                <div class="badge badge-ghost p-3 font-bold">{market.status}</div>
                <a href={`/m/${market.id}`} class="btn btn-outline btn-sm sm:w-auto">Details</a>
            {/if}
        </div>
    </div>
</div>
