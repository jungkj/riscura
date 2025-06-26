#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseData() {
  console.log('🔍 Checking Database Data...');
  console.log('');

  try {
    // Check organizations
    const organizations = await prisma.organization.findMany();
    console.log(`📊 Organizations: ${organizations.length}`);
    organizations.forEach(org => {
      console.log(`  - ${org.name} (${org.domain}) - ${org.plan} plan`);
    });

    // Check users
    const users = await prisma.user.findMany({
      include: {
        organization: true
      }
    });
    console.log(`\n👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });

    // Check risks
    const risks = await prisma.risk.findMany({
      include: {
        creator: true,
        assignedUser: true
      }
    });
    console.log(`\n⚠️  Risks: ${risks.length}`);
    risks.forEach(risk => {
      console.log(`  - ${risk.title} (${risk.category}) - ${risk.riskLevel} - Created by: ${risk.creator?.firstName || 'Unknown'}`);
    });

    // Check controls
    const controls = await prisma.control.findMany({
      include: {
        creator: true,
        assignedUser: true
      }
    });
    console.log(`\n🛡️  Controls: ${controls.length}`);
    controls.forEach(control => {
      console.log(`  - ${control.title} (${control.type}) - ${control.status} - Effectiveness: ${control.effectiveness}%`);
    });

    // Check documents
    const documents = await prisma.document.findMany({
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    console.log(`\n📄 Documents: ${documents.length}`);
    documents.forEach(doc => {
      console.log(`  - ${doc.name} (${doc.type}) - ${doc.size} bytes - Uploaded by: ${doc.uploader?.firstName || 'Unknown'}`);
    });

    // Check questionnaires
    const questionnaires = await prisma.questionnaire.findMany({
      include: {
        creator: true
      }
    });
    console.log(`\n📋 Questionnaires: ${questionnaires.length}`);
    questionnaires.forEach(q => {
      console.log(`  - ${q.title} (${q.status}) - ${q.type}`);
    });

    // Check activities
    const activities = await prisma.activity.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    console.log(`\n📈 Recent Activities: ${activities.length}`);
    activities.forEach(activity => {
      console.log(`  - ${activity.type} by ${activity.user?.firstName || 'Unknown'} - ${activity.description}`);
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData(); 