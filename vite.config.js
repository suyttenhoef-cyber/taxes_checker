import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/taxes_checker/',
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/odwb': {
          target: 'https://www.odwb.be',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/odwb/, ''),
        },
        '/github': {
          target: 'https://api.github.com',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/github/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('Origin')
              proxyReq.removeHeader('Referer')
              proxyReq.setHeader('Authorization', `Bearer ${env.GITHUB_TOKEN}`)
              proxyReq.setHeader('User-Agent', 'taxes-checker-app')
              proxyReq.setHeader('Accept', 'application/vnd.github.v3+json')
            })
          },
        },
        '/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/openai/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('Origin')
              proxyReq.removeHeader('Referer')
              proxyReq.setHeader('Authorization', `Bearer ${env.OPENAI_KEY}`)
            })
          },
        },
      },
    },
  }
})