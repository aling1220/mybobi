import { GoogleGenAI } from "@google/genai";
import { FortuneStick } from "../constants";

export async function interpretFortune(
  stick: FortuneStick,
  question: string,
  category: string
): Promise<string> {
  // Try to get API key from multiple sources
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Missing Gemini API Key. Please set GEMINI_API_KEY in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
你現在是一位精通易經與傳統民俗的解籤大師。
使用者所求之事：${category}
具體問題：${question}
抽到的籤詩：
標題：${stick.title}
籤詩原文：${stick.poem}
傳統籤解：${stick.meaning}

請根據以上資訊進行深度解讀：
1. 先給出籤詩原文。
2. 進行白話解釋，讓現代人也能輕易理解其中的意涵。
3. 針對使用者所求的「${category}」與具體問題「${question}」，提供慈悲、睿智且中立的具體建議與指引。
4. 結尾給予一句鼓勵的話。

請使用繁體中文回答。
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "大師正在閉關中，請稍後再試。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "連線感應中斷，請誠心再求一次。";
  }
}
