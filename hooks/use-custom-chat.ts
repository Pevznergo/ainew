import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/lib/types';
import { generateUUID } from '@/lib/utils';
import { toast } from '@/components/toast';

export function useCustomChat({
  id,
  initialChatModel,
  selectedVisibilityType,
}: {
  id: string;
  initialChatModel: string;
  selectedVisibilityType: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<
    'ready' | 'streaming' | 'submitted' | 'error'
  >('ready');
  const [input, setInput] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const append = useCallback(
    async (message: ChatMessage) => {
      if (status === 'submitted' || status === 'streaming') {
        return;
      }

      const messageWithId = {
        ...message,
        id: message.id || generateUUID(),
      };

      setMessages((prev) => [...prev, messageWithId]);
      setStatus('submitted');

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            messages: [...messages, messageWithId],
            selectedChatModel: initialChatModel,
            selectedVisibilityType,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setStatus('error');

          if (response.status === 429) {
            throw new Error(
              errorData.error || 'Insufficient balance for this model',
            );
          }
          throw new Error(errorData.error || 'Request failed');
        }

        setStatus('streaming');

        // Обработка SSE потока
        const reader = response.body?.getReader();
        if (reader) {
          try {
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += new TextDecoder().decode(value);
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    setStatus('ready');
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'text-delta') {
                      // Обновляем последнее сообщение ассистента
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.role === 'assistant') {
                          lastMessage.parts = lastMessage.parts || [];
                          const textPart = lastMessage.parts.find(
                            (p) => p.type === 'text',
                          );
                          if (textPart) {
                            textPart.text =
                              (textPart.text || '') + parsed.textDelta;
                          } else {
                            lastMessage.parts.push({
                              type: 'text',
                              text: parsed.textDelta,
                            });
                          }
                        } else {
                          newMessages.push({
                            id: generateUUID(),
                            role: 'assistant',
                            parts: [{ type: 'text', text: parsed.textDelta }],
                          });
                        }
                        return newMessages;
                      });
                    }
                  } catch (e) {
                    // Игнорируем ошибки парсинга
                  }
                }
              }
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log('Request aborted');
            } else {
              console.error('Stream reading error:', error);
            }
          } finally {
            reader.releaseLock();
          }
        }

        setStatus('ready');
      } catch (error) {
        setStatus('error');
        console.error('Chat error:', error);

        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred';
        toast({
          type: 'error',
          description: errorMessage,
        });
      }
    },
    [id, messages, initialChatModel, selectedVisibilityType, status],
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('ready');
  }, []);

  const reload = useCallback(async () => {
    if (messages.length === 0) return '';

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    if (!lastUserMessage) return '';

    // Удаляем последнее сообщение ассистента
    setMessages((prev) => prev.filter((_, index) => index < prev.length - 1));

    // Повторно отправляем последнее сообщение пользователя
    await append(lastUserMessage);
    return '';
  }, [messages, append]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || status !== 'ready') return;

      const message: ChatMessage = {
        id: generateUUID(),
        role: 'user',
        parts: [{ type: 'text', text: input.trim() }],
      };

      setInput('');
      await append(message);
    },
    [input, status, append],
  );

  return {
    messages,
    setMessages,
    append,
    status,
    stop,
    reload,
    input,
    handleInputChange,
    handleSubmit,
  };
}
