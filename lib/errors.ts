export type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'rate_guest'
  | 'rate_regular'
  | 'offline';

export type Surface =
  | 'chat'
  | 'auth'
  | 'api'
  | 'stream'
  | 'database'
  | 'history'
  | 'vote'
  | 'document'
  | 'suggestions';

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = 'response' | 'log' | 'none';

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: 'log',
  chat: 'response',
  auth: 'response',
  stream: 'response',
  api: 'response',
  history: 'response',
  vote: 'response',
  document: 'response',
  suggestions: 'response',
};

export class ChatSDKError extends Error {
  constructor(public code: string) {
    super(code);
  }

  toResponse() {
    const statusMap = {
      'rate_regular:chat': 429,
      'rate_guest:chat': 429,
    };

    return new Response(JSON.stringify({ error: this.code }), {
      status: statusMap[this.code] || 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes('database')) {
    return 'An error occurred while executing a database query.';
  }

  switch (errorCode) {
    case 'bad_request:api':
      return "The request couldn't be processed. Please check your input and try again.";

    case 'unauthorized:auth':
      return 'You need to sign in before continuing.';
    case 'forbidden:auth':
      return 'Your account does not have access to this feature.';

    case 'rate_limit:chat':
      return 'Войдите в свой аккаунт. Вы достигли максимального количества сообщений в день без авторизации.';
    case 'rate_guest:chat':
      return 'Войдите в свой аккаунт для доступа к этой модели.';
    case 'rate_regular:chat':
      return 'Недостаточно токенов для доступа к этой модели. Пополните в личном кабинете.';
    case 'not_found:chat':
      return 'The requested chat was not found. Please check the chat ID and try again.';
    case 'forbidden:chat':
      return 'This chat belongs to another user. Please check the chat ID and try again.';
    case 'unauthorized:chat':
      return 'You need to sign in to view this chat. Please sign in and try again.';
    case 'offline:chat':
      return "We're having trouble sending your message. Please check your internet connection and try again.";

    case 'not_found:document':
      return 'The requested document was not found. Please check the document ID and try again.';
    case 'forbidden:document':
      return 'This document belongs to another user. Please check the document ID and try again.';
    case 'unauthorized:document':
      return 'You need to sign in to view this document. Please sign in and try again.';
    case 'bad_request:document':
      return 'The request to create or update the document was invalid. Please check your input and try again.';

    default:
      return 'Something went wrong. Please try again later.';
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case 'bad_request':
      return 400;
    case 'unauthorized':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'rate_guest':
      return 429;
    case 'rate_regular':
      return 429;
    case 'offline':
      return 503;
    default:
      return 500;
  }
}
