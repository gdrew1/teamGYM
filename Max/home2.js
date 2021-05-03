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

app.get('/', function(req, res) {
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
io.sockets.on('connection', function(socket) {
    //Give the client an id and potentially a player so they can tell us whether they are p1 p2 or spectator
    socket.emit("test");

    socket.on("requestGame", function(playerId) {
        if (waiting == null) {
            waiting = playerId;
        } else {
            SOCKET_LIST[waiting].emit('redirect', '/client/tictactoe.html');
            SOCKET_LIST[playerId].emit('redirect', '/client/tictactoe.html');
            SOCKETID_LIST[SOCKET_LIST[waiting].id] = waiting;
            SOCKETID_LIST[SOCKET_LIST[playerId].id] = playerId;
            waiting = null;

        }
    });

    socket.on("wantToPlay", function(playerId) {

        players[playerId] = { id: playerId, symbol: null, move: null, gameId: idinc }

        if (currentGame == null) {
            let temp = idinc
            currentGame = { id: temp, player1: null, player2: null, board_full: false, play_board: ["", "", "", "", "", "", "", "", ""] }
            players[playerId].symbol = "X";
            players[playerId].move = true;
            currentGame.player1 = players[playerId];
            console.log(currentGame.player1.id);
        } else {
            games[currentGame.id] = currentGame;
            idinc++;

            players[playerId].symbol = "O";
            players[playerId].move = false;
            currentGame.player2 = players[playerId];
            currentGame = null;
        }
    });
    //tell client their Id.
    socket.on('test', function(id) {
        let playerId = id;
        if (playerId == "null") {
            //playerId = Math.random();
            socket.emit('redirect', '/client/login.html');

        } else if (players[playerId] != null && players[playedId].gameId != null) {
            //Rejoin game code here
        } else {
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
            if (error) {
                throw error;
            } else if (results.length != 0 && password == results[0].password) {
                playerId = Math.random();
                SOCKET_LIST[playerId] = socket;
                SOCKETID_LIST[socket.id] = playerId;
                USERNAME_LIST[playerId] = username;
                socket.emit("newPlayer", playerId);
            } else {
                socket.emit('bad_login');
            }
        })
    })

    socket.on('register', function(username, password) {
        let playerId;
        //check if username is unique
        startSQL.query('SELECT * FROM users AS data WHERE username = \'' + username + '\'', function(error, results, fields) {
            if (error) {
                throw error;
            }
            if (results.length == 0) {
                startSQL.query('INSERT INTO users(username, password) VALUES (\'' + username + '\',\'' + password + '\')', function(error, results, fields) {
                    if (error) {
                        throw error;
                    }
                })
                startSQL.query('INSERT INTO leaderboard(username, wins, losses, ties) VALUES (\'' + username + '\', 0, 0, 0)', function(error, results, fields) {
                    if (error) {
                        throw error;
                    }
                })
                startSQL.query('CREATE TABLE ' + username + ' (friends varchar(255))', function(error, results, fields) {
                    if (error) {
                        throw error;
                    }
                })
                playerId = Math.random();
                SOCKET_LIST[playerId] = socket;
                SOCKETID_LIST[socket.id] = playerId;
                USERNAME_LIST[playerId] = username;
                socket.emit("newPlayer", playerId);
            } else {
                socket.emit('bad_register');
            }
        })
    })

    socket.on("need_friends", function(id) {
        let playerId = id;
        if (playerId == "null") {
            socket.emit('redirect', '/client/login.html');
        } else {
            let friends = [];
            startSQL.query('SELECT * FROM ' + USERNAME_LIST[playerId], function(error, results, fields) {
                if (error) {
                    throw error;
                } else if (results.length != 0) {
                    for (i = 0; i < results.length; i++) {
                        friends[i] = results[i].friends;
                    }
                    socket.emit('here_friends', friends);
                }
            })
        }
    })

    socket.on("need_leaders", function() {
        let leaders = new Array(10);
        let wins = new Array(10);
        startSQL.query('SELECT * FROM leaderboard ORDER BY wins DESC LIMIT 10', function(error, results, fields) {
            if (error) {
                throw error;
            } else if (results.length != 0) {
                for (i = 0; i < results.length; i++) {
                    leaders[i] = results[i].username;
                    wins[i] = results[i].wins;
                }
                socket.emit("here_leaders", leaders, wins);
            }
        })
    })

    socket.on("need_player", function(username) {
        let wins = 0;
        let losses = 0;
        let ties = 0;
        startSQL.query('SELECT * FROM leaderboard AS data WHERE username = \'' + username + '\'', function(error, results, fields) {
            if (error) {
                throw error;
            } else if (results.length != 0) {
                socket.emit("here_player", results[0].wins, results[0].losses, results[0].ties);
            }
        })
    })

    socket.on("add_friend", function(username, id) {
        let playerId = id;
        if (playerId == "null") {
            socket.emit('redirect', '/client/login.html');
        } else {
            if (username != USERNAME_LIST[playerId]) {
                startSQL.query('INSERT INTO ' + USERNAME_LIST[playerId] + ' VALUES (\'' + username + '\')', function(error, results, fields) {
                    if (error) {
                        throw error;
                    }
                })
            }
        }
    })

    socket.on("search", function(username) {
        if (username != null) {
            startSQL.query('SELECT * FROM users AS data WHERE username = \'' + username + '\'', function(error, results, fields) {
                if (error) {
                    throw error;
                } else if (results.length == 0) {
                    socket.emit("bad_search");
                } else {
                    socket.emit("redirect", "/client/profile.html?player=" + username);
                }
            })
        } else {
            socket.emit("bad_search");
        }
    })
    socket.on('turnCheck', function(clickedBy) {

        let game = (games[players[clickedBy.id].gameId]);
        if (game.play_board[clickedBy.location] == "" && !game.board_full) {

            if (game.player1.id == clickedBy.id && game.player1.move == true) {
                game.play_board[clickedBy.location] = game.player1.symbol;
                console.log(game.play_board[clickedBy.location]);
                update(game);
                clickedBy.symbol = "X";
                socket.emit('update', clickedBy);
                SOCKET_LIST[game.player2.id].emit('update', clickedBy);
                check_for_winner(game);
            } else if (game.player2.id == clickedBy.id && game.player2.move) {
                game.play_board[clickedBy.location] = game.player2.symbol;
                update(game);
                clickedBy.symbol = "O";
                socket.emit('update', clickedBy);
                SOCKET_LIST[game.player1.id].emit('update', clickedBy);
                check_for_winner(game);
            }
        }
    })

    function update(game) {
        game.player1.move = !game.player1.move;
        game.player2.move = !game.player2.move;
        check_board_complete(game);


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
            startSQL.query('SELECT wins FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                if (error) {
                    throw error;
                } else {
                    startSQL.query('UPDATE leaderboard SET wins = ' + parseInt(results[0].wins) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                        if (error) {
                            throw error;
                        }
                    })
                }
            })
            startSQL.query('SELECT losses FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                if (error) {
                    throw error;
                } else {
                    startSQL.query('UPDATE leaderboard SET losses = ' + parseInt(results[0].losses) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                        if (error) {
                            throw error;
                        }
                    })
                }
            })
            socket.emit('gameEnd', 1);
            SOCKET_LIST[game.player2.id].emit('gameEnd', 1);
            game.board_full = true
            gameEnd(game);

        } else if (res == game.player2.symbol) {
            startSQL.query('SELECT wins FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                if (error) {
                    throw error;
                } else {
                    startSQL.query('UPDATE leaderboard SET wins = ' + parseInt(results[0].wins) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                        if (error) {
                            throw error;
                        }
                    })
                }
            })
            startSQL.query('SELECT losses FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                if (error) {
                    throw error;
                } else {
                    startSQL.query('UPDATE leaderboard SET losses = ' + parseInt(results[0].losses) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                        if (error) {
                            throw error;
                        }
                    })
                }
            })
            socket.emit('gameEnd', 2);
            SOCKET_LIST[game.player1.id].emit('gameEnd', 2);
            game.board_full = true
            gameEnd(game);
        } else if (game.board_full) {
            startSQL.query('SELECT ties FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                if (error) {
                    throw error;
                } else {
                    startSQL.query('UPDATE leaderboard SET ties = ' + parseInt(results[0].ties) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                        if (error) {
                            throw error;
                        }
                    })
                }
            })
            startSQL.query('SELECT ties FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                if (error) {
                    throw error;
                } else {
                    startSQL.query('UPDATE leaderboard SET ties = ' + parseInt(results[0].ties) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                        if (error) {
                            throw error;
                        }
                    })
                }
            })
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

    socket.on('reset', function(playerId) {
        let game = (games[players[playerId].gameId]);
        game.play_board = ["", "", "", "", "", "", "", "", ""];
        game.board_full = false;
        game.player1.move = true;
        game.player2.move = false;
        socket.emit('reset');
    })


    //GAMEEND!!!!
    socket.on('disconnect', function() {


        if (players[SOCKETID_LIST[socket.id]] != null) {
            console.log("first case passed");
            if (games[players[SOCKETID_LIST[socket.id]].gameId] != null)
                console.log("second case passed");
            game = games[players[SOCKETID_LIST[socket.id]].gameId]
            if (SOCKETID_LIST[socket.id] == game.player1.id) {
                startSQL.query('SELECT wins FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        startSQL.query('UPDATE leaderboard SET wins = ' + parseInt(results[0].wins) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        })
                    }
                })
                startSQL.query('SELECT losses FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        startSQL.query('UPDATE leaderboard SET losses = ' + parseInt(results[0].losses) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        })
                    }
                })
                SOCKET_LIST[game.player2.id].emit("forfeit", 1);
                game.board_full = true;
                console.log("1 is gone");
                gameEnd(game);
            } else if (SOCKETID_LIST[socket.id] == game.player2.id) {
                startSQL.query('SELECT wins FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        startSQL.query('UPDATE leaderboard SET wins = ' + parseInt(results[0].wins) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        })
                    }
                })
                startSQL.query('SELECT losses FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        startSQL.query('UPDATE leaderboard SET losses = ' + parseInt(results[0].losses) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        })
                    }
                })
                SOCKET_LIST[game.player1.id].emit("forfeit", 2);
                game.board_full = true;
                console.log("2 is gone");
                gameEnd(game);
            }
            delete SOCKET_LIST[socket.id];
            delete SOCKET_LIST[socket.id];
        } else {
            currentGame = null;
        }
    });


    //GAMEEND!!!!
    socket.on('forfeit', function() {


        if (players[SOCKETID_LIST[socket.id]] != null) {
            console.log("first case passed");
            if (games[players[SOCKETID_LIST[socket.id]].gameId] != null)
                console.log("second case passed");
            game = games[players[SOCKETID_LIST[socket.id]].gameId]
            if (SOCKETID_LIST[socket.id] == game.player1.id) {
                startSQL.query('SELECT wins FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        startSQL.query('UPDATE leaderboard SET wins = ' + parseInt(results[0].wins) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        })
                    }
                })
                startSQL.query('SELECT losses FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        startSQL.query('UPDATE leaderboard SET losses = ' + parseInt(results[0].losses) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        })
                    }
                })
                SOCKET_LIST[game.player2.id].emit("forfeit", 1);
                socket.emit("forfeit", 1);
                game.board_full = true;
                console.log("1 is gone");
                gameEnd(game);
            } else if (SOCKETID_LIST[socket.id] == game.player2.id) {
                startSQL.query('SELECT wins FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        startSQL.query('UPDATE leaderboard SET wins = ' + parseInt(results[0].wins) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player1.id] + '\'', function(error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        })
                    }
                })
                startSQL.query('SELECT losses FROM leaderboard AS data WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                    if (error) {
                        throw error;
                    } else {
                        startSQL.query('UPDATE leaderboard SET losses = ' + parseInt(results[0].losses) + 1 + ' WHERE username = \'' + USERNAME_LIST[game.player2.id] + '\'', function(error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        })
                    }
                })
                SOCKET_LIST[game.player1.id].emit("forfeit", 2);
                socket.emit("forfeit", 2);
                game.board_full = true;
                console.log("2 is gone");
                gameEnd(game);
            }
            delete SOCKET_LIST[socket.id];
            delete SOCKET_LIST[socket.id];
        } else {
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