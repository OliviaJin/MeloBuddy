#!/usr/bin/env node
/**
 * 验证曲库脚本
 * 检查所有MusicXML文件是否存在且可解析
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// 从 songLibrary 提取所有曲目
const songLibraryPath = path.join(projectRoot, 'src/data/songs/index.ts')
const songLibraryContent = fs.readFileSync(songLibraryPath, 'utf-8')

// 使用正则提取所有 musicXmlUrl
const urlRegex = /musicXmlUrl:\s*['"]([^'"]+)['"]/g
const matches = [...songLibraryContent.matchAll(urlRegex)]
const expectedUrls = matches.map(m => m[1])

console.log('🎵 MeloBuddy 曲库验证')
console.log('='.repeat(50))
console.log(`\n📊 曲库中定义的曲目数量: ${expectedUrls.length}`)

// 检查文件是否存在
const missing = []
const existing = []

for (const url of expectedUrls) {
  const filePath = path.join(projectRoot, 'public', url)
  if (fs.existsSync(filePath)) {
    existing.push(url)
  } else {
    missing.push(url)
  }
}

console.log(`✅ 存在的文件: ${existing.length}`)
console.log(`❌ 缺失的文件: ${missing.length}`)

if (missing.length > 0) {
  console.log('\n❌ 缺失的MusicXML文件:')
  missing.forEach(url => console.log(`   - ${url}`))
}

// 检查实际存在但未被引用的文件
const publicScoresDir = path.join(projectRoot, 'public/scores')

function getAllXmlFiles(dir, baseDir = dir) {
  const files = []
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...getAllXmlFiles(fullPath, baseDir))
    } else if (item.endsWith('.xml')) {
      const relativePath = '/' + path.relative(path.join(baseDir, '..'), fullPath)
      files.push(relativePath)
    }
  }
  return files
}

const actualFiles = getAllXmlFiles(publicScoresDir)
const unusedFiles = actualFiles.filter(f => !expectedUrls.includes(f))

console.log(`\n📁 实际XML文件数量: ${actualFiles.length}`)
console.log(`🔗 被曲库引用的: ${existing.length}`)
console.log(`📦 未被引用的: ${unusedFiles.length}`)

if (unusedFiles.length > 0) {
  console.log('\n📦 未被曲库引用的XML文件:')
  unusedFiles.forEach(url => console.log(`   - ${url}`))
}

// 验证XML文件内容（简单检查）
console.log('\n🔍 验证XML文件内容...')
let validCount = 0
let invalidFiles = []

for (const url of existing) {
  const filePath = path.join(projectRoot, 'public', url)
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    // 检查是否包含MusicXML必需元素
    if (content.includes('score-partwise') || content.includes('score-timewise')) {
      validCount++
    } else {
      invalidFiles.push({ url, reason: '不是有效的MusicXML格式' })
    }
  } catch (err) {
    invalidFiles.push({ url, reason: err.message })
  }
}

console.log(`✅ 有效的MusicXML: ${validCount}`)
console.log(`❌ 无效的文件: ${invalidFiles.length}`)

if (invalidFiles.length > 0) {
  console.log('\n❌ 无效的XML文件:')
  invalidFiles.forEach(f => console.log(`   - ${f.url}: ${f.reason}`))
}

// 总结
console.log('\n' + '='.repeat(50))
console.log('📋 验证总结')
console.log('='.repeat(50))

const issues = missing.length + invalidFiles.length
if (issues === 0) {
  console.log('✅ 所有曲目文件验证通过！')
} else {
  console.log(`⚠️  发现 ${issues} 个问题需要修复`)
}

if (unusedFiles.length > 0) {
  console.log(`ℹ️  有 ${unusedFiles.length} 个XML文件未被使用（可能是备份或旧版本）`)
}

console.log('')
