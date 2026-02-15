import { NextRequest, NextResponse } from 'next/server';
import {
  buildForwardHeaders,
  buildUpstreamUrl,
  relayUpstreamResponse,
  upstreamUnavailable,
} from '@/app/api/proxy/chat/_shared';

const CHAT_PROXY_TIMEOUT_MS = 55_000;

export async function POST(request: NextRequest) {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), CHAT_PROXY_TIMEOUT_MS);

  try {
    const upstream = await fetch(buildUpstreamUrl('/api/chat'), {
      method: 'POST',
      headers: buildForwardHeaders(request, true),
      body: await request.text(),
      cache: 'no-store',
      signal: abortController.signal,
    });

    return relayUpstreamResponse(upstream);
  } catch (error: unknown) {
    if ((error as Error)?.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'gateway_timeout',
          message: 'Chat request timed out at proxy. Please retry.',
        },
        { status: 504 }
      );
    }
    return upstreamUnavailable();
  } finally {
    clearTimeout(timeout);
  }
}
