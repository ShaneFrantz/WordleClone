const express = require('express');
const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');
const { isNativeError } = require('util/types');

const app = express();
const port = 8080;
const uri = "mongodb+srv://sfrantz1:IVor7CLeXuuDHnNl@wordlecluster.s0jn53l.mongodb.net/?retryWrites=true&w=majority";

// Connects to MongoDB
async function connect() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error(error);
    }
}

connect();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handles root path by serving the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

// Schema for words that can actually be solutions in the game
const solutionWordSchema = new mongoose.Schema({
    word: {type: String, required: true}
});

const SolutionWord = mongoose.model('SolutionWord', solutionWordSchema);

// Create a unique index on the 'word' field for SolutionWord
SolutionWord.createIndexes({ word: 1 }, { unique: true });


//Schema for words that the user is allowed to guess
const guessableWordSchema = new mongoose.Schema({
    word: {type: String, required: true}
});

const GuessableWord = mongoose.model('GuessableWord', guessableWordSchema);

// Create a unique index on the 'word' field for GuessableWord
GuessableWord.createIndexes({ word: 1 }, { unique: true });

// Function that reads words from a text file
function readWordsFromFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return fileContent.split('\n').map(word => word.trim());
}

// Inserts words into MongoDB
async function insertWordsFromFile(filePath, model) {
    const words = readWordsFromFile(filePath);

    try {
        // Check if the collection is empty before inserting documents
        const count = await model.countDocuments();

        if (count === 0) {
            await model.insertMany(words.map(word => ({word})), {ordered: false});
            console.log(`Inserted ${words.length} words into ${model.modelName}`);
        } else {
            console.log(`Collection ${model.modelName} exists and is not empty. Skipping insertion.`);
        }
    } catch (error) {
        console.error(`Error inserting words into ${model.modelName}: ${error.message}`);
    }
}

// Insert solution words into MongoDB
const solutionFilePath = path.join(__dirname, 'word_files', 'solutionWords.txt');
insertWordsFromFile(solutionFilePath, SolutionWord);

// Insert guessable words into MongoDB
const guessableFilePath = path.join(__dirname, 'word_files', 'guessableWords.txt');
insertWordsFromFile(guessableFilePath, GuessableWord);

// Start the server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});