import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'madrasa-erp-vna6iy5o',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_OhTmepd11XvccRaSH2rXoiZ9b-YyRNgd',
  auth: { mode: 'managed' },
})
