"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./TicTacToe.module.css";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];

interface Scores {
  xWins: number;
  oWins: number;
  draws: number;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(board: Board): { winner: Player; line: number[] } | null {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: combination };
    }
  }
  return null;
}

function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Player; line: number[] } | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState<Scores>({ xWins: 0, oWins: 0, draws: 0 });
  const [scoresSaved, setScoresSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async () => {
    try {
      const response = await fetch("/api/scores");
      if (!response.ok) throw new Error("Failed to fetch scores");
      const data = await response.json();
      setScores(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load scores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const saveResult = useCallback(
    async (result: "X" | "O" | "draw") => {
      try {
        const response = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result }),
        });
        if (!response.ok) throw new Error("Failed to save score");
        const data = await response.json();
        setScores(data);
        setScoresSaved(true);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Could not save score.");
      }
    },
    []
  );

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || winnerInfo || isDraw) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const result = calculateWinner(newBoard);
      if (result) {
        setWinnerInfo(result);
        if (!scoresSaved) {
          saveResult(result.winner);
        }
      } else if (isBoardFull(newBoard)) {
        setIsDraw(true);
        if (!scoresSaved) {
          saveResult("draw");
        }
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    },
    [board, currentPlayer, winnerInfo, isDraw, scoresSaved, saveResult]
  );

  const handleNewGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinnerInfo(null);
    setIsDraw(false);
    setScoresSaved(false);
  }, []);

  const handleResetScores = useCallback(async () => {
    try {
      const response = await fetch("/api/scores", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to reset scores");
      const data = await response.json();
      setScores(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not reset scores.");
    }
  }, []);

  const getStatusMessage = () => {
    if (winnerInfo) {
      return `Player ${winnerInfo.winner} wins! 🎉`;
    }
    if (isDraw) {
      return "It's a draw! 🤝";
    }
    return `Player ${currentPlayer}'s turn`;
  };

  const isWinningCell = (index: number) =>
    winnerInfo?.line.includes(index) ?? false;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tic Tac Toe</h1>

      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>Player X</span>
          <span className={`${styles.scoreValue} ${styles.scoreX}`}>
            {loading ? "-" : scores.xWins}
          </span>
        </div>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>Draws</span>
          <span className={`${styles.scoreValue} ${styles.scoreDraw}`}>
            {loading ? "-" : scores.draws}
          </span>
        </div>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>Player O</span>
          <span className={`${styles.scoreValue} ${styles.scoreO}`}>
            {loading ? "-" : scores.oWins}
          </span>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Status */}
      <div
        className={`${styles.status} ${
          winnerInfo
            ? winnerInfo.winner === "X"
              ? styles.statusWinnerX
              : styles.statusWinnerO
            : isDraw
            ? styles.statusDraw
            : currentPlayer === "X"
            ? styles.statusX
            : styles.statusO
        }`}
      >
        {getStatusMessage()}
      </div>

      {/* Board */}
      <div className={styles.board}>
        {board.map((cell, index) => (
          <button
            key={index}
            className={`${styles.cell} ${
              cell === "X" ? styles.cellX : cell === "O" ? styles.cellO : ""
            } ${isWinningCell(index) ? styles.cellWinning : ""} ${
              !cell && !winnerInfo && !isDraw ? styles.cellHover : ""
            }`}
            onClick={() => handleCellClick(index)}
            disabled={!!cell || !!winnerInfo || isDraw}
            aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ""}` }
          >
            {cell && (
              <span className={styles.cellMark}>{cell}</span>
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={handleNewGame}>
          New Game
        </button>
        <button className={styles.btnSecondary} onClick={handleResetScores}>
          Reset Scores
        </button>
      </div>

      {/* Current turn indicator */}
      {!winnerInfo && !isDraw && (
        <div className={styles.turnIndicator}>
          <span
            className={`${styles.turnDot} ${
              currentPlayer === "X" ? styles.turnDotX : styles.turnDotO
            }`}
          />
          <span>Player {currentPlayer} is playing</span>
        </div>
      )}
    </div>
  );
}
