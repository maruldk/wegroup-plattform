
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Globe, 
  Lock, 
  Shield, 
  Settings,
  UserPlus,
  Crown,
  Star
} from 'lucide-react'
import { formatRelativeTime, generateAvatarUrl } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface GroupMember {
  id: string
  userId: string
  status: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  role: {
    id: string
    name: string
    color?: string
    priority: number
  } | null
}

interface GroupDetails {
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
    id: string
    name: string
    email: string
  }
  members: GroupMember[]
  avatar?: string
}

interface GroupPageProps {
  params: { id: string }
}

export default function GroupPage({ params }: GroupPageProps) {
  const { data: session, status } = useSession()
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview')
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroup()
    }
  }, [status, params.id])

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}`)
      const result = await response.json()
      
      if (result.success) {
        setGroup(result.data)
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Gruppe nicht gefunden',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching group:', error)
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Gruppe',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getVisibilityIcon = () => {
    if (!group) return null
    switch (group.visibility) {
      case 'PUBLIC':
        return <Globe className="h-4 w-4 text-green-600" />
      case 'PRIVATE':
        return <Lock className="h-4 w-4 text-red-600" />
      case 'UNLISTED':
        return <Shield className="h-4 w-4 text-orange-600" />
    }
  }

  const getVisibilityText = () => {
    if (!group) return ''
    switch (group.visibility) {
      case 'PUBLIC':
        return 'Öffentlich'
      case 'PRIVATE':
        return 'Privat'
      case 'UNLISTED':
        return 'Ungelistet'
    }
  }

  const getJoinPolicyText = () => {
    if (!group) return ''
    switch (group.joinPolicy) {
      case 'OPEN':
        return 'Offen für alle'
      case 'REQUEST':
        return 'Beitritt auf Anfrage'
      case 'INVITE_ONLY':
        return 'Nur auf Einladung'
    }
  }

  const isUserMember = () => {
    if (!group || !session?.user?.email) return false
    return group.members.some(member => member.user.email === session?.user?.email)
  }

  const getUserRole = () => {
    if (!group || !session?.user?.email) return null
    const member = group.members.find(member => member.user.email === session?.user?.email)
    return member?.role
  }

  if (status === 'loading' || isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Laden...</p>
      </div>
    </div>
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Gruppe nicht gefunden
            </h3>
            <p className="text-gray-500 mb-4">
              Die angeforderte Gruppe existiert nicht oder Sie haben keine Berechtigung, sie zu sehen.
            </p>
            <Link href="/groups">
              <Button>Zurück zu den Gruppen</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentUserRole = getUserRole()
  const canManage = currentUserRole?.name === 'Admin' || currentUserRole?.name === 'Moderator'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4 mb-6">
              <Link href="/groups">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zu Gruppen
                </Button>
              </Link>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={group.avatar || generateAvatarUrl(group.name)} 
                    alt={group.name} 
                  />
                  <AvatarFallback className="text-2xl">
                    {group.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                    {isUserMember() && currentUserRole && (
                      <Badge 
                        style={{ backgroundColor: currentUserRole.color || '#3b82f6' }}
                        className="text-white"
                      >
                        {currentUserRole.name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      {getVisibilityIcon()}
                      <span>{getVisibilityText()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{group.memberCount} Mitglieder</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Erstellt {formatRelativeTime(group.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mt-2">{getJoinPolicyText()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!isUserMember() && group.joinPolicy === 'OPEN' && (
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Beitreten
                  </Button>
                )}
                {canManage && (
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Verwalten
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'members', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'overview' && 'Übersicht'}
                  {tab === 'members' && 'Mitglieder'}
                  {tab === 'settings' && 'Einstellungen'}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Über diese Gruppe</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {group.description || 'Keine Beschreibung verfügbar.'}
                  </p>
                  
                  {group.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {group.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Letzte Aktivitäten</CardTitle>
                  <CardDescription>
                    Neueste Ereignisse in dieser Gruppe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500">Keine aktuellen Aktivitäten</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Group Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Gruppeninformationen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Ersteller</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">{group.creator.name}</span>
                    </div>
                  </div>

                  {group.category && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Kategorie</h4>
                      <Badge variant="secondary" className="mt-1">
                        {group.category}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Erstellt am</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(group.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Top Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Mitglieder</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={member.user.avatar || generateAvatarUrl(member.user.name || member.user.email)} 
                            alt={member.user.name || member.user.email} 
                          />
                          <AvatarFallback className="text-xs">
                            {(member.user.name || member.user.email).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.user.name || member.user.email}
                          </p>
                          {member.role && (
                            <p className="text-xs text-gray-500">{member.role.name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <Card>
            <CardHeader>
              <CardTitle>Mitglieder ({group.memberCount})</CardTitle>
              <CardDescription>
                Alle Mitglieder dieser Gruppe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={member.user.avatar || generateAvatarUrl(member.user.name || member.user.email)} 
                          alt={member.user.name || member.user.email} 
                        />
                        <AvatarFallback>
                          {(member.user.name || member.user.email).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.user.name || member.user.email}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {member.role && (
                            <Badge 
                              style={{ backgroundColor: member.role.color || '#3b82f6' }}
                              className="text-white text-xs"
                            >
                              {member.role.name}
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">
                            Beigetreten {formatRelativeTime(member.joinedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {member.user.id === group.creator.id && (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Gruppeneinstellungen</CardTitle>
              <CardDescription>
                Verwalten Sie die Einstellungen dieser Gruppe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canManage ? (
                <div className="text-center py-8">
                  <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Einstellungen werden noch entwickelt.</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Sie haben keine Berechtigung, die Gruppeneinstellungen zu verwalten.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
