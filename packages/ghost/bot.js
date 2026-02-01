const Ghost = require('./index');

// Create a new Ghost
const bot = new Ghost({ 
  url: 'http://localhost:3001', 
  name: 'Wanderer-01' 
});

bot.on('connected', (id) => {
  console.log(`🤖 I am online. ID: ${id}`);
});

bot.on('ready', () => {
  console.log('🌍 World data received. Starting autonomous routine...');
  
  // Basic Logic Loop
  setInterval(() => {
    // 1. Perception
    const view = bot.look();
    
    if (view.entities.length > 0) {
      console.log(`👁️ I see ${view.entities.length} entities nearby.`);
    }

    // 2. Action (Random Walk)
    const currentX = bot.state.me?.position[0] || 0;
    const currentZ = bot.state.me?.position[2] || 0;

    // Pick a random direction
    const moveX = currentX + (Math.random() - 0.5) * 2;
    const moveZ = currentZ + (Math.random() - 0.5) * 2;

    bot.move(moveX, moveZ);
    
  }, 1000); // Act every second
});

bot.connect();
