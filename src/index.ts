import fs from "fs";
import path from "path";
import glob from "glob";
import toc from "markdown-toc";
import chalk from "chalk";
import chokidar from "chokidar";
import { TocConfig, FileConfig } from "./types";
import { Logger } from "./logger";

const DEFAULT_CONFIG: TocConfig = {
  style: "horizontal",
  autoInsert: false,
  maxLevel: 2,
  watch: false,
  logLevel: "info",
  markers: {
    start: "<!-- toc -->",
    end: "<!-- tocstop -->",
  },
};

/**
 * 检测是否包含目录标记
 */
function hasTocMarkers(
  content: string,
  config: TocConfig
): { hasMarkers: boolean; isSingleLine: boolean } {
  const {
    start = DEFAULT_CONFIG.markers!.start,
    end = DEFAULT_CONFIG.markers!.end,
  } = config.markers || {};

  const lines = content.split("\n");
  let hasStart = false;
  let hasEnd = false;
  let isSingleLine = false;
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 检查是否在代码块内
    if (trimmedLine.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // 在代码块中的内容跳过
    if (inCodeBlock) {
      continue;
    }

    // 检查是否包含转义标记
    if (
      trimmedLine.includes("\\" + start) ||
      trimmedLine.includes("\\" + end)
    ) {
      continue;
    }

    // 检查单行标记
    if (trimmedLine.includes(start) && trimmedLine.includes(end)) {
      hasStart = true;
      hasEnd = true;
      isSingleLine = true;
      break;
    }

    // 检查多行标记
    if (!hasStart && trimmedLine === start) {
      hasStart = true;
    } else if (hasStart && trimmedLine === end) {
      hasEnd = true;
      break;
    }
  }

  return {
    hasMarkers: hasStart && hasEnd,
    isSingleLine,
  };
}

/**
 * 在指定位置插入目录标记
 */
function insertTocMarkers(content: string, config: TocConfig): string {
  const {
    start = DEFAULT_CONFIG.markers!.start,
    end = DEFAULT_CONFIG.markers!.end,
  } = config.markers || {};
  const lines = content.split("\n");

  // 找到第一个非代码块内的一级标题
  let inCodeBlock = false;
  let h1Index = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (!inCodeBlock && /^#\s/.test(line)) {
      h1Index = i;
      break;
    }
  }

  const insertIndex = h1Index !== -1 ? h1Index + 1 : 0;
  // 确保 start 和 end 有值
  const startMarker = start || DEFAULT_CONFIG.markers!.start;
  const endMarker = end || DEFAULT_CONFIG.markers!.end;
  lines.splice(insertIndex, 0, "", startMarker, "", endMarker, "");
  return lines.join("\n");
}

/**
 * 过滤掉表格内容，避免 markdown-toc 解析错误
 */
function filterTableContent(content: string, config: TocConfig): string {
  let inTable = false;
  const logger = new Logger(config);
  logger.debug("开始过滤表格内容");
  logger.debug(`原始内容：\n${content}`);

  const filteredLines = content.split("\n").map((line) => {
    // 检测表格开始（至少有一个 | 且包含 - 的行）
    if (!inTable && line.includes("|") && line.includes("-")) {
      inTable = true;
      logger.debug(`检测到表格开始：${line}`);
      return "";
    }

    // 在表格中的行
    if (inTable) {
      // 如果不是表格行，说明表格结束
      if (!line.includes("|")) {
        inTable = false;
        logger.debug(`检测到表格结束：${line}`);
        return line;
      }
      logger.debug(`过滤表格行：${line}`);
      return "";
    }

    return line;
  });

  const result = filteredLines.join("\n");
  logger.debug(`过滤后的内容：\n${result}`);
  return result;
}

/**
 * 生成目录内容
 */
function generateTocContent(content: string, config: TocConfig): string {
  try {
    // 过滤表格内容
    const filteredContent = filterTableContent(content, config);
    const logger = new Logger(config);

    // 使用正则表达式提取所有标题
    const lines = filteredContent.split("\n");
    const rawHeadings = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检测代码块
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // 只在非代码块中匹配标题
      if (!inCodeBlock) {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const content = match[2].trim();
          // 生成 slug（URL 友好的标识符）
          const slug = content
            .toLowerCase()
            .replace(/[\s\n]/g, "-")
            .replace(/[^\w\u4e00-\u9fa5-]/g, "") // 保留中文字符
            .replace(/--+/g, "-")
            .replace(/^-+|-+$/g, "");
          rawHeadings.push({ level, content, slug });
        }
      }
    }

    logger.debug(`【原始标题】：${JSON.stringify(rawHeadings, null, 2)}`);

    // 根据最大层级过滤标题
    const maxLevel = config.maxLevel ?? DEFAULT_CONFIG.maxLevel ?? 2;
    const headings = rawHeadings.filter((h) => h.level <= maxLevel);

    if (headings.length === 0) {
      return ""; // 如果没有找到标题，返回空字符串
    }

    // 生成目录内容
    let tocContent;
    if (config.style === "horizontal") {
      // 横向样式：用圆点分隔
      tocContent = headings
        .map((heading) => `[${heading.content}](#${heading.slug})`)
        .join(" • ");
      logger.debug(`生成横向目录：${tocContent}`);
    } else {
      // 纵向样式：保持缩进
      tocContent = headings
        .map((heading) => {
          const indent = "  ".repeat(heading.level - 1);
          const line = `${indent}- [${heading.content}](#${heading.slug})`;
          logger.debug(`生成目录行：${line}`);
          return line;
        })
        .join("\n");
      logger.debug(`生成纵向目录：\n${tocContent}`);
    }

    return tocContent;
  } catch (error) {
    const logger = new Logger(config);
    logger.error(`生成目录时出错：${error}`);
    return ""; // 发生错误时返回空字符串
  }
}

/**
 * 替换目录内容
 */
function replaceTocContent(
  content: string,
  tocContent: string,
  config: TocConfig
): string {
  const {
    start = DEFAULT_CONFIG.markers!.start,
    end = DEFAULT_CONFIG.markers!.end,
  } = config.markers || {};

  // 将内容按行分割
  const lines = content.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 检查是否在代码块内
    if (trimmedLine.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      i++;
      continue;
    }

    // 在代码块内的内容直接保留
    if (inCodeBlock) {
      result.push(line);
      i++;
      continue;
    }

    // 检查是否包含转义标记
    if (
      trimmedLine.includes("\\" + start) ||
      trimmedLine.includes("\\" + end)
    ) {
      result.push(line);
      i++;
      continue;
    }

    // 检查单行标记
    if (trimmedLine.includes(start) && trimmedLine.includes(end)) {
      // 保持原有的缩进
      const indent = line.match(/^\s*/)?.[0] || "";
      const parts = trimmedLine.split(start);
      const prefix = parts[0];
      const suffix = parts[1].split(end)[1];

      // 横向样式且标记是单行的，就不添加换行
      if (config.style === "horizontal" && trimmedLine === start + end) {
        result.push(indent + prefix + start + tocContent + end + suffix);
      } else {
        // 纵向样式或非单行标记，保持换行
        result.push(
          indent +
            prefix +
            start +
            "\n" +
            indent +
            tocContent +
            "\n" +
            indent +
            end +
            suffix
        );
      }
      i++;
      continue;
    }

    // 检查多行标记
    if (trimmedLine === start) {
      // 保持原有的缩进
      const indent = line.match(/^\s*/)?.[0] || "";
      result.push(indent + start);
      result.push("");
      result.push(indent + tocContent);
      result.push("");

      // 跳过到结束标记
      i++;
      while (i < lines.length) {
        const currentLine = lines[i];
        const currentTrimmedLine = currentLine.trim();
        if (
          !inCodeBlock &&
          !currentTrimmedLine.includes("\\" + end) &&
          currentTrimmedLine === end
        ) {
          result.push(indent + end);
          break;
        }
        // 检查代码块
        if (currentTrimmedLine.startsWith("```")) {
          inCodeBlock = !inCodeBlock;
        }
        i++;
      }
      i++;
      continue;
    }

    result.push(line);
    i++;
  }

  return result.join("\n");
}

/**
 * 处理单个文件
 */
export function processFile(filePath: string, config: TocConfig): boolean {
  const logger = new Logger(config);
  try {
    logger.debug(`开始处理文件：${filePath}`);
    const content = fs.readFileSync(filePath, "utf8");
    let newContent = content;

    const tocMarkers = hasTocMarkers(content, config);
    logger.debug(`目录标记检查结果：${JSON.stringify(tocMarkers)}`);

    if (!tocMarkers.hasMarkers) {
      if (config.autoInsert) {
        logger.debug(`未找到目录标记，正在自动插入...`);
        newContent = insertTocMarkers(content, config);
      } else {
        logger.warn(
          `[${filePath}] 未找到目录标记。请手动指定标记位置，或者使用 --auto-insert 参数自动添加。`
        );
        return false;
      }
    }

    logger.debug(`正在生成目录内容...`);
    const toc = generateTocContent(newContent, config);
    newContent = replaceTocContent(newContent, toc, config);

    // 在 watch 模式下，始终写入文件
    if (config.watch || newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      logger.success(`[${filePath}] 目录已更新`);
      return true;
    } else {
      logger.info(`[${filePath}] 目录无需更新`);
      return false;
    }
  } catch (error) {
    logger.error(`[${filePath}] 处理失败：${error}`);
    return false;
  }
}

/**
 * 处理多个文件或目录
 */
export function processFiles(patterns: string[], config: TocConfig): void {
  const logger = new Logger(config);
  // 展开所有文件模式
  const files = patterns.reduce((acc: string[], pattern) => {
    // 如果是目录，添加 /**/*.md 模式
    if (fs.existsSync(pattern) && fs.statSync(pattern).isDirectory()) {
      pattern = path.join(pattern, "**/*.md");
    }
    return acc.concat(glob.sync(pattern));
  }, []);

  // 如果没有找到文件，输出提示
  if (files.length === 0) {
    logger.warn("未找到任何 Markdown 文件");
    return;
  }

  logger.debug(`找到 ${files.length} 个 Markdown 文件待处理`);
  logger.debug(`文件列表：\n${files.join("\n")}`);

  const processAllFiles = () => {
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    files.forEach((file) => {
      try {
        const result = processFile(file, config);
        if (result) {
          successCount++;
        } else {
          skipCount++;
        }
      } catch (error) {
        failCount++;
        logger.error(`[${file}] 处理失败：${error}`);
      }
    });

    // 输出处理结果统计
    logger.info("\n处理完成:");
    logger.success(`  ✓ ${successCount} 个文件已更新`);
    logger.info(`  - ${skipCount} 个文件无需更新`);
    if (failCount > 0) {
      logger.error(`  × ${failCount} 个文件处理失败`);
    }
  };

  // 首次处理所有文件
  processAllFiles();

  // 如果启用了 watch 模式，监听文件变化
  if (config.watch) {
    logger.info("\n正在监听文件变化...");

    // 监听所有的 markdown 文件
    const watcher = chokidar.watch(patterns, {
      ignored: /(^|[\/\\])\../, // 忽略点文件
      persistent: true,
    });

    // 监听文件变化事件
    watcher.on("change", (filepath) => {
      logger.info(`\n检测到文件变化: ${filepath}`);
      try {
        const result = processFile(filepath, config);
        if (result) {
          logger.success(`✓ 文件已更新: ${filepath}`);
        } else {
          logger.info(`- 文件无需更新: ${filepath}`);
        }
      } catch (error) {
        logger.error(`× 处理失败: ${filepath}\n  ${error}`);
      }
    });

    // 监听新增文件
    watcher.on("add", (filepath) => {
      if (path.extname(filepath) === ".md") {
        logger.info(`\n检测到新文件: ${filepath}`);
        try {
          const result = processFile(filepath, config);
          if (result) {
            logger.success(`✓ 文件已处理: ${filepath}`);
          }
        } catch (error) {
          logger.error(`× 处理失败: ${filepath}\n  ${error}`);
        }
      }
    });
  }
}

/**
 * 生成目录
 */
export async function generateToc(
  files: string | string[],
  config: TocConfig = {}
): Promise<void> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const fileList = Array.isArray(files) ? files : [files];

  // 展开 glob 模式
  const expandedFiles = fileList.reduce<string[]>((acc, pattern) => {
    return acc.concat(glob.sync(pattern));
  }, []);

  // 处理所有文件
  await Promise.all(
    expandedFiles.map((file) => processFile(file, mergedConfig))
  );

  // 如果开启了监听模式
  if (mergedConfig.watch) {
    expandedFiles.forEach((file) => {
      fs.watch(file, async (eventType: string) => {
        if (eventType === "change") {
          await processFile(file, mergedConfig);
        }
      });
    });
  }
}

/**
 * 加载配置文件
 */
export function loadConfig(configPath?: string): FileConfig {
  const defaultPaths = [".tocrc", ".tocrc.json", ".tocrc.js"].map((name) =>
    path.resolve(process.cwd(), name)
  );

  const configFile = configPath
    ? path.resolve(process.cwd(), configPath)
    : defaultPaths.find((p) => fs.existsSync(p));

  if (!configFile) {
    return {};
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(configFile);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`加载配置文件失败: ${error.message}`);
    }
    throw error;
  }
}
