# backgammon-timer-pwa

- NOTE: Remeber to check gameState for all the fields you put there. You should actually
  use them to update and keep track of what UI should be showning like you did for the
  doubling cube

## Run for local development
~bash
  make run
~

## Deploy
~bash
  make deploy
~

## Feedback

### Original The use of the done buttons instead of just showing the time in
the main display and tapping on the area to switch the time is confusing.
Showing the time in small digits rather than as the largest part of the display
is not helpful, in a match you don't want to be hunting for the time. Using the
scoreboard is overly complex, should just allow players to adjust the scores
with up down buttons or similar method. Trying to include dice rolling and cube
actions adds unnecessary complications. A single pause button is all you need.
The terminology in the settings is nonstandard and confusing. For example using
score limit instead of match length. What you call reserve time is actually
delay time.

### Action items
- [X] Change non-standard strings
  - Score limit -> Match length
  - Reserve time -> Delay time
- [X] Show time as large part of display
- [ ] Simplify using scoreboard


## TODO
- [X] Customize names for players
- [X] Consider if the player that doubles should have default_hidden or style=none applied to the button
- [X] Working Timers
- [X] Double take
- [X] Double drop
- [X] Dice for when rolling is active
- [X] Double UI
- [X] When resetting for new game, make sure to un-hide buttons like double_button
- [X] Update icon for settings button
- [X] Concede UI
- [X] Concede functionality
- [X] Something to happen when timer reaches 0
- [X] Something for when score cap is reached
- [X] UI to show the score cap while playing
- [X] Pausing functionality
- [X] BUG: Option to double doesn't reappear for subsequent double/takes

THESE CAN BE THE SAME DIALOG. JUST NEED TO CHANGE THE CONTENT
- [X] "Do you accept" logic for the player being offered the game on concede
- [X] Alert that changing settings mid-game will cause the game to reset
- [X] Show better alert when player wins

- [X] Hosted online and downloadable
- [X] Buy me a coffee
- [X] Do an observe for match parameters changing the UI too.
  - DO NOT USE FOR BINDING ON CLICK
- [X] Style pass
    - [X] Make the UI look better in general
    - [X] Improve the PWA app icon
    - [X] Improve PWA install banner
- [X] Work for larger/landscape screens
- [X] Fix: Screen resizes when switching between actions
- [X] Different themes
- [X] Game state driven UI updates
- [X] Remove currentPlayerTurn from gameState
- [X] Replaced DROP_DOUBLE action with END_GAME
- [X] Remove necessity for togglePlayerTurn method
- [X] Migrate UNDO to use game state driven UI updates
  - Make sure to do logic for END_GAME because I removed DROP_DOUBLE without doing
    any new logic

## DOING
- [X] Some sort of undo and redo
  - [X] Undo logic
  - [X] Redo logic
  - [ ] UI for undo and redo buttons


## TODO Later
- [ ] Media share buttons
- [ ] Setup in progress game
- [ ] Save gameState at intervals so accidental refresh doesn't lose data
- [ ] Add button to install PWA separate from banner
- [ ] Different penalties for running out the clock

## NOTES
- The default assumes that the app is being viewed in portrait mode
  - aka the height is greater than the width
  **THIS MEANS ALL CONDITIONAL STYLES SHOULD BE APPLIED TO LANDSCAPE**
- I intentionally didn't put the template on in the shadowDOM because I just wanted an easy way to repeat UI and wanted to have an easy way of applying JS and styles to the elements


### Setup for orientation query
**CONDITIONAL STYLES SHOULD BE APPLIED TO LANDSCAPE**
/*@media all and (orientation:portrait) {*/
/*	background-color: blue;*/
/*}*/
