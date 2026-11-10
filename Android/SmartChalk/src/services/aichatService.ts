export async function sendAIChatMessage(
    userPrompt: string, 
    chatHistory: { sender: 'user' | 'ai'; text: string }[] = []
): Promise<string> {
    console.log('[AIChatService] ---> sendAIChatMessage invoked');
    console.log('[AIChatService] User Prompt:', userPrompt);

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[AIChatService] ERROR: Gemini API key is missing.');
        throw new Error('Gemini API key is missing. Check your environment variables.');
    }

    try {
        // Correct endpoint using gemini-3.8-flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
        console.log('[AIChatService] Target Endpoint URL constructed');

        const systemInstruction = {
            parts: [{
                text: "You are SmartChalk AI, a hyper-intelligent, friendly, and Gen Z study companion built into the SmartChalk student platform. Explain academic concepts clearly without boring textbook fluff. Keep explanations engaging, accurate, modern, and high-protein. Drop occasional modern slang naturally ('no cap', 'locked in', 'let him cook', 'vibing', 'valid') when it fits."
            }]
        };

        const contents = chatHistory.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        contents.push({
            role: 'user',
            parts: [{ text: userPrompt }]
        });

        const requestPayload = {
            system_instruction: systemInstruction,
            contents: contents,
            generationConfig: {
                temperature: 0.7,
            }
        };

        console.log('[AIChatService] Dispatching fetch request with 15s timeout...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const startTime = Date.now();
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        console.log(`[AIChatService] Received HTTP response in ${duration}ms with status:`, response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[AIChatService] API Error Response:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
            console.warn('[AIChatService] Warning: Empty response candidate');
            return "No cap, something went blank. Try asking again! 🧠";
        }

        console.log('[AIChatService] Successfully received AI response.');
        return candidateText.trim();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error('[AIChatService] Request timed out after 15 seconds.');
            throw new Error('Request timed out. Check your internet connection.');
        }
        console.error('[AIChatService] FATAL ERROR:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to connect to SmartChalk AI.');
    }
}