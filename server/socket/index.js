const quickselect = require("quickselect"); // Used to compute the median for latency
const config = require("../config/config");

const appConfig = require("../config/config");

const gameRooms = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(
      `A socket connection to the server has been made: ${socket.id}`
    );
    // store latency for bucket synchronisation
    socket.pingBucket = [];

    setInterval(() => {
      updatePlayers(socket); // update players with current timestamp (to calculate latency)
    }, appConfig.CLIENT_UPDATE_RATE);

    // when a player moves, update the player data
    socket.on("playerMovement", function (data) {
      const { roomKey } = data;
      const game = gameRooms[roomKey];
      if (game && game.players) {
        const savedPlayerData = game.players[socket.id];
        game.players[socket.id] = {
          ...savedPlayerData,
          ...data, // (x, y, rotation, speed, AOI zone)
        };

        const avgAcceleration =
          (Math.abs(data.acceleration.x) + Math.abs(data.acceleration.y)) / 2;

        if (avgAcceleration > 80) {
          game.players[socket.id].isCheating = true;
          io.to(socket.id).emit("warning", "Stop cheating!!");
        }

        gameRooms[roomKey] = game;
        // emit a message to all players about the player that moved
        setTimeout(
          () => socket.to(roomKey).emit("playerMoved", game.players[socket.id]),
          socket.latency
        );
      }
    });

    socket.on("gemCollected", function (data) {
      const { roomKey } = data;
      const game = gameRooms[roomKey];
      if (game.players[socket.id].team === "red") {
        game.scores.red += 10;
      } else {
        game.scores.blue += 10;
      }
      game.gem.x = Math.floor(Math.random() * 700) + 50;
      game.gem.y = Math.floor(Math.random() * 500) + 50;

      gameRooms[roomKey] = game;

      setTimeout(() => {
        io.emit("gemLocation", game.gem);
        io.emit("scoreUpdate", game.scores);
      }, socket.latency);
    });

    socket.on("ponq", function (sentStamp) {
      // sentStamp is the stamp sent back by the client
      // Compute a running estimate of the latency of a client each time an interaction takes place between client and server
      // The running estimate is the median of the last 20 sampled values
      var serverStamp = getTimeStamp();
      var delta = (serverStamp - sentStamp) / 2;
      if (delta < 0) delta = 0;
      socket.pingBucket.push(delta); // list of the last 20 latencies
      if (socket.pingBucket.length > 20) socket.pingBucket.shift(); // only keep last 20
      socket.latency = quickMedian(socket.pingBucket.slice(0)); // get median latency
    });

    socket.on("joinRoom", (roomKey) => {
      socket.join(roomKey);
      const roomInfo = gameRooms[roomKey];
      if (roomInfo) {
        const lastPlayer = Object.keys(roomInfo.players).slice(-1)[0];

        roomInfo.players[socket.id] = {
          rotation: 0,
          x: Math.floor(Math.random() * 700) + 50,
          y: Math.floor(Math.random() * 500) + 50,
          playerId: socket.id,
          team:
            roomInfo.players[lastPlayer]?.team &&
            roomInfo.players[lastPlayer]?.team === "red"
              ? "blue"
              : "red", // alternate team colours
          AOI: {
            zone: 1,
          },
        };
        // update number of players
        roomInfo.numPlayers = Object.keys(roomInfo.players).length;

        gameRooms[roomKey] = roomInfo;

        if (roomInfo.numPlayers > 1) {
          socket.emit("gameReady", roomInfo);
          socket.to(roomKey).emit("gameReady", roomInfo);
        }
      }
    });

    socket.on("startGame", (roomKey) => {
      socket.emit("setState", gameRooms[roomKey]);

      socket.emit("scoreUpdate", gameRooms[roomKey].scores);

      // send the players object to the new player
      socket.emit("currentPlayers", gameRooms[roomKey].players);

      // update all other players of the new player
      // socket
      //   .to(roomKey)
      //   .emit("newPlayer", gameRooms[roomKey].players[socket.id]);

      socket.emit("gemLocation", gameRooms[roomKey].gem);
    });

    // when a player disconnects, remove them from our players object
    socket.on("disconnect", function () {
      //find which room they belong to
      const roomKey = getRoom(socket.id)[0];
      const roomInfo = gameRooms[roomKey];

      console.log("roomKey: ", roomKey, "roominfo:", roomInfo);

      if (roomInfo) {
        console.log("user disconnected: ", socket.id);
        // remove this player from our players object
        // delete roomInfo.players[socket.id];
        delete gameRooms[roomKey].players[socket.id];
        // update numPlayers

        gameRooms[roomKey].numPlayers = Object.keys(
          gameRooms[roomKey].players
        ).length;
        // emit a message to all players to remove this player
        socket.to(roomKey).emit("disconnected", socket.id);
      } else {
        socket.to(roomKey).emit("disconnected", socket.id);
        // socket.broadcast.emit("noRoom");
      }
    });

    socket.on("isKeyValid", function (input) {
      if (Object.keys(gameRooms).includes(input)) {
        if (gameRooms[input].numPlayers < 2) {
          socket.emit("keyIsValid", input);
        } else {
          socket.emit("keyNotValid", config.TOO_MANY_PLAYERS);
        }
      } else {
        socket.emit("keyNotValid", config.INVALID_CODE);
      }
    });

    // get a random code for the room
    socket.on("getRoomCode", async function () {
      let key = codeGenerator();
      while (Object.keys(gameRooms).includes(key)) {
        key = codeGenerator();
      }
      gameRooms[key] = {
        roomKey: key,
        players: {},
        numPlayers: 0,
        gem: {
          x: Math.floor(Math.random() * 700) + 50,
          y: Math.floor(Math.random() * 500) + 50,
        },
        scores: {
          blue: 0,
          red: 0,
        },
        pkg: {
          stamp: undefined,
          latency: 0,
        },
      };
      socket.emit("roomCreated", key);
    });
  });

  const getRoom = function (socketID) {
    return Object.values(gameRooms).map((room) => {
      const gamePlayers = Object.keys(room.players);
      if (gamePlayers.includes(socketID)) {
        return room.roomKey;
      }
    });
  };

  const updatePlayers = function (socket) {
    const roomId = getRoom(socket.id)[0];
    if (roomId) {
      const pkg = gameRooms[roomId].pkg;
      gameRooms[roomId].pkg = addTimeStamp(pkg);

      try {
        gameRooms[roomId].pkg.latency = Math.floor(socket.latency);
      } catch (e) {
        console.log(e);
        gameRooms[roomId].pkg.latency = 0;
      }
      if (gameRooms[roomId].pkg)
        io.in(roomId).emit("update", gameRooms[roomId].pkg);
    }
  };
};

function codeGenerator() {
  let code = "";
  let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getTimeStamp() {
  return parseInt(Date.now().toString().substr(-9));
}

function addTimeStamp(pkg) {
  pkg.stamp = getTimeStamp();
  return pkg;
}

function quickMedian(arr) {
  // Compute the median of an array using the quickselect algorithm
  var l = arr.length;
  var n = l % 2 == 0 ? l / 2 - 1 : (l - 1) / 2;
  quickselect(arr, n);
  return arr[n];
}
