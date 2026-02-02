const DEFAULT_LOCAL_API_URL = 'http://localhost:10000';

const normalizeBaseUrl = (value: string): string => {
  let normalized = value.trim();

  if (!normalized) return DEFAULT_LOCAL_API_URL;

  if (normalized.startsWith('//')) {
    normalized = `https:${normalized}`;
  } else if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, '');
  return normalized || DEFAULT_LOCAL_API_URL;
};

export const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw || raw.trim().length === 0) {
    if (typeof window !== 'undefined') {
      console.warn('NEXT_PUBLIC_API_URL is not set; falling back to local API URL.');
    }
    return DEFAULT_LOCAL_API_URL;
  }

  return normalizeBaseUrl(raw);
};

export const getWebSocketBaseUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/^http(s)?/, 'ws$1');
};
