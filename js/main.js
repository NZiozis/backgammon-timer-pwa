/**
 * This file sources all the game logic for the timer as well as all state information
 */

const MATCH_PARAMETERS_KEY = "matchParameters";
const GAME_STATE_KEY = "gameState";

const ONE_SECOND_IN_MS = 1000;
const TEN_MINUTES_IN_MS = 600000;
const TEN_SECONDS_IN_MS = 10000;

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

  totalGameTimeMs: TEN_MINUTES_IN_MS,
  reserveTimeMs: TEN_SECONDS_IN_MS,
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
  playerOneTotalTimeRemainingMs: TEN_MINUTES_IN_MS,
  playerOneReserveTimeRemainingMs: TEN_SECONDS_IN_MS,
  playerOneTimeoutId: null,

  playerTwoGames: 0,
  playerTwoScore: 0,
  playerTwoTotalTimeRemainingMs: TEN_MINUTES_IN_MS,
  playerTwoReserveTimeRemainingMs: TEN_SECONDS_IN_MS,
  playerTwoTimeoutId: null,

  forceRestartInEffect: true, // This makes sure that tick fully stops on a reset. Since the tick is handled by setTimeout, there is a chance that it will run over and ignore a gameState reset if this isn't set. This is toggled to false on game start and is set to true when a function like resetGameState is called
}

function resetGameState() {
  gameState.forceRestartInEffect = true;
  clearTimeout(gameState.playerTwoTimeoutId);
  gameState.playerTwoTimeoutId = null;
  clearTimeout(gameState.playerOneTimeoutId);
  gameState.playerOneTimeoutId = null;

  gameState.currentPlayerTurn = PlayerTurn.NEUTRAL;
  gameState.currentGameValue = 1;
  gameState.cubeOwnership = CubeOwnership.NEUTRAL;

  gameState.playerOneGames = 0;
  gameState.playerOneScore = 0;
  gameState.playerOneTotalTimeRemainingMs = matchParameters.totalGameTimeMs;
  gameState.playerOneReserveTimeRemainingMs = matchParameters.reserveTimeMs;

  gameState.playerTwoGames = 0;
  gameState.playerTwoScore = 0;
  gameState.playerTwoTotalTimeRemainingMs = matchParameters.totalGameTimeMs;
  gameState.playerTwoReserveTimeRemainingMs = matchParameters.reserveTimeMs;
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

function updateDoublingCube() {
  const midline = document.getElementById("midline");
  const doublingCube = document.getElementById("doubling_cube");
  switch (gameState.cubeOwnership) {
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
  doublingCube.innerText = gameState.currentGameValue === 1 ? "64"
    : gameState.currentGameValue;
}

function setupUIBasedOnGameState() {
  /**
    * Takes the information present in appState (a globally defined variable) and
    * uses that to update the UI. This is typically only done on page load
    */
  document.getElementById("player_one_score").innerText = gameState.playerOneScore;
  document.getElementById("player_one_games").innerText =
    formatGamesValue(gameState.playerOneGames);
  document.getElementById("player_one_total_time").innerText =
    formatTotalTime(gameState.playerOneTotalTimeRemainingMs);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(gameState.playerOneReserveTimeRemainingMs);


  document.getElementById("player_two_score").innerText =
    gameState.playerTwoScore;
  document.getElementById("player_two_games").innerText =
    formatGamesValue(gameState.playerTwoGames);
  document.getElementById("player_two_total_time").innerText =
    formatTotalTime(gameState.playerTwoTotalTimeRemainingMs);
  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(gameState.playerTwoReserveTimeRemainingMs);

  updateDoublingCube();
}

function setupUIBasedOnMatchParameters() {
  // This relies on the fact that the id of the option and the value of the option being
  // the same
  document.getElementById("player_one_name").innerText = matchParameters.playerOneName;
  document.getElementById("player_one_total_time").innerText =
    formatTotalTime(matchParameters.totalGameTimeMs);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(matchParameters.reserveTimeMs);

  document.getElementById("player_two_name").innerText = matchParameters.playerTwoName;
  document.getElementById("player_two_total_time").innerText =
    formatTotalTime(matchParameters.totalGameTimeMs);
  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(matchParameters.reserveTimeMs);

  document.getElementById("sidebar_game_info").innerText = `Game to ${matchParameters.scoreLimit}`;
}

function onClickConcede(isPlayerOne) {
  setupConcedeDialog(isPlayerOne);

  document.getElementById("concede_dialog").showModal();
}

function onClickSettings() {
  setupSettingsDialog();

  document.getElementById("settings_dialog").showModal();
}

function setupSidebar() {
  Array.from(document.getElementsByClassName("concede_button")).forEach(function(it) {
    it.onclick = () => onClickConcede(isPlayerOneUIElement(it));
  })

  Array.from(document.getElementsByClassName("settings_button")).forEach(function(it) {
    it.onclick = onClickSettings;
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
    handlePlayerWin(!isPlayerOneConceding);
    dialog.close();
  }, {signal});
  const concedeTwoMatchButton = document.getElementById("concede_two_match");
  concedeTwoMatchButton.innerText = `Concede ${gameState.currentGameValue * 2}`;
  concedeTwoMatchButton.addEventListener("click", (event) => {
    handlePlayerWin(!isPlayerOneConceding, 2);
    dialog.close();
  }, {signal});
  const concedeThreeMatchButton = document.getElementById("concede_three_match");
  concedeThreeMatchButton.innerText = `Concede ${gameState.currentGameValue * 3}`;
  concedeThreeMatchButton.addEventListener("click", (event) => {
    handlePlayerWin(!isPlayerOneConceding, 3);
    dialog.close();
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

  document.getElementById(matchParameters.startType).selected = true;
  document.getElementById("useCube").checked = matchParameters["useCube"]
  document.getElementById("useDice").checked = matchParameters["useDice"]
  document.getElementById("scoreLimit").value = matchParameters["scoreLimit"]
  document.getElementById("playerOneName").value = matchParameters["playerOneName"]
  document.getElementById("playerTwoName").value = matchParameters["playerTwoName"]

  const currentTotalGameTimeMs = matchParameters["totalGameTimeMs"]
  document.getElementById("formTotalGameTimeMinutes").value = Math.floor(currentTotalGameTimeMs / 60000);
  document.getElementById("formTotalGameTimeSeconds").value = currentTotalGameTimeMs % 60000 / 1000;

  document.getElementById("formReserveTimeSeconds").value = matchParameters["reserveTimeMs"] / 1000;

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

    let newTotalGameTimeSeconds = 0;
    for (const element of form.elements) {
      if (element.name && element.type !== "submit" && element.type !== "button") {
        if (element.type === "checkbox") {
          matchParameters[element.name] = element.checked;
        }
        else if (element.name === "formTotalGameTimeMinutes") {
          newTotalGameTimeSeconds += (+element.value) * 60;
        }
        else if (element.name === "formTotalGameTimeSeconds") {
          newTotalGameTimeSeconds += (+element.value);
        } else if (element.name === "formReserveTimeSeconds") {
          matchParameters.reserveTimeMs = (+element.value) * 1000;
        } else {
          matchParameters[element.name] = element.value;
        }
      }
    }
    matchParameters["totalGameTimeMs"] = newTotalGameTimeSeconds * 1000;

    saveStateToLocalStorage(MATCH_PARAMETERS_KEY, matchParameters);

    fullReset();

    dialog.close();
  });
}

function toggleMainUIToShowForPlayer(showForPlayerOne) {
  document.querySelector("#player_one #main_ui").style.display = showForPlayerOne ?
    "flex" : "none";
  document.querySelector("#player_two #main_ui").style.display = showForPlayerOne ?
    "none" : "flex";
}

function onClickDone(isPlayerOne) {
  if (isPlayerOne) {
    document.querySelector("#player_one #roll_action_ui").style.display = "none";
  } else {
    document.querySelector("#player_two #roll_action_ui").style.display = "none";
  }

  setupTimerForPlayer(!isPlayerOne);
  toggleMainUIToShowForPlayer(!isPlayerOne);
}

function onClickDouble(isPlayerOne) {
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
  gameState.currentGameValue = gameState.currentGameValue * 2;
  gameState.cubeOwnership = isPlayerOne ? CubeOwnership.PLAYER_ONE : CubeOwnership.PLAYER_TWO;

  const playerTaking = isPlayerOne ? document.getElementById("player_one") :
      document.getElementById("player_two");
  const playerOnTurn = isPlayerOne ? document.getElementById("player_two") :
      document.getElementById("player_one")

  playerTaking.querySelector("#double_action_ui").style.display = "none";

  playerOnTurn.querySelector("#main_ui").style.display = "flex";
  playerOnTurn.querySelector("#main_ui .double_button").style.display = "none";

  document.getElementById("doubling_cube").style.display = "flex";
  updateDoublingCube();
  setupTimerForPlayer(!isPlayerOne);
}

function onClickDoubleDrop(isPlayerOne) {
  handlePlayerWin(!isPlayerOne);
}

function onClickRoll(isPlayerOne) {
  /** Hide the roll/double, show roll_action_ui **/
  const playerUI = isPlayerOne ? document.getElementById("player_one") :
     document.getElementById("player_two");

  playerUI.querySelector("#main_ui").style.display = "none";

  playerUI.querySelector("#roll_action_ui").style.display = "flex";
  playerUI.querySelector("#dice_one_span").innerText = Math.floor(Math.random() * 6) + 1;
  playerUI.querySelector("#dice_two_span").innerText = Math.floor(Math.random() * 6) + 1;
}

function onClickStart(didPlayerOneClick) {
  /** Start the game
    * If startType, then it's a coin flip to start
    * Otherwise, the player that clicked the button does first
    **/
  gameState.forceRestartInEffect = false;

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

function setupTimerForPlayer(isPlayerOne) {
  /** Starts the timer for the specified player
    *
    */
  let expected;

  function tick() {
    if (gameState.forceRestartInEffect) {
      return;
    }
    if (isPlayerOne) {
      if (gameState.playerOneReserveTimeRemainingMs > 0) {
        gameState.playerOneReserveTimeRemainingMs -= ONE_SECOND_IN_MS;
        document.getElementById("player_one_reserve_time").innerText =
          formatReserveTime(gameState.playerOneReserveTimeRemainingMs);
      } else {
        gameState.playerOneTotalTimeRemainingMs -= ONE_SECOND_IN_MS;
        document.getElementById("player_one_total_time").innerText =
          formatTotalTime(gameState.playerOneTotalTimeRemainingMs);
        if (gameState.playerOneTotalTimeRemainingMs <= 0) {
          handlePlayerWin(false /* didPlayerOneWin */, 1, true);
        }
      }
    } else {
      if (gameState.playerTwoReserveTimeRemainingMs > 0) {
        gameState.playerTwoReserveTimeRemainingMs -= ONE_SECOND_IN_MS;
        document.getElementById("player_two_reserve_time").innerText =
          formatReserveTime(gameState.playerTwoReserveTimeRemainingMs);
      } else {
        gameState.playerTwoTotalTimeRemainingMs -= ONE_SECOND_IN_MS;
        document.getElementById("player_two_total_time").innerText =
          formatTotalTime(gameState.playerTwoTotalTimeRemainingMs);
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
      gameState.playerOneTimeoutId = timeoutId;
    } else {
      gameState.playerTwoTimeoutId = timeoutId;
    }
  }

  expected = Date.now() + ONE_SECOND_IN_MS;
  const timeoutId = setTimeout(tick, ONE_SECOND_IN_MS);
  if (isPlayerOne) {
    gameState.playerOneTimeoutId = timeoutId;
    clearTimeout(gameState.playerTwoTimeoutId);
    gameState.playerTwoTimeoutId = null;
    gameState.playerTwoReserveTimeRemainingMs = matchParameters.reserveTimeMs;
    document.getElementById("player_two_reserve_time").innerText =
      formatReserveTime(gameState.playerTwoReserveTimeRemainingMs);
  } else {
    gameState.playerTwoTimeoutId = timeoutId;
    clearTimeout(gameState.playerOneTimeoutId);
    gameState.playerOneTimeoutId = null;
    gameState.playerOneReserveTimeRemainingMs = matchParameters.reserveTimeMs;
    document.getElementById("player_one_reserve_time").innerText =
      formatReserveTime(gameState.playerOneReserveTimeRemainingMs);
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
    gameState.playerOneGames += 1;
    gameState.playerOneScore += score;
    if (forceGameWin || gameState.playerOneScore >= matchParameters.scoreLimit) {
      fullReset();
      alert(`${matchParameters.playerOneName} wins`);

      return;
    }
  } else {
    gameState.playerTwoGames += 1;
    gameState.playerTwoScore += score;
    if (forceGameWin || gameState.playerTwoScore >= matchParameters.scoreLimit) {
      fullReset();
      alert(`${matchParameters.playerTwoName} wins`);

      return;
    }
  }

  gameState.currentGameValue = 1;
  gameState.cubeOwnership = CubeOwnership.NEUTRAL;
  gameState.currentPlayerTurn = CubeOwnership.NEUTRAL;

  document.getElementById("doubling_cube").style.display = "flex";
  updateDoublingCube();

  clearTimeout(gameState.playerTwoTimeoutId);
  gameState.playerTwoTimeoutId = null;
  clearTimeout(gameState.playerOneTimeoutId);
  gameState.playerOneTimeoutId = null;

  setupUIBasedOnGameState();
  document.getElementById("player_two_reserve_time").innerText =
    formatReserveTime(matchParameters.reserveTimeMs);
  document.getElementById("player_one_reserve_time").innerText =
    formatReserveTime(matchParameters.reserveTimeMs);

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
