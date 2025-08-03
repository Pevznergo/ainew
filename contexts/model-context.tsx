'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface ModelContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  initializeModel: (model: string) => void;
}

export const ModelContext = createContext<ModelContextType | undefined>(
  undefined,
);

export function ModelProvider({
  children,
  initialModel,
}: {
  children: React.ReactNode;
  initialModel?: string;
}) {
  const [selectedModel, setSelectedModel] = useState(
    initialModel || 'gpt-4o-mini-2024-07-18',
  );

  // Читать из cookie при инициализации
  useEffect(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('chat-model='))
      ?.split('=')[1];

    if (cookieValue) {
      setSelectedModel(cookieValue);
    } else if (initialModel) {
      setSelectedModel(initialModel);
    }
  }, [initialModel]);

  // Обновлять cookie при изменении модели
  const handleSetSelectedModel = (model: string) => {
    setSelectedModel(model);
    document.cookie = `chat-model=${model}; path=/; max-age=31536000`;
  };

  const initializeModel = (model: string) => {
    setSelectedModel(model);
  };

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        setSelectedModel: handleSetSelectedModel,
        initializeModel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
}
