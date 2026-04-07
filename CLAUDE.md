# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

工具站会员支付系统 - 一个基于 Node.js + Express 的轻量级会员管理网站，提供工具展示、会员支付和管理后台功能。

## 技术栈

- **前端**: HTML + TailwindCSS (CDN) + marked (Markdown 渲染)
- **后端**: Node.js + Express
- **数据库**: 本地 JSON 文件 (`data/members.json`)

## 常用命令

```bash
# 安装依赖
npm install

# 启动服务器（生产）
npm start

# 启动服务器（开发，支持热重载）
npm run dev
```

服务器运行在 `http://localhost:3000`

## 项目结构

```
tools-page/
├── index.html          # 首页 - 工具列表展示（卡片式布局 + 筛选）
├── membership.html     # 会员充值页面（¥99/年，对接支付 API）
├── admin.html          # 管理后台（会员/订单管理，数据可视化）
├── docs.html           # 使用文档（Markdown 渲染，带目录导航）
├── guide.html          # 经验分享（4 篇实战文章）
├── detail.html         # 工具详情页（Markdown 渲染，支持 3 种文档类型）
├── video.html          # 视频播放页（随机加载视频，支持 B 站/YouTube）
├── server.js           # Express 后端服务器
├── package.json        # 依赖配置
├── .gitignore          # Git 忽略文件
└── data/
    └── members.json    # 会员和订单数据（运行时生成）
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/create-order` | 创建订单，返回支付二维码 |
| GET | `/api/query-order/:orderId` | 查询订单状态 |
| POST | `/api/simulate-payment/:orderId` | 模拟支付成功（演示用） |
| POST | `/api/verify-member` | 验证会员身份 |
| GET | `/api/admin/members` | 获取所有会员和订单数据 |

## 核心逻辑

### 支付流程
1. 用户点击"立即开通" → 调用 `/api/create-order` 创建订单
2. 显示支付二维码，前端每 2 秒轮询 `/api/query-order/:orderId`
3. 用户点击"模拟支付成功" → 调用 `/api/simulate-payment/:orderId`
4. 订单状态变为 `paid`，添加会员记录（有效期 365 天）
5. 前端检测到支付成功，跳转首页

### 数据模型

**订单 (Order)**:
```javascript
{
    orderId: "ORD" + timestamp + random,
    paymentMethod: "wechat" | "alipay",
    amount: 99,
    status: "pending" | "paid" | "expired",
    createdAt: ISO 日期，
    expiresAt: ISO 日期（15 分钟后）,
    paidAt: ISO 日期（支付时填写）
}
```

**会员 (Member)**:
```javascript
{
    id: "MEM" + timestamp,
    orderId: 关联订单 ID,
    paymentMethod: "wechat" | "alipay",
    amount: 99,
    startDate: ISO 日期，
    endDate: ISO 日期（365 天后）,
    status: "active"
}
```

## 页面路由

- **首页**: `/index.html` - 工具卡片展示，支持类型和分类筛选
- **会员充值**: `/membership.html` - 支付页面，点击"查看详情"随机跳转
- **管理后台**: `/admin.html` - 数据统计和列表展示
- **使用文档**: `/docs.html` - Markdown 渲染，左侧目录导航
- **经验分享**: `/guide.html` - 4 篇文章列表，点击切换
- **工具详情**: `/detail.html?type=resume|api|default` - 3 种文档类型
- **视频播放**: `/video.html` - 随机加载视频，支持切换

## 开发注意事项

1. **数据文件**: `data/members.json` 在 `.gitignore` 中，不会提交到仓库
2. **静态资源**: Express 的 `express.static(__dirname)` 中间件直接提供根目录下的所有静态文件
3. **CORS**: 已启用 `cors()` 中间件，允许跨域请求
4. **演示模式**: 当前使用 `qrserver.com` API 生成示例二维码，实际支付需对接真实支付接口

## 后续扩展

对接真实支付时修改 `/api/create-order`：
- **Payjs/虎皮椒**: 调用第三方 API 生成支付链接
- **微信支付官方**: 使用微信支付 v3 API
- **支付宝官方**: 使用支付宝当面付 API
