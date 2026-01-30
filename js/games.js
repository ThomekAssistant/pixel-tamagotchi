// Mini-jeux pour le Tamagotchi
class MiniGames {
    constructor(tamagotchi) {
        this.tama = tamagotchi;
        this.currentGame = null;
        this.canvas = null;
        this.ctx = null;
        this.score = 0;
        this.gameLoop = null;
    }

    // Démarrer un mini-jeu
    start(gameType) {
        this.currentGame = gameType;
        this.score = 0;
        
        // Créer le canvas du mini-jeu
        const modal = document.getElementById('games-menu');
        modal.classList.add('hidden');
        
        const gameContainer = document.createElement('div');
        gameContainer.id = 'active-game';
        gameContainer.className = 'modal';
        gameContainer.innerHTML = `
            <div class="modal-content pixel-border">
                <h2 id="game-title">🎮 JEU</h2>
                <canvas id="mini-game-canvas" width="300" height="300"></canvas>
                <div id="game-score">Score: 0</div>
                <div id="game-instructions"></div>
                <button id="close-game" class="pixel-btn small">QUITTER</button>
            </div>
        `;
        document.body.appendChild(gameContainer);
        
        this.canvas = document.getElementById('mini-game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        document.getElementById('close-game').onclick = () => this.end();
        
        // Lancer le jeu
        switch(gameType) {
            case 'memory':
                this.startMemory();
                break;
            case 'reaction':
                this.startReaction();
                break;
            case 'dance':
                this.startDance();
                break;
            case 'catch':
                this.startCatch();
                break;
        }
    }

    // Jeu de mémoire
    startMemory() {
        document.getElementById('game-title').textContent = '🧠 MÉMOIRE';
        document.getElementById('game-instructions').textContent = 'Mémorise la séquence !';
        
        const sequence = [];
        let playerSequence = [];
        let level = 1;
        const colors = ['#ff6b9d', '#4a9eff', '#ffd700', '#4aff4a'];
        const positions = [
            {x: 50, y: 50}, {x: 200, y: 50},
            {x: 50, y: 200}, {x: 200, y: 200}
        ];
        
        const drawBoard = () => {
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, 300, 300);
            
            positions.forEach((pos, i) => {
                this.ctx.fillStyle = colors[i];
                this.ctx.fillRect(pos.x, pos.y, 80, 80);
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(pos.x, pos.y, 80, 80);
            });
        };
        
        const flash = (index) => {
            const pos = positions[index];
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(pos.x, pos.y, 80, 80);
            setTimeout(drawBoard, 300);
        };
        
        const playSequence = async () => {
            for (let i = 0; i < sequence.length; i++) {
                await new Promise(r => setTimeout(r, 600));
                flash(sequence[i]);
            }
        };
        
        const nextLevel = () => {
            playerSequence = [];
            sequence.push(Math.floor(Math.random() * 4));
            document.getElementById('game-score').textContent = `Niveau: ${level}`;
            setTimeout(playSequence, 1000);
        };
        
        this.canvas.onclick = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            for (let i = 0; i < positions.length; i++) {
                const pos = positions[i];
                if (x >= pos.x && x <= pos.x + 80 && y >= pos.y && y <= pos.y + 80) {
                    flash(i);
                    playerSequence.push(i);
                    
                    // Vérifier
                    const current = playerSequence.length - 1;
                    if (playerSequence[current] !== sequence[current]) {
                        document.getElementById('game-instructions').textContent = '❌ Perdu !';
                        this.tama.play(level * 5);
                        setTimeout(() => this.end(), 1500);
                        return;
                    }
                    
                    if (playerSequence.length === sequence.length) {
                        level++;
                        if (level > 5) {
                            document.getElementById('game-instructions').textContent = '🎉 Gagné !';
                            this.tama.play(30);
                            setTimeout(() => this.end(), 1500);
                        } else {
                            nextLevel();
                        }
                    }
                }
            }
        };
        
        drawBoard();
        nextLevel();
    }

    // Test de réflexes
    startReaction() {
        document.getElementById('game-title').textContent = '⚡ RÉFLEXES';
        document.getElementById('game-instructions').textContent = 'Clique quand ça devient VERT !';
        
        let state = 'waiting'; // waiting, ready, clicked
        let startTime = 0;
        let timeout = null;
        
        const draw = () => {
            this.ctx.fillStyle = state === 'ready' ? '#4aff4a' : 
                                state === 'clicked' ? '#4a9eff' : '#ff4a4a';
            this.ctx.fillRect(0, 0, 300, 300);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                state === 'ready' ? 'CLIQUE !' : 
                state === 'clicked' ? `${this.score}ms` : 'ATTENDS...',
                150, 150
            );
        };
        
        const startRound = () => {
            state = 'waiting';
            draw();
            
            const delay = Math.random() * 3000 + 2000;
            timeout = setTimeout(() => {
                state = 'ready';
                startTime = Date.now();
                draw();
            }, delay);
        };
        
        this.canvas.onclick = () => {
            if (state === 'waiting') {
                clearTimeout(timeout);
                document.getElementById('game-instructions').textContent = '❌ Trop tôt !';
                this.tama.play(5);
                setTimeout(() => this.end(), 1500);
            } else if (state === 'ready') {
                state = 'clicked';
                this.score = Date.now() - startTime;
                draw();
                
                const bonus = this.score < 200 ? 25 : this.score < 300 ? 20 : 15;
                document.getElementById('game-instructions').textContent = `🎉 ${this.score}ms ! +${bonus} bonheur`;
                this.tama.play(bonus);
                setTimeout(() => this.end(), 2000);
            }
        };
        
        draw();
        startRound();
    }

    // Jeu de danse
    startDance() {
        document.getElementById('game-title').textContent = '💃 DANCE';
        document.getElementById('game-instructions').textContent = 'Appuie sur les flèches !';
        
        const arrows = ['↑', '↓', '←', '→'];
        const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        let sequence = [];
        let playerIndex = 0;
        let lives = 3;
        
        const draw = () => {
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, 300, 300);
            
            // Afficher la séquence
            sequence.forEach((arrow, i) => {
                const x = 50 + i * 60;
                const y = 150;
                
                this.ctx.fillStyle = i < playerIndex ? '#4aff4a' : '#fff';
                this.ctx.font = '40px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(arrows[arrow], x, y);
                
                // Cadre
                this.ctx.strokeStyle = i === playerIndex ? '#ffd700' : '#666';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x - 25, y - 40, 50, 50);
            });
            
            // Vies
            this.ctx.fillStyle = '#ff4a4a';
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.fillText('❤️'.repeat(lives), 150, 50);
        };
        
        const generateSequence = () => {
            sequence = [];
            for (let i = 0; i < 5 + Math.floor(this.score / 50); i++) {
                sequence.push(Math.floor(Math.random() * 4));
            }
            playerIndex = 0;
            draw();
        };
        
        const handleKey = (e) => {
            e.preventDefault();
            const keyIndex = keys.indexOf(e.key);
            
            if (keyIndex === -1) return;
            
            if (keyIndex === sequence[playerIndex]) {
                playerIndex++;
                this.score += 10;
                document.getElementById('game-score').textContent = `Score: ${this.score}`;
                
                if (playerIndex >= sequence.length) {
                    this.score += 50;
                    generateSequence();
                }
                draw();
            } else {
                lives--;
                if (lives <= 0) {
                    document.getElementById('game-instructions').textContent = '💃 Terminé !';
                    this.tama.play(Math.floor(this.score / 5));
                    setTimeout(() => this.end(), 1500);
                } else {
                    draw();
                }
            }
        };
        
        document.addEventListener('keydown', handleKey);
        this.cleanup = () => document.removeEventListener('keydown', handleKey);
        
        generateSequence();
    }

    // Jeu d'attrape
    startCatch() {
        document.getElementById('game-title').textContent = '🎯 ATTRAPE';
        document.getElementById('game-instructions').textContent = 'Clique sur les pommes !';
        
        const items = [];
        const player = { x: 150, y: 250, width: 40, height: 40 };
        let timeLeft = 30;
        
        const draw = () => {
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, 300, 300);
            
            // Joueur (Tamagotchi)
            this.ctx.font = '40px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🥚', player.x, player.y);
            
            // Items
            items.forEach((item, i) => {
                item.y += item.speed;
                
                this.ctx.font = '30px monospace';
                this.ctx.fillText(item.emoji, item.x, item.y);
                
                // Collision
                if (Math.abs(item.x - player.x) < 30 && Math.abs(item.y - player.y) < 30) {
                    if (item.good) {
                        this.score += 10;
                    } else {
                        this.score -= 5;
                    }
                    document.getElementById('game-score').textContent = `Score: ${this.score}`;
                    items.splice(i, 1);
                }
                
                // Supprimer si hors écran
                if (item.y > 300) {
                    items.splice(i, 1);
                }
            });
            
            // Timer
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.fillText(`⏱️ ${timeLeft}`, 150, 30);
        };
        
        // Spawn items
        const spawnInterval = setInterval(() => {
            const good = Math.random() > 0.3;
            items.push({
                x: Math.random() * 250 + 25,
                y: -30,
                emoji: good ? '🍎' : '💩',
                speed: Math.random() * 2 + 2,
                good: good
            });
        }, 800);
        
        // Timer
        const timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(spawnInterval);
                clearInterval(timerInterval);
                clearInterval(this.gameLoop);
                
                const bonus = Math.max(0, this.score);
                document.getElementById('game-instructions').textContent = `🎉 Score: ${bonus} !`;
                this.tama.play(bonus);
                setTimeout(() => this.end(), 2000);
            }
        }, 1000);
        
        // Mouvement
        this.canvas.onmousemove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            player.x = e.clientX - rect.left;
        };
        
        this.canvas.ontouchmove = (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            player.x = e.touches[0].clientX - rect.left;
        };
        
        this.gameLoop = setInterval(draw, 1000 / 60);
    }

    // Terminer le jeu
    end() {
        if (this.cleanup) this.cleanup();
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        const gameContainer = document.getElementById('active-game');
        if (gameContainer) {
            gameContainer.remove();
        }
        
        this.currentGame = null;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniGames;
}
