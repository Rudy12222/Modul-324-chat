import express from 'express';
import http, { Server } from 'http';
import livereload from 'livereload';
import connectLiveReload from 'connect-livereload';
import { Request, Response } from 'express';
import path from 'path';
import { initializeWebsocketServer } from './websocketserver';
import { WebSocket } from 'ws';

const app = express();
const server = http.createServer(app);
const clientDirectory = path.join(process.cwd(), 'client');

const env = process.env.NODE_ENV || 'development';
if (env !== 'production' && env !== 'test') {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
      liveReloadServer.refresh('/');
    }, 100);
  });
  app.use(connectLiveReload());
}

app.use(express.static(clientDirectory));

// This endpoint is used by monitoring tools like Uptime Kuma.
app.get('/healthcheck', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientDirectory, 'index.html'));
});

initializeWebsocketServer(server);

const startServer = (serverPort: number) =>
  new Promise<Server>((resolve) => {
    server.listen(serverPort, () => {
      console.log(`Express Server started on port ${serverPort} as '${env}' Environment`);
      resolve(server);
    });
  });

if (env !== 'test') {
  const serverPort = Number.parseInt(process.env.PORT || '3000', 10);
  void startServer(serverPort);
}

const waitForSocketState = (socket: WebSocket, state: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      if (socket.readyState === state) {
        resolve();
      } else {
        void waitForSocketState(socket, state).then(resolve);
      }
    }, 5);
  });

export { app, startServer, waitForSocketState };
