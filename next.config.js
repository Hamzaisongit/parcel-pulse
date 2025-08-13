/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Enable WebAssembly
        config.experiments = {
          asyncWebAssembly: true, // Recommended
          layers: true // Sometimes needed if using layers in wasm modules
        };
    
        return config;
      },
}

module.exports = nextConfig