import { createContext, useContext } from 'react';

export interface RouterContextType {
  currentPath: string;
  searchParams: URLSearchParams;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

export const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  searchParams: new URLSearchParams(),
  navigate: () => {},
});

export const useRouter = () => useContext(RouterContext);
