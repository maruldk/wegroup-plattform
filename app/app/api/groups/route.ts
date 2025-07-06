
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { groupService } from '@/lib/group-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  joinPolicy: z.enum(['OPEN', 'REQUEST', 'INVITE_ONLY']).optional(),
  maxMembers: z.number().positive().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const listGroupsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  joinPolicy: z.enum(['OPEN', 'REQUEST', 'INVITE_ONLY']).optional(),
  tags: z.string().optional(), // comma-separated
  my_groups: z.string().optional(), // 'true' to filter user's groups
  limit: z.string().optional(),
  offset: z.string().optional()
})

// GET /api/groups - List groups with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validatedParams = listGroupsSchema.parse(params)
    
    const session = await getServerSession()
    let userId: string | undefined = undefined
    
    if (session?.user?.email) {
      const user = await (await import('@/lib/prisma')).prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      userId = user?.id
    }

    const filters = {
      search: validatedParams.search,
      category: validatedParams.category,
      visibility: validatedParams.visibility,
      joinPolicy: validatedParams.joinPolicy,
      tags: validatedParams.tags ? validatedParams.tags.split(',') : undefined,
      userId: validatedParams.my_groups === 'true' ? userId : undefined,
      limit: validatedParams.limit ? parseInt(validatedParams.limit) : 20,
      offset: validatedParams.offset ? parseInt(validatedParams.offset) : 0
    }

    const result = await groupService.listGroups(filters)

    return NextResponse.json({
      success: true,
      data: result.groups,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        hasNext: result.total > (filters.offset + filters.limit)
      }
    })
  } catch (error) {
    console.error('Error listing groups:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await (await import('@/lib/prisma')).prisma.user.findUnique({
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
    const validatedData = createGroupSchema.parse(body)

    const group = await groupService.createGroup(validatedData, user.id)

    return NextResponse.json({
      success: true,
      data: group
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create group' },
      { status: 500 }
    )
  }
}
