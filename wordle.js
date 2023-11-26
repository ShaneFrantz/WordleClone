console.log('Wordle.js loaded');

// Fetch a random solution word from the server
async function getSolutionWord() {
    console.log('Function called');
    try {
        // Fetch data from the server
        const response = await fetch('/api/random-word');
        const data = await response.json();

        // Update the displayed word
        const wordDisplay = document.getElementById('wordDisplay');
        wordDisplay.innerText = `${data.word}`;
    } catch (error) {
        console.error('Error fetching random word:', error.message);
    }
}