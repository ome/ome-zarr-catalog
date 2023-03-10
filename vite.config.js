import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
let config = {
  plugins: [react()]
};
// this will be undefined when deployed from netlify, but is used by gh-pages
if (process.env.GITHUB_REPOSITORY_OWNER) {
  config.base = `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io/ome-zarr-catalog/`;
}

export default defineConfig(config);
