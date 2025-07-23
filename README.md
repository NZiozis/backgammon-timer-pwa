# backgammon-timer-pwa

## Run for local development
~bash
  python3 -m http.server 8000
~

## For next time
- Use `setInterval()` to update the timer and the UI related to it.
  - Update the UI in the callback given to the setInterval.
  - The return value of the timer is used to cancel the update later on.
    - EX when the player turn switches

## TODO
- [ ] Customize names for players
- [ ] Consider if the player that doubles should have default_hidden or style=none applied to the button
- [ ] Consider using templates for player_container ui
- [ ] Sidebar UI and timer

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
