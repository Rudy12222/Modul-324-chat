import { WebSocket } from 'ws';

export interface User {
  id: string;
  name: string;
  ws?: WebSocket;
}

export interface ChatHistoryMessage {
  user: User;
  message: string;
}

export interface Message {
  type: 'newUser' | 'updateUser' | 'message' | 'activeUsers' | 'typing' | 'history';
  user?: User;
  users?: User[];
  message?: string;
  messages?: ChatHistoryMessage[];
}

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T>;
  cancel: () => void;
  flush: () => void;
}
