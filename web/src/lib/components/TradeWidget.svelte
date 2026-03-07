<script lang="ts">
    import { page } from '$app/stores';
    import { invalidateAll } from '$app/navigation';

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
                Buy Shares
            </button>
            <button 
                class="tab flex-1 transition-all rounded-md {mode === 'SELL' ? 'tab-active font-bold shadow-sm' : 'opacity-70 hover:opacity-100'}"
                onclick={() => mode = 'SELL'}
                disabled={!hasPositions}
            >
                Sell Shares
            </button>
        </div>
        
        {#if errorMsg}
            <div class="alert alert-error mb-4">
                <span>{errorMsg}</span>
            </div>
        {/if}

        {#if mode === 'SELL' && !hasPositions}
            <div class="text-center opacity-70 my-8">
                You do not own any shares in this market to sell.
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
                                        <span class="text-sm opacity-70 badge badge-ghost">{Math.round(outcome.sharesOutstanding)} shares volume</span>
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
                        {#each market.outcomes as outcome}
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
                                        {#if mode === 'SELL' && pos}
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
                    <span class="label-text font-semibold text-sm opacity-80">{mode === 'BUY' ? 'Points to Spend' : 'Shares to Sell'}</span>
                    {#if mode === 'SELL' && selectedPosition}
                        <span class="label-text-alt opacity-70">Max: {selectedPosition.sharesOwned.toFixed(2)}</span>
                    {/if}
                </label>
                <input 
                    id="amount"
                    type="number" 
                    placeholder={mode === 'BUY' ? "e.g. 50" : "Number of shares"} 
                    class="input input-bordered input-lg w-full font-mono font-bold {mode === 'SELL' ? 'focus:border-secondary' : ''}" 
                    bind:value={amountStr}
                    min="1"
                    max={mode === 'SELL' && selectedPosition ? selectedPosition.sharesOwned : undefined}
                />
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
                    {mode === 'BUY' ? 'Confirm Purchase' : 'Liquidate Shares'}
                {/if}
            </button>
        {/if}
    </div>
</div>
