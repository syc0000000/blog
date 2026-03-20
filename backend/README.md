# Blog Feedback Backend

Go + PostgreSQL 评价服务

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 修改数据库配置
```

### 2. 创建数据库

```sql
CREATE DATABASE blog_feedback;
```

### 3. 运行迁移

```bash
psql -h localhost -U postgres -d blog_feedback -f migrations/001_create_feedbacks.sql
```

### 4. 启动服务

```bash
go run ./cmd/server
```

## 接口

### POST /api/feedback

提交评价

```json
{
  "slug": "my-post",
  "type": "helpful",
  "content": ""
}
```

### DELETE /api/feedback

撤回评价

```json
{
  "slug": "my-post"
}
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| DB_HOST | localhost | 数据库地址 |
| DB_PORT | 5432 | 数据库端口 |
| DB_USER | postgres | 数据库用户 |
| DB_PASSWORD | postgres | 数据库密码 |
| DB_NAME | blog_feedback | 数据库名 |
| PORT | 8080 | 服务端口 |
