# WeGroup Plattform - Modul 2: Kommunikations-System Template

## GitHub Repository Information

**Repository URL:** https://github.com/maruldk/wegroup-plattform
**Branch:** main
**Aktueller Stand:** Grundsystem mit Authentifizierung, Dashboard, Event-System und **Gruppenverwaltung (Modul 1)** vollständig implementiert

## ⚠️ WICHTIGER HINWEIS: GitHub-Token

**Bevor Sie beginnen, stellen Sie sicher, dass Sie über ein gültiges GitHub Personal Access Token verfügen:**

1. **Token erstellen:** Gehen Sie zu GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Erforderliche Berechtigungen:** `repo` (Full control of private repositories)
3. **Token konfigurieren:** Fügen Sie das Token in Ihre MCP-Konfiguration ein
4. **Zugriff testen:** Verwenden Sie `github_get_file_contents` um den Repository-Zugriff zu bestätigen

**Ohne gültiges Token können Sie nicht auf das Repository zugreifen oder Änderungen vornehmen!**

## Dokumentations-Verweis

Bitte lesen Sie folgende Dokumentationsdateien aus dem Repository:

1. **`/docs/PROJECT_OVERVIEW.md`** - Gesamtarchitektur und Technologie-Stack
2. **`/IMPLEMENTATION_SUMMARY.md`** - Aktueller Implementierungsstand mit KI/ML-Features
3. **Bestehende Gruppenverwaltung analysieren:** `/app/app/groups/` und `/app/app/api/groups/`

## Modul-Spezifikation: Kommunikations-System

### Hauptfunktionen zu entwickeln:

1. **Real-time Messaging**
   - Gruppen-Chat-Funktionalität
   - Private Nachrichten zwischen Mitgliedern
   - Thread-basierte Diskussionen
   - Emoji-Reaktionen und Rich-Text-Support

2. **Benachrichtigungssystem**
   - Push-Benachrichtigungen für neue Nachrichten
   - E-Mail-Benachrichtigungen (konfigurierbar)
   - In-App-Benachrichtigungen
   - Benachrichtigungs-Präferenzen pro Gruppe

3. **Kommunikations-Dashboard**
   - Nachrichten-Übersicht
   - Ungelesene Nachrichten-Counter
   - Chat-Verlauf und Suchfunktion
   - Datei-Sharing und Media-Support

4. **Integration Features**
   - **Integration mit Modul 1 (Gruppenverwaltung):** Nahtlose Chat-Integration in Gruppendetails
   - Event-System Integration für Kommunikationsaktivitäten
   - KI-basierte Sentiment-Analyse für Gruppenstimmung
   - Automatische Moderation und Spam-Erkennung

### Technische Anforderungen:

- **Frontend:** React/Next.js mit TypeScript (bestehende Struktur erweitern)
- **Backend:** Node.js/Express mit TypeScript (bestehende API erweitern)
- **Real-time:** WebSocket/Socket.IO (bereits im System vorhanden)
- **Datenbank:** PostgreSQL mit Prisma ORM (bestehende Schema erweitern)
- **Authentifizierung:** JWT-basiert (bereits implementiert)
- **API:** RESTful Design mit bestehender OpenAPI/Swagger Dokumentation

## Kontext-Information: Bestehende Implementierung

### ✅ Bereits implementierte Features (Modul 1 - Gruppenverwaltung):

- **Vollständige Gruppenverwaltung** (`/app/app/groups/`)
  - Gruppen erstellen, bearbeiten, löschen
  - Mitgliederverwaltung mit Rollen
  - Gruppen-Dashboard mit Statistiken
  - KI-basierte Gruppenempfehlungen

- **Groups API** (`/app/app/api/groups/`)
  - CRUD-Operationen für Gruppen
  - Mitglieder-Management
  - Statistiken und Empfehlungen
  - Vollständige REST-API

- **Event-System & KI/ML Infrastructure**
  - Event-Bus-System für Real-time Updates
  - 8 ML-Modelle inklusive Sentiment-Analyse
  - WebSocket-Manager bereits implementiert
  - Automatisierte Workflows

### 🔄 Event-System Integration:
- Alle Kommunikationsaktivitäten sollen Events auslösen
- Event-Types: `message.sent`, `message.received`, `notification.created`, `chat.joined`
- Events werden für Benachrichtigungen, Analytics und KI-Features verwendet

### 🤖 KI/ML Features für Kommunikation:
- **Sentiment-Analyse:** Bereits implementiertes `SentimentAnalysisModel` nutzen
- **Automatische Moderation:** Spam- und Toxizitätserkennung
- **Smart Notifications:** KI-gesteuerte Benachrichtigungspriorisierung
- **Conversation Insights:** Gruppenstimmung und Engagement-Analyse

## Integration-Anweisungen

### 1. Modul 1 Integration (Gruppenverwaltung):
- **Chat-Integration in Gruppendetails:** Erweitern Sie `/app/app/groups/[id]/page.tsx`
- **Gruppen-API erweitern:** Nutzen Sie bestehende `/app/app/api/groups/` Struktur
- **Bestehende Komponenten nutzen:** Verwenden Sie GroupCard, GroupStats etc.
- **Konsistente UI/UX:** Folgen Sie dem etablierten Design-System

### 2. Code-Integration:
- **Neue Ordnerstruktur:** `/app/app/messages/`, `/app/components/messages/`
- **API-Erweiterung:** `/app/app/api/messages/`, `/app/app/api/notifications/`
- **WebSocket-Integration:** Nutzen Sie bestehenden WebSocketManager
- **Event-System:** Integrieren Sie mit bestehendem Event-Bus

### 3. Datenbank-Integration:
- **Schema erweitern:** Neue Tabellen für Messages, Notifications, ChatRooms
- **Beziehungen:** Verknüpfen Sie mit bestehenden User- und Group-Tabellen
- **Migrationen:** Erstellen Sie Prisma-Migrationen für neue Strukturen

### 4. Frontend-Integration:
- **Navigation erweitern:** Fügen Sie Kommunikations-Links zum Dashboard hinzu
- **Komponenten-Bibliothek:** Nutzen Sie bestehende UI-Komponenten
- **Real-time Updates:** Integrieren Sie WebSocket-basierte Live-Updates
- **Responsive Design:** Konsistent mit bestehender Mobile-First-Architektur

### 5. API-Integration:
- **RESTful Endpoints:** `/api/messages`, `/api/notifications`, `/api/chats`
- **WebSocket Events:** Real-time Message-Delivery
- **Authentifizierung:** Nutzen Sie bestehende JWT-Middleware
- **Rate Limiting:** Implementieren Sie für Message-APIs

## Entwicklungsreihenfolge (Empfohlen):

1. **Phase 1:** Datenbank-Schema für Messages und Notifications
2. **Phase 2:** Backend API-Endpoints für Messaging
3. **Phase 3:** WebSocket-Integration für Real-time Communication
4. **Phase 4:** Frontend-Komponenten für Chat-Interface
5. **Phase 5:** Integration in bestehende Gruppenverwaltung
6. **Phase 6:** Benachrichtigungssystem und Präferenzen
7. **Phase 7:** KI-Features (Sentiment-Analyse, Moderation)
8. **Phase 8:** Testing und Performance-Optimierung

## Spezifische Integrationspunkte mit Modul 1:

### Gruppenverwaltung erweitern:
```typescript
// In /app/app/groups/[id]/page.tsx
// Fügen Sie Chat-Tab zur Gruppendetail-Ansicht hinzu
<Tabs>
  <TabsList>
    <TabsTrigger value="overview">Übersicht</TabsTrigger>
    <TabsTrigger value="members">Mitglieder</TabsTrigger>
    <TabsTrigger value="chat">Chat</TabsTrigger> {/* NEU */}
    <TabsTrigger value="settings">Einstellungen</TabsTrigger>
  </TabsList>
</Tabs>
```

### API-Erweiterung:
```typescript
// Erweitern Sie /app/app/api/groups/[id]/route.ts
// Fügen Sie Chat-Statistiken hinzu
```

### Event-Integration:
```typescript
// Nutzen Sie bestehenden EventBus für Kommunikations-Events
eventBus.emit('message.sent', {
  groupId,
  userId,
  messageId,
  content: message.content
});
```

## Wichtige Hinweise:

- **Konsistenz:** Folgen Sie der etablierten Code-Struktur von Modul 1
- **Performance:** Optimieren Sie für Real-time Communication (WebSocket)
- **Skalierbarkeit:** Berücksichtigen Sie große Gruppen mit vielen Nachrichten
- **Sicherheit:** Implementieren Sie Message-Verschlüsselung und Moderation
- **Benutzerfreundlichkeit:** Intuitive Chat-Interfaces mit modernen Features
- **Integration:** Nahtlose Verbindung mit bestehender Gruppenverwaltung

## Bestehende Ressourcen nutzen:

### UI-Komponenten (bereits verfügbar):
- Button, Input, Card, Tabs, Dialog
- Toast-Notifications
- Loading-States und Skeleton-Components

### Services (bereits implementiert):
- WebSocketManager für Real-time Updates
- EventBus für System-Events
- MLModelService für KI-Features
- Authentifizierungs-Middleware

### Styling:
- Tailwind CSS mit konsistentem Design-System
- Responsive Grid-Layouts
- Dark/Light Mode Support

---

**Nächste Schritte:**
1. GitHub-Token konfigurieren und Repository-Zugriff testen
2. Bestehende Gruppenverwaltung analysieren (`/app/app/groups/`)
3. Datenbank-Schema für Kommunikation planen
4. Mit Phase 1 (Datenbank-Schema) beginnen
5. Regelmäßige Integration mit Modul 1 sicherstellen

**Erfolg messen:**
- Nahtlose Integration mit bestehender Gruppenverwaltung
- Real-time Message-Delivery < 100ms
- Skalierbarkeit für 1000+ gleichzeitige Benutzer
- Konsistente UI/UX mit Modul 1