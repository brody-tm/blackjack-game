const DECK_ID = "6xbg34byt17f";

const playerHandDisplay = document.getElementById("player_hand");
const playerHitButton = document.getElementById("player_hit");
const playerStayButton = document.getElementById("player_stay");

const opponentHandDisplay = document.getElementById("opponent_hand");

const resultDisplay = document.getElementById("result_display");
const startButton = document.getElementById("start_button");

const hitSound = document.getElementById("hit_sound");
const staySound = document.getElementById("stay_sound");
const bustSound = document.getElementById("bust_sound");

let playerHand = [];
let opponentHand = [];
let opponentHandOriginalImages = [];

let playerHandValue = 0;
let opponentHandValue = 0;

let playerBust = false;
let opponentBust = false;

// Shuffle the cards in the deck
async function shuffleDeck() {
    try {
        const response = await fetch(`https://deckofcardsapi.com/api/deck/${DECK_ID}/shuffle/?deck_count=1`);
        await response.json();
    } catch (error) {
        console.error("Error shuffling cards:", error);
    }
}

// Draw a specified number of cards from the deck
async function drawCards(count) {
    try {
        const response = await fetch(`https://deckofcardsapi.com/api/deck/${DECK_ID}/draw/?count=${count}`);
        const data = await response.json();
        if (data.success) {
            return data.cards;
        } else {
            console.error("Failed to draw cards:", data);
            return [];
        }
    } catch (error) {
        console.error("Error drawing cards:", error);
        return [];
    }
}

// Add cards to a specific pile
async function addToPile(pileName, cards) {
    const cardsString = cards.map(card => card.code).join(",");
    try {
        await fetch(`https://deckofcardsapi.com/api/deck/${DECK_ID}/pile/${pileName}/add/?cards=${cardsString}`);
    } catch (error) {
        console.error("Error adding to pile:", error);
    }
}

// Deal an initial hand of two cards
async function dealInitialHand(pileName) {
    const hand = await drawCards(2);
    if (hand.length > 0) {
        await addToPile(pileName, hand);
    }
    return hand;
}

// Draw one card and add to a pile
async function drawCard(pileName) {
    const hand = await drawCards(1);
    if (hand.length > 0) {
        await addToPile(pileName, hand);
    }
    return hand;
}

// Calculate the value of a hand
function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;

    hand.forEach(card => {
        if (card.value === "KING" || card.value === "QUEEN" || card.value === "JACK") {
            value += 10;
        } else if (card.value === "ACE") {
            aceCount += 1;
            value += 11;
        } else {
            value += Number(card.value);
        }
    });

    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount -= 1;
    }

    return value;
}

// Display cards in the UI
function displayCards(cards, container) {
    container.innerHTML = ""; // Clear any existing cards
    cards.forEach(card => {
        const cardImg = document.createElement("img");
        cardImg.src = card.image;
        cardImg.classList.add("card_img");
        container.appendChild(cardImg);
    });
}

// Initialize the game
async function initializeGame() {
    await shuffleDeck();

    playerHand = await dealInitialHand("player");
    opponentHand = await dealInitialHand("opponent");

    playerHandValue = calculateHandValue(playerHand);
    opponentHandValue = calculateHandValue(opponentHand);

    // Store the original images of the opponent's hand
    opponentHandOriginalImages = opponentHand.map(card => card.image);

    // Hide the opponent's first card
    opponentHand[0].image = 'https://deckofcardsapi.com/static/img/back.png';

    displayCards(playerHand, playerHandDisplay);
    displayCards(opponentHand, opponentHandDisplay);
}

// Determine the winner
function determineWinner() {
    if (!playerBust) {
        staySound.play();
    }

    // Reveal the opponent's first card
    opponentHand[0].image = opponentHandOriginalImages[0];
    displayCards(opponentHand, opponentHandDisplay);

    if (playerBust) {
        resultDisplay.innerText = opponentBust ? "It's a draw!" : "The dealer wins!";
    } else if (opponentBust) {
        resultDisplay.innerText = "Player wins!";
    } else if (playerHandValue > opponentHandValue) {
        resultDisplay.innerText = "Player wins!";
    } else if (playerHandValue < opponentHandValue) {
        resultDisplay.innerText = "The dealer wins!";
    } else {
        resultDisplay.innerText = "It's a draw!";
    }
}

// Player hit action
async function playerHit() {
    if (playerHandValue > 21) return;

    const newCard = await drawCard("player");
    playerHand.push(...newCard);
    playerHandValue = calculateHandValue(playerHand);

    displayCards(playerHand, playerHandDisplay);

    if (playerHandValue > 21) {
        playerBust = true;
        bustSound.play();
        determineWinner();
        return;
    }

    // Play hit sound
    hitSound.play();
}

// Player stay action
async function playerStay() {
    while (opponentHandValue < 15) {
        const newCard = await drawCard("opponent");
        opponentHand.push(...newCard);
        opponentHandValue = calculateHandValue(opponentHand);

        displayCards(opponentHand, opponentHandDisplay);

        if (opponentHandValue > 21) {
            opponentBust = true;
        }
    }
    determineWinner();
}

// Main game logic
async function main() {
    await initializeGame();

    playerHitButton.addEventListener("click", playerHit);
    playerStayButton.addEventListener("click", playerStay);

    startButton.addEventListener("click", () => {
        location.reload();
    });
}

// Start the game
main();
