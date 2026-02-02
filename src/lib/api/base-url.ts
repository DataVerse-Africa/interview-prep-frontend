const DEFAULT_API_URL = 'https://interview-prep-api.dataverseafrica.org';

const normalizeBaseUrl = (value: string): string => {
  let normalized = value.trim();

  if (!normalized) return DEFAULT_API_URL;

  if (normalized.startsWith('//')) {
    normalized = `https:${normalized}`;
  } else if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, '');
  return normalized || DEFAULT_API_URL;
};

export const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw || raw.trim().length === 0) {
    if (typeof window !== 'undefined') {
      console.warn('NEXT_PUBLIC_API_URL is not set; falling back to default production API URL.');
    }
    return DEFAULT_API_URL;
  }

  return normalizeBaseUrl(raw);
};

export const getWebSocketBaseUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/^http(s)?/, 'ws$1');
};
