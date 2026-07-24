// Max images to include in a single vision API call during chunk analysis.
// Keeping this low (3) prevents context-window overflow on large submissions.
const GRADING_CHUNK_SIZE = 3;

const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-8b',
  'gemini-2.5-pro'
];

async function callGeminiApi(modelName, systemPrompt, userPrompt, partsOverride = null, temp = 0.7) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key not found in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const parts = partsOverride || [{ text: userPrompt }];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      systemInstruction: {
        parts: [
          { text: systemPrompt }
        ]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: temp,
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    const errorObj = {
      status: response.status,
      message: errText
    };
    throw errorObj;
  }

  const resData = await response.json();

  // Check for blocked / filtered / empty candidates before accessing content
  const candidate = resData.candidates?.[0];
  if (!candidate) {
    // promptFeedback may carry a blockReason when all candidates are suppressed
    const blockReason = resData.promptFeedback?.blockReason || 'UNKNOWN';
    throw { status: 200, message: `Gemini blocked the request (${blockReason}). No candidates returned.` };
  }

  const finishReason = candidate.finishReason;
  if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
    throw { status: 200, message: `Gemini candidate finished with reason: ${finishReason}. No usable output.` };
  }

  const content = candidate.content?.parts?.[0]?.text;
  if (!content) {
    throw { status: 200, message: 'Gemini returned an empty content string.' };
  }

  return JSON.parse(content);
}

async function fetchWithFallback(systemPrompt, userPrompt, partsOverride = null, temp = 0.7) {
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Gemini Request] Attempting call with model: ${model}`);
      const result = await callGeminiApi(model, systemPrompt, userPrompt, partsOverride, temp);
      return result;
    } catch (err) {
      console.warn(`[Gemini Warning] Model ${model} failed (Status: ${err.status || 'unknown'}):`, err);
      lastError = err;
      // Continue to next model on transient errors (503 Service Unavailable, 429 Rate Limit, etc.)
      continue;
    }
  }
  const errorObj = new Error(lastError?.message || 'All Gemini models failed');
  errorObj.status = lastError?.status;
  throw errorObj;
}

async function callGroqTextApi(systemPrompt, userPrompt, temp = 0.7) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key not found in environment variables.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temp,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq Text API Error: ${response.status} - ${errText}`);
  }

  const resData = await response.json();
  const content = resData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from Groq API.');
  }
  return JSON.parse(content);
}

async function callGroqVisionApi(systemPrompt, userPromptText, imageUrls, temp = 0.1) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key not found in environment variables.');
  }

  const contentArray = [
    { type: 'text', text: userPromptText }
  ];

  if (imageUrls) {
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    urls.forEach((url) => {
      if (url) {
        contentArray.push({
          type: 'image_url',
          image_url: { url }
        });
      }
    });
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentArray }
      ],
      temperature: temp,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq Vision API Error: ${response.status} - ${errText}`);
  }

  const resData = await response.json();
  const content = resData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from Groq Vision API.');
  }
  return JSON.parse(content);
}

async function fetchFromGroq(systemPrompt, userPrompt) {
  try {
    return await fetchWithFallback(systemPrompt, userPrompt, null, 0.7);
  } catch (geminiErr) {
    console.warn('[AI Fallback] Gemini failed. Trying Groq...', geminiErr);
    try {
      return await callGroqTextApi(systemPrompt, userPrompt, 0.7);
    } catch (groqErr) {
      console.error('[AI Fallback] Both Gemini and Groq failed:', groqErr);
      throw new Error(`AI Service Unavailable. Gemini status: ${geminiErr.status}. Groq error: ${groqErr.message}`);
    }
  }
}

async function urlToBase64Part(url) {
  try {
    // Use no-cors mode is NOT suitable for reading body — we need cors with credentials via the signed URL.
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching file URL`);
    const blob = await res.blob();

    // Derive MIME type: prefer blob.type, fall back to extension from URL path
    let mimeType = blob.type;
    if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
      const cleanPath = url.split('?')[0].split('#')[0].toLowerCase();
      if (cleanPath.endsWith('.pdf'))  mimeType = 'application/pdf';
      else if (cleanPath.endsWith('.png'))  mimeType = 'image/png';
      else if (cleanPath.endsWith('.jpg') || cleanPath.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (cleanPath.endsWith('.webp')) mimeType = 'image/webp';
      else if (cleanPath.endsWith('.gif'))  mimeType = 'image/gif';
      else mimeType = 'image/jpeg'; // safe default for photos
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            mimeType,
            data: base64data
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('[urlToBase64Part] Failed to fetch/convert URL:', url, err);
    return null;
  }
}

async function fetchFromGroqVision(systemPrompt, userPromptText, imageUrls) {
  try {
    const parts = [
      { text: userPromptText }
    ];

    if (imageUrls) {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      for (const url of urls) {
        if (url) {
          const imagePart = await urlToBase64Part(url);
          if (imagePart) {
            parts.push(imagePart);
          }
        }
      }
    }

    return await fetchWithFallback(systemPrompt, userPromptText, parts, 0.1);
  } catch (geminiErr) {
    console.warn('[AI Fallback] Gemini vision failed. Trying Groq vision...', geminiErr);
    try {
      return await callGroqVisionApi(systemPrompt, userPromptText, imageUrls, 0.1);
    } catch (groqErr) {
      console.error('[AI Fallback] Both Gemini vision and Groq vision failed:', groqErr);
      throw new Error(`AI Vision Service Unavailable. Gemini status: ${geminiErr.status}. Groq error: ${groqErr.message}`);
    }
  }
}

/**
 * Generates an AI test based on grade, topic, difficulty level, and optional custom instructions.
 */
export async function generateAITest({ grade, topic, level, instructions }) {
  const systemPrompt = `You are an elite academic tutor. Your task is to create a formal test paper that is perfectly aligned with the requested grade level, topic, and difficulty level.

STRICT TOPIC & SYLLABUS ALIGNMENT DIRECTIVE:
1. STRICT TOPIC ADHERENCE: Focus exclusively on the requested topic: "${topic}". Do not introduce questions, terms, or mathematical concepts from unrelated topics. Keep every single question directly relevant to the topic.
2. GRADE-LEVEL COMPLIANCE: Target the educational complexity level of Grade: "${grade}". Avoid questions that are too advanced (e.g. college or high school math for elementary students) or too simple.
3. DIFFICULTY SPECIFICATION: Calibrate questions according to the difficulty: "${level}".
   - Easy: Direct questions, basic recall, simple exercises.
   - Medium: Conceptual application, standard multi-step problems.
   - Hard: Advanced problem solving, complex calculations, deep reasoning.
4. CUSTOM INSTRUCTIONS: Incorporate these instructions strictly: "${instructions || 'None'}".

LaTeX MATH FORMATTING RULES:
1. Wrap all mathematical equations, variables, symbols, and expressions inside standard delimiters:
   - Use "$" for inline equations (e.g., "$a^2 + b^2 = c^2$").
   - Use "$$" for display/block equations (e.g., "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$").
2. CRITICAL: Never split a single math formula or its "$" delimiters across multiple newlines/line breaks. A formula and its delimiters must reside entirely on a single line.
3. CRITICAL: You MUST double-escape all backslashes inside JSON strings. Write "\\frac" instead of "\frac", "\\cdot" instead of "\cdot", "\\times" instead of "\times", etc.

MARKDOWN FORMATTING RULES:
- Use "# [Section Title]" for main headers.
- Use "## [Sub-Header]" for sub-sections.
- Questions must start with a number followed by a period (e.g., "1. Solve the following...").

Return a JSON object in this EXACT format:
{
  "title": "Test Title (incorporating topic and grade)",
  "description": "Short description of the test guidelines and duration",
  "maxScore": 100,
  "testContent": "Detailed question paper in markdown format. Do not include answers."
}`;

  const userPrompt = `Grade: ${grade}
Topic: ${topic}
Difficulty Level: ${level}
Additional Instructions: ${instructions || 'None'}`;

  return fetchFromGroq(systemPrompt, userPrompt);
}

/**
 * Generates an AI MCQ quiz based on grade, topic, difficulty level, and number of questions.
 */
export async function generateAIQuiz({ grade, topic, level, count = 5 }) {
  const systemPrompt = `You are an elite academic tutor. Create a multiple choice question (MCQ) quiz based on the requested topic, grade, and level.

STRICT TOPIC & SYLLABUS ALIGNMENT DIRECTIVE:
1. STRICT TOPIC ADHERENCE: Focus exclusively on the requested topic: "${topic}". Do not introduce questions, terms, or mathematical concepts from unrelated topics. Keep every single question directly relevant to the topic.
2. GRADE-LEVEL COMPLIANCE: Target the educational complexity level of Grade: "${grade}". Avoid questions that are too advanced (e.g. college or high school math for elementary students) or too simple.
3. DIFFICULTY SPECIFICATION: Calibrate questions according to the difficulty: "${level}".
   - Easy: Direct questions, basic recall, simple exercises.
   - Medium: Conceptual application, standard multi-step problems.
   - Hard: Advanced problem solving, complex calculations, deep reasoning.

LaTeX MATH FORMATTING RULES:
1. Wrap all mathematical equations, variables, symbols, and expressions inside standard delimiters:
   - Use "$" for inline equations (e.g., "$a^2 + b^2 = c^2$").
   - Use "$$" for display/block equations (e.g., "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$").
2. CRITICAL: Never split a single math formula or its "$" delimiters across multiple newlines/line breaks. A formula and its delimiters must reside entirely on a single line.
3. CRITICAL: You MUST double-escape all backslashes inside JSON strings. Write "\\frac" instead of "\frac", "\\cdot" instead of "\cdot", "\\times" instead of "\times", etc.

Return a JSON object in this EXACT format:
{
  "title": "Quiz Title (incorporating topic and grade)",
  "questions": [
    {
      "questionText": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0
    }
  ]
}
Note: "correctOptionIndex" must be a 0-indexed integer (0 for option 1, 1 for option 2, etc.) matching the correct option. Produce exactly ${count} questions.`;

  const userPrompt = `Grade: ${grade}
Topic: ${topic}
Difficulty Level: ${level}`;

  return fetchFromGroq(systemPrompt, userPrompt);
}

/**
 * Phase 1 helper: Analyses one small chunk of solution images and returns
 * a text description of all visible student work in those pages.
 * Falls back from Gemini vision → Groq vision on failure.
 */
async function analyzeImageChunkWithAI(questionContext, chunkImages, chunkIndex, totalChunks) {
  const chunkLabel = `Pages ${chunkIndex * GRADING_CHUNK_SIZE + 1}–${Math.min((chunkIndex + 1) * GRADING_CHUNK_SIZE, totalChunks * GRADING_CHUNK_SIZE)}`;

  const extractionSystemPrompt = `You are a careful academic reader. Your ONLY job is to read and transcribe what you see in the submitted solution pages — do NOT grade or score anything yet.

For every question you can identify in the pages:
- State the question number.
- Describe the student's approach, steps, working, and final answer in detail.
- If a question's solution spans multiple steps or pages, capture all of them.
- If a question is skipped or blank, explicitly note it as blank.
- Preserve any mathematical expressions or equations you see.

Return ONLY a plain text extract. Do NOT return JSON. Be exhaustive — missing work here means marks will be wrongly deducted in the final grade.`;

  const extractionUserPrompt = `These are solution pages ${chunkLabel} of the student's submission (chunk ${chunkIndex + 1} of ${totalChunks}).

For reference, the question paper is:
${questionContext}

Please transcribe ALL visible student work from these pages in detail.`;

  // Build base64 parts for this chunk (text label + image data parts)
  const textPart = { text: extractionUserPrompt };
  const imageParts = [];
  for (const url of chunkImages) {
    if (url) {
      const part = await urlToBase64Part(url);
      if (part) imageParts.push(part);
    }
  }

  // Guard: if no images loaded successfully, skip vision API call entirely
  if (imageParts.length === 0) {
    console.warn(`[Grading Chunk ${chunkIndex + 1}] No images could be loaded from URLs. Returning placeholder.`);
    return `[CHUNK ${chunkIndex + 1} — Files could not be loaded (possible auth/CORS issue). All questions from these pages are treated as visually unverifiable — grade only from typed answers for those questions.]`;
  }

  const parts = [textPart, ...imageParts];
  console.log(`[Grading Chunk ${chunkIndex + 1}] Loaded ${imageParts.length}/${chunkImages.length} image parts. Calling vision API...`);

  // Try each Gemini vision model directly (raw text response — no JSON parse)
  for (const model of GEMINI_MODELS) {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) break; // No key → skip to Groq immediately

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          systemInstruction: { parts: [{ text: extractionSystemPrompt }] },
          generationConfig: { temperature: 0.05 }
          // No responseMimeType: 'application/json' — we want raw text
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Grading Chunk ${chunkIndex + 1}] Gemini model ${model} rejected (${res.status}):`, errText);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`[Grading Chunk ${chunkIndex + 1}] Extracted via Gemini (${model}).`);
        return text;
      }
      console.warn(`[Grading Chunk ${chunkIndex + 1}] Gemini model ${model} returned empty content.`);
    } catch (err) {
      console.warn(`[Grading Chunk ${chunkIndex + 1}] Gemini model ${model} threw:`, err);
    }
  }
  console.warn(`[Grading Chunk ${chunkIndex + 1}] All Gemini models failed. Falling back to Groq vision...`);


  // Fallback: Groq vision (images only, plain text response)
  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API Key not found.');

    const contentArray = [{ type: 'text', text: extractionUserPrompt }];
    chunkImages.forEach(url => {
      if (url) contentArray.push({ type: 'image_url', image_url: { url } });
    });

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: extractionSystemPrompt },
          { role: 'user', content: contentArray }
        ],
        temperature: 0.05
        // No response_format constraint — we want plain text here
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq Vision Error: ${groqRes.status} - ${errText}`);
    }
    const groqData = await groqRes.json();
    return groqData.choices?.[0]?.message?.content || `[Chunk ${chunkIndex + 1}: No text extracted]`;
  } catch (groqErr) {
    console.error(`[Grading Chunk ${chunkIndex + 1}] Both Gemini and Groq vision failed:`, groqErr);
    // Return a placeholder so synthesis still happens — just with a note about missing pages
    return `[CHUNK ${chunkIndex + 1} UNREADABLE — Vision API failed for pages ${chunkLabel}. Treat any questions in this range as unanswered and deduct marks accordingly.]`;
  }
}

export async function gradeSubmissionWithAI({
  testTitle,
  testQuestions,
  maxScore,
  studentAnswers,
  imageUrls,
  imageUrl,
  studentName,
  questionFileURL
}) {
  const systemPrompt = `You are an elite academic tutor. Your task is to grade the student's submission with extreme precision, accuracy, and fairness.

GRADING RUBRIC & STRATEGY:
1. STEP-BY-STEP EVALUATION:
   - For each question in the test paper (provided as text and/or as a question paper file), analyze the correct answer/method.
   - Look at the student's written text answers AND scan all attached submission files (images or PDFs containing handwritten/typed solution sheets) carefully to check their work, derivations, formulas, and final answers.
   - Do not guess or assume. Grade strictly based on visible correct work.
2. STRICT SCORE CALCULATION:
   - Assign partial points for correct steps and full points for correct final solutions.
   - Sum the individual question scores to calculate the final total score.
   - The final total score MUST be a number, and it MUST be less than or equal to the maximum score (${maxScore}).
3. NO HALLUCINATIONS:
   - If a student's answer is mathematically incorrect, do not give full marks. Deduct points appropriately and point out the exact error.
   - If the student's answer is blank or missing, assign 0 points for that question.

CRITICAL FORMATTING RULES FOR FEEDBACK:
- The feedback MUST be written in the first person as a warm, direct conversation from you (the teacher) to the student.
- Address the student by name, starting with "Hi ${studentName || 'Student'}," or "Hello ${studentName || 'Student'},".
- Speak directly to them: use "your work", "you solved", "I recommend", etc.
- You MUST provide a **Question-wise Score Breakdown** at the very beginning of the feedback. Format it like this:
  📋 **Marks Breakdown:**
  • **Question 1**: X/Y marks — [Reason for full marks OR explanation of deductions]
  • **Question 2**: X/Y marks — [Reason for full marks OR explanation of deductions]
  (Make sure the sum of all question marks matches the final total score returned).
- Following the breakdown, write a brief encouraging summary and 2 to 4 crisp, actionable bullet points detailing:
  • Specific strengths (what they did well).
  • Precise corrections/recommendations for next time.

Return a JSON object in this EXACT format:
{
  "score": 85, // Calculated total numerical score (out of ${maxScore}), must be a number.
  "feedback": "Hello ${studentName || 'Student'},\n\n📋 **Marks Breakdown:**\n• **Question 1**: X/Y marks — [Reason]\n• **Question 2**: X/Y marks — [Reason]\n\n[Brief encouraging summary]\n• [Point-wise strength]\n• [Point-wise recommendation]"
}`;

  // ─── PHASE 1: Chunk-based vision analysis ────────────────────────────────
  // Split solution files into batches to avoid context-window overflow.
  // Each chunk is analysed independently; the AI extracts visible work as text.
  const urls = (imageUrls || (imageUrl ? [imageUrl] : [])).filter(Boolean);

  // Question context string passed to each extraction chunk
  const questionContext = `${testTitle}\n\n${testQuestions || 'No question text provided.'}`;

  // Max chars we pass into the synthesis prompt from Phase 1 extracts.
  // ~40k chars ≈ ~10k tokens, well within Gemini/Groq context limits for JSON output.
  const MAX_EXTRACT_CHARS = 40000;

  let compiledExtract = '';

  if (urls.length > 0) {
    const totalChunks = Math.ceil(urls.length / GRADING_CHUNK_SIZE);
    console.log(`[AI Grading] Starting Phase 1 — ${urls.length} files across ${totalChunks} chunk(s).`);

    const chunkExtracts = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkImages = urls.slice(i * GRADING_CHUNK_SIZE, (i + 1) * GRADING_CHUNK_SIZE);
      console.log(`[AI Grading] Analysing chunk ${i + 1}/${totalChunks} — ${chunkImages.length} file(s).`);
      const extract = await analyzeImageChunkWithAI(questionContext, chunkImages, i, totalChunks);

      // Truncate each chunk's extract to keep total within limits
      const chunkCharBudget = Math.floor(MAX_EXTRACT_CHARS / totalChunks);
      const safeExtract = extract.length > chunkCharBudget
        ? extract.slice(0, chunkCharBudget) + `\n[...truncated to ${chunkCharBudget} chars to stay within API limits]`
        : extract;

      chunkExtracts.push(`--- SOLUTION PAGES (CHUNK ${i + 1} of ${totalChunks}) ---\n${safeExtract}`);
    }

    compiledExtract = chunkExtracts.join('\n\n');
    console.log(`[AI Grading] Phase 1 complete. Compiled ${compiledExtract.length} chars of extracted work.`);
  } else {
    console.log('[AI Grading] No image files — skipping Phase 1, grading from text only.');
  }

  // ─── PHASE 2: Final grading synthesis (PURE TEXT — no images) ───────────
  // Phase 2 is intentionally text-only. Sending images alongside
  // responseMimeType=application/json causes Gemini to throw
  // 'model output must contain either output text or tool calls'.
  // All visual content was already transcribed to text in Phase 1.
  const synthesisUserPrompt = `Test Title: ${testTitle}
Maximum Score: ${maxScore}
Student's Name: ${studentName || 'Student'}

TEST QUESTIONS:
${testQuestions || 'Question text not provided in text form (was attached as a file).'}

STUDENT'S TYPED ANSWERS (if any):
${studentAnswers || 'No typed answers provided.'}

STUDENT'S HANDWRITTEN / UPLOADED WORK (extracted from ${urls.length} submitted file(s) across ${Math.ceil(urls.length / GRADING_CHUNK_SIZE) || 0} chunk(s)):
${compiledExtract || 'No file submissions detected. Grade based on typed answers only.'}

IMPORTANT GRADING NOTES:
- The extracted work above captures ALL submitted pages read sequentially. Do NOT assume any question was skipped just because it has no typed response — the extracted work section is the primary source of the student's answers.
- If a chunk is marked UNREADABLE, treat those pages as missing and deduct marks accordingly.
- Your score MUST be a number reflecting exactly what is visible in the extracted work — no inflation, no deflation.`;

  console.log(`[AI Grading] Starting Phase 2 — text-only synthesis (${synthesisUserPrompt.length} chars).`);

  // Phase 2 is a plain text-only call — just one text part, no images
  const synthesisParts = [{ text: synthesisUserPrompt }];

  // Fallback Ladder:
  // Level 1: Gemini (all models) with question file part if available
  try {
    const result = await fetchWithFallback(systemPrompt, null, synthesisParts, 0.1);
    console.log('[AI Grading] Phase 2 complete via Gemini.');
    return result;
  } catch (geminiErr) {
    console.warn('[AI Grading] Level 1 (Gemini) synthesis failed. Trying Level 2 (Groq text)...', geminiErr);
  }

  // Level 2: Groq text (no images — all data is already compiled in synthesisUserPrompt)
  try {
    const result = await callGroqTextApi(systemPrompt, synthesisUserPrompt, 0.1);
    console.log('[AI Grading] Phase 2 complete via Groq text fallback.');
    return result;
  } catch (groqTextErr) {
    console.warn('[AI Grading] Level 2 (Groq text) synthesis failed. Trying Level 3 (Groq vision)...', groqTextErr);
  }

  // Level 3: Groq vision with image-only URLs as last resort
  try {
    const imageOnlyUrls = urls.filter(url => {
      const clean = url.split('?')[0].split('#')[0].toLowerCase();
      return clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') ||
             clean.endsWith('.webp') || clean.endsWith('.gif');
    });
    const result = await callGroqVisionApi(systemPrompt, synthesisUserPrompt, imageOnlyUrls, 0.1);
    console.log('[AI Grading] Phase 2 complete via Groq vision fallback.');
    return result;
  } catch (groqVisionErr) {
    console.error('[AI Grading] All fallback levels exhausted:', groqVisionErr);
    throw new Error(
      'AI Grading Service Unavailable. All API fallbacks (Gemini + Groq text + Groq vision) failed. ' +
      'Please try again in a few moments or enter the grade manually.'
    );
  }
}

/**
 * Generates an AI assignment based on grade, topic, difficulty level, and optional custom instructions.
 */
export async function generateAIAssignment({ grade, topic, level, instructions }) {
  const systemPrompt = `You are an elite academic tutor. Create a formal assignment paper based on the requested topic, grade, and level.

STRICT TOPIC & SYLLABUS ALIGNMENT DIRECTIVE:
1. STRICT TOPIC ADHERENCE: Focus exclusively on the requested topic: "${topic}". Do not introduce questions, terms, or mathematical concepts from unrelated topics. Keep every single question directly relevant to the topic.
2. GRADE-LEVEL COMPLIANCE: Target the educational complexity level of Grade: "${grade}". Avoid questions that are too advanced (e.g. college or high school math for elementary students) or too simple.
3. DIFFICULTY SPECIFICATION: Calibrate questions according to the difficulty: "${level}".
   - Easy: Direct questions, basic recall, simple exercises.
   - Medium: Conceptual application, standard multi-step problems.
   - Hard: Advanced problem solving, complex calculations, deep reasoning.

LaTeX MATH FORMATTING RULES:
1. Wrap all mathematical equations, variables, symbols, and expressions inside standard delimiters:
   - Use "$" for inline equations (e.g., "$a^2 + b^2 = c^2$").
   - Use "$$" for display/block equations (e.g., "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$").
2. CRITICAL: Never split a single math formula or its "$" delimiters across multiple newlines/line breaks. A formula and its delimiters must reside entirely on a single line.
3. CRITICAL: You MUST double-escape all backslashes inside JSON strings. Write "\\frac" instead of "\frac", "\\cdot" instead of "\cdot", "\\times" instead of "\times", etc.

MARKDOWN FORMATTING RULES:
- Use "# [Section Title]" for main headers.
- Use "## [Sub-Header]" for sub-sections.
- Questions must start with a number followed by a period (e.g., "1. Solve the following...").

Return a JSON object in this EXACT format:
{
  "title": "Assignment Title (incorporating topic and grade)",
  "description": "Short description of the assignment guidelines and goals",
  "maxScore": 100,
  "assignmentContent": "Detailed assignment instructions and problems in markdown format. Do not include answers."
}`;

  const userPrompt = `Grade: ${grade}
Topic: ${topic}
Difficulty Level: ${level}
Additional Instructions: ${instructions || 'None'}`;

  return fetchFromGroq(systemPrompt, userPrompt);
}

/**
 * Generates an AI worksheet for student self-study.
 */
export async function generateAIWorksheet({ grade, topic, level, count = 5 }) {
  const systemPrompt = `You are an elite academic tutor. Create a personalized practice worksheet based on the requested topic, grade, and difficulty level.
The worksheet must contain exactly ${count} practice questions.

STRICT TOPIC & SYLLABUS ALIGNMENT DIRECTIVE:
1. STRICT TOPIC ADHERENCE: Focus exclusively on the requested topic: "${topic}". Do not introduce questions, terms, or mathematical concepts from unrelated topics. Keep every single question directly relevant to the topic.
2. GRADE-LEVEL COMPLIANCE: Target the educational complexity level of Grade: "${grade}". Avoid questions that are too advanced or too simple.
3. DIFFICULTY SPECIFICATION: Calibrate questions according to the difficulty: "${level}".
   - Easy: Direct questions, basic recall, simple exercises.
   - Medium: Conceptual application, standard multi-step problems.
   - Hard: Advanced problem solving, complex calculations, deep reasoning.

LaTeX MATH FORMATTING RULES:
1. Wrap all mathematical equations, variables, symbols, and expressions inside standard delimiters:
   - Use "$" for inline equations (e.g., "$a^2 + b^2 = c^2$").
   - Use "$$" for display/block equations (e.g., "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$").
2. CRITICAL: Never split a single math formula or its "$" delimiters across multiple newlines/line breaks. A formula and its delimiters must reside entirely on a single line.
3. CRITICAL: You MUST double-escape all backslashes inside JSON strings. Write "\\frac" instead of "\frac", "\\cdot" instead of "\cdot", "\\times" instead of "\times", etc.

MARKDOWN FORMATTING RULES:
- Use "# [Section Title]" for main headers.
- Use "## [Sub-Header]" for sub-sections.
- Questions must start with a number followed by a period (e.g., "1. Solve the following...").

Return a JSON object in this EXACT format:
{
  "title": "Practice Worksheet: Topic Name",
  "description": "Short description of the worksheet topics covered",
  "questionsContent": "Detailed practice questions in markdown format. Do not include answers."
}`;

  const userPrompt = `Grade: ${grade}
Topic: ${topic}
Difficulty Level: ${level}`;

  return fetchFromGroq(systemPrompt, userPrompt);
}


