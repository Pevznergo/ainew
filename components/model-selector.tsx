'use client';

import {
  startTransition,
  useMemo,
  useState,
  memo,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { models as chatModels, imageModels } from '@/lib/ai/models';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { useModel } from '@/contexts/model-context';

function ModelSelectorComponent({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const { setSelectedModel } = useModel();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'image'>('chat');

  const userType = session.user.type;
  const { availableChatModelIds, availableImageModelIds } =
    entitlementsByUserType[userType];

  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id),
  );

  const availableImageModels = imageModels.filter((imageModel) =>
    availableImageModelIds.includes(imageModel.id),
  );

  const selectedModel = useMemo(() => {
    const decodedModelId = decodeURIComponent(selectedModelId);

    // Ищем в чат-моделях
    const chatModel = availableChatModels.find(
      (model) => model.id === decodedModelId,
    );
    if (chatModel) return chatModel;

    // Ищем в моделях изображений
    const imageModel = availableImageModels.find(
      (model) => model.id === decodedModelId,
    );
    if (imageModel) {
      return imageModel;
    }

    // Возвращаем дефолтную модель
    return availableChatModels[0];
  }, [selectedModelId, availableChatModels, availableImageModels]);

  // Отдельный useEffect для установки активной вкладки
  useEffect(() => {
    if (selectedModel && imageModels.find((m) => m.id === selectedModel.id)) {
      setActiveTab('image');
    } else if (
      selectedModel &&
      chatModels.find((m) => m.id === selectedModel.id)
    ) {
      setActiveTab('chat');
    }
  }, [selectedModel]);

  const router = useRouter();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedModel?.name || 'GPT-4o Mini'}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[300px] max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto"
      >
        {/* Переключатель вкладок */}
        <div className="flex border-b border-border p-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              activeTab === 'chat'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            💬 Чаты
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              activeTab === 'image'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            🎨 Изображения
          </button>
        </div>

        {/* Модели для чатов */}
        {activeTab === 'chat' &&
          availableChatModels.map((chatModel) => {
            const { id } = chatModel;

            return (
              <DropdownMenuItem
                data-testid={`model-selector-item-${id}`}
                key={id}
                onSelect={() => {
                  setOpen(false);
                  startTransition(() => {
                    setSelectedModel(id);
                    saveChatModelAsCookie(id);
                    router.push('/');
                  });
                }}
              >
                <button
                  type="button"
                  className="gap-4 group/item flex flex-row justify-between items-start w-full p-2"
                >
                  <div className="flex flex-col gap-1 items-start flex-1 min-w-0 pr-2">
                    <div className="font-medium text-sm">{chatModel.name}</div>
                    <div className="text-xs text-muted-foreground break-words leading-relaxed hyphens-auto">
                      {chatModel.description}
                    </div>
                  </div>

                  <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100 shrink-0 ml-2">
                    <CheckCircleFillIcon />
                  </div>
                </button>
              </DropdownMenuItem>
            );
          })}

        {/* Модели для изображений */}
        {activeTab === 'image' &&
          availableImageModels.map((imageModel) => {
            const { id } = imageModel;

            return (
              <DropdownMenuItem
                data-testid={`image-model-selector-item-${id}`}
                key={id}
                onSelect={() => {
                  setOpen(false);
                  startTransition(() => {
                    setSelectedModel(id);
                    saveChatModelAsCookie(id);
                    router.push('/');
                  });
                }}
              >
                <button
                  type="button"
                  className="gap-4 group/item flex flex-row justify-between items-start w-full p-2"
                >
                  <div className="flex flex-col gap-1 items-start flex-1 min-w-0 pr-2">
                    <div className="font-medium text-sm">{imageModel.name}</div>
                    <div className="text-xs text-muted-foreground break-words leading-relaxed hyphens-auto">
                      {imageModel.description}
                    </div>
                  </div>

                  <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100 shrink-0 ml-2">
                    <CheckCircleFillIcon />
                  </div>
                </button>
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const ModelSelector = memo(ModelSelectorComponent);
