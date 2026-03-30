import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// ═══════════════════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════════════════

mongoose
  .connect("mongodb://127.0.0.1:27017/casino")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 1000,
      min: 0,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    totalWagered: {
      type: Number,
      default: 0,
    },
    totalWon: {
      type: Number,
      default: 0,
    },
    lastGame: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function sanitizeUser(user) {
  return {
    id: user._id,
    username: user.username,
    balance: user.balance,
    isAdmin: user.isAdmin,
    gamesPlayed: user.gamesPlayed,
    totalWagered: user.totalWagered,
    totalWon: user.totalWon,
    lastGame: user.lastGame,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      isAdmin: user.isAdmin,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function adminRequired(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function normalizeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

// ═══════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════

app.get("/", (req, res) => {
  res.json({ message: "Casino backend is running" });
});

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════

// Combined auth:
// - Creates user if not found
// - Logs in user if found
app.post("/auth", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      return res.status(400).json({
        error: "Username must be at least 3 characters long",
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        error: "Password must be at least 4 characters long",
      });
    }

    let user = await User.findOne({ username: trimmedUsername });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        username: trimmedUsername,
        password: hashedPassword,
        balance: 1000,
        isAdmin: trimmedUsername.toLowerCase() === "admin",
      });

      const token = createToken(user);

      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: sanitizeUser(user),
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return res.status(500).json({
      error: "Server error during authentication",
    });
  }
});

app.get("/me", authRequired, async (req, res) => {
  return res.json({
    user: sanitizeUser(req.user),
  });
});

// ═══════════════════════════════════════════════════════════
// USER / BALANCE
// ═══════════════════════════════════════════════════════════

app.get("/balance", authRequired, async (req, res) => {
  return res.json({
    username: req.user.username,
    balance: req.user.balance,
  });
});

app.put("/balance", authRequired, async (req, res) => {
  try {
    const balance = normalizeAmount(req.body.balance);

    if (balance === null || balance < 0) {
      return res.status(400).json({
        error: "Balance must be a number greater than or equal to 0",
      });
    }

    req.user.balance = balance;
    await req.user.save();

    return res.json({
      message: "Balance updated successfully",
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error("SET BALANCE ERROR:", error);
    return res.status(500).json({ error: "Server error updating balance" });
  }
});

// ═══════════════════════════════════════════════════════════
// GAME / BET ROUTES
// ═══════════════════════════════════════════════════════════

app.post("/bet", authRequired, async (req, res) => {
  try {
    const amount = normalizeAmount(req.body.amount);
    const game = typeof req.body.game === "string" ? req.body.game.trim() : "Unknown";

    if (amount === null || amount <= 0) {
      return res.status(400).json({
        error: "Bet amount must be greater than 0",
      });
    }

    if (req.user.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    req.user.balance -= amount;
    req.user.gamesPlayed += 1;
    req.user.totalWagered += amount;
    req.user.lastGame = game;

    await req.user.save();

    return res.json({
      message: "Bet placed successfully",
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error("BET ERROR:", error);
    return res.status(500).json({ error: "Server error placing bet" });
  }
});

app.post("/result", authRequired, async (req, res) => {
  try {
    const winnings = normalizeAmount(req.body.winnings);
    const game = typeof req.body.game === "string" ? req.body.game.trim() : "Unknown";

    if (winnings === null || winnings < 0) {
      return res.status(400).json({
        error: "Winnings cannot be negative",
      });
    }

    req.user.balance += winnings;
    req.user.totalWon += winnings;
    req.user.lastGame = game;

    await req.user.save();

    return res.json({
      message: "Winnings added successfully",
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error("RESULT ERROR:", error);
    return res.status(500).json({ error: "Server error updating result" });
  }
});

// One-call play endpoint for simple games
app.post("/game/play", authRequired, async (req, res) => {
  try {
    const { game } = req.body;
    const amount = normalizeAmount(req.body.amount);

    if (!game || typeof game !== "string") {
      return res.status(400).json({ error: "Game name is required" });
    }

    if (amount === null || amount <= 0) {
      return res.status(400).json({ error: "Valid bet amount is required" });
    }

    if (req.user.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    req.user.balance -= amount;
    req.user.gamesPlayed += 1;
    req.user.totalWagered += amount;
    req.user.lastGame = game;

    let winnings = 0;
    let result = {};

    switch (game) {
      case "Coin Flip": {
        const choice = req.body.choice === "tails" ? "tails" : "heads";
        const flip = Math.random() < 0.5 ? "heads" : "tails";
        const win = flip === choice;
        winnings = win ? amount * 2 : 0;
        result = { choice, flip, win };
        break;
      }

      case "Lucky Dice": {
        const guess = Number(req.body.guess);
        const roll = Math.floor(Math.random() * 6) + 1;
        const win = guess === roll;
        winnings = win ? amount * 5 : 0;
        result = { guess, roll, win };
        break;
      }

      default:
        return res.status(400).json({ error: "Unsupported game" });
    }

    req.user.balance += winnings;
    req.user.totalWon += winnings;

    await req.user.save();

    return res.json({
      message: "Game resolved",
      game,
      winnings,
      result,
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error("GAME PLAY ERROR:", error);
    return res.status(500).json({ error: "Server error playing game" });
  }
});

// ═══════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════

app.get("/leaderboard", async (req, res) => {
  try {
    const leaders = await User.find({}, { password: 0 })
      .sort({ balance: -1, totalWon: -1, username: 1 })
      .limit(10);

    return res.json({
      leaderboard: leaders.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        balance: user.balance,
        gamesPlayed: user.gamesPlayed,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon,
        lastGame: user.lastGame,
        isAdmin: user.isAdmin,
      })),
    });
  } catch (error) {
    console.error("LEADERBOARD ERROR:", error);
    return res.status(500).json({ error: "Server error fetching leaderboard" });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════

app.get("/admin/users", authRequired, adminRequired, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error) {
    console.error("ADMIN USERS ERROR:", error);
    return res.status(500).json({ error: "Server error fetching users" });
  }
});

app.put("/admin/users/:id/balance", authRequired, adminRequired, async (req, res) => {
  try {
    const balance = normalizeAmount(req.body.balance);

    if (balance === null || balance < 0) {
      return res.status(400).json({
        error: "Balance must be a number greater than or equal to 0",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.balance = balance;
    await user.save();

    return res.json({
      message: "User balance updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("ADMIN SET BALANCE ERROR:", error);
    return res.status(500).json({ error: "Server error updating user balance" });
  }
});

app.put("/admin/users/:id/admin", authRequired, adminRequired, async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (typeof isAdmin !== "boolean") {
      return res.status(400).json({ error: "isAdmin must be true or false" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isAdmin = isAdmin;
    await user.save();

    return res.json({
      message: "User admin status updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("ADMIN STATUS ERROR:", error);
    return res.status(500).json({ error: "Server error updating admin status" });
  }
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});