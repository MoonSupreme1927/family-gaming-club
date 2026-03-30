export default function Leaderboard({ leaderboard = [], onRefresh }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Leaderboard</h2>
        <button className="secondary-btn" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="table-wrap">
        <table className="casino-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Balance</th>
              <th>Games</th>
              <th>Total Won</th>
              <th>Last Game</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <tr key={`${entry.rank}-${entry.username}`}>
                  <td>{entry.rank}</td>
                  <td>
                    {entry.username}
                    {entry.isAdmin ? " 👑" : ""}
                  </td>
                  <td>${Number(entry.balance || 0).toFixed(2)}</td>
                  <td>{entry.gamesPlayed || 0}</td>
                  <td>${Number(entry.totalWon || 0).toFixed(2)}</td>
                  <td>{entry.lastGame || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No leaderboard data yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}