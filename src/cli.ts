#!/usr/bin/env node

import parseArgs from "minimist";
import chalk from "chalk";
import { generateToc, loadConfig } from "./index";
import { TocConfig } from "./types";

const argv = parseArgs(process.argv.slice(2), {
  string: ["config", "style"],
  boolean: ["help", "auto-insert", "watch"],
  alias: {
    h: "help",
    c: "config",
    s: "style",
    a: "auto-insert",
    w: "watch",
  },
});

// 显示帮助信息
if (argv.help) {
  console.log(`
使用方法: md-toc [文件...] [选项]

选项:
  -h, --help        显示帮助信息
  -c, --config      指定配置文件路径
  -s, --style       目录样式 (horizontal/vertical)
  -a, --auto-insert 自动插入目录标记
  -w, --watch       监听文件变化
  --max-level       最大标题层级 (默认: 2)

示例:
  md-toc README.md
  md-toc doc1.md doc2.md --style vertical
  md-toc "docs/*.md" --auto-insert
  md-toc README.md --watch
  `);
  process.exit(0);
}

async function main() {
  try {
    // 加载配置文件
    const fileConfig = loadConfig(argv.config);

    // 合并命令行参数
    const config: TocConfig = {
      ...fileConfig,
      style: argv.style || fileConfig.style,
      autoInsert: argv["auto-insert"] || fileConfig.autoInsert,
      maxLevel: argv["max-level"] || fileConfig.maxLevel,
      watch: argv.watch || fileConfig.watch,
    };

    // 获取要处理的文件
    const files = argv._.length > 0 ? argv._ : fileConfig.files || [];

    if (files.length === 0) {
      console.log(chalk.yellow("警告: 没有指定要处理的文件"));
      process.exit(1);
    }

    // 开始处理
    console.log(chalk.cyan("\n🔍 开始生成目录..."));
    await generateToc(files, config);
    console.log(chalk.green("✨ 目录生成完成！"));

    // 如果是监听模式，保持进程运行
    if (config.watch) {
      console.log(chalk.blue("👀 正在监听文件变化..."));
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`错误: ${error.message}`));
    } else {
      console.error(chalk.red("发生未知错误"));
    }
    process.exit(1);
  }
}

main();
