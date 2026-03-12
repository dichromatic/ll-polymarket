<script lang="ts">
    import { page } from '$app/stores';
    import { invalidateAll } from '$app/navigation';
    import { LMSR } from '$lib/amm/lmsr';

    let { market, userPositions = [] } = $props<{
        market: any;
        userPositions?: Array<{ id: string; outcomeId: string; sharesOwned: number }>;
    }>();

    let mode = $state<'BUY'|'SELL'>('BUY');
    let selectedOutcomeId = $state<string>('');
    let amountStr = $state<string>('');
    let isProcessing = $state<boolean>(false);
    let errorMsg = $state<string>('');

    // Watch mode changes to reset state
    $effect(() => {
        if (mode) {
            selectedOutcomeId = '';
            amountStr = '';
            errorMsg = '';
        }
    });

    let selectedPosition = $derived(userPositions.find((p: { outcomeId: string, sharesOwned: number }) => p.outcomeId === selectedOutcomeId));
    let hasPositions = $derived(userPositions.length > 0);

    let currentSharesArray = $derived(market.outcomes.map((o: any) => o.sharesOutstanding));
    let currentPrices = $derived(LMSR.getPrices(market.liquidity_b, currentSharesArray));

    let estimatedResult = $derived.by(() => {
        if (!amountStr || !selectedOutcomeId) return null;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) return null;
        
        const outcomeIndex = market.outcomes.findIndex((o: any) => o.id === selectedOutcomeId);
        if (outcomeIndex === -1) return null;

        try {
            if (mode === 'BUY') {
                const { UO } = LMSR.getMaxSharesForPoints(market.liquidity_b, currentSharesArray, outcomeIndex, amount);
                return { UO, UO: amount };
            } else {
                const pos = userPositions.find((p: any) => p.outcomeId === selectedOutcomeId);
                if (!pos || amount > pos.sharesOwned) return null;
                
                const { refund } = LMSR.getRefundForShares(market.liquidity_b, currentSharesArray, outcomeIndex, amount);
                return { UO: amount, UO: refund };
            }
        } catch (e) {
            return null;
        }
    });

    async function handleTrade() {
        if (!selectedOutcomeId || !amountStr) return;
        
        isProcessing = true;
        errorMsg = '';
        
        try {
            const endpoint = mode === 'BUY' ? '/api/internal/trade' : '/api/internal/trade/sell';
            const bodyPayload = mode === 'BUY' 
                ? {
                    userId: $page.data.user?.id,
                    marketId: market.id,
                    outcomeId: selectedOutcomeId,
                    spendAmount: parseFloat(amountStr)
                }
                : {
                    userId: $page.data.user?.id,
                    marketId: market.id,
                    outcomeId: selectedOutcomeId,
                    sharesToSell: parseFloat(amountStr)
                };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer dev_internal_token_123'
                },
                body: JSON.stringify(bodyPayload)
            });
            if (res.ok) {
                amountStr = '';
                selectedOutcomeId = '';
                await invalidateAll(); // Refresh page data
            } else {
                const data = await res.json();
                errorMsg = data.error || 'Trade failed';
            }
        } catch (e) {
            console.error(e);
            errorMsg = 'A network error occurred.';
        } finally {
            isProcessing = false;
        }
    }
</script>

<div class="card bg-base-100 shadow-xl border-t-4 {mode === 'BUY' ? 'border-primary' : 'border-secondary'}">
    <div class="card-body">
        
        <!-- Mode Tabs -->
        <div class="tabs tabs-boxed mb-4 p-1 bg-base-200 gap-1">
            <button 
                class="tab flex-1 transition-all rounded-md {mode === 'BUY' ? 'tab-active font-bold shadow-sm' : 'opacity-70 hover:opacity-100'}"
                onclick={() => mode = 'BUY'}
            >
                Buy UO
            </button>
            <button 
                class="tab flex-1 transition-all rounded-md {mode === 'SELL' ? 'tab-active font-bold shadow-sm' : 'opacity-70 hover:opacity-100'}"
                onclick={() => mode = 'SELL'}
                disabled={!hasPositions}
            >
                Sell UO
            </button>
        </div>
        
        {#if errorMsg}
            <div class="alert alert-error mb-4">
                <span>{errorMsg}</span>
            </div>
        {/if}

        {#if mode === 'SELL' && !hasPositions}
            <div class="text-center opacity-70 my-8">
                You do not own any UO in this market to sell.
            </div>
        {:else}
            <div class="form-control mb-6">
                <span class="label-text mb-3 font-semibold text-lg">Select Outcome</span>
                
                {#if market.template === 'BINARY' && market.outcomes.length === 2}
                    <!-- BINARY: Large side-by-side buttons -->
                    <div class="flex gap-4 mb-6">
                        {#each market.outcomes as outcome, i}
                            {@const pos = userPositions.find((p: { outcomeId: string, sharesOwned: number }) => p.outcomeId === outcome.id)}
                            {#if mode === 'BUY' || (mode === 'SELL' && pos && pos.sharesOwned > 0)}
                                <button 
                                    class="flex-1 p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 {selectedOutcomeId === outcome.id ? (mode === 'BUY' ? 'border-primary bg-primary/10 scale-[1.02] shadow-sm' : 'border-secondary bg-secondary/10 scale-[1.02] shadow-sm') : 'border-base-300 hover:border-base-content/20 bg-base-100'}"
                                    onclick={() => selectedOutcomeId = outcome.id}
                                >
                                    <span class="font-extrabold text-2xl {i === 0 ? 'text-primary' : 'text-secondary'}">{outcome.name}</span>
                                    {#if mode === 'BUY'}
                                        <div class="flex flex-col items-center">
                                            <span class="text-sm font-bold text-primary">{Math.round(currentPrices[i] * 100)}¢</span>
                                            <span class="text-[10px] opacity-60">Price per share</span>
                                        </div>
                                    {:else if mode === 'SELL' && pos}
                                        <span class="text-sm font-semibold badge badge-outline border-secondary text-secondary">{pos.sharesOwned.toFixed(2)} held</span>
                                    {/if}
                                </button>
                            {/if}
                        {/each}
                    </div>
                {:else}
                    <!-- STANDARD LIST: Used for non-binary -->
                    <div class="flex flex-col gap-3 mb-6">
                        {#each market.outcomes as outcome, i}
                            {@const pos = userPositions.find((p: { outcomeId: string, sharesOwned: number }) => p.outcomeId === outcome.id)}
                            {#if mode === 'BUY' || (mode === 'SELL' && pos && pos.sharesOwned > 0)}
                                <label class="label cursor-pointer flex justify-start gap-4 p-4 bg-base-200 rounded-lg border-2 {selectedOutcomeId === outcome.id ? (mode === 'BUY' ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary/10') : 'border-transparent hover:border-base-300'} transition-all">
                                    <input 
                                        type="radio" 
                                        name="outcome-radio" 
                                        class="radio {mode === 'BUY' ? 'radio-primary' : 'radio-secondary'} radio-sm" 
                                        value={outcome.id} 
                                        bind:group={selectedOutcomeId}
                                        aria-label={outcome.name}
                                    />
                                    <div class="flex flex-row justify-between w-full pr-2 items-center">
                                        <span class="label-text font-bold text-lg">{outcome.name}</span>
                                        {#if mode === 'BUY'}
                                            <span class="badge badge-primary badge-outline font-bold">{Math.round(currentPrices[i] * 100)}¢</span>
                                        {:else if mode === 'SELL' && pos}
                                            <span class="badge badge-outline">{pos.sharesOwned.toFixed(2)} held</span>
                                        {/if}
                                    </div>
                                </label>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="form-control mb-6">
                <label class="label" for="amount">
                    <span class="label-text font-semibold text-sm opacity-80">{mode === 'BUY' ? 'UO to Spend (Cost)' : 'UO to Sell'}</span>
                    {#if mode === 'SELL' && selectedPosition}
                        <span class="label-text-alt opacity-70">Max: {selectedPosition.sharesOwned.toFixed(2)}</span>
                    {/if}
                </label>
                <div class="join w-full">
                    {#if mode === 'BUY'}
                        <span class="join-item bg-base-300 flex items-center px-4 font-mono font-bold border border-base-content/20">UO</span>
                    {/if}
                    <input 
                        id="amount"
                        type="number" 
                        placeholder={mode === 'BUY' ? "e.g. 50" : "Number of UO"} 
                        class="input input-bordered input-lg w-full font-mono font-bold join-item {mode === 'SELL' ? 'focus:border-secondary' : ''}" 
                        bind:value={amountStr}
                        min="1"
                        max={mode === 'SELL' && selectedPosition ? selectedPosition.sharesOwned : undefined}
                    />
                    {#if mode === 'SELL'}
                        <span class="join-item bg-base-300 flex items-center px-4 font-mono font-bold border border-base-content/20">UO</span>
                    {/if}
                </div>
            </div>

            <!-- Estimation feedback -->
            <div class="min-h-[3rem] mb-4 flex items-center justify-center bg-base-200/50 rounded-lg p-3 border border-base-300">
                {#if estimatedResult}
                    {#if mode === 'BUY'}
                        <div class="text-center text-sm">
                            Est. Return: <span class="font-bold text-success">+{estimatedResult.UO.toFixed(2)} UO</span>
                            <br/>
                            <span class="opacity-60 text-xs">(Avg price: {Math.round((estimatedResult.UO / estimatedResult.UO) * 100)}¢ per share)</span>
                        </div>
                    {:else}
                        <div class="text-center text-sm">
                            Est. Refund: <span class="font-bold text-success">+{estimatedResult.UO.toFixed(2)} UO</span>
                            <br/>
                            <span class="opacity-60 text-xs">(Avg sell price: {Math.round((estimatedResult.UO / estimatedResult.UO) * 100)}¢ per share)</span>
                        </div>
                    {/if}
                {:else}
                    <span class="opacity-50 text-sm">Enter an amount to see estimate</span>
                {/if}
            </div>

            <button 
                class="btn {mode === 'BUY' ? 'btn-primary' : 'btn-secondary'} btn-lg w-full font-bold shadow-md hover:shadow-lg transition-all" 
                onclick={handleTrade}
                disabled={!selectedOutcomeId || !amountStr || parseFloat(amountStr) <= 0 || (mode === 'SELL' && selectedPosition && parseFloat(amountStr) > selectedPosition.sharesOwned) || isProcessing || market.status !== 'OPEN'}
            >
                {#if market.status !== 'OPEN'}
                    Market is {market.status}
                {:else if isProcessing}
                    <span class="loading loading-spinner"></span>
                    Processing...
                {:else}
                    {mode === 'BUY' ? 'Confirm Purchase' : 'Liquidate UO'}
                {/if}
            </button>
        {/if}
    </div>
</div>
