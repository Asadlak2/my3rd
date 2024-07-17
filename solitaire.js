const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function dealCards(deck) {
    let tableau = Array(7).fill().map(() => []);
    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
            tableau[j].push(deck.pop());
        }
    }
    return { tableau, stock: deck };
}

function initGame() {
    let deck = createDeck();
    deck = shuffleDeck(deck);
    let { tableau, stock } = dealCards(deck);
    
    return { 
        tableau, 
        foundation: Array(4).fill().map(() => []),
        stock, 
        waste: [],
        score: 0,
        moves: [],
        selectedCards: null
    };
}

let gameState = initGame();

function isValidMove(cards, destination, destinationPile) {
    let card = cards[0];
    if (destination === 'foundation') {
        if (destinationPile.length === 0) {
            return card.value === 'A';
        }
        let topCard = destinationPile[destinationPile.length - 1];
        return card.suit === topCard.suit && values.indexOf(card.value) === values.indexOf(topCard.value) + 1;
    } else if (destination === 'tableau') {
        if (destinationPile.length === 0) {
            return cards[0].value === 'K';
        }
        let topCard = destinationPile[destinationPile.length - 1];
        return (suits.indexOf(cards[0].suit) % 2 !== suits.indexOf(topCard.suit) % 2) && 
               (values.indexOf(cards[0].value) === values.indexOf(topCard.value) - 1);
    }
    return false;
}

function moveCards(from, fromIndex, to, toIndex, numCards = 1) {
    let fromPile = gameState[from];
    let toPile = gameState[to];
    
    let moveDetails = { from, fromIndex, to, toIndex, numCards, cards: [] };

    if (from === 'stock' && to === 'waste') {
        if (fromPile.length > 0) {
            let card = fromPile.pop();
            toPile.push(card);
            moveDetails.cards.push(card);
        } else {
            moveDetails.cards = [...gameState.waste];
            gameState.stock = gameState.waste.reverse();
            gameState.waste = [];
        }
    } else {
        let cards = fromPile[fromIndex].splice(-numCards);
        if (isValidMove(cards, to, toPile[toIndex])) {
            toPile[toIndex].push(...cards);
            moveDetails.cards = cards;
            updateScore(from, to);
        } else {
            fromPile[fromIndex].push(...cards);
            return false;
        }
    }

    gameState.moves.push(moveDetails);
    return true;
}

function updateScore(from, to) {
    if ((from === 'waste' || from === 'tableau') && to === 'foundation') gameState.score += 10;
    if (from === 'foundation' && to === 'tableau') gameState.score -= 15;
}

function undoMove() {
    if (gameState.moves.length === 0) return;
    
    let lastMove = gameState.moves.pop();
    let { from, fromIndex, to, toIndex, cards } = lastMove;

    if (from === 'stock' && to === 'waste') {
        if (cards.length === 1) {
            gameState.stock.push(gameState.waste.pop());
        } else {
            gameState.waste = cards;
            gameState.stock = [];
        }
    } else {
        gameState[to][toIndex].splice(-cards.length);
        gameState[from][fromIndex].push(...cards);
    }

    if ((from === 'waste' || from === 'tableau') && to === 'foundation') gameState.score -= 10;
    if (from === 'foundation' && to === 'tableau') gameState.score += 15;

    renderGame();
}

function handleClick(location, index) {
    if (location === 'stock') {
        moveCards('stock', 0, 'waste', 0);
    } else if (location === 'waste' && gameState.waste.length > 0) {
        for (let i = 0; i < 4; i++) {
            if (isValidMove([gameState.waste[gameState.waste.length - 1]], 'foundation', gameState.foundation[i])) {
                moveCards('waste', 0, 'foundation', i);
                break;
            }
        }
    } else if (location === 'tableau') {
        if (gameState.selectedCards) {
            let [selectedLocation, selectedIndex] = gameState.selectedCards;
            if (selectedLocation === 'tableau') {
                let numCards = gameState.tableau[selectedIndex].length - gameState.tableau[selectedIndex].indexOf(gameState.tableau[selectedIndex].find(card => !card.faceDown));
                moveCards(selectedLocation, selectedIndex, 'tableau', index, numCards);
            } else {
                moveCards(selectedLocation, selectedIndex, 'tableau', index);
            }
            gameState.selectedCards = null;
        } else {
            gameState.selectedCards = [location, index];
        }
    } else if (location === 'foundation') {
        if (gameState.selectedCards) {
            let [selectedLocation, selectedIndex] = gameState.selectedCards;
            moveCards(selectedLocation, selectedIndex, 'foundation', index);
            gameState.selectedCards = null;
        }
    }
    
    renderGame();
    
    if (checkWin()) {
        alert(`Congratulations! You won! Your score is ${gameState.score}`);
    }
}

function checkWin() {
    return gameState.foundation.every(pile => pile.length === 13);
}

function renderGame() {
    document.getElementById('tableau').innerHTML = '';
    document.getElementById('stock').innerHTML = '';
    document.getElementById('waste').innerHTML = '';
    document.getElementById('foundation').innerHTML = '';

    gameState.tableau.forEach((pile, i) => {
        let pileElement = document.createElement('div');
        pileElement.className = 'pile';
        pile.forEach((card, j) => {
            let cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = `${card.value}${card.suit[0]}`;
            cardElement.onclick = () => handleClick('tableau', i);
            pileElement.appendChild(cardElement);
        });
        document.getElementById('tableau').appendChild(pileElement);
    });

    let stockElement = document.createElement('div');
    stockElement.className = 'card';
    stockElement.textContent = gameState.stock.length;
    stockElement.onclick = () => handleClick('stock', 0);
    document.getElementById('stock').appendChild(stockElement);

    if (gameState.waste.length > 0) {
        let wasteElement = document.createElement('div');
        wasteElement.className = 'card';
        let topWaste = gameState.waste[gameState.waste.length - 1];
        wasteElement.textContent = `${topWaste.value}${topWaste.suit[0]}`;
        wasteElement.onclick = () => handleClick('waste', 0);
        document.getElementById('waste').appendChild(wasteElement);
    }

    gameState.foundation.forEach((pile, i) => {
        let pileElement = document.createElement('div');
        pileElement.className = 'pile';
        if (pile.length > 0) {
            let topCard = pile[pile.length - 1];
            let cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = `${topCard.value}${topCard.suit[0]}`;
            pileElement.appendChild(cardElement);
        }
        document.getElementById('foundation').appendChild(pileElement);
    });

    let scoreElement = document.createElement('div');
    scoreElement.id = 'score';
    scoreElement.textContent = `Score: ${gameState.score}`;
    document.getElementById('game-container').prepend(scoreElement);

    let undoButton = document.createElement('button');
    undoButton.textContent = 'Undo';
    undoButton.onclick = undoMove;
    document.getElementById('game-container').prepend(undoButton);
}

renderGame();