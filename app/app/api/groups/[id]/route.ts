
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { groupService } from '@/lib/group-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  joinPolicy: z.enum(['OPEN', 'REQUEST', 'INVITE_ONLY']).optional(),
  maxMembers: z.number().positive().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  avatar: z.string().optional(),
  banner: z.string().optional()
})

// GET /api/groups/[id] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    let userId: string | undefined = undefined
    
    if (session?.user?.email) {
      const user = await (await import('@/lib/prisma')).prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      userId = user?.id
    }

    const group = await groupService.getGroupById(params.id, userId)

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: group
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateGroupSchema.parse(body)

    const group = await groupService.updateGroup(params.id, validatedData, user.id)

    return NextResponse.json({
      success: true,
      data: group
    })
  } catch (error) {
    console.error('Error updating group:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await groupService.deleteGroup(params.id, user.id)

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting group:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
