// project.js

const project = {
  name: 'UnnamedActifyApp',
  version: '0.1.0',
  author: 'unknown',
  environment: 'development', // or 'production'
  initialized: false,
  config: {},
  hooks: {
    onInit: [],
    onReady: [],
    onShutdown: []
  }
};

/**
 * Initializes the Actify project
 * @param {Object} options - Metadata and config
 */
export function initProject(options = {}) {
  if (project.initialized) {
    console.warn("⚠️ Project already initialized");
    return;
  }

  Object.assign(project, options);
  project.initialized = true;

  console.log(`📁 Project "${project.name}" initialized [v${project.version}]`);

  runHooks('onInit');
}

/**
 * Registers a lifecycle hook
 * @param {'onInit'|'onReady'|'onShutdown'} hookName 
 * @param {Function} fn 
 */
export function registerHook(hookName, fn) {
  if (!project.hooks[hookName]) {
    console.warn(`⚠️ Invalid hook: ${hookName}`);
    return;
  }
  project.hooks[hookName].push(fn);
  console.log(`🔧 Hook "${hookName}" registered`);
}

/**
 * Runs all hooks of a given type
 */
function runHooks(type) {
  for (const fn of project.hooks[type]) {
    try {
      fn(project);
    } catch (e) {
      console.error(`❌ Error in "${type}" hook:`, e);
    }
  }
}

/**
 * Marks the project as fully loaded
 */
export function ready() {
  console.log("✅ Project is ready");
  runHooks('onReady');
}

/**
 * Shuts down the project (cleanup)
 */
export function shutdown() {
  console.log("🛑 Project shutting down...");
  runHooks('onShutdown');
}

/**
 * Get full project state
 */
export function getProject() {
  return { ...project };
}
