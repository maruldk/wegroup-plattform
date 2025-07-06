
import { prisma } from '@/lib/prisma'
import { Group, GroupMember, GroupRole, User, Prisma } from '@prisma/client'
import { InMemoryEventBus } from '@/src/eventBus/EventBus'
import { GroupEvent } from '@/src/eventBus/types'

export interface GroupWithDetails extends Group {
  creator: User
  members: (GroupMember & {
    user: User
    role: GroupRole | null
  })[]
  roles: GroupRole[]
  _count: {
    members: number
  }
}

export interface CreateGroupData {
  name: string
  description?: string
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  joinPolicy?: 'OPEN' | 'REQUEST' | 'INVITE_ONLY'
  maxMembers?: number
  category?: string
  tags?: string[]
}

export interface UpdateGroupData {
  name?: string
  description?: string
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  joinPolicy?: 'OPEN' | 'REQUEST' | 'INVITE_ONLY'
  maxMembers?: number
  category?: string
  tags?: string[]
  avatar?: string
  banner?: string
}

export class GroupService {
  private eventBus: InMemoryEventBus

  constructor(eventBus?: InMemoryEventBus) {
    this.eventBus = eventBus || new InMemoryEventBus()
  }

  // Create a new group
  async createGroup(data: CreateGroupData, creatorId: string): Promise<GroupWithDetails> {
    const slug = this.generateSlug(data.name)
    
    const group = await prisma.$transaction(async (tx) => {
      // Create the group
      const newGroup = await tx.group.create({
        data: {
          ...data,
          slug,
          creatorId,
          memberCount: 1
        },
        include: {
          creator: true,
          members: {
            include: {
              user: true,
              role: true
            }
          },
          roles: true,
          _count: {
            select: { members: true }
          }
        }
      })

      // Create default roles
      const adminRole = await tx.groupRole.create({
        data: {
          groupId: newGroup.id,
          name: 'Admin',
          description: 'Full administrative access to the group',
          color: '#ef4444',
          priority: 100,
          isSystem: true,
          permissions: {
            canManageGroup: true,
            canManageMembers: true,
            canManageRoles: true,
            canDeleteGroup: true,
            canInviteMembers: true,
            canRemoveMembers: true,
            canModerate: true
          }
        }
      })

      await tx.groupRole.create({
        data: {
          groupId: newGroup.id,
          name: 'Moderator',
          description: 'Can moderate content and manage members',
          color: '#f59e0b',
          priority: 50,
          isSystem: true,
          permissions: {
            canManageGroup: false,
            canManageMembers: true,
            canManageRoles: false,
            canDeleteGroup: false,
            canInviteMembers: true,
            canRemoveMembers: true,
            canModerate: true
          }
        }
      })

      const memberRole = await tx.groupRole.create({
        data: {
          groupId: newGroup.id,
          name: 'Member',
          description: 'Standard group member',
          color: '#3b82f6',
          priority: 10,
          isDefault: true,
          isSystem: true,
          permissions: {
            canManageGroup: false,
            canManageMembers: false,
            canManageRoles: false,
            canDeleteGroup: false,
            canInviteMembers: false,
            canRemoveMembers: false,
            canModerate: false
          }
        }
      })

      // Add creator as admin member
      await tx.groupMember.create({
        data: {
          userId: creatorId,
          groupId: newGroup.id,
          roleId: adminRole.id,
          status: 'ACTIVE'
        }
      })

      // Initialize group statistics
      await tx.groupStats.create({
        data: {
          groupId: newGroup.id,
          totalMembers: 1,
          activeMembers: 1,
          newMembersToday: 1,
          newMembersWeek: 1,
          newMembersMonth: 1
        }
      })

      return newGroup
    })

    // Emit group created event
    await this.emitGroupEvent('group.created', {
      groupId: group.id,
      groupName: group.name,
      metadata: {
        creatorId,
        visibility: group.visibility,
        joinPolicy: group.joinPolicy
      }
    }, creatorId)

    return group
  }

  // Get group by ID with full details
  async getGroupById(groupId: string, userId?: string): Promise<GroupWithDetails | null> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
            role: true
          }
        },
        roles: true,
        _count: {
          select: { members: true }
        }
      }
    })

    if (!group) return null

    // Check visibility permissions
    if (group.visibility === 'PRIVATE' && userId) {
      const isMember = group.members.some(member => member.userId === userId)
      if (!isMember) {
        throw new Error('Access denied: Private group')
      }
    }

    return group
  }

  // List groups with filtering and pagination
  async listGroups(filters: {
    search?: string
    category?: string
    visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
    joinPolicy?: 'OPEN' | 'REQUEST' | 'INVITE_ONLY'
    tags?: string[]
    userId?: string // For filtering user's groups
    limit?: number
    offset?: number
  } = {}): Promise<{ groups: GroupWithDetails[], total: number }> {
    const where: Prisma.GroupWhereInput = {
      status: 'ACTIVE'
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.visibility) {
      where.visibility = filters.visibility
    }

    if (filters.joinPolicy) {
      where.joinPolicy = filters.joinPolicy
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      }
    }

    if (filters.userId) {
      where.members = {
        some: {
          userId: filters.userId,
          status: 'ACTIVE'
        }
      }
    }

    // For non-authenticated users, only show public groups
    if (!filters.userId) {
      where.visibility = 'PUBLIC'
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          creator: true,
          members: {
            include: {
              user: true,
              role: true
            }
          },
          roles: true,
          _count: {
            select: { members: true }
          }
        },
        orderBy: [
          { activityScore: 'desc' },
          { createdAt: 'desc' }
        ],
        take: filters.limit || 20,
        skip: filters.offset || 0
      }),
      prisma.group.count({ where })
    ])

    return { groups, total }
  }

  // Update group
  async updateGroup(groupId: string, data: UpdateGroupData, userId: string): Promise<GroupWithDetails> {
    // Check permissions
    await this.checkGroupPermission(groupId, userId, 'canManageGroup')

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
            role: true
          }
        },
        roles: true,
        _count: {
          select: { members: true }
        }
      }
    })

    // Emit group updated event
    await this.emitGroupEvent('group.updated', {
      groupId,
      groupName: updatedGroup.name,
      changes: data,
      metadata: { updatedBy: userId }
    }, userId)

    return updatedGroup
  }

  // Delete group
  async deleteGroup(groupId: string, userId: string): Promise<void> {
    // Check permissions
    await this.checkGroupPermission(groupId, userId, 'canDeleteGroup')

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    await prisma.group.update({
      where: { id: groupId },
      data: { status: 'ARCHIVED' }
    })

    // Emit group deleted event
    await this.emitGroupEvent('group.deleted', {
      groupId,
      groupName: group.name,
      metadata: { deletedBy: userId }
    }, userId)
  }

  // Add member to group
  async addMember(groupId: string, userEmail: string, roleId?: string, invitedBy?: string): Promise<GroupMember & { user: User, role: GroupRole | null }> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { roles: true }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } }
    })

    if (existingMember) {
      throw new Error('User is already a member of this group')
    }

    // Use default member role if no role specified
    const targetRole = roleId 
      ? group.roles.find(r => r.id === roleId)
      : group.roles.find(r => r.isDefault)

    if (!targetRole) {
      throw new Error('Role not found')
    }

    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.groupMember.create({
        data: {
          userId: user.id,
          groupId,
          roleId: targetRole.id,
          status: 'ACTIVE'
        },
        include: {
          user: true,
          role: true
        }
      })

      // Update group member count
      await tx.group.update({
        where: { id: groupId },
        data: { memberCount: { increment: 1 } }
      })

      // Update group statistics
      await tx.groupStats.update({
        where: { groupId },
        data: {
          totalMembers: { increment: 1 },
          activeMembers: { increment: 1 },
          newMembersToday: { increment: 1 },
          newMembersWeek: { increment: 1 },
          newMembersMonth: { increment: 1 }
        }
      })

      return newMember
    })

    // Emit member joined event
    await this.emitGroupEvent('group.member.joined', {
      groupId,
      groupName: group.name,
      memberId: user.id,
      memberEmail: user.email,
      roleId: targetRole.id,
      roleName: targetRole.name,
      metadata: { invitedBy }
    }, invitedBy)

    return member
  }

  // Remove member from group
  async removeMember(groupId: string, userId: string, removedBy: string): Promise<void> {
    // Check permissions
    await this.checkGroupPermission(groupId, removedBy, 'canRemoveMembers')

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true, creatorId: true }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    // Prevent removing the group creator
    if (group.creatorId === userId) {
      throw new Error('Cannot remove the group creator')
    }

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
      include: { user: true, role: true }
    })

    if (!member) {
      throw new Error('Member not found')
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupMember.delete({
        where: { userId_groupId: { userId, groupId } }
      })

      // Update group member count
      await tx.group.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } }
      })

      // Update group statistics
      await tx.groupStats.update({
        where: { groupId },
        data: {
          totalMembers: { decrement: 1 },
          activeMembers: { decrement: 1 }
        }
      })
    })

    // Emit member removed event
    await this.emitGroupEvent('group.member.removed', {
      groupId,
      groupName: group.name,
      memberId: userId,
      memberEmail: member.user.email,
      roleId: member.roleId,
      roleName: member.role?.name,
      metadata: { removedBy }
    }, removedBy)
  }

  // Change member role
  async changeMemberRole(groupId: string, userId: string, newRoleId: string, changedBy: string): Promise<GroupMember & { user: User, role: GroupRole | null }> {
    // Check permissions
    await this.checkGroupPermission(groupId, changedBy, 'canManageMembers')

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
      include: { user: true, role: true }
    })

    if (!member) {
      throw new Error('Member not found')
    }

    const newRole = await prisma.groupRole.findUnique({
      where: { id: newRoleId }
    })

    if (!newRole || newRole.groupId !== groupId) {
      throw new Error('Role not found')
    }

    const previousRole = member.role

    const updatedMember = await prisma.groupMember.update({
      where: { userId_groupId: { userId, groupId } },
      data: { roleId: newRoleId },
      include: {
        user: true,
        role: true
      }
    })

    // Emit role changed event
    await this.emitGroupEvent('group.member.role.changed', {
      groupId,
      groupName: group.name,
      memberId: userId,
      memberEmail: member.user.email,
      roleId: newRoleId,
      roleName: newRole.name,
      previousRole: previousRole?.name,
      newRole: newRole.name,
      metadata: { changedBy }
    }, changedBy)

    return updatedMember
  }

  // Create group role
  async createGroupRole(groupId: string, roleData: {
    name: string
    description?: string
    color?: string
    priority?: number
    permissions: Record<string, boolean>
  }, createdBy: string): Promise<GroupRole> {
    // Check permissions
    await this.checkGroupPermission(groupId, createdBy, 'canManageRoles')

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    const role = await prisma.groupRole.create({
      data: {
        ...roleData,
        groupId
      }
    })

    // Emit role created event
    await this.emitGroupEvent('group.role.created', {
      groupId,
      groupName: group.name,
      roleId: role.id,
      roleName: role.name,
      metadata: { createdBy }
    }, createdBy)

    return role
  }

  // Helper methods
  private generateSlug(name: string): string {
    const base = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const timestamp = Date.now().toString(36)
    return `${base}-${timestamp}`
  }

  private async checkGroupPermission(groupId: string, userId: string, permission: string): Promise<void> {
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
      include: { role: true }
    })

    if (!member || member.status !== 'ACTIVE') {
      throw new Error('Access denied: Not a member of this group')
    }

    const permissions = member.role?.permissions as Record<string, boolean> | null
    if (!permissions || !permissions[permission]) {
      throw new Error(`Access denied: Missing permission ${permission}`)
    }
  }

  private async emitGroupEvent(eventType: any, data: any, userId?: string): Promise<void> {
    const event: GroupEvent = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      aggregateId: data.groupId,
      data,
      metadata: {
        userId,
        version: 1,
        source: 'group-service',
        correlationId: `group-${data.groupId}-${Date.now()}`
      },
      timestamp: new Date()
    }

    await this.eventBus.publish(event)
  }
}

export const groupService = new GroupService()
