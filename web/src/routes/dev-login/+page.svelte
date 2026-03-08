<script lang="ts">
  let { data } = $props();

  const MOCK_USERS = [
    { id: 'admin_alice', username: 'Alice (Admin)' },
    { id: 'user_bob', username: 'Bob' },
    { id: 'user_charlie', username: 'Charlie' },
    { id: 'user_whale', username: 'Whale' }
  ];
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
  <div class="card w-96 bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-4">Dev Mock Login</h2>
      
      {#if data.user}
        <div class="alert alert-success shadow-lg mb-4">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Currently logged in as: <strong>{data.user.username}</strong></span>
          </div>
        </div>
        
        <form method="POST" action="?/logout">
          <button class="btn btn-error w-full">Logout</button>
        </form>
      {:else}
        <p class="mb-4">Select a mock user to log in as for testing.</p>
        
        <form method="POST" action="?/login" class="flex flex-col gap-4">
          {#each MOCK_USERS as user}
            <button class="btn btn-outline" name="login_data" value={JSON.stringify(user)}>
              Log in as {user.username}
            </button>
          {/each}
        </form>
      {/if}
      
      <div class="mt-4 pt-4 border-t border-base-300 text-sm text-center">
        <a href="/" class="link link-hover">Back to Home</a>
      </div>
    </div>
  </div>
</div>
