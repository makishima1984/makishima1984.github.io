/* Disc-flipping prototype rules. Board indices run left-to-right, top-to-bottom.
 * Original implementation; no third-party code or runtime dependencies.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.GameCore = api;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var directions = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1],
    [0, 1], [1, -1], [1, 0], [1, 1]
  ];

  function initialReversi() {
    var board = Array(64).fill(0);
    board[27] = board[36] = 2;
    board[28] = board[35] = 1;
    return {
      board: board, turn: 1, status: 'playing', winner: null,
      lastMove: null, pass: null
    };
  }

  function flipsFor(board, index, player) {
    if (!Array.isArray(board) || board.length !== 64 ||
        !Number.isInteger(index) || index < 0 || index > 63 ||
        (player !== 1 && player !== 2) || board[index] !== 0) return [];
    var row = Math.floor(index / 8);
    var column = index % 8;
    var opponent = 3 - player;
    var flips = [];
    directions.forEach(function (direction) {
      var r = row + direction[0];
      var c = column + direction[1];
      var line = [];
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        var value = board[r * 8 + c];
        if (value === opponent) {
          line.push(r * 8 + c);
        } else {
          if (value === player && line.length > 0) {
            flips = flips.concat(line);
          }
          break;
        }
        r += direction[0];
        c += direction[1];
      }
    });
    return flips;
  }

  function movesFor(board, player) {
    var moves = [];
    for (var index = 0; index < 64; index += 1) {
      if (flipsFor(board, index, player).length > 0) moves.push(index);
    }
    return moves;
  }

  function legalMoves(state) {
    if (!state || state.status !== 'playing') return [];
    return movesFor(state.board, state.turn);
  }

  function scoreReversi(state) {
    var score = { black: 0, white: 0, empty: 0 };
    state.board.forEach(function (cell) {
      if (cell === 1) score.black += 1;
      else if (cell === 2) score.white += 1;
      else if (cell === 0) score.empty += 1;
    });
    return score;
  }

  function playReversi(state, index) {
    if (!state || state.status !== 'playing') return null;
    var flips = flipsFor(state.board, index, state.turn);
    if (flips.length === 0) return null;
    var board = state.board.slice();
    var player = state.turn;
    var opponent = 3 - player;
    board[index] = player;
    flips.forEach(function (flipped) { board[flipped] = player; });
    var next = {
      board: board, turn: opponent, status: 'playing', winner: null,
      lastMove: index, pass: null
    };
    if (movesFor(board, opponent).length > 0) return next;
    if (movesFor(board, player).length > 0) {
      next.turn = player;
      next.pass = opponent;
      return next;
    }
    next.status = 'finished';
    var score = scoreReversi(next);
    next.winner = score.black === score.white ? 0 : (score.black > score.white ? 1 : 2);
    return next;
  }

  return {
    initialReversi: initialReversi,
    legalMoves: legalMoves,
    flipsFor: flipsFor,
    playReversi: playReversi,
    scoreReversi: scoreReversi
  };
}));
