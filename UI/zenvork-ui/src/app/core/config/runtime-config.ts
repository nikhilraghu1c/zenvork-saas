interface ZenvorkRuntimeConfig {
  apiUrl?: string;
}

declare global {
  interface Window {
    __ZENVORK_RUNTIME_CONFIG__?: ZenvorkRuntimeConfig;
  }
}

// Static deployments replace public/runtime-config.js after the Angular bundle has been built.
export const runtimeConfig = {
  apiUrl: window.__ZENVORK_RUNTIME_CONFIG__?.apiUrl ?? 'http://localhost:4001',
};
