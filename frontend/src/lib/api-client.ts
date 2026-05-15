// API Client to replace Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadTokens();
  }

  private hasStorage() {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  private loadTokens() {
    if (!this.hasStorage()) return;
    this.token = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
    
    // Ensure cookie is set for server functions if token exists
    if (this.token && !document.cookie.includes("ps_token")) {
      document.cookie = `ps_token=${this.token}; path=/; max-age=2592000; SameSite=Lax`;
    }
  }

  private saveTokens(accessToken: string, refreshToken?: string) {
    this.token = accessToken;
    if (!this.hasStorage()) return;
    localStorage.setItem("accessToken", accessToken);
    
    // Set cookie for Server Functions (Cloudflare)
    document.cookie = `ps_token=${accessToken}; path=/; max-age=2592000; SameSite=Lax`;
    
    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem("refreshToken", refreshToken);
    }
  }

  private clearTokens() {
    this.token = null;
    this.refreshToken = null;
    if (!this.hasStorage()) return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    
    // Clear cookie
    document.cookie = "ps_token=; path=/; max-age=0";
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.refreshToken && endpoint !== '/auth/refresh') {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request with new token
          return this.request(endpoint, options);
        } else {
          this.clearTokens();
          throw new Error('Session expired. Please sign in again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Auth methods
  async signup(email: string, password: string, displayName: string) {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    return response;
  }

  async verifyOTP(email: string, otp: string) {
    const response = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });

    if (response.success && response.data) {
      this.saveTokens(response.data.accessToken, response.data.refreshToken);
      if (this.hasStorage()) localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  }

  async resendOTP(email: string) {
    return await this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async signin(email: string, password: string) {
    const response = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      this.saveTokens(response.data.accessToken, response.data.refreshToken);
      if (this.hasStorage()) localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  }

  async googleSignIn(tokens: { idToken?: string; accessToken?: string }) {
    const response = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(tokens),
    });

    if (response.success && response.data) {
      this.saveTokens(response.data.accessToken, response.data.refreshToken);
      if (this.hasStorage()) localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  }

  async signout() {
    try {
      await this.request('/auth/signout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } finally {
      this.clearTokens();
    }
  }

  async forgotPassword(email: string) {
    return await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async getMe() {
    const response = await this.request('/auth/me');
    if (response.success && response.data) {
      if (this.hasStorage()) localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response;
  }

  async refreshAccessToken() {
    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.success && response.data) {
        this.saveTokens(response.data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Helper to get current user from localStorage
  getCurrentUser() {
    if (!this.hasStorage()) return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.getCurrentUser();
  }

  // Notification methods
  async getNotifications() {
    return this.get('/app/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.patch(`/app/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.post('/app/notifications/mark-all-read');
  }

  async deleteNotification(id: string) {
    return this.delete(`/app/notifications/${id}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_URL);

export default apiClient;
