import { PrismaClient, ChannelType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedChatChannels() {
  try {
    // Get the first organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.error('No organization found. Please seed organizations first.');
      return;
    }

    // Get the first user as the creator
    const user = await prisma.user.findFirst({
      where: { organizationId: organization.id },
    });
    if (!user) {
      console.error('No user found. Please seed users first.');
      return;
    }

    // Check if channels already exist
    const existingChannels = await prisma.chatChannel.count({
      where: { organizationId: organization.id },
    });

    if (existingChannels > 0) {
      console.log(`Organization already has ${existingChannels} channels.`);
      return;
    }

    // Create default channels
    const channels = await Promise.all([
      // General channel
      prisma.chatChannel.create({
        data: {
          name: 'general',
          description: 'General team discussions and announcements',
          type: ChannelType.PUBLIC,
          organizationId: organization.id,
          createdBy: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      }),

      // Compliance channel
      prisma.chatChannel.create({
        data: {
          name: 'compliance',
          description: 'Compliance and regulatory discussions',
          type: ChannelType.PUBLIC,
          organizationId: organization.id,
          createdBy: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'MEMBER',
            },
          },
        },
      }),

      // Security channel
      prisma.chatChannel.create({
        data: {
          name: 'security',
          description: 'Security team coordination and alerts',
          type: ChannelType.PRIVATE,
          organizationId: organization.id,
          createdBy: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'MEMBER',
            },
          },
        },
      }),
    ]);

    console.log(`Created ${channels.length} default channels for organization ${organization.name}`);

    // Add all other users to the general channel
    const otherUsers = await prisma.user.findMany({
      where: {
        organizationId: organization.id,
        id: { not: user.id },
      },
    });

    if (otherUsers.length > 0) {
      const generalChannel = channels.find(ch => ch.name === 'general');
      if (generalChannel) {
        await prisma.chatChannelMember.createMany({
          data: otherUsers.map(u => ({
            channelId: generalChannel.id,
            userId: u.id,
            role: 'MEMBER',
          })),
        });
        console.log(`Added ${otherUsers.length} members to the general channel`);
      }
    }

    // Create a welcome message
    const generalChannel = channels.find(ch => ch.name === 'general');
    if (generalChannel) {
      await prisma.chatMessage.create({
        data: {
          channelId: generalChannel.id,
          userId: user.id,
          content: 'Welcome to the team chat! This is the general channel for team discussions and announcements.',
          type: 'TEXT',
        },
      });
      console.log('Created welcome message in general channel');
    }

  } catch (error) {
    console.error('Error seeding chat channels:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedChatChannels();