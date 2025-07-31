'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface ModelContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export const ModelContext = createContext<ModelContextType | undefined>(
  undefined,
);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini-2024-07-18');

  // Читать из cookie при инициализации
  useEffect(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('chat-model='))
      ?.split('=')[1];

    if (cookieValue) {
      setSelectedModel(cookieValue);
    }
  }, []);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
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
