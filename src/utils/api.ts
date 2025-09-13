const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'https://ka-eco.onrender.com';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  message?: string;
}

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<TokenResponse> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get tokens from localStorage on initialization
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string | null, refreshToken?: string | null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || this.refreshToken;

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    } else {
      localStorage.removeItem('access_token');
    }

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<TokenResponse> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.request<TokenResponse>('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.refreshToken}`,
      },
    }).then(response => {
      if (response.data) {
        this.setTokens(response.data.access_token, response.data.refresh_token);
        return response.data;
      }
      throw new Error('Failed to refresh token');
    }).finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      };

      const response = await fetch(url, config);

      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        data = { message: text };
      }

      if (response.status === 401 && this.refreshToken && retryCount === 0) {
        // Try to refresh token and retry the request
        try {
          await this.refreshAccessToken();
          return this.request<T>(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          // Refresh failed, clear tokens and return error
          this.clearTokens();
          return { error: 'Session expired. Please log in again.' };
        }
      }

      if (!response.ok) {
        // Handle error responses more gracefully
        const errorMessage = data?.detail || data?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<ApiResponse<TokenResponse>> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    // For FormData, we need to make a direct request without the default JSON headers
    try {
      const url = `${this.baseURL}/auth/token`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
          const errorMessage = data?.detail || data?.message || `HTTP error! status: ${response.status}`;
          return { error: errorMessage, message: data?.message };
      }

      // If login successful, store tokens
      if (data) {
        this.setTokens(data.access_token, data.refresh_token);
      }

        return { data, message: data?.message };
    } catch (error) {
      console.error('Login request failed:', error);
      return { error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  async register(userData: {username: string, email: string, password: string, role?: string, full_name?: string, organization?: string, phone?: string}): Promise<ApiResponse<any>> {
    // Validate role before sending
    const validRoles = ['researcher', 'government_official', 'community_member'];
    const role = userData.role && validRoles.includes(userData.role) ? userData.role : 'researcher';
    
    const sanitizedData = {
      ...userData,
      role,
      // Ensure empty strings are converted to null for optional fields
      full_name: userData.full_name?.trim() || null,
      organization: userData.organization?.trim() || null,
      phone: userData.phone?.trim() || null
    };

      try {
        const url = `${this.baseURL}/auth/register`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sanitizedData),
        });
        const data = await response.json();
        if (!response.ok) {
          const errorMessage = data?.detail || data?.message || `HTTP error! status: ${response.status}`;
          return { error: errorMessage, message: data?.message };
        }
        return { data, message: data?.message };
      } catch (error) {
        console.error('Registration request failed:', error);
        return { error: error instanceof Error ? error.message : 'Registration failed' };
      }
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/auth/users/me');
  }

  async getUsersCount(): Promise<ApiResponse<{total_users: number, active_users: number}>> {
    return this.request('/auth/users/count');
  }

  async getUsersStats(): Promise<ApiResponse<any>> {
    return this.request('/auth/users/stats');
  }

  async searchUsers(query: string, limit?: number): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    return this.request(`/auth/users/search?${params.toString()}`);
  }

  async getUsers(search?: string, role?: string, skip?: number, limit?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (skip !== undefined) params.append('skip', skip.toString());
    if (limit !== undefined) params.append('limit', limit.toString());

    return this.request(`/auth/users?${params.toString()}`);
  }

  // Wetlands endpoints
  async getWetlands(skip?: number, limit?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append('skip', skip.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    
    return this.request(`/wetlands?${params.toString()}`);
  }

  async createWetland(wetlandData: any): Promise<ApiResponse<any>> {
    return this.request('/wetlands', {
      method: 'POST',
      body: JSON.stringify(wetlandData),
    });
  }

  async updateWetland(id: number, wetlandData: any): Promise<ApiResponse<any>> {
    return this.request(`/wetlands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(wetlandData),
    });
  }

  async deleteWetland(id: number): Promise<ApiResponse<any>> {
    return this.request(`/wetlands/${id}`, {
      method: 'DELETE',
    });
  }

  // Observations endpoints
  async getObservations(skip?: number, limit?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append('skip', skip.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    
    return this.request(`/observations?${params.toString()}`);
  }

  async createObservation(observationData: any): Promise<ApiResponse<any>> {
    return this.request('/observations', {
      method: 'POST',
      body: JSON.stringify(observationData),
    });
  }

  async updateObservation(id: number, observationData: any): Promise<ApiResponse<any>> {
    return this.request(`/observations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(observationData),
    });
  }

  async deleteObservation(id: number): Promise<ApiResponse<any>> {
    return this.request(`/observations/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard endpoints
  async getSensorData(wetlandId?: number): Promise<ApiResponse<any[]>> {
    const endpoint = wetlandId 
      ? `/dashboard/sensor-data/${wetlandId}`
      : '/dashboard/sensor-data';
    return this.request(endpoint);
  }

  async createSensorData(sensorData: any): Promise<ApiResponse<any>> {
    return this.request('/dashboard/sensor-data', {
      method: 'POST',
      body: JSON.stringify(sensorData),
    });
  }

  async getObservationsChart(): Promise<ApiResponse<any[]>> {
    return this.request('/dashboard/observations-chart');
  }

  async getSensorAverages(wetlandId: number): Promise<ApiResponse<any>> {
    return this.request(`/dashboard/sensor-averages/${wetlandId}`);
  }

  // Sensor endpoints
  async getSensors(): Promise<ApiResponse<any[]>> {
    return this.request('/sensors');
  }

  async createSensor(sensorData: any): Promise<ApiResponse<any>> {
    return this.request('/sensors', {
      method: 'POST',
      body: JSON.stringify(sensorData),
    });
  }

  async updateSensor(sensorId: string, sensorData: any): Promise<ApiResponse<any>> {
    return this.request(`/sensors/${sensorId}`, {
      method: 'PUT',
      body: JSON.stringify(sensorData),
    });
  }

  async deleteSensor(sensorId: string): Promise<ApiResponse<any>> {
    return this.request(`/sensors/${sensorId}`, {
      method: 'DELETE',
    });
  }

  async getSensorsByWetland(wetlandId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/sensors/wetland/${wetlandId}`);
  }

  async ingestSensorData(sensorData: any): Promise<ApiResponse<any>> {
    return this.request('/sensors/data', {
      method: 'POST',
      body: JSON.stringify(sensorData),
    });
  }

  async sensorHeartbeat(sensorId: string): Promise<ApiResponse<any>> {
    return this.request(`/sensors/${sensorId}/heartbeat`, {
      method: 'POST',
    });
  }

  async getSensorStatus(sensorId: string): Promise<ApiResponse<any>> {
    return this.request(`/sensors/status/${sensorId}`);
  }

  async getSensorAlerts(): Promise<ApiResponse<any>> {
    return this.request('/sensors/alerts');
  }

  async updateSensorConfig(sensorId: string, config: any): Promise<ApiResponse<any>> {
    return this.request(`/sensors/${sensorId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async ingestBulkSensorData(sensorDataList: any[]): Promise<ApiResponse<any>> {
    return this.request('/sensors/bulk-data', {
      method: 'POST',
      body: JSON.stringify(sensorDataList),
    });
  }

  async logout(): Promise<ApiResponse<any>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;
