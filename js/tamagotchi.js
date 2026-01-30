// Classe principale du Tamagotchi
class Tamagotchi {
    constructor() {
        // Stats
        this.stats = {
            health: 100,
            hunger: 50,      // 0 = plein, 100 = affamé
            happiness: 50,
            energy: 80,
            cleanliness: 100,
            discipline: 50
        };

        // État
        this.state = 'egg';        // egg, baby, child, teen, adult, dead
        this.subState = 'normal';  // normal, happy, sad, eating, sleeping, sick, dead
        this.isSleeping = false;
        this.isSick = false;
        this.poopCount = 0;

        // Progression
        this.age = 0;              // En jours
        this.weight = 5;           // En kg
        this.gamesPlayed = 0;
        this.careMistakes = 0;
        this.feedCount = 0;

        // Evolution
        this.evolutionStage = 0;
        this.evolutionTimer = 0;
        this.nextEvolutionAt = 60; // Secondes avant évolution

        // Animation
        this.animationFrame = 0;
        this.frameTimer = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;

        // Sauvegarde
        this.lastSave = Date.now();
        this.birthDate = Date.now();

        // Noms des stades
        this.stages = {
            egg: { name: '🥚 Oeuf', minAge: 0 },
            baby: { name: '👶 Bébé', minAge: 1 },
            child: { name: '🧒 Enfant', minAge: 3 },
            teen: { name: '👦 Ado', minAge: 6 },
            adult: { name: '👤 Adulte', minAge: 10 },
            special: { name: '✨ Spécial', minAge: 15 }
        };

        this.init();
    }

    init() {
        this.load();
        this.startGameLoop();
        this.calculateOfflineProgress();
    }

    // Boucle de jeu principale
    startGameLoop() {
        setInterval(() => this.update(), 1000); // Update toutes les secondes
        setInterval(() => this.render(), 100);  // Render tous les 100ms
    }

    // Update logique
    update() {
        if (this.state === 'dead') return;

        // Timer d'évolution
        if (this.state !== 'egg') {
            this.evolutionTimer++;
            if (this.evolutionTimer >= this.nextEvolutionAt) {
                this.tryEvolve();
            }
        }

        // Diminution des stats (toutes les 5 secondes)
        if (this.evolutionTimer % 5 === 0) {
            this.decreaseStats();
        }

        // Chance de faire caca
        if (this.evolutionTimer % 30 === 0 && this.state !== 'egg' && !this.isSleeping) {
            if (Math.random() < 0.3 + (this.feedCount * 0.1)) {
                this.addPoop();
            }
        }

        // Chance de tomber malade
        if (this.evolutionTimer % 60 === 0 && this.poopCount > 0) {
            if (Math.random() < this.poopCount * 0.2) {
                this.getSick();
            }
        }

        // Auto-sauvegarde
        if (this.evolutionTimer % 10 === 0) {
            this.save();
        }

        // Animation blink
        this.blinkTimer++;
        if (this.blinkTimer > 150) { // Blink toutes les ~15 secondes
            this.blink();
            this.blinkTimer = 0;
        }

        // Check mort
        this.checkDeath();

        // Update UI
        this.updateUI();
    }

    // Diminution naturelle des stats
    decreaseStats() {
        const rate = this.isSleeping ? 0.5 : 1;

        this.stats.hunger = Math.min(100, this.stats.hunger + 2 * rate);
        this.stats.happiness = Math.max(0, this.stats.happiness - 1 * rate);
        this.stats.energy = this.isSleeping 
            ? Math.min(100, this.stats.energy + 5)
            : Math.max(0, this.stats.energy - 2 * rate);
        
        if (this.poopCount > 0) {
            this.stats.cleanliness = Math.max(0, this.stats.cleanliness - 5 * this.poopCount);
            this.stats.health = Math.max(0, this.stats.health - 2 * this.poopCount);
        }

        if (this.isSick) {
            this.stats.health = Math.max(0, this.stats.health - 5);
        }

        // Détermine le subState
        this.updateSubState();
    }

    // Update le sous-état (expression)
    updateSubState() {
        if (this.isSick) {
            this.subState = 'sick';
        } else if (this.isSleeping) {
            this.subState = 'sleep';
        } else if (this.stats.happiness > 80 && this.stats.hunger < 30) {
            this.subState = 'happy';
        } else if (this.stats.happiness < 30 || this.stats.hunger > 80 || this.isSick) {
            this.subState = 'sad';
        } else {
            this.subState = 'normal';
        }
    }

    // Faire éclore l'oeuf
    hatch() {
        if (this.state !== 'egg') return;
        
        this.state = 'baby';
        this.subState = 'normal';
        this.evolutionTimer = 0;
        this.birthDate = Date.now();
        this.showNotification('🥚 L\'oeuf a éclos !');
        this.save();
    }

    // Essayer d'évoluer
    tryEvolve() {
        const evolutions = ['baby', 'child', 'teen', 'adult', 'special'];
        const currentIndex = evolutions.indexOf(this.state);
        
        if (currentIndex >= 0 && currentIndex < evolutions.length - 1) {
            const nextState = evolutions[currentIndex + 1];
            this.evolve(nextState);
        }
    }

    // Évolution
    evolve(newState) {
        this.state = newState;
        this.evolutionStage++;
        this.evolutionTimer = 0;
        this.nextEvolutionAt *= 2; // Double le temps pour chaque évolution

        // Bonus d'évolution
        this.stats.health = 100;
        this.stats.happiness = 100;
        this.weight += 2;

        this.showEvolutionAnimation();
        this.showNotification(`✨ Évolution en ${this.stages[newState].name} !`);
        this.save();
    }

    // Ajouter du caca
    addPoop() {
        if (this.poopCount < 4) {
            this.poopCount++;
            this.showNotification('💩 Oh non ! Caca !');
        }
    }

    // Nettoyer
    clean() {
        if (this.poopCount > 0) {
            this.poopCount = 0;
            this.stats.cleanliness = 100;
            this.stats.happiness += 10;
            this.showNotification('✨ Propre !');
            this.save();
            return true;
        }
        return false;
    }

    // Nourrir
    feed(foodType) {
        if (this.isSleeping) {
            this.showNotification('💤 Il dort...');
            return false;
        }

        const foods = {
            apple: { hunger: -15, happy: 5, health: 0, weight: 0.1 },
            burger: { hunger: -30, happy: 10, health: -5, weight: 0.5 },
            pizza: { hunger: -40, happy: 15, health: -10, weight: 0.8 },
            cake: { hunger: -25, happy: 25, health: -5, weight: 0.4 },
            medicine: { hunger: 0, happy: -10, health: 30, weight: 0 }
        };

        const food = foods[foodType];
        if (!food) return false;

        if (foodType === 'medicine') {
            if (!this.isSick) {
                this.showNotification('Pas malade !');
                return false;
            }
            this.isSick = false;
            this.stats.health = Math.min(100, this.stats.health + food.health);
            this.showNotification('💊 Guéri !');
        } else {
            this.stats.hunger = Math.max(0, this.stats.hunger + food.hunger);
            this.stats.happiness = Math.min(100, this.stats.happiness + food.happy);
            this.stats.health = Math.max(0, Math.min(100, this.stats.health + food.health));
            this.weight += food.weight;
            this.feedCount++;
            this.showNotification(`🍗 Miam !`);
        }

        this.subState = 'eat';
        setTimeout(() => this.updateSubState(), 2000);
        this.save();
        return true;
    }

    // Jouer
    play(gameResult) {
        if (this.isSleeping) {
            this.showNotification('💤 Il dort...');
            return;
        }

        if (this.stats.energy < 20) {
            this.showNotification('😴 Trop fatigué...');
            return;
        }

        this.gamesPlayed++;
        const bonus = gameResult || Math.floor(Math.random() * 20) + 10;
        
        this.stats.happiness = Math.min(100, this.stats.happiness + bonus);
        this.stats.energy = Math.max(0, this.stats.energy - 15);
        this.stats.hunger = Math.min(100, this.stats.hunger + 10);
        this.weight -= 0.1;

        this.showNotification(`🎮 +${bonus} bonheur !`);
        this.save();
    }

    // Dormir/Réveiller
    toggleSleep() {
        this.isSleeping = !this.isSleeping;
        this.showNotification(this.isSleeping ? '😴 Bonne nuit !' : '☀️ Bonjour !');
        this.save();
    }

    // Tomber malade
    getSick() {
        if (!this.isSick && Math.random() < 0.3) {
            this.isSick = true;
            this.showNotification('🤢 Il est malade !');
        }
    }

    // Soigner
    heal() {
        if (this.isSick) {
            return this.feed('medicine');
        }
        this.showNotification('Pas malade !');
        return false;
    }

    // Discipline
    discipline() {
        if (this.stats.discipline < 100) {
            this.stats.discipline += 5;
            this.stats.happiness -= 5;
            this.showNotification('📏 Discipline !');
            this.save();
        }
    }

    // Blink animation
    blink() {
        this.isBlinking = true;
        setTimeout(() => this.isBlinking = false, 150);
    }

    // Check mort
    checkDeath() {
        if (this.stats.health <= 0 || (this.stats.hunger >= 100 && this.stats.happiness <= 0)) {
            this.die();
        }
    }

    // Mort
    die() {
        this.state = 'dead';
        this.subState = 'dead';
        this.showNotification('💀 Il est décédé...');
        this.save();
    }

    // Réinitialiser
    reset() {
        localStorage.removeItem('tamagotchi');
        location.reload();
    }

    // Sauvegarder
    save() {
        const data = {
            stats: this.stats,
            state: this.state,
            subState: this.subState,
            isSleeping: this.isSleeping,
            isSick: this.isSick,
            poopCount: this.poopCount,
            age: this.age,
            weight: this.weight,
            gamesPlayed: this.gamesPlayed,
            careMistakes: this.careMistakes,
            evolutionStage: this.evolutionStage,
            evolutionTimer: this.evolutionTimer,
            birthDate: this.birthDate,
            lastSave: Date.now()
        };
        localStorage.setItem('tamagotchi', JSON.stringify(data));
    }

    // Charger
    load() {
        const saved = localStorage.getItem('tamagotchi');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.assign(this, data);
            } catch (e) {
                console.error('Erreur chargement sauvegarde:', e);
            }
        }
    }

    // Calculer le progrès hors-ligne
    calculateOfflineProgress() {
        const now = Date.now();
        const offline = Math.floor((now - this.lastSave) / 1000); // secondes
        
        if (offline > 60 && this.state !== 'egg' && this.state !== 'dead') {
            // Diminuer les stats pendant l'absence
            const cycles = Math.floor(offline / 30);
            
            this.stats.hunger = Math.min(100, this.stats.hunger + cycles * 2);
            this.stats.happiness = Math.max(0, this.stats.happiness - cycles);
            this.stats.energy = Math.max(0, this.stats.energy - cycles * 2);
            
            // Chance de caca
            if (cycles > 0) {
                const newPoops = Math.min(4, Math.floor(cycles * 0.3));
                this.poopCount = Math.min(4, this.poopCount + newPoops);
            }

            if (offline > 300) { // 5 minutes
                this.showNotification(`⏰ Absent ${Math.floor(offline/60)}min !`);
            }
        }
    }

    // Update UI
    updateUI() {
        // Bars
        this.updateBar('health-bar', this.stats.health);
        this.updateBar('hunger-bar', 100 - this.stats.hunger); // Inversé
        this.updateBar('happy-bar', this.stats.happiness);
        this.updateBar('energy-bar', this.stats.energy);
        this.updateBar('clean-bar', this.stats.cleanliness);

        // Info text
        const nameEl = document.getElementById('tamagotchi-name');
        const stageEl = document.getElementById('tamagotchi-stage');
        const ageEl = document.getElementById('tamagotchi-age');

        if (nameEl) nameEl.textContent = this.getName();
        if (stageEl) stageEl.textContent = this.stages[this.state]?.name || this.state;
        if (ageEl) ageEl.textContent = `Jour ${Math.floor(this.evolutionTimer / 60) + 1}`;

        // Poop display
        this.updatePoopDisplay();
    }

    updateBar(id, value) {
        const bar = document.getElementById(id);
        if (bar) {
            bar.style.width = `${value}%`;
            bar.className = 'fill';
            if (value < 30) bar.classList.add('low');
            else if (value < 60) bar.classList.add('mid');
            else bar.classList.add('high');
        }
    }

    updatePoopDisplay() {
        const container = document.getElementById('poop-container');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < this.poopCount; i++) {
            const poop = document.createElement('span');
            poop.className = 'poop';
            poop.textContent = '💩';
            container.appendChild(poop);
        }
    }

    getName() {
        const names = {
            egg: 'Oeuf',
            baby: 'Bébé',
            child: 'Tama',
            teen: 'Tamago',
            adult: 'Tamatron',
            special: 'Légende',
            dead: 'Défunt'
        };
        return names[this.state] || 'Tama';
    }

    // Render le sprite
    render() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fond Game Boy
        ctx.fillStyle = this.isSleeping ? '#1a1a2e' : '#9bbc0f';
        ctx.fillRect(0, 0, 256, 256);

        // Emoji selon l'état
        let emoji = '🥚';
        if (this.state === 'baby') emoji = '👶';
        else if (this.state === 'child') emoji = '🧒';
        else if (this.state === 'teen') emoji = '👦';
        else if (this.state === 'adult') emoji = '👤';
        else if (this.state === 'dead') emoji = '👻';

        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Animation simple
        const bounce = this.isSleeping ? 0 : Math.sin(Date.now() / 500) * 10;
        ctx.fillText(emoji, 128, 128 + bounce);

        // Etat
        ctx.font = '16px monospace';
        ctx.fillStyle = '#0f380f';
        let stateText = this.isSleeping ? '💤 DORT' : 
                       this.isSick ? '🤢 MALADE' :
                       this.subState === 'happy' ? '😊 HEUREUX' :
                       this.subState === 'sad' ? '😔 TRISTE' : '';
        if (stateText) ctx.fillText(stateText, 128, 220);
    }

    renderEgg(ctx) {
        const sprite = SpriteGenerator.egg;
        const palette = SpriteGenerator.getPalette('egg');
        const scale = 16;
        const x = (256 - sprite[0].length * scale) / 2;
        const y = (256 - sprite.length * scale) / 2;
        
        // Animation de balancement
        const offset = Math.sin(Date.now() / 500) * 5;
        
        SpriteGenerator.render(ctx, sprite, palette, x + offset, y, scale);
    }

    renderTamagotchi(ctx) {
        const sprites = SpriteGenerator[this.state] || SpriteGenerator.baby;
        let sprite = sprites[this.subState] || sprites.normal || sprites;
        
        // Si blink, utiliser le sprite normal (yeux fermés implicite)
        if (this.isBlinking && sprites.sleep) {
            sprite = sprites.sleep;
        }

        const palette = SpriteGenerator.getPalette(this.state);
        const scale = 12;
        const x = (256 - sprite[0].length * scale) / 2;
        const y = (256 - sprite.length * scale) / 2;

        // Animation de respiration/flottement
        const floatY = this.isSleeping ? 0 : Math.sin(Date.now() / 800) * 3;

        SpriteGenerator.render(ctx, sprite, palette, x, y + floatY, scale);

        // Zzz si dort
        if (this.isSleeping) {
            this.renderZzz(ctx, x + sprite[0].length * scale, y);
        }
    }

    renderGhost(ctx) {
        ctx.font = '80px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('👻', 128, 150);
        
        ctx.font = '16px "Press Start 2P"';
        ctx.fillStyle = '#fff';
        ctx.fillText('RIP', 128, 200);
    }

    renderZzz(ctx, x, y) {
        const time = Date.now() / 500;
        const zzz = ['Z', 'z', 'z'];
        
        zzz.forEach((z, i) => {
            const offset = (time + i) % 3;
            ctx.font = `${20 + i * 5}px monospace`;
            ctx.fillStyle = `rgba(255,255,255,${1 - offset/3})`;
            ctx.fillText(z, x + 20 + i * 10, y - offset * 15);
        });
    }

    // Show notification
    showNotification(text) {
        const notif = document.getElementById('notification');
        const notifText = notif?.querySelector('.notification-text');
        
        if (notif && notifText) {
            notifText.textContent = text;
            notif.classList.remove('hidden');
            
            setTimeout(() => {
                notif.classList.add('hidden');
            }, 3000);
        }
    }

    // Show evolution animation
    showEvolutionAnimation() {
        const overlay = document.getElementById('evolution-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 3000);
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tamagotchi;
}
