'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useCallback } from 'react';
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
import { ChatSDKError } from '@/lib/errors';
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

  const { messages, setMessages, append, status, stop, reload } = useChat({
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
    onFinish: async (message) => {
      console.log('Assistant message to save:', message);

      try {
        await fetchWithErrorHandlers('/api/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: id,
            message: message.message, // Передаем message.message
          }),
        });
        console.log('Assistant message saved successfully');
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }

      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
  });

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
      append({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

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
              sendMessage={append}
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
        append={append}
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
