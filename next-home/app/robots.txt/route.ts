import { discoveryResponse } from '../../lib/discovery-response';
export const dynamic = 'force-dynamic';
export function GET() { return discoveryResponse('robots.txt'); }
