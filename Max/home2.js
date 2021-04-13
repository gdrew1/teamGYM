//Server setup nothing until the next comment should be relevant to not Max
let express = require('express');
let app = express();

let server = require('http').createServer(app);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/client/home.html');
  //res.sendFile(__dirname + '/client/style.css');
});
app.use('/client', express.static(__dirname + '/client'));

let io = require('socket.io')(server);

console.log("Server started.");
//relevance begins
//List of server sockets in use
SOCKET_LIST = {};
PLAYER_LIST = {};
//list of clients, each will be attatched to a socket
let players = {};
//The current board state
let currentGame = null;
let games = {};
let idinc = 0;
let waiting = null;
//Runs when a new client connects
io.sockets.on('connection', function (socket) {
  console.log("connected");
  //Give the client an id and potentially a player so they can tell us whether they are p1 p2 or spectator
  socket.emit("test");

  socket.on("requestGame", function (playerId) {
    if(waiting == null){
      waiting = playerId;
    }
    else{
      SOCKET_LIST[waiting].emit('redirect', '/client/tictactoe.html');
      SOCKET_LIST[playerId].emit('redirect', '/client/tictactoe.html');
      waiting = null;

    }
  });

  socket.on("wantToPlay", function (playerId) {
    
    players[playerId] = { id: playerId, symbol: null, move: null, gameId: idinc }

    if(currentGame == null){
      let temp = idinc
      currentGame = {id: temp, player1: null, player2: null, board_full: false, play_board: ["", "", "", "", "", "", "", "", ""]}
      players[playerId].symbol = "X";
      players[playerId].move = true;
      currentGame.player1 = players[playerId];
      console.log(currentGame.player1.id);
    }
    else{
      games[currentGame.id] = currentGame;
      idinc++;
      
      players[playerId].symbol = "O";
      players[playerId].move = false;
      currentGame.player2 = players[playerId];
      currentGame = null;
  }});
  //tell client their Id.
  socket.on('test', function (id) {
    let playerId = id;
    if(playerId == "null"){
      playerId = Math.random();
      
    }
    else if(players[playerId] != null && players[playedId].gameId != null){
      //Rejoin game code here
    }
    SOCKET_LIST[playerId] = socket;
    socket.emit("newPlayer", playerId);
    console.log(playerId);
  })

  socket.on('turnCheck', function (clickedBy) {
    console.log(clickedBy);
    console.log(players);
    let game = (games[players[clickedBy.id].gameId]);
    if(game.play_board[clickedBy.location] == "" && !game.board_full)
    {
      console.log("test");
      console.log(game.player1.id == clickedBy.id);
      console.log(game.player1.move);
      console.log(game.player1.id == clickedBy.id && game.player1.move);
      if (game.player1.id == clickedBy.id && game.player1.move == true) {
        game.play_board[clickedBy.location] = game.player1.symbol;
        console.log(game.play_board[clickedBy.location]);
        update(game);
        clickedBy.symbol = "X";
        socket.emit('update', clickedBy);
        SOCKET_LIST[game.player2.id].emit('update', clickedBy);
      }
      else if (game.player2.id == clickedBy.id && game.player2.move) {
        game.play_board[clickedBy.location] = game.player2.symbol;
        update(game);
        clickedBy.symbol = "O";
        socket.emit('update', clickedBy);
        SOCKET_LIST[game.player1.id].emit('update', clickedBy);
      }
    }
  })

  function update(game) {
    game.player1.move = !game.player1.move;
    game.player2.move = !game.player2.move;
    check_board_complete(game);
    check_for_winner(game);

  }

  const check_line = (a, b, c, game) => {
    return (
      game.play_board[a] == game.play_board[b] &&
      game.play_board[b] == game.play_board[c] &&
      (game.play_board[a] == game.player1.symbol || game.play_board[a] == game.player2.symbol)
    );
  };

  //css
  const check_match = (game) => {
    for (i = 0; i < 9; i += 3) {
      if (check_line(i, i + 1, i + 2, game)) {
        /*
          document.querySelector(`#block_${i}`).classList.add("win");
          document.querySelector(`#block_${i + 1}`).classList.add("win");
          document.querySelector(`#block_${i + 2}`).classList.add("win");
          */
        return game.play_board[i];
      }
    }
    for (i = 0; i < 3; i++) {
      if (check_line(i, i + 3, i + 6, game)) {
        /*
          document.querySelector(`#block_${i}`).classList.add("win");
          document.querySelector(`#block_${i + 3}`).classList.add("win");
          document.querySelector(`#block_${i + 6}`).classList.add("win");
          */
        return game.play_board[i];
      }
    }
    if (check_line(0, 4, 8, game)) {
      /*
        document.querySelector("#block_0").classList.add("win");
        document.querySelector("#block_4").classList.add("win");
        document.querySelector("#block_8").classList.add("win");
        */
      return game.play_board[0];
    }
    if (check_line(2, 4, 6, game)) {
      /*
        document.querySelector("#block_2").classList.add("win");
        document.querySelector("#block_4").classList.add("win");
        document.querySelector("#block_6").classList.add("win");
        */
      return game.play_board[2];
    }
    return "";
  };

  const check_for_winner = (game) => {
    let res = check_match(game)
    if (res == game.player1.symbol) {
      socket.emit('gameEnd', 1);
      SOCKET_LIST[game.player2.id].emit('gameEnd', 1);
      game.board_full = true
    } else if (res == game.player2.symbol) {
      socket.emit('gameEnd', 2);
      SOCKET6_LIST[game.player1.id].emit('gameEnd', 2);
      game.board_full = true
    } else if (game.board_full) {
      socket.emit('gameEnd', 0);
      SOCKET_LIST[game.player2.id].emit('gameEnd', 0);
    }
  };

  check_board_complete = (game) => {
    let flag = true;
    game.play_board.forEach(element => {
      if (element != game.player1.symbol && element != game.player2.symbol) {
        flag = false;
      }
    });
    game.board_full = flag;
  };

  socket.on('reset', function (playerId) {
    let game = (games[players[playerId].gameId]);
    game.play_board = ["", "", "", "", "", "", "", "", ""];
    game.board_full = false;
    game.player1.move = true;
    game.player2.move = false;
    socket.emit('reset');
  })

  socket.on('disconnect', function () {
    /*console.log(socket.id);
    game = games[players[socket.id].gameId]
    if (socket.id == game.player1.id) {
      //ForfeitCode
    }
    else if (socket.id == game.player2.id) {
      //ForfeitCode
    }
    delete SOCKET_LIST[socket.id];*/
  });
});
server.listen(4141);