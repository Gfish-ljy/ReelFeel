const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccess(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
      if (json.code === 200 && json.data) {
        this.setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      }
    } catch {
      /* ignore */
    }
    this.clearTokens();
    return false;
  }

  async request<T>(
    path: string,
    options: RequestInit = {},
    retry = true
  ): Promise<ApiResponse<T>> {
    return this.fetchWithAuth(path, options, retry);
  }

  private async fetchWithAuth<T>(
    path: string,
    options: RequestInit = {},
    retry = true
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch {
      throw new Error(
        '无法连接后端 API。请确认已启动：npm run dev:backend，且 PostgreSQL 已运行（docker compose up -d postgres）'
      );
    }

    if (res.status === 401 && retry) {
      const ok = await this.refreshAccess();
      if (ok) return this.fetchWithAuth<T>(path, options, false);
    }

    let json: ApiResponse<T>;
    try {
      json = await res.json();
    } catch {
      throw new Error(`服务器响应异常 (HTTP ${res.status})`);
    }

    if (!res.ok || json.code >= 400) {
      throw new Error(json.message || `请求失败 (HTTP ${res.status})`);
    }
    return json;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  upload<T>(path: string, formData: FormData) {
    return this.request<T>(path, { method: 'POST', body: formData });
  }
}

export const api = new ApiClient();
