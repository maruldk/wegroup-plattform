
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles, Users, ArrowRight, X } from 'lucide-react'
import { generateAvatarUrl } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Recommendation {
  id: string
  confidence: number
  reason: string
  status: 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'REJECTED'
  group: {
    id: string
    name: string
    description?: string
    visibility: string
    joinPolicy: string
    category?: string
    tags: string[]
    memberCount: number
    avatar?: string
  }
}

export function GroupRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/groups/recommendations?limit=6')
      const result = await response.json()
      
      if (result.success) {
        setRecommendations(result.data)
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecommendationAction = async (recommendationId: string, action: 'viewed' | 'accepted' | 'rejected') => {
    try {
      const response = await fetch('/api/groups/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendationId,
          action
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Remove the recommendation from the list
        setRecommendations(prev => prev.filter(r => r.id !== recommendationId))
        
        if (action === 'accepted') {
          toast({
            title: 'Empfehlung angenommen',
            description: 'Sie können der Gruppe jetzt beitreten.',
          })
        }
      }
    } catch (error) {
      console.error('Error updating recommendation:', error)
    }
  }

  const joinGroup = async (groupId: string, recommendationId: string) => {
    try {
      // First mark as accepted
      await handleRecommendationAction(recommendationId, 'accepted')

      // Then attempt to join the group
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // The API will use the current user's email from session
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Erfolgreich beigetreten',
          description: 'Sie sind der Gruppe erfolgreich beigetreten.',
        })
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">KI-Empfehlungen</CardTitle>
          </div>
          <CardDescription>
            Gruppen, die für Sie interessant sein könnten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">KI-Empfehlungen</CardTitle>
          </div>
          <CardDescription>
            Gruppen, die für Sie interessant sein könnten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Keine Empfehlungen verfügbar</p>
            <p className="text-sm text-gray-400">
              Treten Sie mehr Gruppen bei, um personalisierte Empfehlungen zu erhalten.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">KI-Empfehlungen</CardTitle>
        </div>
        <CardDescription>
          Basierend auf Ihren Interessen und Aktivitäten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={recommendation.group.avatar || generateAvatarUrl(recommendation.group.name)} 
                      alt={recommendation.group.name} 
                    />
                    <AvatarFallback>
                      {recommendation.group.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                        {recommendation.group.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(recommendation.confidence * 100)}% Match
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {recommendation.group.description || recommendation.reason}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {recommendation.group.memberCount}
                          </span>
                        </div>
                        {recommendation.group.category && (
                          <Badge variant="secondary" className="text-xs">
                            {recommendation.group.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => joinGroup(recommendation.group.id, recommendation.id)}
                    className="text-xs"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Beitreten
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRecommendationAction(recommendation.id, 'rejected')}
                    className="text-xs p-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Empfehlungen werden durch KI basierend auf Ihren Gruppenaktivitäten generiert
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
