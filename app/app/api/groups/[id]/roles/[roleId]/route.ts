
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
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
  }).optional()
})

// PUT /api/groups/[id]/roles/[roleId] - Update group role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, roleId: string } }
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

    // Check permissions
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } },
      include: { role: true }
    })

    if (!member || member.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Not a member of this group' },
        { status: 403 }
      )
    }

    const permissions = member.role?.permissions as Record<string, boolean> | null
    if (!permissions || !permissions.canManageRoles) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Missing permission canManageRoles' },
        { status: 403 }
      )
    }

    const role = await prisma.groupRole.findUnique({
      where: { id: params.roleId }
    })

    if (!role || role.groupId !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      )
    }

    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify system roles' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)

    const updatedRole = await prisma.groupRole.update({
      where: { id: params.roleId },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: updatedRole
    })
  } catch (error) {
    console.error('Error updating role:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id]/roles/[roleId] - Delete group role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, roleId: string } }
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

    // Check permissions
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } },
      include: { role: true }
    })

    if (!member || member.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Not a member of this group' },
        { status: 403 }
      )
    }

    const permissions = member.role?.permissions as Record<string, boolean> | null
    if (!permissions || !permissions.canManageRoles) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Missing permission canManageRoles' },
        { status: 403 }
      )
    }

    const role = await prisma.groupRole.findUnique({
      where: { id: params.roleId },
      include: { _count: { select: { members: true } } }
    })

    if (!role || role.groupId !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      )
    }

    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete system roles' },
        { status: 400 }
      )
    }

    if (role._count.members > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete role with existing members' },
        { status: 400 }
      )
    }

    await prisma.groupRole.delete({
      where: { id: params.roleId }
    })

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting role:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
