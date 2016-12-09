/*global unexpected:true, boardToJS*/
process.env.UNEXPECTED_DEPTH = '4';
unexpected = require('unexpected');
unexpected.output.preferredWidth = 75;

const jsdom = require('jsdom').jsdom;
global.document = jsdom('');
global.window = global.document.defaultView;

const unexpectedReact = require('unexpected-react')
require('react')
unexpected.use(unexpectedReact)

const Game = require('tic-tac-toe-js/lib/game')

unexpected.addType({
  name: 'tictactoe',
  base: 'object',
  identify: (value) => value instanceof Game,
  inspect: (value, depth, output) => output.text(value.toString())
})

boardToJS = function boardToJS (board) {
  return board.split('--+---+--').map(r => (
    r.split('|').map(c => c.replace(/\s*/g, ''))
  ))
}

unexpected.addStyle('board', function (title, cb) {
  this.block((output) => {
    if (title && cb) {
      output.gray(title).nl()
    } else {
      cb = title
    }

    for (var i = 0; i < 3; i += 1) {
      if (i > 0) output.nl().text('--+---+--').nl()

      for (var j = 0; j < 3; j += 1) {
        if (j > 0) output.text(' | ')
        cb.call(output, output, i, j)
      }
    }
  })
})

unexpected.addStyle('boardDiff', function (expected, actual) {
  this.board('Expected', (output, i, j) => {
    const a = actual[i][j], e = expected[i][j]
    output[a === e ? 'text' : 'success'](e || ' ')
  }).sp(3).board('Actual', (output, i, j) => {
    const a = actual[i][j], e = expected[i][j]
    output[a === e ? 'text' : 'error'](a || ' ')
  })
})

unexpected.addAssertion('<string> when placing (X|O) at position <number> <assertion>', (expect, board, position) => {
  const game = new Game()

  const boardBeforeChange = boardToJS(board)

  boardBeforeChange.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell) {
        game.move(cell, i * 3 + j + 1)
      }
    })
  })

  const player = expect.alternations[0]
  game.move(player, position)

  expect.errorMode = 'bubble'
  expect.withError(() => {
    expect.shift(game)
  }, (err) => {
    expect.fail((output) => {
      output
        .error('When placing ').jsString(player)
        .error(' at position ').jsNumber(position)
        .error(' on board:').nl()
        .board((output, i, j) => {
          if (i * 3 + j + 1 === position) {
            if (boardBeforeChange[i][j]) {
              output.text(boardBeforeChange[i][j], 'bg#bbb')
            } else {
              output.text(player, '#aaa')
            }
          } else {
            output.text(boardBeforeChange[i][j] || ' ')
          }

        }).nl(2)
        .appendErrorMessage(err)
    })
  })
})

unexpected.addAssertion('<tictactoe> to have (O|X) as the winner', (expect, game) => {
  expect.errorMode = 'nested'
  if (!game.winner) {
    expect.fail('the game is not finished yet')
  }

  if (game.winner !== expect.alternations[0]) {
    expect.fail('winner was {0}', game.winner)
  }
})
