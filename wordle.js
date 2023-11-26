console.log('Wordle.js loaded');

//Box Colors
const white = "#ffffff";
const yellow = "#faf178";
const green = "#84ff69";

//Box pointer variables that default to first box at (0,0)
var pointerX = 0;
var pointerY = 0;

// Stores coords of the last box in the current guess row
var lastBox; 

// Fetch a random solution word from the server
async function getSolutionWord() {
    console.log('getSolutionWord() called');
    try {
        // Fetch data from the server
        const response = await fetch('/api/random-word');
        const data = await response.json();

        solution = data.word;
        console.log(solution);
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


//Wait until document is fully loaded, then create default grid
document.addEventListener("DOMContentLoaded", function() {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 5; j++) {
            // You can set the default letter, color, and coordinates here
            createBox(null, white, j, i);
        }
    }

    //Getting random word from server
    getSolutionWord();

    // Function to get the last box in a row based on current pointerY value
    function getLastBox() {
        return document.querySelector(`.grid-item[data-x="4"][data-y="${pointerY}"]`);
    }

    lastBox = getLastBox();

    //Key listener
    document.addEventListener('keydown', function (event) {
        const key = event.key.toLowerCase();
    
        if (key === 'backspace') {
            changeBoxLetter(pointerX - 1, pointerY, null);
            if (pointerX > 0) pointerX--;
        } else if (key.match(/^[a-z]$/)) {
            //Does not change letter in box if it's the last in the row and if it's already filled
            
            if (pointerX == 4 && lastBox.innerText !== "") return;
            changeBoxLetter(pointerX, pointerY, key.toUpperCase());
            if (pointerX < 5) pointerX++;
        }
    });
});



