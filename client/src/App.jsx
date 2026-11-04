import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import LeaderboardModal from './components/LeaderboardModal';
import MatchHistoryModal from './components/MatchHistoryModal';
import ClashArena from './components/ClashArena';
import MoveCard from './components/MoveCard';
import ScoreBoard from './components/ScoreBoard';
import ModeSelector from './components/ModeSelector';
import RoomLobby from './components/RoomLobby';
import GameOverModal from './components/GameOverModal';
import { useAuth } from './context/AuthContext';
import { getSocket } from './services/socket';
import { matchApi } from './services/api';
import soundManager from './services/sound';
import { Shield, Sparkles, Zap, Award, Flame, Play, Square, RotateCcw } from 'lucide-react';

function determineWinner(m1, m2) {
  if (m1 === m2) return 'draw';
  if (m1 === 'timeout' && m2 === 'timeout') return 'draw';
  if (m1 === 'timeout') return 'p2';
  if (m2 === 'timeout') return 'p1';

  if (
    (m1 === 'rock' && m2 === 'scissors') ||
    (m1 === 'scissors' && m2 === 'paper') ||
    (m1 === 'paper' && m2 === 'rock')
  ) {
    return 'p1';
  }
  return 'p2';
}

export function App() {
  const { user, updateStatsLocally, refreshProfile } = useAuth();

  // Navigation & Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  // Game Mode & Config
  const [mode, setMode] = useState('pvc'); // 'pvc' (single-player) or 'pvp' (multiplayer)
  const [roundsCount, setRoundsCount] = useState(3); // 1, 3, 5
  const targetWins = Math.ceil(roundsCount / 2);

  // Single-Player (PvC) State
  const [pvcRound, setPvcRound] = useState(1);
  const [pvcP1Score, setPvcP1Score] = useState(0);
  const [pvcBotScore, setPvcBotScore] = useState(0);
  const [pvcP1Move, setPvcP1Move] = useState(null);
  const [pvcBotMove, setPvcBotMove] = useState(null);
  const [pvcP1Locked, setPvcP1Locked] = useState(false);
  const [pvcBotLocked, setPvcBotLocked] = useState(false);
  const [pvcRoundResult, setPvcRoundResult] = useState(null); // 'p1', 'p2', 'draw'
  const [pvcIsClashing, setPvcIsClashing] = useState(false);
  const [pvcTimeLeft, setPvcTimeLeft] = useState(5);
  const [pvcRoundsHistory, setPvcRoundsHistory] = useState([]);
  const [pvcMatchWinner, setPvcMatchWinner] = useState(null);
  const [pvcGameState, setPvcGameState] = useState('idle'); // 'idle', 'playing', 'paused'
  const pvcGameStateRef = useRef('idle');

  const updatePvcGameState = (newState) => {
    pvcGameStateRef.current = newState;
    setPvcGameState(newState);
  };

  // Multiplayer (PvP) State via Socket.IO
  const [room, setRoom] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [pvpRound, setPvpRound] = useState(1);
  const [pvpScores, setPvpScores] = useState({ p1: 0, p2: 0 });
  const [pvpMyMove, setPvpMyMove] = useState(null);
  const [pvpOpponentMove, setPvpOpponentMove] = useState(null);
  const [pvpMyLocked, setPvpMyLocked] = useState(false);
  const [pvpOppLocked, setPvpOppLocked] = useState(false);
  const [pvpRoundResult, setPvpRoundResult] = useState(null);
  const [pvpIsClashing, setPvpIsClashing] = useState(false);
  const [pvpTimeLeft, setPvpTimeLeft] = useState(10);
  const [pvpRoundsHistory, setPvpRoundsHistory] = useState([]);
  const [pvpMatchWinner, setPvpMatchWinner] = useState(null);
  const [pvpRematchWaiting, setPvpRematchWaiting] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState(null);
  const [forfeitMessage, setForfeitMessage] = useState(null);

  const pvcTimerRef = useRef(null);

  // Handle browser tab/window exit - stops active games immediately
  useEffect(() => {
    const handleBrowserExit = () => {
      if (room?.roomCode) {
        const socket = getSocket();
        socket.emit('leave_room', { roomCode: room.roomCode });
      }
      if (pvcTimerRef.current) {
        clearInterval(pvcTimerRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBrowserExit);
    window.addEventListener('pagehide', handleBrowserExit);
    return () => {
      window.removeEventListener('beforeunload', handleBrowserExit);
      window.removeEventListener('pagehide', handleBrowserExit);
    };
  }, [room]);

  // ----------------------------------------------------
  // SINGLE-PLAYER (PvC) LOGIC
  // ----------------------------------------------------

  // Start round timer for PvC
  const startPvcRound = () => {
    if (pvcTimerRef.current) clearInterval(pvcTimerRef.current);

    setPvcP1Move(null);
    setPvcBotMove(null);
    setPvcP1Locked(false);
    setPvcBotLocked(false);
    setPvcRoundResult(null);
    setPvcIsClashing(false);
    setPvcTimeLeft(5);

    pvcTimerRef.current = setInterval(() => {
      setPvcTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(pvcTimerRef.current);
          handlePvcTimeout();
          return 0;
        }
        if (prev <= 3) {
          soundManager.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start Game Button Handler
  const handleStartPvcGame = () => {
    soundManager.playSelect();
    updatePvcGameState('playing');
    startPvcRound();
  };

  // Stop Game Button Handler
  const handleStopPvcGame = () => {
    soundManager.playSelect();
    if (pvcTimerRef.current) {
      clearInterval(pvcTimerRef.current);
      pvcTimerRef.current = null;
    }
    updatePvcGameState('paused');
  };

  // Resume Game Handler
  const handleResumePvcGame = () => {
    soundManager.playSelect();
    updatePvcGameState('playing');

    if (pvcTimerRef.current) clearInterval(pvcTimerRef.current);
    pvcTimerRef.current = setInterval(() => {
      setPvcTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(pvcTimerRef.current);
          handlePvcTimeout();
          return 0;
        }
        if (prev <= 3) {
          soundManager.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Reset / Restart Game Handler
  const handleResetPvcGame = () => {
    soundManager.playSelect();
    if (pvcTimerRef.current) clearInterval(pvcTimerRef.current);
    setShowGameOver(false);
    updatePvcGameState('idle');
    setPvcRound(1);
    setPvcP1Score(0);
    setPvcBotScore(0);
    setPvcP1Move(null);
    setPvcBotMove(null);
    setPvcP1Locked(false);
    setPvcBotLocked(false);
    setPvcRoundResult(null);
    setPvcIsClashing(false);
    setPvcTimeLeft(5);
    setPvcRoundsHistory([]);
    setPvcMatchWinner(null);
  };

  // Bot AI move decider
  const getBotMove = () => {
    const moves = ['rock', 'paper', 'scissors'];
    // Smart tactical AI with slight random noise
    if (pvcRoundsHistory.length > 0 && Math.random() > 0.3) {
      const lastPlayerMove = pvcRoundsHistory[pvcRoundsHistory.length - 1].p1Move;
      // Counters the player's last move
      if (lastPlayerMove === 'rock') return 'paper';
      if (lastPlayerMove === 'paper') return 'scissors';
      if (lastPlayerMove === 'scissors') return 'rock';
    }
    return moves[Math.floor(Math.random() * moves.length)];
  };

  // Submit move in PvC
  const handlePvcMoveSelect = (selectedMove) => {
    // If paused, disallow moves
    if (pvcGameStateRef.current === 'paused') return;

    // If idle, auto-start into playing mode and lock move
    if (pvcGameStateRef.current === 'idle') {
      updatePvcGameState('playing');
    }

    if (pvcP1Locked || pvcIsClashing || pvcRoundResult) return;
    if (pvcTimerRef.current) clearInterval(pvcTimerRef.current);

    setPvcP1Move(selectedMove);
    setPvcP1Locked(true);

    // Bot decides move simultaneously with tiny delay for realism
    const botDecision = getBotMove();
    setPvcBotLocked(true);

    // Trigger clash sequence
    triggerPvcClash(selectedMove, botDecision);
  };

  // Timeout handler in PvC
  const handlePvcTimeout = () => {
    if (pvcP1Locked || pvcIsClashing) return;
    const playerMove = pvcP1Move || 'timeout';
    const botDecision = getBotMove();

    setPvcP1Move(playerMove);
    setPvcBotMove(botDecision);
    setPvcP1Locked(true);
    setPvcBotLocked(true);

    triggerPvcClash(playerMove, botDecision);
  };

  // Trigger clash animations & resolve round in PvC
  const triggerPvcClash = (pMove, bMove) => {
    setPvcIsClashing(true);
    soundManager.playClash();

    setTimeout(() => {
      setPvcIsClashing(false);
      setPvcBotMove(bMove);

      const result = determineWinner(pMove, bMove);
      setPvcRoundResult(result);

      let nextP1Score = pvcP1Score;
      let nextBotScore = pvcBotScore;

      if (result === 'p1') {
        nextP1Score += 1;
        setPvcP1Score(nextP1Score);
        soundManager.playWin();
      } else if (result === 'p2') {
        nextBotScore += 1;
        setPvcBotScore(nextBotScore);
        soundManager.playLose();
      } else {
        soundManager.playDraw();
      }

      const summary = {
        roundNumber: pvcRound,
        p1Move: pMove,
        p2Move: bMove,
        result,
      };

      const updatedHistory = [...pvcRoundsHistory, summary];
      setPvcRoundsHistory(updatedHistory);

      // Check series match victory
      if (nextP1Score >= targetWins || nextBotScore >= targetWins) {
        const isUserWinner = nextP1Score >= targetWins;
        const winnerObj = isUserWinner
          ? { id: user?._id || user?.id || 'player', username: user?.username || 'You', avatar: user?.avatar || 'robot' }
          : { id: 'bot_ai', username: 'CyberBot 3000', avatar: 'robot' };

        setPvcMatchWinner(winnerObj);

        // Record completed match in backend
        matchApi
          .recordMatch({
            mode: 'pvc',
            targetWins,
            player1: {
              id: user?._id || user?.id || 'guest_p1',
              username: user?.username || 'You',
              score: nextP1Score,
              isGuest: !!user?.isGuest,
            },
            player2: {
              id: 'bot_ai',
              username: 'CyberBot 3000',
              score: nextBotScore,
              isBot: true,
              isGuest: false,
            },
            winner: winnerObj,
            rounds: updatedHistory,
            status: 'completed',
          })
          .catch((e) => console.error('Failed to record PvC match:', e));

        updateStatsLocally(isUserWinner ? 'win' : 'loss');

        setTimeout(() => {
          setShowGameOver(true);
        }, 1200);
      } else {
        // Next round after brief review - only if user hasn't clicked stop
        setTimeout(() => {
          if (pvcGameStateRef.current === 'playing') {
            setPvcRound((r) => r + 1);
            startPvcRound();
          }
        }, 2600);
      }
    }, 600);
  };

  // Reset PvC match and restart combat
  const resetPvcMatch = () => {
    setShowGameOver(false);
    setPvcRound(1);
    setPvcP1Score(0);
    setPvcBotScore(0);
    setPvcP1Move(null);
    setPvcBotMove(null);
    setPvcP1Locked(false);
    setPvcBotLocked(false);
    setPvcRoundResult(null);
    setPvcIsClashing(false);
    setPvcRoundsHistory([]);
    setPvcMatchWinner(null);
    updatePvcGameState('playing');
    startPvcRound();
  };

  // ----------------------------------------------------
  // MULTIPLAYER (PvP) SOCKET.IO LOGIC
  // ----------------------------------------------------
  useEffect(() => {
    const socket = getSocket();

    socket.on('room_created', ({ roomCode, room: newRoom }) => {
      setRoom(newRoom);
      setIsInRoom(true);
      setIsWaitingForOpponent(true);
      setRoomError('');
    });

    socket.on('error_message', ({ message }) => {
      setRoomError(message || 'Could not join the room. Check the code and try again.');
    });

    socket.on('room_ready', ({ room: activeRoom }) => {
      setRoom(activeRoom);
      setIsInRoom(true);
      setIsWaitingForOpponent(false);
      setRoomError('');
      setPvpRound(activeRoom.currentRound || 1);
      setPvpScores({
        p1: activeRoom.player1?.score || 0,
        p2: activeRoom.player2?.score || 0,
      });
      setPvpMyMove(null);
      setPvpOpponentMove(null);
      setPvpMyLocked(false);
      setPvpOppLocked(false);
      setPvpRoundResult(null);
      soundManager.playWin();
    });

    socket.on('round_started', ({ roundNumber, timeLeft, scores }) => {
      setPvpRound(roundNumber);
      setPvpTimeLeft(timeLeft);
      setPvpScores(scores);
      setPvpMyMove(null);
      setPvpOpponentMove(null);
      setPvpMyLocked(false);
      setPvpOppLocked(false);
      setPvpRoundResult(null);
      setPvpIsClashing(false);
    });

    socket.on('timer_tick', ({ timeLeft }) => {
      setPvpTimeLeft(timeLeft);
      if (timeLeft <= 3) {
        soundManager.playCountdownTick();
      }
    });

    socket.on('player_locked_in', ({ playerId }) => {
      const socketId = socket.id;
      const isMe = (room?.player1?.socketId === socketId && room?.player1?.id === playerId) ||
                   (room?.player2?.socketId === socketId && room?.player2?.id === playerId);
      if (isMe) {
        setPvpMyLocked(true);
      } else {
        setPvpOppLocked(true);
      }
    });

    socket.on('round_result', ({ roundSummary, scores, matchEnded, winner }) => {
      setPvpIsClashing(true);
      soundManager.playClash();

      setTimeout(() => {
        setPvpIsClashing(false);
        setPvpScores(scores);

        const amIPlayer1 = room?.player1?.id === (user?._id || user?.id);
        const myMove = amIPlayer1 ? roundSummary.p1Move : roundSummary.p2Move;
        const oppMove = amIPlayer1 ? roundSummary.p2Move : roundSummary.p1Move;

        setPvpMyMove(myMove);
        setPvpOpponentMove(oppMove);

        let myResult = 'draw';
        if (roundSummary.result === 'p1') {
          myResult = amIPlayer1 ? 'p1' : 'p2';
        } else if (roundSummary.result === 'p2') {
          myResult = amIPlayer1 ? 'p2' : 'p1';
        }

        setPvpRoundResult(myResult);

        if (myResult === 'p1') soundManager.playWin();
        else if (myResult === 'p2') soundManager.playLose();
        else soundManager.playDraw();

        setPvpRoundsHistory((prev) => [...prev, roundSummary]);
      }, 500);
    });

    socket.on('game_over', ({ winner, scores, roundsHistory }) => {
      setPvpMatchWinner(winner);
      setPvpScores(scores);
      setPvpRoundsHistory(roundsHistory);

      const isMyWin = winner?.id === (user?._id || user?.id);
      updateStatsLocally(isMyWin ? 'win' : 'loss');
      refreshProfile();

      setTimeout(() => {
        setShowGameOver(true);
      }, 1500);
    });

    socket.on('player_forfeited', ({ winner, message }) => {
      setPvpMatchWinner(winner);
      setForfeitMessage(message || 'Opponent exited the browser. Match terminated!');
      setShowGameOver(true);
      soundManager.playWin();
    });

    socket.on('opponent_left', ({ message }) => {
      setForfeitMessage(message || 'The other player closed their browser. Game stopped.');
      setShowGameOver(true);
      setRoom(null);
      setIsInRoom(false);
      setIsWaitingForOpponent(false);
    });

    socket.on('reaction_received', ({ emoji }) => {
      setFloatingReaction(emoji);
      setTimeout(() => setFloatingReaction(null), 2500);
    });

    socket.on('rematch_started', ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
      setShowGameOver(false);
      setPvpRematchWaiting(false);
      setPvpScores({ p1: 0, p2: 0 });
      setPvpRoundsHistory([]);
      setPvpMyMove(null);
      setPvpOpponentMove(null);
      setPvpMyLocked(false);
      setPvpOppLocked(false);
      setPvpRoundResult(null);
    });

    return () => {
      socket.off('room_created');
      socket.off('error_message');
      socket.off('room_ready');
      socket.off('round_started');
      socket.off('timer_tick');
      socket.off('player_locked_in');
      socket.off('round_result');
      socket.off('game_over');
      socket.off('player_forfeited');
      socket.off('reaction_received');
      socket.off('rematch_started');
    };
  }, [room, user]);

  // PvP Actions
  const handleCreateRoom = (targetW, count) => {
    setRoomError('');
    const socket = getSocket();
    socket.emit('create_room', {
      user: {
        id: user?._id || user?.id,
        username: user?.username,
        avatar: user?.avatar,
        isGuest: user?.isGuest,
      },
      targetWins: targetW,
      roundsCount: count,
    });
  };

  const handleJoinRoom = (code) => {
    setRoomError('');
    const socket = getSocket();
    socket.emit('join_room', {
      roomCode: code,
      user: {
        id: user?._id || user?.id,
        username: user?.username,
        avatar: user?.avatar,
        isGuest: user?.isGuest,
      },
    });
  };

  const handlePvpMoveSelect = (selectedMove) => {
    if (pvpMyLocked || pvpIsClashing || pvpRoundResult || !room) return;
    const socket = getSocket();
    setPvpMyMove(selectedMove);
    setPvpMyLocked(true);
    socket.emit('submit_move', {
      roomCode: room.roomCode,
      move: selectedMove,
    });
  };

  const handleSendReaction = (emoji) => {
    if (!room) return;
    const socket = getSocket();
    socket.emit('send_reaction', {
      roomCode: room.roomCode,
      emoji,
    });
  };

  const handleRequestRematch = () => {
    if (!room) return;
    setPvpRematchWaiting(true);
    const socket = getSocket();
    socket.emit('request_rematch', { roomCode: room.roomCode });
  };

  const handleLeaveRoom = () => {
    setRoomError('');
    if (room) {
      const socket = getSocket();
      socket.emit('leave_room', { roomCode: room.roomCode });
    }
    setRoom(null);
    setIsInRoom(false);
    setIsWaitingForOpponent(false);
    setShowGameOver(false);
  };

  // Keyboard shortcut handlers for 1, 2, 3 or R, P, S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();

      if (key === '1' || key === 'r') {
        if (mode === 'pvc') handlePvcMoveSelect('rock');
        else if (isInRoom && !isWaitingForOpponent) handlePvpMoveSelect('rock');
      } else if (key === '2' || key === 'p') {
        if (mode === 'pvc') handlePvcMoveSelect('paper');
        else if (isInRoom && !isWaitingForOpponent) handlePvpMoveSelect('paper');
      } else if (key === '3' || key === 's') {
        if (mode === 'pvc') handlePvcMoveSelect('scissors');
        else if (isInRoom && !isWaitingForOpponent) handlePvpMoveSelect('scissors');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Reset or initialize PvC state on mode or round count switch
  useEffect(() => {
    if (mode === 'pvc') {
      if (pvcTimerRef.current) clearInterval(pvcTimerRef.current);
      updatePvcGameState('idle');
      setPvcRound(1);
      setPvcP1Score(0);
      setPvcBotScore(0);
      setPvcP1Move(null);
      setPvcBotMove(null);
      setPvcP1Locked(false);
      setPvcBotLocked(false);
      setPvcRoundResult(null);
      setPvcIsClashing(false);
      setPvcTimeLeft(5);
      setPvcRoundsHistory([]);
      setPvcMatchWinner(null);
    }
    return () => {
      if (pvcTimerRef.current) clearInterval(pvcTimerRef.current);
    };
  }, [mode, roundsCount]);

  // Determine current active duel data
  const isPvc = mode === 'pvc';
  const currentP1 = isPvc
    ? { id: user?._id || user?.id, username: user?.username || 'You', avatar: user?.avatar || 'robot', score: pvcP1Score }
    : { id: user?._id || user?.id, username: user?.username || 'You', avatar: user?.avatar || 'robot', score: pvpScores.p1 };

  const currentP2 = isPvc
    ? { id: 'bot_ai', username: 'CyberBot AI', avatar: 'robot', isBot: true, score: pvcBotScore }
    : { id: room?.player2?.id || 'opp', username: room?.player2?.username || 'Opponent', avatar: room?.player2?.avatar || 'ninja', score: pvpScores.p2 };

  const currentP1Move = isPvc ? (pvcRoundResult ? pvcP1Move : null) : pvpMyMove;
  const currentP2Move = isPvc ? (pvcRoundResult ? pvcBotMove : null) : pvpOpponentMove;
  const currentP1Locked = isPvc ? pvcP1Locked : pvpMyLocked;
  const currentP2Locked = isPvc ? pvcBotLocked : pvpOppLocked;
  const currentRoundResult = isPvc ? pvcRoundResult : pvpRoundResult;
  const currentIsClashing = isPvc ? pvcIsClashing : pvpIsClashing;
  const currentTimeLeft = isPvc ? pvcTimeLeft : pvpTimeLeft;
  const currentRoundNum = isPvc ? pvcRound : pvpRound;
  const currentRoundsHistory = isPvc ? pvcRoundsHistory : pvpRoundsHistory;

  const currentMatchWinner = isPvc ? pvcMatchWinner : pvpMatchWinner;
  const isMyMatchWin = currentMatchWinner && (currentMatchWinner.id === (user?._id || user?.id) || currentMatchWinner.username === user?.username);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      {/* Navbar Header */}
      <Navbar
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5 sm:gap-6 relative">
        
        {/* Floating Reaction Emoji Popup */}
        {floatingReaction && (
          <div className="fixed top-24 right-8 z-50 text-6xl animate-bounce drop-shadow-[0_0_20px_rgba(255,0,127,0.8)] pointer-events-none">
            {floatingReaction}
          </div>
        )}

        {/* Mode Selector */}
        <ModeSelector
          mode={mode}
          setMode={(m) => {
            if (m === 'pvc' && isInRoom) {
              handleLeaveRoom();
            }
            setMode(m);
          }}
          roundsCount={roundsCount}
          setRoundsCount={(rc) => {
            setRoundsCount(rc);
          }}
          disabled={isInRoom && !isWaitingForOpponent}
        />

        {/* If PvP and not inside active game, show Room Lobby */}
        {!isPvc && (!isInRoom || isWaitingForOpponent) ? (
          <RoomLobby
            room={room}
            isInRoom={isInRoom}
            isWaitingForOpponent={isWaitingForOpponent}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onLeaveRoom={handleLeaveRoom}
            onSendReaction={handleSendReaction}
            errorMessage={roomError}
            onClearError={() => setRoomError('')}
          />
        ) : (
          <>
            {/* Arena Game Control Bar with Start & Stop Buttons */}
            <div className="w-full p-3 sm:p-4 rounded-2xl bg-[#090e1a] border border-[#1f2b48] flex flex-wrap items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center space-x-3">
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    isPvc
                      ? pvcGameState === 'playing'
                        ? 'bg-emerald-400 animate-pulse shadow-md shadow-emerald-500/50'
                        : pvcGameState === 'paused'
                        ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                        : 'bg-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-cyan-400 animate-pulse shadow-md shadow-cyan-500/50'
                  }`}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-arcade font-bold tracking-wider text-slate-200">
                      {isPvc
                        ? pvcGameState === 'playing'
                          ? 'BATTLE IN PROGRESS'
                          : pvcGameState === 'paused'
                          ? 'GAME STOPPED (PAUSED)'
                          : 'ARENA STANDBY (READY)'
                        : 'MULTIPLAYER DUEL LIVE'}
                    </span>
                    <span
                      className={`text-[9px] font-arcade px-1.5 py-0.2 rounded font-bold uppercase ${
                        isPvc
                          ? pvcGameState === 'playing'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : pvcGameState === 'paused'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {isPvc ? pvcGameState : 'Live'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-tech">
                    {isPvc
                      ? pvcGameState === 'playing'
                        ? 'Select rock, paper, or scissors before the round timer expires!'
                        : pvcGameState === 'paused'
                        ? 'Game is halted. Click Resume to continue or Restart for a new match.'
                        : 'Click "Start Game" to commence combat, or select any move.'
                      : `Duel with ${room?.player2?.username || 'Opponent'} • Room Code: ${room?.roomCode || ''}`}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Start Game, Stop Game, Resume, Restart */}
              <div className="flex items-center space-x-2">
                {isPvc ? (
                  <>
                    {pvcGameState === 'idle' && (
                      <button
                        onClick={handleStartPvcGame}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-arcade font-bold text-xs sm:text-sm tracking-wider shadow-xl shadow-emerald-500/30 flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>START GAME</span>
                      </button>
                    )}

                    {pvcGameState === 'playing' && (
                      <button
                        onClick={handleStopPvcGame}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-rose-700 hover:from-rose-500 hover:to-red-400 text-white font-arcade font-bold text-xs sm:text-sm tracking-wider shadow-xl shadow-rose-600/30 flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>STOP GAME</span>
                      </button>
                    )}

                    {pvcGameState === 'paused' && (
                      <button
                        onClick={handleResumePvcGame}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-arcade font-bold text-xs sm:text-sm tracking-wider shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5 transition-all active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>RESUME GAME</span>
                      </button>
                    )}

                    <button
                      onClick={handleResetPvcGame}
                      title="Reset series back to Round 1"
                      className="px-3.5 py-2.5 rounded-xl bg-[#141d33] hover:bg-[#1a2540] border border-[#233052] text-slate-300 hover:text-white font-arcade text-xs tracking-wider flex items-center space-x-1 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">RESET</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLeaveRoom}
                    className="px-4 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 font-arcade text-xs tracking-wider flex items-center space-x-1.5 transition-all shadow-md shadow-rose-950/30"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-300" />
                    <span>STOP DUEL</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid w-full gap-5 md:grid-cols-[minmax(0,1fr)_190px] md:items-stretch md:gap-4">
              {/* Arena Stage */}
              <div className="md:order-1">
                <ClashArena
                  player1={currentP1}
                  player2={currentP2}
                  p1Move={currentP1Move}
                  p2Move={currentP2Move}
                  p1Locked={currentP1Locked}
                  p2Locked={currentP2Locked}
                  roundResult={currentRoundResult}
                  isClashing={currentIsClashing}
                  timeLeft={currentTimeLeft}
                  maxTime={isPvc ? 5 : 10}
                  roundNumber={currentRoundNum}
                  gameState={isPvc ? pvcGameState : (isInRoom && !isWaitingForOpponent ? 'playing' : 'idle')}
                  onStartGame={handleStartPvcGame}
                  onStopGame={handleStopPvcGame}
                  onResumeGame={handleResumePvcGame}
                  onResetGame={handleResetPvcGame}
                  mode={mode}
                />
              </div>

              {/* Move Selection Cards */}
              <div className="move-selector w-full md:order-2">
                <div className="flex items-center justify-between gap-2 mb-2 px-1 md:flex-col md:items-start">
                  <span className="text-xs font-arcade font-bold tracking-wider text-slate-300 uppercase">
                    DEPLOY YOUR MOVE
                  </span>
                  <span className="text-[11px] text-slate-400 font-tech lg:leading-relaxed">
                    {isPvc && pvcGameState === 'paused' ? (
                      <span className="text-rose-400">Game Stopped. Click Resume to play.</span>
                    ) : isPvc && pvcGameState === 'idle' ? (
                      <span className="text-amber-400">Click START GAME or pick a move</span>
                    ) : (
                      <>Tip: Press keys <span className="text-cyan-400 font-mono">[1]</span>, <span className="text-pink-400 font-mono">[2]</span>, or <span className="text-amber-400 font-mono">[3]</span></>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-1">
                  <MoveCard
                    move="rock"
                    label="ROCK"
                    keyNumber="1"
                    selected={(isPvc ? pvcP1Move : pvpMyMove) === 'rock'}
                    disabled={isPvc ? (pvcGameState === 'paused' || pvcP1Locked || pvcIsClashing) : (pvpMyLocked || pvpIsClashing)}
                    onClick={(m) => (isPvc ? handlePvcMoveSelect(m) : handlePvpMoveSelect(m))}
                    accentColor="cyan"
                  />
                  <MoveCard
                    move="paper"
                    label="PAPER"
                    keyNumber="2"
                    selected={(isPvc ? pvcP1Move : pvpMyMove) === 'paper'}
                    disabled={isPvc ? (pvcGameState === 'paused' || pvcP1Locked || pvcIsClashing) : (pvpMyLocked || pvpIsClashing)}
                    onClick={(m) => (isPvc ? handlePvcMoveSelect(m) : handlePvpMoveSelect(m))}
                    accentColor="pink"
                  />
                  <MoveCard
                    move="scissors"
                    label="SCISSORS"
                    keyNumber="3"
                    selected={(isPvc ? pvcP1Move : pvpMyMove) === 'scissors'}
                    disabled={isPvc ? (pvcGameState === 'paused' || pvcP1Locked || pvcIsClashing) : (pvpMyLocked || pvpIsClashing)}
                    onClick={(m) => (isPvc ? handlePvcMoveSelect(m) : handlePvpMoveSelect(m))}
                    accentColor="amber"
                  />
                </div>
              </div>
            </div>

            {/* Series Scoreboard and Logs */}
            <ScoreBoard
              player1={currentP1}
              player2={currentP2}
              targetWins={isPvc ? targetWins : (room?.targetWins || targetWins)}
              roundsCount={isPvc ? roundsCount : (room?.roundsCount || roundsCount)}
              roundsHistory={currentRoundsHistory}
              mode={mode}
            />

            {/* In PvP Room: Emotes Row */}
            {!isPvc && isInRoom && !isWaitingForOpponent && (
              <RoomLobby
                room={room}
                isInRoom={isInRoom}
                isWaitingForOpponent={isWaitingForOpponent}
                onSendReaction={handleSendReaction}
                onLeaveRoom={handleLeaveRoom}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-[#1a233a] bg-[#070a12]/80 text-center text-xs text-slate-500 font-tech">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MERN Stack + Socket.IO + Web Audio API Synthesizers</span>
          </div>
          <span>CLASH RPS ARENA • READY FOR MULTIPLAYER BATTLES</span>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <MatchHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <GameOverModal
        isOpen={showGameOver}
        winner={currentMatchWinner}
        isMyWin={isMyMatchWin}
        scores={isPvc ? { p1: pvcP1Score, p2: pvcBotScore } : pvpScores}
        player1={currentP1}
        player2={currentP2}
        roundsHistory={currentRoundsHistory}
        mode={mode}
        onPlayAgain={isPvc ? resetPvcMatch : handleRequestRematch}
        onExitLobby={() => {
          setShowGameOver(false);
          setForfeitMessage(null);
          if (!isPvc) handleLeaveRoom();
        }}
        rematchWaiting={pvpRematchWaiting}
        forfeitMessage={forfeitMessage}
      />

    </div>
  );
}

export default App;
