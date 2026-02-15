class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('best2048') || 0;
        this.size = 4;
        this.overlay = document.getElementById('overlay');
        this.message = document.getElementById('message');
        this.scoreEl = document.getElementById('score');
        this.bestScoreEl = document.getElementById('best-score');
        
        this.init();
        this.bindEvents();
    }

    init() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.updateScore();
        this.bestScoreEl.textContent = this.bestScore;
        this.hideOverlay();
        
        // Clear and recreate grid cells
        const gridEl = document.getElementById('grid');
        gridEl.innerHTML = '';
        
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            gridEl.appendChild(cell);
        }
        
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    render() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, i) => {
            const r = Math.floor(i / this.size);
            const c = i % this.size;
            const value = this.grid[r][c];
            
            cell.innerHTML = '';
            cell.className = 'cell';
            
            if (value > 0) {
                const tile = document.createElement('div');
                tile.className = `tile tile-${value > 2048 ? 'super' : value}`;
                tile.textContent = value;
                cell.appendChild(tile);
            }
        });
    }

    updateScore() {
        this.scoreEl.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreEl.textContent = this.bestScore;
            localStorage.setItem('best2048', this.bestScore);
        }
    }

    hideOverlay() {
        this.overlay.classList.remove('show');
    }

    showOverlay(message) {
        this.message.textContent = message;
        this.overlay.classList.add('show');
    }

    slide(direction) {
        let moved = false;
        
        const rotateGrid = (grid) => {
            return grid[0].map((_, i) => grid.map(row => row[i]).reverse());
        };
        
        const slideRow = (row) => {
            // Step 1: Remove zeros
            let newRow = row.filter(x => x !== 0);
            
            // Step 2: Merge adjacent equal numbers
            for (let i = 0; i < newRow.length - 1; i++) {
                if (newRow[i] === newRow[i + 1] && newRow[i] !== 0) {
                    newRow[i] *= 2;
                    this.score += newRow[i];
                    newRow[i + 1] = 0;
                    // Skip the next one since we just merged it
                    i++;
                }
            }
            
            // Step 3: Remove zeros again after merge
            newRow = newRow.filter(x => x !== 0);
            
            // Step 4: Pad with zeros
            while (newRow.length < this.size) {
                newRow.push(0);
            }
            
            return newRow;
        };
        
        let transformedGrid = this.grid;
        
        // Rotate grid to simplify direction handling
        if (direction === 'right') {
            transformedGrid = transformedGrid.map(row => row.reverse());
        } else if (direction === 'down') {
            transformedGrid = rotateGrid(transformedGrid);
            transformedGrid = transformedGrid.map(row => row.reverse());
        } else if (direction === 'up') {
            transformedGrid = rotateGrid(transformedGrid);
        }
        
        // Slide each row
        transformedGrid = transformedGrid.map(row => slideRow(row));
        
        // Rotate back
        if (direction === 'right') {
            transformedGrid = transformedGrid.map(row => row.reverse());
        } else if (direction === 'down') {
            transformedGrid = transformedGrid.map(row => row.reverse());
            transformedGrid = rotateGrid(transformedGrid);
        } else if (direction === 'up') {
            transformedGrid = rotateGrid(transformedGrid);
        }
        
        // Check if anything moved
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== transformedGrid[r][c]) {
                    moved = true;
                    break;
                }
            }
        }
        
        if (moved) {
            this.grid = transformedGrid;
            this.updateScore();
            this.addRandomTile();
            this.render();
            
            if (this.isGameOver()) {
                this.showOverlay('游戏结束!');
            }
        }
    }

    isGameOver() {
        // Check for empty cells
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }
        
        // Check for possible merges
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const current = this.grid[r][c];
                if (c < this.size - 1 && current === this.grid[r][c + 1]) return false;
                if (r < this.size - 1 && current === this.grid[r + 1][c]) return false;
            }
        }
        
        return true;
    }

    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.slide('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.slide('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.slide('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.slide('right');
                    break;
            }
        });

        // Touch events
        let startX, startY;
        const gameContainer = document.querySelector('.game-container');
        
        gameContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        gameContainer.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = endX - startX;
            const diffY = endY - startY;
            
            const minSwipe = 50;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > minSwipe) {
                    if (diffX > 0) {
                        this.slide('right');
                    } else {
                        this.slide('left');
                    }
                }
            } else {
                if (Math.abs(diffY) > minSwipe) {
                    if (diffY > 0) {
                        this.slide('down');
                    } else {
                        this.slide('up');
                    }
                }
            }
        });

        // Button events
        document.getElementById('new-game').addEventListener('click', () => this.init());
        document.getElementById('try-again').addEventListener('click', () => this.init());
    }
}

// Start game
new Game2048();
