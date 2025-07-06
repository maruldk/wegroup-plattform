
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { groupService } from '@/lib/group-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  priority: z.number().min(0).max(1000).optional(),
  permissions: z.object({
    canManageGroup: z.boolean().optional(),
    canManageMembers: z.boolean().optional(),
    canManageRoles: z.boolean().optional(),
    canDeleteGroup: z.boolean().optional(),
    canInviteMembers: z.boolean().optional(),
    canRemoveMembers: z.boolean().optional(),
    canModerate: z.boolean().optional()
  })
})

// GET /api/groups/[id]/roles - Get group roles
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    const userId = session?.user?.email ? 
      await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      }).then(user => user?.id) : undefined

    const group = await groupService.getGroupById(params.id, userId)

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: group.roles
    })
  } catch (error) {
    console.error('Error fetching group roles:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch group roles' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/roles - Create group role
export async function POST(
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
    const validatedData = createRoleSchema.parse(body)

    const role = await groupService.createGroupRole(params.id, validatedData, user.id)

    return NextResponse.json({
      success: true,
      data: role
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    
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
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
