import { json } from '@sveltejs/kit';
import { getGlobalActivity } from '$lib/server/activity';

export async function GET() {
    try {
        const activity = await getGlobalActivity();
        return json(activity);
    } catch (e: any) {
        return json({ error: 'Failed to fetch activity' }, { status: 500 });
    }
}
