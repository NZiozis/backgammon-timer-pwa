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

const matchParameters = {
  playerOneName: "Player One",
  playerTwoName: "Player Two",

  useCube: true,
  useDice: true,
  useRandomPlayerStart: true, // 3 values: Always, First game, Never

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

function setupUIBasedOnState(state) {
  /**
    * Takes the information present in appState (a globally defined variable) and
    * uses that to update the UI. This is typically only done on page load
    */
  document.getElementById("player_one_score").innerText = state.playerOneGames;
  document.getElementById("player_one_games").innerText =
    formatGamesValue(state.playerOneGames);
  document.getElementById("player_one_total_time").innerText =
    formatTotalTime(state.playerOneTotalTimeRemainingSeconds);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(state.playerOneReserveTimeRemainingSeconds);


  document.getElementById("player_two_score").innerText =
    state.playerTwoGames;
  document.getElementById("player_two_games").innerText =
    formatGamesValue(state.playerTwoGames);
  document.getElementById("player_two_total_time").innerText =
    formatTotalTime(state.playerTwoTotalTimeRemainingSeconds);
  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(state.playerTwoReserveTimeRemainingSeconds);
}

function setupUIBasedOnMatchParameters(parameters) {
  document.getElementById("player_one_name").innerText = parameters.playerOneName;
  document.getElementById("player_one_total_time").innerText =
    formatTotalTime(parameters.totalGameTimeSeconds);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(parameters.reserveTimeSeconds);

  document.getElementById("player_two_name").innerText = parameters.playerTwoName;
  document.getElementById("player_two_total_time").innerText =
    formatTotalTime(parameters.totalGameTimeSeconds);
  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(parameters.reserveTimeSeconds);
}

function setupMainButtons() {
  Array.from(document.getElementsByClassName("start_button")).forEach(function(it) {
    it.onclick = onClickStart;
  })
}

function setupSettingsDialog() {
  const currentMatchParameters =
    { ...matchParameters, ...loadStateFromLocalStorage(MATCH_PARAMETERS_KEY) };
  const dialog = document.getElementById("settings_dialog");
  const form = document.getElementById("settings_form");
  const closeButton = document.getElementById("close_settings");
  const saveButton = document.getElementById("save_settings");


  document.getElementById("useCube").checked = currentMatchParameters["useCube"]
  document.getElementById("useDice").checked = currentMatchParameters["useDice"]
  document.getElementById("scoreLimit").value = currentMatchParameters["scoreLimit"]
  document.getElementById("playerOneName").value = currentMatchParameters["playerOneName"]
  document.getElementById("playerTwoName").value = currentMatchParameters["playerTwoName"]

  const currentTotalGameTimeSeconds = currentMatchParameters["totalGameTimeSeconds"]
  document.getElementById("formTotalGameTimeMinutes").value = currentTotalGameTimeSeconds / 60;
  document.getElementById("formTotalGameTimeSeconds").value = currentTotalGameTimeSeconds % 60;

  document.getElementById("reserveTimeSeconds").value = currentMatchParameters["reserveTimeSeconds"]

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
    const newMatchParameters = {};
    for (const element of form.elements) {
      if (element.name && element.type !== "submit" && element.type !== "button") {
        if (element.type === "checkbox") {
          newMatchParameters[element.name] = element.checked;
        }
        else if (element.name === "formTotalGameTimeMinutes") {
          newTotalGameTime += element.value * 60;
        }
        else if (element.name === "formTotalGameTimeMinutes") {
          newTotalGameTime += element.value;
        } else {
          newMatchParameters[element.name] = element.value;
        }
      }
    }
    newMatchParameters["totalGameTimeSeconds"] = newTotalGameTime;

    // SHOULD ALSO UPDATE THE MAIN UI TO SHOW A NEW GAME WITH THE NEW SETTINGS
    saveStateToLocalStorage(MATCH_PARAMETERS_KEY,
      { ...currentMatchParameters, ...newMatchParameters });
    dialog.close();
  });
}

function showSettings() {
  setupSettingsDialog();

  document.getElementById("settings_dialog").showModal();
}

function onClickStart() {
  /** Start the game **/
  showSettings();
}

document.addEventListener("DOMContentLoaded", () => {
  const matchParametersOnStartup =
    { ...matchParameters, ...loadStateFromLocalStorage(MATCH_PARAMETERS_KEY) };
  setupUIBasedOnMatchParameters(matchParametersOnStartup);

  const savedGameState = loadStateFromLocalStorage(GAME_STATE_KEY)
  const gameStateOnStartup = { ...gameState, ...savedGameState };
  if (savedGameState) {
    setupUIBasedOnState(gameStateOnStartup);
  }

  setupMainButtons();
});
