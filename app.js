const deck_id = "6xbg34byt17f";

const playerHandDisplay = document.getElementById("player_hand");
const playerValueDisplay = document.getElementById("player_value");
const playerHitDisplay = document.getElementById("player_hit");
const playerStayDisplay = document.getElementById("player_stay");

const resultDisplay = document.getElementById("result_display");
const startButtonDisplay = document.getElementById("start_button");

// Shuffle the cards in the deck
async function shuffleCards() {
    try {
        const response = await fetch(`https://deckofcardsapi.com/api/deck/${deck_id}/shuffle/?deck_count=1`);
        await response.json();
    } catch (error) {
        console.error("Error shuffling cards:", error);
    }
}

// Draw a specified number of cards from the deck
async function drawCards(count) {
    try {
        const response = await fetch(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=${count}`);
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
    const cardsString = cards.join(",");
    try {
        await fetch(`https://deckofcardsapi.com/api/deck/${deck_id}/pile/${pileName}/add/?cards=${cardsString}`);
    } catch (error) {
        console.error("Error adding to pile:", error);
    }
}

// Deal an initial hand of two cards
async function dealHand(pileName) {
    const hand = await drawCards(2);
    if (hand.length > 0) {
        await addToPile(pileName, hand.map(card => card.code));
    }
    return hand;
}

// Draw one card and add to a pile
async function hit(pileName) {
    const hand = await drawCards(1);
    if (hand.length > 0) {
        await addToPile(pileName, hand.map(card => card.code));
    }
    return hand;
}

// Calculate the value of a hand
function getHandValue(hand) {
    let values = hand.map(card => card.value);
    let handValue = 0;
    let aceCount = 0;

    values.forEach(value => {
        if (value === "KING" || value === "QUEEN" || value === "JACK") {
            handValue += 10;
        } else if (value === "ACE") {
            aceCount += 1;
            handValue += 11;
        } else {
            handValue += Number(value);
        }
    });

    while (handValue > 21 && aceCount > 0) {
        handValue -= 10;
        aceCount -= 1;
    }

    return handValue;
}

// Display cards in the UI
function displayCards(cards, container) {
    cards.forEach(card => {
        const cardImg = document.createElement("img");
        cardImg.src = card.image;
        cardImg.classList.add("card_img");
        container.appendChild(cardImg);
    });
}

// Initialize the game
async function setupGame() {
    const playerHand = await dealHand("player");

    playerHandCodes = playerHand.map(card => card.code);
    playerHandImages = playerHand.map(card => card.image);
    playerHandValue = getHandValue(playerHand);

    displayCards(playerHand, playerHandDisplay);
    playerValueDisplay.innerText = playerHandValue;

    console.log("Player: " + playerHandCodes + " Value: " + playerHandValue);
}

// Main game logic
async function main() {
    await shuffleCards();
    await setupGame();

    playerHitDisplay.addEventListener("click", async () => {
        const hitHand = await hit("player");
        playerHandCodes.push(hitHand.map(card => card.code));
        playerHandImages.push(hitHand.map(card => card.image));
        playerHandValue += getHandValue(hitHand);

        displayCards(hitHand, playerHandDisplay);
        playerValueDisplay.innerText = playerHandValue;

        console.log("Hit! Player: " + playerHandCodes + " Value: " + playerHandValue);

        if (playerHandValue > 21) {
            resultDisplay.innerText = "Bust!";
            console.log("Bust!");
        }
    });

    playerStayDisplay.addEventListener("click", () => {
        console.log("You stay");
        if (playerHandValue === 21) {
            if (playerHandCodes.length === 2) {
                resultDisplay.innerText = "Blackjack! You win.";
                console.log("Blackjack! You win.");
            } else {
                resultDisplay.innerText = "21! You win.";
                console.log("21! You win.");
            }
        }
    });
}

// Reload the game when start button is clicked
startButtonDisplay.addEventListener("click", () => {
    location.reload();
    return false;
});

// Start the game
main();
