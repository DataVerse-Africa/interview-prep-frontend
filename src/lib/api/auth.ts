import { apiClient } from './client';

export interface AuthPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: {
    user_id: string;
    email: string;
    created_at: string;
  };
}

export const authApi = {
  signup: async (payload: AuthPayload): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/api/auth/signup', payload);
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    return response;
  },

  login: async (payload: AuthPayload): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/api/auth/login', payload);
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    return response;
  },

  logout: () => {
    apiClient.setToken(null);
  },

  getCurrentUser: () => {
    const token = apiClient.getToken();
    if (!token) return null;
    // Decode token to get user info (simplified - in production use proper JWT decoding)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  },
};


