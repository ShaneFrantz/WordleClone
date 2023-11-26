const express = require('express');
const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');

const app = express();
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

app.listen(8000, () => {
    console.log("Server started on port 8000");
});

// Schema for words that can actually be solutions in the game
const solutionWordSchema = new mongoose.Schema({
    word: {type: String, required: true}
});

const SolutionWord = mongoose.model('SolutionWord', solutionWordSchema);

//Schema for words that the user is allowed to guess
const guessableWordSchema = new mongoose.Schema({
    word: {type: String, required: true}
});

const GuessableWord = mongoose.model('GuessableWord', guessableWordSchema);

