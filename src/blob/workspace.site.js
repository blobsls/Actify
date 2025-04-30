// workspace.site.js

const workspace = {
  title: document.title || "Actify Site",
  version: "1.0.0",
  layout: "default", // could be: 'default', 'dashboard', 'editor', etc.
  activeView: null,
  mountedRegions: {}, // key: region name, value: DOM element
  components: {}, // registered reusable components
};

/**
 * Registers a region in the workspace to mount into
 * @param {string} name - Unique region identifier
 * @param {HTMLElement} element - Target DOM node
 */
export function registerRegion(name, element) {
  if (!(element instanceof HTMLElement)) {
    throw new Error(`registerRegion: expected HTMLElement, got ${typeof element}`);
  }
  workspace.mountedRegions[name] = element;
  console.log(`📦 Registered region "${name}"`);
}

/**
 * Registers a reusable component into the workspace
 * @param {string} name - Component name
 * @param {Function} component - Actify component function
 */
export function registerComponent(name, component) {
  if (typeof component !== 'function') {
    throw new Error(`registerComponent: "${name}" must be a function`);
  }
  workspace.components[name] = component;
  console.log(`🧩 Registered component "${name}"`);
}

/**
 * Mounts a component into a named region
 * @param {string} region - Registered region name
 * @param {Function} component - Actify component to render
 * @param {Object} [props] - Optional props (if your renderer supports them)
 */
export function mountToRegion(region, component, props = {}) {
  const el = workspace.mountedRegions[region];
  if (!el) {
    console.warn(`⚠️ No region named "${region}" registered.`);
    return;
  }

  import('./actify.js').then(({ createElement, render }) => {
    el.innerHTML = '';
    render(createElement(component, props), el);
    console.log(`🧭 Mounted component to region "${region}"`);
  });
}

/**
 * Sets the current view name
 */
export function setActiveView(name) {
  workspace.activeView = name;
  console.log(`🔄 Active view set to "${name}"`);
}

/**
 * Updates the workspace layout type
 */
export function setLayout(type) {
  workspace.layout = type;
  console.log(`🗂️ Layout changed to "${type}"`);
}

/**
 * Returns current workspace metadata
 */
export function getWorkspace() {
  return { ...workspace }; // return a shallow copy
}
