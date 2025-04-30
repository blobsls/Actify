// actifylauncher.js

import { createElement, render } from './actify.js';

/**
 * Launches an Actify app into the DOM
 * @param {Function} AppComponent - The root Actify component (function)
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.targetId='root'] - ID of the DOM element to mount into
 * @param {boolean} [options.clear=true] - Whether to clear the container before rendering
 * @param {Function} [options.beforeMount] - Hook to run before mounting
 */
export function launchApp(AppComponent, options = {}) {
  const {
    targetId = 'root',
    clear = true,
    beforeMount = null,
  } = options;

  let container = document.getElementById(targetId);

  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.id = targetId;
    document.body.appendChild(container);
  }

  if (clear) container.innerHTML = '';

  if (typeof beforeMount === 'function') {
    beforeMount(container);
  }

  render(createElement(AppComponent), container);
}

/**
 * Dynamically loads an Actify app module and launches it
 * @param {string} modulePath - Path to the module exporting a default component
 * @param {Object} options - Options passed to launchApp
 */
export async function launchFromModule(modulePath, options = {}) {
  try {
    const mod = await import(modulePath);
    const App = mod.default;
    if (typeof App !== 'function') {
      throw new Error(`Default export from ${modulePath} must be a function component`);
    }
    launchApp(App, options);
  } catch (err) {
    console.error('❌ Failed to launch app:', err);
    const fallback = document.createElement('pre');
    fallback.textContent = `Error loading Actify app:\n${err.message}`;
    document.body.appendChild(fallback);
  }
}
