import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/base-url';

export const buildUpstreamUrl = (path: string, search?: string): string => {
  const query = search ? `?${search}` : '';
  return `${getApiBaseUrl()}${path}${query}`;
};

export const buildForwardHeaders = (request: NextRequest, includeContentType: boolean): Headers => {
  const headers = new Headers();
  const authorization = request.headers.get('authorization');

  if (authorization) {
    headers.set('authorization', authorization);
  }

  if (includeContentType) {
    headers.set('content-type', request.headers.get('content-type') || 'application/json');
  }

  return headers;
};

export const relayUpstreamResponse = async (upstream: Response): Promise<NextResponse> => {
  const responseHeaders = new Headers();
  const contentType = upstream.headers.get('content-type');

  if (contentType) {
    responseHeaders.set('content-type', contentType);
  }

  // Local debugging aid: expose which upstream URL the proxy actually called.
  // This avoids confusion when browser DevTools only shows localhost /api/proxy/chat.
  if (process.env.NODE_ENV !== 'production' && upstream.url) {
    responseHeaders.set('x-chat-proxy-upstream-url', upstream.url);
  }

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: responseHeaders,
  });
};

export const upstreamUnavailable = () =>
  NextResponse.json(
    {
      error: 'upstream_unavailable',
      message: 'Unable to reach the interview backend service.',
    },
    { status: 502 }
  );
