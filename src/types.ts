export interface TocConfig {
  /**
   * 目录样式：横向或纵向
   * @default 'vertical'
   */
  style?: 'horizontal' | 'vertical';

  /**
   * 是否自动插入目录标记
   * @default false
   */
  autoInsert?: boolean;

  /**
   * 最大标题层级
   * @default 2
   */
  maxLevel?: number;

  /**
   * 最小标题层级
   * @default 2
   */
  minLevel?: number;

  /**
   * 是否监听文件变化
   * @default false
   */
  watch?: boolean;

  /**
   * 自定义目录标记
   */
  markers?: {
    start: string;
    end: string;
  };

  /**
   * 日志级别
   * @default 'info'
   */
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export interface FileConfig extends TocConfig {
  /**
   * 要处理的文件列表
   */
  files?: string[];
}
