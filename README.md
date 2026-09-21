# CookFlow AI — Vercel production project

This is the deployable React + Vite CookFlow website with a server-side Gemini API function.

## GitHub
Upload the CONTENTS of this folder to the ROOT of a GitHub repository. The root must contain `index.html`, `package.json`, `src/`, and `api/`.

## Vercel
1. Import the GitHub repository in Vercel.
2. Root Directory: `.` (repository root).
3. Framework Preset: Vite.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add Environment Variables:
   - `GEMINI_API_KEY` = your NEW Gemini API key
   - `GEMINI_MODEL` = `gemini-2.5-flash`
7. Deploy/redeploy.

Do not put the Gemini API key in React source code or commit a `.env` file.
