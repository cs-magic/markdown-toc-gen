declare module 'markdown-toc' {
  interface TocItem {
    content: string;
    lvl: number;
    slug: string;
    i: number;
  }

  interface TocResult {
    json: TocItem[];
    content: string;
  }

  interface TocFunction {
    (content: string): TocResult;
    slugify(str: string): string;
  }

  const toc: TocFunction;
  export = toc;
}
