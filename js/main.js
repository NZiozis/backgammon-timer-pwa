/**
 * This file sources all the game logic for the timer as well as all state information
 */

const LOCAL_STORAGE_KEY = "appState";

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

const defaultState = {
  totalGameTimeSeconds: TEN_MINUTES_IN_SECONDS, // 10 minutes
  reserveTimeSeconds: TEN_SECONDS,
  scoreLimit: 7,
  storedGameState: {
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
}

function loadStateFromLocalStorage() {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Error loading state from local storage:", error);
    return undefined;
  }
}

function saveStateToLocalStorage(state) {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Error saving state to local storage:", error);
  }
}

let appState = { ...defaultState, ...loadStateFromLocalStorage() };

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

function setupUIBasedOnAppState() {
  /**
    * Takes the information present in appState (a globally defined variable) and
    * uses that to update the UI. This is typically only done on page load
    */
  document.getElementById("player_one_score").innerText =
    appState.storedGameState.playerOneGames;
  document.getElementById("player_one_games").innerText =
    formatGamesValue(appState.storedGameState.playerOneGames);
  document.getElementById("player_one_total_time").innerText =
    formatTotalTime(appState.storedGameState.playerOneTotalTimeRemainingSeconds);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(appState.storedGameState.playerOneReserveTimeRemainingSeconds);


  document.getElementById("player_two_score").innerText =
    appState.storedGameState.playerTwoGames;
  document.getElementById("player_two_games").innerText =
    formatGamesValue(appState.storedGameState.playerTwoGames);
  document.getElementById("player_two_total_time").innerText =
    formatTotalTime(appState.storedGameState.playerTwoTotalTimeRemainingSeconds);
  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(appState.storedGameState.playerTwoReserveTimeRemainingSeconds);
}

function setupMainButtons() {
  Array.from(document.getElementsByClassName("start_button")).forEach(function(it) {
    it.onclick = onClickStart;
  })
}

function setupSettingsDialog() {
  const dialog = document.getElementById("settings_dialog");
  const closeButton = document.getElementById("close_settings");
  const saveButton = document.getElementById("save_settings");

  closeButton.addEventListener("click", () => {
    dialog.close();
  });
}

function showSettings() {
  document.getElementById("settings_dialog").showModal();
}

function onClickStart() {
  /** Start the game **/
  showSettings();
}

document.addEventListener("DOMContentLoaded", () => {
  setupUIBasedOnAppState();
  setupMainButtons();
  setupSettingsDialog();
});
