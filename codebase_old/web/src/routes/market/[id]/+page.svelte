<script lang="ts">
    import { LMSR } from '$lib/amm/lmsr';
    
    let { data } = $props();
    let market = $state(data.market);
    let users = data.users;
    
    // UI State for testing trades
    let selectedUserId = $state(users.length > 0 ? users[0].id : '');
    let selectedOutcomeId = $state(market.outcomes.length > 0 ? market.outcomes[0].id : '');
    let tradeAmount = $state(10);
    
    let isTrading = $state(false);
    let tradeResult = $state(null);
    let errorMsg = $state('');

    // Derived state for LMSR probabilities and cost calculations
    let calculatedProbabilities = $derived.by(() => {
        const shares = market.outcomes.map(o => o.sharesOutstanding);
        const prices = LMSR.getPrices(market.liquidity_b, shares);
        
        return market.outcomes.map((o, idx) => ({
            ...o,
            probability: Math.round(prices[idx] * 100),
            rawPrice: prices[idx]
        }));
    });

    // Calculate how many shares they will receive based on current input
    let prospectiveTrade = $derived.by(() => {
        if (!selectedOutcomeId || tradeAmount <= 0) return { shares: 0, actualCost: 0 };
        
        const outcomeIndex = market.outcomes.findIndex(o => o.id === selectedOutcomeId);
        if (outcomeIndex === -1) return { shares: 0, actualCost: 0 };
        
        const sharesArray = market.outcomes.map(o => o.sharesOutstanding);
        return LMSR.getMaxSharesForPoints(market.liquidity_b, sharesArray, outcomeIndex, tradeAmount);
    });

    // Display selected user's balance
    let currentUserBalance = $derived(
        users.find(u => u.id === selectedUserId)?.balance || 0
    );

    async function executeTrade() {
        if (tradeAmount <= 0) {
            errorMsg = "Trade amount must be positive";
            return;
        }

        isTrading = true;
        errorMsg = '';
        tradeResult = null;

        try {
            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    marketId: market.id,
                    outcomeId: selectedOutcomeId,
                    spendAmount: tradeAmount
                })
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.error || 'Trade failed');
            }

            tradeResult = responseData;
            
            // Optimistically update the local state so the UI reacts immediately
            const outcomeIndex = market.outcomes.findIndex(o => o.id === selectedOutcomeId);
            market.outcomes[outcomeIndex].sharesOutstanding += responseData.sharesBought;
            
            // Update the user's balance in our mock array
            const uIndex = users.findIndex(u => u.id === selectedUserId);
            if (uIndex > -1) {
                users[uIndex].balance = responseData.newBalance;
            }

        } catch (e: any) {
            errorMsg = e.message;
        } finally {
            isTrading = false;
        }
    }
</script>

<div class="min-h-screen bg-base-300 text-base-content font-sans pb-12">
    <!-- Navbar -->
    <div class="navbar bg-base-100 shadow-xl px-8 mb-8">
      <div class="flex-1">
        <a href="/" class="btn btn-ghost text-2xl font-bold tracking-tighter text-primary">
            POLYMARKET <span class="text-neutral-content font-light">CLONE</span>
        </a>
      </div>
    </div>

    <main class="container mx-auto px-4 max-w-5xl">
        <!-- Breadcrumb & Status -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div class="text-sm breadcrumbs opacity-70">
              <ul>
                <li><a href="/">Home</a></li> 
                <li><a href="/">{market.event.category?.name || "Category"}</a></li> 
                <li><a href="/">{market.event.name}</a></li>
                <li class="truncate max-w-xs">{market.question}</li>
              </ul>
            </div>
            
            <div class="flex gap-2">
                {#if market.isMainBoard}
                    <div class="badge badge-error badge-outline font-bold">Main Board (b={market.liquidity_b})</div>
                {:else}
                    <div class="badge badge-secondary badge-outline font-bold">Sandbox (b={market.liquidity_b})</div>
                {/if}
                <div class="badge badge-neutral shadow font-bold tracking-widest">{market.status}</div>
            </div>
        </div>

        <h1 class="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">{market.question}</h1>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Probabilities & Resolution Rules -->
            <div class="lg:col-span-2 space-y-8">
                <div class="card bg-base-100 shadow-xl border border-base-200">
                    <div class="card-body p-6 md:p-8">
                        <h2 class="text-2xl font-bold mb-6">Current Probabilities</h2>
                        
                        <div class="space-y-6">
                            {#each calculatedProbabilities as outcome}
                            <div class="group">
                                <div class="flex justify-between items-end mb-2">
                                    <div class="font-bold text-lg">{outcome.name}</div>
                                    <div class="text-2xl font-extrabold text-primary">{outcome.probability}%</div>
                                </div>
                                <div class="relative w-full h-4 bg-base-300 rounded-full overflow-hidden">
                                    <div class="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out" 
                                         style="width: {outcome.probability}%">
                                    </div>
                                </div>
                                <div class="flex justify-between mt-1 text-xs opacity-50 font-mono">
                                    <span>{outcome.sharesOutstanding.toFixed(1)} shares</span>
                                    <span>Price: ◎{outcome.rawPrice.toFixed(3)}</span>
                                </div>
                            </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <div class="card bg-base-100 shadow-xl border border-base-200">
                    <div class="card-body p-6 md:p-8">
                        <h3 class="text-xl font-bold mb-2">Resolution Guidelines</h3>
                        <p class="opacity-80 leading-relaxed font-serif bg-base-200 p-4 rounded-lg border-l-4 border-primary">
                            {market.resolutionRules}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Right Column: Trading Interface -->
            <div class="space-y-6">
                <div class="card bg-base-100 shadow-2xl border border-primary">
                    <div class="card-body p-6">
                        <h2 class="card-title text-2xl font-bold mb-4">Trade</h2>
                        
                        <!-- Test User Mocker -->
                        <div class="form-control mb-6">
                            <label class="label">
                                <span class="label-text font-bold text-primary">Testing: Act As User</span>
                            </label>
                            <select class="select select-bordered select-primary w-full shadow-inner bg-base-200" bind:value={selectedUserId}>
                                {#each users as u}
                                    <option value={u.id}>{u.username} (◎{u.balance.toFixed(0)})</option>
                                {/each}
                            </select>
                        </div>

                        <div class="divider mt-0 mb-4 text-xs opacity-50 uppercase tracking-widest">Execute</div>

                        <!-- Trade Direction -->
                        <div class="tabs tabs-boxed mb-6 p-1 bg-base-200">
                            <a class="tab flex-1 tab-active font-bold text-success">Buy</a> 
                            <a class="tab flex-1 font-bold text-base-content opacity-50">Sell (Not Implemented)</a> 
                        </div>

                        <!-- Outcome Selection -->
                        <div class="form-control mb-4">
                            <label class="label"><span class="label-text font-bold">Pick Outcome</span></label>
                            <div class="flex flex-col gap-2">
                                {#each calculatedProbabilities as outcome}
                                    <label class="cursor-pointer border border-base-300 rounded-lg p-3 hover:border-primary transition-colors {selectedOutcomeId === outcome.id ? 'bg-primary bg-opacity-10 border-primary' : ''}">
                                        <div class="flex items-center gap-3">
                                            <input type="radio" class="radio radio-primary radio-sm" name="outcome" value={outcome.id} bind:group={selectedOutcomeId} />
                                            <span class="font-bold flex-1">{outcome.name}</span>
                                            <span class="font-mono text-sm opacity-70">{outcome.probability}%</span>
                                        </div>
                                    </label>
                                {/each}
                            </div>
                        </div>

                        <!-- Amount Input -->
                        <div class="form-control mb-6">
                            <label class="label">
                                <span class="label-text font-bold">Amount to Spend</span>
                                <span class="label-text-alt text-xs opacity-70 font-mono">Bal: ◎{currentUserBalance.toFixed(2)}</span>
                            </label>
                            <div class="relative">
                                <span class="absolute left-4 top-3 text-lg font-bold opacity-50">◎</span>
                                <input type="number" class="input input-bordered input-lg w-full pl-10 font-mono text-xl shadow-inner rounded-xl" bind:value={tradeAmount} min="1" max={currentUserBalance} />
                            </div>
                        </div>

                        <!-- AMM AMM Estimate Stats -->
                        <div class="bg-base-200 rounded-xl p-4 mb-6 text-sm space-y-2 font-mono">
                            <div class="flex justify-between">
                                <span class="opacity-70">Avg. Price / Share:</span>
                                <span class="font-bold text-primary">
                                    ◎{(prospectiveTrade.shares > 0 ? (prospectiveTrade.actualCost / prospectiveTrade.shares) : 0).toFixed(3)}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="opacity-70">Estimated Shares:</span>
                                <span class="font-bold text-success">{prospectiveTrade.shares.toFixed(2)} shares</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="opacity-70">Potential Payout:</span>
                                <span class="font-bold text-success">◎{prospectiveTrade.shares.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between border-t border-base-300 pt-2 mt-2">
                                <span class="opacity-70">Return on Investment:</span>
                                <span class="font-bold">
                                    {(prospectiveTrade.actualCost > 0 ? ((prospectiveTrade.shares - prospectiveTrade.actualCost) / prospectiveTrade.actualCost * 100).toFixed(1) : 0)}%
                                </span>
                            </div>
                        </div>

                        <!-- Error State -->
                        {#if errorMsg}
                            <div class="alert alert-error mb-4 rounded-xl shadow-lg p-3 text-sm font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{errorMsg}</span>
                            </div>
                        {/if}

                        <!-- Success State -->
                        {#if tradeResult}
                            <div class="alert alert-success mb-4 rounded-xl shadow-lg p-3 text-sm font-bold text-success-content bg-success border-2 border-emerald-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Bought {tradeResult.sharesBought.toFixed(2)} shares!</span>
                            </div>
                        {/if}

                        <button 
                            class="btn btn-primary btn-lg w-full font-extrabold text-lg shadow-xl shadow-primary/30"
                            disabled={isTrading || tradeAmount <= 0 || tradeAmount > currentUserBalance || market.status !== 'OPEN'}
                            onclick={executeTrade}
                        >
                            {#if isTrading}
                                <span class="loading loading-spinner"></span> Executing...
                            {:else if market.status !== 'OPEN'}
                                MARKET CLOSED
                            {:else}
                                BUY SHARES
                            {/if}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>
