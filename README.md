# WeGroup Communication Platform

Eine moderne, echtzeitfähige Kommunikationsplattform für Teams, entwickelt mit Next.js 14, TypeScript, Prisma und WebSocket-Technologie.

## 🚀 Features

### 💬 **Real-time Messaging**
- Sofortige Nachrichtenübertragung mit WebSocket
- Typing-Indikatoren und Lesebestätigungen
- Message-Reaktionen und Threading
- Rich-Text-Unterstützung

### 👥 **Team Collaboration**
- Direkte Nachrichten (1:1)
- Gruppenchats und Kanäle
- Benutzer-Status (Online, Abwesend, Beschäftigt, Offline)
- Teilnehmer-Rollen (Admin, Moderator, Mitglied)

### 🔔 **Smart Notifications**
- Intelligentes Benachrichtigungssystem
- Ungelesene Nachrichten-Zähler
- Push-Benachrichtigungen
- Anpassbare Benachrichtigungseinstellungen

### 🛡️ **Sicherheit & Datenschutz**
- Sichere Dateiübertragung
- Benutzer-Authentifizierung
- Datenschutz-konforme Implementierung
- Sichere API-Endpunkte

### 📱 **Responsive Design**
- Mobile-first Ansatz
- Responsive UI-Komponenten
- Touch-optimierte Bedienung
- Cross-platform Kompatibilität

## 🏗️ Architektur

### **Frontend-Komponenten** (`src/components/communication/`)
- `chat-window.tsx` - Hauptchat-Interface
- `message-input.tsx` - Nachrichteneingabe mit Emoji-Support
- `message-list.tsx` - Nachrichtenliste mit Reaktionen
- `conversation-sidebar.tsx` - Konversationsübersicht
- `user-status.tsx` - Online-Status-Anzeige
- `notification-badge.tsx` - Benachrichtigungs-Badges

### **API-Endpunkte** (`src/app/api/communication/`)
- `conversations/route.ts` - Konversations-Management
- `conversations/[id]/messages/route.ts` - Nachrichten pro Konversation
- `messages/route.ts` - Nachrichten-CRUD-Operationen
- `websocket/route.ts` - WebSocket-Handler

### **Seiten/Routen** (`src/app/communication/`)
- `page.tsx` - Hauptkommunikationsseite
- `conversations/[id]/page.tsx` - Einzelne Konversationsansicht
- `layout.tsx` - Layout für Kommunikationsbereich

### **Event-Handler & Utils** (`src/lib/communication/`)
- `websocket-handler.ts` - WebSocket-Logik und Event-Management
- `message-events.ts` - Event-System für Nachrichten
- `notification-service.ts` - Benachrichtigungsdienst

### **Datenbank** (`prisma/schema.prisma`)
- User Model - Benutzer-Management
- Conversation Model - Konversationen
- Message Model - Nachrichten
- MessageAttachment Model - Dateianhänge
- MessageReaction Model - Reaktionen
- Notification Model - Benachrichtigungen

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (entwicklung), PostgreSQL (produktion)
- **Real-time**: WebSocket, Socket.io
- **State Management**: React Hooks, Event System
- **Build Tools**: Turbopack, ESLint

## 📦 Installation

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn
- Git

### Setup

1. **Repository klonen**
```bash
git clone https://github.com/maruldk/wegroup-communication.git
cd wegroup-communication
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren**
```bash
cp .env.example .env
# Bearbeite .env mit deinen Einstellungen
```

4. **Datenbank initialisieren**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Entwicklungsserver starten**
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## 🚀 Deployment

### Vercel (Empfohlen)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t wegroup-communication .
docker run -p 3000:3000 wegroup-communication
```

## 📝 API-Dokumentation

### Konversationen
- `GET /api/communication/conversations` - Alle Konversationen abrufen
- `POST /api/communication/conversations` - Neue Konversation erstellen

### Nachrichten
- `GET /api/communication/conversations/[id]/messages` - Nachrichten abrufen
- `POST /api/communication/conversations/[id]/messages` - Nachricht senden
- `PUT /api/communication/messages` - Nachricht bearbeiten
- `DELETE /api/communication/messages` - Nachricht löschen

### WebSocket Events
- `authenticate` - Benutzer-Authentifizierung
- `join-conversation` - Konversation beitreten
- `send-message` - Nachricht senden
- `typing` - Typing-Indikator
- `add-reaction` - Reaktion hinzufügen

## 🧪 Testing

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e

# Coverage Report
npm run test:coverage
```

## 📊 Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **WebSocket Latency**: < 100ms
- **Message Delivery**: < 50ms

## 🔧 Konfiguration

### WebSocket-Einstellungen
```typescript
// .env
WS_PORT=3001
WS_HOST=localhost
```

### Datei-Upload
```typescript
// .env
MAX_FILE_SIZE=10485760  // 10MB
UPLOAD_DIR=./uploads
```

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne eine Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 🙏 Acknowledgments

- Next.js Team für das großartige Framework
- Prisma Team für die ausgezeichnete ORM
- Tailwind CSS für das Styling-System
- Socket.io für WebSocket-Implementierung

## 📞 Support

Bei Fragen oder Problemen:
- Erstelle ein [Issue](https://github.com/maruldk/wegroup-communication/issues)
- Kontaktiere das Entwicklungsteam
- Schaue in die [Dokumentation](https://github.com/maruldk/wegroup-communication/wiki)

---

**WeGroup Communication Platform** - Verbinde dein Team, steigere die Produktivität! 🚀