# markdown-toc-gen

一个灵活的 Markdown 目录生成器，支持多种目录样式和自定义配置。

## 特性

- 🎯 支持多种目录样式（横向、纵向）
- ⚡️ 批量处理多个文档
- 🔄 自动监听文件变化
- 🎨 可自定义目录样式
- 📦 支持 glob 模式匹配文件
- 🚀 支持命令行和 API 调用

## 安装

```bash
npm install -g markdown-toc-gen
# 或
yarn global add markdown-toc-gen
# 或
pnpm add -g markdown-toc-gen
```

## 使用

### 命令行

```bash
# 处理单个文件
md-toc README.md

# 处理多个文件
md-toc doc1.md doc2.md

# 使用 glob 模式
md-toc "docs/*.md"

# 自动插入目录标记
md-toc README.md --auto-insert

# 使用横向样式
md-toc README.md --style horizontal

# 监听文件变化
md-toc README.md --watch
```

### 配置文件

创建 `.tocrc.json` 或 `.tocrc.js` 文件：

```json
{
  "files": ["README.md", "docs/*.md"],
  "style": "horizontal",
  "autoInsert": true,
  "maxLevel": 2,
  "watch": false
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

| 选项         | 说明                               | 默认值                            |
| ------------ | ---------------------------------- | --------------------------------- |
| `style`      | 目录样式 (`horizontal`/`vertical`) | `horizontal`                      |
| `autoInsert` | 自动插入目录标记                   | `false`                           |
| `maxLevel`   | 最大标题层级                       | `2`                               |
| `watch`      | 监听文件变化                       | `false`                           |
| `markers`    | 自定义目录标记                     | `<!-- toc -->`/`<!-- tocstop -->` |

## 目录标记

在 Markdown 文件中使用以下标记来指定目录位置：

````markdown
<!-- toc -->

目录将自动生成在这里

<!-- tocstop -->

```

<!-- toc --> <!-- tocstop -->


## License

MIT
```
````
