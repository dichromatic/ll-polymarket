<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

    let { currentFilters = { q: '', tier: null, template: null } } = $props<{
        currentFilters?: {
            q: string;
            tier: string | null;
            template: string | null;
        }
    }>();

    let searchQuery = $state(currentFilters?.q || '');
    let selectedTier = $state(currentFilters?.tier || '');
    let selectedTemplate = $state(currentFilters?.template || '');

    // Sync state when props change
    $effect(() => {
        searchQuery = currentFilters?.q || '';
        selectedTier = currentFilters?.tier || '';
        selectedTemplate = currentFilters?.template || '';
    });

    function updateFilters() {
        const url = new URL(page.url);
        
        if (searchQuery) url.searchParams.set('q', searchQuery);
        else url.searchParams.delete('q');

        if (selectedTier) url.searchParams.set('tier', selectedTier);
        else url.searchParams.delete('tier');

        if (selectedTemplate) url.searchParams.set('template', selectedTemplate);
        else url.searchParams.delete('template');

        goto(url.toString(), { keepFocus: true, noScroll: true });
    }

    function clearFilters() {
        searchQuery = '';
        selectedTier = '';
        selectedTemplate = '';
        updateFilters();
    }
</script>

<div class="bg-base-200 p-3 rounded-lg shadow-inner mb-6 flex flex-col sm:flex-row gap-3 items-center border border-base-300 w-full">
    <div class="flex-1 w-full relative">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input 
            type="text" 
            placeholder="Search markets..." 
            class="input input-sm input-bordered w-full pl-9 bg-base-100 h-10" 
            bind:value={searchQuery}
            oninput={updateFilters}
        />
    </div>
    
    <div class="flex gap-2 w-full sm:w-auto h-10">
        <select 
            class="select select-sm select-bordered bg-base-100 flex-1 sm:flex-none text-sm w-36 h-full" 
            bind:value={selectedTier}
            onchange={updateFilters}
        >
            <option value="">All Tiers</option>
            <option value="MAIN_BOARD">Main Board</option>
            <option value="SANDBOX">Sandbox</option>
        </select>

        <select 
            class="select select-sm select-bordered bg-base-100 flex-1 sm:flex-none text-sm w-40 h-full" 
            bind:value={selectedTemplate}
            onchange={updateFilters}
        >
            <option value="">All Types</option>
            <option value="BINARY">Binary (Yes/No)</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="NUMERIC_BUCKET">Numeric</option>
            <option value="MULTI_WINNER">Multi-Winner</option>
        </select>
        
        {#if searchQuery || selectedTier || selectedTemplate}
            <button class="btn btn-sm btn-ghost btn-square h-full" onclick={clearFilters} title="Clear Filters">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        {/if}
    </div>
</div>
