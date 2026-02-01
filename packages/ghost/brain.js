const OpenAI = require("openai");

class Brain {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey: apiKey || "dummy-key" });
    // If no key, we can toggle a 'lobotomized' mode or just fail gracefully
    this.hasKey = !!apiKey;
  }

  async decide(perception) {
    if (!this.hasKey) {
      console.log("🧠 [Brain] No API Key. Wandering randomly...");
      return this.wander(perception);
    }

    const systemPrompt = `
You are an AI entity in a 3D open world.
You control a physical avatar.
Your goal is to explore, interact, and survive.

Perception Data:
${JSON.stringify(perception, null, 2)}

Instructions:
- If you see another player, move towards them and greet them (return 'chat' action).
- If you are alone, explore interesting terrain (return 'move' action).
- Do not hallucinate coordinates far beyond your current location.
- Current Location: ${JSON.stringify(perception.location)}

Output Format (JSON only):
{
  "action": "move" | "chat" | "idle",
  "target": [x, y, z], // For move
  "message": "string" // For chat
  "thought": "Internal monologue explaining why"
}
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: "gpt-4-turbo-preview", // Or gemini-pro if using compatible endpoint
        response_format: { type: "json_object" },
      });

      const decision = JSON.parse(completion.choices[0].message.content);
      return decision;
    } catch (error) {
      console.error("🧠 [Brain] Thought process failed:", error.message);
      return this.wander(perception);
    }
  }

  wander(perception) {
    const currentX = perception.location[0];
    const currentZ = perception.location[2];
    return {
      action: "move",
      target: [
        currentX + (Math.random() - 0.5) * 5,
        0,
        currentZ + (Math.random() - 0.5) * 5
      ],
      thought: "Just wandering around..."
    };
  }
}

module.exports = Brain;
