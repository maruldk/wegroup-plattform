export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WeGroup Platform Dashboard</h1>
          <p className="text-gray-600 mt-2">Willkommen bei der modularen Plattform für Gruppen- und Projektmanagement</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktive Benutzer</p>
                <p className="text-3xl font-bold text-blue-600">8</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Laufende Projekte</p>
                <p className="text-3xl font-bold text-green-600">4</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offene Aufgaben</p>
                <p className="text-3xl font-bold text-orange-600">12</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-orange-600 rounded"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Module verfügbar</p>
                <p className="text-3xl font-bold text-purple-600">57+</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System-Status</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Datenbank: PostgreSQL - Verbunden ✓</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">API Services: Alle Module aktiv ✓</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Authentifizierung: NextAuth.js konfiguriert ✓</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Demo-Daten: 8 Benutzer, 4 Gruppen, 4 Projekte geladen ✓</span>
            </div>
          </div>
        </div>

        {/* Module Overview */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verfügbare Module</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900">Kern-Module (4)</h3>
              <p className="text-sm text-gray-600">Benutzer-, Gruppen-, Mandantenverwaltung</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900">Kommunikation (5)</h3>
              <p className="text-sm text-gray-600">Nachrichten, Benachrichtigungen, Forum</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900">Event-Management (3)</h3>
              <p className="text-sm text-gray-600">Veranstaltungen, Termine, Ressourcen</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900">Projekte (3)</h3>
              <p className="text-sm text-gray-600">Projektplanung, Aufgaben, Zeiterfassung</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900">Analytics (4)</h3>
              <p className="text-sm text-gray-600">Berichte, KPIs, Statistiken</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900">KI-Module (4)</h3>
              <p className="text-sm text-gray-600">KI-Assistent, Automatisierung</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}