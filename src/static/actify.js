/**
 * Actify Core Initiator
 * Minimal version that loads and initializes Actify UI library
 * @version 1.0.0
 * @license MIT
 */

const Actify = {
  // Core configuration
  config: {
    cdn: 'https://cdn.actify.dev/latest',
    features: {
      errors: true,
      files: true,
      ui: true
    }
  },

  // Core modules reference
  modules: {},

  // Initialize Actify
  async init(userConfig = {}) {
    // Merge user config with defaults
    this.config = {...this.config, ...userConfig};

    try {
      // Load core CSS
      this.injectCSS(`${this.config.cdn}/actify-core.min.css`);

      // Load and initialize enabled features
      if (this.config.features.errors) {
        await this.loadModule('error-display', 'err');
      }

      if (this.config.features.files) {
        await this.loadModule('file-manager', 'appfile');
      }

      if (this.config.features.ui) {
        await this.loadModule('ui-components', 'ActifyUI');
      }

      console.log('Actify initialized successfully');
      document.dispatchEvent(new Event('actify:ready'));
    } catch (error) {
      console.error('Actify initialization failed:', error);
      document.dispatchEvent(new CustomEvent('actify:error', { detail: error }));
    }
  },

  // Load a module script
  async loadModule(moduleName, exportName) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${this.config.cdn}/${moduleName}.min.js`;
      script.onload = () => {
        this.modules[exportName] = window[exportName];
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${moduleName}`));
      document.head.appendChild(script);
    });
  },

  // Inject CSS
  injectCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
};

// Auto-initialize if data-actify attribute exists
if (document.querySelector('[data-actify]')) {
  document.addEventListener('DOMContentLoaded', () => Actify.init());
}

// Export for manual initialization
window.Actify = Actify;
