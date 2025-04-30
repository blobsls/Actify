/**
 * Actify Public API Client
 * Handles all API communication with Actify services
 * @version 1.0.0
 */

class ActifyAPI {
  constructor(config = {}) {
    // Configuration defaults
    this.config = {
      baseURL: 'https://secret.actify.dev/public/freemium/v2',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...config
    };

    // Authentication state
    this.authToken = null;
    this.refreshToken = null;
  }

  /**
   * Set authentication tokens
   * @param {string} authToken - JWT access token
   * @param {string} refreshToken - Refresh token
   */
  setAuthTokens(authToken, refreshToken) {
    this.authToken = authToken;
    this.refreshToken = refreshToken;
    return this;
  }

  /**
   * Clear authentication tokens
   */
  clearAuth() {
    this.authToken = null;
    this.refreshToken = null;
    return this;
  }

  /**
   * Make a request to the API
   * @private
   */
  async _request(method, endpoint, data = null, params = {}) {
    // Build request URL
    const url = new URL(endpoint, this.config.baseURL);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    // Prepare headers
    const headers = new Headers(this.config.headers);
    if (this.authToken) {
      headers.append('Authorization', `Bearer ${this.authToken}`);
    }

    // Prepare request options
    const options = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };

    // Add body for non-GET requests
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new ActifyAPIError(
          responseData.message || 'API request failed',
          response.status,
          responseData.errors
        );
      }

      return responseData;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ActifyAPIError('Request timeout', 408);
      }
      throw error;
    }
  }

  // Authentication API Methods

  /**
   * Login with email and password
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    const response = await this._request('POST', '/auth/login', {
      email,
      password
    });
    
    this.setAuthTokens(response.access_token, response.refresh_token);
    return response;
  }

  /**
   * Refresh access token
   */
  async refresh() {
    if (!this.refreshToken) {
      throw new ActifyAPIError('No refresh token available', 401);
    }

    const response = await this._request('POST', '/auth/refresh', {
      refresh_token: this.refreshToken
    });

    this.setAuthTokens(response.access_token, response.refresh_token);
    return response;
  }

  /**
   * Logout current session
   */
  async logout() {
    await this._request('POST', '/auth/logout', {
      refresh_token: this.refreshToken
    });
    this.clearAuth();
  }

  // Content API Methods

  /**
   * Get content by ID
   * @param {string} contentId 
   */
  async getContent(contentId) {
    return this._request('GET', `/content/${contentId}`);
  }

  /**
   * Search content
   * @param {Object} query - Search parameters
   */
  async searchContent(query = {}) {
    return this._request('GET', '/content/search', null, query);
  }

  /**
   * Upload new content
   * @param {Object} contentData 
   * @param {File} file 
   */
  async uploadContent(contentData, file) {
    const formData = new FormData();
    formData.append('metadata', JSON.stringify(contentData));
    formData.append('file', file);

    // Override headers for multipart upload
    const headers = new Headers(this.config.headers);
    headers.delete('Content-Type'); // Let browser set boundary
    if (this.authToken) {
      headers.append('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await fetch(`${this.config.baseURL}/content/upload`, {
      method: 'POST',
      headers,
      body: formData,
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ActifyAPIError(
        errorData.message || 'Upload failed',
        response.status,
        errorData.errors
      );
    }

    return response.json();
  }

  // User API Methods

  /**
   * Get current user profile
   */
  async getProfile() {
    return this._request('GET', '/users/me');
  }

  /**
   * Update user profile
   * @param {Object} profileData 
   */
  async updateProfile(profileData) {
    return this._request('PATCH', '/users/me', profileData);
  }

  // Helper Methods

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.authToken;
  }
}

/**
 * Custom API Error class
 */
class ActifyAPIError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.name = 'ActifyAPIError';
    this.status = status;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }

  toString() {
    return `${this.name}: ${this.message} (status: ${this.status})`;
  }
}

// Export as both default and named
export default ActifyAPI;
export { ActifyAPIError };

// Usage Example:
// const api = new ActifyAPI({ baseURL: 'https://api.yourdomain.com' });
// await api.login('user@example.com', 'password');
// const content = await api.getContent('12345');
