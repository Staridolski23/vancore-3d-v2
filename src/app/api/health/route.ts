import { backendResponse } from '@/lib/backend';
export const dynamic = 'force-dynamic';
export async function GET() { return backendResponse('/api/health'); }
