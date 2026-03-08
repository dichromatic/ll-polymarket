import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ locals }) => {
  if (!dev) {
    throw redirect(302, '/');
  }
  return {
    user: locals.user
  };
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    if (!dev) return {};
    const data = await request.formData();
    const loginDataStr = data.get('login_data')?.toString();
    
    if (loginDataStr) {
      try {
        const { id, username } = JSON.parse(loginDataStr);
        cookies.set('mock_user_id', id, { path: '/', httpOnly: true, secure: false, maxAge: 60 * 60 * 24 });
        cookies.set('mock_username', username, { path: '/', httpOnly: true, secure: false, maxAge: 60 * 60 * 24 });
      } catch (e) {
        // ignore
      }
    }

    throw redirect(303, '/');
  },
  logout: async ({ cookies }) => {
    if (!dev) return {};
    cookies.delete('mock_user_id', { path: '/' });
    cookies.delete('mock_username', { path: '/' });
    throw redirect(303, '/');
  }
};
