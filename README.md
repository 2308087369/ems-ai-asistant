# 能源管理系统 (EMS) 前端项目

这是一个现代化的能源管理系统前端项目，基于 Next.js 构建，集成了智能 AI 语音助手，提供实时的能源站点监控、数据分析和交互式管理功能。

## ✨ 核心功能

### 1. 📊 实时数据大屏
- **站点监控**：实时展示各个光伏/储能站点的运行状态、功率数据和告警信息。
- **动态图表**：集成 ECharts/Recharts 展示功率趋势、发电量统计等可视化图表。
- **汇总面板**：实时计算并展示总功率、日发电量、总收益等关键指标。

### 2. 🤖 智能 AI 助手
- **语音交互**：
  - 支持唤醒词 **"你好小鑫"**（兼容多种口语变体）自动唤醒助手。
  - 支持退出指令 **"再见小鑫"**（兼容多种口语变体）自动关闭助手。
  - 支持语音打断：在 AI 播报过程中可随时通过退出指令打断。
- **多模态输入**：支持语音输入和文本输入双模式。
- **智能问答**：基于通义千问 (Qwen-Plus) 大模型，能够回答关于当前站点数据的分析、诊断和建议。
- **语音合成**：AI 回复支持实时语音播报 (TTS)。

### 3. 🔐 安全与鉴权
- **登录保护**：默认拦截未授权访问，强制跳转登录页。
- **模拟认证**：内置演示用账号体系（Admin/Admin123）。
- **自动登出**：支持手动退出登录，保护会话安全。

## 🛠 技术栈

- **框架**：[Next.js 14](https://nextjs.org/) (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS + Shadcn/ui
- **AI 模型**：阿里云通义千问 (Qwen-Plus)
- **语音技术**：HTML5 Web Speech API (SpeechRecognition + SpeechSynthesis)
- **图标**：Lucide React

## 🚀 快速开始

### 1. 环境准备
确保您的开发环境已安装：
- Node.js (v18+)
- pnpm (推荐) 或 npm/yarn

### 2. 安装依赖
```bash
cd font
pnpm install
```

### 3. 配置环境变量
在 `font` 目录下创建 `.env.local` 文件，并填入以下内容：

```env
# AI 服务配置 (阿里云 DashScope)
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-plus

# 调试配置 (可选)
NEXT_PUBLIC_AI_DEBUG_PROMPT=false
```

### 4. 启动开发服务器
```bash
pnpm dev
```
访问 [http://localhost:3000](http://localhost:3000) 即可查看效果。

### 5. 登录演示账号
- **账号**：`admin`
- **密码**：`admin123`

## 🗣️ 语音指令指南

| 动作 | 指令示例 |
| --- | --- |
| **唤醒助手** | "你好小鑫", "你好小心", "嘿小鑫", "Hello" |
| **退出交互** | "再见小鑫", "退出对话", "拜拜", "停止语音" |
| **询问数据** | "现在的总功率是多少？", "分析一下今天的发电效率" |

## 📁 目录结构

```
font/
├── app/
│   ├── api/           # 后端 API 路由 (AI Chat)
│   ├── login/         # 登录页面
│   └── page.tsx       # 主页 (仪表盘 + 唤醒监听)
├── components/
│   ├── ai-assistant.tsx # AI 助手核心组件
│   ├── site-card.tsx    # 站点卡片组件
│   └── ...
├── lib/
│   └── energy-data.ts   # 数据模拟与处理逻辑
└── public/            # 静态资源
```

## 📝 开发注意事项

1. **语音识别兼容性**：
   - 推荐使用 **Chrome** 或 **Edge** 浏览器以获得最佳的语音识别体验。
   - 必须使用 `localhost` 或 `https` 协议才能调用麦克风权限。

2. **AI 模型配置**：
   - 默认使用 `qwen-plus` 模型，需确保 API Key 开通了相应权限。
