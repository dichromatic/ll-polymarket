<script lang="ts">
    export let isOpen: boolean = false;
    export let market: {
        id: string;
        question: string;
        liquidity_b: number;
        outcomes: Array<{
            id: string;
            name: string;
            sharesOutstanding: number;
        }>;
    };
    
    export let onClose: () => void = () => {};
    export let onTrade: (tradeData: { outcomeId: string, amount: number }) => void = () => {};

    let selectedOutcomeId: string = '';
    let amountStr: string = '';

    function close() {
        onClose();
    }

    function trade() {
        onTrade({
            outcomeId: selectedOutcomeId,
            amount: parseFloat(amountStr) || 0
        });
    }
</script>

<!-- Only show modal UI if isOpen is true, else hide via class -->
<dialog class="modal modal-bottom sm:modal-middle {isOpen ? 'modal-open' : ''}">
    <div class="modal-box">
        {#if market}
            <h3 class="font-bold text-lg mb-2">Trade: {market.question}</h3>
            
            <div class="form-control mb-4">
                <label class="label">
                    <span class="label-text">Select Outcome</span>
                </label>
                <div class="flex flex-col gap-2">
                    {#each market.outcomes as outcome}
                        <label class="label cursor-pointer flex justify-start gap-4 p-3 bg-base-200 rounded-lg border border-base-300 hover:border-primary">
                            <input 
                                type="radio" 
                                name="outcome-radio" 
                                class="radio radio-primary" 
                                value={outcome.id} 
                                bind:group={selectedOutcomeId}
                                aria-label={outcome.name}
                            />
                            <span class="label-text font-semibold">{outcome.name}</span>
                        </label>
                    {/each}
                </div>
            </div>

            <div class="form-control mb-6">
                <label class="label">
                    <span class="label-text">Points to spend</span>
                </label>
                <input 
                    type="number" 
                    placeholder="e.g. 50" 
                    class="input input-bordered w-full" 
                    bind:value={amountStr}
                    min="1"
                />
            </div>

            <div class="modal-action">
                <button class="btn btn-ghost" on:click={close}>Cancel</button>
                <button 
                    class="btn btn-primary" 
                    on:click={trade}
                    disabled={!selectedOutcomeId || !amountStr || parseFloat(amountStr) <= 0}
                >
                    Confirm Trade
                </button>
            </div>
        {/if}
    </div>
</dialog>
