# M324 Chat Projekt

Ein einfaches Chat-Projekt mit WebSocket, Darkmode, Online-Benutzern, Schreibanzeige, Chat-Verlauf und `/healthcheck`.

## Lokal starten

```powershell
npm install
npm run dev
```

Danach im Browser öffnen:

```text
http://localhost:3000
```

## Prüfen

```powershell
npm run lint
npm test
npm run build
```

## Abgabe

Die App ist vorbereitet für GitHub Actions, Docker, Kubernetes und Uptime Kuma.

## Screenshots

Im Ordner `screenshots` sind Nachweise für die Abgabe abgelegt:

- `Actions server.png`: self-hosted GitHub Actions Runner
- `Healthcheck.png`: erfolgreicher `/healthcheck` Aufruf
- `CICD Pipeline.png`: Prozessübersicht der CI/CD Pipeline
- `Branching Strategie.png`: Prozessübersicht der Branching Strategie
