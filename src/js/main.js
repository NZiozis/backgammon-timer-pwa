/**
 * This file sources all the game logic for the timer as well as all state information
 */

const MATCH_PARAMETERS_KEY = "matchParameters";
const GAME_STATE_KEY = "gameState";

const ONE_SECOND_IN_MS = 1000;
const TEN_MINUTES_IN_MS = 600000;
const TEN_SECONDS_IN_MS = 10000;

const ActionType = {
  START: "START",
  ROLL: "ROLL",
  OFFER_DOUBLE: "OFFER_DOUBLE",
  TAKE_DOUBLE: "TAKE_DOUBLE",
  END_TURN: "END_TURN",
  END_GAME: "END_GAME", // Also functions as double drop
}

class Stack {
  constructor() {
    this.stack = [];
  }

  push(element) {
    this.stack.push(element);
    return element;
  }

  pop() {
    console.assert(this.stack.length > 0, "Must have element in stack to pop");
    return this.stack.pop();
  }

  clear() {
    this.stack = [];
  }

  peek() {
    return this.stack.at(-1);
  }

  len() {
    return this.stack.length;
  }
}

class UndoRedoBuffer {
  constructor() {
    this.undo_stack = new Stack();
    this.redo_stack = new Stack();
  }

  can_undo() {
    return this.undo_stack.len() > 1;
  }

  can_redo() {
    return this.redo_stack.len() > 0;
  }

  add_to_history(element) {
    this.undo_stack.push(element);
    this.redo_stack.clear();
  }

  undo() {
    this.redo_stack.push(this.undo_stack.pop());
    return this.redo_stack.peek();
  }

  redo() {
    this.undo_stack.push(this.redo_stack.pop());
    return this.undo_stack.peek();
  }

  u_peek() {
    return this.undo_stack.peek();
  }

  r_peek() {
    return this.redo_stack.peek();
  }
}

class Action {
  constructor(type, actingPlayer) {
    this.type = type;
    this.actingPlayer = actingPlayer;

    this.playerOneGames = gameState.playerOneGames;
    this.playerOneScore = gameState.playerOneScore;
    this.playerTwoGames = gameState.playerTwoGames;
    this.playerTwoScore = gameState.playerTwoScore;

    this.playerOneTotalTimeRemainingMs = gameState.playerOneTotalTimeRemainingMs;
    this.playerOneReserveTimeRemainingMs = gameState.playerOneReserveTimeRemainingMs;

    this.playerTwoTotalTimeRemainingMs = gameState.playerTwoTotalTimeRemainingMs;
    this.playerTwoReserveTimeRemainingMs = gameState.playerTwoReserveTimeRemainingMs;

    this.currentGameValue = gameState.currentGameValue;
  }
}

class EndGameAction extends Action {
  constructor(actingPlayer, gameValueOverride) {
    // actingPlayer can be null on page load for the starting state
    super(ActionType.END_GAME, actingPlayer);
    if (gameValueOverride !== undefined) {
      this.currentGameValue = gameValueOverride;
    }
  }
}

class RollAction extends Action {
  constructor(actingPlayer, diceOne, diceTwo) {
    super(ActionType.ROLL, actingPlayer);

    this.diceOne = diceOne;
    this.diceTwo = diceTwo;
  }
}

class StartAction extends Action {
  constructor(playerToStart) {
    super(ActionType.START, playerToStart)
    this.playerToStart = playerToStart;
  }
}

class EndTurnAction extends Action {
  constructor(actingPlayer) {
    super(ActionType.END_TURN, actingPlayer);
  }
}

class OfferDoubleAction extends Action {
  constructor(actingPlayer) {
    super(ActionType.OFFER_DOUBLE, actingPlayer);
    this.newGameValue = gameState.currentGameValue * 2;
  }
}

class TakeDoubleAction extends Action {
  constructor(actingPlayer) {
    super(ActionType.TAKE_DOUBLE, actingPlayer);

    this.playerTaking = actingPlayer;
    this.previousGameValue = gameState.currentGameValue;
    this.currentGameValue = gameState.currentGameValue * 2;
  }
}

const PlayerTurn = {
  NEUTRAL: "NEUTRAL",
  PLAYER_ONE: "PLAYER_ONE",
  PLAYER_TWO: "PLAYER_TWO",
}

function getPlayerTurn(isPlayerOne) {
  return isPlayerOne ? PlayerTurn.PLAYER_ONE : PlayerTurn.PLAYER_TWO;
}

const StartType = {
  ALWAYS_RANDOM: "ALWAYS_RANDOM",
  FIRST_GAME_RANDOM: "FIRST_GAME_RANDOM",
  PLAYER_THAT_CLICKS: "PLAYER_THAT_CLICKS",
}

const Theme = {
  ORIGINAL: "ORIGINAL",
  RED_GREEN: "RED_GREEN",
  BLUE: "BLUE",
}

const ThemeToColors = new Map(
  [
    [Theme.ORIGINAL, {
      primary: "#1F2041",
      primary_c: "#417B5A",
      secondary: "#4B3F72",
      secondary_c: "#D0CEBA"
    }],
    [Theme.RED_GREEN, {
      primary: "red",
      primary_c: "#4f4f4f",
      secondary: "green",
      secondary_c: "white"
    }],
    [Theme.BLUE, {
      primary: "#6492e6",
      primary_c: "#386ad5",
      secondary: "#302ea9",
      secondary_c: "white"
    }],
  ]
);

function setDefaultHide(elements, shouldHide) {
  if (shouldHide) {
    elements.forEach(function(it) {
      const newClassList = [...it.classList];
      if (!newClassList.includes("default_hidden")) {
        newClassList.push("default_hidden");
        it.classList = newClassList.join(" ");
      }
    });
  } else {
    elements.forEach(function(it) {
      const newClassList = [...it.classList].filter(item => item !== "default_hidden");
      it.classList = newClassList.join(" ");
    });
  }
}

const matchParameters = {
  theme: Theme.ORIGINAL,

  playerOneName: "Player One",
  playerTwoName: "Player Two",

  useCube: true,
  useDice: true,
  useTimer: true,
  startType: StartType.ALWAYS_RANDOM,

  totalGameTimeMs: TEN_MINUTES_IN_MS,
  reserveTimeMs: TEN_SECONDS_IN_MS,
  scoreLimit: 7
}

const handleMatchParametersChange = {
  set(target, property, value) {
    const playerOneMainUI = document.querySelector("#player_one #main_ui");
    const playerTwoMainUI = document.querySelector("#player_two #main_ui");

    if (property === "theme") {
      const colors = ThemeToColors.get(value);
      const body = document.body;

      body.style.setProperty("--color-primary", colors.primary);
      body.style.setProperty("--color-primary-contrast", colors.primary_c);
      body.style.setProperty("--color-secondary", colors.secondary);
      body.style.setProperty("--color-secondary-contrast", colors.secondary_c);

    } else if (property === "playerOneName") {
      document.getElementById("player_one_name").innerText = value;
    } else if (property === "playerTwoName") {
      document.getElementById("player_two_name").innerText = value;
    } else if (property === "totalGameTimeMs") {
      document.getElementById("player_one_total_time").innerText = formatTotalTime(value);
      document.getElementById("player_two_total_time").innerText = formatTotalTime(value);
    } else if (property === "reserveTimeMs") {
      document.getElementById("player_one_reserve_time").innerText = formatReserveTime(value);
      document.getElementById("player_two_reserve_time").innerText = formatReserveTime(value);
    } else if (property === "scoreLimit") {
      document.getElementById("sidebar_game_info").innerText = `Game to ${value}`;
    } else if (property === "useCube") {
      const doubleButtons = Array.from(document.getElementsByClassName("double_button"));
      const midline = document.getElementById("midline");

      if (value) {
        setDefaultHide([midline], false);
        setDefaultHide(doubleButtons, false);
      } else {
        setDefaultHide([midline], true);
        setDefaultHide(doubleButtons, true);
      }
    } else if (property === "useDice") {
      const rollButtons = Array.from(document.getElementsByClassName("roll_button"));
      const doneMainButtons = Array.from(document.getElementsByClassName("done_main_ui"));
      const doneRollButtons = Array.from(document.getElementsByClassName("done_roll_ui"));

      if (value) {
        setDefaultHide([...rollButtons, ...doneRollButtons], false);
        setDefaultHide(doneMainButtons, true);
      } else {
        setDefaultHide([...rollButtons, ...doneRollButtons], true);
        setDefaultHide(doneMainButtons, false);
      }
    } else if (property === "useTimer") {
      const timerContainers = Array.from(document.getElementsByClassName("player_time_container"));
      const infinityContainers = Array.from(document.getElementsByClassName("player_infinity"));
      if (value) {
        setDefaultHide(infinityContainers, true);
        setDefaultHide(timerContainers, false);
      } else {
        setDefaultHide(infinityContainers, false);
        setDefaultHide(timerContainers, true);
      }
    } else if (property === "startType") {
      // NOTHING TO BE DONE. JUST ACCOUNTED FOR
    } else {
      console.warn(`Failed to account for match parameter ${property}`);
    }


    return Reflect.set(target, property, value);
  }
}

const observedMatchParameters = new Proxy(matchParameters, handleMatchParametersChange);

function resetMatchParameters() {
  observedMatchParameters.playerOneName= "Player One";
  observedMatchParameters.playerTwoName= "Player Two";

  observedMatchParameters.useCube= true;
  observedMatchParameters.useDice= true;
  observedMatchParameters.useTimer = true;
  observedMatchParameters.startType= StartType.ALWAYS_RANDOM;

  observedMatchParameters.totalGameTimeMs= TEN_MINUTES_IN_MS;
  observedMatchParameters.reserveTimeMs= TEN_SECONDS_IN_MS;
  observedMatchParameters.scoreLimit= 7;
}

const gameState = {
  /**
  * This isn't the source of truth for this information, but a place to recover
  * from on page load.
  *
  * This stores game information in case of a page refresh. There will be a button
  * to start a new game. Page refreshes can be caused accidentally, which we want
  * to avoid.
  */
  currentAction: null, // Set to STARTING_ACTION after initialization to prevent circular references

  currentGameValue: 1, // Increaeses if doubling cube is used

  playerOneGames: 0,
  playerOneScore: 0,
  playerOneTotalTimeRemainingMs: TEN_MINUTES_IN_MS,
  playerOneReserveTimeRemainingMs: TEN_SECONDS_IN_MS,
  playerOneTimeoutId: null,

  playerTwoGames: 0,
  playerTwoScore: 0,
  playerTwoTotalTimeRemainingMs: TEN_MINUTES_IN_MS,
  playerTwoReserveTimeRemainingMs: TEN_SECONDS_IN_MS,
  playerTwoTimeoutId: null,

  forceStopTimer: true, // This makes sure that tick fully stops on a reset. Since the tick is handled by setTimeout, there is a chance that it will run over and ignore a gameState reset if this isn't set. This is toggled to false on game start and is set to true when a function like resetGameState is called
  isPaused: false,
}
const STARTING_ACTION = new EndGameAction(null);
gameState.currentAction = STARTING_ACTION;
const UNDO_REDO_BUFFER = new UndoRedoBuffer();
UNDO_REDO_BUFFER.add_to_history(STARTING_ACTION);

function hideUIElements(elements) {
  elements.forEach((element) => {
    element.style.display = "none";
  });
}

const handleGameStateChange = {
  set(target, property, value) {
    const playerOneMainUI = document.querySelector("#player_one #main_ui");
    const playerOneRollUI = document.querySelector("#player_one #roll_action_ui");
    const playerOneDoubleUI = document.querySelector("#player_one #double_action_ui");
    const playerOneStartUI = document.querySelector("#player_one #start_ui");
    const playerOneUndoButton = document.querySelector("#player_one_sidebar_buttons .undo_button");
    const playerOneRedoButton = document.querySelector("#player_one_sidebar_buttons .redo_button");

    const playerTwoMainUI = document.querySelector("#player_two #main_ui");
    const playerTwoRollUI = document.querySelector("#player_two #roll_action_ui");
    const playerTwoDoubleUI = document.querySelector("#player_two #double_action_ui");
    const playerTwoStartUI = document.querySelector("#player_two #start_ui");
    const playerTwoUndoButton = document.querySelector("#player_two_sidebar_buttons .undo_button");
    const playerTwoRedoButton = document.querySelector("#player_two_sidebar_buttons .redo_button");

    const midline = document.getElementById("midline");
    const doublingCube = document.getElementById("doubling_cube");
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;

    playerOneUndoButton.dataset.disabled = !UNDO_REDO_BUFFER.can_undo();
    playerTwoUndoButton.dataset.disabled = !UNDO_REDO_BUFFER.can_undo();
    playerOneRedoButton.dataset.disabled = !UNDO_REDO_BUFFER.can_redo();
    playerTwoRedoButton.dataset.disabled = !UNDO_REDO_BUFFER.can_redo();

    if (property === "currentAction") {
      const elementsToHide = [];

      switch (value.type) {
        case ActionType.START:
          elementsToHide.push(playerOneRollUI, playerOneDoubleUI, playerOneStartUI, playerTwoRollUI, playerTwoDoubleUI, playerTwoStartUI);

          if (value.playerToStart === PlayerTurn.PLAYER_ONE) {
            playerOneMainUI.style.display = "flex";
            elementsToHide.push(playerTwoMainUI);
          } else if (value.playerToStart === PlayerTurn.PLAYER_TWO) {
            playerTwoMainUI.style.display = "flex";
            elementsToHide.push(playerOneMainUI);
          }

          hideUIElements(elementsToHide);
          if (!observedGameState.isPaused) {
            observedGameState.forceStopTimer = false;
            setupTimerForPlayer(value.playerToStart === PlayerTurn.PLAYER_ONE);
          }
          break;
        case ActionType.ROLL:
          elementsToHide.push(playerOneMainUI, playerOneDoubleUI, playerOneStartUI, playerTwoMainUI, playerTwoDoubleUI, playerTwoStartUI);

          if (value.actingPlayer === PlayerTurn.PLAYER_ONE) {
            playerOneRollUI.style.display = "flex";
            elementsToHide.push(playerTwoRollUI);

            document.querySelector("#player_one #dice_one_span").innerText = value.diceOne;
            document.querySelector("#player_one #dice_two_span").innerText = value.diceTwo;
          } else if (value.actingPlayer === PlayerTurn.PLAYER_TWO) {
            playerTwoRollUI.style.display = "flex";
            elementsToHide.push(playerOneRollUI);

            document.querySelector("#player_two #dice_one_span").innerText = value.diceOne;
            document.querySelector("#player_two #dice_two_span").innerText = value.diceTwo;
          }
          hideUIElements(elementsToHide);
          break;
        case ActionType.END_TURN:
          elementsToHide.push(playerOneRollUI, playerOneDoubleUI, playerOneStartUI, playerTwoRollUI, playerTwoDoubleUI, playerTwoStartUI);

          if (value.actingPlayer === PlayerTurn.PLAYER_ONE) {
            playerTwoMainUI.style.display = "flex";
            elementsToHide.push(playerOneMainUI);
          } else if (value.actingPlayer === PlayerTurn.PLAYER_TWO) {
            playerOneMainUI.style.display = "flex";
            elementsToHide.push(playerTwoMainUI);
          }
          hideUIElements(elementsToHide);
          if (!observedGameState.isPaused) {
            setupTimerForPlayer(value.actingPlayer !== PlayerTurn.PLAYER_ONE);
          }
          break;

        case ActionType.OFFER_DOUBLE:
          elementsToHide.push(playerOneRollUI, playerOneMainUI, playerOneStartUI, playerTwoRollUI, playerTwoMainUI, playerTwoStartUI, document.getElementById("doubling_cube"));
          const isPlayerOneOffering = value.actingPlayer === PlayerTurn.PLAYER_ONE;

          if (isPlayerOneOffering) {
            playerTwoDoubleUI.style.display = "flex";
            playerTwoDoubleUI.querySelector("#offered_cube").innerText = value.newGameValue;
            elementsToHide.push(playerOneDoubleUI);
          } else {
            playerOneDoubleUI.style.display = "flex";
            playerOneDoubleUI.querySelector("#offered_cube").innerText = value.newGameValue;
            elementsToHide.push(playerTwoDoubleUI);
          }

          hideUIElements(elementsToHide);
          if (!observedGameState.isPaused) {
            setupTimerForPlayer(!isPlayerOneOffering);
          }
          break;
        case ActionType.TAKE_DOUBLE:
          const isPlayerOneTaking = value.playerTaking === PlayerTurn.PLAYER_ONE;
          observedGameState.currentGameValue = value.currentGameValue;
          elementsToHide.push(playerOneRollUI, playerOneDoubleUI, playerOneStartUI, playerTwoRollUI, playerTwoDoubleUI, playerTwoStartUI);

          if (isPlayerOneTaking) {
            playerOneMainUI.querySelector(".double_button").style.display = "block";

            playerTwoMainUI.style.display = "flex";
            playerTwoMainUI.querySelector(".double_button").style.display = "none";
            elementsToHide.push(playerOneMainUI);

            if (isLandscape) {
              doublingCube.style.transform = "rotate(90deg)";
              midline.style.alignItems = "start";
            } else {
              doublingCube.style.transform = "rotate(180deg)";
              midline.style.justifyContent = "start";
            }
          } else if (value.playerTaking === PlayerTurn.PLAYER_TWO) {
            playerOneMainUI.style.display = "flex";
            elementsToHide.push(playerTwoMainUI);

            playerOneMainUI.querySelector(".double_button").style.display = "none";

            playerTwoMainUI.querySelector(".double_button").style.display = "block";

            if (isLandscape) {
              doublingCube.style.transform = "rotate(-90deg)";
              midline.style.alignItems = "end";
            } else {
              doublingCube.style.transform = "rotate(0deg)";
              midline.style.justifyContent = "end";
            }

          }

          document.getElementById("doubling_cube").style.display = "flex";
          hideUIElements(elementsToHide);

          if (!observedGameState.isPaused) {
            setupTimerForPlayer(!isPlayerOneTaking);
          }
          break;

        case ActionType.END_GAME:
          playerOneStartUI.style.display = "flex";
          playerTwoStartUI.style.display = "flex";

          hideUIElements([playerOneRollUI, playerOneDoubleUI, playerOneMainUI, playerTwoRollUI, playerTwoDoubleUI, playerTwoMainUI]);

          if (isLandscape) {
            doublingCube.style.transform = "rotate(0deg)";
            midline.style.alignItems = "center";
          } else {
            doublingCube.style.transform = "rotate(90deg)";
            midline.style.justifyContent = "center";
          }

          if (value.actingPlayer !== null) {
            const didPlayerOneWin = value.actingPlayer ===
              PlayerTurn.PLAYER_TWO;
            handlePlayerWin(didPlayerOneWin, value.currentGameValue);
          }
          break;

        default:
          console.log("Either leak via lack of break or action type not handled")
          break;
      }
    } else if (property === "forceStopTimer" && value === true) {
      clearTimeout(target.playerTwoTimeoutId);
      target.playerTwoTimeoutId = null;
      clearTimeout(target.playerOneTimeoutId);
      target.playerOneTimeoutId = null;
    } else if (property === "currentGameValue") {
      const doublingCube = document.getElementById("doubling_cube");
      doublingCube.innerText = value === 1 ? "64" : value;
    } else if (property === "playerOneScore") {
      document.getElementById("player_one_score").innerText = value;
      if (value >= observedMatchParameters.scoreLimit) {
        showAlert(
          `${observedMatchParameters.playerOneName} wins`,
          `${observedMatchParameters.playerOneName} won the game to ${observedMatchParameters.scoreLimit}`,
          true,
          () => {fullReset();},
          true,
          undefined,
        )
      }
    } else if (property === "playerOneGames") {
      document.getElementById("player_one_games").innerText = formatGamesValue(value);
    } else if (property === "playerTwoScore") {
      document.getElementById("player_two_score").innerText = value;
      if (value >= observedMatchParameters.scoreLimit) {
        showAlert(
          `${observedMatchParameters.playerTwoName} wins`,
          `${observedMatchParameters.playerTwoName} won the game to ${observedMatchParameters.scoreLimit}`,
          false,
          () => {fullReset();},
          true,
          undefined,
        )
      }
    } else if (property === "playerTwoGames") {
      document.getElementById("player_two_games").innerText = formatGamesValue(value);
    } else if (property  === "playerOneReserveTimeRemainingMs") {
      document.getElementById("player_one_reserve_time").innerText =
        formatReserveTime(value);
    } else if (property  === "playerTwoReserveTimeRemainingMs") {
      document.getElementById("player_two_reserve_time").innerText =
        formatReserveTime(value);
    } else if (property === "playerOneTotalTimeRemainingMs") {
      document.getElementById("player_one_total_time").innerText =
        formatTotalTime(value);
    } else if (property === "playerTwoTotalTimeRemainingMs") {
      document.getElementById("player_two_total_time").innerText =
        formatTotalTime(value);
    }

    return Reflect.set(target, property, value);
  }
}

const observedGameState = new Proxy(gameState, handleGameStateChange);

function resetGameState() {
  observedGameState.forceStopTimer = true;
  observedGameState.currentAction = STARTING_ACTION;

  observedGameState.currentGameValue = 1;

  observedGameState.playerOneGames = 0;
  observedGameState.playerOneScore = 0;
  observedGameState.playerOneTotalTimeRemainingMs = observedMatchParameters.totalGameTimeMs;
  observedGameState.playerOneReserveTimeRemainingMs = observedMatchParameters.reserveTimeMs;

  observedGameState.playerTwoGames = 0;
  observedGameState.playerTwoScore = 0;
  observedGameState.playerTwoTotalTimeRemainingMs = observedMatchParameters.totalGameTimeMs;
  observedGameState.playerTwoReserveTimeRemainingMs = observedMatchParameters.reserveTimeMs;
}

function pauseGame() {
  observedGameState.forceStopTimer = true;
  observedGameState.isPaused = true;

  Array.from(document.getElementsByClassName("play_button")).forEach(function(it) {
    it.style.display = "block";
  })
  Array.from(document.getElementsByClassName("pause_button")).forEach(function(it) {
    it.style.display = "none";
  })

  document.getElementById("unclickable_overlay").style.display = "block";
}

function resumeGame() {
  observedGameState.forceStopTimer = false;
  observedGameState.isPaused = false;
  Array.from(document.getElementsByClassName("play_button")).forEach(function(it) {
    it.style.display = "none";
  })
  Array.from(document.getElementsByClassName("pause_button")).forEach(function(it) {
    it.style.display = "block";
  })

  document.getElementById("unclickable_overlay").style.display = "none";

  if (observedGameState.currentAction.type === ActionType.END_TURN) {
    /* Since the actingPlayer just ended their turn, setup the timer for the
      * other player */
    setupTimerForPlayer(observedGameState.currentAction.actingPlayer !== PlayerTurn.PLAYER_ONE);
  } else if (observedGameState.currentAction.type !== ActionType.END_GAME) {
    setupTimerForPlayer(observedGameState.currentAction.actingPlayer === PlayerTurn.PLAYER_ONE);
  }
}

function loadStateFromLocalStorage(key) {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Error loading state from local storage:", error);
    return undefined;
  }
}

function saveStateToLocalStorage(key, state) {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error("Error saving state to local storage:", error);
  }
}

function formatGamesValue(value) {
  return `(${value})`;
}

function formatReserveTime(msNumberValue) {
  const seconds = String(msNumberValue / 1000).padStart(2, "0");
  return `(${seconds})`;
}

function formatTotalTime(msNumberValue) {
  const minutes = String(Math.trunc(msNumberValue / 60000)).padStart(2, "0");
  const seconds = String(msNumberValue % 60000 / 1000).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function isFirstGame() {
  return gameState.playerOneScore === 0 && gameState.playerTwoScore === 0;
}

function isPlayerOneUIElement(element) {
  /** Traverses the DOM tree in reverse until we find if the element clicked on belongs
    * to player one. Throws an error if the playerId dataset property is never found
    **/
  let currentElement = element;
  while (!currentElement.dataset.hasOwnProperty("playerId")) {
    currentElement = currentElement.parentElement;
    if (currentElement === null) {
      console.error("Unable to find which player clicked");
    }
  }
  return currentElement.dataset["playerId"] === "1";
}

function onClickConcede(isPlayerOne) {
  setupConcedeDialog(isPlayerOne);

  document.getElementById("concede_dialog").showModal();
}

function onClickSettings() {
  setupSettingsDialog();

  document.getElementById("settings_dialog").showModal();
}

function showAlert(title, content, showToPlayerOne, onClickOk, hideClose, onClickClose) {
  const alertDialog = document.getElementById("alert_dialog");

  document.getElementById("alert_title").innerText = title;
  document.getElementById("alert_content").innerText = content;

  if (showToPlayerOne) {
    alertDialog.style.transform = "rotate(180deg)";
  }

  const abortController = new AbortController();
  const signal = abortController.signal;

  const closeButton = document.getElementById("close_alert");
  if (hideClose) {
    closeButton.style.display = "none";
  } else {
    closeButton.style.display = "block";
    closeButton.addEventListener("click", (event) => {
      alertDialog.close();
      onClickClose();
    }, {signal});
  }

  document.getElementById("ok_alert").addEventListener("click", (event) => {
    alertDialog.close();
    onClickOk();
  }, {signal});

  alertDialog.addEventListener("close", () => {
    alertDialog.style.transform = "rotate(0deg)";
    abortController.abort();
  }, { once: true } );

  alertDialog.showModal();
}

function alertToAcceptConcede(isPlayerOneConceding, points) {
  const name = isPlayerOneConceding ? observedMatchParameters.playerOneName : observedMatchParameters.playerTwoName;

  showAlert(
    `Accept ${points} points?`,
    `${name} is offering to concede the game with ${points} points. Do you accept?`,
    !isPlayerOneConceding,
    () => {
      const endGameAction = new EndGameAction(getPlayerTurn(isPlayerOneConceding), points);
      UNDO_REDO_BUFFER.add_to_history(endGameAction);
      observedGameState.currentAction = endGameAction;
      document.getElementById("concede_dialog").close();
    },
    false,
    () => {document.getElementById("concede_dialog").close();},
  )
}

function setupSidebar() {
  Array.from(document.getElementsByClassName("concede_button")).forEach(function(it) {
    it.onclick = () => onClickConcede(isPlayerOneUIElement(it));
  })

  Array.from(document.getElementsByClassName("settings_button")).forEach(function(it) {
    it.onclick = onClickSettings;
  })

  Array.from(document.getElementsByClassName("play_button")).forEach(function(it) {
    it.onclick = resumeGame;
  })

  Array.from(document.getElementsByClassName("pause_button")).forEach(function(it) {
    it.onclick = pauseGame;
  })
  Array.from(document.getElementsByClassName("undo_button")).forEach(function(it) {
    it.onclick = onClickUndo;
  })
  Array.from(document.getElementsByClassName("redo_button")).forEach(function(it) {
    it.onclick = onClickRedo;
  })
}

function setupConcedeDialog(isPlayerOneConceding) {
  const dialog = document.getElementById("concede_dialog");

  if (isPlayerOneConceding) {
    dialog.style.transform = "rotate(180deg)";
  }

  const abortController = new AbortController();
  const signal = abortController.signal;

  const concedeOneMatchButton = document.getElementById("concede_one_match");
  concedeOneMatchButton.innerText = `Concede ${gameState.currentGameValue}`;
  concedeOneMatchButton.addEventListener("click", (event) => {
    alertToAcceptConcede(isPlayerOneConceding, gameState.currentGameValue);
  }, {signal});

  const concedeTwoMatchButton = document.getElementById("concede_two_match");
  concedeTwoMatchButton.innerText = `Concede ${gameState.currentGameValue * 2}`;
  concedeTwoMatchButton.addEventListener("click", (event) => {
    alertToAcceptConcede(isPlayerOneConceding, gameState.currentGameValue * 2);
  }, {signal});

  const concedeThreeMatchButton = document.getElementById("concede_three_match");
  concedeThreeMatchButton.innerText = `Concede ${gameState.currentGameValue * 3}`;
  concedeThreeMatchButton.addEventListener("click", (event) => {
    alertToAcceptConcede(isPlayerOneConceding, gameState.currentGameValue * 3);
  }, {signal});

  const concedeGameButton = document.getElementById("concede_game");
  concedeGameButton.addEventListener("click", (event) => {
    handlePlayerWin(!isPlayerOneConceding, 1, true);
    dialog.close();
  }, {signal});

  document.getElementById("close_concede").addEventListener("click", (event) => {
    dialog.close();
  }, {signal});

  dialog.addEventListener("close", () => {
    dialog.style.transform = "rotate(0deg)";
    abortController.abort();
  }, { once: true } );
}

function setupSettingsDialog() {
  const dialog = document.getElementById("settings_dialog");
  const form = document.getElementById("settings_form");
  const closeButton = document.getElementById("close_settings");
  const saveButton = document.getElementById("save_settings");

  document.getElementById(observedMatchParameters.theme).selected = true;
  document.getElementById(observedMatchParameters.startType).selected = true;
  document.getElementById("useCube").checked = observedMatchParameters["useCube"]
  document.getElementById("useDice").checked = observedMatchParameters["useDice"]
  document.getElementById("useTimer").checked = observedMatchParameters["useTimer"]
  document.getElementById("scoreLimit").value = observedMatchParameters["scoreLimit"]
  document.getElementById("playerOneName").value = observedMatchParameters["playerOneName"]
  document.getElementById("playerTwoName").value = observedMatchParameters["playerTwoName"]

  const currentTotalGameTimeMs = observedMatchParameters["totalGameTimeMs"]
  document.getElementById("formTotalGameTimeMinutes").value = Math.floor(currentTotalGameTimeMs / 60000);
  document.getElementById("formTotalGameTimeSeconds").value = currentTotalGameTimeMs % 60000 / 1000;

  document.getElementById("formReserveTimeSeconds").value = observedMatchParameters["reserveTimeMs"] / 1000;

  const abortController = new AbortController();
  const signal = abortController.signal;

  closeButton.addEventListener("click", () => {
    dialog.close();
  }, {signal});

  saveButton.addEventListener("click", (event) => {
    showAlert(
      "Change settings?",
      "Changing the settings will reset the game. Are you sure you want to change?",
      false,
      () => {
        event.preventDefault();

        if (!form.checkValidity()) {
          form.reportVailidity();
          showFeedback("Please fill out all fields in the form", false);
          return;
        }

        let newTotalGameTimeSeconds = 0;
        for (const element of form.elements) {
          if (element.name && element.type !== "submit" && element.type !== "button") {
            if (element.type === "checkbox") {
              observedMatchParameters[element.name] = element.checked;
            }
            else if (element.name === "formTotalGameTimeMinutes") {
              newTotalGameTimeSeconds += (+element.value) * 60;
            }
            else if (element.name === "formTotalGameTimeSeconds") {
              newTotalGameTimeSeconds += (+element.value);
            } else if (element.name === "formReserveTimeSeconds") {
              observedMatchParameters.reserveTimeMs = (+element.value) * 1000;
            } else if (element.name === "scoreLimit") {
              observedMatchParameters["scoreLimit"] = (+element.value);
            } else {
              observedMatchParameters[element.name] = element.value;
            }
          }
        }
        observedMatchParameters["totalGameTimeMs"] = newTotalGameTimeSeconds * 1000;

        saveStateToLocalStorage(MATCH_PARAMETERS_KEY, observedMatchParameters);

        fullReset();

        dialog.close();
      },
      false,
      () => {dialog.close();}
    );
  }, {signal});

  dialog.addEventListener("close", () => {
    abortController.abort();
  }, { once: true } );
}

function setGenericGameStateBasedOnAction(action) {
  observedGameState.playerOneTotalTimeRemainingMs = action.playerOneTotalTimeRemainingMs;
  observedGameState.playerTwoTotalTimeRemainingMs = action.playerTwoTotalTimeRemainingMs;
  observedGameState.playerOneReserveTimeRemainingMs = action.playerOneReserveTimeRemainingMs;
  observedGameState.playerTwoReserveTimeRemainingMs = action.playerTwoReserveTimeRemainingMs;
  observedGameState.playerOneGames = action.playerOneGames;
  observedGameState.playerOneScore = action.playerOneScore;
  observedGameState.playerTwoGames = action.playerTwoGames;
  observedGameState.playerTwoScore = action.playerTwoScore;
  observedGameState.currentGameValue = action.currentGameValue;
  observedGameState.currentAction = action;
}

function onClickRedo() {
  if (!UNDO_REDO_BUFFER.can_redo()) {
    console.log("Tried to redo with no actions left");
    return;
  }
  pauseGame();

  const action = UNDO_REDO_BUFFER.redo();
  setGenericGameStateBasedOnAction(action);
}

function onClickUndo() {
  if (!UNDO_REDO_BUFFER.can_undo()) {
    console.log("Tried to undo with no actions left");
    return;
  }
  pauseGame();

  UNDO_REDO_BUFFER.undo();
  setGenericGameStateBasedOnAction(UNDO_REDO_BUFFER.u_peek());
}

function onClickDone(isPlayerOne) {
  const endTurnAction = new EndTurnAction(getPlayerTurn(isPlayerOne));
  UNDO_REDO_BUFFER.add_to_history(endTurnAction);
  observedGameState.currentAction = endTurnAction;
}

function onClickDouble(isPlayerOne) {
  const offerDoubleAction = new OfferDoubleAction(getPlayerTurn(isPlayerOne))
  UNDO_REDO_BUFFER.add_to_history(offerDoubleAction);
  observedGameState.currentAction = offerDoubleAction;
}

function onClickDoubleTake(isPlayerOne) {
  const takeDoubleAction = new TakeDoubleAction(getPlayerTurn(isPlayerOne))
  UNDO_REDO_BUFFER.add_to_history(takeDoubleAction);
  observedGameState.currentAction = takeDoubleAction;
}

function onClickDoubleDrop(isPlayerOne) {
  const endGameAction = new EndGameAction(getPlayerTurn(isPlayerOne))
  UNDO_REDO_BUFFER.add_to_history(endGameAction);
  observedGameState.currentAction = endGameAction;
}

function onClickRoll(isPlayerOne) {
  /** Hide the roll/double, show roll_action_ui **/
  let dice_one = Math.floor(Math.random() * 6) + 1;
  let dice_two = Math.floor(Math.random() * 6) + 1;

  const rollAction = new RollAction(getPlayerTurn(isPlayerOne), dice_one, dice_two)
  observedGameState.currentAction = rollAction;
  UNDO_REDO_BUFFER.add_to_history(rollAction);
}

function onClickStart(didPlayerOneClick) {
  /** Start the game
    * If startType, then it's a coin flip to start
    * Otherwise, the player that clicked the button does first
    **/
  let isPlayerOneFirst;
  if (observedMatchParameters.startType === StartType.ALWAYS_RANDOM
      || (observedMatchParameters.startType === StartType.FIRST_GAME_RANDOM
          && isFirstGame()
       )
  ) {
    isPlayerOneFirst = Math.floor(Math.random() * 10) % 2 === 0;
  } else {
    isPlayerOneFirst = didPlayerOneClick;
  }

  let playerToStart = getPlayerTurn(isPlayerOneFirst);
  const startAction = new StartAction(playerToStart)
  observedGameState.currentAction = startAction;
  UNDO_REDO_BUFFER.add_to_history(startAction);
}

function setupMainButtons() {
  /**
    * The idea is to setup the right defaults (aka classes) on the buttons so that hiding
    * and showning the sections has the desired results.
    *
    * NOTE: Show done_button in place of roll_button is not using dice. Classes are changed
    * here so that later revealing/hiding of main_ui section has the correct results.
    */
  Array.from(document.getElementsByClassName("start_button")).forEach(function(it) {
    it.onclick = () => onClickStart(isPlayerOneUIElement(it));
  })

  Array.from(document.getElementsByClassName("double_drop_button")).forEach(function(it) {
    it.onclick = () => onClickDoubleDrop(isPlayerOneUIElement(it));
  })

  Array.from(document.getElementsByClassName("double_take_button")).forEach(function(it) {
    it.onclick = () => onClickDoubleTake(isPlayerOneUIElement(it));
  })

  Array.from(document.getElementsByClassName("double_button")).forEach(function(it) {
    it.onclick = () => onClickDouble(isPlayerOneUIElement(it));
  })

  Array.from(document.getElementsByClassName("roll_button")).forEach(function(it) {
    it.onclick = () => onClickRoll(isPlayerOneUIElement(it));
  })

  Array.from(document.getElementsByClassName("done_button")).forEach(function(it) {
    it.onclick = () => onClickDone(isPlayerOneUIElement(it));
  })
}

function setupTimerForPlayer(isPlayerOne) {
  /** Starts the timer for the specified player
    *
    */
  if (!observedMatchParameters.useTimer) {
    return;
  }

  let expected;

  function tick() {
    if (gameState.forceStopTimer) {
      return;
    }
    if (isPlayerOne) {
      if (gameState.playerOneReserveTimeRemainingMs > 0) {
        observedGameState.playerOneReserveTimeRemainingMs -= ONE_SECOND_IN_MS;
      } else {
        observedGameState.playerOneTotalTimeRemainingMs -= ONE_SECOND_IN_MS;
        if (gameState.playerOneTotalTimeRemainingMs <= 0) {
          handlePlayerWin(false /* didPlayerOneWin */, 1, true);
        }
      }
    } else {
      if (gameState.playerTwoReserveTimeRemainingMs > 0) {
        observedGameState.playerTwoReserveTimeRemainingMs -= ONE_SECOND_IN_MS;
      } else {
        observedGameState.playerTwoTotalTimeRemainingMs -= ONE_SECOND_IN_MS;
        if (gameState.playerTwoTotalTimeRemainingMs <= 0) {
          handlePlayerWin(true /* didPlayerOneWin */, 1, true);
        }
      }
    }

    const now = Date.now();
    const drift = now - expected;
    expected += ONE_SECOND_IN_MS;
    const timeoutId = setTimeout(tick, Math.max(0, ONE_SECOND_IN_MS - drift));
    if (isPlayerOne) {
      observedGameState.playerOneTimeoutId = timeoutId;
    } else {
      observedGameState.playerTwoTimeoutId = timeoutId;
    }
  }

  expected = Date.now() + ONE_SECOND_IN_MS;
  const timeoutId = setTimeout(tick, ONE_SECOND_IN_MS);
  if (isPlayerOne) {
    observedGameState.playerOneTimeoutId = timeoutId;
    clearTimeout(gameState.playerTwoTimeoutId);
    observedGameState.playerTwoTimeoutId = null;
    observedGameState.playerTwoReserveTimeRemainingMs = observedMatchParameters.reserveTimeMs;
  } else {
    observedGameState.playerTwoTimeoutId = timeoutId;
    clearTimeout(gameState.playerOneTimeoutId);
    observedGameState.playerOneTimeoutId = null;
    observedGameState.playerOneReserveTimeRemainingMs = observedMatchParameters.reserveTimeMs;
  }
}

function handlePlayerWin(didPlayerOneWin, points, forceGameWin=false) {
  /** Updates the state for a player win and resets the UI for a new game
    *
    * @multiplier  If the player wins a gammon or backgammon, this modifies
    *              the gameState.currentGameValue when updating the player score
    */

  const score = points;

  if (didPlayerOneWin) {
    observedGameState.playerOneGames += 1;
    observedGameState.playerOneScore += score;
    if (forceGameWin) {
      observedGameState.playerOneScore += (+observedMatchParameters.scoreLimit);
      return;
    }
  } else {
    observedGameState.playerTwoGames += 1;
    observedGameState.playerTwoScore += score;
    if (forceGameWin) {
      observedGameState.playerTwoScore += (+observedMatchParameters.scoreLimit);
      return;
    }
  }

  observedGameState.currentGameValue = 1;

  document.getElementById("doubling_cube").style.display = "flex";

  clearTimeout(gameState.playerTwoTimeoutId);
  observedGameState.playerTwoTimeoutId = null;
  clearTimeout(gameState.playerOneTimeoutId);
  observedGameState.playerOneTimeoutId = null;

  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(observedMatchParameters.reserveTimeMs);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(observedMatchParameters.reserveTimeMs);

  Array.from(document.getElementsByClassName("main_ui")).forEach(function(it) {
    it.style.display = "none";

    // NOTE: This resets the UI if doubling action was taken the last game
    it.querySelector(".double_button").style.display = "block";
  });
  Array.from(document.getElementsByClassName("roll_action_ui")).forEach(function(it) {
    it.style.display = "none";
  });
  Array.from(document.getElementsByClassName("double_action_ui")).forEach(function(it) {
    it.style.display = "none";
  });
  Array.from(document.getElementsByClassName("start_ui")).forEach(function(it) {
    it.style.display = "flex";
  });
}

function fullReset() {
  resetGameState();
  resetUI();
}

function resetUI() {

  Array.from(document.getElementsByClassName("main_ui")).forEach(function(it) {
    it.style.display = "none";
  });
  Array.from(document.getElementsByClassName("roll_action_ui")).forEach(function(it) {
    it.style.display = "none";
  });
  Array.from(document.getElementsByClassName("double_action_ui")).forEach(function(it) {
    it.style.display = "none";
  });
  Array.from(document.getElementsByClassName("start_ui")).forEach(function(it) {
    it.style.display = "flex";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  resetMatchParameters();
  const savedMatchParameters = loadStateFromLocalStorage(MATCH_PARAMETERS_KEY)
  for (const property in savedMatchParameters) {
    observedMatchParameters[property] = savedMatchParameters[property];
  }

  resetGameState();
  const savedGameState = loadStateFromLocalStorage(GAME_STATE_KEY)
  for (const property in savedGameState) {
    observedGameState[property] = savedGameState[property];
  }

  setupSidebar();
  setupMainButtons();
});
