//Server setup nothing until the next comment should be relevant to not Max
let express = require('express');
let app = express();

let server = require('http').createServer(app);

let mysql = require('mysql');

var startSQL = mysql.createConnection({
    host: 'ec2-18-222-6-224.us-east-2.compute.amazonaws.com',
    user: 'babyboiremote',
    password: 'babyboi',
    database: 'myDB',
    port: '3306'
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/client/profile.html');
  //res.sendFile(__dirname + '/client/style.css');
});
app.use('/client', express.static(__dirname + '/client'));

let io = require('socket.io')(server);

console.log("Server started.");
//relevance begins
//List of server sockets in use
SOCKET_LIST = {};
PLAYER_LIST = {};
SOCKETID_LIST = {};
USERNAME_LIST = {};
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
      SOCKETID_LIST[SOCKET_LIST[waiting].id] = waiting;
      SOCKETID_LIST[SOCKET_LIST[playerId].id] = playerId;
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
      //playerId = Math.random();
      socket.emit('redirect', '/client/login.html');
      
    }
    else if(players[playerId] != null && players[playedId].gameId != null){
      //Rejoin game code here
    }else {
      SOCKET_LIST[playerId] = socket;
      SOCKETID_LIST[socket.id] = playerId;
      socket.emit("newPlayer", playerId);
      console.log(playerId);
    }
  })

  socket.on('login', function(username, password) {
    let playerId;
    //database check code
    startSQL.query('SELECT * FROM users AS data WHERE username = \'' + username + '\'', function(error, results, fields) {
    if (error)
    {
      throw error;
    } 
    else if(password == results[0].password)
    {
      console.log("passed is true");
      playerId = Math.random();
      SOCKET_LIST[playerId] = socket;
      SOCKETID_LIST[socket.id] = playerId;
      USERNAME_LIST[playerId] = username;
      socket.emit("newPlayer", playerId);
    } 
    else 
    {
      socket.emit('bad_login');
    }
    })
  })

  socket.on('register', function(username, password) {
    let playerId;
    //check if username is unique
    startSQL.query('SELECT * FROM users AS data WHERE username = \'' + username + '\'', function(error, results, fields){
      if (error)
      {
        throw error;
      }
      if(results.length == 0)
      {
        startSQL.query('INSERT INTO users(username, password) VALUES (\'' + username + '\',\'' + password + '\')', function(error, results, fields){
        if (error)
        {
        throw error;
        } 
        })
        playerId = Math.random();
        SOCKET_LIST[playerId] = socket;
        SOCKETID_LIST[socket.id] = playerId;
        USERNAME_LIST[playerId] = username;
        socket.emit("newPlayer", playerId);
      }
      else{
      socket.emit('bad_register');
      }
    })
  })

  socket.on("need_friends", function(id) {
    let playerId = id;
    if(playerId == "null"){
      socket.emit('redirect', '/client/login.html');
    }
    else{
      let friends = [];
      //POPULATE FRIENDS
      socket.emit('here_friends', friends);
    }
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


  //GAMEEND!!!!!
  const check_for_winner = (game) => {
    let res = check_match(game)
    if (res == game.player1.symbol) {
      
      socket.emit('gameEnd', 1);
      SOCKET_LIST[game.player2.id].emit('gameEnd', 1);
      game.board_full = true
      gameEnd(game);

    } else if (res == game.player2.symbol) {
      socket.emit('gameEnd', 2);
      SOCKET6_LIST[game.player1.id].emit('gameEnd', 2);
      game.board_full = true
      gameEnd(game);
    } else if (game.board_full) {
      socket.emit('gameEnd', 0);
      SOCKET_LIST[game.player2.id].emit('gameEnd', 0);
      gameEnd(game);
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


  //GAMEEND!!!!
  socket.on('disconnect', function () {
    

    if(players[SOCKETID_LIST[socket.id]] != null) {
      console.log("first case passed");
      if(games[players[SOCKETID_LIST[socket.id]].gameId] != null)
        console.log("second case passed");
        game = games[players[SOCKETID_LIST[socket.id]].gameId]
        if (SOCKETID_LIST[socket.id] == game.player1.id) {
          SOCKET_LIST[game.player2.id].emit("forfeit", 1);
          game.board_full = true;
          console.log("1 is gone");
          gameEnd(game);
        }
        else if (SOCKETID_LIST[socket.id] == game.player2.id) {
          SOCKET_LIST[game.player1.id].emit("forfeit", 2);
          game.board_full = true;
          console.log("2 is gone");
          gameEnd(game);
        }
        delete SOCKET_LIST[socket.id];
        delete SOCKET_LIST[socket.id];
      }
      else
      {
        currentGame = null;
      }
  });


  //GAMEEND!!!!
  socket.on('forfeit', function () {
    
    
    if(players[SOCKETID_LIST[socket.id]] != null) {
      console.log("first case passed");
      if(games[players[SOCKETID_LIST[socket.id]].gameId] != null)
        console.log("second case passed");
        game = games[players[SOCKETID_LIST[socket.id]].gameId]
        if (SOCKETID_LIST[socket.id] == game.player1.id) {
          SOCKET_LIST[game.player2.id].emit("forfeit", 1);
          socket.emit("forfeit", 1);
          game.board_full = true;
          console.log("1 is gone");
          gameEnd(game);
        }
        else if (SOCKETID_LIST[socket.id] == game.player2.id) {
          SOCKET_LIST[game.player1.id].emit("forfeit", 2);
          socket.emit("forfeit", 2);
          game.board_full = true;
          console.log("2 is gone");
          gameEnd(game);
        }
        delete SOCKET_LIST[socket.id];
        delete SOCKET_LIST[socket.id];
      }
      else
      {
        currentGame = null;
      }
  });

  function gameEnd(game) {
    console.log("game end");
    delete SOCKETID_LIST[SOCKET_LIST[game.player2.id].id];
    delete SOCKETID_LIST[SOCKET_LIST[game.player1.id].id];
    delete SOCKET_LIST[game.player1.id];
    delete SOCKET_LIST[game.player2.id];
    delete players[game.player1.id];
    delete players[game.player2.id];
    delete games[game.id];
    //Ladder update functionality
  }
});
server.listen(4141);