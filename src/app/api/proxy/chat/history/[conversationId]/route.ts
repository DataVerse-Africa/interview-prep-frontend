import { NextRequest } from 'next/server';
import {
  buildForwardHeaders,
  buildUpstreamUrl,
  relayUpstreamResponse,
  upstreamUnavailable,
} from '@/app/api/proxy/chat/_shared';

type Params = { conversationId: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { conversationId } = await params;
    const normalizedConversationId = conversationId?.trim();
    if (
      !normalizedConversationId ||
      normalizedConversationId === 'undefined' ||
      normalizedConversationId === 'null'
    ) {
      return Response.json(
        {
          error: 'invalid_conversation_id',
          message: 'Conversation id is required.',
        },
        { status: 400 }
      );
    }
    const upstream = await fetch(
      buildUpstreamUrl(`/api/chat/history/${encodeURIComponent(normalizedConversationId)}`),
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
