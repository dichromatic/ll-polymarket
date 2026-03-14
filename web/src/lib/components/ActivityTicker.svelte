<script lang="ts">
    import { onMount } from 'svelte';

    type ActivityItem = {
        id: string;
        type: string;
        timestamp: number;
        message: string;
        link: string;
    };

    let activities = $state<ActivityItem[]>([]);
    let loading = $state(true);
    let prefersReducedMotion = $state(false);

    async function fetchActivity() {
        try {
            const activityUrl = new URL('/api/internal/activity', window.location.origin);
            const res = await fetch(activityUrl.toString());
            if (res.ok) {
                activities = await res.json();
            }
        } catch (e) {
            console.error('Failed to fetch activity ticker:', e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        const mediaQuery =
            typeof window.matchMedia === 'function'
                ? window.matchMedia('(prefers-reduced-motion: reduce)')
                : {
                    matches: false,
                    addEventListener: (..._args: any[]) => {},
                    removeEventListener: (..._args: any[]) => {}
                };
        prefersReducedMotion = mediaQuery.matches;

        const updateMotionPreference = (event: MediaQueryListEvent) => {
            prefersReducedMotion = event.matches;
        };

        mediaQuery.addEventListener('change', updateMotionPreference);

        fetchActivity();
        const interval = setInterval(fetchActivity, 15000); // Poll every 15s
        return () => {
            clearInterval(interval);
            mediaQuery.removeEventListener('change', updateMotionPreference);
        };
    });

    function formatTime(timestamp: number) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }
</script>

<div class="bg-base-200/50 border-y border-base-300 py-2 overflow-hidden flex items-center text-sm mb-6">
    <div class="px-4 font-bold text-primary whitespace-nowrap border-r border-base-300 mr-4">
        LIVE ACTIVITY
    </div>
    
    <div class="flex-1 overflow-hidden relative">
        {#if loading && activities.length === 0}
            <span class="opacity-50 animate-pulse">Loading activity...</span>
        {:else if activities.length > 0}
            {#if prefersReducedMotion}
                <div class="flex gap-6 overflow-x-auto whitespace-nowrap pr-4">
                    {#each activities as item (item.id)}
                        <a href={item.link} class="flex items-center gap-2 hover:text-primary transition-colors">
                            {#if item.type === 'TRADE'}
                                <span class="text-xs badge badge-ghost badge-sm">TRADE</span>
                            {:else if item.type === 'RESOLUTION'}
                                <span class="text-xs badge badge-success badge-sm">RESOLVED</span>
                            {:else}
                                <span class="text-xs badge badge-info badge-sm">NEW</span>
                            {/if}
                            <span>{item.message}</span>
                            <span class="opacity-50 text-xs ml-1">{formatTime(item.timestamp)}</span>
                        </a>
                    {/each}
                </div>
            {:else}
                <!-- Marquee container -->
                <div class="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused] gap-8">
                    {#each activities as item (item.id)}
                        <a href={item.link} class="flex items-center gap-2 hover:text-primary transition-colors">
                            {#if item.type === 'TRADE'}
                                <span class="text-xs badge badge-ghost badge-sm">TRADE</span>
                            {:else if item.type === 'RESOLUTION'}
                                <span class="text-xs badge badge-success badge-sm">RESOLVED</span>
                            {:else}
                                <span class="text-xs badge badge-info badge-sm">NEW</span>
                            {/if}
                            <span>{item.message}</span>
                            <span class="opacity-50 text-xs ml-1">{formatTime(item.timestamp)}</span>
                        </a>
                    {/each}

                    <!-- Duplicate for seamless loop -->
                    {#each activities as item (item.id + '-dup')}
                        <a href={item.link} class="flex items-center gap-2 hover:text-primary transition-colors">
                            {#if item.type === 'TRADE'}
                                <span class="text-xs badge badge-ghost badge-sm">TRADE</span>
                            {:else if item.type === 'RESOLUTION'}
                                <span class="text-xs badge badge-success badge-sm">RESOLVED</span>
                            {:else}
                                <span class="text-xs badge badge-info badge-sm">NEW</span>
                            {/if}
                            <span>{item.message}</span>
                            <span class="opacity-50 text-xs ml-1">{formatTime(item.timestamp)}</span>
                        </a>
                    {/each}
                </div>
            {/if}
        {:else}
            <span class="opacity-50">No recent activity.</span>
        {/if}
    </div>
</div>

<style>
    @keyframes marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
    }
</style>
