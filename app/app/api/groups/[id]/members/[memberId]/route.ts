
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { groupService } from '@/lib/group-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const changeRoleSchema = z.object({
  roleId: z.string()
})

// DELETE /api/groups/[id]/members/[memberId] - Remove member from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, memberId: string } }
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

    await groupService.removeMember(params.id, params.memberId, user.id)

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })
  } catch (error) {
    console.error('Error removing member:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Access denied') || error.message.includes('Missing permission')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        )
      }
      
      if (error.message.includes('not found') || error.message.includes('Cannot remove')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}

// PUT /api/groups/[id]/members/[memberId] - Change member role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, memberId: string } }
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
    const { roleId } = changeRoleSchema.parse(body)

    const member = await groupService.changeMemberRole(params.id, params.memberId, roleId, user.id)

    return NextResponse.json({
      success: true,
      data: member
    })
  } catch (error) {
    console.error('Error changing member role:', error)
    
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
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to change member role' },
      { status: 500 }
    )
  }
}
