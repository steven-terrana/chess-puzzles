# Overview

Our goal is to create a website that we can run locally that will allow users to complete chess puzzles.

## Implementation

The puzzles can be found at this URL: https://raw.githubusercontent.com/denialromeo/4462-chess-problems/refs/heads/master/problems.json

the JSON file contains a list of problems in the `problems` key.

each problem is defined by the fields:

- `problemid`: the unique id of the problem
- `fen`: the FEN of the board
- `moves`: the moves of the puzzle
- `first`: which color should go first (white or black)


## UI

The UI should be an interactive chessboard that displays the `fen` of the board of the first problem.

It should allow the user to iterate through the problems in order of the `problemid`.

The user should be able to make moves on the board which should be checked against the `moves` for the current puzzle.

If the user makes a move that is not the correct move for the puzzle, the UI should provide feedback to the user (e.g. red highlighting on the piece)

## Implementation

this site will only need to run locally for my own use.
let's make it as simple as possible by using a nextjs application that can read the problems.json file locally and display the site.

let's use ShadCN components for the UI. 