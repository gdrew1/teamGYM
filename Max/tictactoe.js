//Server setup nothing until the next comment should be relevant to not Max
let express = require('express');
let app = express();

let server = require('http').createServer(app);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/client/tictactoe.html');
  //res.sendFile(__dirname + '/client/style.css');
});
app.use('/client', express.static(__dirname + '/client'));

let io = require('socket.io')(server);

console.log("Server started.");
//relevance begins
//List of server sockets in use
SOCKET_LIST = {};
//list of clients, each will be attatched to a socket
let players = {};
//The client that can place X
let player1 = null;
//The client that can place O
let player2 = null;
//The current board state
let play_board = ["", "", "", "", "", "", "", "", ""];
//Checks if the board is fully filled
let board_full = false;
//Runs when a new client connects
io.sockets.on('connection', function (socket) {
  console.log("connected");
  //Give the client an id and potentially a player so they can tell us whether they are p1 p2 or spectator
  let playerId = Math.random();
  SOCKET_LIST[playerId] = socket;
  players[playerId] = { id: playerId, symbol: null, move: null }
  if (player1 == null) {
    players[playerId].symbol = "X";
    players[playerId].move = "true";
    player1 = players[playerId];
  }
  else if (player2 == null) {
    players[playerId].symbol = "O";
    players[playerId].move = "false";
    player2 = players[playerId];
  }
  else {
    //potential spectator implimentation
  }
  //tell client their Id.
  console.log(playerId);
  socket.emit('newPlayer', playerId);

  socket.on('turnCheck', function (clickedBy) {
    socket.emit('test');
    if(play_board[clickedBy.location] == "" && !board_full)
    {
      if (player1.id == clickedBy.id && player1.move == true) {
        play_board[clickedBy.location] = player1.symbol;
        update();
        clickedBy.symbol = "X";
        socket.emit('update', clickedBy);
      }
      else if (player2.id == clickedBy.id && player2.move == true) {
        play_board[clickedBy.location] = player2.symbol;
        update();
        clickedBy.symbol = "Y";
        socket.emit('update', clickedBy);
      }
    }
  })

  function update() {
    player1.move = !player1.move;
    player2.move = !player2.move;
    check_board_complete();
    check_for_winner();

  }

  const check_line = (a, b, c) => {
    return (
      play_board[a] == play_board[b] &&
      play_board[b] == play_board[c] &&
      (play_board[a] == symbol1 || play_board[a] == symbol2)
    );
  };

  //css
  const check_match = () => {
    for (i = 0; i < 9; i += 3) {
      if (check_line(i, i + 1, i + 2)) {
        /*
          document.querySelector(`#block_${i}`).classList.add("win");
          document.querySelector(`#block_${i + 1}`).classList.add("win");
          document.querySelector(`#block_${i + 2}`).classList.add("win");
          */
        return play_board[i];
      }
    }
    for (i = 0; i < 3; i++) {
      if (check_line(i, i + 3, i + 6)) {
        /*
          document.querySelector(`#block_${i}`).classList.add("win");
          document.querySelector(`#block_${i + 3}`).classList.add("win");
          document.querySelector(`#block_${i + 6}`).classList.add("win");
          */
        return play_board[i];
      }
    }
    if (check_line(0, 4, 8)) {
      /*
        document.querySelector("#block_0").classList.add("win");
        document.querySelector("#block_4").classList.add("win");
        document.querySelector("#block_8").classList.add("win");
        */
      return play_board[0];
    }
    if (check_line(2, 4, 6)) {
      /*
        document.querySelector("#block_2").classList.add("win");
        document.querySelector("#block_4").classList.add("win");
        document.querySelector("#block_6").classList.add("win");
        */
      return play_board[2];
    }
    return "";
  };

  const check_for_winner = () => {
    let res = check_match()
    if (res == player1.symbol) {
      socket.emit('gameEnd', 1);
      board_full = true
    } else if (res == player2.symbol) {
      socket.emit('gameEnd', 2);
      board_full = true
    } else if (board_full) {
      socket.emit('gameEnd', 0);
    }
  };

  check_board_complete = () => {
    let flag = true;
    play_board.forEach(element => {
      if (element != symbol1 && element != symbol2) {
        flag = false;
      }
    });
    board_full = flag;
  };

  socket.on('reset', function () {
    play_board = ["", "", "", "", "", "", "", "", ""];
    board_full = false;
    player1.move = true;
    player2.move = false;
    socket.emit('reset');
  })

  socket.on('disconnect', function () {
    if (socket.id == player1) {
      player1 = null;
    }
    else if (socket.id == player2) {
      player2 = null;
    }
    delete SOCKET_LIST[socket.id];
  });
});
server.listen(4141);