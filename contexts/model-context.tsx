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
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация с внешним значением
  const initializeModel = (model: string) => {
    if (!isInitialized) {
      setSelectedModel(model);
      setIsInitialized(true);
    }
  };

  // Читать из cookie при инициализации только если нет внешнего значения
  useEffect(() => {
    if (isInitialized) return;

    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('chat-model='))
      ?.split('=')[1];

    if (cookieValue && !initialModel) {
      setSelectedModel(cookieValue);
    }
    setIsInitialized(true);
  }, [initialModel, isInitialized]);

  return (
    <ModelContext.Provider
      value={{ selectedModel, setSelectedModel, initializeModel }}
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
