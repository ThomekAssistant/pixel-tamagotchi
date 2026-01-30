// Application principale
let tama;
let games;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('Pixel Tamagotchi loading...');
    
    // Créer les instances
    try {
        tama = new Tamagotchi();
        games = new MiniGames(tama);
        
        console.log('Tamagotchi state:', tama.state);
        
        // Si c'est un oeuf, écran de démarrage
        if (tama.state === 'egg') {
            showScreen('start-screen');
            renderEgg();
        } else {
            showScreen('game-screen');
        }
        
        // Event listeners
        setupEventListeners();
        
        // Démarrer le render loop
        requestAnimationFrame(renderLoop);
        
        console.log('Pixel Tamagotchi loaded successfully!');
    } catch (e) {
        console.error('Error loading Tamagotchi:', e);
    }
});

// Render loop
function renderLoop() {
    if (tama) {
        tama.render();
    }
    requestAnimationFrame(renderLoop);
}

// Setup event listeners
function setupEventListeners() {
    // Écran de démarrage
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            tama.hatch();
            showScreen('game-screen');
        });
    }
    
    // Boutons d'action
    document.getElementById('feed-btn')?.addEventListener('click', () => {
        showModal('food-menu');
    });
    
    document.getElementById('play-btn')?.addEventListener('click', () => {
        showModal('games-menu');
    });
    
    document.getElementById('sleep-btn')?.addEventListener('click', () => {
        tama.toggleSleep();
    });
    
    document.getElementById('clean-btn')?.addEventListener('click', () => {
        if (tama.clean()) {
            updateUI();
        }
    });
    
    document.getElementById('heal-btn')?.addEventListener('click', () => {
        tama.heal();
    });
    
    document.getElementById('stats-btn')?.addEventListener('click', () => {
        showStats();
        showModal('stats-modal');
    });
    
    // Fermer les modals
    document.getElementById('close-games')?.addEventListener('click', () => {
        hideModal('games-menu');
    });
    
    document.getElementById('close-stats')?.addEventListener('click', () => {
        hideModal('stats-modal');
    });
    
    document.getElementById('close-food')?.addEventListener('click', () => {
        hideModal('food-menu');
    });
    
    // Mini-jeux
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const gameType = e.currentTarget.dataset.game;
            games.start(gameType);
        });
    });
    
    // Nourriture
    document.querySelectorAll('.food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const food = e.currentTarget.dataset.food;
            tama.feed(food);
            hideModal('food-menu');
        });
    });
}

// Afficher un écran
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId)?.classList.add('active');
}

// Afficher un modal
function showModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
}

// Cacher un modal
function hideModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
}

// Afficher les stats
function showStats() {
    document.getElementById('stats-name').textContent = tama.getName();
    document.getElementById('stats-stage').textContent = tama.stages[tama.state]?.name || tama.state;
    document.getElementById('stats-age').textContent = `${Math.floor((Date.now() - tama.birthDate) / 1000 / 60)} minutes`;
    document.getElementById('stats-weight').textContent = `${tama.weight.toFixed(1)} kg`;
    document.getElementById('stats-games').textContent = tama.gamesPlayed;
    document.getElementById('stats-level').textContent = tama.evolutionStage + 1;
    
    const discBar = document.getElementById('discipline-bar');
    if (discBar) {
        discBar.style.width = `${tama.stats.discipline}%`;
    }
}

// Update UI
function updateUI() {
    if (tama) {
        tama.updateUI();
    }
}

// Render l'oeuf sur l'écran de démarrage
function renderEgg() {
    const canvas = document.getElementById('egg-canvas');
    if (!canvas || !window.SpriteGenerator) return;
    
    const ctx = canvas.getContext('2d');
    const sprite = SpriteGenerator.egg;
    const palette = SpriteGenerator.getPalette('egg');
    const scale = 4;
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const offset = Math.sin(Date.now() / 500) * 3;
        const x = (64 - sprite[0].length * scale) / 2 + offset;
        const y = (64 - sprite.length * scale) / 2;
        
        SpriteGenerator.render(ctx, sprite, palette, x, y, scale);
        
        if (document.getElementById('start-screen')?.classList.contains('active')) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Penser à un emoji
function showThought(emoji) {
    const bubble = document.getElementById('thought-bubble');
    const emojiEl = bubble?.querySelector('.thought-emoji');
    
    if (bubble && emojiEl) {
        emojiEl.textContent = emoji;
        bubble.classList.remove('hidden');
        
        setTimeout(() => {
            bubble.classList.add('hidden');
        }, 3000);
    }
}

// Export pour debugging
window.tama = tama;
window.games = games;
window.showThought = showThought;
