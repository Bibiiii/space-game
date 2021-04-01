# Space Shooters Game
A small Phaser 3 game written in TypeScript for a Computer Science MSc project. 

## Running the game
To run the game locally in dev mode, run:
```
npm run start-dev
```

To build the game and then run it, use:
```
npm run build-client
npm run start
```

## Playing the game
Space shooters needs two players per game. The first player should create a new game, and the second player should use their friend's room code to join the same game.

The aim is to collect the gems before the other player. When a gem is collected, another one will appear.

## Features
### 1. Artificial network delay
The game uses a 'ping-pong' system to send frequent updates between the server and client. The client's responses are delayed by a random time value between 0 and 6.5 seconds to simulate realistic network conditions, which vary over time.

### 2. Bucket Synchronisation
Player movement is sped up or delayed depending on the game's latency, so that all clients appear to have the same frame rate and the game is fair.

### 3. Interest Management
As the game map is very small, interest management is implemented in terms of 'rooms' and also a redundant Area of Interest.
#### Rooms
Only the players, scores and gems belonging to the same room as the client should be displayed on the client's screen.

#### AOI
Other players/enemies are only displayed if the AOI of the enemy is the same as the current client. (Redundant and always true)

### 4. Dead Reckoning
Other players' movement is displayed according to the direction and speed of travel, rather than live positions, in order to compensate for network problems and delays.

### 5. Smooth Corrections
Tween animations are used to display other players' movement to the client. This uses the speed and direction of travel for a smooth animation in the case of network delays.

### 6. Cheating
Players on the red team can move quicker than players on the blue team.

### 7. Cheating detection
Whenever the server receives movement from a player, it checks the acceleration of the player. If the average acceleration is above the specified value, a warning is sent to the cheating player.