import { NextRequest } from 'next/server';
import {
  buildForwardHeaders,
  buildUpstreamUrl,
  relayUpstreamResponse,
  upstreamUnavailable,
} from '@/app/api/proxy/chat/_shared';

export async function POST(request: NextRequest) {
  try {
    const upstream = await fetch(buildUpstreamUrl('/api/chat'), {
      method: 'POST',
      headers: buildForwardHeaders(request, true),
      body: await request.text(),
      cache: 'no-store',
    });

    return relayUpstreamResponse(upstream);
  } catch {
    return upstreamUnavailable();
  }
}
