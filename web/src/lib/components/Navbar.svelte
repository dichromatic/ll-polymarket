<script lang="ts">
    import { goto } from '$app/navigation';
    import { formatUO } from '$lib/utils/format';

    export let userBalance: number = 0;
    export let userId: string = '';

    let searchQuery = '';

    function handleSearch(e: Event) {
        e.preventDefault();
        if (searchQuery.trim()) {
            goto(`/search?q=${encodeURIComponent(searchQuery)}`);
            searchQuery = '';
        }
    }
</script>

<div class="navbar bg-base-100 shadow-sm px-4 md:px-8 border-b border-base-200 h-16">
    <div class="flex-1">
        <a href="/" class="btn btn-ghost normal-case text-xl font-bold tracking-tight px-2">
            <span class="text-primary">event</span>market
        </a>
    </div>

    <div class="flex-none flex items-center gap-2 md:gap-4">
        <div class="hidden lg:flex items-center gap-1">
            <a href="/leaderboard" class="btn btn-ghost btn-sm">Leaderboard</a>
            <a href="/search" class="btn btn-ghost btn-sm">Markets</a>
        </div>

        <a
            href="/search"
            class="md:hidden btn btn-ghost btn-circle"
            aria-label="Search markets"
            title="Search markets"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </a>

        <a
            href="/leaderboard"
            class="md:hidden btn btn-ghost btn-circle"
            aria-label="Leaderboard"
            title="Leaderboard"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V5m-4 6V3m-4 8V7m-2 12h16a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </a>

        <form on:submit={handleSearch} class="hidden md:flex relative w-48 lg:w-64">
            <input
                type="text"
                placeholder="Search markets..."
                class="input input-bordered input-sm w-full pl-9 bg-base-200 rounded-full"
                bind:value={searchQuery}
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </form>

        <div class="hidden sm:flex items-center gap-2 font-mono bg-base-200 py-1 px-3 rounded-full text-sm border border-base-300">
            <span class="text-accent font-semibold">Balance:</span>
            <span class="font-bold">{formatUO(userBalance, { maximumFractionDigits: 0 })}</span>
        </div>

        <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar bg-base-200 border border-base-300">
                <div class="w-10 rounded-full flex items-center justify-center">
                    <span class="text-primary font-bold">
                        {userId && userId !== 'guest' ? userId.charAt(0).toUpperCase() : 'U'}
                    </span>
                </div>
            </div>
            <ul tabindex="-1" role="menu" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-200">
                {#if userId && userId !== 'guest'}
                    <li class="menu-title px-4 py-2 opacity-50 text-xs">Logged in as {userId}</li>
                    <div class="divider my-0"></div>
                {/if}
                <li><a href="/portfolio">Portfolio</a></li>
                {#if userId && userId !== 'guest'}
                    <li><a href="/u/{userId}">Public Profile</a></li>
                {/if}
                <li class="lg:hidden"><a href="/leaderboard">Leaderboard</a></li>
                <li class="lg:hidden"><a href="/search">Search Markets</a></li>
                <div class="divider my-0"></div>
                <li><a href="/dev-login" class="text-error">Switch User (Dev)</a></li>
            </ul>
        </div>
    </div>
</div>
