import OpenAI from 'openai'
import { Perception, Decision } from './types'

export class Brain {
    private openai: OpenAI
    private hasKey: boolean

    constructor(apiKey?: string) {
        this.openai = new OpenAI({ apiKey: apiKey || 'dummy-key' })
        this.hasKey = !!apiKey
    }

    async decide(perception: Perception): Promise<Decision> {
        if (!this.hasKey) {
            console.log('🧠 [Brain] No API Key. Wandering randomly...')
            return this.wander(perception)
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
    `

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: 'system', content: systemPrompt }],
                model: 'gpt-4-turbo-preview',
                response_format: { type: 'json_object' },
            })

            const content = completion.choices[0].message.content
            if (!content) {
                return this.wander(perception)
            }

            const decision: Decision = JSON.parse(content)
            return decision
        } catch (error) {
            const err = error as Error
            console.error('🧠 [Brain] Thought process failed:', err.message)
            return this.wander(perception)
        }
    }

    private wander(perception: Perception): Decision {
        const currentX = perception.location[0]
        const currentZ = perception.location[2]
        return {
            action: 'move',
            target: [
                currentX + (Math.random() - 0.5) * 5,
                0,
                currentZ + (Math.random() - 0.5) * 5,
            ],
            thought: 'Just wandering around...',
        }
    }
}

export default Brain
