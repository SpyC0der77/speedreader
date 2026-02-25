declare module "jsdom" {
  export class JSDOM {
    constructor(html: string | Buffer, options?: { url?: string });
    window: Window & typeof globalThis;
  }
}
