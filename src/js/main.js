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
  DROP_DOUBLE: "DROP_DOUBLE",
  TAKE_DOUBLE: "TAKE_DOUBLE",
  END_TURN: "END_TURN",
}

class Queue {
  constructor() {
    this.queue = [];
  }

  enqueue(element) {
    this.queue.push(element);
    return element;
  }

  dequeue() {
    return this.queue.shift();
  }

  front() {
    return this.queue.at(-1);
  }
}

let UNDO_QUEUE = new Queue();
let REDO_QUEUE = new Queue();

class Action {
  constructor(type) {
    this.type = type;
    this.player_turn = gameState.currentPlayerTurn;

    this.player_one_total_time_remaining_ms = gameState.playerOneTotalTimeRemainingMs;
    this.player_one_reserve_time_remaining_ms = gameState.playerOneReserveTimeRemainingMs;

    this.player_two_total_time_remaining_ms = gameState.playerTwoTotalTimeRemainingMs;
    this.player_two_reserve_time_remaining_ms = gameState.playerTwoReserveTimeRemainingMs;
  }
}

class RollAction extends Action {
  constructor(dice_one, dice_two) {
    super(ActionType.ROLL);

    this.dice_one = dice_one;
    this.dice_two = dice_two;
  }
}

class StartAction extends Action {
  constructor(player_to_start) {
    super(ActionType.START)
    this.player_to_start = player_to_start;
  }
}

class EndTurnAction extends Action {
  constructor() {
    super(ActionType.END_TURN);
  }
}

class OfferDoubleAction extends Action {
  constructor() {
    super(ActionType.OFFER_DOUBLE);

    this.current_game_value = gameState.currentGameValue;
    this.new_game_value = gameState.currentGameValue * 2;
  }
}

class DropDoubleAction extends Action {
  constructor(player_dropping) {
    super(ActionType.DROP_DOUBLE);

    this.player_dropping = player_dropping;
    this.forfeited_game_value = gameState.currentGameValue;
  }
}

class TakeDoubleAction extends Action {
  constructor(player_taking) {
    super(ActionType.TAKE_DOUBLE);

    this.player_taking = player_taking;
    this.previous_game_value = gameState.currentGameValue;
    this.current_game_value = gameState.currentGameValue * 2;
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

const CubeOwnership = {
  NEUTRAL: "NEUTRAL",
  PLAYER_ONE: "PLAYER_ONE",
  PLAYER_TWO: "PLAYER_TWO",
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
  currentPlayerTurn: PlayerTurn.NEUTRAL,
  currentGameValue: 1, // Increaeses if doubling cube is used
  cubeOwnership: CubeOwnership.NEUTRAL,

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
}
const handleGameStateChange = {
  set(target, property, value) {
    const playerOneMainUI = document.querySelector("#player_one #main_ui");
    const playerTwoMainUI = document.querySelector("#player_two #main_ui");

    if (property === "forceStopTimer" && value === true) {
      clearTimeout(target.playerTwoTimeoutId);
      target.playerTwoTimeoutId = null;
      clearTimeout(target.playerOneTimeoutId);
      target.playerOneTimeoutId = null;
    } else if (property === "currentPlayerTurn") {
      const previousWasNeutral = gameState.currentPlayerTurn === PlayerTurn.NEUTRAL;

      if (value === PlayerTurn.PLAYER_ONE) {
        playerOneMainUI.style.display = "flex";
        playerTwoMainUI.style.display = "none";
        if (!previousWasNeutral) {
          document.querySelector("#player_two #roll_action_ui").style.display = "none";
        }
      } else if (value === PlayerTurn.PLAYER_TWO) {
        playerOneMainUI.style.display = "none";
        playerTwoMainUI.style.display = "flex";

        if (!previousWasNeutral) {
          document.querySelector("#player_one #roll_action_ui").style.display = "none";
        }
      }
    } else if (property === "cubeOwnership") {
      const midline = document.getElementById("midline");
      const doublingCube = document.getElementById("doubling_cube");
      if (window.matchMedia("(orientation: landscape)").matches) {
        switch (value) {
          case CubeOwnership.NEUTRAL:
            doublingCube.style.transform = "rotate(0deg)";
            midline.style.alignItems = "center";
            break;
          case CubeOwnership.PLAYER_ONE:
            doublingCube.style.transform = "rotate(90deg)";
            midline.style.alignItems = "start";
            break;
          case CubeOwnership.PLAYER_TWO:
            doublingCube.style.transform = "rotate(-90deg)";
            midline.style.alignItems = "end";
            break;
        }
      } else {
        switch (value) {
          case CubeOwnership.NEUTRAL:
            doublingCube.style.transform = "rotate(90deg)";
            midline.style.justifyContent = "center";
            break;
          case CubeOwnership.PLAYER_ONE:
            doublingCube.style.transform = "rotate(180deg)";
            midline.style.justifyContent = "start";
            break;
          case CubeOwnership.PLAYER_TWO:
            doublingCube.style.transform = "rotate(0deg)";
            midline.style.justifyContent = "end";
            break;
        }
      }

      if (value !== CubeOwnership.NEUTRAL) {
        switch (target.currentPlayerTurn) {
          case PlayerTurn.PLAYER_ONE:
            playerOneMainUI.style.display = "flex";
            playerOneMainUI.querySelector(".double_button").style.display = "none";
            playerTwoMainUI.querySelector(".double_button").style.display = "block";
            document.querySelector("#player_two #double_action_ui").style.display = "none";
            break;
          case PlayerTurn.PLAYER_TWO:
            playerTwoMainUI.style.display = "flex";
            playerOneMainUI.querySelector(".double_button").style.display = "block";
            playerTwoMainUI.querySelector(".double_button").style.display = "none";
            document.querySelector("#player_one #double_action_ui").style.display = "none";
            break
          case PlayerTurn.NEUTRAL:
            console.error("Turn cannot be neutral if cube ownership is not neutral")
            break
        }
      }

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

  observedGameState.currentPlayerTurn = PlayerTurn.NEUTRAL;
  observedGameState.currentGameValue = 1;
  observedGameState.cubeOwnership = CubeOwnership.NEUTRAL;

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
  Array.from(document.getElementsByClassName("play_button")).forEach(function(it) {
    it.style.display = "none";
  })
  Array.from(document.getElementsByClassName("pause_button")).forEach(function(it) {
    it.style.display = "block";
  })

  document.getElementById("unclickable_overlay").style.display = "none";

  if (gameState.currentPlayerTurn !== PlayerTurn.NEUTRAL) {
    setupTimerForPlayer(gameState.currentPlayerTurn === PlayerTurn.PLAYER_ONE);
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

function togglePlayerTurn() {
  console.assert(gameState.currentPlayerTurn !== PlayerTurn.NEUTRAL,
    "Trying to toggle player turn when no player active");

  if (gameState.currentPlayerTurn === PlayerTurn.PLAYER_ONE) {
    observedGameState.currentPlayerTurn = PlayerTurn.PLAYER_TWO;
  } else {
    observedGameState.currentPlayerTurn = PlayerTurn.PLAYER_ONE;
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
      handlePlayerWin(!isPlayerOneConceding, points);
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
    alertToAcceptConcede(isPlayerOneConceding, 1);
  }, {signal});

  const concedeTwoMatchButton = document.getElementById("concede_two_match");
  concedeTwoMatchButton.innerText = `Concede ${gameState.currentGameValue * 2}`;
  concedeTwoMatchButton.addEventListener("click", (event) => {
    alertToAcceptConcede(isPlayerOneConceding, 2);
  }, {signal});

  const concedeThreeMatchButton = document.getElementById("concede_three_match");
  concedeThreeMatchButton.innerText = `Concede ${gameState.currentGameValue * 3}`;
  concedeThreeMatchButton.addEventListener("click", (event) => {
    alertToAcceptConcede(isPlayerOneConceding, 3);
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

function onClickDone(isPlayerOne) {
  UNDO_QUEUE.enqueue(new EndTurnAction());

  togglePlayerTurn();
  setupTimerForPlayer(!isPlayerOne);
}

function onClickDouble(isPlayerOne) {
  UNDO_QUEUE.enqueue(new OfferDoubleAction());

  const offeringPlayerUI = isPlayerOne ? document.getElementById("player_one") :
      document.getElementById("player_two");
  const decidingPlayerUI = isPlayerOne ? document.getElementById("player_two") :
      document.getElementById("player_one")

  offeringPlayerUI.querySelector("#main_ui").style.display = "none";

  decidingPlayerUI.querySelector("#double_action_ui").style.display = "flex";
  decidingPlayerUI.querySelector("#offered_cube").innerText = gameState.currentGameValue * 2;

  document.getElementById("doubling_cube").style.display = "none";
  setupTimerForPlayer(!isPlayerOne);
}

function onClickDoubleTake(isPlayerOne) {
  UNDO_QUEUE.enqueue(new TakeDoubleAction(getPlayerTurn(isPlayerOne)));

  observedGameState.currentGameValue = gameState.currentGameValue * 2;
  observedGameState.cubeOwnership = isPlayerOne ? CubeOwnership.PLAYER_ONE : CubeOwnership.PLAYER_TWO;

  document.getElementById("doubling_cube").style.display = "flex";
  setupTimerForPlayer(!isPlayerOne);
}

function onClickDoubleDrop(isPlayerOne) {
  UNDO_QUEUE.enqueue(new DropDoubleAction(getPlayerTurn(isPlayerOne)));

  handlePlayerWin(!isPlayerOne);
}

function onClickRoll(isPlayerOne) {
  /** Hide the roll/double, show roll_action_ui **/
  let dice_one = Math.floor(Math.random() * 6) + 1;
  let dice_two = Math.floor(Math.random() * 6) + 1;

  UNDO_QUEUE.enqueue(new RollAction(dice_one, dice_two));

  const playerUI = isPlayerOne ? document.getElementById("player_one") :
     document.getElementById("player_two");

  playerUI.querySelector("#main_ui").style.display = "none";

  playerUI.querySelector("#roll_action_ui").style.display = "flex";

  playerUI.querySelector("#dice_one_span").innerText = dice_one;
  playerUI.querySelector("#dice_two_span").innerText = dice_two;
}

function onClickStart(didPlayerOneClick) {
  /** Start the game
    * If startType, then it's a coin flip to start
    * Otherwise, the player that clicked the button does first
    **/
  observedGameState.forceStopTimer = false;

  Array.from(document.getElementsByClassName("start_ui")).forEach(function(it) {
    it.style.display = "none";
  });

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
  UNDO_QUEUE.enqueue(new StartAction(playerToStart));

  observedGameState.currentPlayerTurn = playerToStart;
  setupTimerForPlayer(isPlayerOneFirst);
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

function handlePlayerWin(didPlayerOneWin, multiplier=1, forceGameWin=false) {
  /** Updates the state for a player win and resets the UI for a new game
    *
    * @multiplier  If the player wins a gammon or backgammon, this modifies
    *              the gameState.currentGameValue when updating the player score
    */

  const score = gameState.currentGameValue * multiplier

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
  observedGameState.cubeOwnership = CubeOwnership.NEUTRAL;
  observedGameState.currentPlayerTurn = PlayerTurn.NEUTRAL;

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
