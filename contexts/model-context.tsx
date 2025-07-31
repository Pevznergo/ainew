import { createContext } from 'react';

export const ModelContext = createContext({
  model: 'gpt-4o-mini-2024-07-18',
  setModel: (model: string) => {},
});
