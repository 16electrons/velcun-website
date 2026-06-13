/**
 * VELCUN JavaScript SDK
 * Official JavaScript SDK for integrating with the VELCUN API
 * @version 1.0.0
 */

class VelcunSDK {
  constructor(config = {}) {
    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
    this.baseURL = config.baseURL || 'https://velcun.com/api';
    this.timeout = config.timeout || 30000;
    this.token = config.token || null;
    this.version = '1.0.0';
    
    // Auto-authenticate if credentials provided
    if (config.email && config.password) {
      this.authenticate(config.email, config.password);
    }
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Get authentication token
   */
  getToken() {
    return this.token;
  }

  /**
   * Authenticate user and get JWT token
   */
  async authenticate(email, password) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        this.token = response.token;
        return response;
      }

      throw new Error('Authentication failed');
    } catch (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.success) {
        this.token = response.token;
        return response;
      }

      throw new Error('Registration failed');
    } catch (error) {
      throw new Error(`Registration error: ${error.message}`);
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const config = {
      ...options,
      headers,
      timeout: this.timeout,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * Settlement API Methods
   */
  settlement = {
    create: async (data) => {
      return await this.request('/layers/settlement', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/layers/settlement?${queryString}`);
    },

    getById: async (id) => {
      return await this.request(`/layers/settlement/${id}`);
    },

    update: async (id, data) => {
      return await this.request(`/layers/settlement/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete: async (id) => {
      return await this.request(`/layers/settlement/${id}`, {
        method: 'DELETE'
      });
    }
  };

  /**
   * Lane Optimization API Methods
   */
  lanes = {
    analyze: async (data) => {
      return await this.request('/layers/lane-optimization', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/layers/lane-optimization?${queryString}`);
    },

    getById: async (id) => {
      return await this.request(`/layers/lane-optimization/${id}`);
    }
  };

  /**
   * Document Parsing API Methods
   */
  documents = {
    parse: async (data) => {
      return await this.request('/layers/parse', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/layers/parse?${queryString}`);
    },

    getById: async (id) => {
      return await this.request(`/layers/parse/${id}`);
    }
  };

  /**
   * Driver Management API Methods
   */
  drivers = {
    create: async (data) => {
      return await this.request('/layers/driver-yield', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/layers/driver-yield?${queryString}`);
    },

    getById: async (id) => {
      return await this.request(`/layers/driver-yield/${id}`);
    },

    update: async (id, data) => {
      return await this.request(`/layers/driver-yield/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  };

  /**
   * Border Compliance API Methods
   */
  border = {
    check: async (data) => {
      return await this.request('/layers/border-compliance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/layers/border-compliance?${queryString}`);
    },

    getById: async (id) => {
      return await this.request(`/layers/border-compliance/${id}`);
    }
  };

  /**
   * Dashboard API Methods
   */
  dashboard = {
    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/layers/dashboard?${queryString}`);
    }
  };

  /**
   * Notifications API Methods
   */
  notifications = {
    create: async (data) => {
      return await this.request('/notifications', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/notifications?${queryString}`);
    },

    update: async (id, data) => {
      return await this.request('/notifications', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      });
    },

    delete: async (id) => {
      return await this.request(`/notifications`, {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
    }
  };

  /**
   * Webhooks API Methods
   */
  webhooks = {
    create: async (data) => {
      return await this.request('/webhooks', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/webhooks?${queryString}`);
    },

    update: async (id, data) => {
      return await this.request(`/webhooks`, {
        method: 'PUT',
        body: JSON.stringify({ id, ...data })
      });
    },

    delete: async (id) => {
      return await this.request(`/webhooks`, {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
    },

    trigger: async (event, data) => {
      return await this.request('/webhooks/trigger', {
        method: 'POST',
        body: JSON.stringify({ event, data })
      });
    }
  };

  /**
   * TMS Integration API Methods
   */
  tms = {
    testConnection: async (provider, config) => {
      return await this.request(`/tms-integration?tmsProvider=${provider}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'test_connection', config })
      });
    },

    syncLoads: async (provider, config) => {
      return await this.request(`/tms-integration?tmsProvider=${provider}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'sync_loads', config })
      });
    },

    pushSettlement: async (provider, data) => {
      return await this.request(`/tms-integration?tmsProvider=${provider}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'push_settlement', data })
      });
    }
  };

  /**
   * Analytics API Methods
   */
  analytics = {
    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/analytics?${queryString}`);
    },

    customReport: async (data) => {
      return await this.request('/analytics/custom-report', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  };

  /**
   * File Upload API Methods
   */
  files = {
    upload: async (file, options = {}) => {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata));
      }
      
      return await this.request('/upload', {
        method: 'POST',
        headers: {}, // Let browser set content-type for FormData
        body: formData
      });
    },

    get: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await this.request(`/upload?${queryString}`);
    },

    delete: async (id) => {
      return await this.request('/upload', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
    }
  };
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VelcunSDK;
}

if (typeof window !== 'undefined') {
  window.VelcunSDK = VelcunSDK;
}

// Default export for ES modules
export default VelcunSDK;