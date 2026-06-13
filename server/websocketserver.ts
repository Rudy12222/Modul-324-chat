import { Server } from 'http';
import { Server as WSServer, WebSocket, RawData } from 'ws';
import { ChatHistoryMessage, DebouncedFunction, Message, User } from './interfaces';
import { debounce } from 'lodash';

let websocketServer: WSServer;

const activeUsers: User[] = [];
const typingUsers: User[] = [];
const messageHistory: ChatHistoryMessage[] = [];
const typingUsersDebounced: { [key: string]: DebouncedFunction<() => void> } = {};

const getPublicUsers = (users: User[]) => users.map(({ id, name }) => ({ id, name }));
const getPublicUser = (user: User) => ({ id: user.id, name: user.name });

const broadcastMessage = (message: Message) => {
  websocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

const initializeWebsocketServer = (server: Server) => {
  websocketServer = new WSServer({ server });
  websocketServer.on('connection', onConnection);
};

const onConnection = (ws: WebSocket) => {
  console.log('New websocket connection');
  ws.on('message', (message) => onMessage(ws, message));
  ws.on('close', () => onClose(ws));
};

const onClose = (ws: WebSocket) => {
  console.log('Websocket connection closed');
  const userIndex = activeUsers.findIndex((user) => user.ws === ws);
  if (userIndex !== -1) {
    console.log('User disconnected:', activeUsers[userIndex].name);
    const removedUser = activeUsers.splice(userIndex, 1);
    removeTypingStatus(removedUser[0].id);
    delete typingUsersDebounced[removedUser[0].id];
    broadcastMessage({
      type: 'activeUsers',
      users: getPublicUsers(activeUsers),
    });
  }
};

const removeTypingStatus = (userId: string) => {
  const userIndex = typingUsers.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    typingUsers.splice(userIndex, 1);
    broadcastMessage({
      type: 'typing',
      users: getPublicUsers(typingUsers),
    });
  }
};

const onMessage = (ws: WebSocket, message: RawData) => {
  const messageObject = JSON.parse(message.toString()) as Message;
  console.log('Message received', messageObject);
  switch (messageObject.type) {
    case 'newUser':
      if (
        !messageObject.user?.id ||
        !messageObject.user.name ||
        activeUsers.find((user) => user.id === messageObject.user?.id)
      ) {
        return;
      }

      activeUsers.push({ ...messageObject.user, ws });
      console.log('New user connected:', messageObject.user.name);
      ws.send(
        JSON.stringify({
          type: 'history',
          messages: messageHistory,
        } satisfies Message),
      );
      broadcastMessage({
        type: 'activeUsers',
        users: getPublicUsers(activeUsers),
      });
      break;
    case 'updateUser': {
      if (!messageObject.user?.id || !messageObject.user.name) return;

      const userToUpdate = activeUsers.find((user) => user.ws === ws);
      if (!userToUpdate) return;

      userToUpdate.name = messageObject.user.name;

      const typingUser = typingUsers.find((user) => user.id === userToUpdate.id);
      if (typingUser) {
        typingUser.name = userToUpdate.name;
      }

      messageHistory.forEach((historyMessage) => {
        if (historyMessage.user.id === userToUpdate.id) {
          historyMessage.user.name = userToUpdate.name;
        }
      });

      broadcastMessage({
        type: 'activeUsers',
        users: getPublicUsers(activeUsers),
      });

      if (typingUser) {
        broadcastMessage({
          type: 'typing',
          users: getPublicUsers(typingUsers),
        });
      }

      break;
    }
    case 'message':
      if (!messageObject.user?.id || !messageObject.user.name || !messageObject.message) return;

      removeTypingStatus(messageObject.user.id);
      messageHistory.push({
        user: getPublicUser(messageObject.user),
        message: messageObject.message,
      });
      broadcastMessage({
        type: 'message',
        user: getPublicUser(messageObject.user),
        message: messageObject.message,
      });
      break;
    case 'typing': {
      if (!messageObject.user?.id || !messageObject.user.name) return;

      const typingUserId = messageObject.user.id;
      const typingUserName = messageObject.user.name;
      const existingUser = typingUsers.find((user) => user.id === typingUserId);
      if (existingUser) {
        typingUsersDebounced[typingUserId]?.cancel();
      } else {
        typingUsers.push({ id: typingUserId, name: typingUserName });
        broadcastMessage({
          type: 'typing',
          users: getPublicUsers(typingUsers),
        });
      }

      typingUsersDebounced[typingUserId] = debounce(() => {
        removeTypingStatus(typingUserId);
      }, 2000);

      typingUsersDebounced[typingUserId]();
      break;
    }
    default:
      break;
  }
};

const resetChatState = () => {
  activeUsers.length = 0;
  typingUsers.length = 0;
  messageHistory.length = 0;
  Object.values(typingUsersDebounced).forEach((debouncedFunction) => debouncedFunction.cancel());
  Object.keys(typingUsersDebounced).forEach((key) => {
    delete typingUsersDebounced[key];
  });
};

export { initializeWebsocketServer, resetChatState };
