const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: "YOUR_GROQ_API_KEY", // Replace with your Groq API key
});

async function test() {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        {
          role: "user",
          content: "Say Hello",
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    console.log(completion.choices[0].message.content);
  } catch (e) {
    console.error("Groq Error:", e);
  }
}

test();