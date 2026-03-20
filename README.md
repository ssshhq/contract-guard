# 🛡️ ContractGuard — AI 合同风险审查

> 上传合同文件，AI 自动识别风险条款、缺失条款等等，并给出专业修改建议。

## ✨ 在线体验

🔗 **[点击访问](https://contract-guard-alpha.vercel.app)**

> 需要访问密码，访问密码为：contract20260317。

## 📸 产品截图

<img width="1920" height="928" alt="image" src="https://github.com/user-attachments/assets/c2a2c979-9d20-4f6a-96d1-30611717cdcc" />


## 🎯 核心功能

| 功能 | 说明 |
|------|------|
| 📄 合同上传 | 支持 PDF、DOCX、TXT 格式，拖拽或点击上传 |
| 🔍 AI 智能审查 | 自动识别合同中的风险条款，逐条分析 |
| ⚠️ 风险分级 | 高/中/低三级风险标注，一目了然 |
| 📋 缺失条款检测 | 检查合同是否遗漏常见必要条款 |
| ✅ 亮点识别 | 识别合同中写得好的条款 |
| 💡 修改建议 | 针对每个风险条款给出具体修改建议 |
| 📊 综合评分 | 0-100 分综合评估合同质量 |
| 🔑 自带 API Key, 可免费体验一次| 用户也可输入自己的 Model 和 API Key 无限使用 |

## 🛠️ 技术栈

- **前端框架**：Next.js 16 + React + TypeScript
- **样式**：Tailwind CSS v4
- **AI 模型**：DeepSeek-V3（通过 OpenAI 兼容接口调用）
- **文件解析**：pdf-parse（PDF）、mammoth（DOCX）
- **部署**：Vercel（免费托管）
- **开发工具**：Cursor（AI 辅助编码）

## 📖 使用方法

### 在线使用

1. 打开 [在线地址](https://contract-guard-alpha.vercel.app)
2. 输入访问密码
3. 使用作者的额度免费体验一次
4. （可选）展开设置，输入自己的 Model 和 API Key
5. 拖拽或点击上传合同文件（PDF / DOCX / TXT）
6. 等待几秒，查看 AI 审查报告

### 本地运行

```bash
# 克隆项目
git clone https://github.com/ssshhq/contract-guard.git
cd contract-guard

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 API Key 

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:3000
```

## ⚙️ 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥，[获取地址](https://platform.deepseek.com/api_keys) ；也可用其它模型|
| `ACCESS_PASSWORD` | 可选 | 访问密码;可设置多个密码，多个密码用逗号分隔 |


## 📁 项目结构

    contract-guard/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              # 首页（含密码验证）
    │   │   ├── layout.tsx            # 全局布局
    │   │   ├── globals.css           # 全局样式
    │   │   └── api/
    │   │       ├── review/route.ts   # 合同审查 API
    │   │       └── auth/route.ts     # 密码验证 API
    │   ├── components/
    │   │   ├── FileUpload.tsx        # 文件上传组件
    │   │   ├── ReviewResult.tsx      # 审查结果展示
    │   │   ├── RiskCard.tsx          # 风险条款卡片
    │   │   └── PasswordGate.tsx      # 密码验证页面
    │   └── lib/
    │       ├── ai-review.ts          # DeepSeek AI 调用
    │       ├── parse-file.ts         # 文件解析（PDF/DOCX/TXT）
    │       └── types.ts              # TypeScript 类型定义
    ├── .env.local                    # 环境变量（不上传）
    ├── next.config.ts                # Next.js 配置
    └── package.json

## 🔒 安全设计

- ✅ 访问密码保护，未授权用户无法使用
- ✅ 每个 IP 每日限制 1 次免费调用
- ✅ 用户自带 API Key 不经过服务端存储
- ✅ 合同内容仅用于本次分析，不做任何存储

## 🚀 开发说明

本项目使用 **Cursor + AI 辅助编码** 方式开发，从构思到上线用时约 2 h。

AI 完成了100% 的代码编写，开发者主要负责：
- 产品功能设计
- Prompt Engineering（合同审查提示词优化）
- 问题排查与调试
- 部署与上线

## 📄 免责声明

本工具仅供参考，不构成任何法律建议。重要合同请咨询专业律师。

---

⭐ 如果觉得有用，欢迎 Star！
