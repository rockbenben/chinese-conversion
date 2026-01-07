<div align="center">

# 🇨🇳 本地批量简繁转换

### Chinese Conversion

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![Ant Design](https://img.shields.io/badge/UI-Ant_Design_6-1890ff)

<p>
无需上传文本至第三方，所有转换均在本地完成，确保隐私安全。<br>
基于 <a href="https://github.com/BYVoid/OpenCC">opencc</a> 引擎，支持简体中文、台湾繁体、香港繁体及日本新字体互转，适合批量处理海量文本。
</p>

[在线使用](https://tools.newzone.top/zh/chinese-conversion) · [文档](https://docs.newzone.top/guide/others/chinese-conversion.html) · [报告问题](https://github.com/rockbenben/chinese-conversion/issues)

</div>

---

## 目录

- [🇨🇳 本地批量简繁转换](#-本地批量简繁转换)
    - [Chinese Conversion](#chinese-conversion)
  - [目录](#目录)
  - [核心功能](#核心功能)
  - [支持格式](#支持格式)
  - [项目演示](#项目演示)
  - [使用场景](#使用场景)
  - [快速开始](#快速开始)
    - [环境要求](#环境要求)
    - [安装步骤](#安装步骤)
    - [构建生产版本](#构建生产版本)
  - [使用指南](#使用指南)
    - [快速转换](#快速转换)
    - [自定义转换](#自定义转换)
    - [高级功能](#高级功能)
  - [贡献指南](#贡献指南)
  - [License](#license)

## 核心功能

- 🛡️ **隐私优先**：无需联网，转换数据仅在本地浏览器中处理。
- 🌍 **多语言支持**：兼容简体、港台繁体、OpenCC 繁体、日文新字体等多种转换模式。
- 📦 **批量处理**：可同时上传多个文档，一键完成批量转换。
- 📝 **智能换行**：优化 OCR 文本或断行文本的格式排版。
- 🎯 **转换精准**：支持地区词汇差异转换（如：自行車 → 腳踏車）。

## 支持格式

广泛支持各类文本及开发文件格式：

- **文档**: `.txt`, `.md`, `.html`
- **字幕**: `.srt`, `.ass`, `.vtt`
- **数据**: `.json`, `.csv`, `.tsv`, `.xml`, `.yaml`, `.yml`, `.ini`
- **代码**: `.js`, `.py`, `.java`, `.sql`, `.css`, `.log`

## 项目演示

![简繁转换工具界面](./public/chinese-conversion.gif "简繁转换工具使用界面")

## 使用场景

- **🌏 文档本地化**：简繁文档发布、两岸三地网站内容同步。
- **📸 OCR 文本优化**：结合智能换行，重构扫描识别后的内容格式。
- **📚 学术研究**：简化古籍、港台学术资料等繁体文献的处理流程。
- **✍️ 内容创作**：支持博客、小说等内容的简繁体版本发布。
- **🔢 数据处理**：批量处理含中文数据的 JSON、CSV 等格式文件。

## 快速开始

### 环境要求

- Node.js >= 20.9.0
- 包管理器: Yarn (推荐), npm, 或 pnpm

### 安装步骤

1. **克隆项目**

   ```bash
   git clone https://github.com/rockbenben/chinese-conversion.git
   cd chinese-conversion
   ```

2. **安装依赖**

   ```bash
   # yarn
   yarn install

   # npm
   npm install

   # pnpm
   pnpm install
   ```

3. **启动开发服务器**

   ```bash
   # yarn
   yarn dev

   # npm
   npm run dev

   # pnpm
   pnpm dev
   ```

   访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建生产版本

```bash
# yarn
yarn build

# npm
npm run build

# pnpm
pnpm build
```

## 使用指南

### 快速转换

点击「繁 ➔ 简」或「简 ➔ 繁」按钮，即可完成快速转换。

### 自定义转换

1. 选择**源语言**（如：繁体中文（台湾））
2. 选择**目标语言**（如：简体中文）
3. 点击「执行转换」

### 高级功能

- **智能换行**：自动合并断开的段落，优化排版
- **单文件模式**：每次只处理一个文件，上传新文件时自动替换
- **大文件模式**：关闭预览以加快处理速度，适合处理大文件
- **处理后自动导出**：转换完成后直接下载文件，跳过预览

## 贡献指南

欢迎提交 Pull Request 或 Issue 来改进本项目。

1. Fork 本仓库
2. 创建分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## License

本项目采用 [MIT](./LICENSE) 许可证。
