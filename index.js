import {run} from '@cycle/xstream-run';
import {makeDOMDriver, div} from '@cycle/dom';

import mousePositionDriver from './drivers/mouse-position-driver';
import preventDefaultDriver from './drivers/prevent-default-driver';

import app from './src/app';

const drivers = {
  DOM: makeDOMDriver('.app'),
  Mouse: mousePositionDriver,
  PreventDefault: preventDefaultDriver
};

run(app, drivers);
