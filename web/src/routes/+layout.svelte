<script lang="ts">
    import '../app.css';
    import Navbar from '$lib/components/Navbar.svelte';

    // The data loaded by SvelteKit's layout.server
    let { data, children } = $props<{
        data: {
            user: {
                id: string;
                username: string;
                balance: number;
            }
        };
        children?: import('svelte').Snippet;
    }>();
</script>

<div class="min-h-screen bg-base-300">
    <Navbar userBalance={data.user.balance} userId={data.user.id} />
    <main class="container mx-auto py-8 px-4">
        {@render children()}
    </main>
</div>
