import GameCard from "./GameCard";

const MIN_BET = 1;

export default function LuckyDice({
  diceBet,
  setDiceBet,
  diceGuess,
  setDiceGuess,
  diceResult,
  onPlay,
}) {
  return (
    <section className="game-layout">
      <GameCard title="Lucky Dice" className="game-panel">
        <div className="form-stack">
          <label>
            <span className="field-label">Bet Amount</span>
            <input
              className="casino-input"
              type="number"
              min={MIN_BET}
              value={diceBet}
              onChange={(e) =>
                setDiceBet(Math.max(MIN_BET, Number(e.target.value) || MIN_BET))
              }
            />
          </label>

          <label>
            <span className="field-label">Guess the roll</span>
            <input
              className="casino-input"
              type="number"
              min={1}
              max={6}
              value={diceGuess}
              onChange={(e) =>
                setDiceGuess(Math.min(6, Math.max(1, Number(e.target.value) || 1)))
              }
            />
          </label>

          <button className="primary-btn purple" onClick={onPlay}>
            Roll Dice
          </button>
        </div>
      </GameCard>

      <GameCard title="Result" className="result-panel">
        {diceResult ? (
          <div className="result-card">
            <div>Your guess: {diceResult.guess}</div>
            <div>Dice roll: {diceResult.roll}</div>
            <div>{diceResult.win ? "You won!" : "You lost."}</div>
            <div>Winnings: ${Number(diceResult.winnings).toFixed(2)}</div>
          </div>
        ) : (
          <div className="placeholder-box">Play a round to see your result.</div>
        )}
      </GameCard>
    </section>
  );
}