import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
  };
}

interface QueryClientContextType {
  queryClient: QueryClient;
}

class QueryClient {
  private cache: QueryCache = {};
  private listeners: Set<() => void> = new Set();

  getQueryData(key: string) {
    const entry = this.cache[key];
    if (entry && Date.now() - entry.timestamp < 5 * 60 * 1000) {
      return entry.data;
    }
    return undefined;
  }

  setQueryData(key: string, data: any) {
    this.cache[key] = { data, timestamp: Date.now() };
    this.listeners.forEach((listener) => listener());
  }

  invalidateQueries(key: string) {
    delete this.cache[key];
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

const QueryClientContext = createContext<QueryClientContextType | undefined>(undefined);

export function QueryClientProvider({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <QueryClientContext.Provider value={{ queryClient: client }}>
      {children}
    </QueryClientContext.Provider>
  );
}

export function useQueryClient() {
  const context = useContext(QueryClientContext);
  if (!context) throw new Error('useQueryClient must be used within QueryClientProvider');
  return context.queryClient;
}

export { QueryClient };
