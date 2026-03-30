export default function Navbar({
  screen,
  setScreen,
  isAdmin,
  onOpenAdmin,
  onLogout,
}) {
  function navClass(target, extra = "") {
    return `nav-btn ${screen === target ? "active" : ""} ${extra}`.trim();
  }

  return (
    <nav className="nav-bar">
      <button className={navClass("menu")} onClick={() => setScreen("menu")}>
        Menu
      </button>

      <button
        className={navClass("leaderboard")}
        onClick={() => setScreen("leaderboard")}
      >
        Leaderboard
      </button>

      <button className={navClass("pitty")} onClick={() => setScreen("pitty")}>
        Pitty Pat
      </button>

      <button
        className={navClass("coinflip")}
        onClick={() => setScreen("coinflip")}
      >
        Coin Flip
      </button>

      <button className={navClass("dice")} onClick={() => setScreen("dice")}>
        Lucky Dice
      </button>

      {isAdmin && (
        <button className={navClass("admin", "admin")} onClick={onOpenAdmin}>
          Admin Panel
        </button>
      )}

      <button className="nav-btn danger" onClick={onLogout}>
        Logout
      </button>
    </nav>
  );
}