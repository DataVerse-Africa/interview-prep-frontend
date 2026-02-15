import { NextRequest } from 'next/server';
import {
  buildForwardHeaders,
  buildUpstreamUrl,
  relayUpstreamResponse,
  upstreamUnavailable,
} from '@/app/api/proxy/chat/_shared';

export async function GET(request: NextRequest) {
  try {
    const upstream = await fetch(
      buildUpstreamUrl('/api/chat/history', request.nextUrl.searchParams.toString()),
      {
        method: 'GET',
        headers: buildForwardHeaders(request, false),
        cache: 'no-store',
      }
    );

    return relayUpstreamResponse(upstream);
  } catch {
    return upstreamUnavailable();
  }
}
