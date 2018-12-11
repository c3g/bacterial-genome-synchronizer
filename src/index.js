import React from 'react';
import ReactDOM from 'react-dom';

import 'font-awesome/css/font-awesome.min.css';
import 'flexboxgrid/dist/flexboxgrid.min.css';

import './styles/spinner.scss';
import './styles/Button.scss'
import './styles/Dropdown.scss'
import './styles/index.scss';


import * as serviceWorker from './serviceWorker';
import App from './components/App';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
