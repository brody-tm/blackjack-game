const deck_id = "6xbg34byt17f";

const playerHandDisplay = document.getElementById("player_hand");
const playerHitDisplay = document.getElementById("player_hit");
const playerStayDisplay = document.getElementById("player_stay");
let playerStay = 0;
let playerBust = 0;

const opponentHandDisplay = document.getElementById("opponent_hand");
let opponentStay = 0;
let opponentBust = 0;

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
function displayCards(images, container) {
    container.innerHTML = ""; // Clear any existing cards
    images.forEach(image => {
        const cardImg = document.createElement("img");
        cardImg.src = image;
        cardImg.classList.add("card_img");
        container.appendChild(cardImg);
    });
}

// Initialize the game
async function setupGame() {
    const playerHand = await dealHand("player");
    const opponentHand = await dealHand("opponent");

    playerHandCodes = playerHand.map(card => card.code);
    playerHandImages = playerHand.map(card => card.image);
    playerHandValue = getHandValue(playerHand);

    opponentHandCodes = opponentHand.map(card => card.code);
    opponentHandImages = opponentHand.map(card => card.image);
    opponentHandOriginalImages = [...opponentHandImages]; // Store the original images
    opponentHandImages[0] = 'https://deckofcardsapi.com/static/img/back.png'; // Change the first image

    opponentHandValue = getHandValue(opponentHand);

    console.log(opponentHandImages);

    displayCards(playerHandImages, playerHandDisplay); // Use playerHandImages
    displayCards(opponentHandImages, opponentHandDisplay); // Use opponentHandImages

    console.log("Player: " + playerHandCodes + " Value: " + playerHandValue);
}


function determineWinner() {
    // Reveal the dealer's first card
    opponentHandImages[0] = opponentHandOriginalImages[0];
    displayCards(opponentHandImages, opponentHandDisplay);

    if (playerBust) {
        console.log("The dealer wins! Score: " + playerHandValue + "-" + opponentHandValue);
        resultDisplay.innerText = "The dealer wins! Score: " + playerHandValue + "-" + opponentHandValue;
        if (opponentBust) {
            resultDisplay.innerText = "It's a draw! Score: " + playerHandValue + "-" + opponentHandValue;
        }
    } else if (opponentBust) {
        console.log("Player wins! Score: " + playerHandValue + "-" + opponentHandValue);
        resultDisplay.innerText = "Player wins! Score: " + playerHandValue + "-" + opponentHandValue;
    } else if (playerHandValue == opponentHandValue) {
        console.log("It's a draw! Score: " + playerHandValue + "-" + opponentHandValue);
        resultDisplay.innerText = "It's a draw! Score: " + playerHandValue + "-" + opponentHandValue;
    } else if (playerHandValue > opponentHandValue) {
        console.log("Player wins! Score: " + playerHandValue + "-" + opponentHandValue);
        resultDisplay.innerText = "Player wins! Score: " + playerHandValue + "-" + opponentHandValue;
    } else if (playerHandValue < opponentHandValue) {
        console.log("The dealer wins! Score: " + playerHandValue + "-" + opponentHandValue);
        resultDisplay.innerText = "The dealer wins! Score: " + playerHandValue + "-" + opponentHandValue;
    }
    return;
}


// Main game logic
async function main() {
    await shuffleCards();
    await setupGame();

    // Listen for hit
    playerHitDisplay.addEventListener("click", async () => {
        if (playerHandValue >= 21) {
            return;
        }
    
        const playerHitHand = await hit("player");
        if (playerHitHand.length > 0) {
            playerHandCodes.push(playerHitHand[0].code);
            playerHandImages.push(playerHitHand[0].image);
            playerHandValue += getHandValue(playerHitHand);
    
            displayCards(playerHandImages, playerHandDisplay);
    
            console.log("Hit! Player: " + playerHandCodes + " Value: " + playerHandValue);
    
            if (playerHandValue > 21) {
                console.log("Bust!");
                playerBust = 1;
            }
        }
    
        if (opponentHandValue < 15) {
            const opponentHitHand = await hit("opponent");
            if (opponentHitHand.length > 0) {
                opponentHandCodes.push(opponentHitHand[0].code);
                opponentHandImages.push(opponentHitHand[0].image);
                opponentHandValue += getHandValue(opponentHitHand);
    
                displayCards(opponentHandImages, opponentHandDisplay);
    
                if (opponentHandValue > 21) {
                    console.log("Bust!");
                    opponentBust = 1;
                }
            }
        } else {
            opponentStay = 1;
        }
    });

    playerStayDisplay.addEventListener("click", async () => {
        playerStay = 1;

        // Check if opponent should hit or stay
        while (true) {
            if (opponentHandValue < 15) {
                const opponentHitHand = await hit("opponent");
                opponentHandCodes.push(opponentHitHand.map(card => card.code));
                opponentHandImages.push(opponentHitHand.map(card => card.image));
                opponentHandValue += getHandValue(opponentHitHand);
        
                displayCards(opponentHitHand, opponentHandDisplay);
    
                if (opponentHandValue > 21) {
                    // resultDisplay.innerText = "Bust!";
                    console.log("Bust!");
                    opponentBust = 1;
                }
            }
            else {
                opponentStay = 1;
                break;
            }
        }

        if (opponentStay) {
            determineWinner();
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
