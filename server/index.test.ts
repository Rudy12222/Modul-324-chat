import http, { IncomingMessage } from 'http';
import { Server } from 'http';
import { RawData, WebSocket } from 'ws';
import { startServer, waitForSocketState } from './index';
import { ChatHistoryMessage, Message, User } from './interfaces';
import { resetChatState } from './websocketserver';
const port = 3100;

const getHealthcheck = () =>
  new Promise<{ statusCode?: number; body: string }>((resolve, reject) => {
    const request = http.get(`http://localhost:${port}/healthcheck`, (response: IncomingMessage) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk.toString();
      });

      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          body,
        });
      });
    });

    request.on('error', reject);
  });

describe('WebSocket Server', () => {
  let server: Server;
  let user: User;
  let secondUser: User;
  beforeAll(async () => {
    user = {
      id: '1',
      name: 'Test User',
    };
    secondUser = {
      id: '2',
      name: 'Second User',
    };
    server = await startServer(port);
  });
  afterAll(() => server.close());
  beforeEach(() => resetChatState());

  test('GET /healthcheck returns OK', async () => {
    const response = await getHealthcheck();

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('OK');
  });

  test('Send "New User" from Client', async () => {
    const testMessage: Message = {
      type: 'newUser',
      user: user,
    };
    const client = new WebSocket(`ws://localhost:${port}`);
    await waitForSocketState(client, client.OPEN);
    const responseMessages: Message[] = [];
    client.on('message', (data: RawData) => {
      responseMessages.push(JSON.parse(data.toString()));
      if (responseMessages.some((message) => message.type === 'activeUsers')) {
        client.close();
      }
    });
    client.send(JSON.stringify(testMessage));
    await waitForSocketState(client, client.CLOSED);
    const expectedMessage: Message = {
      type: 'activeUsers',
      users: [user],
    };
    expect(responseMessages[0]).toEqual({ type: 'history', messages: [] });
    expect(responseMessages[1]).toEqual(expectedMessage);
  });
  test('Send "Message" from Client', async () => {
    const testMessage: Message = {
      type: 'message',
      user: user,
      message: 'Test Message',
    };
    const client = new WebSocket(`ws://localhost:${port}`);
    await waitForSocketState(client, client.OPEN);
    let responseMessage: Message | undefined;
    client.on('message', (data: RawData) => {
      responseMessage = JSON.parse(data.toString());
      client.close();
    });
    client.send(JSON.stringify(testMessage));
    await waitForSocketState(client, client.CLOSED);
    expect(responseMessage).toEqual(testMessage);
  });
  test('Send "typing" from Client and wait until not typing timeout', async () => {
    const testMessage: Message = {
      type: 'typing',
      user: user,
    };
    const client = new WebSocket(`ws://localhost:${port}`);
    await waitForSocketState(client, client.OPEN);
    const responseMessages: Message[] = [];
    let messageCounter = 0;
    client.on('message', (data: RawData) => {
      responseMessages.push(JSON.parse(data.toString()));
      messageCounter++;
      if (messageCounter >= 2) {
        client.close();
      }
    });
    client.send(JSON.stringify(testMessage));
    await waitForSocketState(client, client.CLOSED);
    const expectedMessage: Message = {
      type: 'typing',
      users: [user],
    };
    expect(responseMessages[0]).toEqual(expectedMessage);
    expect(responseMessages[1]).toEqual({ type: 'typing', users: [] });
  });

  test('New users receive the existing chat history', async () => {
    const firstClient = new WebSocket(`ws://localhost:${port}`);
    await waitForSocketState(firstClient, firstClient.OPEN);

    const firstClientMessages: Message[] = [];
    firstClient.on('message', (data: RawData) => {
      firstClientMessages.push(JSON.parse(data.toString()));
    });

    firstClient.send(
      JSON.stringify({
        type: 'newUser',
        user,
      } satisfies Message),
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const historyMessage: ChatHistoryMessage = {
      user,
      message: 'Hallo zusammen',
    };

    firstClient.send(
      JSON.stringify({
        type: 'message',
        ...historyMessage,
      } satisfies Message),
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const secondClient = new WebSocket(`ws://localhost:${port}`);
    await waitForSocketState(secondClient, secondClient.OPEN);

    const secondClientMessages: Message[] = [];
    secondClient.on('message', (data: RawData) => {
      secondClientMessages.push(JSON.parse(data.toString()));
      if (secondClientMessages.some((message) => message.type === 'activeUsers')) {
        secondClient.close();
      }
    });

    secondClient.send(
      JSON.stringify({
        type: 'newUser',
        user: secondUser,
      } satisfies Message),
    );

    await waitForSocketState(secondClient, secondClient.CLOSED);
    firstClient.close();
    await waitForSocketState(firstClient, firstClient.CLOSED);

    expect(secondClientMessages[0]).toEqual({
      type: 'history',
      messages: [historyMessage],
    });
  });
});
