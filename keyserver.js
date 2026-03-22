// ═══════════════════════════════════════════════════════
//  a1ex GP Tool — License Key Server
//  Host this on: Railway, Render, Heroku, or any VPS
//  Free hosting: railway.app or render.com
// ═══════════════════════════════════════════════════════

const express = require('express')
const app = express()
app.use(express.json())

// ── YOUR KEYS DATABASE ────────────────────────────────
// Format: 'KEY': { hwid: null (unlocked) or 'HWID...' (locked), expires: Date or null }
const KEYS = {
  'A1EX-TEST-0001-ABCD': { hwid: null, expires: null },   // never expires, unlocked
  'A1EX-TEST-0002-EFGH': { hwid: null, expires: '2025-12-31' },
  // Add more keys here
};

// ── VALIDATE ENDPOINT ─────────────────────────────────
app.post('/validate', (req, res) => {
  const { key, hwid } = req.body

  if(!key || !hwid) {
    return res.json({ valid: false, reason: 'Missing key or hwid' })
  }

  const keyData = KEYS[key.toUpperCase()]

  if(!keyData) {
    return res.json({ valid: false, reason: 'Key not found' })
  }

  // Check expiry
  if(keyData.expires && new Date(keyData.expires) < new Date()) {
    return res.json({ valid: false, reason: 'Key expired' })
  }

  // HWID check
  if(keyData.hwid === null) {
    // First use — lock to this HWID
    keyData.hwid = hwid
    console.log(`Key ${key} locked to HWID: ${hwid}`)
    return res.json({ valid: true, message: 'Key activated and locked to your machine' })
  }

  if(keyData.hwid !== hwid) {
    return res.json({ valid: false, reason: 'Key is locked to a different machine. Contact support to reset.' })
  }

  return res.json({ valid: true, message: 'License valid' })
})

// ── ADMIN: list all keys ──────────────────────────────
// Protect this in production with a password!
app.get('/admin/keys', (req, res) => {
  res.json(KEYS)
})

// ── ADMIN: reset a key's HWID ─────────────────────────
app.post('/admin/reset', (req, res) => {
  const { key, secret } = req.body
  if(secret !== process.env.ADMIN_SECRET || 'changeme') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if(KEYS[key]) {
    KEYS[key].hwid = null
    return res.json({ success: true, message: `HWID reset for ${key}` })
  }
  res.json({ error: 'Key not found' })
})

// ── HEALTH CHECK ──────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', service: 'a1ex GP Tool Key Server' }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Key server running on port ${PORT}`))
