export const trackPixel = (event: string, data?: Record<string, any>) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event as any, data);
  }
};

export const trackPixelCustom = (event: string, data?: Record<string, any>) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("trackCustom", event, data);
  }
};

export const track = (
  name: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase" | string,
  params?: Record<string, any>,
  opts?: { eventID?: string }
) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (opts?.eventID) {
      window.fbq("track", name as any, params, { eventID: opts.eventID });
    } else {
      window.fbq("track", name as any, params);
    }
  }
};
export const trackCustom = (name: string, params?: Record<string, any>) =>
  typeof window !== "undefined" &&
  typeof window.fbq === "function" &&
  window.fbq("trackCustom", name, params);
