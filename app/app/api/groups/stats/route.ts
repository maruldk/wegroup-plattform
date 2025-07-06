
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/groups/stats - Get global group statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userId = session?.user?.email ? 
      await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      }).then(user => user?.id) : undefined

    // Get global statistics
    const [
      totalGroups,
      publicGroups,
      totalMembers,
      activeGroups,
      userGroupsCount,
      recentActivity
    ] = await Promise.all([
      // Total groups
      prisma.group.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Public groups
      prisma.group.count({
        where: { 
          status: 'ACTIVE',
          visibility: 'PUBLIC'
        }
      }),
      
      // Total memberships
      prisma.groupMember.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Groups with recent activity (last 7 days)
      prisma.group.count({
        where: {
          status: 'ACTIVE',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // User's groups (if authenticated)
      userId ? prisma.groupMember.count({
        where: {
          userId,
          status: 'ACTIVE'
        }
      }) : 0,
      
      // Recent group activities
      prisma.groupActivity.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
          }
        }
      })
    ])

    // Get category distribution
    const categoryStats = await prisma.group.groupBy({
      by: ['category'],
      where: {
        status: 'ACTIVE',
        category: { not: null }
      },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 10
    })

    // Get most active groups
    const topGroups = await prisma.group.findMany({
      where: {
        status: 'ACTIVE',
        visibility: { in: userId ? ['PUBLIC', 'PRIVATE', 'UNLISTED'] : ['PUBLIC'] }
      },
      select: {
        id: true,
        name: true,
        memberCount: true,
        activityScore: true,
        category: true
      },
      orderBy: [
        { activityScore: 'desc' },
        { memberCount: 'desc' }
      ],
      take: 5
    })

    const stats = {
      totalGroups,
      publicGroups,
      totalMembers,
      activeGroups,
      userGroupsCount,
      recentActivity,
      averageMembersPerGroup: totalGroups > 0 ? Math.round(totalMembers / totalGroups) : 0,
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.category
      })),
      topGroups
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching group statistics:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
