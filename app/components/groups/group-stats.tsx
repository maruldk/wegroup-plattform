
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Activity, Calendar } from 'lucide-react'

interface GroupStatsData {
  totalGroups: number
  publicGroups: number
  totalMembers: number
  activeGroups: number
  userGroupsCount: number
  recentActivity: number
  averageMembersPerGroup: number
  categoryStats: Array<{
    category: string
    count: number
  }>
  topGroups: Array<{
    id: string
    name: string
    memberCount: number
    activityScore: number
    category?: string
  }>
}

interface AnimatedNumberProps {
  value: number
  duration?: number
}

function AnimatedNumber({ value, duration = 2000 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let startValue = 0

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime
        startValue = displayValue
      }

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      
      const currentValue = Math.floor(startValue + (value - startValue) * easeOutExpo)
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{displayValue}</span>
}

export function GroupStats() {
  const [stats, setStats] = useState<GroupStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/groups/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Statistiken konnten nicht geladen werden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gruppen gesamt
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedNumber value={stats.totalGroups} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.publicGroups} öffentlich
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mitglieder gesamt
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedNumber value={stats.totalMembers} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ⌀ {stats.averageMembersPerGroup} pro Gruppe
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aktive Gruppen
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedNumber value={stats.activeGroups} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Diese Woche aktiv
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Meine Gruppen
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedNumber value={stats.userGroupsCount} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.recentActivity} Aktivitäten heute
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution and Top Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kategorien</CardTitle>
            <CardDescription>
              Die beliebtesten Gruppenkategorien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.categoryStats.slice(0, 5).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                      index === 0 ? 'from-blue-400 to-blue-600' :
                      index === 1 ? 'from-green-400 to-green-600' :
                      index === 2 ? 'from-orange-400 to-orange-600' :
                      index === 3 ? 'from-purple-400 to-purple-600' :
                      'from-gray-400 to-gray-600'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {category.category || 'Sonstige'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {category.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aktivste Gruppen</CardTitle>
            <CardDescription>
              Gruppen mit der höchsten Aktivität
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topGroups.map((group, index) => (
                <div key={group.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{group.name}</p>
                      {group.category && (
                        <p className="text-xs text-gray-500">{group.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{group.memberCount}</p>
                    <p className="text-xs text-gray-500">Mitglieder</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
