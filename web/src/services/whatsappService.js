// WhatsApp Service: services/whatsappService.js
// Handles client-side triggers for automated WhatsApp parent updates.

export async function sendAcademicReportWhatsApp({ to, studentName, title, batchTitle, grade, maxScore, feedback }) {
  const percentage = Math.round((grade / maxScore) * 100);
  
  const bodyText = 
    `📚 *SmartChalk Academic Report* 📚\n\n` +
    `Dear Parent,\n` +
    `This is an automated academic update for your child, *${studentName}*.\n\n` +
    `*Batch/Subject:* ${batchTitle}\n` +
    `*Task:* ${title}\n` +
    `*Grade:* *${grade} / ${maxScore} marks (${percentage}%)*\n\n` +
    (feedback ? `*Teacher's Remarks:*\n"${feedback.trim()}"\n\n` : '') +
    `To download the full graded answer sheets and questions, please log in to the SmartChalk Student Dashboard.`;

  console.log('[WhatsApp Service] Preparing payload:', {
    to: to,
    studentName: studentName,
    title: title,
    batchTitle: batchTitle,
    gradeScore: `${grade}/${maxScore} (${percentage}%)`,
    messageLength: bodyText.length,
    originHostname: window.location.hostname
  });
  
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to,
        body: bodyText,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`WhatsApp dispatch failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    console.log('[WhatsApp Service] WhatsApp dispatched successfully!', data);
    return data;
  } catch (err) {
    console.error('[WhatsApp Service] Error sending automated WhatsApp:', err);
    throw err;
  }
}
