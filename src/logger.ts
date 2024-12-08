import chalk from 'chalk';
import { TocConfig } from './types';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

export class Logger {
  private level: number;

  constructor(config: TocConfig) {
    this.level = LOG_LEVELS[config.logLevel || 'info'];
  }

  private shouldLog(level: keyof typeof LOG_LEVELS): boolean {
    return LOG_LEVELS[level] <= this.level;
  }

  error(message: string): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red(message));
    }
  }

  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.warn(chalk.yellow(message));
    }
  }

  info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(chalk.blue(message));
    }
  }

  success(message: string): void {
    if (this.shouldLog('info')) {
      console.log(chalk.green(message));
    }
  }

  debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray(message));
    }
  }
}
