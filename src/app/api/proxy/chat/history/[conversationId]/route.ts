import { NextRequest } from 'next/server';
import {
  buildForwardHeaders,
  buildUpstreamUrl,
  relayUpstreamResponse,
  upstreamUnavailable,
} from '@/app/api/proxy/chat/_shared';

type Params = { conversationId: string };

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { conversationId } = params;
    const upstream = await fetch(
      buildUpstreamUrl(`/api/chat/history/${encodeURIComponent(conversationId)}`),
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
