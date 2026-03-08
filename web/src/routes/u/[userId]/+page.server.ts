import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublicProfile } from '$lib/server/profile';

export const load: PageServerLoad = async ({ params }) => {
    const profile = await getPublicProfile(params.userId);

    if (!profile) {
        throw error(404, 'User not found');
    }

    return {
        profile
    };
};
