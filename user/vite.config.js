import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/api/v3': {
                target: 'https://test.gtctrader1203.top',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v3/, '/api/v3'),
                secure: false,
                ws: true,
            }
        }
    }
})
