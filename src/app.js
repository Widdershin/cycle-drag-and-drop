import {div} from '@cycle/dom';
import _ from 'lodash';
import xs from 'xstream';

function Board () {
  return _.range(0, 8).map(() =>
    _.range(0, 8).map((square) => Square())
  );
}

function Square () {
  return {};
}

function hasKnight (knightPosition, rowIndex, squareIndex) {
  return rowIndex === knightPosition.x && squareIndex === knightPosition.y;
}

function legalMove (knightPosition, squareCoordinates) {
  if (_.isEqual(knightPosition, squareCoordinates)) { return false; }

  const moves = [
    {x: -2, y: -1},
    {x: -2, y: 1},
    {x: 2, y: -1},
    {x: 2, y: 1},
    {x: -1, y: -2},
    {x: -1, y: 2},
    {x: 1, y: -2},
    {x: 1, y: 2}
  ];

  const potentialMoves = moves.map(
    move => ({
      x: move.x + knightPosition.x,
      y: move.y + knightPosition.y
    })
  );

  const isLegal = potentialMoves.some(potentialMove => _.isEqual(potentialMove, squareCoordinates));

  return isLegal;
}

function renderRow (row, rowIndex, state) {
  return div('.row', row.map((square, index) => renderSquare(square, rowIndex, index, state)));
}

function highlightLegalSquare (state, rowIndex, squareIndex) {
  const currentSquare = {x: rowIndex, y: squareIndex};

  if (!_.isEqual(state.mouseIsOver, currentSquare)) { return; }

  return legalMove(state.knightPosition, currentSquare) && state.knightIsDragging;
}

function renderSquare (square, rowIndex, squareIndex, state) {
  const knight = hasKnight(state.knightPosition, rowIndex, squareIndex);
  const highlight = highlightLegalSquare(state, rowIndex, squareIndex);

  return div(
    `.square ${knight ? 'knight' : ''} ${highlight ? 'legal-move' : ''}`,
    {
      attrs: {
        'data-row': rowIndex,
        'data-col': squareIndex
      }
    }
  );
}

function renderDraggingKnight (isDragging, mousePosition) {
  if (!isDragging) {
    return div();
  }

  const style = {
    top: `${mousePosition.y - 10}px`,
    left: `${mousePosition.x + 10}px`,
  };

  return div('.square .draggingKnight', {style});
}

function view (state) {
  return div(
    '.container',
    [
      renderDraggingKnight(state.knightIsDragging, state.mousePosition),
      div(
        '.board',
        state.board.map((row, index) => renderRow(row, index, state))
      )
    ]
  );
};

function dragKnight () {
  return (state) => Object.assign({}, state, {knightIsDragging: true});
}

function dropKnight (knightPosition) {
  return (state) => {
    const canMove = legalMove(state.knightPosition, knightPosition);

    if (!state.knightIsDragging || !canMove) {
      return Object.assign({}, state, {knightIsDragging: false, knightPosition: state.knightPosition});
    }

    return Object.assign({}, state, {knightIsDragging: false, knightPosition});
  };
}

export default function main ({DOM, Mouse}) {
  const knightMouseDown$ = DOM
    .select('.knight')
    .events('mousedown');

  const squareMouseUp$ = DOM
    .select('.square')
    .events('mouseup');

  const squareMouseOver$ = DOM
    .select('.square')
    .events('mouseover');

  const dragKnight$ = knightMouseDown$
    .map(dragKnight);

  const dropKnight$ = squareMouseUp$
    .map(ev => {
        const x = parseInt(ev.target.getAttribute('data-row'));
        const y = parseInt(ev.target.getAttribute('data-col'));

        return {x, y};
      }
    )
    .map(dropKnight);

  const mouseIsOver$ = squareMouseOver$
    .map(ev => {
      const x = parseInt(ev.target.getAttribute('data-row'));
      const y = parseInt(ev.target.getAttribute('data-col'));

      return {x, y};
    })
    .map((pos) => (state) => Object.assign({}, state, {mouseIsOver: pos}));

  const mousePosition$ = Mouse.positions()
    .map((pos) => (state) => Object.assign({}, state, {mousePosition: pos}));

  const action$ = xs.merge(
    mousePosition$,
    dragKnight$,
    dropKnight$,
    mouseIsOver$
  );

  const initialState = {
    board: Board(),
    knightPosition: {x: 0, y: 1},
    knightIsDragging: false,
    mousePosition: {x: 0, y: 0},
    mouseIsOver: {x: 0, y: 0}
  };

  const state$ = action$
    .fold((state, action) => action(state), initialState);

  const preventDefault$ = xs.merge (
    squareMouseUp$,
    knightMouseDown$
  );

  return {
    DOM: state$.map(state => view(state)),
    PreventDefault: preventDefault$
  };
}
