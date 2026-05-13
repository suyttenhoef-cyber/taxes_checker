import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/taxes_checker/',
    plugins: [react()],
    server: {
      proxy: {
        '/odwb': {
          target: 'https://www.odwb.be',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/odwb/, ''),
        },
        '/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('Origin')
              proxyReq.removeHeader('Referer')
              proxyReq.setHeader('x-api-key', env.ANTHROPIC_KEY)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
            })
          },
        },
      },
    },
  }
})