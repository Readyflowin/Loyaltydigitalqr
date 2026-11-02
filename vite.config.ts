import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Serves POST /api/upload during `vite dev` so logo/image uploads to Cloudflare
// R2 work locally, exactly like the Vercel function does in production. Reads
// the R2 credentials from .env (all vars, not just VITE_ ones) on the server
// side only — they never reach the browser bundle.
function r2UploadDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'r2-upload-dev',
    configureServer(server) {
      server.middlewares.use('/api/upload', async (req, res) => {
        const send = (status: number, body: Record<string, unknown>) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') {
          send(405, { error: 'Method not allowed' })
          return
        }
        try {
          const { processUpload, readR2Env } = await import('./api/_r2-upload.ts')
          const url = new URL(req.url || '', 'http://localhost')
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const result = await processUpload({
            env: readR2Env(env),
            authHeader: (req.headers['authorization'] as string) || '',
            businessId: url.searchParams.get('businessId') || '',
            kind: url.searchParams.get('kind') || '',
            contentType: ((req.headers['content-type'] as string) || '').split(';')[0].trim(),
            body: new Uint8Array(Buffer.concat(chunks)),
          })
          send(result.status, result.body)
        } catch (err) {
          send(500, { error: 'Upload failed', detail: String(err) })
        }
      })
    },
  }
}

// Serves POST /api/admin during `vite dev` so the master-admin console works
// locally exactly like the Vercel function does in production. The admin
// secrets and Firebase service account are read from .env on the server side
// only (all vars, not just VITE_ ones) and never reach the browser bundle.
function adminApiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'admin-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/admin', async (req, res) => {
        const send = (status: number, body: Record<string, unknown>) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') {
          send(405, { error: 'Method not allowed' })
          return
        }
        try {
          const { handleAdminRequest, readAdminEnv } = await import('./api/_admin-core.ts')
          const adminEnv = readAdminEnv(env)
          if (!adminEnv) {
            send(500, { error: 'Admin API is not configured (ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_JWT_SECRET).' })
            return
          }
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          let payload: Record<string, unknown> = {}
          const raw = Buffer.concat(chunks).toString('utf8')
          if (raw) payload = JSON.parse(raw) as Record<string, unknown>
          const result = await handleAdminRequest({
            env: adminEnv,
            action: typeof payload.action === 'string' ? payload.action : '',
            body: payload,
            authHeader: (req.headers['authorization'] as string) || '',
          })
          send(result.status, result.body)
        } catch (err) {
          send(500, { error: 'Admin request failed', detail: String(err) })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), r2UploadDevPlugin(env), adminApiDevPlugin(env)],
    server: {
      port: 3000,
    },
    build: {
      rollupOptions: {
        output: {
          // Split only the large libraries shared by public and dashboard code
          // into their own long-lived cache chunks. Everything else is left to
          // Rollup so dashboard-only deps (qrcode, confetti, jsqr…) stay inside
          // the lazy dashboard chunks and never load on a public QR page.
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase'
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react-vendor'
            }
          },
        },
      },
    },
  }
})
