import React, { Component } from 'react';
import addIcon from '../static/baseline-add_box-24px.svg';
import fingerprintIcon from '../static/baseline-fingerprint-24px.svg';
import cachedIcon from '../static/baseline-cached-24px.svg';
import './App.css';

// baseline-add_box-24px.svg
// baseline-cached-24px.svg
// baseline-fingerprint-24px.svg
// baseline-play_circle_filled-24px.svg

class App extends Component {
  render() {
    return (
      <div className='App'>
        <header className='App__header'>

          <div className='App__steps row'>
            <div className='Step active'>
              <img className='Step__icon' src={addIcon} />
              <div className='Step__content'>
                <button className='Button'>
                  Select Files
                </button>
                <div className='Step__or'>OR</div>
                <textarea className='SequenceInput' placeholder='Paste accession numbers'/>
              </div>
            </div>
            <div className='Step'>
              <div className='Step__separator'/>
              <img className='Step__icon' src={fingerprintIcon} />
              <div className='Step__content'>
                <button className='Button' disabled>
                  Select Start
                </button>
              </div>
            </div>
            <div className='Step'>
              <div className='Step__separator'/>
              <img className='Step__icon' src={cachedIcon} />
              <div className='Step__content'>
                <button className='Button' disabled>
                  Re-Align
                </button>
              </div>
            </div>
          </div>

          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>

          <a
            className='App__link'
            href='https://reactjs.org'
            target='_blank'
            rel='noopener noreferrer'
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
