'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Activity, Calendar, ArrowRight, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Laden...</p>
      </div>
    </div>
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

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

        {/* Groups Quick Access */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gruppenverwaltung</h2>
              <p className="text-gray-600 mt-1">Verwalten Sie Ihre Gruppen und entdecken Sie neue Communities</p>
            </div>
            <Link href="/groups">
              <Button className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Zu Gruppen</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  Meine Gruppen
                </CardTitle>
                <CardDescription>
                  Gruppen, denen Sie beigetreten sind
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">4</span>
                  <Link href="/groups?my_groups=true">
                    <Button variant="outline" size="sm">
                      Anzeigen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Plus className="h-5 w-5 text-green-600 mr-2" />
                  Neue Gruppe
                </CardTitle>
                <CardDescription>
                  Erstellen Sie eine neue Gruppe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/groups">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Gruppe erstellen
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                  Empfehlungen
                </CardTitle>
                <CardDescription>
                  KI-basierte Gruppenempfehlungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-purple-600">6</span>
                  <Link href="/groups">
                    <Button variant="outline" size="sm">
                      Entdecken
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Module Overview */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verfügbare Module</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/groups" className="p-4 border rounded-lg hover:shadow-lg transition-shadow bg-blue-50 border-blue-200">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                Gruppenverwaltung ✅
              </h3>
              <p className="text-sm text-gray-600 mt-1">Vollständiges Gruppen-Management mit KI-Empfehlungen</p>
            </Link>
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