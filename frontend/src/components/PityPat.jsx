import GameCard from "./GameCard";

const MIN_BET = 1;

export default function PittyPat({
  pittyBet,
  setPittyBet,
  pittyResult,
  onPlay,
}) {
  return (
    <section className="game-layout">
      <GameCard title="Pitty Pat" className="game-panel">
        <div className="form-stack">
          <label>
            <span className="field-label">Bet Amount</span>
            <input
              className="casino-input"
              type="number"
              min={MIN_BET}
              value={pittyBet}
              onChange={(e) =>
                setPittyBet(Math.max(MIN_BET, Number(e.target.value) || MIN_BET))
              }
            />
          </label>

          <button className="primary-btn gold" onClick={onPlay}>
            Deal Round
          </button>
        </div>
      </GameCard>

      <GameCard title="Table" className="result-panel">
        {pittyResult ? (
          <>
            <div className="card-row">
              <div className="hand-title">Your Hand</div>
              <div className="playing-cards">
                {pittyResult.playerCards.map((card, index) => (
                  <div
                    key={`${card.rank}-${card.suit}-${index}`}
                    className="playing-card"
                  >
                    <span>{card.rank}</span>
                    <span>{card.suit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-row">
              <div className="hand-title">AI Hand</div>
              <div className="playing-cards">
                {pittyResult.aiCards.map((card, index) => (
                  <div
                    key={`${card.rank}-${card.suit}-${index}`}
                    className="playing-card ai"
                  >
                    <span>{card.rank}</span>
                    <span>{card.suit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="result-card">
              <div>Your score: {pittyResult.playerScore}</div>
              <div>AI score: {pittyResult.aiScore}</div>
              <div>Winnings: ${Number(pittyResult.winnings).toFixed(2)}</div>
            </div>
          </>
        ) : (
          <div className="placeholder-box">Deal a round to see the table.</div>
        )}
      </GameCard>
    </section>
  );
}