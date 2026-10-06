import type { APIRoute } from 'astro';
import { buildRss } from '../../views/rss';

export const GET: APIRoute = ({ site }) => buildRss('en', site);
