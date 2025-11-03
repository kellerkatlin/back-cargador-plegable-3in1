declare global {
  interface Window {
    fbq?: (
      method: "track" | "trackCustom" | string,
      eventName: string,
      params?: Record<string, any>,
      opts?: { eventID?: string }
    ) => void;
  }
}
export {};
