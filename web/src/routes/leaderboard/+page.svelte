<script lang="ts">
    import { formatUO } from '$lib/utils/format';

    let { data } = $props<{
        data: {
            leaderboard: Array<{
                id: string;
                username: string;
                balance: number;
                portfolioValue: number;
                netWorth: number;
            }>;
        }
    }>();
</script>

<div class="mb-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-2">Global Leaderboard</h1>
    <p class="text-base-content/70 mb-6">Top traders ranked by total Net Worth (Balance + Portfolio Value).</p>

    <div class="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-200">
        <table class="table w-full">
            <thead class="bg-base-200/50">
                <tr>
                    <th class="w-16 text-center">Rank</th>
                    <th>Trader</th>
                    <th class="text-right">Liquid Balance</th>
                    <th class="text-right hidden sm:table-cell">Portfolio Value</th>
                    <th class="text-right text-primary font-bold">Net Worth</th>
                </tr>
            </thead>
            <tbody>
                {#each data.leaderboard as user, i (user.id)}
                    <tr class="hover:bg-base-200/30 transition-colors">
                        <td class="text-center font-semibold">
                            {#if i === 0}
                                <span class="text-2xl" title="1st Place">🥇</span>
                            {:else if i === 1}
                                <span class="text-2xl" title="2nd Place">🥈</span>
                            {:else if i === 2}
                                <span class="text-2xl" title="3rd Place">🥉</span>
                            {:else}
                                {i + 1}
                            {/if}
                        </td>
                        <td>
                            <a href="/u/{user.id}" class="font-bold hover:text-primary transition-colors link link-hover">
                                {user.username}
                            </a>
                        </td>
                        <td class="text-right font-mono">
                            {formatUO(user.balance, { maximumFractionDigits: 0 })}
                        </td>
                        <td class="text-right font-mono text-base-content/70 hidden sm:table-cell">
                            {formatUO(user.portfolioValue, { maximumFractionDigits: 0 })}
                        </td>
                        <td class="text-right font-mono font-bold text-primary">
                            {formatUO(user.netWorth, { maximumFractionDigits: 0 })}
                        </td>
                    </tr>
                {:else}
                    <tr>
                        <td colspan="5" class="text-center py-8 text-base-content/50">
                            No users found.
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
