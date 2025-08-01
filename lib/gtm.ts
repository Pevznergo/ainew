export const gtmPush = (event: any) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
  }
};

export const gtmPushWithParams = (
  event: string,
  params: Record<string, any>,
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event, ...params });
  }
};

export const gtmEvent = (
  eventName: string,
  parameters?: Record<string, any>,
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...(parameters || {}),
    });
  }
};

export function sendGTMEvent(
  eventName: string,
  parameters: Record<string, any> = {},
) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    });
  }
}
