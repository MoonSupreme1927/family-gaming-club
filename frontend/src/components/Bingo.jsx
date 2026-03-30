import GameCard from "./GameCard";

const MIN_BET = 1;

function renderCell(cell, onToggleCell) {
  const className = [
    "bingo-cell",
    cell.marked ? "marked" : "",
    cell.free ? "free" : "",
  ]
    .join(" ")
    .trim();

  return (
    <button
      key={cell.id}
      className={className}
      onClick={() => onToggleCell(cell.id)}
      type="button"
    >
      <span className="bingo-cell-letter">{cell.letter}</span>
      <span className="bingo-cell-number">{cell.label}</span>
    </button>
  );
}

export default function Bingo({
  bingoBet,
  setBingoBet,
  bingoBoard,
  bingoDraws,
  bingoResult,
  onGenerateBoard,
  onDrawNumber,
  onToggleCell,
  onClaimWin,
}) {
  return (
    <section className="game-layout">
      <GameCard title="Bingo" className="game-panel">
        <div className="form-stack">
          <label>
            <span className="field-label">Bet Amount</span>
            <input
              className="casino-input"
              type="number"
              min={MIN_BET}
              value={bingoBet}
              onChange={(e) =>
                setBingoBet(Math.max(MIN_BET, Number(e.target.value) || MIN_BET))
              }
            />
          </label>

          <div className="bingo-controls">
            <button className="primary-btn green" onClick={onGenerateBoard}>
              New Board
            </button>
            <button className="primary-btn blue" onClick={onDrawNumber}>
              Draw Number
            </button>
            <button className="primary-btn gold" onClick={onClaimWin}>
              Claim Bingo
            </button>
          </div>

          <div className="result-card">
            <div>Drawn Numbers: {bingoDraws.length ? bingoDraws.join(", ") : "None yet"}</div>
            {bingoResult && <div>{bingoResult}</div>}
          </div>
        </div>
      </GameCard>

      <GameCard title="Bingo Board" className="result-panel">
        {bingoBoard?.length ? (
          <div className="bingo-board">
            {bingoBoard.map((cell) => renderCell(cell, onToggleCell))}
          </div>
        ) : (
          <div className="placeholder-box">Generate a board to start playing.</div>
        )}
      </GameCard>
    </section>
  );
}