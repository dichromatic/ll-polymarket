<script lang="ts">
    import { formatPricePerShare, formatShares, formatUO } from '$lib/utils/format';

    let { data } = $props<{
        data: {
            positions: Array<{
                id: string;
                sharesOwned: number;
                averageCost: number;
                outcome: {
                    name: string;
                    market: {
                        question: string;
                    }
                }
            }>;
            transactions: Array<{
                id: string;
                type: string;
                amount: number;
                shares: number;
                createdAt: string;
            }>;
        }
    }>();
</script>

<div class="mb-8">
    <h1 class="text-3xl font-bold mb-6">Your Portfolio</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
            <h2 class="text-xl font-semibold mb-4 border-b border-base-300 pb-2">Active Positions</h2>

            {#if data.positions.length > 0}
                <div class="flex flex-col gap-4">
                    {#each data.positions as pos (pos.id)}
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body p-4">
                                <h3 class="font-bold">{pos.outcome.market.question}</h3>
                                <div class="flex justify-between items-center mt-2">
                                    <div class="badge badge-primary">{pos.outcome.name}</div>
                                    <div class="text-sm text-right">
                                        <div class="font-semibold">{formatShares(pos.sharesOwned, { maximumFractionDigits: 2 })}</div>
                                        <div class="opacity-70">@ {formatPricePerShare(pos.averageCost, 3)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="p-8 text-center bg-base-200 rounded-lg">
                    <p class="opacity-70">No active positions found.</p>
                </div>
            {/if}
        </section>

        <section>
            <h2 class="text-xl font-semibold mb-4 border-b border-base-300 pb-2">Recent Transactions</h2>

            {#if data.transactions.length > 0}
                <div class="overflow-x-auto bg-base-100 rounded-lg border border-base-200">
                    <table class="table table-sm w-full">
                        <thead>
                            <tr class="bg-base-200">
                                <th>Type</th>
                                <th>Shares</th>
                                <th>UO</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each data.transactions as tx (tx.id)}
                                <tr>
                                    <td>
                                        <div class={`badge ${tx.type === 'BUY' ? 'badge-success' : tx.type === 'SELL' ? 'badge-warning' : 'badge-ghost'} badge-sm`}>
                                            {tx.type}
                                        </div>
                                    </td>
                                    <td>
                                        {#if tx.shares == null}
                                            -
                                        {:else}
                                            {formatShares(Math.abs(tx.shares), { maximumFractionDigits: 2 })}
                                        {/if}
                                    </td>
                                    <td class={tx.amount >= 0 ? 'text-success' : 'text-error'}>
                                        {tx.amount >= 0 ? '+' : '-'}{formatUO(Math.abs(tx.amount), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td class="text-xs opacity-70">
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
                <div class="p-8 text-center bg-base-200 rounded-lg">
                    <p class="opacity-70">No recent transactions found.</p>
                </div>
            {/if}
        </section>
    </div>
</div>
