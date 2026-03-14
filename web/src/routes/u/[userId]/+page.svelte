<script lang="ts">
    import { formatUO } from '$lib/utils/format';

    let { data } = $props<{
        data: {
            profile: {
                id: string;
                username: string;
                createdAt: Date;
                balance: number;
                rank: number;
                netWorth: number;
                portfolioValue: number;
                recentActivity: Array<{
                    id: string;
                    type: string;
                    amount: number;
                    shares: number;
                    createdAt: Date;
                    market: {
                        id: string;
                        question: string;
                    }
                }>;
            };
        }
    }>();
</script>

<div class="max-w-4xl mx-auto mb-8">
    <div class="card bg-base-100 shadow-sm border border-base-200 mb-8">
        <div class="card-body flex-row items-center gap-6">
            <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content rounded-full w-24">
                    <span class="text-3xl">{data.profile.username.charAt(0).toUpperCase()}</span>
                </div>
            </div>
            <div class="flex-1">
                <h1 class="text-3xl font-bold">{data.profile.username}</h1>
                <p class="text-base-content/60 text-sm mt-1">Joined {new Date(data.profile.createdAt).toLocaleDateString()}</p>
            </div>
            {#if data.profile.rank > 0}
                <div class="text-right">
                    <div class="text-sm uppercase tracking-wide font-semibold text-base-content/60">Global Rank</div>
                    <div class="text-4xl font-bold text-primary">#{data.profile.rank}</div>
                </div>
            {/if}
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="stat bg-base-100 shadow-sm rounded-xl border border-base-200">
            <div class="stat-title">Net Worth</div>
            <div class="stat-value text-primary">{formatUO(data.profile.netWorth, { maximumFractionDigits: 0 })}</div>
            <div class="stat-desc">Total estimated value</div>
        </div>

        <div class="stat bg-base-100 shadow-sm rounded-xl border border-base-200">
            <div class="stat-title">Liquid Balance</div>
            <div class="stat-value">{formatUO(data.profile.balance, { maximumFractionDigits: 0 })}</div>
            <div class="stat-desc">Available UO</div>
        </div>

        <div class="stat bg-base-100 shadow-sm rounded-xl border border-base-200">
            <div class="stat-title">Portfolio Value</div>
            <div class="stat-value">{formatUO(data.profile.portfolioValue, { maximumFractionDigits: 0 })}</div>
            <div class="stat-desc">Active investments</div>
        </div>
    </div>

    <div>
        <h2 class="text-2xl font-bold mb-4 border-b border-base-300 pb-2">Recent Activity</h2>
        {#if data.profile.recentActivity.length > 0}
            <div class="bg-base-100 rounded-xl shadow-sm border border-base-200 overflow-hidden">
                <table class="table w-full">
                    <thead class="bg-base-200/50">
                        <tr>
                            <th>Action</th>
                            <th>Market</th>
                            <th>UO</th>
                            <th class="text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.profile.recentActivity as tx (tx.id)}
                            <tr class="hover:bg-base-200/30 transition-colors">
                                <td>
                                    <div class={`badge ${tx.type === 'BUY' ? 'badge-success' : tx.type === 'SELL' ? 'badge-warning' : 'badge-ghost'} badge-sm`}>
                                        {tx.type}
                                    </div>
                                </td>
                                <td>
                                    <a href="/m/{tx.market.id}" class="link link-hover font-medium">
                                        {tx.market.question}
                                    </a>
                                </td>
                                <td class={`font-mono ${tx.amount >= 0 ? 'text-success' : 'text-error'}`}>
                                    {tx.amount >= 0 ? '+' : '-'}{formatUO(Math.abs(tx.amount), { maximumFractionDigits: 0 })}
                                </td>
                                <td class="text-right text-sm text-base-content/60">
                                    {new Date(tx.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <div class="bg-base-200 rounded-xl p-8 text-center text-base-content/60">
                This user has no recent trading activity.
            </div>
        {/if}
    </div>
</div>
