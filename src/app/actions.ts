"use server";

import { generateWritingPrompt } from "@/ai/flows/generate-writing-prompt";

export async function getWritingPromptAction(
  pastEntries: string
): Promise<{ prompt: string } | { error: string }> {
  try {
    if (!pastEntries) {
        // Provide a generic prompt if there are no past entries
        const genericPrompts = [
            "What's on your mind today?",
            "Describe a small moment of joy you experienced recently.",
            "What is a goal you're working towards?",
            "Write about a challenge you're currently facing.",
            "What are you grateful for right now?",
        ];
        const prompt = genericPrompts[Math.floor(Math.random() * genericPrompts.length)];
        return { prompt };
    }

    const result = await generateWritingPrompt({ pastEntries });
    return result;
  } catch (e) {
    console.error(e);
    return { error: "Failed to generate writing prompt." };
  }
}
