const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');

initializeApp();
const db = getFirestore();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function notificationId(eventId, userId) {
  return crypto.createHash('sha256').update(`${eventId}:${userId}`).digest('hex');
}

async function sendExpoPush(userId, tokens, notification) {
  const validTokens = [...new Set(tokens)].filter((token) => typeof token === 'string' && token.startsWith('ExponentPushToken[') || typeof token === 'string' && token.startsWith('ExpoPushToken['));
  if (!validTokens.length) return;

  for (let offset = 0; offset < validTokens.length; offset += 100) {
    const chunk = validTokens.slice(offset, offset + 100);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk.map((to) => ({
          to,
          title: notification.title,
          body: notification.body,
          sound: 'default',
          priority: 'high',
          channelId: 'smartchalk-updates',
          data: notification.data,
        }))),
      });
      if (!response.ok) {
        logger.error('Expo push request failed', { status: response.status, userId });
        continue;
      }
      const result = await response.json();
      const tickets = Array.isArray(result.data) ? result.data : [result.data];
      const invalidTokens = tickets.flatMap((ticket, index) => (
        ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered' ? [chunk[index]] : []
      )).filter(Boolean);
      if (invalidTokens.length) {
        await db.doc(`users/${userId}`).update({ expoPushTokens: FieldValue.arrayRemove(...invalidTokens) });
      }
    } catch (error) {
      logger.error('Unable to send Expo push notifications', { userId, error });
    }
  }
}

async function notifyStudents({ eventId, studentIds, excludeUserId, notification }) {
  const recipients = [...new Set(studentIds || [])].filter((uid) => uid && uid !== excludeUserId);
  await Promise.all(recipients.map(async (userId) => {
    const ref = db.doc(`notifications/${notificationId(eventId, userId)}`);
    let created = false;
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (current.exists) return;
      transaction.create(ref, {
        userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        sourceId: notification.sourceId,
        batchId: notification.batchId || null,
        readAt: null,
        createdAt: FieldValue.serverTimestamp(),
      });
      created = true;
    });
    if (!created) return;

    const profile = await db.doc(`users/${userId}`).get();
    const user = profile.data() || {};
    if (user.notificationsEnabled === false) return;
    await sendExpoPush(userId, user.expoPushTokens || [], {
      title: notification.title,
      body: notification.body,
      data: {
        sourceId: notification.sourceId,
        batchId: notification.batchId || '',
        type: notification.type,
      },
    });
  }));
}

async function batchStudentIds(classId) {
  if (!classId) return [];
  const snapshot = await db.doc(`classes/${classId}`).get();
  return snapshot.exists ? snapshot.data().studentIds || [] : [];
}

exports.assignmentPublished = onDocumentCreated('assignments/{assignmentId}', async (event) => {
  const assignment = event.data?.data();
  if (!assignment) return;
  await notifyStudents({
    eventId: event.id,
    studentIds: assignment.assignedStudentIds || [],
    notification: {
      type: 'assignment',
      sourceId: `assignment/${event.params.assignmentId}`,
      batchId: assignment.classId,
      title: assignment.title || 'New assignment',
      body: assignment.dueDate ? `A new assignment is available. Due ${new Date(assignment.dueDate.toDate?.() || assignment.dueDate).toLocaleDateString()}.` : 'A new assignment is available in your class workspace.',
    },
  });
});

exports.testPublished = onDocumentCreated('tests/{testId}', async (event) => {
  const test = event.data?.data();
  if (!test) return;
  await notifyStudents({
    eventId: event.id,
    studentIds: await batchStudentIds(test.classId),
    notification: {
      type: 'test',
      sourceId: `test/${event.params.testId}`,
      batchId: test.classId,
      title: test.title || 'New test',
      body: test.dueDate ? `A new test is available. Due ${new Date(test.dueDate.toDate?.() || test.dueDate).toLocaleDateString()}.` : 'A new test is available in your class workspace.',
    },
  });
});

exports.quizPublished = onDocumentCreated('quizzes/{quizId}', async (event) => {
  const quiz = event.data?.data();
  if (!quiz) return;
  await notifyStudents({
    eventId: event.id,
    studentIds: await batchStudentIds(quiz.classId),
    notification: {
      type: 'quiz',
      sourceId: `quiz/${event.params.quizId}`,
      batchId: quiz.classId,
      title: quiz.title || 'New quiz',
      body: `${quiz.questions?.length || 0} questions are ready in your class workspace.`,
    },
  });
});

exports.vaultItemShared = onDocumentCreated('vault_items/{itemId}', async (event) => {
  const item = event.data?.data();
  if (!item) return;
  await notifyStudents({
    eventId: event.id,
    studentIds: await batchStudentIds(item.classId),
    excludeUserId: item.uploadedBy,
    notification: {
      type: 'vault',
      sourceId: `vault/${event.params.itemId}`,
      batchId: item.classId,
      title: item.title || 'New class resource',
      body: item.uploadedByName ? `${item.uploadedByName} shared a resource with your class.` : 'A resource was added to your class vault.',
    },
  });
});

exports.batchAnnouncementAdded = onDocumentUpdated('classes/{batchId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const previousIds = new Set((before.notes || []).map((note) => note.id));
  const newNotes = (after.notes || []).filter((note) => note.id && !previousIds.has(note.id));
  if (!newNotes.length) return;
  await Promise.all(newNotes.map((note) => notifyStudents({
    eventId: `${event.id}:${note.id}`,
    studentIds: after.studentIds || [],
    notification: {
      type: 'announcement',
      sourceId: `announcement/${note.id}`,
      batchId: event.params.batchId,
      title: `${after.title || after.subject || 'Class'} update`,
      body: note.text || 'Your teacher posted a new announcement.',
    },
  })));
});

async function notifyWhenGraded(event, type, collectionName) {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (typeof after.grade !== 'number' || after.grade === before.grade || !after.studentId) return;
  await notifyStudents({
    eventId: event.id,
    studentIds: [after.studentId],
    notification: {
      type: 'grade',
      sourceId: `${collectionName}/${event.params.submissionId}`,
      batchId: after.classId,
      title: type === 'test' ? 'Test graded' : 'Assignment graded',
      body: `Your work received ${after.grade}${after.maxScore ? ` / ${after.maxScore}` : ''}${after.feedback ? `. ${after.feedback}` : '.'}`,
    },
  });
}

exports.assignmentGraded = onDocumentUpdated('submissions/{submissionId}', (event) => notifyWhenGraded(event, 'assignment', 'submission'));
exports.testGraded = onDocumentUpdated('test_submissions/{submissionId}', (event) => notifyWhenGraded(event, 'test', 'test_submission'));
