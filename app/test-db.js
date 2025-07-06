
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test creating a simple user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword'
      }
    })
    console.log('✅ Created test user:', user.email)
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: user.id }
    })
    console.log('✅ Cleaned up test user')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
