#!/usr/bin/env node

import minimist from "minimist";
import { processFiles, loadConfig } from "./index";
import chalk from "chalk";

const argv = minimist(process.argv.slice(2));

// 加载配置文件
const fileConfig = loadConfig();

const config = {
  style: argv.style || fileConfig.style || "vertical",
  autoInsert: argv["auto-insert"] || fileConfig.autoInsert || false,
  maxLevel: argv["max-level"] || fileConfig.maxLevel || 2,
  minLevel: argv["min-level"] || fileConfig.minLevel || 2,
  watch: argv.watch || fileConfig.watch || false,
  logLevel: argv["log-level"] || fileConfig.logLevel || "info",
  markers: {
    start: argv["start-marker"] || fileConfig.markers?.start || "<!-- toc -->",
    end: argv["end-marker"] || fileConfig.markers?.end || "<!-- tocstop -->",
  },
};

// 优先使用命令行参数指定的文件，如果没有则使用配置文件中的文件
const files = argv._.length > 0 ? argv._ : fileConfig.files || [];

if (files.length === 0) {
  console.log(chalk.yellow("请指定要处理的文件或目录"));
  console.log("");
  console.log("用法：");
  console.log("  markdown-toc-gen [选项] <文件或目录...>");
  console.log("");
  console.log("选项：");
  console.log("  --style <vertical|horizontal>  目录样式 (默认: vertical)");
  console.log("  --auto-insert                  自动插入目录标记");
  console.log("  --max-level <number>           最大标题层级 (默认: 2)");
  console.log("  --min-level <number>           最小标题层级 (默认: 2)");
  console.log("  --watch                        监听文件变化");
  console.log("  --log-level <error|warn|info|debug>  日志级别 (默认: info)");
  console.log("  --start-marker <string>        开始标记 (默认: <!-- toc -->)");
  console.log(
    "  --end-marker <string>          结束标记 (默认: <!-- tocstop -->)"
  );
  process.exit(1);
}

try {
  processFiles(files, config);
} catch (error) {
  console.error(chalk.red(`处理失败：${error}`));
  process.exit(1);
}
