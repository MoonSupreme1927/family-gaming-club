import { useEffect, useState } from "react";

function AdminRow({ user, onBalanceSave, onToggleAdmin }) {
  const [draftBalance, setDraftBalance] = useState(user.balance ?? 0);

  useEffect(() => {
    setDraftBalance(user.balance ?? 0);
  }, [user.balance]);

  return (
    <tr>
      <td>{user.username}</td>
      <td>${Number(user.balance || 0).toFixed(2)}</td>
      <td>{user.gamesPlayed || 0}</td>
      <td>{user.isAdmin ? "Yes" : "No"}</td>
      <td>
        <div className="admin-balance-cell">
          <input
            className="casino-input admin-balance-input"
            type="number"
            value={draftBalance}
            onChange={(e) => setDraftBalance(Number(e.target.value) || 0)}
          />
          <button
            className="secondary-btn small"
            onClick={() => onBalanceSave(user._id, draftBalance)}
          >
            Save
          </button>
        </div>
      </td>
      <td>
        <button
          className={`secondary-btn small ${
            user.isAdmin ? "dangerish" : "successish"
          }`}
          onClick={() => onToggleAdmin(user._id, !user.isAdmin)}
        >
          {user.isAdmin ? "Remove Admin" : "Make Admin"}
        </button>
      </td>
    </tr>
  );
}

export default function AdminPanel({
  adminUsers = [],
  onRefresh,
  onBalanceSave,
  onToggleAdmin,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Admin Panel</h2>
        <button className="secondary-btn" onClick={onRefresh}>
          Refresh Users
        </button>
      </div>

      <div className="table-wrap">
        <table className="casino-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Balance</th>
              <th>Games</th>
              <th>Admin</th>
              <th>Set Balance</th>
              <th>Toggle Admin</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.length > 0 ? (
              adminUsers.map((user) => (
                <AdminRow
                  key={user._id}
                  user={user}
                  onBalanceSave={onBalanceSave}
                  onToggleAdmin={onToggleAdmin}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}