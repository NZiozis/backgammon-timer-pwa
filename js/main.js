/**
 * This file sources all the game logic for the timer as well as all state information
 */

const MATCH_PARAMETERS_KEY = "matchParameters";
const GAME_STATE_KEY = "gameState";

const TEN_MINUTES_IN_SECONDS = 600;
const TEN_SECONDS = 10;

const PlayerTurn = {
  NEUTRAL: "NEUTRAL",
  PLAYER_ONE: "PLAYER_ONE",
  PLAYER_TWO: "PLAYER_TWO",
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

const matchParameters = {
  playerOneName: "Player One",
  playerTwoName: "Player Two",

  useCube: true,
  useDice: true,
  startType: StartType.ALWAYS_RANDOM,

  totalGameTimeSeconds: TEN_MINUTES_IN_SECONDS, // 10 minutes
  reserveTimeSeconds: TEN_SECONDS,
  scoreLimit: 7
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
  playerOneTotalTimeRemainingSeconds: TEN_MINUTES_IN_SECONDS,
  playerOneReserveTimeRemainingSeconds: TEN_SECONDS,

  playerTwoGames: 0,
  playerTwoScore: 0,
  playerTwoTotalTimeRemainingSeconds: TEN_MINUTES_IN_SECONDS,
  playerTwoReserveTimeRemainingSeconds: TEN_SECONDS,
}

function resetGameState() {
  gameState.currentPlayerTurn = PlayerTurn.NEUTRAL;
  gameState.currentGameValue = 1;
  gameState.cubeOwnership = CubeOwnership.NEUTRAL;

  gameState.playerOneGames = 0;
  gameState.playerOneScore = 0;
  gameState.playerOneTotalTimeRemainingSeconds = matchParameters.totalGameTimeSeconds;
  gameState.playerOneReserveTimeRemainingSeconds = matchParameters.reserveTimeSeconds;

  gameState.playerTwoGames = 0;
  gameState.playerTwoScore = 0;
  gameState.playerTwoTotalTimeRemainingSeconds = matchParameters.totalGameTimeSeconds;
  gameState.playerTwoReserveTimeRemainingSeconds = matchParameters.reserveTimeSeconds;
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

function formatReserveTime(value) {
  const seconds = String(value).padStart(2, "0");
  return `(${seconds})`;
}

function formatTotalTime(secondsNumberValue) {
  const minutes = String(Math.trunc(secondsNumberValue / 60)).padStart(2, "0");
  const seconds = String(secondsNumberValue % 60).padStart(2, "0");

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
      // TODO throw an error
    }
  }
  return currentElement.dataset["playerId"] === "1";
}

function setupUIBasedOnGameState() {
  /**
    * Takes the information present in appState (a globally defined variable) and
    * uses that to update the UI. This is typically only done on page load
    */
  document.getElementById("player_one_score").innerText = gameState.playerOneGames;
  document.getElementById("player_one_games").innerText =
    formatGamesValue(gameState.playerOneGames);
  document.getElementById("player_one_total_time").innerText =
    formatTotalTime(gameState.playerOneTotalTimeRemainingSeconds);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(gameState.playerOneReserveTimeRemainingSeconds);


  document.getElementById("player_two_score").innerText =
    gameState.playerTwoGames;
  document.getElementById("player_two_games").innerText =
    formatGamesValue(gameState.playerTwoGames);
  document.getElementById("player_two_total_time").innerText =
    formatTotalTime(gameState.playerTwoTotalTimeRemainingSeconds);
  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(gameState.playerTwoReserveTimeRemainingSeconds);
}

function setupUIBasedOnMatchParameters() {
  // This relies on the fact that the id of the option and the value of the option being
  // the same
  document.getElementById("player_one_name").innerText = matchParameters.playerOneName;
  document.getElementById("player_one_total_time").innerText =
    formatTotalTime(matchParameters.totalGameTimeSeconds);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(matchParameters.reserveTimeSeconds);

  document.getElementById("player_two_name").innerText = matchParameters.playerTwoName;
  document.getElementById("player_two_total_time").innerText =
    formatTotalTime(matchParameters.totalGameTimeSeconds);
  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(matchParameters.reserveTimeSeconds);
}

function onClickSettings() {
  setupSettingsDialog();

  document.getElementById("settings_dialog").showModal();
}

function setupSidebar() {
  Array.from(document.getElementsByClassName("settings_button")).forEach(function(it) {
    it.onclick = onClickSettings;
  })
}

function setupSettingsDialog() {
  const dialog = document.getElementById("settings_dialog");
  const form = document.getElementById("settings_form");
  const closeButton = document.getElementById("close_settings");
  const saveButton = document.getElementById("save_settings");

  document.getElementById(matchParameters.startType).selected = true;
  document.getElementById("useCube").checked = matchParameters["useCube"]
  document.getElementById("useDice").checked = matchParameters["useDice"]
  document.getElementById("scoreLimit").value = matchParameters["scoreLimit"]
  document.getElementById("playerOneName").value = matchParameters["playerOneName"]
  document.getElementById("playerTwoName").value = matchParameters["playerTwoName"]

  const currentTotalGameTimeSeconds = matchParameters["totalGameTimeSeconds"]
  document.getElementById("formTotalGameTimeMinutes").value = currentTotalGameTimeSeconds / 60;
  document.getElementById("formTotalGameTimeSeconds").value = currentTotalGameTimeSeconds % 60;

  document.getElementById("reserveTimeSeconds").value = matchParameters["reserveTimeSeconds"]

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  saveButton.addEventListener("click", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportVailidity();
      showFeedback("Please fill out all fields in the form", false);
      return;
    }

    let newTotalGameTime = 0;
    for (const element of form.elements) {
      if (element.name && element.type !== "submit" && element.type !== "button") {
        if (element.type === "checkbox") {
          matchParameters[element.name] = element.checked;
        }
        else if (element.name === "formTotalGameTimeMinutes") {
          newTotalGameTime += element.value * 60;
        }
        else if (element.name === "formTotalGameTimeMinutes") {
          newTotalGameTime += element.value;
        } else {
          matchParameters[element.name] = element.value;
        }
      }
    }
    matchParameters["totalGameTimeSeconds"] = newTotalGameTime;

    saveStateToLocalStorage(MATCH_PARAMETERS_KEY, matchParameters);

    resetGameState();
    resetUI();

    dialog.close();
  });
}

function hideAllMainUI() {
  Array.from(document.getElementsByClassName("main_ui")).forEach(function(it) {
    it.style.display = "none";
  });
}

function toggleMainUIToShowForPlayer(showForPlayerOne) {
  Array.from(document.getElementsByClassName("main_ui")).forEach(function(it) {
    const isPlayerOneUI = isPlayerOneUIElement(it);

    if (showForPlayerOne && isPlayerOneUI) {
      it.style.display = "flex";
    } else if (showForPlayerOne && !isPlayerOneUI) {
      it.style.display = "none";
    } else if (!showForPlayerOne && isPlayerOneUI) {
      it.style.display = "none";
    } else if (!showForPlayerOne && !isPlayerOneUI) {
      it.style.display = "flex";
    }
  });
}

function onClickDone(isPlayerOne) {
  // NOTE: This hide step could be technically not necessary if we aren't doing rolling.
  // Revisit if there is a bottleneck
  Array.from(document.getElementsByClassName("roll_action_ui")).forEach(function (it) {
    it.style.display = "none";
  });
  toggleMainUIToShowForPlayer(!isPlayerOne);
}

function onClickDouble(isPlayerOne) {
  // TODO Implement
}

function onClickRoll(isPlayerOne) {
  /** Hide the roll/double, show roll_action_ui **/
  hideAllMainUI();

  Array.from(document.getElementsByClassName("roll_action_ui")).forEach(function (it) {
    const isPlayerOneUI = isPlayerOneUIElement(it);

    if (isPlayerOne && isPlayerOneUI) {
      it.style.display = "flex";
    } else if (isPlayerOne && !isPlayerOneUI) {
      it.style.display = "none";
    } else if (!isPlayerOne && isPlayerOneUI) {
      it.style.display = "none";
    } else if (!isPlayerOne && !isPlayerOneUI) {
      it.style.display = "flex";
    }
  });
}

function onClickStart(didPlayerOneClick) {
  /** Start the game
    * If startType, then it's a coin flip to start
    * Otherwise, the player that clicked the button does first
    **/
  Array.from(document.getElementsByClassName("start_ui")).forEach(function(it) {
    it.style.display = "none";
  });

  let isPlayerOneFirst;
  if (matchParameters.startType === StartType.ALWAYS_RANDOM
      || (matchParameters.startType === StartType.FIRST_GAME_RANDOM
          && isFirstGame()
       )
  ) {
    isPlayerOneFirst = Math.floor(Math.random() * 10) % 2 === 0;
  } else {
    isPlayerOneFirst = didPlayerOneClick;
  }

  toggleMainUIToShowForPlayer(isPlayerOneFirst);
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

  Array.from(document.getElementsByClassName("double_button")).forEach(function(it) {
    it.onclick = () => onClickDouble(isPlayerOneUIElement(it));

    if (!matchParameters.useCube) {
      const newClassList = [...it.classList];
      newClassList.push("default_hidden");
      it.classList = newClassList.join(" ");
    }
  })

  Array.from(document.getElementsByClassName("roll_button")).forEach(function(it) {
    it.onclick = () => onClickRoll(isPlayerOneUIElement(it));

    if (!matchParameters.useDice) {
      const newClassList = [...it.classList];
      newClassList.push("default_hidden");
      it.classList = newClassList.join(" ");
    }
  })

  Array.from(document.getElementsByClassName("done_button")).forEach(function(it) {
    it.onclick = () => onClickDone(isPlayerOneUIElement(it));

    if (!matchParameters.useDice) {
      const newClassList = [...it.classList];
      newClassList.splice(newClassList.findIndex((ele) => ele === "default_hidden", 1));
      it.classList = newClassList.join(" ");
    }
  })
}

function resetUI() {
  setupUIBasedOnMatchParameters();
  setupUIBasedOnGameState();

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
  const savedMatchParameters = loadStateFromLocalStorage(MATCH_PARAMETERS_KEY)
  for (const property in savedMatchParameters) {
    matchParameters[property] = savedMatchParameters[property];
  }
  setupUIBasedOnMatchParameters();

  resetGameState();
  const savedGameState = loadStateFromLocalStorage(GAME_STATE_KEY)
  for (const property in savedGameState) {
    gameState[property] = savedGameState[property];
  }
  setupUIBasedOnGameState();

  setupSidebar();
  setupMainButtons();
});
