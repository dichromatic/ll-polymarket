<script lang="ts">
    export let userBalance: number = 0;
</script>

<div class="navbar bg-base-100 shadow-sm px-4 md:px-8 border-b border-base-200">
    <div class="flex-1">
        <a href="/" class="btn btn-ghost normal-case text-xl font-bold tracking-tight">
            <span class="text-primary">Poly</span>market V2
        </a>
    </div>
    
    <div class="flex-none gap-4">
        <div class="hidden sm:flex items-center gap-2 font-mono bg-base-200 py-1 px-3 rounded-md">
            <span class="text-accent">Pts:</span>
            <span class="font-bold">{userBalance.toLocaleString()}</span>
        </div>
        
        <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
                <div class="w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span class="text-primary font-bold">U</span>
                </div>
            </div>
            <ul tabindex="-1" role="menu" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li><a href="/portfolio">Portfolio</a></li>
                <li><a href="/settings">Settings</a></li>
            </ul>
        </div>
    </div>
</div>
