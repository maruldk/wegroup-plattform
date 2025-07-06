
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Calendar, Globe, Lock, Shield } from 'lucide-react'
import { formatRelativeTime, generateAvatarUrl, truncateText } from '@/lib/utils'

interface GroupCardProps {
  group: {
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
  showJoinButton?: boolean
  onJoin?: (groupId: string) => void
}

export function GroupCard({ group, showJoinButton = false, onJoin }: GroupCardProps) {
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async () => {
    if (!onJoin) return
    setIsJoining(true)
    try {
      await onJoin(group.id)
    } finally {
      setIsJoining(false)
    }
  }

  const getVisibilityIcon = () => {
    switch (group.visibility) {
      case 'PUBLIC':
        return <Globe className="h-4 w-4 text-green-600" />
      case 'PRIVATE':
        return <Lock className="h-4 w-4 text-red-600" />
      case 'UNLISTED':
        return <Shield className="h-4 w-4 text-orange-600" />
    }
  }

  const getJoinPolicyText = () => {
    switch (group.joinPolicy) {
      case 'OPEN':
        return 'Offen'
      case 'REQUEST':
        return 'Auf Anfrage'
      case 'INVITE_ONLY':
        return 'Nur auf Einladung'
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={group.avatar || generateAvatarUrl(group.name)} 
                alt={group.name} 
              />
              <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                <Link href={`/groups/${group.id}`} className="hover:underline">
                  {truncateText(group.name, 30)}
                </Link>
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {getVisibilityIcon()}
                <span className="text-xs text-muted-foreground">
                  {getJoinPolicyText()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {group.description && (
          <CardDescription className="text-sm leading-relaxed">
            {truncateText(group.description, 120)}
          </CardDescription>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{group.memberCount} Mitglieder</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatRelativeTime(group.createdAt)}</span>
          </div>
        </div>

        {group.category && (
          <Badge variant="secondary" className="text-xs">
            {group.category}
          </Badge>
        )}

        {group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {group.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {group.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{group.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            von {group.creator.name}
          </div>
          
          {showJoinButton && (
            <Button 
              size="sm" 
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? 'Beitritt...' : 'Beitreten'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
