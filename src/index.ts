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
  const {
    start = DEFAULT_CONFIG.markers!.start,
    end = DEFAULT_CONFIG.markers!.end,
  } = config.markers || {};
  return content.includes(start!) && content.includes(end!);
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
  const h1Index = lines.findIndex((line) => /^#\s/.test(line));
  const insertIndex = h1Index !== -1 ? h1Index + 1 : 0;
  lines.splice(insertIndex, 0, "", start!, "", end!, "");
  return lines.join("\n");
}

/**
 * 生成目录内容
 */
function generateTocContent(content: string, config: TocConfig): string {
  const tocResult = toc(content).json.filter(
    (heading) => heading.lvl <= (config.maxLevel || DEFAULT_CONFIG.maxLevel!)
  );

  if (config.style === "horizontal") {
    return tocResult
      .map(
        (heading) => `[${heading.content}](#${toc.slugify(heading.content)})`
      )
      .join(" • ");
  }

  return tocResult
    .map(
      (heading) =>
        `${"  ".repeat(heading.lvl - 1)}- [${heading.content}](#${toc.slugify(
          heading.content
        )})`
    )
    .join("\n");
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
    const {
      start = DEFAULT_CONFIG.markers!.start,
      end = DEFAULT_CONFIG.markers!.end,
    } = config.markers || {};
    const tocBlock = `${start}\n\n${tocContent}\n\n${end}`;
    newContent = newContent.replace(
      new RegExp(`${start}[\\s\\S]*?${end}`),
      tocBlock
    );

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
