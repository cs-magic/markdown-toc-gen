import fs from "fs";
import path from "path";
import glob from "glob";
import toc from "markdown-toc";
import { TocConfig, FileConfig } from "./types";

const DEFAULT_CONFIG: TocConfig = {
  style: "horizontal",
  autoInsert: false,
  maxLevel: 2,
  watch: false,
  markers: {
    start: "<!-- toc -->",
    end: "<!-- tocstop -->",
  },
};

/**
 * 检测是否包含目录标记
 */
function hasTocMarkers(content: string, config: TocConfig): boolean {
  const { start = DEFAULT_CONFIG.markers!.start, end = DEFAULT_CONFIG.markers!.end } = config.markers || {};
  
  // 将内容按行分割
  const lines = content.split('\n');
  let inCodeBlock = false;
  let hasStart = false;
  let hasEnd = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查是否在代码块内
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // 在代码块内的内容跳过
    if (inCodeBlock) continue;
    
    // 检查是否是转义的标记
    if (line.startsWith('\\')) continue;
    
    // 检查标记
    if (line === start) hasStart = true;
    if (line === end) hasEnd = true;
  }

  return hasStart && hasEnd;
}

/**
 * 在指定位置插入目录标记
 */
function insertTocMarkers(content: string, config: TocConfig): string {
  const { start = DEFAULT_CONFIG.markers!.start, end = DEFAULT_CONFIG.markers!.end } = config.markers || {};
  const lines = content.split('\n');
  
  // 找到第一个非代码块内的一级标题
  let inCodeBlock = false;
  let h1Index = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('```')) {
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
  lines.splice(insertIndex, 0, '', startMarker, '', endMarker, '');
  return lines.join('\n');
}

/**
 * 过滤掉表格内容，避免 markdown-toc 解析错误
 */
function filterTableContent(content: string): string {
  let inTable = false;
  return content.split('\n')
    .map(line => {
      // 检测表格开始（至少有一个 | 且包含 - 的行）
      if (!inTable && line.includes('|') && line.includes('-')) {
        inTable = true;
        return '';
      }
      
      // 在表格中的行
      if (inTable) {
        // 如果不是表格行，说明表格结束
        if (!line.includes('|')) {
          inTable = false;
          return line;
        }
        return '';
      }
      
      return line;
    })
    .join('\n');
}

/**
 * 生成目录内容
 */
function generateTocContent(content: string, config: TocConfig): string {
  try {
    // 过滤表格内容
    const filteredContent = filterTableContent(content);
    console.log('Filtered content:', filteredContent);
    
    const result = toc(filteredContent, {
      firsth1: true,  // 包含第一个 h1
      maxdepth: config.maxLevel || DEFAULT_CONFIG.maxLevel!
    });
    
    // 从 tokens 中提取标题
    const headings = result.tokens
      .filter(token => 
        token.type === 'inline' && 
        token.lvl && 
        token.lvl <= (config.maxLevel || DEFAULT_CONFIG.maxLevel!)
      )
      .map(token => ({
        content: token.content || '',
        level: token.lvl || 1
      }));
    
    console.log('Headings:', headings);
    
    if (headings.length === 0) {
      return ''; // 如果没有找到标题，返回空字符串
    }

    // 转换为横向样式
    if (config.style === "horizontal") {
      return headings
        .map(heading => `[${heading.content}](#${toc.slugify(heading.content)})`)
        .join(" • ");
    }

    // 纵向样式
    return headings
      .map(heading => 
        `${"  ".repeat(heading.level - 1)}- [${heading.content}](#${toc.slugify(heading.content)})`
      )
      .join("\n");
  } catch (error) {
    console.error('生成目录时出错:', error);
    return ''; // 发生错误时返回空字符串
  }
}

/**
 * 替换目录内容
 */
function replaceTocContent(content: string, tocContent: string, config: TocConfig): string {
  const { start = DEFAULT_CONFIG.markers!.start, end = DEFAULT_CONFIG.markers!.end } = config.markers || {};
  
  // 将内容按行分割
  const lines = content.split('\n');
  let inCodeBlock = false;
  let result: string[] = [];
  let skipUntilEnd = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检查代码块
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    
    // 在代码块内的内容保持不变
    if (inCodeBlock) {
      result.push(line);
      continue;
    }
    
    // 检查转义标记
    if (line.trim().startsWith('\\')) {
      result.push(line);
      continue;
    }
    
    // 处理目录标记
    if (line.trim() === start && !skipUntilEnd) {
      result.push(line);
      result.push('');
      result.push(tocContent);
      result.push('');
      skipUntilEnd = true;
      continue;
    }
    
    if (line.trim() === end) {
      result.push(line);
      skipUntilEnd = false;
      continue;
    }
    
    if (!skipUntilEnd) {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

/**
 * 处理单个文件
 */
async function processFile(filePath: string, config: TocConfig): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    let newContent = content;

    if (!hasTocMarkers(content, config)) {
      if (config.autoInsert) {
        newContent = insertTocMarkers(content, config);
      } else {
        return;
      }
    }

    const tocContent = generateTocContent(content, config);
    newContent = replaceTocContent(newContent, tocContent, config);

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`处理文件 ${filePath} 时出错: ${error.message}`);
    }
    throw error;
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
