/**
 * HTTP API Framework
 * Provides a reusable, type-safe HTTP client for MFE communication
 */

import { getGlobalEventBus } from './event-bus';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: number;
  signal?: AbortSignal;
}

export interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  ok: boolean;
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

class HttpApi {
  private baseUrl: string = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  private defaultTimeout = 30000;
  private defaultRetry = 3;
  private eventBus = getGlobalEventBus();

  constructor(baseUrl?: string, defaultHeaders?: Record<string, string>) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
    if (defaultHeaders) {
      this.defaultHeaders = { ...this.defaultHeaders, ...defaultHeaders };
    }
  }

  /**
   * Set base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Add header
   */
  addHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remove header
   */
  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = this._resolveUrl(url);
    const opts = this._mergeOptions(options);

    try {
      this.eventBus.emit('api:request:start', { url: fullUrl, method: opts.method });

      const response = await this._performRequest(fullUrl, opts);
      const data = await this._parseResponse<T>(response);

      const apiResponse: ApiResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: this._headersToObject(response.headers),
        ok: response.ok,
      };

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiError;
        error.status = response.status;
        error.statusText = response.statusText;
        error.response = response;
        this.eventBus.emit('api:request:error', { url: fullUrl, error });
        throw error;
      }

      this.eventBus.emit('api:request:success', { url: fullUrl, status: response.status });
      return apiResponse;
    } catch (error) {
      this.eventBus.emit('api:request:failed', {
        url: fullUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Perform request with retry logic
   */
  private async _performRequest(
    url: string,
    options: Required<ApiRequestOptions>,
    attempt = 1
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout);

      try {
        const response = await fetch(url, {
          method: options.method,
          headers: options.headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: options.signal || controller.signal,
        });

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (attempt < options.retry) {
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._performRequest(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Parse response based on content type
   */
  private async _parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (!response.body) {
      return undefined as any;
    }

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    if (contentType?.includes('text')) {
      return response.text() as any;
    }

    return response.blob() as any;
  }

  /**
   * Resolve full URL
   */
  private _resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (this.baseUrl) {
      return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    return url;
  }

  /**
   * Merge options with defaults
   */
  private _mergeOptions(options: ApiRequestOptions): Required<ApiRequestOptions> {
    return {
      method: options.method || 'GET',
      headers: { ...this.defaultHeaders, ...options.headers },
      body: options.body,
      timeout: options.timeout || this.defaultTimeout,
      retry: options.retry ?? this.defaultRetry,
      signal: options.signal as any,
    };
  }

  /**
   * Convert Headers to object
   */
  private _headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}

let globalHttpApi: HttpApi | null = null;

export const createHttpApi = (
  baseUrl?: string,
  defaultHeaders?: Record<string, string>
): HttpApi => {
  return new HttpApi(baseUrl, defaultHeaders);
};

export const getGlobalHttpApi = (
  baseUrl?: string,
  defaultHeaders?: Record<string, string>
): HttpApi => {
  if (!globalHttpApi) {
    globalHttpApi = new HttpApi(baseUrl, defaultHeaders);
  }
  return globalHttpApi;
};

export { HttpApi };
