import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

type CheckResult = { name: string; ok: boolean; detail: string }

const results: CheckResult[] = []

function pass(name: string, detail: string) {
  results.push({ name, ok: true, detail })
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail })
}

async function checkSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return fail('Supabase', 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing')
  try {
    const client = createClient(url, key)
    const { error } = await client.from('products').select('id').limit(1)
    if (error) return fail('Supabase', error.message)
    pass('Supabase', 'Connected — products table readable')
  } catch (err) {
    fail('Supabase', err instanceof Error ? err.message : 'Connection failed')
  }
}

async function checkRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return fail('Razorpay', 'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing')
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res = await fetch('https://api.razorpay.com/v1/orders?count=1', {
      headers: { Authorization: `Basic ${auth}` },
    })
    if (res.ok) pass('Razorpay', 'API credentials valid')
    else fail('Razorpay', `HTTP ${res.status}`)
  } catch (err) {
    fail('Razorpay', err instanceof Error ? err.message : 'Request failed')
  }
}

async function checkShiprocket() {
  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD
  if (!email || !password) return fail('Shiprocket', 'SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD missing')
  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = (await res.json()) as { token?: string; message?: string }
    if (res.ok && data.token) pass('Shiprocket', 'Login OK')
    else fail('Shiprocket', data.message ?? `HTTP ${res.status}`)
  } catch (err) {
    fail('Shiprocket', err instanceof Error ? err.message : 'Login failed')
  }
}

async function checkGemini() {
  const key = process.env.GOOGLE_GEMINI_API_KEY
  if (!key) return fail('Gemini', 'GOOGLE_GEMINI_API_KEY missing')
  try {
    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }],
        }),
      }
    )
    if (res.ok) pass('Gemini', `Model ${model} reachable`)
    else {
      const body = await res.text()
      fail('Gemini', `HTTP ${res.status}: ${body.slice(0, 120)}`)
    }
  } catch (err) {
    fail('Gemini', err instanceof Error ? err.message : 'Request failed')
  }
}

function checkTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) {
    fail('Twilio', 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM missing')
    return
  }
  pass('Twilio', 'Env vars present (not sending test message)')
}

async function main() {
  console.log('Integration smoke check\n')
  await checkSupabase()
  await checkRazorpay()
  await checkShiprocket()
  await checkGemini()
  checkTwilio()

  let allOk = true
  for (const r of results) {
    const icon = r.ok ? 'PASS' : 'FAIL'
    console.log(`[${icon}] ${r.name}: ${r.detail}`)
    if (!r.ok) allOk = false
  }

  console.log('')
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
