# markdown-toc-gen

<!-- toc -->

[markdown-toc-gen](#markdown-toc-gen) • [为什么选择 markdown-toc-gen？](#为什么选择-markdown-toc-gen) • [安装](#安装) • [快速开始](#快速开始) • [进阶使用](#进阶使用) • [配置选项](#配置选项) • [常见问题](#常见问题) • [贡献指南](#贡献指南) • [License](#license) • [致谢](#致谢)

<!-- tocstop -->

一个强大的 Markdown 目录生成器，基于 markdown-toc 并提供了显著增强，包括完整的中文支持、多种目录样式和丰富的自定义选项。

## 为什么选择 markdown-toc-gen？

- 🀄️ **完整的中文支持** - 完美支持中文标题和链接，解决了原生 markdown-toc 的中文问题
- 🎯 **多样化的目录样式** - 支持横向（适合简短目录）和纵向（适合详细目录）两种风格
- ⚡️ **批量处理能力** - 轻松处理多个文档，支持 glob 模式匹配
- 🔄 **实时监听** - 支持文件变化自动更新，完美集成到你的写作流程
- 🎨 **高度可定制** - 灵活的配置选项，包括目录深度、样式和标记
- 📦 **多种使用方式** - 支持命令行、配置文件和 API 调用，满足不同场景需求
- 🚀 **专业的日志系统** - 提供详细的调试信息，让问题排查更轻松

## 安装

```bash
npm install -g markdown-toc-gen
# 或
yarn global add markdown-toc-gen
# 或
pnpm add -g markdown-toc-gen
```

## 快速开始

1. 在你的 Markdown 文件中添加目录标记：

```markdown
<!-- toc -->
<!-- tocstop -->
```

2. 运行命令生成目录：

```bash
md-toc README.md
```

就是这么简单！

## 进阶使用

### 命令行选项

```bash
# 自动插入目录标记（如果文件中没有）
md-toc README.md --auto-insert

# 使用横向样式（适合简短目录）
md-toc README.md --style horizontal

# 设置最大标题层级
md-toc README.md --max-level 3

# 监听文件变化
md-toc README.md --watch

# 设置日志级别（debug, info, warn, error）
md-toc README.md --log-level debug

# 处理多个文件
md-toc doc1.md doc2.md

# 使用 glob 模式
md-toc "docs/*.md"
```

### 配置文件

创建 `.tocrc.json` 或 `.tocrc.js` 文件：

```json
{
  "files": ["README.md", "docs/*.md"],
  "style": "horizontal",
  "autoInsert": true,
  "maxLevel": 2,
  "watch": false,
  "logLevel": "info"
}
```

### API 使用

```typescript
import { generateToc } from "markdown-toc-gen";

// 生成目录
await generateToc("README.md", {
  style: "horizontal",
  autoInsert: true,
  maxLevel: 2,
});

// 批量处理
await generateToc(["doc1.md", "doc2.md"], {
  style: "vertical",
});

// 使用 glob 模式
await generateToc("docs/*.md", {
  watch: true,
});
```

## 配置选项

| 选项         | 说明             | 默认值     | 描述                                       |
| ------------ | ---------------- | ---------- | ------------------------------------------ |
| `style`      | 目录样式         | `vertical` | `horizontal`（横向）或 `vertical`（纵向）  |
| `autoInsert` | 自动插入目录标记 | `false`    | 当文件中没有目录标记时自动插入             |
| `maxLevel`   | 最大标题层级     | `2`        | 控制目录中包含的标题层级                   |
| `watch`      | 监听文件变化     | `false`    | 当文件变化时自动更新目录                   |
| `logLevel`   | 日志级别         | `info`     | `error`/`warn`/`info`/`debug` 控制日志输出 |
| `markers`    | 自定义目录标记   | 见下文     | 自定义目录的开始和结束标记                 |

### 目录标记

默认的目录标记：

```markdown
<!-- toc -->

目录将在这里生成

<!-- tocstop -->
```

也支持单行格式：

```markdown
<!-- toc --><!-- tocstop -->
```

如果你想在文档中展示目录标记而不让它被处理，需要在标记前添加反斜杠：

```markdown
\<!-- toc -->
```

## 常见问题

### 为什么选择 markdown-toc-gen 而不是 markdown-toc？

markdown-toc-gen 是基于 markdown-toc 开发的增强版本，主要解决了以下问题：

1. **中文支持** - markdown-toc 在处理中文标题时存在问题，而 markdown-toc-gen 完美支持中文
2. **更多功能** - 提供了更丰富的功能，如多种目录样式、文件监听、详细的日志等
3. **更好的开发体验** - 提供了更友好的 API 和配置选项，支持 TypeScript

### 目录链接不起作用？

确保你的标题符合 Markdown 规范，不包含特殊字符。如果仍有问题，可以尝试使用 `--log-level debug` 查看详细日志。

## 贡献指南

欢迎提交 Issue 和 Pull Request！在贡献代码前，请先阅读我们的[贡献指南](CONTRIBUTING.md)。

## License

MIT

## 致谢

- [markdown-toc](https://github.com/jonschlinkert/markdown-toc) - 本项目的基础依赖
- [chalk](https://github.com/chalk/chalk) - 终端样式库
- 所有贡献者和用户 ❤️
