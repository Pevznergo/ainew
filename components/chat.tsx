'use client';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import type { UIMessage } from 'ai';
import type {
  MessageMetadata,
  CustomUIDataTypes,
  Attachment,
} from '@/lib/types';
import { useDataStream } from './data-stream-provider';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: UIMessage<MessageMetadata, CustomUIDataTypes>[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();
  const router = useRouter();

  const [input, setInput] = useState<string>('');
  const [currentModel, setCurrentModel] = useState(initialChatModel);

  // Обновляем модель при изменении initialChatModel
  useEffect(() => {
    setCurrentModel(initialChatModel);
  }, [initialChatModel]);

  useEffect(() => {
    if (currentModel !== initialChatModel) {
      const newChatId = generateUUID();
      router.push(`/chat/${newChatId}?model=${currentModel}`);
    }
  }, [currentModel, initialChatModel, router]);

  // Keep a live ref of messages to access finalized assistant content on finish
  const messagesRef = useRef<UIMessage<MessageMetadata, CustomUIDataTypes>[]>(
    initialMessages as any,
  );

  const chatHelpers = useChat({
    id,
    experimental_throttle: 100,
    generateId: generateUUID,
    onError: (error) => {
      console.error('Chat error:', error);

      if (error.message.includes('Guest message limit exceeded')) {
        toast({
          type: 'error',
          description:
            'Достигнут лимит сообщений для гостевого пользователя. Пожалуйста, зарегистрируйтесь.',
        });
      } else if (error.message.includes('Недостаточно токенов')) {
        toast({
          type: 'error',
          description:
            'Недостаточно токенов для отправки сообщения. Пополните баланс.',
        });
      } else {
        toast({
          type: 'error',
          description:
            error.message || 'Произошла ошибка при отправке сообщения',
        });
      }
    },
    onFinish: async () => {
      // Prefer finalized assistant content from the latest state over callback param
      const latest = messagesRef.current as any[];
      const lastAssistant = [...latest].reverse().find((m) => m?.role === 'assistant');
      const textFromParts = Array.isArray((lastAssistant as any)?.parts)
        ? (lastAssistant as any).parts
            .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
            .map((p: any) => p.text)
            .join('\n\n')
        : '';
      const textFromBlocks = Array.isArray((lastAssistant as any)?.content)
        ? (lastAssistant as any).content
            .filter((b: any) => b && b.type === 'text' && typeof b.text === 'string')
            .map((b: any) => b.text)
            .join('\n\n')
        : typeof (lastAssistant as any)?.content === 'string'
          ? (lastAssistant as any).content
          : '';
      const textContent = textFromBlocks || textFromParts;

      console.log('[Chat.onFinish] derived from state:', {
        lastAssistant,
        textLength: textContent?.length || 0,
      });

      if (!textContent || textContent.trim().length === 0) {
        console.warn('Skipping save of empty assistant message');
        return;
      }

      const toSave = {
        id: lastAssistant?.id,
        role: 'assistant' as const,
        content: textContent,
      };

      try {
        await fetchWithErrorHandlers('/api/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId: id, message: toSave }),
        });
        console.log('Assistant message saved successfully');
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }

      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
  });

  const {
    messages,
    setMessages,
    status,
    stop,
    reload,
  } = chatHelpers as any;

  // Keep the ref updated with the latest messages array
  useEffect(() => {
    messagesRef.current = messages as any;
  }, [messages]);

  // Support different SDK shapes: append, sendMessage, appendMessage
  const appendRaw: any =
    (chatHelpers as any).append ??
    (chatHelpers as any).sendMessage ??
    (chatHelpers as any).appendMessage;

  const safeAppend = useCallback(
    async (message: any) => {
      console.log('[Chat.safeAppend] incoming message:', message);
      console.log('[Chat.safeAppend] using function:', {
        hasAppend: typeof (chatHelpers as any).append,
        hasSendMessage: typeof (chatHelpers as any).sendMessage,
        hasAppendMessage: typeof (chatHelpers as any).appendMessage,
      });
      if (typeof appendRaw === 'function') {
        // Normalize to SDK message shape used in this app: { role, parts }
        const normalized = (() => {
          if (!message) return message;
          // If already has parts, keep them
          if (Array.isArray(message.parts)) {
            return { role: message.role ?? 'user', parts: message.parts };
          }
          // If content is string -> convert to text part
          if (typeof message.content === 'string') {
            return {
              role: message.role ?? 'user',
              parts: [{ type: 'text', text: message.content }],
            };
          }
          // If content blocks exist -> convert to parts
          if (Array.isArray(message.content)) {
            const parts = message.content
              .map((b: any) => {
                if (b?.type === 'text') return { type: 'text', text: b.text || '' };
                if (b?.type === 'image' && b.image)
                  return { type: 'image', url: b.image };
                return null;
              })
              .filter(Boolean);
            return { role: message.role ?? 'user', parts } as any;
          }
          return message;
        })();
        const withId = (normalized as any)?.id
          ? normalized
          : { ...(normalized as any), id: generateUUID() };
        console.log('[Chat.safeAppend] normalized payload:', withId);
        try {
          return await appendRaw(withId);
        } catch (err) {
          console.error('[Chat.safeAppend] append failed:', err);
          toast({ type: 'error', description: 'Не удалось отправить сообщение' });
        }
      }
      // Fallback: manually update UI state and POST to API
      console.warn('[Chat.safeAppend] append function missing. Using manual fallback.');
      const normalized = Array.isArray((message as any)?.parts)
        ? { role: (message as any).role ?? 'user', parts: (message as any).parts }
        : typeof (message as any)?.content === 'string'
          ? { role: (message as any).role ?? 'user', parts: [{ type: 'text', text: (message as any).content }] }
          : Array.isArray((message as any)?.content)
            ? { role: (message as any).role ?? 'user', parts: (message as any).content.map((b: any) => b?.type === 'text' ? { type: 'text', text: b.text || '' } : null).filter(Boolean) }
            : { role: (message as any).role ?? 'user', parts: [] };
      const withId = (normalized as any)?.id ? normalized : { ...(normalized as any), id: generateUUID() };

      const next = [...(messagesRef.current as any[]), withId as any];
      setMessages(next as any);
      try {
        await fetchWithErrorHandlers('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, messages: next }),
        });
      } catch (err) {
        console.error('[Chat.safeAppend] manual POST failed:', err);
        toast({ type: 'error', description: 'Сеть недоступна или сервер не отвечает' });
      }
    },
    [appendRaw, id, setMessages],
  );

  const stableSetMessages = useCallback(
    (messages) => {
      setMessages(messages);
    },
    [setMessages],
  );

  useEffect(() => {
    if (initialMessages.length > 0) {
      // Проверяем, что сообщения действительно изменились
      const currentMessageIds = messages.map((m) => m.id).join(',');
      const initialMessageIds = initialMessages.map((m) => m.id).join(',');

      if (currentMessageIds !== initialMessageIds) {
        stableSetMessages(initialMessages);
      }
    }
  }, [initialMessages, stableSetMessages, messages]);

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      safeAppend({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, safeAppend, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div className="flex flex-col min-w-0 h-screen md:h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={currentModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages as any}
          setMessages={setMessages as any}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages as any}
              setMessages={setMessages as any}
              sendMessage={safeAppend}
              selectedVisibilityType={visibilityType}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={safeAppend}
        messages={messages as any}
        setMessages={setMessages as any}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
