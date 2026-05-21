<h1 align="center">
🇨🇳 简繁转换工具
</h1>
<p align="center">
    <a href="./README.en.md">English</a> | 中文
</p>
<p align="center">
    <em>本地批量简繁体、地区词汇互转，含可编辑保护词典，全程不上传服务器</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://tools.newzone.top/zh/chinese-conversion"><img src="https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E4%BD%93%E9%AA%8C-chinese--conversion-blue" alt="在线体验"></a>
</p>

**简繁转换工具** 是一款完全在浏览器本地运行的中文文本转换工具，基于 [js-opencc](https://github.com/rockbenben/js-opencc)（[OpenCC](https://github.com/BYVoid/OpenCC) 的 JS 移植）。支持简体、繁体（台湾 / 香港 / OpenCC 标准）、日本新字体之间任意方向的转换，提供快捷按钮、自定义语言对、用户可编辑的保护词典以及批量文件处理。

👉 **在线体验**：<https://tools.newzone.top/zh/chinese-conversion>

![简繁转换工具界面](./public/chinese-conversion.gif "简繁转换工具使用界面")

## 核心功能

- 🛡️ **隐私优先**：转换全部在浏览器本地完成，文本不会上传到任何服务器。
- 🌍 **6 种语言代号互转**：简体（`cn`）、繁体台湾（`tw`）、繁体台湾 + 地区词汇（`twp`）、繁体香港（`hk`）、OpenCC 标准繁体（`t`）、日本新字体（`jp`），两两组合任意方向。
- 📝 **保护词典**：定义"不被转换"的词组清单，s2t 和 t2s 两套规则独立管理，仅在涉及简体的方向生效。
- 📚 **智能换行**：根据中文标点重新合并 OCR / PDF 复制造成的断行，可独立开关。
- 📦 **批量处理**：同时拖入多个 TXT 文件，结果以原文件名导出；可切换单文件模式以新换旧。
- 🌐 **多语言 UI**：基于 next-intl，支持 18 种界面语言。

## 支持的语言代号

| 代号  | 含义                                                                              |
| ----- | --------------------------------------------------------------------------------- |
| `cn`  | 简体中文                                                                          |
| `tw`  | 繁体中文（台湾），仅字形转换                                                      |
| `twp` | 繁体中文（台湾）+ 地区词汇转换（视频↔影片、幼儿园↔幼稚園 等）                     |
| `hk`  | 繁体中文（香港），香港本地字形                                                    |
| `t`   | OpenCC 模式繁体，标准字形转换                                                     |
| `jp`  | 日本新字体（Shinjitai）                                                           |

## 支持的文件格式

- **文档**：`.txt`、`.md`、`.html`
- **字幕**：`.srt`、`.ass`、`.vtt`
- **数据**：`.json`、`.csv`、`.tsv`、`.xml`、`.yaml`、`.yml`、`.ini`
- **代码**：`.js`、`.py`、`.java`、`.sql`、`.css`、`.log`

## 使用指南

### 快捷转换

两个主操作按钮：

- **繁 → 简**：从某种繁体转到简体
- **简 → 繁**：从简体转到某种繁体

具体使用哪种"繁体"由「转换设置」中的**词汇转换**开关决定：

| 词汇转换开关 | 繁 → 简 (t2s) 等价 | 简 → 繁 (s2t) 等价 |
| ------------ | ------------------ | ------------------ |
| 开启         | `twp → cn`         | `cn → twp`         |
| 关闭         | `t → cn`           | `cn → t`           |

### 自定义语言

需要 `tw↔hk`、`t↔jp` 等其他组合时使用：

1. 在右栏「源语言」下拉中选择输入语言
2. 在「目标语言」下拉中选择输出语言
3. 点击「自定义转换」

⚠️ 当自定义语言对**不涉及简体**（如 `tw↔hk`）时，保护词典不会生效；若词典里有规则，工具会显示「当前规则未生效」提示。

### 保护词典

定义"不应被转换"的词组清单：

- **s2t 规则**：简 → 繁方向生效（`from` 是简体词，`to` 是希望保留的繁体写法）
- **t2s 规则**：繁 → 简方向生效
- 两套规则独立管理，独立存储

应用规则：

- ✅ `cn → tw/twp/hk/t/jp` → 应用 **s2t 规则**
- ✅ `tw/twp/hk/t/jp → cn` → 应用 **t2s 规则**
- ❌ `tw ↔ hk`、`t ↔ jp` 等纯繁体间转换 → 不应用规则

支持 JSON 批量导入 / 导出整套词典。

### 其他设置

- **智能换行**：根据中文标点合并断行（OCR 修复利器）
- **单文件模式**：开启后一次仅处理一个文件，新上传的文件替换当前文件
- **处理后自动导出**：转换结果直接下载为文件，跳过页面预览（适合大批量处理）

## 使用场景

- **🌏 文档本地化**：简繁文档发布、两岸三地内容同步
- **📸 OCR 文本优化**：结合智能换行重构扫描识别后的内容格式
- **📚 学术研究**：简化古籍、港台学术资料等繁体文献的处理流程
- **✍️ 内容创作**：博客、小说等内容的简繁体版本发布
- **🔢 数据处理**：批量处理含中文数据的 JSON、CSV 等文件

## 技术栈

- **框架**：[Next.js 16](https://nextjs.org/)（App Router）
- **UI**：[Ant Design](https://ant.design/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **i18n**：[next-intl](https://next-intl-docs.vercel.app/)
- **转换引擎**：[js-opencc](https://github.com/rockbenben/js-opencc)（[OpenCC](https://github.com/BYVoid/OpenCC) 的 JS 移植）
- **编码检测**：jschardet

## 快速开始

### 环境要求

- Node.js >= 20.9.0
- 包管理器：Yarn（推荐）、npm 或 pnpm

### 安装与启动

```bash
git clone https://github.com/rockbenben/chinese-conversion.git
cd chinese-conversion

# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 构建生产版本

```bash
yarn build
```

## 贡献指南

欢迎提交 Pull Request 或 Issue 改进本项目。

1. Fork 本仓库
2. 创建分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'feat: add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 相关链接

- 📖 [使用文档](https://docs.newzone.top/zh/guide/tools/chinese-conversion)
- 🐛 [报告问题](https://github.com/rockbenben/chinese-conversion/issues)

## License

本项目采用 [MIT](./LICENSE) 许可证。
