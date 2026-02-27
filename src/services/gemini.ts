import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, NoteType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTIONS: Record<NoteType, string> = {
  'summary': "You are an expert at distilling complex information into concise, high-impact summaries. Focus on key takeaways and main arguments.",
  'study-guide': "You are a world-class educator. Create a structured study guide with clear headings, definitions of key terms, and a 'Check Your Understanding' section at the end.",
  'meeting-minutes': "You are a professional secretary. Organize the input into clear meeting minutes including: Attendees (if mentioned), Agenda, Key Discussion Points, Decisions Made, and Action Items.",
  'brainstorm': "You are a creative strategist. Expand on the provided ideas, suggesting related concepts, potential challenges, and innovative directions.",
  'flashcards': "You are a memory specialist. Convert the information into a series of clear Question/Answer pairs suitable for flashcards. Format them clearly."
};

export async function generateNote(
  sourceText: string,
  config: GenerationConfig
) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Source Content:
    ${sourceText}

    Task: Generate a ${config.length} ${config.type} note in a ${config.tone} tone.
    
    Requirements:
    - Use Markdown for formatting (bolding, lists, headers).
    - Ensure the output is well-structured and easy to read.
    - If the source content is too short or vague, try to infer context or ask for more details within the note structure.
    - Start with a clear, concise title for the note prefixed with '# '.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS[config.type],
      temperature: 0.7,
    },
  });

  return response.text || "Failed to generate note.";
}
