import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { UIMessage } from 'ai';
import type { MessageMetadata, CustomUIDataTypes } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
  chatId: string;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  messages: UIMessage<MessageMetadata, CustomUIDataTypes>[]; // Changed from ChatMessage[]
  setMessages: Dispatch<
    SetStateAction<UIMessage<MessageMetadata, CustomUIDataTypes>[]>
  >; // Changed
  reload: () => void; // Changed
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
}: Props) {
  console.log('Messages component render:', { messages, status });
  // Normalize incoming messages that may be in {parts: [...] } shape
  const normalizedMessages = (messages || []).map((m: any) => {
    if (!m) return m;
    if (!m.content && Array.isArray(m.parts)) {
      const text = m.parts
        .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
        .map((p: any) => p.text)
        .join('\n\n');
      return { ...m, content: text };
    }
    return m;
  })
  // Drop assistant step-start messages without any text
  .filter((m: any) => {
    if (!m) return false;
    if (m.role === 'assistant' && !m.content) {
      if (Array.isArray(m.parts)) {
        const hasText = m.parts.some((p: any) => p && p.type === 'text' && typeof p.text === 'string' && p.text.length > 0);
        return hasText;
      }
      return false;
    }
    return true;
  });
  console.log('[Messages] normalizedMessages:', {
    inputCount: messages?.length ?? 0,
    outputCount: normalizedMessages.length,
    last: normalizedMessages[normalizedMessages.length - 1],
  });
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  useDataStream();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {normalizedMessages.length === 0 && <Greeting />}

      {normalizedMessages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message as any} // Temporary fix
          isLoading={status === 'streaming' && normalizedMessages.length - 1 === index}
          vote={undefined}
          enableVoting={false}
          setMessages={setMessages as any} // Temporary fix
          reload={reload}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === normalizedMessages.length - 1
          }
        />
      ))}

      {status === 'submitted' &&
        normalizedMessages.length > 0 &&
        normalizedMessages[normalizedMessages.length - 1].role === 'user' && <ThinkingMessage />}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return false;
});
