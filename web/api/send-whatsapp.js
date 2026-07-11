// Vercel Serverless Function: api/send-whatsapp.js
// Handles automated WhatsApp notifications via UltraMsg or Twilio APIs.

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, body } = req.body;

  if (!to || !body) {
    console.warn('[Serverless WhatsApp] Rejected invocation: Missing to or body');
    return res.status(400).json({ error: 'Missing parameter "to" or "body"' });
  }

  // 1. Try UltraMsg Provider
  const ultraToken = process.env.ULTRAMSG_TOKEN || process.env.VITE_ULTRAMSG_TOKEN;
  const ultraInstance = process.env.ULTRAMSG_INSTANCE_ID || process.env.VITE_ULTRAMSG_INSTANCE_ID;

  // 2. Try Twilio Provider
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  console.log('[Serverless WhatsApp] Invoked payload details:', {
    recipient: to,
    messageLength: body.length,
    detectedProviders: {
      ultramsg: !!(ultraToken && ultraInstance),
      twilio: !!(twilioSid && twilioToken)
    }
  });

  if (ultraToken && ultraInstance) {
    try {
      const cleanPhone = to.replace(/\+/g, '').trim();
      console.log('[Serverless WhatsApp] Routing via UltraMsg:', { instance: ultraInstance, phone: cleanPhone });
      
      const response = await fetch(`https://api.ultramsg.com/${ultraInstance}/messages/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: ultraToken,
          to: cleanPhone,
          body: body,
        }),
      });

      console.log('[Serverless WhatsApp] UltraMsg responded with status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Serverless WhatsApp] UltraMsg API Error:', errText);
        return res.status(response.status).json({ error: `UltraMsg error: ${errText}` });
      }

      const data = await response.json();
      console.log('[Serverless WhatsApp] UltraMsg successfully processed message:', data);
      return res.status(200).json({ success: true, provider: 'ultramsg', data });
    } catch (err) {
      console.error('[Serverless WhatsApp] UltraMsg system catch exception:', err);
      return res.status(500).json({ error: `UltraMsg dispatch failed: ${err.message}` });
    }
  }

  if (twilioSid && twilioToken) {
    try {
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to.startsWith('+') ? to : `+${to}`}`;
      const authHeader = `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`;
      console.log('[Serverless WhatsApp] Routing via Twilio:', { toPhone: formattedTo, fromPhone: twilioFrom });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: formattedTo,
          Body: body,
        }),
      });

      console.log('[Serverless WhatsApp] Twilio responded with status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Serverless WhatsApp] Twilio API Error:', errText);
        return res.status(response.status).json({ error: `Twilio error: ${errText}` });
      }

      const data = await response.json();
      console.log('[Serverless WhatsApp] Twilio successfully processed message:', data);
      return res.status(200).json({ success: true, provider: 'twilio', data });
    } catch (err) {
      console.error('[Serverless WhatsApp] Twilio system catch exception:', err);
      return res.status(500).json({ error: `Twilio dispatch failed: ${err.message}` });
    }
  }

  // 3. Fallback: Mock Sandbox Log
  console.log('[WhatsApp Serverless] Fallback executed. No provider configured. Sandbox Mock:', { to, body });
  return res.status(200).json({
    success: true,
    provider: 'mock',
    message: 'Mock dispatch success. Set ULTRAMSG_TOKEN or TWILIO_ACCOUNT_SID to send real messages.',
  });
}
