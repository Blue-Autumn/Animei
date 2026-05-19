/**
 * Animei 调色板同步服务器
 * 
 * 启动: node server/server.js
 * 端口: 3001
 * 
 * API:
 *   POST /api/palettes  — 保存调色板数据 (JSON body: { themes: [...] })
 *   GET  /api/palettes  — 获取已保存的调色板数据
 */

const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3001
const DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'palettes.json')

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

app.use(express.json({ limit: '1mb' }))

// CORS (开发时 Vite proxy 会处理，但直接访问也需要)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ── POST /api/palettes ──
app.post('/api/palettes', (req, res) => {
  try {
    const { themes } = req.body
    if (!themes || !Array.isArray(themes)) {
      return res.status(400).json({ error: '缺少 themes 数组' })
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify({ themes, updatedAt: new Date().toISOString() }, null, 2))
    console.log(`[Palette] 已保存 ${themes.length} 个色盘`)
    res.json({ success: true, count: themes.length })
  } catch (err) {
    console.error('[Palette] 保存失败:', err)
    res.status(500).json({ error: '保存失败' })
  }
})

// ── GET /api/palettes ──
app.get('/api/palettes', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.json({ themes: [] })
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    res.json(data)
  } catch (err) {
    console.error('[Palette] 读取失败:', err)
    res.status(500).json({ error: '读取失败' })
  }
})

app.listen(PORT, () => {
  console.log(`🎨 Animei Palette Server running on http://localhost:${PORT}`)
})
