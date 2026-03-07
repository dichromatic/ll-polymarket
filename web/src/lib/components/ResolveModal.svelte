<script lang="ts">
    export let isOpen: boolean = false;
    export let market: {
        id: string;
        question: string;
        template: string;
        outcomes: Array<{
            id: string;
            name: string;
        }>;
    };
    
    export let onClose: () => void = () => {};
    export let onResolve: (winningIds: string[]) => void = () => {};

    // Track selected winners in a Set or Array. Since it's multi-winner capable, an array of checked IDs works best.
    let selectedOutcomeIds: string[] = [];

    function close() {
        onClose();
        selectedOutcomeIds = []; // clear state on close
    }

    function resolve() {
        onResolve(selectedOutcomeIds);
    }
    
    // Helper to toggle IDs in Svelte since bind:group checks on arrays are tricky with dynamic lists sometimes
    function toggleSelection(id: string) {
        if (selectedOutcomeIds.includes(id)) {
            selectedOutcomeIds = selectedOutcomeIds.filter(i => i !== id);
        } else {
            selectedOutcomeIds = [...selectedOutcomeIds, id];
        }
    }
</script>

<dialog class="modal modal-bottom sm:modal-middle {isOpen ? 'modal-open' : ''}">
    <div class="modal-box border-2 border-error/50">
        {#if market}
            <h3 class="font-bold text-lg mb-2 text-error">Resolve Market: {market.question}</h3>
            
            <div class="alert alert-warning shadow-sm mb-4 text-sm p-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>Warning: Resolving a market is final and distributes payouts. Check all winning outcomes below.</span>
            </div>
            
            <div class="form-control mb-6">
                <div class="flex flex-col gap-2">
                    {#each market.outcomes as outcome}
                        <label class="label cursor-pointer flex justify-start gap-4 p-3 bg-base-200 rounded-lg border border-base-300 hover:border-error">
                            <input 
                                type="checkbox" 
                                class="checkbox checkbox-error" 
                                checked={selectedOutcomeIds.includes(outcome.id)}
                                on:change={() => toggleSelection(outcome.id)}
                            />
                            <span class="label-text font-semibold">{outcome.name}</span>
                        </label>
                    {/each}
                </div>
            </div>

            <div class="modal-action">
                <button class="btn btn-ghost" on:click={close}>Cancel</button>
                <button 
                    class="btn btn-error" 
                    on:click={resolve}
                    disabled={selectedOutcomeIds.length === 0}
                >
                    Confirm Resolution
                </button>
            </div>
        {/if}
    </div>
</dialog>
