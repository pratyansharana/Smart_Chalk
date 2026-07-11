export async function sendAcademicReportEmail({ to, studentName, title, batchTitle, grade, maxScore, feedback }) {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  
  console.log('[Email Service] Diagnostic logs:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 5)}...` : 'none',
    availableViteEnvKeys: Object.keys(import.meta.env).filter((k) => k.startsWith('VITE_')),
  });

  if (!apiKey || apiKey.includes('YOUR_RESEND_API_KEY_HERE')) {
    console.warn('[Email Service] Resend API key is not configured yet. Skipping automated email.');
    return;
  }

  const percentage = Math.round((grade / maxScore) * 100);
  const subject = `SmartChalk Academic Report - ${studentName} - ${title}`;
  
  // Format feedback points if present
  let feedbackHtml = '';
  if (feedback) {
    feedbackHtml = `
      <div style="background-color: #fffdf5; border: 1px solid #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; color: #b45309; font-size: 14px;">Teacher Feedback & Remarks:</h4>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${feedback}</p>
      </div>
    `;
  }

  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
      <h2 style="color: #d97706; margin-bottom: 5px;">SmartChalk</h2>
      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 20px;">Academic Performance & Grade Report</div>
      
      <p style="font-size: 14px; line-height: 1.6;">Dear Parent,</p>
      <p style="font-size: 14px; line-height: 1.6;">This is an automated academic update for your child, <strong>${studentName}</strong>, regarding their performance in <strong>${batchTitle}</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #0f172a;">${title}</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Max Score possible:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${maxScore} marks</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Graded Score:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #16a34a; font-size: 15px;">${grade} / ${maxScore} (${percentage}%)</td>
          </tr>
        </table>
        ${feedbackHtml}
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #64748b;">To inspect the complete questions and student answer sheets, please log in to the SmartChalk Student Dashboard.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Sent automatically by SmartChalk Classroom Systems.</p>
    </div>
  `;

  console.log('[Email Service] Sending automated email via proxy or serverless function...', { to, subject });
  
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const url = isLocal 
      ? 'https://thingproxy.freeboard.io/fetch/https://api.resend.com/emails'
      : '/api/send-email';

    const headers = {
      'Content-Type': 'application/json',
    };

    if (isLocal) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const bodyPayload = isLocal
      ? {
          from: 'SmartChalk <updates@smartchalk.online>',
          to: [to],
          subject: subject,
          html: htmlContent,
        }
      : {
          to: to,
          subject: subject,
          html: htmlContent,
        };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Email dispatch failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    console.log('[Email Service] Email dispatched successfully!', data);
    return data;
  } catch (err) {
    console.error('[Email Service] Error sending automated email:', err);
    throw err;
  }
}
