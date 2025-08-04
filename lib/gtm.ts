// Добавляем типизацию для dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const gtmPush = (event: any) => {
  if (
    typeof window !== 'undefined' &&
    window.dataLayer &&
    Array.isArray(window.dataLayer)
  ) {
    try {
      window.dataLayer.push(event);
    } catch (error) {
      console.error('GTM push error:', error);
    }
  }
};

export const gtmPushWithParams = (
  event: string,
  params: Record<string, any>,
) => {
  if (
    typeof window !== 'undefined' &&
    window.dataLayer &&
    Array.isArray(window.dataLayer)
  ) {
    try {
      window.dataLayer.push({ event, ...params });
    } catch (error) {
      console.error('GTM push with params error:', error);
    }
  }
};

export const gtmEvent = (
  eventName: string,
  parameters?: Record<string, any>,
) => {
  if (
    typeof window !== 'undefined' &&
    window.dataLayer &&
    Array.isArray(window.dataLayer)
  ) {
    try {
      window.dataLayer.push({
        event: eventName,
        ...(parameters || {}),
      });
    } catch (error) {
      console.error('GTM event error:', error);
    }
  }
};

export function sendGTMEvent(
  eventName: string,
  parameters: Record<string, any> = {},
) {
  if (
    typeof window !== 'undefined' &&
    window.dataLayer &&
    Array.isArray(window.dataLayer)
  ) {
    try {
      window.dataLayer.push({
        event: eventName,
        ...parameters,
      });
    } catch (error) {
      console.error('GTM send event error:', error);
    }
  }
}

// Добавляем функцию для проверки готовности GTM
export function isGTMReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.dataLayer &&
    Array.isArray(window.dataLayer)
  );
}

// Добавляем функцию для инициализации dataLayer если его нет
export function initDataLayer(): void {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = window.dataLayer || [];
  }
}
