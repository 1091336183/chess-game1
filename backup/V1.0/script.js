const LEVELS = [
    { name: "十六级棋士", minScore: 0, maxScore: 39 },
    { name: "十五级棋士", minScore: 40, maxScore: 69 },
    { name: "十四级棋士", minScore: 70, maxScore: 109 },
    { name: "十三级棋士", minScore: 110, maxScore: 159 },
    { name: "十二级棋士", minScore: 160, maxScore: 219 },
    { name: "十一级棋士", minScore: 220, maxScore: 299 },
    { name: "十级棋士", minScore: 300, maxScore: 399 },
    { name: "九级棋士", minScore: 400, maxScore: 549 },
    { name: "八级棋士", minScore: 550, maxScore: 749 },
    { name: "七级棋士", minScore: 750, maxScore: 999 },
    { name: "六级棋士", minScore: 1000, maxScore: 1299 },
    { name: "五级棋士", minScore: 1300, maxScore: 1699 },
    { name: "四级棋士", minScore: 1700, maxScore: 2199 },
    { name: "三级棋士", minScore: 2200, maxScore: 2799 },
    { name: "二级棋士", minScore: 2800, maxScore: 3499 },
    { name: "一级棋士", minScore: 3500, maxScore: 4499 },
    { name: "地方大师", minScore: 4500, maxScore: 5999 },
    { name: "棋协大师", minScore: 6000, maxScore: 7999 },
    { name: "国家大师", minScore: 8000, maxScore: 9999 },
    { name: "特级大师", minScore: 10000, maxScore: Infinity }
];

const PIECE_VALUES = {
    '将': 1000, '帅': 1000,
    '士': 150, '仕': 150,
    '象': 150, '相': 150,
    '马': 450, '車': 900, '车': 900,
    '炮': 450,
    '兵': 100, '卒': 100
};

class ChessGame {
    constructor() {
        this.board = Array(10).fill().map(() => Array(9).fill(null));
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameHistory = [];
        this.difficulty = 0;
        this.userScore = 0;
        this.gameOver = false;
        this.gameStarted = false;
        
        this.initBoard();
        this.loadUserScore();
        this.updateUI();
        this.bindEvents();
        this.setTheme('classic');
        this.updateGameStatus('请点击开始游戏');
    }
    
    initBoard() {
        this.board = Array(10).fill().map(() => Array(9).fill(null));
        
        const redBackRow = ['车', '马', '相', '仕', '帅', '仕', '相', '马', '车'];
        for (let col = 0; col < 9; col++) {
            this.board[9][col] = { type: redBackRow[col], color: 'red', moved: false };
        }
        this.board[7][1] = { type: '炮', color: 'red', moved: false };
        this.board[7][7] = { type: '炮', color: 'red', moved: false };
        for (let col = 0; col < 9; col += 2) {
            this.board[6][col] = { type: '兵', color: 'red', moved: false };
        }
        
        const blackBackRow = ['車', '馬', '象', '士', '将', '士', '象', '馬', '車'];
        for (let col = 0; col < 9; col++) {
            this.board[0][col] = { type: blackBackRow[col], color: 'black', moved: false };
        }
        this.board[2][1] = { type: '炮', color: 'black', moved: false };
        this.board[2][7] = { type: '炮', color: 'black', moved: false };
        for (let col = 0; col < 9; col += 2) {
            this.board[3][col] = { type: '卒', color: 'black', moved: false };
        }
        
        this.gameHistory = [];
        this.gameOver = false;
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
    }
    
    bindEvents() {
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
        });
        
        document.getElementById('theme-classic').addEventListener('click', () => this.setTheme('classic'));
        document.getElementById('theme-redwood').addEventListener('click', () => this.setTheme('redwood'));
        document.getElementById('theme-modern').addEventListener('click', () => this.setTheme('modern'));
    }
    
    setTheme(theme) {
        const chessboard = document.getElementById('chessboard');
        chessboard.classList.remove('theme-classic', 'theme-redwood', 'theme-modern');
        chessboard.classList.add(`theme-${theme}`);
        
        document.querySelectorAll('.theme-buttons button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`theme-${theme}`).classList.add('active');
        
        this.renderBoard();
    }
    
    startGame() {
        this.gameStarted = true;
        this.updateGameStatus('轮到您走棋');
        this.selectedPiece = null;
        this.validMoves = [];
        this.renderBoard();
    }
    
    newGame() {
        this.initBoard();
        this.gameStarted = false;
        this.renderBoard();
        this.updateGameStatus('请点击开始游戏');
        this.updateLastMove('无');
    }
    
    undo() {
        if (!this.gameStarted || this.gameHistory.length < 2) return;
        
        this.gameHistory.pop();
        const lastState = this.gameHistory.pop();
        this.board = lastState.board.map(row => row.map(piece => piece ? { ...piece } : null));
        this.currentPlayer = lastState.currentPlayer;
        
        this.renderBoard();
        this.updateGameStatus(this.currentPlayer === 'red' ? '轮到您走棋' : '电脑思考中...');
    }
    
    renderBoard() {
        const chessboard = document.getElementById('chessboard');
        if (!chessboard) return;
        
        chessboard.innerHTML = '';
        this.renderBoardLines(chessboard);
        this.renderRiver(chessboard);
        this.renderPieces(chessboard);
        this.renderValidMoves(chessboard);
    }
    
    renderBoardLines(chessboard) {
        const boardLines = document.createElement('div');
        boardLines.className = 'board-lines';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 560 630');
        
        let paths = '';
        
        for (let i = 0; i <= 9; i++) {
            const y = i * 70;
            paths += `<line x1="0" y1="${y}" x2="560" y2="${y}" stroke="#8b7355" stroke-width="1.5"/>`;
        }
        
        for (let i = 0; i <= 8; i++) {
            const x = i * 70;
            paths += `<line x1="${x}" y1="0" x2="${x}" y2="280" stroke="#8b7355" stroke-width="1.5"/>`;
            paths += `<line x1="${x}" y1="350" x2="${x}" y2="630" stroke="#8b7355" stroke-width="1.5"/>`;
        }
        
        paths += `<line x1="0" y1="0" x2="560" y2="0" stroke="#8b7355" stroke-width="2"/>`;
        paths += `<line x1="0" y1="630" x2="560" y2="630" stroke="#8b7355" stroke-width="2"/>`;
        paths += `<line x1="0" y1="0" x2="0" y2="280" stroke="#8b7355" stroke-width="2"/>`;
        paths += `<line x1="0" y1="350" x2="0" y2="630" stroke="#8b7355" stroke-width="2"/>`;
        paths += `<line x1="560" y1="0" x2="560" y2="280" stroke="#8b7355" stroke-width="2"/>`;
        paths += `<line x1="560" y1="350" x2="560" y2="630" stroke="#8b7355" stroke-width="2"/>`;
        
        paths += `<line x1="0" y1="280" x2="0" y2="350" stroke="#8b7355" stroke-width="2"/>`;
        paths += `<line x1="560" y1="280" x2="560" y2="350" stroke="#8b7355" stroke-width="2"/>`;
        
        paths += `<line x1="210" y1="0" x2="350" y2="140" stroke="#8b7355" stroke-width="1.5"/>`;
        paths += `<line x1="350" y1="0" x2="210" y2="140" stroke="#8b7355" stroke-width="1.5"/>`;
        
        paths += `<line x1="210" y1="490" x2="350" y2="630" stroke="#8b7355" stroke-width="1.5"/>`;
        paths += `<line x1="350" y1="490" x2="210" y2="630" stroke="#8b7355" stroke-width="1.5"/>`;
        
        svg.innerHTML = paths;
        boardLines.appendChild(svg);
        chessboard.appendChild(boardLines);
    }
    
    renderRiver(chessboard) {
        const riverContainer = document.createElement('div');
        riverContainer.className = 'river-container';
        
        const chuhe = document.createElement('div');
        chuhe.className = 'river-text chuhe';
        chuhe.textContent = '楚河';
        riverContainer.appendChild(chuhe);
        
        const hanjie = document.createElement('div');
        hanjie.className = 'river-text hanjie';
        hanjie.textContent = '汉界';
        riverContainer.appendChild(hanjie);
        
        chessboard.appendChild(riverContainer);
    }
    
    renderPieces(chessboard) {
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.textContent = piece.type;
                    pieceElement.dataset.row = row;
                    pieceElement.dataset.col = col;
                    
                    const left = 70 + col * 70;
                    const top = 70 + row * 70;
                    pieceElement.style.left = `${left}px`;
                    pieceElement.style.top = `${top}px`;
                    pieceElement.style.transform = 'translate(-50%, -50%)';
                    pieceElement.style.zIndex = '100';
                    
                    if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                        pieceElement.classList.add('selected');
                    }
                    
                    pieceElement.addEventListener('click', () => this.handlePieceClick(row, col));
                    chessboard.appendChild(pieceElement);
                }
            }
        }
    }
    
    renderIntersections(chessboard) {
        const specialPoints = [
            [0, 3], [0, 5], [2, 3], [2, 5],
            [7, 3], [7, 5], [9, 3], [9, 5],
            [4, 2], [4, 6], [5, 2], [5, 6], [4, 4]
        ];
        
        for (const [row, col] of specialPoints) {
            const intersection = document.createElement('div');
            intersection.className = 'intersection';
            intersection.style.left = `${70 + col * 70}px`;
            intersection.style.top = `${70 + row * 70}px`;
            chessboard.appendChild(intersection);
        }
    }
    
    renderValidMoves(chessboard) {
        if (!this.selectedPiece || this.validMoves.length === 0) return;
        
        for (const move of this.validMoves) {
            const moveElement = document.createElement('div');
            const targetPiece = this.board[move.to.row][move.to.col];
            
            moveElement.className = targetPiece ? 'capture-move' : 'valid-move';
            moveElement.style.left = `${70 + move.to.col * 70}px`;
            moveElement.style.top = `${70 + move.to.row * 70}px`;
            
            moveElement.addEventListener('click', () => {
                this.handlePieceClick(move.to.row, move.to.col);
            });
            
            chessboard.appendChild(moveElement);
        }
    }
    
    handlePieceClick(row, col) {
        if (!this.gameStarted || this.gameOver || this.currentPlayer !== 'red') return;
        
        const piece = this.board[row][col];
        
        if (piece && piece.color === this.currentPlayer) {
            if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                this.selectedPiece = null;
                this.validMoves = [];
            } else {
                this.selectedPiece = { row, col };
                this.validMoves = this.getValidMoves(row, col);
            }
            this.renderBoard();
            return;
        }
        
        const move = this.validMoves.find(m => m.to.row === row && m.to.col === col);
        if (move) {
            this.makeMove(move);
            return;
        }
        
        this.selectedPiece = null;
        this.validMoves = [];
        this.renderBoard();
    }
    
    getValidMoves(row, col) {
        return this.getValidMovesForBoard(this.board, row, col, this.board[row][col].color);
    }
    
    getValidMovesForBoard(board, row, col, color) {
        const piece = board[row][col];
        if (!piece) return [];
        
        let moves = [];
        
        switch (piece.type) {
            case '车': case '車':
                moves.push(...this.getRookMoves(board, row, col, color));
                break;
            case '马': case '馬':
                moves.push(...this.getKnightMoves(board, row, col, color));
                break;
            case '相': case '象':
                moves.push(...this.getElephantMoves(board, row, col, color));
                break;
            case '仕': case '士':
                moves.push(...this.getAdvisorMoves(board, row, col, color));
                break;
            case '帅': case '将':
                moves.push(...this.getKingMoves(board, row, col, color));
                break;
            case '炮':
                moves.push(...this.getCannonMoves(board, row, col, color));
                break;
            case '兵': case '卒':
                moves.push(...this.getPawnMoves(board, row, col, color));
                break;
        }
        
        return moves.filter(move => !this.wouldBeInCheck(board, move, color));
    }
    
    wouldBeInCheck(board, move, color) {
        const tempBoard = board.map(r => r.map(p => p ? { ...p } : null));
        tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
        tempBoard[move.from.row][move.from.col] = null;
        
        const kingPos = this.findKing(tempBoard, color);
        return this.isInCheck(tempBoard, kingPos, color);
    }
    
    getRookMoves(board, row, col, color) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            
            while (r >= 0 && r < 10 && c >= 0 && c < 9) {
                const target = board[r][c];
                if (!target) {
                    moves.push({ from: { row, col }, to: { row: r, col: c } });
                } else {
                    if (target.color !== color) {
                        moves.push({ from: { row, col }, to: { row: r, col: c } });
                    }
                    break;
                }
                r += dr;
                c += dc;
            }
        }
        
        return moves;
    }
    
    getKnightMoves(board, row, col, color) {
        const moves = [];
        const knightOffsets = [
            { dr: -2, dc: -1, cr: -1, cc: 0 },
            { dr: -2, dc: 1, cr: -1, cc: 0 },
            { dr: -1, dc: -2, cr: 0, cc: -1 },
            { dr: -1, dc: 2, cr: 0, cc: 1 },
            { dr: 1, dc: -2, cr: 0, cc: -1 },
            { dr: 1, dc: 2, cr: 0, cc: 1 },
            { dr: 2, dc: -1, cr: 1, cc: 0 },
            { dr: 2, dc: 1, cr: 1, cc: 0 }
        ];
        
        for (const offset of knightOffsets) {
            const r = row + offset.dr;
            const c = col + offset.dc;
            const checkR = row + offset.cr;
            const checkC = col + offset.cc;
            
            if (checkR >= 0 && checkR < 10 && checkC >= 0 && checkC < 9 && board[checkR][checkC]) {
                continue;
            }
            
            if (r >= 0 && r < 10 && c >= 0 && c < 9) {
                const target = board[r][c];
                if (!target || target.color !== color) {
                    moves.push({ from: { row, col }, to: { row: r, col: c } });
                }
            }
        }
        
        return moves;
    }
    
    getElephantMoves(board, row, col, color) {
        const moves = [];
        const elephantOffsets = [
            { dr: -2, dc: -2, cr: -1, cc: -1 },
            { dr: -2, dc: 2, cr: -1, cc: 1 },
            { dr: 2, dc: -2, cr: 1, cc: -1 },
            { dr: 2, dc: 2, cr: 1, cc: 1 }
        ];
        
        for (const offset of elephantOffsets) {
            const r = row + offset.dr;
            const c = col + offset.dc;
            const checkR = row + offset.cr;
            const checkC = col + offset.cc;
            
            if (checkR >= 0 && checkR < 10 && checkC >= 0 && checkC < 9) {
                if (board[checkR][checkC]) continue;
            } else {
                continue;
            }
            
            if ((color === 'red' && r >= 5) || (color === 'black' && r < 5)) {
                continue;
            }
            
            if (r >= 0 && r < 10 && c >= 0 && c < 9) {
                const target = board[r][c];
                if (!target || target.color !== color) {
                    moves.push({ from: { row, col }, to: { row: r, col: c } });
                }
            }
        }
        
        return moves;
    }
    
    getAdvisorMoves(board, row, col, color) {
        const moves = [];
        const offsets = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dr, dc] of offsets) {
            const r = row + dr;
            const c = col + dc;
            
            if ((color === 'red' && (r < 7 || r > 9 || c < 3 || c > 5)) ||
                (color === 'black' && (r < 0 || r > 2 || c < 3 || c > 5))) {
                continue;
            }
            
            if (r >= 0 && r < 10 && c >= 0 && c < 9) {
                const target = board[r][c];
                if (!target || target.color !== color) {
                    moves.push({ from: { row, col }, to: { row: r, col: c } });
                }
            }
        }
        
        return moves;
    }
    
    getKingMoves(board, row, col, color) {
        const moves = [];
        const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of offsets) {
            const r = row + dr;
            const c = col + dc;
            
            if ((color === 'red' && (r < 7 || r > 9 || c < 3 || c > 5)) ||
                (color === 'black' && (r < 0 || r > 2 || c < 3 || c > 5))) {
                continue;
            }
            
            if (r >= 0 && r < 10 && c >= 0 && c < 9) {
                const target = board[r][c];
                if (!target || target.color !== color) {
                    moves.push({ from: { row, col }, to: { row: r, col: c } });
                }
            }
        }
        
        return moves;
    }
    
    getCannonMoves(board, row, col, color) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            let foundPiece = false;
            
            while (r >= 0 && r < 10 && c >= 0 && c < 9) {
                const target = board[r][c];
                
                if (!target) {
                    if (!foundPiece) {
                        moves.push({ from: { row, col }, to: { row: r, col: c } });
                    }
                } else {
                    if (!foundPiece) {
                        foundPiece = true;
                    } else {
                        if (target.color !== color) {
                            moves.push({ from: { row, col }, to: { row: r, col: c } });
                        }
                        break;
                    }
                }
                
                r += dr;
                c += dc;
            }
        }
        
        return moves;
    }
    
    getPawnMoves(board, row, col, color) {
        const moves = [];
        const direction = color === 'red' ? -1 : 1;
        
        const r1 = row + direction;
        if (r1 >= 0 && r1 < 10) {
            if (!board[r1][col]) {
                moves.push({ from: { row, col }, to: { row: r1, col: col } });
            }
        }
        
        const isRedCrossed = color === 'red' && row < 5;
        const isBlackCrossed = color === 'black' && row >= 5;
        
        if (isRedCrossed || isBlackCrossed) {
            for (const dc of [-1, 1]) {
                const c = col + dc;
                if (c >= 0 && c < 9) {
                    const target = board[r1][c];
                    if (target && target.color !== color) {
                        moves.push({ from: { row, col }, to: { row: r1, col: c } });
                    }
                }
            }
        }
        
        return moves;
    }
    
    findKing(board, color) {
        const kingType = color === 'red' ? '帅' : '将';
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece && piece.type === kingType) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    isInCheck(board, kingPos, color) {
        if (!kingPos) return true;
        
        const kingRow = kingPos.row;
        const kingCol = kingPos.col;
        const opponentColor = color === 'red' ? 'black' : 'red';
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            let r = kingRow + dr;
            let c = kingCol + dc;
            let pieceCount = 0;
            
            while (r >= 0 && r < 10 && c >= 0 && c < 9) {
                const piece = board[r][c];
                if (piece) {
                    if (piece.color === opponentColor) {
                        if (piece.type === '车' || piece.type === '車') {
                            if (pieceCount === 0) return true;
                            break;
                        } else if (piece.type === '炮') {
                            if (pieceCount === 0 || pieceCount === 1) return true;
                            break;
                        }
                    } else {
                        break;
                    }
                }
                pieceCount++;
                r += dr;
                c += dc;
            }
        }
        
        const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        const knightChecks = [[-1, 0], [-1, 0], [0, -1], [0, 1], [0, -1], [0, 1], [1, 0], [1, 0]];
        
        for (let i = 0; i < knightMoves.length; i++) {
            const [dr, dc] = knightMoves[i];
            const [cr, cc] = knightChecks[i];
            
            const r = kingRow + dr;
            const c = kingCol + dc;
            const checkR = kingRow + cr;
            const checkC = kingCol + cc;
            
            if (checkR >= 0 && checkR < 10 && checkC >= 0 && checkC < 9 && board[checkR][checkC]) {
                continue;
            }
            
            if (r >= 0 && r < 10 && c >= 0 && c < 9) {
                const piece = board[r][c];
                if (piece && piece.color === opponentColor && (piece.type === '马' || piece.type === '馬')) {
                    return true;
                }
            }
        }
        
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.color === opponentColor && (piece.type === '兵' || piece.type === '卒')) {
                    if (piece.color === 'red' && r + 1 === kingRow && Math.abs(c - kingCol) === 1) {
                        return true;
                    }
                    if (piece.color === 'black' && r - 1 === kingRow && Math.abs(c - kingCol) === 1) {
                        return true;
                    }
                }
            }
        }
        
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.color === opponentColor) {
                    if ((piece.type === '将' || piece.type === '帅') && r === kingRow) {
                        let hasPieceBetween = false;
                        const start = Math.min(kingCol, c) + 1;
                        const end = Math.max(kingCol, c) - 1;
                        
                        for (let colCheck = start; colCheck <= end; colCheck++) {
                            if (board[r][colCheck]) {
                                hasPieceBetween = true;
                                break;
                            }
                        }
                        
                        if (!hasPieceBetween) return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    makeMove(move) {
        this.gameHistory.push({
            board: this.board.map(row => row.map(piece => piece ? { ...piece } : null)),
            currentPlayer: this.currentPlayer
        });
        
        const { from, to } = move;
        this.board[to.row][to.col] = this.board[from.row][from.col];
        this.board[to.row][to.col].moved = true;
        this.board[from.row][from.col] = null;
        
        this.selectedPiece = null;
        this.validMoves = [];
        
        this.renderBoard();
        this.updateLastMove(`${from.row},${from.col} → ${to.row},${to.col}`);
        
        if (this.checkGameOver()) return;
        
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        
        if (this.currentPlayer === 'black') {
            this.updateGameStatus('电脑思考中...');
            setTimeout(() => this.computerMove(), 500);
        } else {
            this.updateGameStatus('轮到您走棋');
        }
    }
    
    computerMove() {
        const move = this.getBestMove(this.difficulty + 1);
        if (move) this.makeMove(move);
    }
    
    getBestMove(difficulty) {
        const moves = this.getAllValidMoves('black');
        if (moves.length === 0) return null;
        
        switch (true) {
            case difficulty <= 3:
                return moves[Math.floor(Math.random() * moves.length)];
            case difficulty <= 7:
                return this.getSimpleEvaluationMove(moves);
            case difficulty <= 11:
                return this.getMediumEvaluationMove(moves, 1);
            case difficulty <= 15:
                return this.getMediumEvaluationMove(moves, 2);
            case difficulty <= 17:
                return this.getAdvancedEvaluationMove(moves, 3);
            default:
                return this.getAdvancedEvaluationMove(moves, 4);
        }
    }
    
    getSimpleEvaluationMove(moves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const tempBoard = this.board.map(row => row.map(piece => piece ? { ...piece } : null));
            const targetPiece = tempBoard[move.to.row][move.to.col];
            
            let score = 0;
            if (targetPiece) score += PIECE_VALUES[targetPiece.type] || 0;
            
            tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
            tempBoard[move.from.row][move.from.col] = null;
            const kingPos = this.findKing(tempBoard, 'black');
            if (!this.isInCheck(tempBoard, kingPos, 'black')) score += 50;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || moves[Math.floor(Math.random() * moves.length)];
    }
    
    getMediumEvaluationMove(moves, depth) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const tempBoard = this.board.map(row => row.map(piece => piece ? { ...piece } : null));
            tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
            tempBoard[move.from.row][move.from.col] = null;
            
            const score = this.evaluateBoard(tempBoard, depth);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || moves[Math.floor(Math.random() * moves.length)];
    }
    
    getAdvancedEvaluationMove(moves, depth) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const tempBoard = this.board.map(row => row.map(piece => piece ? { ...piece } : null));
            tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
            tempBoard[move.from.row][move.from.col] = null;
            
            const score = this.minimax(tempBoard, depth, false, -Infinity, Infinity);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || moves[Math.floor(Math.random() * moves.length)];
    }
    
    minimax(board, depth, maximizingPlayer, alpha, beta) {
        if (depth === 0) return this.evaluateBoard(board, 0);
        
        const color = maximizingPlayer ? 'black' : 'red';
        const moves = this.getAllValidMovesForBoardMinimax(board, color);
        
        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const tempBoard = board.map(row => row.map(piece => piece ? { ...piece } : null));
                tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
                tempBoard[move.from.row][move.from.col] = null;
                
                const evalScore = this.minimax(tempBoard, depth - 1, false, alpha, beta);
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const tempBoard = board.map(row => row.map(piece => piece ? { ...piece } : null));
                tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
                tempBoard[move.from.row][move.from.col] = null;
                
                const evalScore = this.minimax(tempBoard, depth - 1, true, alpha, beta);
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }
    
    getAllValidMovesForBoardMinimax(board, color) {
        const moves = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    let pieceMoves = [];
                    switch (piece.type) {
                        case '车': case '車': pieceMoves = this.getRookMoves(board, row, col, color); break;
                        case '马': case '馬': pieceMoves = this.getKnightMoves(board, row, col, color); break;
                        case '相': case '象': pieceMoves = this.getElephantMoves(board, row, col, color); break;
                        case '仕': case '士': pieceMoves = this.getAdvisorMoves(board, row, col, color); break;
                        case '帅': case '将': pieceMoves = this.getKingMoves(board, row, col, color); break;
                        case '炮': pieceMoves = this.getCannonMoves(board, row, col, color); break;
                        case '兵': case '卒': pieceMoves = this.getPawnMoves(board, row, col, color); break;
                    }
                    
                    pieceMoves = pieceMoves.filter(move => !this.wouldBeInCheck(board, move, color));
                    moves.push(...pieceMoves);
                }
            }
        }
        return moves;
    }
    
    getAllValidMoves(color) {
        const moves = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    moves.push(...this.getValidMoves(row, col));
                }
            }
        }
        return moves;
    }
    
    evaluateBoard(board, depth) {
        let score = 0;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece) {
                    const value = PIECE_VALUES[piece.type];
                    score += piece.color === 'black' ? value : -value;
                }
            }
        }
        
        return score;
    }
    
    checkGameOver() {
        const redKing = this.findKing(this.board, 'red');
        const blackKing = this.findKing(this.board, 'black');
        
        if (!redKing) { this.endGame('black'); return true; }
        if (!blackKing) { this.endGame('red'); return true; }
        
        if (this.isInCheck(this.board, redKing, 'red')) {
            const moves = this.getAllValidMoves('red');
            if (moves.length === 0) { this.endGame('black'); return true; }
        }
        
        if (this.isInCheck(this.board, blackKing, 'black')) {
            const moves = this.getAllValidMoves('black');
            if (moves.length === 0) { this.endGame('red'); return true; }
        }
        
        return false;
    }
    
    endGame(winner) {
        this.gameOver = true;
        
        if (winner === 'red') {
            const pointsGained = (this.difficulty + 1) * 10;
            this.userScore += pointsGained;
            this.saveUserScore();
            this.updateGameStatus(`恭喜您获胜！获得 ${pointsGained} 积分`);
            this.showModal(`恭喜您获胜！获得 ${pointsGained} 积分`, '新游戏');
        } else {
            const pointsLost = Math.max(5, this.difficulty * 5);
            this.userScore = Math.max(0, this.userScore - pointsLost);
            this.saveUserScore();
            this.updateGameStatus(`很遗憾，您输了！扣除 ${pointsLost} 积分`);
            this.showModal(`很遗憾，您输了！扣除 ${pointsLost} 积分`, '再来一局');
        }
        
        this.updateUI();
    }
    
    showModal(message, buttonText) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>游戏结束</h2>
                <p>${message}</p>
                <button id="modal-btn">${buttonText}</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        modal.querySelector('#modal-btn').addEventListener('click', () => {
            modal.remove();
            this.newGame();
        });
    }
    
    getUserLevel() {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            const level = LEVELS[i];
            if (this.userScore >= level.minScore) return level.name;
        }
        return LEVELS[0].name;
    }
    
    updateUI() {
        document.getElementById('user-score').textContent = this.userScore;
        document.getElementById('user-level').textContent = this.getUserLevel();
    }
    
    updateGameStatus(status) {
        document.getElementById('game-status').textContent = status;
    }
    
    updateLastMove(move) {
        document.getElementById('last-move').textContent = `上次走棋：${move}`;
    }
    
    saveUserScore() {
        localStorage.setItem('chessUserScore', this.userScore.toString());
    }
    
    loadUserScore() {
        const saved = localStorage.getItem('chessUserScore');
        this.userScore = saved ? parseInt(saved) : 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new ChessGame();
});