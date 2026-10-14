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
import { Shield, Sparkles, Zap, Award, Flame } from 'lucide-react';

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

  // Multiplayer (PvP) State via Socket.IO
  const [room, setRoom] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
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

  const pvcTimerRef = useRef(null);

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
        // Next round after brief review
        setTimeout(() => {
          setPvcRound((r) => r + 1);
          startPvcRound();
        }, 2600);
      }
    }, 600);
  };

  // Reset PvC match
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
    });

    socket.on('room_ready', ({ room: activeRoom }) => {
      setRoom(activeRoom);
      setIsInRoom(true);
      setIsWaitingForOpponent(false);
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
      setShowGameOver(true);
      soundManager.playWin();
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

  // Start initial PvC match round on mount
  useEffect(() => {
    if (mode === 'pvc') {
      startPvcRound();
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 relative">
        
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
          />
        ) : (
          <>
            {/* Arena Stage */}
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
            />

            {/* Move Selection Cards */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-arcade font-bold tracking-wider text-slate-300 uppercase">
                  DEPLOY YOUR MOVE
                </span>
                <span className="text-[11px] text-slate-400 font-tech">
                  Tip: Press keys <span className="text-cyan-400 font-mono">[1]</span>, <span className="text-pink-400 font-mono">[2]</span>, or <span className="text-amber-400 font-mono">[3]</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <MoveCard
                  move="rock"
                  label="ROCK"
                  icon="✊"
                  keyNumber="1"
                  selected={(isPvc ? pvcP1Move : pvpMyMove) === 'rock'}
                  disabled={isPvc ? pvcP1Locked || pvcIsClashing : pvpMyLocked || pvpIsClashing}
                  onClick={(m) => (isPvc ? handlePvcMoveSelect(m) : handlePvpMoveSelect(m))}
                  accentColor="cyan"
                />
                <MoveCard
                  move="paper"
                  label="PAPER"
                  icon="✋"
                  keyNumber="2"
                  selected={(isPvc ? pvcP1Move : pvpMyMove) === 'paper'}
                  disabled={isPvc ? pvcP1Locked || pvcIsClashing : pvpMyLocked || pvpIsClashing}
                  onClick={(m) => (isPvc ? handlePvcMoveSelect(m) : handlePvpMoveSelect(m))}
                  accentColor="pink"
                />
                <MoveCard
                  move="scissors"
                  label="SCISSORS"
                  icon="✌️"
                  keyNumber="3"
                  selected={(isPvc ? pvcP1Move : pvpMyMove) === 'scissors'}
                  disabled={isPvc ? pvcP1Locked || pvcIsClashing : pvpMyLocked || pvpIsClashing}
                  onClick={(m) => (isPvc ? handlePvcMoveSelect(m) : handlePvpMoveSelect(m))}
                  accentColor="amber"
                />
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
          if (!isPvc) handleLeaveRoom();
        }}
        rematchWaiting={pvpRematchWaiting}
      />

    </div>
  );
}

export default App;
