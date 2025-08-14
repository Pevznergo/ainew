'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { VisibilityType } from './visibility-selector';

interface SuggestedActionsProps {
  sendMessage: (message: any) => Promise<void> | void;
  chatId: string;
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Придумай креативное описание',
      label: 'для моего профиля на Upwork',
      action: 'Придумай креативное описание для моего профиля на Upwork',
    },
    {
      title: 'Напиши код для Telegram-бота',
      label: `с оплатой через ЮKassa`,
      action: `Напиши код для Telegram-бота с оплатой через ЮKassa`,
    },
    {
      title: 'Опиши дизайн-концепт',
      label: `в стиле Apple`,
      action: `Опиши дизайн-концепт в стиле Apple`,
    },
    {
      title: 'Напиши продающий текст',
      label: 'для лендинга онлайн-курса',
      action: 'Напиши продающий текст для лендинга онлайн-курса',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full px-2 sm:px-0"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              sendMessage({
                role: 'user',
                content: [{ type: 'text', text: suggestedAction.action }],
              });
            }}
            className="text-left border rounded-xl p-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium truncate">
              {suggestedAction.title}
            </span>
            <span className="text-muted-foreground text-xs truncate">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
