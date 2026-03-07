<script lang="ts">
    import { onMount } from 'svelte';
    import { invalidateAll } from '$app/navigation';
    import AnalyticsChart from '$lib/components/AnalyticsChart.svelte';
    import TradeWidget from '$lib/components/TradeWidget.svelte';
    
    onMount(() => {
        const interval = setInterval(() => {
            invalidateAll();
        }, 1000);
        return () => clearInterval(interval);
    });

    let { data } = $props<{
        data: {
            market: {
                id: string;
                question: string;
                resolutionRules: string;
                status: string;
                tier: string;
                template: string;
                event: {
                    id: string;
                    name: string;
                };
                outcomes: Array<{
                    id: string;
                    name: string;
                    sharesOutstanding: number;
                }>;
                transactions: Array<{
                    id: string;
                    type: string;
                    amount: number;
                    shares: number;
                    user: { username: string; }
                }>;
            };
            userPositions: Array<{
                id: string;
                sharesOwned: number;
                outcomeId: string;
            }>;
        }
    }>();

    let m = $derived(data.market);
    let p = $derived(data.userPositions);
</script>

<div class="mb-8">
    <a href={`/e/${m.event.id}`} class="text-sm font-semibold opacity-70 hover:opacity-100 flex items-center gap-1 mb-4 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        {m.event.name}
    </a>
    
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
            <div class="flex items-center gap-2 mb-2">
                <div class="badge badge-outline">{m.tier}</div>
                <div class="badge {m.status === 'OPEN' ? 'badge-primary' : m.status === 'RESOLVED' ? 'badge-success' : 'badge-ghost'}">
                    {m.status}
                </div>
            </div>
            <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">{m.question}</h1>
            <p class="text-sm opacity-70 border-l-2 border-base-300 pl-3 max-w-3xl">
                <span class="font-bold">Resolution Rules:</span> {m.resolutionRules}
            </p>
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Left Column: Analytics (Chart & History) -->
    <div class="lg:col-span-2 space-y-8">
        <!-- Probability Chart Component -->
        <AnalyticsChart outcomes={m.outcomes} template={m.template} />

        <!-- Transaction Feed -->
        <div class="card bg-base-100 shadow-md border border-base-200">
            <div class="card-body">
                <h2 class="card-title text-xl mb-4">Recent Transactions</h2>
                
                {#if m.transactions.length === 0}
                    <div class="text-center p-6 bg-base-200 rounded-lg opacity-70">
                        No trading history yet. Be the first!
                    </div>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="table table-zebra table-sm">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each m.transactions as tx}
                                    <tr>
                                        <td class="font-semibold">{tx.user.username}</td>
                                        <td>
                                            {#if tx.type === 'BUY'}
                                                <span class="text-success font-medium">bought {Math.round(tx.shares)} shares</span>
                                            {:else}
                                                <span class="text-error font-medium">{tx.type}</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Right Column: Action Box / Order Book -->
    <div class="space-y-6">
        <TradeWidget market={m} userPositions={p} />

        <div class="card bg-base-200 shadow-sm">
            <div class="card-body p-5">
                <h3 class="font-bold mb-2">Outcome Depth</h3>
                <ul class="space-y-2">
                    {#each m.outcomes as outcome}
                        <li class="flex justify-between items-center text-sm">
                            <span class="font-semibold truncate max-w-[150px]">{outcome.name}</span>
                            <span class="opacity-80 badge badge-sm">{outcome.name} ({Math.round(outcome.sharesOutstanding)} shares)</span>
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
    </div>
</div>
