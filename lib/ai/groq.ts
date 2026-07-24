import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function askGroq(prompt: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model:
        process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content:
            "You are LOOP AI, an expert customer feedback analyst. Analyze customer feedback, identify sentiment, summarize insights, detect themes, and provide business recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.3,
      max_tokens: 1024,
    });

    return (
      completion.choices[0]?.message?.content ??
      "No response generated."
    );
  } catch (err) {
    console.error("Groq Error:", err);
    throw new Error("Groq API Failed");
  }
}