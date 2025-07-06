
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create demo users
  const hashedPassword = await bcryptjs.hash('johndoe123', 10)
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@doe.com' },
      update: {},
      create: {
        email: 'john@doe.com',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        password: hashedPassword,
        role: 'ADMIN',
        bio: 'Platform Administrator'
      }
    }),
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        firstName: 'Alice',
        lastName: 'Johnson',
        password: hashedPassword,
        role: 'USER',
        bio: 'Frontend Developer'
      }
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        name: 'Bob Smith',
        firstName: 'Bob',
        lastName: 'Smith',
        password: hashedPassword,
        role: 'USER',
        bio: 'Backend Developer'
      }
    }),
    prisma.user.upsert({
      where: { email: 'carol@example.com' },
      update: {},
      create: {
        email: 'carol@example.com',
        name: 'Carol Wilson',
        firstName: 'Carol',
        lastName: 'Wilson',
        password: hashedPassword,
        role: 'MODERATOR',
        bio: 'Project Manager'
      }
    })
  ])

  console.log('✅ Created demo users')

  // Create demo groups
  const groups = await Promise.all([
    prisma.group.upsert({
      where: { slug: 'frontend-developers' },
      update: {},
      create: {
        name: 'Frontend Developers',
        description: 'A community for frontend developers to share knowledge and collaborate on projects.',
        slug: 'frontend-developers',
        visibility: 'PUBLIC',
        joinPolicy: 'OPEN',
        category: 'Technology',
        tags: ['frontend', 'react', 'javascript', 'ui/ux'],
        creatorId: users[1].id, // Alice
        memberCount: 3
      }
    }),
    prisma.group.upsert({
      where: { slug: 'backend-systems' },
      update: {},
      create: {
        name: 'Backend Systems',
        description: 'Discussing backend architecture, databases, and system design.',
        slug: 'backend-systems',
        visibility: 'PUBLIC',
        joinPolicy: 'REQUEST',
        category: 'Technology',
        tags: ['backend', 'nodejs', 'databases', 'architecture'],
        creatorId: users[2].id, // Bob
        memberCount: 2
      }
    }),
    prisma.group.upsert({
      where: { slug: 'project-management' },
      update: {},
      create: {
        name: 'Project Management',
        description: 'Best practices and tools for effective project management.',
        slug: 'project-management',
        visibility: 'PUBLIC',
        joinPolicy: 'OPEN',
        category: 'Business',
        tags: ['project-management', 'agile', 'scrum', 'productivity'],
        creatorId: users[3].id, // Carol
        memberCount: 4
      }
    }),
    prisma.group.upsert({
      where: { slug: 'admin-team' },
      update: {},
      create: {
        name: 'Admin Team',
        description: 'Internal administration and platform management.',
        slug: 'admin-team',
        visibility: 'PRIVATE',
        joinPolicy: 'INVITE_ONLY',
        category: 'Internal',
        tags: ['admin', 'internal', 'management'],
        creatorId: users[0].id, // John
        memberCount: 2
      }
    })
  ])

  console.log('✅ Created demo groups')

  // Create group roles
  const roles = []
  for (const group of groups) {
    const groupRoles = await Promise.all([
      prisma.groupRole.upsert({
        where: { groupId_name: { groupId: group.id, name: 'Admin' } },
        update: {},
        create: {
          groupId: group.id,
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
      }),
      prisma.groupRole.upsert({
        where: { groupId_name: { groupId: group.id, name: 'Moderator' } },
        update: {},
        create: {
          groupId: group.id,
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
      }),
      prisma.groupRole.upsert({
        where: { groupId_name: { groupId: group.id, name: 'Member' } },
        update: {},
        create: {
          groupId: group.id,
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
    ])
    roles.push(...groupRoles)
  }

  console.log('✅ Created group roles')

  // Create group memberships
  const memberRoles = roles.filter(r => r.name === 'Member')
  const adminRoles = roles.filter(r => r.name === 'Admin')

  // Frontend Developers group
  await Promise.all([
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: users[1].id, groupId: groups[0].id } },
      update: {},
      create: {
        userId: users[1].id,
        groupId: groups[0].id,
        roleId: adminRoles.find(r => r.groupId === groups[0].id)?.id,
        status: 'ACTIVE'
      }
    }),
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: users[0].id, groupId: groups[0].id } },
      update: {},
      create: {
        userId: users[0].id,
        groupId: groups[0].id,
        roleId: memberRoles.find(r => r.groupId === groups[0].id)?.id,
        status: 'ACTIVE'
      }
    }),
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: users[3].id, groupId: groups[0].id } },
      update: {},
      create: {
        userId: users[3].id,
        groupId: groups[0].id,
        roleId: memberRoles.find(r => r.groupId === groups[0].id)?.id,
        status: 'ACTIVE'
      }
    })
  ])

  // Backend Systems group
  await Promise.all([
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: users[2].id, groupId: groups[1].id } },
      update: {},
      create: {
        userId: users[2].id,
        groupId: groups[1].id,
        roleId: adminRoles.find(r => r.groupId === groups[1].id)?.id,
        status: 'ACTIVE'
      }
    }),
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: users[0].id, groupId: groups[1].id } },
      update: {},
      create: {
        userId: users[0].id,
        groupId: groups[1].id,
        roleId: memberRoles.find(r => r.groupId === groups[1].id)?.id,
        status: 'ACTIVE'
      }
    })
  ])

  // Project Management group
  await Promise.all([
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: users[3].id, groupId: groups[2].id } },
      update: {},
      create: {
        userId: users[3].id,
        groupId: groups[2].id,
        roleId: adminRoles.find(r => r.groupId === groups[2].id)?.id,
        status: 'ACTIVE'
      }
    }),
    ...users.map(user => 
      prisma.groupMember.upsert({
        where: { userId_groupId: { userId: user.id, groupId: groups[2].id } },
        update: {},
        create: {
          userId: user.id,
          groupId: groups[2].id,
          roleId: memberRoles.find(r => r.groupId === groups[2].id)?.id,
          status: 'ACTIVE'
        }
      })
    )
  ])

  // Admin Team group
  await Promise.all([
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: users[0].id, groupId: groups[3].id } },
      update: {},
      create: {
        userId: users[0].id,
        groupId: groups[3].id,
        roleId: adminRoles.find(r => r.groupId === groups[3].id)?.id,
        status: 'ACTIVE'
      }
    }),
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: users[3].id, groupId: groups[3].id } },
      update: {},
      create: {
        userId: users[3].id,
        groupId: groups[3].id,
        roleId: memberRoles.find(r => r.groupId === groups[3].id)?.id,
        status: 'ACTIVE'
      }
    })
  ])

  console.log('✅ Created group memberships')

  // Create group statistics
  for (const group of groups) {
    await prisma.groupStats.upsert({
      where: { groupId: group.id },
      update: {},
      create: {
        groupId: group.id,
        totalMembers: group.memberCount,
        activeMembers: group.memberCount,
        newMembersToday: Math.floor(Math.random() * 3),
        newMembersWeek: Math.floor(Math.random() * 10),
        newMembersMonth: Math.floor(Math.random() * 25),
        totalActivities: Math.floor(Math.random() * 100),
        activitiesToday: Math.floor(Math.random() * 10),
        activitiesWeek: Math.floor(Math.random() * 50),
        activitiesMonth: Math.floor(Math.random() * 200),
        engagementScore: Math.random() * 10,
        growthRate: Math.random() * 2,
        churnRate: Math.random() * 0.1
      }
    })
  }

  console.log('✅ Created group statistics')
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
