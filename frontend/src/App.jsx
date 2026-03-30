import { useEffect, useMemo, useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import Leaderboard from "./components/Leaderboard";
import AdminPanel from "./components/AdminPanel";
import GameCard from "./components/GameCard";
import CoinFlip from "./components/CoinFlip";
import LuckyDice from "./components/LuckyDice";
import PittyPat from "./components/PittyPat";
import Bingo from "./components/Bingo";

const API = "http://localhost:5000";
const TOKEN_KEY = "casino_token";
const MIN_BET = 1;

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [authForm, setAuthForm] = useState({ username: "", password: "" });

  const [currentUser, setCurrentUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [leaderboard, setLeaderboard] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  const [coinBet, setCoinBet] = useState(5);
  const [coinChoice, setCoinChoice] = useState("heads");
  const [coinResult, setCoinResult] = useState(null);

  const [diceBet, setDiceBet] = useState(5);
  const [diceGuess, setDiceGuess] = useState(3);
  const [diceResult, setDiceResult] = useState(null);

  const [pittyBet, setPittyBet] = useState(5);
  const [pittyResult, setPittyResult] = useState(null);

  const [bingoBet, setBingoBet] = useState(5);
  const [bingoBoard, setBingoBoard] = useState([]);
  const [bingoDraws, setBingoDraws] = useState([]);
  const [bingoResult, setBingoResult] = useState("");

  const [chipBursts, setChipBursts] = useState([]);

  const authHeaders = useMemo(() => {
    if (!token) {
      return { "Content-Type": "application/json" };
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchMe();
      fetchLeaderboard();
    }
  }, [token]);

  function showMessage(text) {
    setMessage(text);
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  function triggerChipBurst(count = 12) {
    const burst = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      chips: Array.from({ length: count }, (_, index) => ({
        id: `${index}-${Math.random().toString(36).slice(2, 9)}`,
        left: Math.random() * 80 + 10,
        delay: Math.random() * 0.2,
        rotate: -180 + Math.random() * 360,
      })),
    };

    setChipBursts((prev) => [...prev, burst]);

    setTimeout(() => {
      setChipBursts((prev) => prev.filter((item) => item.id !== burst.id));
    }, 2600);
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  async function fetchMe() {
    try {
      const data = await fetchJson(`${API}/me`, {
        headers: authHeaders,
      });

      setCurrentUser(data.user);
      setBalance(data.user.balance ?? 0);
    } catch (error) {
      console.error("Fetch me error:", error);
      logout();
    }
  }

  async function fetchLeaderboard() {
    try {
      const data = await fetchJson(`${API}/leaderboard`);
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Leaderboard error:", error);
    }
  }

  async function fetchAdminUsers() {
    try {
      const data = await fetchJson(`${API}/admin/users`, {
        headers: authHeaders,
      });
      setAdminUsers(data.users || []);
    } catch (error) {
      console.error("Admin users error:", error);
      alert(error.message);
    }
  }

  async function loginOrRegister() {
    try {
      setLoading(true);

      const data = await fetchJson(`${API}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setBalance(data.user.balance ?? 0);
      setScreen("menu");
      showMessage(data.message || "Welcome!");
    } catch (error) {
      console.error("Auth error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setCurrentUser(null);
    setBalance(0);
    setLeaderboard([]);
    setAdminUsers([]);
    setMessage("");
    setScreen("menu");

    setCoinResult(null);
    setDiceResult(null);
    setPittyResult(null);

    setBingoBoard([]);
    setBingoDraws([]);
    setBingoResult("");
  }

  async function playSimpleGame(game, amount, extraPayload = {}) {
    try {
      const cleanAmount = Math.max(MIN_BET, Number(amount) || MIN_BET);

      const data = await fetchJson(`${API}/game/play`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          game,
          amount: cleanAmount,
          ...extraPayload,
        }),
      });

      setCurrentUser(data.user);
      setBalance(data.user.balance ?? 0);
      fetchLeaderboard();

      if (data.winnings > 0) {
        triggerChipBurst();
        showMessage(`${game}: won $${Number(data.winnings).toFixed(2)}`);
      } else {
        showMessage(`${game}: no win this round`);
      }

      return data;
    } catch (error) {
      console.error(`${game} error:`, error);
      alert(error.message);
      return null;
    }
  }

  async function playCoinFlip() {
    const data = await playSimpleGame("Coin Flip", coinBet, {
      choice: coinChoice,
    });

    if (!data) return;

    setCoinResult({
      choice: data.result?.choice,
      flip: data.result?.flip,
      win: data.result?.win,
      winnings: data.winnings || 0,
    });
  }

  async function playLuckyDice() {
    const data = await playSimpleGame("Lucky Dice", diceBet, {
      guess: Number(diceGuess),
    });

    if (!data) return;

    setDiceResult({
      guess: data.result?.guess,
      roll: data.result?.roll,
      win: data.result?.win,
      winnings: data.winnings || 0,
    });
  }

  async function playPittyPat() {
    try {
      const cleanAmount = Math.max(MIN_BET, Number(pittyBet) || MIN_BET);

      const betData = await fetchJson(`${API}/bet`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          amount: cleanAmount,
          game: "Pitty Pat",
        }),
      });

      const playerCards = Array.from({ length: 5 }, () => randomCard());
      const aiCards = Array.from({ length: 5 }, () => randomCard());

      const playerScore = scoreHand(playerCards);
      const aiScore = scoreHand(aiCards);

      let winnings = 0;

      if (playerScore > aiScore) {
        winnings = cleanAmount * 2;
      } else if (playerScore === aiScore) {
        winnings = cleanAmount;
      }

      let finalUser = betData.user;

      if (winnings > 0) {
        const resultData = await fetchJson(`${API}/result`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            winnings,
            game: "Pitty Pat",
          }),
        });

        finalUser = resultData.user;
      }

      setCurrentUser(finalUser);
      setBalance(finalUser.balance ?? 0);
      setPittyResult({
        playerCards,
        aiCards,
        playerScore,
        aiScore,
        winnings,
      });

      fetchLeaderboard();

      if (winnings > 0) {
        triggerChipBurst();
        showMessage(`Pitty Pat: won $${Number(winnings).toFixed(2)}`);
      } else {
        showMessage("Pitty Pat: lost this round");
      }
    } catch (error) {
      console.error("Pitty Pat error:", error);
      alert(error.message);
    }
  }

  function getRandomNumbers(min, max, count) {
    const nums = [];
    while (nums.length < count) {
      const value = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!nums.includes(value)) {
        nums.push(value);
      }
    }
    return nums;
  }

  function generateBingoBoard() {
    const columns = {
      B: getRandomNumbers(1, 15, 5),
      I: getRandomNumbers(16, 30, 5),
      N: getRandomNumbers(31, 45, 5),
      G: getRandomNumbers(46, 60, 5),
      O: getRandomNumbers(61, 75, 5),
    };

    const board = [];
    const letters = ["B", "I", "N", "G", "O"];

    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const letter = letters[col];
        const value = columns[letter][row];
        const isFree = row === 2 && col === 2;

        board.push({
          id: `${letter}-${row}-${col}`,
          letter,
          value,
          label: isFree ? "FREE" : value,
          marked: isFree,
          free: isFree,
          row,
          col,
        });
      }
    }

    setBingoBoard(board);
    setBingoDraws([]);
    setBingoResult("");
  }

  function drawBingoNumber() {
    const available = Array.from({ length: 75 }, (_, index) => index + 1).filter(
      (num) => !bingoDraws.includes(num)
    );

    if (!available.length) {
      setBingoResult("All numbers have been drawn.");
      return;
    }

    const drawn = available[Math.floor(Math.random() * available.length)];
    setBingoDraws((prev) => [...prev, drawn]);
    setBingoResult(`Last draw: ${drawn}`);
  }

  function toggleBingoCell(cellId) {
    setBingoBoard((prev) =>
      prev.map((cell) =>
        cell.id === cellId && !cell.free
          ? { ...cell, marked: !cell.marked }
          : cell
      )
    );
  }

  function hasBingo(board) {
    const grid = Array.from({ length: 5 }, () => Array(5).fill(false));

    board.forEach((cell) => {
      grid[cell.row][cell.col] = cell.marked;
    });

    for (let row = 0; row < 5; row += 1) {
      if (grid[row].every(Boolean)) return true;
    }

    for (let col = 0; col < 5; col += 1) {
      if (grid.every((row) => row[col])) return true;
    }

    const diagonal1 = [0, 1, 2, 3, 4].every((i) => grid[i][i]);
    const diagonal2 = [0, 1, 2, 3, 4].every((i) => grid[i][4 - i]);

    return diagonal1 || diagonal2;
  }

  async function playBingoWin() {
    try {
      const cleanAmount = Math.max(MIN_BET, Number(bingoBet) || MIN_BET);

      if (!bingoBoard.length) {
        alert("Generate a board first.");
        return;
      }

      if (!hasBingo(bingoBoard)) {
        setBingoResult("No Bingo yet. Keep playing.");
        return;
      }

      const betData = await fetchJson(`${API}/bet`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          amount: cleanAmount,
          game: "Bingo",
        }),
      });

      const winnings = cleanAmount * 3;

      const resultData = await fetchJson(`${API}/result`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          winnings,
          game: "Bingo",
        }),
      });

      const user = resultData.user || betData.user;

      setCurrentUser(user);
      setBalance(user.balance ?? 0);
      setBingoResult(`Bingo! You won $${Number(winnings).toFixed(2)}`);
      triggerChipBurst();
      showMessage(`Bingo: won $${Number(winnings).toFixed(2)}`);
      fetchLeaderboard();
    } catch (error) {
      console.error("Bingo error:", error);
      alert(error.message);
    }
  }

  function randomCard() {
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const suits = ["♠", "♥", "♦", "♣"];

    return {
      rank: ranks[Math.floor(Math.random() * ranks.length)],
      suit: suits[Math.floor(Math.random() * suits.length)],
    };
  }

  function cardValue(rank) {
    if (rank === "A") return 11;
    if (["K", "Q", "J"].includes(rank)) return 10;
    return Number(rank);
  }

  function scoreHand(cards) {
    return cards.reduce((sum, card) => sum + cardValue(card.rank), 0);
  }

  async function updateUserBalance(userId, newBalance) {
    try {
      const data = await fetchJson(`${API}/admin/users/${userId}/balance`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ balance: Number(newBalance) }),
      });

      setAdminUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, balance: data.user.balance } : user
        )
      );

      fetchLeaderboard();

      if (currentUser?.id === userId) {
        setCurrentUser(data.user);
        setBalance(data.user.balance ?? 0);
      }

      showMessage("Balance updated");
    } catch (error) {
      console.error("Balance update error:", error);
      alert(error.message);
    }
  }

  async function updateAdminStatus(userId, isAdmin) {
    try {
      const data = await fetchJson(`${API}/admin/users/${userId}/admin`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ isAdmin }),
      });

      setAdminUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isAdmin: data.user.isAdmin } : user
        )
      );

      fetchLeaderboard();
      showMessage("Admin status updated");
    } catch (error) {
      console.error("Admin status update error:", error);
      alert(error.message);
    }
  }

  function openAdmin() {
    setScreen("admin");
    fetchAdminUsers();
  }

  if (!token || !currentUser) {
    return (
      <div className="casino-app">
        <div className="auth-shell">
          <div className="auth-card">
            <div className="brand-mark">🎰</div>
            <h1>Angie&apos;s Card Casino</h1>
            <p className="auth-subtitle">Login or register to enter the casino.</p>

            <div className="form-stack">
              <input
                className="casino-input"
                placeholder="Username"
                value={authForm.username}
                onChange={(e) =>
                  setAuthForm((prev) => ({ ...prev, username: e.target.value }))
                }
              />
              <input
                className="casino-input"
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <button
                className="primary-btn gold"
                onClick={loginOrRegister}
                disabled={loading}
              >
                {loading ? "Please wait..." : "Enter Casino"}
              </button>
            </div>

            {message && <div className="message-banner success">{message}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="casino-app">
      {chipBursts.map((burst) => (
        <div key={burst.id} className="chip-layer">
          {burst.chips.map((chip) => (
            <div
              key={chip.id}
              className="chip-float"
              style={{
                left: `${chip.left}%`,
                animationDelay: `${chip.delay}s`,
                transform: `rotate(${chip.rotate}deg)`,
              }}
            >
              🪙
            </div>
          ))}
        </div>
      ))}

      <header className="top-header">
        <div>
          <h1 className="site-title">Angie&apos;s Card Casino</h1>
          <p className="site-subtitle">
            Welcome back, <strong>{currentUser.username}</strong>
            {currentUser.isAdmin ? " 👑" : ""}
          </p>
        </div>

        <div className="balance-pill">
          <span>Shared Balance</span>
          <strong>${Number(balance).toFixed(2)}</strong>
        </div>
      </header>

      <Navbar
        screen={screen}
        setScreen={setScreen}
        isAdmin={currentUser.isAdmin}
        onOpenAdmin={openAdmin}
        onLogout={logout}
      />

      {message && <div className="message-banner success">{message}</div>}

      {screen === "menu" && (
        <section className="dashboard-grid">
          <GameCard title="Casino Dashboard" className="hero-panel">
            <div className="stats-grid">
              <div className="stat-card">
                <span>Balance</span>
                <strong>${Number(balance).toFixed(2)}</strong>
              </div>
              <div className="stat-card">
                <span>Games Played</span>
                <strong>{currentUser.gamesPlayed}</strong>
              </div>
              <div className="stat-card">
                <span>Total Wagered</span>
                <strong>${Number(currentUser.totalWagered || 0).toFixed(2)}</strong>
              </div>
              <div className="stat-card">
                <span>Total Won</span>
                <strong>${Number(currentUser.totalWon || 0).toFixed(2)}</strong>
              </div>
            </div>
          </GameCard>

          <GameCard title="Choose a Game">
            <div className="game-tile-grid">
              <button className="game-tile gold" onClick={() => setScreen("pitty")}>
                <span className="game-icon">🃏</span>
                <span>Pitty Pat</span>
              </button>

              <button className="game-tile blue" onClick={() => setScreen("coinflip")}>
                <span className="game-icon">🪙</span>
                <span>Coin Flip</span>
              </button>

              <button className="game-tile purple" onClick={() => setScreen("dice")}>
                <span className="game-icon">🎲</span>
                <span>Lucky Dice</span>
              </button>

              <button className="game-tile green" onClick={() => setScreen("bingo")}>
                <span className="game-icon">🔢</span>
                <span>Bingo</span>
              </button>
            </div>
          </GameCard>
        </section>
      )}

      {screen === "leaderboard" && (
        <Leaderboard leaderboard={leaderboard} onRefresh={fetchLeaderboard} />
      )}

      {screen === "coinflip" && (
        <CoinFlip
          coinBet={coinBet}
          setCoinBet={setCoinBet}
          coinChoice={coinChoice}
          setCoinChoice={setCoinChoice}
          coinResult={coinResult}
          onPlay={playCoinFlip}
        />
      )}

      {screen === "dice" && (
        <LuckyDice
          diceBet={diceBet}
          setDiceBet={setDiceBet}
          diceGuess={diceGuess}
          setDiceGuess={setDiceGuess}
          diceResult={diceResult}
          onPlay={playLuckyDice}
        />
      )}

      {screen === "pitty" && (
        <PittyPat
          pittyBet={pittyBet}
          setPittyBet={setPittyBet}
          pittyResult={pittyResult}
          onPlay={playPittyPat}
        />
      )}

      {screen === "bingo" && (
        <Bingo
          bingoBet={bingoBet}
          setBingoBet={setBingoBet}
          bingoBoard={bingoBoard}
          bingoDraws={bingoDraws}
          bingoResult={bingoResult}
          onGenerateBoard={generateBingoBoard}
          onDrawNumber={drawBingoNumber}
          onToggleCell={toggleBingoCell}
          onClaimWin={playBingoWin}
        />
      )}

      {screen === "admin" && currentUser.isAdmin && (
        <AdminPanel
          adminUsers={adminUsers}
          onRefresh={fetchAdminUsers}
          onBalanceSave={updateUserBalance}
          onToggleAdmin={updateAdminStatus}
        />
      )}
    </div>
  );
}