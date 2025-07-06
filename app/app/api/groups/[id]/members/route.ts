
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { groupService } from '@/lib/group-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const addMemberSchema = z.object({
  email: z.string().email(),
  roleId: z.string().optional()
})

// GET /api/groups/[id]/members - Get group members
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
      data: group.members
    })
  } catch (error) {
    console.error('Error fetching group members:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch group members' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/members - Add member to group
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
    const { email, roleId } = addMemberSchema.parse(body)

    const member = await groupService.addMember(params.id, email, roleId, user.id)

    return NextResponse.json({
      success: true,
      data: member
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding member:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error) {
      if (error.message.includes('Access denied') || error.message.includes('Missing permission')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        )
      }
      
      if (error.message.includes('not found') || error.message.includes('already a member')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    )
  }
}
