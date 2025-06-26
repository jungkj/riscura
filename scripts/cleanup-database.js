#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Cleaning up database...');
  console.log('');

  try {
    // Delete all activities first (due to foreign key constraints)
    const deletedActivities = await prisma.activity.deleteMany();
    console.log(`🗑️  Deleted ${deletedActivities.count} activities`);

    // Delete all risks
    const deletedRisks = await prisma.risk.deleteMany();
    console.log(`🗑️  Deleted ${deletedRisks.count} risks`);

    // Delete all controls
    const deletedControls = await prisma.control.deleteMany();
    console.log(`🗑️  Deleted ${deletedControls.count} controls`);

    // Delete all documents
    const deletedDocuments = await prisma.document.deleteMany();
    console.log(`🗑️  Deleted ${deletedDocuments.count} documents`);

    // Delete all questionnaires
    const deletedQuestionnaires = await prisma.questionnaire.deleteMany();
    console.log(`🗑️  Deleted ${deletedQuestionnaires.count} questionnaires`);

    // Delete all responses
    const deletedResponses = await prisma.response.deleteMany();
    console.log(`🗑️  Deleted ${deletedResponses.count} responses`);

    // Delete all comments
    const deletedComments = await prisma.comment.deleteMany();
    console.log(`🗑️  Deleted ${deletedComments.count} comments`);

    // Delete all tasks
    const deletedTasks = await prisma.task.deleteMany();
    console.log(`🗑️  Deleted ${deletedTasks.count} tasks`);

    // Delete all workflows
    const deletedWorkflows = await prisma.workflow.deleteMany();
    console.log(`🗑️  Deleted ${deletedWorkflows.count} workflows`);

    // Delete all reports
    const deletedReports = await prisma.report.deleteMany();
    console.log(`🗑️  Deleted ${deletedReports.count} reports`);

    // Delete all messages
    const deletedMessages = await prisma.message.deleteMany();
    console.log(`🗑️  Deleted ${deletedMessages.count} messages`);

    // Delete all notifications
    const deletedNotifications = await prisma.notification.deleteMany();
    console.log(`🗑️  Deleted ${deletedNotifications.count} notifications`);

    // Delete all AI conversations
    const deletedAIConversations = await prisma.aIConversation.deleteMany();
    console.log(`🗑️  Deleted ${deletedAIConversations.count} AI conversations`);

    // Delete all AI usage logs
    const deletedAIUsageLogs = await prisma.aIUsageLog.deleteMany();
    console.log(`🗑️  Deleted ${deletedAIUsageLogs.count} AI usage logs`);

    console.log('');
    console.log('✅ Database cleanup completed!');
    console.log('📊 Organization and users are preserved.');

  } catch (error) {
    console.error('❌ Error cleaning up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase(); 