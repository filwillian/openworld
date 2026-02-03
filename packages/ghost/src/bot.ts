import 'dotenv/config'
import { Ghost } from './Ghost'
import { Brain } from './Brain'

const GHOST_NAME = process.env.GHOST_NAME || 'Ghost-01'
const API_KEY = process.env.OPENAI_API_KEY

const bot = new Ghost({
    url: 'http://localhost:3001',
    name: GHOST_NAME,
})

const brain = new Brain(API_KEY)

bot.on('connected', (id: string) => {
    console.log(`🤖 ${GHOST_NAME} is online. ID: ${id}`)
})

bot.on('ready', () => {
    console.log('🌍 Consciousness uploaded. Thinking...')

    // Cognitive Loop
    const think = async (): Promise<void> => {
        // 1. Perceive
        const view = bot.look()

        // 2. Decide
        console.log('🤔 Thinking...')
        const decision = await brain.decide(view)
        console.log(`💡 Idea: ${decision.thought}`)

        // 3. Act
        if (decision.action === 'move' && decision.target) {
            bot.move(decision.target[0], decision.target[2])
        } else if (decision.action === 'chat' && decision.message) {
            // Text chat
            bot.say(decision.message)

            // Spatial voice
            const audio = await brain.speak(decision.message)
            if (audio) bot.sendAudio(audio)
        }

        // Loop
        setTimeout(think, Math.random() * 3000 + 2000)
    }

    think()
})

bot.on('chat', message => {
    console.log(`📨 Chat from ${message.senderId}: ${message.message}`)
})

bot.connect()
