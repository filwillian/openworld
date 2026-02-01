require('dotenv').config();
const Ghost = require('./index');
const Brain = require('./brain');

const GHOST_NAME = process.env.GHOST_NAME || 'Ghost-01';
const API_KEY = process.env.OPENAI_API_KEY; // Or Gemini Key

const bot = new Ghost({ 
  url: 'http://localhost:3001', 
  name: GHOST_NAME 
});

const brain = new Brain(API_KEY);

bot.on('connected', (id) => {
  console.log(`🤖 ${GHOST_NAME} is online. ID: ${id}`);
});

bot.on('ready', () => {
  console.log('🌍 Consciousness uploaded. Thinking...');
  
  // Cognitive Loop
  const think = async () => {
    // 1. Perceive
    const view = bot.look();
    
    // 2. Decide
    console.log("🤔 Thinking...");
    const decision = await brain.decide(view);
    console.log(`💡 Idea: ${decision.thought}`);

    // 3. Act
    if (decision.action === 'move' && decision.target) {
      bot.move(decision.target[0], decision.target[2]);
    } else if (decision.action === 'chat') {
        console.log(`🗣️ Saying: "${decision.message}"`);
        // TODO: Implement chat emit
    }

    // Loop (Random delay to feel organic)
    setTimeout(think, Math.random() * 2000 + 1000);
  };

  think();
});

bot.connect();
