declare module "markdown-toc" {
  interface TocOptions {
    /**
     * Include the first h1-level heading in the table of contents
     */
    firsth1?: boolean;
    /**
     * Max heading level to include in the table of contents
     */
    maxdepth?: number;
  }

  interface Token {
    type: string;
    hLevel?: number;
    content?: string;
    level: number;
    lines?: [number, number];
    children?: any[];
    lvl?: number;
    i?: number;
  }

  interface TocResult {
    /**
     * The generated table of contents
     */
    content: string;
    /**
     * The highest heading level in the table of contents
     */
    highest: number;
    /**
     * The lowest heading level in the table of contents
     */
    lowest: number;
    /**
     * The tokens array
     */
    tokens: Token[];
    /**
     * The JSON array of headings
     */
    json: any[];
  }

  interface TocFunction {
    (str: string, options?: TocOptions): TocResult;
    slugify(str: string): string;
  }

  const toc: TocFunction;

  export = toc;

  interface TocItem {
    content: string;
    lvl: number;
    slug: string;
    i: number;
  }
}
