// update.js

(function () {
  const CDN_BASE = "https://cdn.actifycorps.com/actify"; // Replace with real CDN/server
  const VERSION_ENDPOINT = `${CDN_BASE}/latest.json`;
  const SCRIPT_ID = "actify-core-loader";

  /**
   * Fetch latest version metadata and inject Actify
   */
  async function loadLatestActify() {
    try {
      const res = await fetch(VERSION_ENDPOINT);
      if (!res.ok) throw new Error(`Failed to fetch version: ${res.status}`);
      const { version, script } = await res.json();

      if (document.getElementById(SCRIPT_ID)) {
        console.log("✅ Actify core already loaded.");
        return;
      }

      const scriptTag = document.createElement("script");
      scriptTag.type = "module";
      scriptTag.src = `${CDN_BASE}/${version}/${script}`;
      scriptTag.id = SCRIPT_ID;
      scriptTag.onload = () => {
        console.log(`🚀 Actify ${version} loaded successfully`);
      };
      scriptTag.onerror = () => {
        console.error("❌ Failed to load Actify core script.");
      };

      document.head.appendChild(scriptTag);
    } catch (err) {
      console.error("❌ Actify loader failed:", err.message);
      fallback();
    }
  }

  /**
   * Optional fallback behavior
   */
  function fallback() {
    const msg = document.createElement("div");
    msg.style = "padding: 1rem; background: #fee; color: #900; font-family: sans-serif;";
    msg.textContent = "Unable to load Actify. Please check your network or CDN settings.";
    document.body.prepend(msg);
  }

  // Kick off loader
  loadLatestActify();
})();
