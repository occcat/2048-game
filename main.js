class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('best2048')) || 0;
        this.size = 4;
        this.overlay = document.getElementById('overlay');
        this.message = document.getElementById('message');
        this.scoreEl = document.getElementById('score');
        this.bestScoreEl = document.getElementById('best-score');
        this.isProcessing = false;
        
        this.init();
        this.bindEvents();
    }

    init() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.updateScore();
        this.bestScoreEl.textContent = this.bestScore;
        this.hideOverlay();
        this.isProcessing = false;
        this.hasWon = false;
        this.newTileInfo = null;
        
        const gridEl = document.getElementById('grid');
        gridEl.innerHTML = '';
        
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${i}`;
            gridEl.appendChild(cell);
        }
        
        this.addRandomTile();
        this.addRandomTile();
        this.render();
        this.hasWon = false;
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
            // 返回新方块信息用于渲染动画
            return { r, c, value: this.grid[r][c], isNew: true };
        }
        return null;
    }

    render() {
        // 清除所有单元格
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.getElementById(`cell-${i}`);
            if (cell) {
                cell.innerHTML = '';
            }
        }
        
        // 渲染所有方块
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const value = this.grid[r][c];
                if (value > 0) {
                    const cellIndex = r * this.size + c;
                    const cell = document.getElementById(`cell-${cellIndex}`);
                    if (cell) {
                        const tile = document.createElement('div');
                        const isNewTile = this.newTileInfo && 
                            this.newTileInfo.r === r && 
                            this.newTileInfo.c === c;
                        tile.className = `tile tile-${value > 2048 ? 'super' : value}${isNewTile ? ' new' : ''}`;
                        tile.textContent = value;
                        cell.appendChild(tile);
                    }
                }
            }
        }
        // 清除新方块标记，只在下一帧保留动画
        this.newTileInfo = null;
    }

    checkWin() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 2048) {
                    return true;
                }
            }
        }
        return false;
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

    // 修复的滑动逻辑 - 不再使用旋转+反转，而是直接处理每一行/列
    slide(direction) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        let moved = false;
        const previousGrid = this.grid.map(row => [...row]);
        
        // 根据方向处理
        if (direction === 'left') {
            for (let r = 0; r < this.size; r++) {
                const line = this.grid[r].slice();
                const newLine = this.processLine(line);
                for (let c = 0; c < this.size; c++) {
                    this.grid[r][c] = newLine[c];
                }
            }
        } else if (direction === 'right') {
            for (let r = 0; r < this.size; r++) {
                const line = this.grid[r].slice().reverse();
                const newLine = this.processLine(line);
                newLine.reverse();
                for (let c = 0; c < this.size; c++) {
                    this.grid[r][c] = newLine[c];
                }
            }
        } else if (direction === 'up') {
            for (let c = 0; c < this.size; c++) {
                const line = [];
                for (let r = 0; r < this.size; r++) {
                    line.push(this.grid[r][c]);
                }
                const newLine = this.processLine(line);
                for (let r = 0; r < this.size; r++) {
                    this.grid[r][c] = newLine[r];
                }
            }
        } else if (direction === 'down') {
            for (let c = 0; c < this.size; c++) {
                const line = [];
                for (let r = 0; r < this.size; r++) {
                    line.push(this.grid[r][c]);
                }
                line.reverse();
                const newLine = this.processLine(line);
                newLine.reverse();
                for (let r = 0; r < this.size; r++) {
                    this.grid[r][c] = newLine[r];
                }
            }
        }
        
        // 检查是否有移动
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== previousGrid[r][c]) {
                    moved = true;
                    break;
                }
            }
        }
        
        if (moved) {
            this.updateScore();
            const newTile = this.addRandomTile();
            if (newTile) {
                this.newTileInfo = newTile;
            }
            this.render();
            
            if (this.checkWin() && !this.hasWon) {
                this.hasWon = true;
                setTimeout(() => {
                    this.showOverlay('你赢了! 🎉');
                }, 300);
            } else if (this.isGameOver()) {
                this.showOverlay('游戏结束!');
            }
        }
        
        setTimeout(() => {
            this.isProcessing = false;
        }, 150);
    }
    
    // 处理单行/列的滑动和合并
    processLine(line) {
        // Step 1: 移除零
        let result = line.filter(x => x !== 0);
        
        // Step 2: 合并相邻相同数字（每个数字只能合并一次）
        for (let i = 0; i < result.length - 1; i++) {
            if (result[i] === result[i + 1] && result[i] !== 0) {
                result[i] *= 2;
                this.score += result[i];
                result[i + 1] = 0;
                i++; // 跳过下一个，因为它已经被合并了
            }
        }
        
        // Step 3: 再次移除零
        result = result.filter(x => x !== 0);
        
        // Step 4: 补零
        while (result.length < line.length) {
            result.push(0);
        }
        
        return result;
    }

    isGameOver() {
        // 检查是否有空格
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }
        
        // 检查是否可以合并
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
        // 键盘事件
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

        // 触摸事件
        let startX, startY;
        const gameContainer = document.querySelector('.game-container');
        
        gameContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: false });

        gameContainer.addEventListener('touchmove', (e) => {
            // Bug Fix: 阻止触摸移动时的页面滚动
            e.preventDefault();
        }, { passive: false });

        gameContainer.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Bug Fix: 检查触摸起始位置是否已记录
            if (startX === undefined || startY === undefined) {
                return;
            }
            
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
            
            // Bug Fix: 重置触摸位置
            startX = undefined;
            startY = undefined;
        }, { passive: false });

        // 按钮事件
        document.getElementById('new-game').addEventListener('click', () => this.init());
        document.getElementById('try-again').addEventListener('click', () => this.init());
    }
}

// 启动游戏
new Game2048();
