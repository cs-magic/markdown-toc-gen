#!/usr/bin/env node

import minimist from "minimist";
import { processFiles } from "./index";
import chalk from "chalk";

const argv = minimist(process.argv.slice(2));

const config = {
  style: argv.style || "horizontal",
  autoInsert: argv["auto-insert"] || false,
  maxLevel: argv["max-level"] || 2,
  watch: argv.watch || false,
  logLevel: argv["log-level"] || "info",
  markers: {
    start: argv["start-marker"] || "<!-- toc -->",
    end: argv["end-marker"] || "<!-- tocstop -->",
  },
};

const files = argv._;
if (files.length === 0) {
  console.log(chalk.yellow("请指定要处理的文件或目录"));
  console.log("");
  console.log("用法：");
  console.log("  markdown-toc-gen [选项] <文件或目录...>");
  console.log("");
  console.log("选项：");
  console.log("  --style <horizontal|vertical>  目录样式 (默认: horizontal)");
  console.log("  --auto-insert                  自动插入目录标记");
  console.log("  --max-level <number>           最大标题层级 (默认: 2)");
  console.log("  --watch                        监听文件变化");
  console.log("  --log-level <error|warn|info|debug>  日志级别 (默认: info)");
  console.log("  --start-marker <string>        开始标记 (默认: <!-- toc -->)");
  console.log("  --end-marker <string>          结束标记 (默认: <!-- tocstop -->)");
  process.exit(1);
}

try {
  processFiles(files, config);
} catch (error) {
  console.error(chalk.red(`处理失败：${error}`));
  process.exit(1);
}
