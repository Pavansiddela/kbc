import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
  })
);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let userCount = 0;
let host = null; // To track the host
let currentQuestionIndex = 0;
let questions = [
  {
    question: "Who is known as the 'Megastar' of Telugu cinema?",
    options: ["Chiranjeevi", "Mahesh Babu", "Nagarjuna", "Pawan Kalyan"],
    correct: "Chiranjeevi",
  },
  {
    question: "Which movie marked the debut of director S.S. Rajamouli?",
    options: ["Simhadri", "Eega", "Magadheera", "Student No. 1"],
    correct: "Student No. 1",
  },
  {
    question:
      "Which Telugu film won the National Film Award for Best Feature Film in 2018?",
    options: ["Arjun Reddy", "Mahanati", "Baahubali", "Rangasthalam"],
    correct: "Mahanati",
  },
  {
    question: "Who played the role of Komaram Bheem in the movie 'RRR'?",
    options: ["Jr NTR", "Ram Charan", "Prabhas", "Allu Arjun"],
    correct: "Jr NTR",
  },
  {
    question: "Which of these movies is NOT directed by Trivikram Srinivas?",
    options: [
      "Attarintiki Daredi",
      "Ala Vaikunthapurramuloo",
      "Sye",
      "Agnyaathavaasi",
    ],
    correct: "Sye",
  },
];

app.get("/isstarted", (req, res) => {
  if (host !== null) {
    res.send(true);
  } else {
    res.send(false);
  }
});

io.on("connection", (socket) => {
  userCount++;
  console.log(`User connected: ${socket.id}. Total users: ${userCount}`);

  // Send initial user count to all clients
  io.emit("count", {
    userCount,
    gameStatus: host ? true : false,
    currentQuestionIndex,
    question: questions[currentQuestionIndex],
  });

  // If the host disconnects, reset the host variable
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}.`);
    userCount--;

    // Check if the disconnected user is the host
    if (socket.id === host) {
      console.log("Host disconnected. Resetting game.");
      host = null;
      io.emit("reset_game"); // Notify all users to reset the game
    }
    io.emit("userdisc", userCount);

    // io.emit("count", userCount); // Update user count to all clients

    // Host changing to the next question
  });

  socket.on("next_question", () => {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      io.emit("question_update", {
        currentQuestionIndex,
        question: questions[currentQuestionIndex],
      });
    } else if (
      socket.id === host &&
      currentQuestionIndex === questions.length - 1
    ) {
      // End of game, show leaderboard
      host = null;
      currentQuestionIndex = 0;
      io.emit("game_over");
    }
  });

  socket.on("question_update", ({ question, currentQuestionIndex }) => {
    setCurrentQuestion(question);
    setQuestionIndex(currentQuestionIndex);
  });

  // Handle "start_game" event when a user clicks the "Start Game" button
  socket.on("start_game", () => {
    if (!host) {
      host = socket.id;
      console.log(`User ${socket.id} is now the host.`);
      io.emit("game_started", { hostId: socket.id, questions });
      io.emit("question_update", {
        currentQuestionIndex,
        question: questions[currentQuestionIndex],
      });
      // Notify all users that the game has started
    }
  });

  // Handle answer submission from players
  socket.on("answer", ({ answer, questionIndex, playerName }) => {
    const isCorrect = questions[questionIndex].correct === answer;

    if (isCorrect) {
      console.log(`User ${socket.id} answered correctly.`);
      // Broadcast correct answer to all users with large screen width (e.g., desktops)
      io.emit("correct_answer", {
        playerId: socket.id,
        answer: true,
        playerName,
      });
    } else {
      // console.log(`User ${socket.id} answered incorrectly.`);
      // Send feedback to the specific user only
      io.to(socket.id).emit("wrong_answer", {
        message: playerName,
      });
    }
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
