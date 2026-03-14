<script lang="ts">
    import { page } from '$app/stores';
    import { invalidateAll } from '$app/navigation';
    import { LMSR } from '$lib/amm/lmsr';
    import {
        formatProbabilityPercent,
        formatPricePerShare,
        formatShares,
        formatUO
    } from '$lib/utils/format';

    type UserPosition = { id: string; outcomeId: string; sharesOwned: number };
    type TradeEstimate = { shares: number; uo: number; avgPrice: number };

    let { market, userPositions = [] } = $props<{
        market: any;
        userPositions?: UserPosition[];
    }>();

    let mode = $state<'BUY' | 'SELL'>('BUY');
    let selectedOutcomeId = $state<string>('');
    let amountStr = $state<string>('');
    let isProcessing = $state<boolean>(false);
    let errorMsg = $state<string>('');
    let isReviewing = $state<boolean>(false);

    $effect(() => {
        if (mode) {
            selectedOutcomeId = '';
            amountStr = '';
            errorMsg = '';
            isReviewing = false;
        }
    });

    $effect(() => {
        selectedOutcomeId;
        amountStr;
        isReviewing = false;
    });

    let selectedPosition = $derived(userPositions.find((p: UserPosition) => p.outcomeId === selectedOutcomeId));
    let hasPositions = $derived(userPositions.length > 0);
    let currentBalance = $derived(Number($page.data.user?.balance ?? 0));

    let currentSharesArray = $derived(market.outcomes.map((o: any) => o.sharesOutstanding));
    let currentPrices = $derived(LMSR.getPrices(market.liquidity_b, currentSharesArray));

    let estimatedResult = $derived.by<TradeEstimate | null>(() => {
        if (!amountStr || !selectedOutcomeId) return null;

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) return null;

        const outcomeIndex = market.outcomes.findIndex((o: any) => o.id === selectedOutcomeId);
        if (outcomeIndex === -1) return null;

        try {
            if (mode === 'BUY') {
                const { shares, actualCost } = LMSR.getMaxSharesForPoints(
                    market.liquidity_b,
                    currentSharesArray,
                    outcomeIndex,
                    amount
                );

                if (shares <= 0) return null;

                return {
                    shares,
                    uo: actualCost,
                    avgPrice: actualCost / shares
                };
            }

            const pos = userPositions.find((p: UserPosition) => p.outcomeId === selectedOutcomeId);
            if (!pos || amount > pos.sharesOwned) return null;

            const { refund } = LMSR.getRefundForShares(
                market.liquidity_b,
                currentSharesArray,
                outcomeIndex,
                amount
            );

            if (amount <= 0) return null;

            return {
                shares: amount,
                uo: refund,
                avgPrice: refund / amount
            };
        } catch (e) {
            return null;
        }
    });

    let projectedBalance = $derived.by<number | null>(() => {
        if (!estimatedResult) return null;
        if (mode === 'BUY') {
            return currentBalance - estimatedResult.uo;
        }

        return currentBalance + estimatedResult.uo;
    });

    let canReview = $derived.by<boolean>(() => {
        if (!selectedOutcomeId || !amountStr || !estimatedResult) return false;
        if (market.status !== 'OPEN' || isProcessing) return false;

        const parsedAmount = parseFloat(amountStr);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return false;
        if (mode === 'SELL' && selectedPosition && parsedAmount > selectedPosition.sharesOwned) return false;

        return true;
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
                isReviewing = false;
                await invalidateAll();
            } else {
                const data = await res.json();
                errorMsg = data.error || 'Trade failed';
                isReviewing = false;
            }
        } catch (e) {
            console.error(e);
            errorMsg = 'A network error occurred.';
            isReviewing = false;
        } finally {
            isProcessing = false;
        }
    }

    function beginReview() {
        if (!canReview) return;
        errorMsg = '';
        isReviewing = true;
    }

    function cancelReview() {
        isReviewing = false;
    }
</script>

<div class="card bg-base-100 shadow-xl border-t-4 {mode === 'BUY' ? 'border-primary' : 'border-secondary'}">
    <div class="card-body">
        <div class="tabs tabs-boxed mb-4 p-1 bg-base-200 gap-1">
            <button
                class="tab flex-1 transition-all rounded-md {mode === 'BUY' ? 'tab-active font-bold shadow-sm' : 'opacity-70 hover:opacity-100'}"
                onclick={() => (mode = 'BUY')}
            >
                Buy Shares
            </button>
            <button
                class="tab flex-1 transition-all rounded-md {mode === 'SELL' ? 'tab-active font-bold shadow-sm' : 'opacity-70 hover:opacity-100'}"
                onclick={() => (mode = 'SELL')}
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
                    <div class="flex gap-4 mb-6">
                        {#each market.outcomes as outcome, i}
                            {@const pos = userPositions.find((p: UserPosition) => p.outcomeId === outcome.id)}
                            {#if mode === 'BUY' || (mode === 'SELL' && pos && pos.sharesOwned > 0)}
                                <button
                                    class="flex-1 p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 {selectedOutcomeId === outcome.id ? mode === 'BUY' ? 'border-primary bg-primary/10 scale-[1.02] shadow-sm' : 'border-secondary bg-secondary/10 scale-[1.02] shadow-sm' : 'border-base-300 hover:border-base-content/20 bg-base-100'}"
                                    onclick={() => (selectedOutcomeId = outcome.id)}
                                >
                                    <span class="font-extrabold text-2xl {i === 0 ? 'text-primary' : 'text-secondary'}">{outcome.name}</span>
                                    {#if mode === 'BUY'}
                                        <div class="flex flex-col items-center">
                                            <span class="text-sm font-bold text-primary">{formatProbabilityPercent(currentPrices[i])}</span>
                                            <span class="text-[10px] opacity-60">{formatPricePerShare(currentPrices[i], 3)}</span>
                                        </div>
                                    {:else if mode === 'SELL' && pos}
                                        <span class="text-sm font-semibold badge badge-outline border-secondary text-secondary">
                                            {formatShares(pos.sharesOwned, { maximumFractionDigits: 2 })} held
                                        </span>
                                    {/if}
                                </button>
                            {/if}
                        {/each}
                    </div>
                {:else}
                    <div class="flex flex-col gap-3 mb-6">
                        {#each market.outcomes as outcome, i}
                            {@const pos = userPositions.find((p: UserPosition) => p.outcomeId === outcome.id)}
                            {#if mode === 'BUY' || (mode === 'SELL' && pos && pos.sharesOwned > 0)}
                                <label class="label cursor-pointer flex justify-start gap-4 p-4 bg-base-200 rounded-lg border-2 {selectedOutcomeId === outcome.id ? mode === 'BUY' ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary/10' : 'border-transparent hover:border-base-300'} transition-all">
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
                                            <div class="text-right">
                                                <span class="badge badge-primary badge-outline font-bold">
                                                    {formatProbabilityPercent(currentPrices[i])}
                                                </span>
                                                <div class="text-[10px] opacity-60 mt-1">{formatPricePerShare(currentPrices[i], 3)}</div>
                                            </div>
                                        {:else if mode === 'SELL' && pos}
                                            <span class="badge badge-outline">
                                                {formatShares(pos.sharesOwned, { maximumFractionDigits: 2 })} held
                                            </span>
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
                    <span class="label-text font-semibold text-sm opacity-80">{mode === 'BUY' ? 'UO to Spend' : 'Shares to Sell'}</span>
                    {#if mode === 'SELL' && selectedPosition}
                        <span class="label-text-alt opacity-70">
                            Max: {formatShares(selectedPosition.sharesOwned, { maximumFractionDigits: 2 })}
                        </span>
                    {/if}
                </label>
                <div class="join w-full">
                    {#if mode === 'BUY'}
                        <span class="join-item bg-base-300 flex items-center px-4 font-mono font-bold border border-base-content/20">UO</span>
                    {/if}
                    <input
                        id="amount"
                        type="number"
                        placeholder={mode === 'BUY' ? 'e.g. 50' : 'e.g. 25'}
                        class="input input-bordered input-lg w-full font-mono font-bold join-item {mode === 'SELL' ? 'focus:border-secondary' : ''}"
                        bind:value={amountStr}
                        min="0.01"
                        step="0.01"
                        max={mode === 'SELL' && selectedPosition ? selectedPosition.sharesOwned : undefined}
                    />
                    {#if mode === 'SELL'}
                        <span class="join-item bg-base-300 flex items-center px-4 font-mono font-bold border border-base-content/20">shares</span>
                    {/if}
                </div>
            </div>

            <div class="min-h-[3.5rem] mb-4 flex items-center justify-center bg-base-200/50 rounded-lg p-3 border border-base-300">
                {#if estimatedResult}
                    {#if mode === 'BUY'}
                        <div class="text-center text-sm leading-relaxed">
                            Est. Shares: <span class="font-bold text-success">+{formatShares(estimatedResult.shares, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <br />
                            <span class="opacity-60 text-xs">(Avg entry: {formatPricePerShare(estimatedResult.avgPrice, 3)})</span>
                        </div>
                    {:else}
                        <div class="text-center text-sm leading-relaxed">
                            Est. Refund: <span class="font-bold text-success">+{formatUO(estimatedResult.uo, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <br />
                            <span class="opacity-60 text-xs">(Avg exit: {formatPricePerShare(estimatedResult.avgPrice, 3)})</span>
                        </div>
                    {/if}
                {:else}
                    <span class="opacity-50 text-sm">Enter an amount to see estimate</span>
                {/if}
            </div>

            {#if isReviewing && estimatedResult}
                <div class="rounded-lg border border-base-300 bg-base-200/50 p-4 mb-4">
                    <h4 class="font-bold text-sm mb-2">Review your order</h4>
                    {#if mode === 'BUY'}
                        <p class="text-sm opacity-80">
                            You are buying <span class="font-bold">{formatShares(estimatedResult.shares, { maximumFractionDigits: 2 })}</span>
                            for <span class="font-bold">{formatUO(estimatedResult.uo, { maximumFractionDigits: 2 })}</span>.
                        </p>
                    {:else}
                        <p class="text-sm opacity-80">
                            You are selling <span class="font-bold">{formatShares(estimatedResult.shares, { maximumFractionDigits: 2 })}</span>
                            for an estimated <span class="font-bold">{formatUO(estimatedResult.uo, { maximumFractionDigits: 2 })}</span>.
                        </p>
                    {/if}
                    {#if projectedBalance !== null}
                        <p class="text-xs opacity-70 mt-2">
                            Balance: {formatUO(currentBalance, { maximumFractionDigits: 2 })} -> {formatUO(projectedBalance, { maximumFractionDigits: 2 })}
                        </p>
                    {/if}
                </div>

                <div class="flex gap-3">
                    <button class="btn btn-ghost flex-1" onclick={cancelReview} disabled={isProcessing}>
                        Edit
                    </button>
                    <button
                        class="btn {mode === 'BUY' ? 'btn-primary' : 'btn-secondary'} flex-1 font-bold"
                        onclick={handleTrade}
                        disabled={!canReview || isProcessing}
                    >
                        {#if isProcessing}
                            <span class="loading loading-spinner"></span>
                            Processing...
                        {:else}
                            {mode === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}
                        {/if}
                    </button>
                </div>
            {:else}
                <button
                    class="btn {mode === 'BUY' ? 'btn-primary' : 'btn-secondary'} btn-lg w-full font-bold shadow-md hover:shadow-lg transition-all"
                    onclick={beginReview}
                    disabled={!canReview}
                >
                    {#if market.status !== 'OPEN'}
                        Market is {market.status}
                    {:else if isProcessing}
                        <span class="loading loading-spinner"></span>
                        Processing...
                    {:else}
                        {mode === 'BUY' ? 'Confirm Purchase' : 'Confirm Sale'}
                    {/if}
                </button>
            {/if}
        {/if}
    </div>
</div>
