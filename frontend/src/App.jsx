import { useEffect, useState } from "react";
import io from "socket.io-client";
import { url } from "./lib/data";
import QRCodeCard from "./components/QRCodeCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io(url);

function App() {
  const [count, setCount] = useState(0);
  const [host, setHost] = useState(false);
  const [isGameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [answerchecked, setAnswerChecked] = useState(false);
  const [status, setStatus] = useState(false);
  const [playerName, setPlayerName] = useState(null);
  const [name, setName] = useState("");
  const [wmessage, setWmessage] = useState("");
  const [people, setPeople] = useState([]);

  function notify() {
    toast("Game Over 🥳");
  }

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    setPlayerName(name); // Store the input value when the form is submitted
  };
  useEffect(() => {
    console.log(status);

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    // Set up event listener
    window.addEventListener("resize", handleResize);
    socket.on("connect", () => {
      console.log(`Connected as ${socket.id}`);
    });

    socket.on(
      "count",
      ({ userCount, gameStatus, question, currentQuestionIndex }) => {
        setCount(userCount);
        setStatus(gameStatus);
        if (gameStatus) {
          setGameStarted(true);
        }
        setCurrentQuestion(question);
        setQuestionIndex(currentQuestionIndex);
      }
    );
    socket.on("userdisc", (userCount) => {
      setCount(userCount);
    });

    // Staring the game 
    socket.on("game_started", ({ hostId, questions }) => {
      setGameStarted(true);
      setHost(socket.id === hostId);
    });

    // When user picks correct answer . broadcasting the event
    socket.on("correct_answer", ({ playerId, playerName, answer }) => {
      setMessage(playerName);

      setPeople((prevPeople) => [...prevPeople, playerName]);
    });

    // Handle incorrect answer notification for this user
    socket.on("wrong_answer", ({ message }) => {
      // setMessage(message);
      setWmessage(message);
    });

    // Reset game if host disconnects
    socket.on("reset_game", () => {
      setGameStarted(false);
      setHost(false);
      setMessage("Host disconnected. The game has been reset.");
    });
    socket.on("question_update", ({ question, currentQuestionIndex }) => {
      setWmessage("");
      setMessage("");
      console.log(currentQuestionIndex, question, currentQuestion);
      setCurrentQuestion(question);
      setQuestionIndex(currentQuestionIndex);
      setAnswerChecked(false);
      setPeople([]);
    });

    //ending the game

    socket.on("game_over", () => {
      notify();

      setTimeout(() => {
        window.location.reload();
      }, 5000);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.off("connect");
      socket.off("count");
      socket.off("game_started");
      socket.off("correct_answer");
      socket.off("wrong_answer");
      socket.off("reset_game");
      socket.off("question_update");
      socket.off("userdisc");
      socket.off("game_over");
    };
  }, []);

  function startGame() {
    socket.emit("start_game");
  }

  function selectOption(option) {
    setAnswerChecked(true);
    socket.emit("answer", { answer: option, questionIndex, playerName });
  }
  function handleNextQuestion() {
    socket.emit("next_question");
  }

  return (
    <div className="bg-gradient-to-b from-purple-900 via-blue-800 to-sky-700 min-h-screen h-full w-screen p-10 flex flex-col md:flex-row">
      {/* <h1>Live Quiz Game</h1>
      <h1>Hello {playerName}</h1>
       */}

      {playerName ? (
        <>
          <div className=" h-fit md:w-1/2">
            <div className="flex fixed top-5 right-5 space-y-2 flex-col z-20">
              <div className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 font-semibold py-1 px-3 rounded-full shadow-md relative ">
                <span>Hi, {playerName}</span>
              </div>
              <div className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 font-semibold py-1 px-3 rounded-full shadow-md relative ">
                {/* Online Status Dot */}
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>

                {/* Badge Text */}
                <span>Online Players:{count}</span>
              </div>
              <ToastContainer position="bottom-center" />
            </div>

            {!isGameStarted ? (
              <div className=" bg-white h-60 shadow-sm rounded-md p-5 flex justify-center items-center flex-col mt-20">
                <span className="text-xl font-mono">
                  {" "}
                  If Your are Clicking the Start game Then you are Host if get
                  disconnected or reloads page the game gets restarted.Then you
                  are not host anymore
                </span>

                <button
                  className="bg-purple-950 border-2 border-yellow-600 p-2 rounded-lg text-yellow-500"
                  onClick={startGame}
                  disabled={host}
                >
                  {host ? "You are the Host" : "Start Game"}
                </button>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-black/90 mb-4 text-center py-10 bg-white/90 px-4 rounded-md m-4 shadow-md md:h-[300px] overflow-auto">
                  {questionIndex + 1}. {currentQuestion?.question}
                </div>
                <div className=" md:grid-cols-2 gap-4  p-5 mt-5 grid">
                  {currentQuestion?.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => selectOption(option)}
                      disabled={answerchecked}
                      className={`bg-blue-950  p-2 rounded-md border-yellow-500 border-2 text-white font-bold px-7 ${
                        answerchecked ? "opacity-50" : ""
                      }`}
                    >
                      {index + 1}. {option}
                    </button>
                  ))}
                </div>

                <br />
                {host && (
                  <div className="mt-8 justify-center flex mb-10">
                    <button
                      onClick={handleNextQuestion}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
                    >
                      Next Question
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            {screenWidth > 800 ? (
              <>
                {host ? <QRCodeCard /> : ""}
                {wmessage && (
                  <div className="bg-white rounded-lg shadow-xl max-w-md p-8 text-center my-10">
                    {/* Confetti or Icon (Optional) */}
                    <div className="text-5xl mb-4">😩</div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Sorry! {wmessage}
                    </h2>

                    {/* Dynamic Message */}

                    <h3 className="text-lg text-gray-600">
                      Incorrect Answer !!!
                    </h3>
                  </div>
                )}

                {message && (
                  <div className="bg-white rounded-lg shadow-xl max-w-md p-8 text-center mt-10">
                    {/* Confetti or Icon (Optional) */}
                    <div className="text-5xl mb-4">🎉</div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Congratulations! {message}
                    </h2>

                    {/* Dynamic Message */}

                    <h3 className="text-lg text-gray-600">
                      Correct Answer !!!
                    </h3>
                  </div>
                )}
              </>
            ) : (
              <>
                {wmessage && (
                  <div className="bg-white rounded-lg shadow-xl max-w-md p-8 text-center mt-10">
                    {/* Confetti or Icon (Optional) */}
                    <div className="text-5xl mb-4">😩</div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Sorry! {wmessage}
                    </h2>

                    {/* Dynamic Message */}

                    <h3 className="text-lg text-gray-600">
                      Incorrect Answer !!!
                    </h3>
                  </div>
                )}
              </>
            )}
            {/* {message && <h3>{message}</h3>} */}
          </div>
          {isGameStarted ? (
            <div className="bg-white rounded-lg shadow-lg  p-10 left-10 md:relative top-5 h-fit">
              {/* Card Title */}
              <h2 className=" font-bold text-gray-800 mb-4 text-center">
                Current Question Winners
              </h2>

              {/* Table of Names */}
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">#</th>
                      <th className="py-3 px-6 text-left">Name</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm font-light">
                    {people.map((person, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gray-100"
                      >
                        <td className="py-3 px-6 text-left">{index + 1}</td>
                        <td className="py-3 px-6 text-left">{person}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            ""
          )}
        </>
      ) : (
        <div className="bg-amber-50 rounded-md md:w-1/4 md:h-1/3 p-10 justify-center flex flex-col items-center space-y-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Label and Input */}
            <div className="flex flex-col">
              <label className="mb-2 text-lg font-semibold text-gray-700">
                Enter Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your name"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
