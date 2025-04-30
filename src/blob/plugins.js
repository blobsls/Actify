// plugins.js

const _plugins = [];

/**
 * Registers an Actify plugin
 * @param {Object} plugin - Plugin definition
 * @param {string} plugin.name - Unique name
 * @param {Function} [plugin.onInit] - Called once on app start
 * @param {Function} [plugin.onRender] - Called on every render
 * @param {Function} [plugin.onDestroy] - Called when app is unmounted
 */
export function registerPlugin(plugin) {
  if (!plugin || typeof plugin.name !== 'string') {
    throw new Error("Invalid plugin: must have a unique 'name'");
  }

  if (_plugins.some(p => p.name === plugin.name)) {
    console.warn(`🔁 Plugin "${plugin.name}" already registered.`);
    return;
  }

  _plugins.push(plugin);
  console.log(`🔌 Registered plugin: ${plugin.name}`);
}

/**
 * Initializes all registered plugins
 * @param {Object} context - Optional shared context
 */
export function initPlugins(context = {}) {
  _plugins.forEach(plugin => {
    if (typeof plugin.onInit === 'function') {
      plugin.onInit(context);
    }
  });
}

/**
 * Triggers render hooks for all plugins
 * @param {HTMLElement} root - The root DOM node
 */
export function renderPlugins(root) {
  _plugins.forEach(plugin => {
    if (typeof plugin.onRender === 'function') {
      plugin.onRender(root);
    }
  });
}

/**
 * Triggers destroy hooks for cleanup
 */
export function destroyPlugins() {
  _plugins.forEach(plugin => {
    if (typeof plugin.onDestroy === 'function') {
      plugin.onDestroy();
    }
  });
}

/**
 * Returns all active plugins
 */
export function getPlugins() {
  return _plugins.slice(); // return a copy
}
