// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TikTokPixelQueue = any[];

interface TikTokPixelInstance {
  methods: string[];
  setAndDefer: (target: TikTokPixelInstance, method: string) => void;
  instance: (pixelId: string) => TikTokPixelInstance;
  load: (pixelId: string, options?: Record<string, unknown>) => void;
  page: () => void;
  track: (eventName: string, params?: Record<string, unknown>) => void;
  identify: (data?: Record<string, unknown>) => void;
  _i?: Record<string, TikTokPixelQueue>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, unknown>>;
  push: (args: unknown[]) => void;
}

declare global {
  interface Window {
    ttq?: TikTokPixelInstance;
    TiktokAnalyticsObject?: string;
  }
}

export {};
