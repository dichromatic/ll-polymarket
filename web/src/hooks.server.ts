import { type Handle } from '@sveltejs/kit';
import { getOrCreateMockUser } from '$lib/server/auth';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
  if (dev) {
    const mockUserId = event.cookies.get('mock_user_id');
    const mockUsername = event.cookies.get('mock_username');

    if (mockUserId && mockUsername) {
      const user = await getOrCreateMockUser(mockUserId, mockUsername);
      event.locals.user = user;
    } else {
      event.locals.user = null;
    }
  } else {
    // In production, this is where actual OAuth logic would hook in
    event.locals.user = null;
  }

  return resolve(event);
};
