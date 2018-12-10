import React, { Component } from 'react';
import cx from 'classname'

import addIcon from '../static/baseline-add_box-24px.svg';
import fingerprintIcon from '../static/baseline-fingerprint-24px.svg';
import cachedIcon from '../static/baseline-cached-24px.svg';

import './App.scss';
import Button from './Button'
import Icon from './Icon'
import Input from './Input'
import Spinner from './Spinner'
import openFile from '../helpers/open-file'
import readFileAsText from '../helpers/read-file-as-text'
import fetchNCBI from '../helpers/fetch-ncbi'
import { validateFastaFile, isATCG } from '../helpers/fasta'

const ENTRY_TYPE = {
  ACCESSION: 'ACCESSION',
  FILE:      'FILE',
  TEXT:      'TEXT',
}

/**
 * @typedef {object} Entry
 * @property {string} type
 * @property {string} id
 * @property {boolean} isLoading
 * @property {boolean} isValid
 * @property {string} data
 */

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      entries: [],
      start: undefined,
    }
  }

  addInput(type, id) {
    const entry = { type, id, isValid: true, isLoading: true, data: undefined }
    this.setState(state => ({ entries: state.entries.concat(entry) }))
  }

  unsetEntries = () => {
    this.setState({ entries: [] })
  }

  unsetStart = () => {
    this.setState({ start: undefined })
  }

  onSelectFiles = () => {
    openFile({ multiple: true, accept: '.fasta,.txt' })
    .then(files => {
      files.forEach(file => {
        this.addInput(ENTRY_TYPE.FILE, file.name)

        readFileAsText(file)
        .then(data => {
          this.setState({
            entries: this.state.entries.map(e =>
              e.id === file.name ?
                validateEntry(e, data) :
                e
              )
          })

        })
      })
    })
  }

  onEnterAccession = (value) => {
    const accessions = value.split(/( +)|( *, *)/).filter(a => Boolean(a) && !/^ *$/.test(a))
    accessions.forEach(accession => {
      this.addInput(ENTRY_TYPE.ACCESSION, accession)

      fetchNCBI(accession)
      .then(result => {
        this.setState({
          entries: this.state.entries.map(e => e.id === accession ? ({ ...e, isLoading: false, data: result.data }) : e)
        })
      })
      .catch(err => {
        console.error(err)
      })
    })
  }

  onSelectStart = () => {
    openFile({ accept: '.fasta,.txt' })
    .then(file => {
      const start = { type: ENTRY_TYPE.FILE, id: file.name, isLoading: true, data: undefined }

      this.setState({ start })

      readFileAsText(file)
      .then(data => {
        this.setState({
          start: { ...this.state.start, isLoading: false, data }
        })

      })
    })
  }

  onEnterStart = (value) => {
    const start = { type: ENTRY_TYPE.TEXT, id: 'text', isLoading: false, data: value }

    this.setState({ start })
  }

  onClickProcess = () => {
  }

  renderInputStep() {
    const { entries } = this.state
    const hasInvalidEntries = entries.some(e => e.isInvalid)

    return (
      <div className='Step active'>
        <img className='Step__icon' src={addIcon} alt='Add File' />
        <div className='Step__content'>
          {
            entries.length === 0 &&
              <div>
                <Button className='main' onClick={this.onSelectFiles}>
                  Select Files
                </Button>
                <div className='Step__or'>OR</div>
                <Input
                  className='MainInput'
                  placeholder='Paste accession numbers'
                  defaultValue='NC_021834.1 NZ_CP022077.1'
                  onEnter={this.onEnterAccession}
                />
              </div>
          }
          <div className='InputStep__entries'>
          {
            entries.map(entry =>
              <div key={entry.id} className='Entry'>
                <div className='Entry__id'>
                  { entry.isValid &&
                    <Icon name={getEntryIconName(entry.type)} />
                  }
                  { !entry.isValid &&
                    <Icon name='exclamation-triangle' error />
                  }
                  {' '}
                  {entry.id}
                </div>
                <div className='Entry__icon'>
                  <Button
                    flat
                    icon='close'
                    iconButton
                    loading={entry.isLoading}
                  />
                </div>
              </div>
            )
          }
          </div>
          {
            hasInvalidEntries &&
              <div className='text-error bold'>
                Some files are not FASTA files. Please remove them.
              </div>
          }
          {
            entries.length > 0 &&
              <button className='link' onClick={this.unsetEntries}>
                Change
              </button>
          }
        </div>
      </div>
    )
  }

  renderStartStep() {
    const { entries, start } = this.state

    const isActive = entries.length > 0
    const className = cx('Step', { active: isActive })

    return (
      <div className={className}>
        <div className='Step__separator'/>
        <img className='Step__icon' src={fingerprintIcon} alt='Start sequence' />
        {
          start === undefined &&
            <div className='Step__content'>
              <Button className='main' disabled={!isActive} onClick={this.onSelectStart}>
                Select Start
              </Button>
              <div className='Step__or'>OR</div>
              <Input
                className='MainInput'
                placeholder='Paste it: AACGATCGACTGATC'
                disabled={!isActive}
                onEnter={this.onEnterStart}
              />
            </div>
        }
        {
          start !== undefined && start.type === ENTRY_TYPE.TEXT &&
            <div className='Step__content'>
              <div className='StartStep__value'>
                {start.data}
              </div>
              <div className='StartStep__length'>
                Length: {start.data.length} bases
              </div>
              <button className='link' onClick={this.unsetStart}>
                Change
              </button>
            </div>
        }
        {
          start !== undefined && start.type === ENTRY_TYPE.FILE &&
            <div className='Step__content'>
              <div className='StartStep__value'>
                {start.data}
              </div>
              {
                start.isLoading &&
                  <Spinner />
              }
              {
                !start.isLoading &&
                  <div className='StartStep__length'>
                    Length: {start.data.length} bases
                  </div>
              }
              {
                !start.isLoading &&
                  <button className='link' onClick={this.unsetStart}>
                    Change
                  </button>
              }
            </div>
        }
      </div>
    )
  }

  renderProcessStep() {
    const { entries, start } = this.state

    const shouldActivate = entries.length > 0 && start !== undefined
    const isLoading = shouldActivate && (entries.some(e => e.isLoading) || (start !== undefined && start.isLoading))
    const isActive = shouldActivate && !isLoading

    return (
      <div className={cx('Step', { active: isActive })}>
        <div className='Step__separator'/>
        <img className='Step__icon' src={cachedIcon} alt='Process' />
        <div className='Step__content'>
          <Button className='main'
            disabled={!isActive}
            loading={isLoading}
            onClick={this.onClickProcess}
          >
            Re-Align
          </Button>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className='App'>
        <header className='App__header'>

          <div className='App__steps row'>

            { this.renderInputStep() }
            { this.renderStartStep() }
            { this.renderProcessStep() }

          </div>

        </header>
      </div>
    );
  }
}


function validateEntry(entry, data) {
  const validation = validateFastaFile(data)

  if (!validation.success)
    return { ...entry, isValid: false, isLoading: false, data }

  return { ...entry, isValid: true, isLoading: false, data: validation.result }
}

function getEntryIconName(entryType) {
  switch (entryType) {
    case ENTRY_TYPE.ACCESSION: return 'link'
    case ENTRY_TYPE.FILE: return 'file-text'
    case ENTRY_TYPE.TEXT: return 'align-justify'
    default:
      throw new Error('unreachable')
  }
}

export default App;
