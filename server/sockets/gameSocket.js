const storage = require('../services/storage');

// Helper to determine winner between two moves
function determineRoundWinner(p1Move, p2Move) {
  if (p1Move === p2Move) return 'draw';
  if (p1Move === 'timeout' && p2Move === 'timeout') return 'draw';
  if (p1Move === 'timeout') return 'p2';
  if (p2Move === 'timeout') return 'p1';

  if (
    (p1Move === 'rock' && p2Move === 'scissors') ||
    (p1Move === 'scissors' && p2Move === 'paper') ||
    (p1Move === 'paper' && p2Move === 'rock')
  ) {
    return 'p1';
  }
  return 'p2';
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const rooms = new Map();

function setupGameSocket(io) {
  io.on('connection', (socket) => {
    // Current room tracking on socket
    let currentRoomCode = null;

    // 1. Create Room
    socket.on('create_room', ({ user, targetWins = 2, roundsCount = 3 }) => {
      let roomCode = generateRoomCode();
      while (rooms.has(roomCode)) {
        roomCode = generateRoomCode();
      }

      const player1 = {
        socketId: socket.id,
        id: user?.id || user?._id || `guest_${socket.id.substring(0, 5)}`,
        username: user?.username || `Player_${socket.id.substring(0, 4)}`,
        avatar: user?.avatar || 'robot',
        isGuest: !!user?.isGuest,
        score: 0,
        currentMove: null,
        rematchReady: false,
      };

      const roomData = {
        roomCode,
        targetWins: Number(targetWins) || 2, // Best of 3 => 2 wins
        roundsCount: Number(roundsCount) || 3,
        status: 'waiting', // waiting, countdown, playing, round_result, game_over
        player1,
        player2: null,
        currentRound: 1,
        roundsHistory: [],
        roundTimer: null,
        timeLeft: 10,
      };

      rooms.set(roomCode, roomData);
      currentRoomCode = roomCode;
      socket.join(roomCode);

      socket.emit('room_created', {
        roomCode,
        room: sanitizeRoomForClient(roomData),
      });

      console.log(`[Socket] Room created: ${roomCode} by ${player1.username}`);
    });

    // 2. Join Room
    socket.on('join_room', ({ roomCode, user }) => {
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        return socket.emit('error_message', { message: 'Room not found. Check the code.' });
      }

      if (room.player2) {
        return socket.emit('error_message', { message: 'Room is already full.' });
      }

      if (room.player1.socketId === socket.id) {
        return socket.emit('error_message', { message: 'You are already in this room.' });
      }

      const player2 = {
        socketId: socket.id,
        id: user?.id || user?._id || `guest_${socket.id.substring(0, 5)}`,
        username: user?.username || `Player_${socket.id.substring(0, 4)}`,
        avatar: user?.avatar || 'ninja',
        isGuest: !!user?.isGuest,
        score: 0,
        currentMove: null,
        rematchReady: false,
      };

      room.player2 = player2;
      room.status = 'playing';
      currentRoomCode = code;
      socket.join(code);

      console.log(`[Socket] ${player2.username} joined room ${code}`);

      // Notify all players in room that match is starting
      io.to(code).emit('room_ready', {
        room: sanitizeRoomForClient(room),
      });

      // Start round 1 timer
      startRoundCountdown(io, room);
    });

    // 3. Submit Move
    socket.on('submit_move', ({ roomCode, move }) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'playing') return;

      const isP1 = room.player1.socketId === socket.id;
      const isP2 = room.player2 && room.player2.socketId === socket.id;

      if (!isP1 && !isP2) return;

      if (isP1) {
        room.player1.currentMove = move;
      } else {
        room.player2.currentMove = move;
      }

      // Notify other player that move has been locked in (without revealing which move!)
      io.to(roomCode).emit('player_locked_in', {
        playerId: isP1 ? room.player1.id : room.player2.id,
        playerNumber: isP1 ? 1 : 2,
      });

      // Check if both players have locked in moves
      if (room.player1.currentMove && room.player2.currentMove) {
        resolveRound(io, room);
      }
    });

    // 4. Send reaction emoji
    socket.on('send_reaction', ({ roomCode, emoji }) => {
      const room = rooms.get(roomCode);
      if (!room) return;
      io.to(roomCode).emit('reaction_received', {
        senderSocketId: socket.id,
        emoji,
      });
    });

    // 5. Request Rematch
    socket.on('request_rematch', ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const isP1 = room.player1.socketId === socket.id;
      const isP2 = room.player2 && room.player2.socketId === socket.id;

      if (isP1) room.player1.rematchReady = true;
      if (isP2) room.player2.rematchReady = true;

      io.to(roomCode).emit('rematch_status_update', {
        p1Ready: room.player1.rematchReady,
        p2Ready: room.player2 ? room.player2.rematchReady : false,
      });

      if (room.player1.rematchReady && room.player2 && room.player2.rematchReady) {
        // Reset game state for rematch
        room.player1.score = 0;
        room.player1.currentMove = null;
        room.player1.rematchReady = false;

        room.player2.score = 0;
        room.player2.currentMove = null;
        room.player2.rematchReady = false;

        room.currentRound = 1;
        room.roundsHistory = [];
        room.status = 'playing';

        io.to(roomCode).emit('rematch_started', {
          room: sanitizeRoomForClient(room),
        });

        startRoundCountdown(io, room);
      }
    });

    // 6. Handle Disconnect / Leave
    socket.on('disconnect', () => {
      if (currentRoomCode && rooms.has(currentRoomCode)) {
        handlePlayerExit(io, currentRoomCode, socket.id);
      }
    });

    socket.on('leave_room', ({ roomCode }) => {
      if (roomCode && rooms.has(roomCode)) {
        handlePlayerExit(io, roomCode, socket.id);
      }
    });
  });
}

function handlePlayerExit(io, roomCode, socketId) {
  const room = rooms.get(roomCode);
  if (!room) return;

  if (room.roundTimer) {
    clearInterval(room.roundTimer);
    room.roundTimer = null;
  }

  const isP1 = room.player1.socketId === socketId;
  const isP2 = room.player2 && room.player2.socketId === socketId;

  if (room.status === 'playing' || room.status === 'round_result') {
    // Forfeit win for remaining player
    const remainingWinner = isP1 ? room.player2 : room.player1;
    const forfeiter = isP1 ? room.player1 : room.player2;

    room.status = 'game_over';
    io.to(roomCode).emit('player_forfeited', {
      winner: remainingWinner ? { id: remainingWinner.id, username: remainingWinner.username } : null,
      forfeiter: forfeiter ? { id: forfeiter.id, username: forfeiter.username } : null,
      message: `${forfeiter ? forfeiter.username : 'Opponent'} disconnected. Victory by forfeit!`,
    });

    // Record forfeit match
    if (remainingWinner && forfeiter) {
      storage.recordMatch({
        mode: 'pvp',
        targetWins: room.targetWins,
        player1: { id: room.player1.id, username: room.player1.username, score: room.player1.score, isGuest: room.player1.isGuest },
        player2: { id: room.player2.id, username: room.player2.username, score: room.player2.score, isGuest: room.player2.isGuest },
        winner: { id: remainingWinner.id, username: remainingWinner.username },
        rounds: room.roundsHistory,
        status: 'forfeited',
      }).catch((e) => console.error('Error saving forfeit match:', e));
    }
  } else {
    io.to(roomCode).emit('opponent_left', {
      message: 'Opponent left the room.',
    });
  }

  rooms.delete(roomCode);
}

function startRoundCountdown(io, room) {
  if (room.roundTimer) {
    clearInterval(room.roundTimer);
  }

  room.timeLeft = 10;
  room.player1.currentMove = null;
  if (room.player2) room.player2.currentMove = null;
  room.status = 'playing';

  io.to(room.roomCode).emit('round_started', {
    roundNumber: room.currentRound,
    timeLeft: room.timeLeft,
    scores: {
      p1: room.player1.score,
      p2: room.player2.score,
    },
  });

  room.roundTimer = setInterval(() => {
    room.timeLeft -= 1;
    io.to(room.roomCode).emit('timer_tick', { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      clearInterval(room.roundTimer);
      room.roundTimer = null;

      // Handle timeouts
      if (!room.player1.currentMove) room.player1.currentMove = 'timeout';
      if (!room.player2.currentMove) room.player2.currentMove = 'timeout';

      resolveRound(io, room);
    }
  }, 1000);
}

function resolveRound(io, room) {
  if (room.roundTimer) {
    clearInterval(room.roundTimer);
    room.roundTimer = null;
  }

  const p1Move = room.player1.currentMove || 'timeout';
  const p2Move = room.player2.currentMove || 'timeout';

  const roundWinnerKey = determineRoundWinner(p1Move, p2Move);

  if (roundWinnerKey === 'p1') {
    room.player1.score += 1;
  } else if (roundWinnerKey === 'p2') {
    room.player2.score += 1;
  }

  const roundSummary = {
    roundNumber: room.currentRound,
    p1Move,
    p2Move,
    result: roundWinnerKey, // 'p1', 'p2', or 'draw'
  };

  room.roundsHistory.push(roundSummary);
  room.status = 'round_result';

  // Check if a player reached targetWins
  const p1WonMatch = room.player1.score >= room.targetWins;
  const p2WonMatch = room.player2.score >= room.targetWins;
  const matchEnded = p1WonMatch || p2WonMatch;

  io.to(room.roomCode).emit('round_result', {
    roundSummary,
    scores: {
      p1: room.player1.score,
      p2: room.player2.score,
    },
    matchEnded,
    winner: matchEnded ? (p1WonMatch ? room.player1 : room.player2) : null,
  });

  if (matchEnded) {
    room.status = 'game_over';
    const matchWinner = p1WonMatch ? room.player1 : room.player2;

    // Persist match in database
    storage.recordMatch({
      mode: 'pvp',
      targetWins: room.targetWins,
      player1: {
        id: room.player1.id,
        username: room.player1.username,
        score: room.player1.score,
        isGuest: room.player1.isGuest,
      },
      player2: {
        id: room.player2.id,
        username: room.player2.username,
        score: room.player2.score,
        isGuest: room.player2.isGuest,
      },
      winner: {
        id: matchWinner.id,
        username: matchWinner.username,
      },
      rounds: room.roundsHistory,
      status: 'completed',
    }).catch((err) => console.error('Failed to record PvP match:', err));

    // Update stats for authenticated players
    if (!room.player1.isGuest) {
      storage.updateUserStats(room.player1.id, p1WonMatch ? 'win' : 'loss').catch(() => {});
    }
    if (!room.player2.isGuest) {
      storage.updateUserStats(room.player2.id, p2WonMatch ? 'win' : 'loss').catch(() => {});
    }

    io.to(room.roomCode).emit('game_over', {
      winner: {
        id: matchWinner.id,
        username: matchWinner.username,
        avatar: matchWinner.avatar,
      },
      scores: {
        p1: room.player1.score,
        p2: room.player2.score,
      },
      roundsHistory: room.roundsHistory,
    });
  } else {
    // Schedule next round after 3.5s dramatic reveal & celebration animation
    setTimeout(() => {
      if (rooms.has(room.roomCode) && room.status === 'round_result') {
        room.currentRound += 1;
        startRoundCountdown(io, room);
      }
    }, 3500);
  }
}

// Strip sensitive data before sending room object to client
function sanitizeRoomForClient(room) {
  return {
    roomCode: room.roomCode,
    targetWins: room.targetWins,
    roundsCount: room.roundsCount,
    status: room.status,
    currentRound: room.currentRound,
    timeLeft: room.timeLeft,
    player1: {
      id: room.player1.id,
      username: room.player1.username,
      avatar: room.player1.avatar,
      score: room.player1.score,
      hasMoved: !!room.player1.currentMove,
    },
    player2: room.player2
      ? {
          id: room.player2.id,
          username: room.player2.username,
          avatar: room.player2.avatar,
          score: room.player2.score,
          hasMoved: !!room.player2.currentMove,
        }
      : null,
  };
}

module.exports = setupGameSocket;
