import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Image Analysis with gemini-3.1-pro-preview
app.post('/api/analyze-room', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', roomType, priority, goal } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    // Clean base64 string if data URI was passed
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const promptText = `
Analyze this room photo thoroughly as an elite professional organizer and spatial architect.
Provide a high-precision decluttering breakdown, identifying clutter hotspots, functional zoning, surface friction, and an actionable step-by-step organization plan.

User parameters:
- Stated Room Type: ${roomType || 'Auto-detect from image'}
- Stated Priority/Style: ${priority || 'Balanced, functional and calming'}
- Stated Goal: ${goal || 'Declutter and create an organized, easy-to-maintain space'}

Include:
1. Room identification & objective visual summary
2. Clutter Score from 1 to 100 (100 = extreme clutter/chaos, 1 = showroom minimalist)
3. Calmness Rating (e.g., 'Severe Visual Friction', 'Moderate Clutter', 'High Potential Tranquility')
4. Estimated time in minutes to declutter and organize
5. Hotspots: 3 to 6 specific cluttered spots or surface zones with severity, items identified, quick 2-minute fix, approximate location, and approximate coordinate positions (x and y percentage 0-100 on the image)
6. Declutter Phases: 3 to 4 sequential phases (e.g., Phase 1: Quick Surface Wins, Phase 2: Category Purge & Triage, Phase 3: Spatial Containment & Storage, Phase 4: Reset & Habit). Each task must have action, tips, and estimated minutes.
7. Triage Matrix: Concrete recommendations for what to KEEP, DONATE/SELL, RECYCLE/TRASH, and RELOCATE to other rooms.
8. Recommended Storage Solutions: 3 to 5 realistic container or organization systems with affordable DIY alternatives.
9. Daily Maintenance Habit: A specific 60-second to 2-minute daily micro-routine tailored to this exact room layout to prevent clutter from ever returning.
10. A brief motivational summary statement to inspire the user.
`;

    const requestConfig = {
      systemInstruction: `You are DeclutterAI, a master certified home organizer (NAPO & KonMari accredited) and architectural space planner. 
You provide structured, warm, highly tactical, and non-judgmental room organization guidance. Always produce valid JSON matching the requested schema.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roomType: { type: Type.STRING },
          roomSummary: { type: Type.STRING },
          clutterScore: { type: Type.INTEGER },
          calmnessRating: { type: Type.STRING },
          estimatedTimeMinutes: { type: Type.INTEGER },
          hotspots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                severity: { type: Type.STRING },
                description: { type: Type.STRING },
                primaryItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                quickFix: { type: Type.STRING },
                approxLocation: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                  },
                  required: ['x', 'y'],
                },
              },
              required: ['id', 'name', 'severity', 'description', 'primaryItems', 'quickFix', 'approxLocation'],
            },
          },
          declutterPhases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phaseNumber: { type: Type.INTEGER },
                phaseTitle: { type: Type.STRING },
                goal: { type: Type.STRING },
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      action: { type: Type.STRING },
                      tips: { type: Type.STRING },
                      estimatedMinutes: { type: Type.INTEGER },
                    },
                    required: ['id', 'action', 'tips', 'estimatedMinutes'],
                  },
                },
              },
              required: ['phaseNumber', 'phaseTitle', 'goal', 'tasks'],
            },
          },
          triageMatrix: {
            type: Type.OBJECT,
            properties: {
              keep: { type: Type.ARRAY, items: { type: Type.STRING } },
              donateOrSell: { type: Type.ARRAY, items: { type: Type.STRING } },
              recycleOrTrash: { type: Type.ARRAY, items: { type: Type.STRING } },
              relocate: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['keep', 'donateOrSell', 'recycleOrTrash', 'relocate'],
          },
          recommendedStorageSolutions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                recommendation: { type: Type.STRING },
                whyItHelps: { type: Type.STRING },
                budgetFriendlyDiyAlt: { type: Type.STRING },
              },
              required: ['category', 'recommendation', 'whyItHelps', 'budgetFriendlyDiyAlt'],
            },
          },
          dailyMaintenanceHabit: { type: Type.STRING },
          motivationalSummary: { type: Type.STRING },
        },
        required: [
          'roomType',
          'roomSummary',
          'clutterScore',
          'calmnessRating',
          'estimatedTimeMinutes',
          'hotspots',
          'declutterPhases',
          'triageMatrix',
          'recommendedStorageSolutions',
          'dailyMaintenanceHabit',
        ],
      },
    };

    const requestContents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    ];

    // Using gemini-3.5-flash for free-tier compatible high-fidelity multimodal room analysis
    const modelUsed = 'gemini-3.5-flash';
    const response = await ai.models.generateContent({
      model: modelUsed,
      contents: requestContents,
      config: requestConfig,
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response text received from Gemini.');
    }

    const parsed = JSON.parse(text);
    return res.json({ result: parsed, modelUsed });
  } catch (err: any) {
    console.error('Error in /api/analyze-room:', err);
    return res.status(500).json({
      error: err.message || 'Failed to analyze room photo.',
      details: err.toString(),
    });
  }
});

// Multi-turn Gemini Chat with Role System Instructions
// Supports:
// - gemini-3.5-flash for complex spatial layout tasks (architect role)
// - gemini-3.5-flash for general declutter coaching (coach role)
// - gemini-3.1-flash-lite for rapid triage & speed tips (sprint role)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      model,
      role = 'coach',
      roomContext,
      imageBase64,
      mimeType = 'image/jpeg',
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Determine model based on task complexity or explicit request
    let selectedModel = model;
    if (!selectedModel) {
      if (role === 'sprint') {
        selectedModel = 'gemini-3.1-flash-lite'; // Fast, snappy triage & quick tips
      } else {
        selectedModel = 'gemini-3.5-flash'; // High-performance general & architectural tasks
      }
    }

    // Role-specific System Instructions
    let systemInstruction = '';
    if (role === 'architect') {
      systemInstruction = `You are the Master Space Architect, powered by Gemini 3.5 Flash. 
Your specialty is deep spatial reasoning, structural organization, furniture layout optimization, storage dimensioning, and solving complex architectural clutter dilemmas.
You give precise, ergonomic, high-efficiency recommendations with clear zoning principles, spatial measurements, and clever vertical utilization.
${roomContext ? `Current Room Context: Type: ${roomContext.roomType}, Clutter Score: ${roomContext.clutterScore}/100, Summary: ${roomContext.roomSummary}` : ''}`;
    } else if (role === 'sprint' || selectedModel === 'gemini-3.1-flash-lite') {
      systemInstruction = `You are the 5-Minute Sprint Organizer, powered by Gemini 3.1 Flash-Lite.
Your specialty is rapid-fire, high-energy, actionable advice for organizing right now.
Provide punchy answers, rapid keep-or-toss triage rules, 3-minute blitz routines, and immediate answers without fluff or excessive preamble.
${roomContext ? `Current Room Context: ${roomContext.roomType} (Clutter Score ${roomContext.clutterScore}/100)` : ''}`;
    } else {
      // General Coach
      systemInstruction = `You are the Mindful Declutter Coach, powered by Gemini 3.5 Flash.
Your specialty is holistic home organization, compassionate decluttering coaching, the KonMari method, letting go of sentimental items, and establishing gentle, lasting habits.
Provide encouraging, structured, step-by-step guidance that feels achievable, warm, and uplifting.
${roomContext ? `Current Room Context: Type: ${roomContext.roomType}, Clutter Score: ${roomContext.clutterScore}/100, Summary: ${roomContext.roomSummary}` : ''}`;
    }

    // Format conversation history for Gemini API
    const contents: any[] = [];

    // If an image is provided and this is part of the context, attach to the first user turn
    let imageAttached = false;
    const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '') : null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const roleMapped = msg.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [];

      if (!imageAttached && cleanBase64 && roleMapped === 'user') {
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        });
        imageAttached = true;
      }

      parts.push({
        text: msg.content,
      });

      contents.push({
        role: roleMapped,
        parts,
      });
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || "I'm here to help you declutter and organize this space. What would you like to tackle next?";

    return res.json({
      reply,
      modelUsed: selectedModel,
      roleUsed: role,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate chat response.',
      details: err.toString(),
    });
  }
});

// Rapid 1-question Triage endpoint using gemini-3.1-flash-lite
app.post('/api/quick-triage', async (req: Request, res: Response) => {
  try {
    const { itemDescription, itemAge, frequencyOfUse, emotionalAttachment } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Quick declutter triage verdict for item: "${itemDescription}".
Details: Last used: ${frequencyOfUse || 'Unknown'}, Age: ${itemAge || 'Unknown'}, Emotional attachment: ${emotionalAttachment || 'Low/Medium'}.
Give:
1. Verdict: KEEP, DONATE, RECYCLE/TRASH, or RELOCATE.
2. 1-sentence crisp rationale.
3. Next immediate step (under 10 seconds).`,
      config: {
        systemInstruction: 'You are an ultra-fast declutter triage referee. Deliver instant, crisp verdicts.',
      },
    });

    return res.json({
      verdict: response.text || 'Keep if it brings daily utility or genuine joy; otherwise donate.',
    });
  } catch (err: any) {
    console.error('Error in /api/quick-triage:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Serve frontend in dev or prod
async function setupApp() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DeclutterAI server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
