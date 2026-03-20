# 文章评价接口文档

## POST /api/feedback

提交文章评价

### 请求头
```
Content-Type: application/json
```

### 请求体
```json
{
  "slug": "string",      // 文章 slug，必填
  "type": "string",      // 评价类型，必填
                         // - "helpful": 有用
                         // - "not_helpful": 无用
                         // - "other": 其他反馈
  "content": "string"    // 反馈内容，当 type="other" 时必填
}
```

### 成功响应
```
Status: 200 OK
```
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

### 错误响应
```
Status: 400 Bad Request
```
```json
{
  "success": false,
  "error": "Invalid feedback type or missing required fields"
}
```

```
Status: 500 Internal Server Error
```
```json
{
  "success": false,
  "error": "Failed to submit feedback"
}
```

---

## DELETE /api/feedback

撤回文章评价

### 请求头
```
Content-Type: application/json
```

### 请求体
```json
{
  "slug": "string"        // 文章 slug，必填
}
```

### 成功响应
```
Status: 200 OK
```
```json
{
  "success": true,
  "message": "Feedback revoked successfully"
}
```

### 错误响应
```
Status: 400 Bad Request
```
```json
{
  "success": false,
  "error": "Missing slug"
}
```

```
Status: 500 Internal Server Error
```
```json
{
  "success": false,
  "error": "Failed to revoke feedback"
}
```

---

## 推荐实现方案

由于是静态博客，推荐使用以下方案之一：

### 1. Cloudflare Workers + KV Storage
- 免费额度充足
- 边缘部署，低延迟
- KV Storage 适合存储评价数据

### 2. Vercel Serverless Functions + KV/Database
- 与 Astro 部署无缝集成
- 可使用 Vercel KV 或 Postgres

### 3. Supabase Edge Functions + Database
- 提供 Postgres 数据库
- 适合需要持久化分析的场景

---

## 数据库表结构

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('helpful', 'not_helpful', 'other')),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash VARCHAR(64)  -- 哈希处理用于防刷
);

CREATE INDEX idx_feedback_slug ON feedback(slug);
CREATE INDEX idx_feedback_type ON feedback(type);
```

### 前端持久化

前端使用 localStorage 存储用户评价状态，key 格式为 `feedback_{slug}`：

```json
{
  "type": "helpful" | "not_helpful" | "other",
  "content": "..."  // 仅 type 为 "other" 时存在
}
```
