
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GroupCard } from '@/components/groups/group-card'
import { GroupCreateForm } from '@/components/groups/group-create-form'
import { GroupStats } from '@/components/groups/group-stats'
import { GroupRecommendations } from '@/components/groups/group-recommendations'
import { Plus, Search, Filter, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Group {
  id: string
  name: string
  description?: string
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  joinPolicy: 'OPEN' | 'REQUEST' | 'INVITE_ONLY'
  category?: string
  tags: string[]
  memberCount: number
  createdAt: string
  creator: {
    name: string
    email: string
  }
  avatar?: string
}

export default function GroupsPage() {
  const { data: session, status } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'my-groups'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroups()
    }
  }, [status, selectedFilter, searchTerm])

  const fetchGroups = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedFilter === 'my-groups') params.append('my_groups', 'true')
      
      const response = await fetch(`/api/groups?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setGroups(result.data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session?.user?.email
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Erfolgreich beigetreten',
          description: 'Sie sind der Gruppe erfolgreich beigetreten.',
        })
        fetchGroups() // Refresh the groups list
      } else {
        toast({
          title: 'Beitritt fehlgeschlagen',
          description: result.error || 'Fehler beim Beitritt zur Gruppe',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Laden...</p>
      </div>
    </div>
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gruppen-Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Entdecken Sie Gemeinschaften und verwalten Sie Ihre Gruppenmitgliedschaften
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Neue Gruppe erstellen</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Section */}
        <div className="mb-8">
          <GroupStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Nach Gruppen suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setSelectedFilter('all')}
                        size="sm"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Alle Gruppen
                      </Button>
                      <Button
                        variant={selectedFilter === 'my-groups' ? 'default' : 'outline'}
                        onClick={() => setSelectedFilter('my-groups')}
                        size="sm"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Meine Gruppen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Groups Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedFilter === 'my-groups' ? 'Keine Gruppen gefunden' : 'Keine Gruppen verfügbar'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {selectedFilter === 'my-groups' 
                      ? 'Sie sind noch keiner Gruppe beigetreten.' 
                      : 'Es wurden keine Gruppen gefunden, die Ihren Suchkriterien entsprechen.'}
                  </p>
                  {selectedFilter === 'my-groups' && (
                    <Button onClick={() => setSelectedFilter('all')}>
                      Alle Gruppen durchsuchen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    showJoinButton={selectedFilter !== 'my-groups'}
                    onJoin={handleJoinGroup}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <GroupRecommendations />
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <GroupCreateForm
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchGroups}
      />
    </div>
  )
}
