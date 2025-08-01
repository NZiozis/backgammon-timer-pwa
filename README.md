# backgammon-timer-pwa

- NOTE: Remeber to check gameState for all the fields you put there. You should actually
  use them to update and keep track of what UI should be showning like you did for the
  doubling cube

## Run for local development
~bash
  python3 -m http.server 8000
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
- [ ] Concede UI
- [ ] Concded functionality
- [ ] Something to happen when timer reaches 0
- [ ] Something for when score cap is reached
- [ ] UI to show the score cap while playing
- [ ] Alert that changing settings mid-game will cause the game to reset
- [ ] Pausing functionality
- [ ] Style pass
- [ ] Hosted online and downloadable

## TODO Later
- [ ] Some sort of undo
- [ ] Work for larger/landscape screens

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
