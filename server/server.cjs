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
const TIMELINE_FILE = path.join(DATA_DIR, 'timelines.json')

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

app.use(express.json({ limit: '1mb' }))

// CORS (开发时 Vite proxy 会处理，但直接访问也需要)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
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

// ── 时间表辅助函数 ──
function readTimelineData() {
  if (!fs.existsSync(TIMELINE_FILE)) {
    return { timelines: [], updatedAt: '' }
  }
  return JSON.parse(fs.readFileSync(TIMELINE_FILE, 'utf-8'))
}

function writeTimelineData(data) {
  data.updatedAt = new Date().toISOString()
  fs.writeFileSync(TIMELINE_FILE, JSON.stringify(data, null, 2))
}

// ── POST /api/timelines ── (按 owner 替换)
app.post('/api/timelines', (req, res) => {
  try {
    const { timelines, owner } = req.body
    if (!timelines || !Array.isArray(timelines)) {
      return res.status(400).json({ error: '缺少 timelines 数组' })
    }
    if (!owner) {
      return res.status(400).json({ error: '缺少 owner' })
    }
    const data = readTimelineData()
    // 移除该 owner 的所有旧条目，合并新条目
    const others = data.timelines.filter(t => t.owner !== owner)
    const incoming = timelines.map(t => ({ ...t, owner }))
    data.timelines = [...others, ...incoming]
    writeTimelineData(data)
    console.log(`[Timeline] POST owner=${owner} 替换 ${incoming.length} 条，云共 ${data.timelines.length} 条`)
    res.json({ success: true, count: incoming.length, total: data.timelines.length })
  } catch (err) {
    console.error('[Timeline] POST 保存失败:', err)
    res.status(500).json({ error: '保存失败' })
  }
})

// ── PUT /api/timelines/:id ── (单条 upsert，需 owner)
app.put('/api/timelines/:id', (req, res) => {
  try {
    const { id } = req.params
    const tl = req.body
    const owner = tl.owner || req.query.owner || ''
    if (!tl || !tl.id) {
      return res.status(400).json({ error: '缺少时间表数据' })
    }
    if (!owner) {
      return res.status(400).json({ error: '缺少 owner' })
    }
    const data = readTimelineData()
    const idx = data.timelines.findIndex(t => t.id === id)
    if (idx >= 0) {
      // 已存在：检查 owner 是否匹配
      if (data.timelines[idx].owner && data.timelines[idx].owner !== owner) {
        return res.status(403).json({ error: '无权修改他人的时间表' })
      }
      data.timelines[idx] = { ...tl, owner }
      console.log(`[Timeline] PUT 更新: ${id} "${tl.name}" owner=${owner}`)
    } else {
      data.timelines.push({ ...tl, owner })
      console.log(`[Timeline] PUT 新建: ${id} "${tl.name}" owner=${owner}`)
    }
    writeTimelineData(data)
    res.json({ success: true })
  } catch (err) {
    console.error('[Timeline] PUT 失败:', err)
    res.status(500).json({ error: '更新失败' })
  }
})

// ── DELETE /api/timelines/:id ── (单条删除，需 owner)
app.delete('/api/timelines/:id', (req, res) => {
  try {
    const { id } = req.params
    const owner = req.query.owner || ''
    const data = readTimelineData()
    const idx = data.timelines.findIndex(t => t.id === id)
    if (idx === -1) {
      return res.status(404).json({ error: '时间表不存在' })
    }
    if (data.timelines[idx].owner && data.timelines[idx].owner !== owner) {
      return res.status(403).json({ error: '无权删除他人的时间表' })
    }
    const removed = data.timelines.splice(idx, 1)[0]
    writeTimelineData(data)
    console.log(`[Timeline] DELETE: ${id} "${removed.name}" owner=${owner}`)
    res.json({ success: true, deleted: removed.name })
  } catch (err) {
    console.error('[Timeline] DELETE 失败:', err)
    res.status(500).json({ error: '删除失败' })
  }
})

// ── GET /api/timelines ── (按 owner 过滤，owner=all 返回全局数据)
app.get('/api/timelines', (req, res) => {
  try {
    const data = readTimelineData()
    const owner = req.query.owner || ''
    if (!owner) {
      // 兼容旧版：不传 owner 时返回空列表
      return res.json({ timelines: [], updatedAt: data.updatedAt })
    }
    if (owner === 'all') {
      // 全局视图：返回所有设备的数据（用于拉取/浏览）
      return res.json({ timelines: data.timelines, updatedAt: data.updatedAt })
    }
    const ownTimelines = data.timelines.filter(t => t.owner === owner)
    res.json({ timelines: ownTimelines, updatedAt: data.updatedAt })
  } catch (err) {
    console.error('[Timeline] GET 读取失败:', err)
    res.status(500).json({ error: '读取失败' })
  }
})

app.listen(PORT, () => {
  console.log(`🎨 Animei Palette Server running on http://localhost:${PORT}`)
})
