import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user: locals.user || { id: 'guest', username: 'Guest', balance: 0 }
    };
};

