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

## DOING
- [ ] Migrate Doubling actions to gameState driven UI updates
- [ ] Some sort of undo and redo
  - [-] Undo logic
  - [ ] Redo logic
  - [ ] UI for undo and redo buttons
- [ ] Migrate Doubling actions to gameState driven UI updates


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
