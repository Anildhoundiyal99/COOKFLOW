import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const asArray = (value, max = 80) => Array.isArray(value) ? value.map(v => String(v).trim()).filter(Boolean).slice(0, max) : [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini is not configured. Add GEMINI_API_KEY in Vercel Environment Variables and redeploy.' });
  }

  try {
    const body = req.body || {};
    const search = String(body.search || '').slice(0, 300);
    const ingredients = asArray(body.ingredients);
    const preferences = asArray(body.preferences);
    const equipment = asArray(body.equipment);
    const servings = Math.min(12, Math.max(1, Number(body.servings) || 2));

    const prompt = `You are CookFlow, an expert practical cooking assistant.

Generate 4 to 6 recipe suggestions that match the user's search and selections.

SEARCH: ${search || 'No extra search'}
INGREDIENTS AVAILABLE: ${ingredients.join(', ') || 'No specific ingredients'}
PREFERENCES: ${preferences.join(', ') || 'No special preferences'}
EQUIPMENT AVAILABLE: ${equipment.join(', ') || 'Basic kitchen utensils'}
SERVINGS: ${servings}

STRICT RULES:
1. Prioritize ingredients the user selected. You may use small pantry staples such as water, oil, salt and common spices, but list them.
2. Never require a major appliance/equipment item that the user did not select. Basic knife, spoon, bowl and plate are always allowed.
3. Respect time preferences such as Very quick, Under 20 min and Under 30 min.
4. Respect dietary choices such as Vegetarian, Vegan, Dairy-free and Gluten-free.
5. Respect taste/style/meal/cuisine preferences when selected.
6. Give realistic quantities for exactly the requested serving count.
7. Each recipe must have a useful cooking roadmap. Every step should include heat when relevant and timerSeconds (0 if no timer is useful).
8. Keep recipes practical for a normal home kitchen. Do not invent unsafe food handling instructions.
9. Return ONLY valid JSON. No markdown, no code fences, no extra text.

Return exactly this JSON structure:
{
  "intro": "one short sentence explaining why these recipes match",
  "recipes": [
    {
      "name": "Recipe name",
      "emoji": "🍳",
      "description": "short appetizing description",
      "time": 20,
      "servings": ${servings},
      "tags": ["quick", "spicy"],
      "equipment": ["Kadhai", "Gas stove"],
      "ingredients": [
        {"name": "Potato", "quantity": "2 medium"}
      ],
      "steps": [
        {"instruction": "Heat oil in the kadhai.", "heat": "medium", "timerSeconds": 60}
      ],
      "substitutions": ["Use tofu instead of paneer if dairy-free."],
      "tips": ["Serve hot." ]
    }
  ]
}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.65,
        responseMimeType: 'application/json'
      }
    });

    const raw = response.text || '';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error('Gemini returned non-JSON:', raw.slice(0, 1000));
      return res.status(502).json({ error: 'Gemini returned an invalid recipe response. Please try again.' });
    }

    if (!data || !Array.isArray(data.recipes)) {
      return res.status(502).json({ error: 'Gemini returned an unexpected recipe format. Please try again.' });
    }

    const recipes = data.recipes.slice(0, 6).map(recipe => ({
      name: String(recipe.name || 'AI Recipe'),
      emoji: String(recipe.emoji || '🍳'),
      description: String(recipe.description || ''),
      time: Number(recipe.time) || 0,
      servings: Number(recipe.servings) || servings,
      tags: asArray(recipe.tags, 12),
      equipment: asArray(recipe.equipment, 20),
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.slice(0, 40).map(x => ({ name: String(x?.name || ''), quantity: String(x?.quantity || '') })).filter(x => x.name) : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps.slice(0, 30).map(x => ({ instruction: String(x?.instruction || ''), heat: String(x?.heat || 'none'), timerSeconds: Math.max(0, Math.min(7200, Number(x?.timerSeconds) || 0)) })).filter(x => x.instruction) : [],
      substitutions: asArray(recipe.substitutions, 10),
      tips: asArray(recipe.tips, 10)
    }));

    return res.status(200).json({ intro: String(data.intro || 'Personalized from your selections.'), recipes });
  } catch (error) {
    console.error('CookFlow API error:', error);
    const message = error?.message || 'Gemini request failed.';
    return res.status(500).json({ error: message.includes('429') ? 'Gemini free-tier limit reached. Please wait a little and try again.' : message });
  }
}
