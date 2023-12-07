// TODO LIST

// Host on Azure

// On screen keyboard??
// Stats
// Settings (color blind mode/light mode)

// Box Colors
const white = "#ffffff";
const grey = "#757575";
const yellow = "#faf178";
const green = "#84ff69";

// Box pointer variables that default to first box at (0,0)
var pointerX;
var pointerY;

// Stores coords of the last box in the current guess row
var lastBox; 

// Stores solution word for the current puzzle
var solution;

// Global flag to check if a guess is currently being evaluated
var evaluateGuessInProgress;

// Global flag to check if the game has already ended
var gameEnded;

// Global flag to check if light mode is enabled
var lightModeEnabled = false;

// Fetch a random solution word from the server
async function getSolutionWord() {
    console.log('getSolutionWord() called');
    try {
        // Fetch data from the server
        const response = await fetch('/api/random-word');
        const data = await response.json();

        return data.word;
    } catch (error) {
        console.error('Error fetching random word:', error.message);
    }
}

// Function to create and append a box to the grid
function createBox(letter, color, x, y) {
    const boxGrid = document.getElementById('boxGrid');

    const box = document.createElement('div');
    box.className = 'grid-item';
    box.style.backgroundColor = color;
    box.innerText = letter;

    // Store the x and y coordinates as data attributes
    box.dataset.x = x;
    box.dataset.y = y;

    boxGrid.appendChild(box);
}


// Function to change the letter of a box at given coordinates
function changeBoxLetter(x, y, newLetter) {
    // Locate box
    const box = document.querySelector(`.grid-item[data-x="${x}"][data-y="${y}"]`)
    
    if (box) {
        box.innerText = newLetter;
    } else {
        console.error(`Box not found at coordinates (${x}, ${y})`);
    }
}

// Function to get the last box in a row based on current pointerY value
function getLastBox() {
    return document.querySelector(`.grid-item[data-x="4"][data-y="${pointerY}"]`);
}

// Function that checks if input word exists in any model of the MongoDB database
async function checkDatabaseForWord(word) {
    try {
        // Checking if word exists in SolutionWord model
        let solutionWordResponse = await fetch('/api/solution-word/' + word);
        console.log('Solution Word Response:', solutionWordResponse);
        if (!solutionWordResponse.ok) {
            console.error(`Error checking SolutionWord model: ${solutionWordResponse.statusText}`);
            return false;
        }
        let solutionWord = await solutionWordResponse.json();
        if (solutionWord.exists) {
            console.log("Word found in SolutionWord");
            return true;
        }
        // Checking if word exists in GuessableWord model
        let guessableWordResponse = await fetch('/api/guessable-word/' + word);
        console.log('Guessable Word Response', guessableWordResponse);
        if (!guessableWordResponse.ok) {
            console.error(`Error checking GuessableWord model: ${guessableWordResponse.statusText}`);
            return false;
        }
        let guessableWord = await guessableWordResponse.json();
        if (guessableWord.exists) {
            console.log("Word foundin GuessableWord");
            return true;
        }

        // Word not found in either model
        return false;
    } catch (error) {
        console.error('There was an unexpected error checking the database for the word', error.message);
        return false;
    }
}

// Function to reset the grid back to default
function resetGrid() {
    const gridItems = document.querySelectorAll('.grid-item');

    // Iterate through each grid item and set its background color to white
    gridItems.forEach((box) => {
        box.style.backgroundColor = white;
        box.innerText = '';
    });
}

// Function to update colors in a row after a user guesses to reflect which letters are fully correct, in a different spot, or not in the word at all
function updateRowColors(guessArray, solution) {
    let solutionArray = solution.split('');
    let correctGuess = true;

    // Checking for green letters
    for (let i = 0; i <= 4; i++) {
        if (guessArray[i] == solutionArray[i]) {
            guessArray[i] = 'green';
            solutionArray[i] = null;
        } else {
            correctGuess = false;
        }
    }
    // Checking for yellow and grey letters
    for (let i = 0; i <= 4; i++) {
        if (guessArray[i] == 'green') continue;
        else if (solutionArray.includes(guessArray[i])) {
            // Getting index of first instance of guessArray value and removing it
            let index = solutionArray.indexOf(guessArray[i]);
            solutionArray[index] = null;
            guessArray[i] = 'yellow';
        } else guessArray[i] = 'grey';
    }

    console.log(guessArray);

    // Updating the box colors
    for (let i = 0; i <= 4; i++) document.querySelector(`.grid-item[data-x="${i}"][data-y="${pointerY}"]`).style.backgroundColor = `${guessArray[i]}`;
    if (correctGuess) endGame(true);
}

// Function to evaluate user's guess and determine which information should be outputted to them
async function evaluateGuess() {
    evaluateGuessInProgress = true;
    //Box values in a row stored in an array
    let guessArray = Array.from({ length: 5 }, (_, x) => document.querySelector(`.grid-item[data-x="${x}"][data-y="${pointerY}"]`).innerText.toLowerCase());
    //Box values in a row cacatenated together
    let guessString = guessArray.join('');
    pointerX = 0;

    console.log('Checking database for word:', guessString);
    let validWord = await checkDatabaseForWord(guessString);
    console.log(validWord);

    if (validWord) {
        console.log('Word found');
        updateRowColors(guessArray, solution);
        if (gameEnded) return;
        else {
            pointerY++;
            lastBox = getLastBox();
            // Reset flag
            evaluateGuessInProgress = false;
            // Ends game in a loss if player used their last guess
            if (pointerY == 6) endGame(false);
        }
    } else {
        // Clearing all values in a row
        console.log('Word not found');
        for (let i = 0; i <= 4; i++) {
            document.querySelector(`.grid-item[data-x="${i}"][data-y="${pointerY}"]`).innerText = "";
        }
        // Reset flag
        evaluateGuessInProgress = false;
    }
}

// Function that handles key listener declared below
function handleKeyDown(event) {
    // Disable if settings are open
    if (settingsContainer.style.display == 'block') return;
    const key = event.key.toLowerCase();

    // Do nothing if there's a guess being evaluated or if the game has ended
    if (evaluateGuessInProgress || gameEnded) return;
    
     else if (key === 'backspace') {
        changeBoxLetter(pointerX - 1, pointerY, null);
        if (pointerX > 0) pointerX--;
     } else if (key.match(/^[a-z]$/)) {
        //Does not change letter in box if it's the last in the row and if it's already filled
            
        if (pointerX == 4 && lastBox.innerText !== "") return;
        changeBoxLetter(pointerX, pointerY, key.toUpperCase());
        if (pointerX < 5) pointerX++;
    } else if (key === 'enter' && lastBox.innerText !== "") {
        evaluateGuess();
    }

    // Prevents settings button from being selectable by Enter key
    if (key === 'enter' && event.target.id === 'settingsButton') {
        event.preventDefault();
    }
}

// Function that handles game starting logic 
async function startGame () {
    if (settingsContainer.style.display == 'block') return;
    console.log('New game has started');
    buttonContainer.style.display = 'none';
    pointerX = 0;
    pointerY = 0;
    evaluateGuessInProgress = false;
    gameEnded = false;
    
    resetGrid();
    // Getting random word from server
    solution = await getSolutionWord();

    // UNCOMMENT FOR TESTING
    //console.log(`%c${solution}`, 'color: orange; font-weight: bold;');

    lastBox = getLastBox();
    document.addEventListener('keydown', handleKeyDown);
}

// Function that handles game ending logic
function endGame(solvedPrompt) {
    gameEnded = true;
    console.log('The game has ended.');

    // Introduce a delay before showing the alert
    let alertDelayTime = 1000;

    if (solvedPrompt) {
        setTimeout(() => {
            if (pointerY == 0) alert('You solved the prompt in 1 guess!');
            else alert(`You solved the prompt in ${pointerY + 1} guesses!`);
        }, alertDelayTime);
    } else {
        setTimeout(() => {
            alert(`Sorry! The solution was \"${solution}\"!`);
        }, alertDelayTime);
    }

    // Display the buttons
    setTimeout(() => {
        buttonContainer.style.display = 'flex';
    }, alertDelayTime + 500);
}

// Function to get definition of word from dictionary API
async function getDefinition() {
    //Doesn't open if settings is open
    if (settingsContainer.style.display == 'block') return;
    const definitionContainer = document.getElementById('solutionDefinition');
    definitionContainer.innerHTML = ''; // Clear previous content

    // Fetch the definition using the API
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${solution}`);
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
        const wordData = data[0]; // Assuming the first result is relevant

        // Display word and its definition
        definitionContainer.innerHTML += `<h2 class="console-log-solution">${wordData.word}</p>`;
    
        wordData.meanings.forEach(meaning => {
            meaning.definitions.forEach(definition => {
                definitionContainer.innerHTML += `<div class="meaning">
                    <h3>${meaning.partOfSpeech}</h3>
                    <p>${definition.definition}</p>
                </div>`;
            });
        });

        // Show the definition container and hide the buttons
        buttonContainer.style.display = 'none';
        const definitionContainerWrapper = document.querySelector('.definition-container');
        definitionContainerWrapper.style.display = 'block';
    } else {
        // Handle the case where the API response is unexpected
        console.error('Unexpected API response:', data);
    }

        // Add an event listener to the document for a click event
    document.addEventListener('click', function (event) {
        const definitionContainerWrapper = document.querySelector('.definition-container');
        
        // Check if the clicked element is outside the definition container
        if (!definitionContainerWrapper.contains(event.target) && definitionContainerWrapper.style.display == 'block') {
            // Hide the definition container
            definitionContainerWrapper.style.display = 'none';
            // Show buttons again
            buttonContainer.style.display = 'flex';
        }
    });
}

// Function to toggle light mode
function toggleLightMode() {
    // Toggle the light mode state
    lightModeEnabled = !lightModeEnabled;

    var body = document.body;
    var h1 = document.querySelector("h1");
    
    // Check the state of the light mode and apply styles accordingly
    if (lightModeEnabled) {
        body.style.backgroundColor = "#e3be9b";
        h1.style.color = "black";
    } else {
        body.style.backgroundColor = "black";
        h1.style.color = "white";
    }
}

// Add this function to your wordle.js file
function openSettings() {
    settingsContainer.style.display = settingsContainer.style.display === 'block' ? 'none' : 'block';
}

// Function to handle setting clicks
function handleSettingClick(settingNumber) {
    console.log(`Setting ${settingNumber} clicked`);
}

// Wait until document is fully loaded, then create default grid
document.addEventListener("DOMContentLoaded", async function() {
    console.log('Wordle.js loaded');

    const settingsContainer = document.getElementById('settingsContainer');

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 5; j++) {
            // You can set the default letter, color, and coordinates here
            createBox(null, white, j, i);
        }
    }

    const buttonContainer = document.getElementById('buttonContainer');
    console.log('Button Container', buttonContainer);

    startGame();
});


