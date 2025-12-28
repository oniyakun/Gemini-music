import { GoogleGenAI, Type } from "@google/genai";
import { LyricLine } from "../types";

/**
 * Uses Gemini to parse raw text lyrics and align them to the audio.
 */
export const processLyricsWithGemini = async (
  rawText: string,
  totalDuration: number,
  audioBase64?: string,
  mimeType: string = "audio/mp3"
): Promise<LyricLine[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (!audioBase64) {
      throw new Error("Audio data is missing. Cannot perform AI sync.");
    }

    // UPDATED PROMPT: Gemini 3.0 Optimization
    // Using gemini-3-pro-preview for advanced reasoning on alignment.
    // Extremely strict instructions to prevent text modification.
    const prompt = `
      ROLE: Precise Audio-Text Aligner.

      TASK: 
      Map the provided lyrics to the audio file timestamp by timestamp.

      INPUT LYRICS (IMMUTABLE REFERENCE):
      """
      ${rawText}
      """

      METADATA:
      - Song Duration: ${totalDuration} seconds

      STRICT CONSTRAINTS:
      1. **TEXT INTEGRITY**: The \`text\` field in your JSON output MUST be a character-for-character COPY of the Input Lyrics lines. 
         - DO NOT correct spelling.
         - DO NOT change punctuation.
         - DO NOT add words you "hear" that aren't in the text.
         - If the text says "gonna" and audio says "going to", you WRITE "gonna".
      2. **ALIGNMENT**: Listen to the audio to find the start time of each line.
      3. **COMPLETENESS**: Return exactly one timestamp object for every non-empty line in the input.

      OUTPUT FORMAT:
      Return a JSON Array of objects.
    `;

    const parts: any[] = [
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64
        }
      },
      {
        text: prompt
      }
    ];

    // Switched to gemini-3-pro-preview as requested by user
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.NUMBER, description: "Start time in seconds (float)" },
              text: { type: Type.STRING, description: "EXACT copy of input lyric line" },
              translation: { type: Type.STRING, description: "Optional translation" },
            },
            required: ["time", "text"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as LyricLine[];
      
      // Post-processing validation
      const validatedData = data
        .filter(l => {
            return l.time >= 0 && l.time <= totalDuration + 20; // Allow slight overflow
        })
        .sort((a, b) => a.time - b.time);

      if (validatedData.length === 0) {
         throw new Error("Gemini returned no valid lyrics data.");
      }
      return validatedData;
    }
    
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Error processing lyrics with Gemini:", error);
    throw error;
  }
};