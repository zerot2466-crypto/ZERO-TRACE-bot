/**
 * ZERO TRACE BOT v5.0 - TicTacToe
 * .tictactoe @user → Jouer au morpion
 */
const activeGames = new Map();

function createBoard() {
  return ['1','2','3','4','5','6','7','8','9'];
}

function displayBoard(board) {
  return (
    `${board[0]} │ ${board[1]} │ ${board[2]}\n` +
    `──┼───┼──\n` +
    `${board[3]} │ ${board[4]} │ ${board[5]}\n` +
    `──┼───┼──\n` +
    `${board[6]} │ ${board[7]} │ ${board[8]}`
  );
}

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  if (board.every(c => c === '❌' || c === '⭕')) return 'draw';
  return null;
}

module.exports = {
  name: 'tictactoe',
  description: 'Jouer au morpion contre quelqu\'un',
  usage: '.tictactoe @user',
  category: 'fun',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, sender } = ctx;

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const opponent = mentions[0];

    if (!opponent) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Mentionne un adversaire : *.tictactoe @user*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (opponent === sender) {
      await antiBan.safeSend(sock, jid, { text: '❌ Tu ne peux pas jouer contre toi-même !' }, { msgOptions: { quoted: msg } });
      return;
    }

    const gameId = jid;
    const board  = createBoard();
    activeGames.set(gameId, {
      board,
      players: { '❌': sender, '⭕': opponent },
      currentTurn: sender,
      currentSymbol: '❌',
    });

    const p1 = sender.split('@')[0];
    const p2 = opponent.split('@')[0];

    await antiBan.safeSend(sock, jid, {
      text:
        `🎮 *TIC TAC TOE*\n\n` +
        `❌ *+${p1}* vs ⭕ *+${p2}*\n\n` +
        `${displayBoard(board)}\n\n` +
        `*C'est le tour de +${p1} (❌)*\n` +
        `Réponds avec un numéro (1-9) pour jouer.`,
      mentions: [sender, opponent],
    }, { msgOptions: { quoted: msg } });
  },

  // Gérer un coup joué
  async handleMove(sock, jid, msg, sender, body, antiBan) {
    const game = activeGames.get(jid);
    if (!game) return false;
    if (game.currentTurn !== sender) return false;

    const move = parseInt(body.trim()) - 1;
    if (isNaN(move) || move < 0 || move > 8) return false;
    if (game.board[move] === '❌' || game.board[move] === '⭕') return false;

    game.board[move] = game.currentSymbol;
    const winner = checkWinner(game.board);

    if (winner) {
      activeGames.delete(jid);
      const winnerJid = winner === 'draw' ? null : game.players[winner];
      const winText = winner === 'draw'
        ? '🤝 *Match nul !*'
        : `🏆 *+${winnerJid?.split('@')[0]} a gagné !*`;

      await antiBan.safeSend(sock, jid, {
        text:
          `🎮 *TIC TAC TOE — Fin de partie*\n\n` +
          `${displayBoard(game.board)}\n\n` +
          `${winText}\n\n> *ZERO TRACE BOT v5.0*`,
        mentions: winnerJid ? [winnerJid] : [],
      }, { msgOptions: { quoted: msg } });
    } else {
      // Changer de tour
      game.currentSymbol = game.currentSymbol === '❌' ? '⭕' : '❌';
      game.currentTurn   = game.players[game.currentSymbol];
      const nextNum      = game.currentTurn.split('@')[0];

      await antiBan.safeSend(sock, jid, {
        text:
          `🎮 *TIC TAC TOE*\n\n` +
          `${displayBoard(game.board)}\n\n` +
          `*C'est le tour de +${nextNum} (${game.currentSymbol})*`,
        mentions: [game.currentTurn],
      }, { msgOptions: { quoted: msg } });
    }
    return true;
  },

  activeGames,
};
