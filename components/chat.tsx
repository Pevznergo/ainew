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
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { ChatSDKError } from '@/lib/errors';
import type { UIMessage } from 'ai';
import type {
  MessageMetadata,
  CustomUIDataTypes,
  Attachment,
} from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { useRouter } from 'next/navigation';

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
    onFinish: async (message) => {
      console.log('Assistant message to save:', message);

      try {
        await fetch('/api/message', {
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
    onError: (error) => {
      console.error('Chat error:', error);
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const stableSetMessages = useCallback((messages) => {
    setMessages(messages);
  }, []);

  useEffect(() => {
    if (initialMessages.length > 0) {
      stableSetMessages(initialMessages);
    }
  }, [initialMessages, stableSetMessages]);

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
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={currentModel} // ← Передаем currentModel
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages as any} // Temporary fix
          setMessages={setMessages as any} // Temporary fix
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
              messages={messages as any} // Temporary fix
              setMessages={setMessages as any} // Temporary fix
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
        append={append} // Changed from sendMessage
        messages={messages as any} // Temporary fix
        setMessages={setMessages as any} // Temporary fix
        reload={reload} // Changed from regenerate
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
