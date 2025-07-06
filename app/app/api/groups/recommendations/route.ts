
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const recommendationsQuerySchema = z.object({
  limit: z.string().optional(),
  type: z.enum(['JOIN_GROUP', 'SIMILAR_GROUPS', 'ROLE_SUGGESTION', 'ACTIVITY_SUGGESTION']).optional()
})

// AI-based group recommendation service
class GroupRecommendationService {
  // Simulate AI-based group recommendations
  async generateGroupRecommendations(userId: string, type?: string, limit: number = 10) {
    // Get user's current groups and interests
    const userGroups = await prisma.groupMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { group: true }
    })

    const userGroupIds = userGroups.map(mg => mg.group.id)
    const userCategories = [...new Set(userGroups.map(mg => mg.group.category).filter(Boolean) as string[])]
    const userTags = [...new Set(userGroups.flatMap(mg => mg.group.tags).filter(Boolean) as string[])]

    // Find potential groups to recommend
    const candidateGroups = await prisma.group.findMany({
      where: {
        id: { notIn: userGroupIds },
        status: 'ACTIVE',
        visibility: { in: ['PUBLIC', 'UNLISTED'] },
        OR: [
          { category: { in: userCategories } },
          { tags: { hasSome: userTags } }
        ]
      },
      include: {
        creator: true,
        _count: { select: { members: true } }
      },
      take: limit * 2 // Get more to filter and score
    })

    // Score groups based on relevance
    const scoredGroups = candidateGroups.map(group => {
      let score = 0
      
      // Category match
      if (group.category && userCategories.includes(group.category)) {
        score += 30
      }
      
      // Tag matches
      const tagMatches = group.tags.filter(tag => userTags.includes(tag)).length
      score += tagMatches * 10
      
      // Member count (preference for active groups, but not too large)
      const memberCount = group._count.members
      if (memberCount >= 3 && memberCount <= 50) {
        score += 15
      } else if (memberCount > 50) {
        score += 5
      }
      
      // Join policy preference (easier to join = higher score)
      if (group.joinPolicy === 'OPEN') {
        score += 10
      } else if (group.joinPolicy === 'REQUEST') {
        score += 5
      }
      
      // Activity score
      score += Math.min(group.activityScore * 2, 20)
      
      // Random factor for diversity
      score += Math.random() * 5

      return {
        group,
        score,
        confidence: Math.min(score / 100, 0.95),
        reason: this.generateRecommendationReason(group, userCategories, userTags, tagMatches)
      }
    })

    // Sort by score and take top results
    const topGroups = scoredGroups
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // Create recommendation records
    const recommendations = await Promise.all(
      topGroups.map(async ({ group, confidence, reason }) => {
        return await prisma.groupRecommendation.create({
          data: {
            userId,
            groupId: group.id,
            type: (type as any) || 'JOIN_GROUP',
            confidence,
            reason,
            modelId: 'group-recommender-v1',
            modelVersion: '1.0.0',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        })
      })
    )

    return topGroups.map((item, index) => ({
      ...recommendations[index],
      group: item.group
    }))
  }

  private generateRecommendationReason(group: any, userCategories: string[], userTags: string[], tagMatches: number): string {
    const reasons = []
    
    if (group.category && userCategories.includes(group.category)) {
      reasons.push(`matches your interest in ${group.category}`)
    }
    
    if (tagMatches > 0) {
      reasons.push(`shares ${tagMatches} common topic${tagMatches > 1 ? 's' : ''} with your groups`)
    }
    
    if (group._count.members >= 10) {
      reasons.push('has an active community')
    }
    
    if (group.joinPolicy === 'OPEN') {
      reasons.push('easy to join')
    }

    return reasons.length > 0 
      ? `Recommended because it ${reasons.join(' and ')}.`
      : 'Recommended based on your activity patterns.'
  }
}

// GET /api/groups/recommendations - Get AI-based group recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const { limit, type } = recommendationsQuerySchema.parse(params)

    const recommendationService = new GroupRecommendationService()
    const recommendations = await recommendationService.generateGroupRecommendations(
      user.id,
      type,
      limit ? parseInt(limit) : 10
    )

    return NextResponse.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    console.error('Error generating group recommendations:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

// POST /api/groups/recommendations - Update recommendation status (viewed, accepted, rejected)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { recommendationId, action } = body

    if (!recommendationId || !['viewed', 'accepted', 'rejected'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action or recommendation ID' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (action === 'viewed') {
      updateData.status = 'VIEWED'
      updateData.viewedAt = new Date()
    } else if (action === 'accepted') {
      updateData.status = 'ACCEPTED'
      updateData.actionedAt = new Date()
    } else if (action === 'rejected') {
      updateData.status = 'REJECTED'
      updateData.actionedAt = new Date()
    }

    await prisma.groupRecommendation.update({
      where: { 
        id: recommendationId,
        userId: user.id // Ensure user can only update their own recommendations
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: `Recommendation marked as ${action}`
    })
  } catch (error) {
    console.error('Error updating recommendation:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to update recommendation' },
      { status: 500 }
    )
  }
}
