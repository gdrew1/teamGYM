//Server setup nothing until the next comment should be relevant to not Max
var mysql = require('mysql');
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

let waiting = null;
let waiting2 = null;
//Runs when a new client connects
io.sockets.on('connection', function (socket) {


  socket.on("wantToPlay", function () {
    let playerId = Math.random();
    console.log("connected");
    SOCKET_LIST[playerId] = socket;
    if(waiting == null)
    {
          waiting = playerId;
    }
    else
    {
        SOCKET_LIST[waiting].emit('redirect', '/client/tictactoe.html');
        SOCKET_LIST[playerId].emit('redirect', '/client/tictactoe.html');
        console.log(waiting);
        console.log(playerId);
        waiting = null;
        console.log("made new game");
        
    }
  });
  

  socket.on('newGame', function () {
    let playerId = Math.random();
    console.log("connected");
    SOCKET_LIST[playerId] = socket;
      if(waiting2 == null){
        waiting = playerId;
        socket.emit('newPlayer', playerId);
      }
      else{
        
        new_game(waiting, playerId);
        socket.emit('newPlayer', playerId);

        waiting = null;
      }
  });
  

  

  //Give the client an id and potentially a player so they can tell us whether they are p1 p2 or spectator
  
  
  async function new_game(playerId1, playerId2){
    console.log("test");
    let player1 = null;
    let player2 = null;
    let players = {};
    players[playerId1] = { id: playerId1, symbol: null, move: null }
    players[playerId2] = { id: playerId2, symbol: null, move: null }
    if (player1 == null) {
      players[playerId1].symbol = "X";
      players[playerId1].move = true;
      player1 = players[playerId1];
    }
    if (player2 == null) {
      players[playerId2].symbol = "O";
      players[playerId2].move = false;
      player2 = players[playerId2];
    }
    else {
      //potential spectator implimentation
    }
    //tell client their Id.
    //socket.emit('newPlayer', playerId);
  
    socket.on('turnCheck', function (clickedBy) {
      console.log("test");
      if(play_board[clickedBy.location] == "" && !board_full)
      {
        console.log("test");
        console.log(player1.id == clickedBy.id);
        console.log(player1.move);
        console.log(player1.id == clickedBy.id && player1.move);
        if (player1.id == clickedBy.id && player1.move == true) {
          play_board[clickedBy.location] = player1.symbol;
          console.log(play_board[clickedBy.location]);
          update();
          clickedBy.symbol = "X";
          socket.emit('update', clickedBy);
          SOCKET_LIST[player2.id].emit('update', clickedBy);
        }
        else if (player2.id == clickedBy.id && player2.move) {
          play_board[clickedBy.location] = player2.symbol;
          update();
          clickedBy.symbol = "O";
          socket.emit('update', clickedBy);
          SOCKET_LIST[player1.id].emit('update', clickedBy);
        }
      }
    })
  }
  
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
        (play_board[a] == player1.symbol || play_board[a] == player2.symbol)
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
        SOCKET_LIST[player2.id].emit('gameEnd', 1);
        board_full = true
      } else if (res == player2.symbol) {
        socket.emit('gameEnd', 2);
        SOCKET6_LIST[player1.id].emit('gameEnd', 2);
        board_full = true
      } else if (board_full) {
        socket.emit('gameEnd', 0);
        SOCKET_LIST[player2.id].emit('gameEnd', 0);
      }
    };
  
    check_board_complete = () => {
      let flag = true;
      play_board.forEach(element => {
        if (element != player1.symbol && element != player2.symbol) {
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
    })

    
  });   
      
server.listen(4141);