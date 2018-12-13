import React, { Component } from 'react';
import path from 'path'
import cx from 'classname'
import truncateMiddle from 'truncate-middle'

import addIcon from '../static/baseline-add_box-24px.svg';
import fingerprintIcon from '../static/baseline-fingerprint-24px.svg';
import cachedIcon from '../static/baseline-cached-24px.svg';

import './App.scss';
import Button from './Button'
import Icon from './Icon'
import Input from './Input'
import Spinner from './Spinner'
import download from '../helpers/download'
import openFile from '../helpers/open-file'
import readFileAsText from '../helpers/read-file-as-text'
import fetchNCBI from '../helpers/fetch-ncbi'
import { fastaToString, realignFasta, validateFastaFile, isAllowed } from '../helpers/fasta'

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


const INITIAL_STATE = {
  entries: [],
  start: undefined,
  startMessage: undefined,
  realignments: [],
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = INITIAL_STATE
  }

  addEntry(type, id) {
    const entry = { type, id, isValid: true, isLoading: true, data: undefined }
    this.setState(state => ({ entries: state.entries.concat(entry) }))
  }

  removeEntry(id) {
    this.setState({ entries: this.state.entries.filter(e => e.id !== id) })
  }

  resetInput = () => {
    this.setState({ entries: [] })
    this.resetProcess()
  }

  resetStart = () => {
    this.setState({ start: undefined })
    this.resetProcess()
  }

  resetProcess = () => {
    this.setState({ realignments: [] })
  }

  reset = () => {
    this.setState(INITIAL_STATE)
  }

  downloadRealignment(id) {
    const realignment = this.state.realignments.find(r => r.id === id)
    download(realignment.id, realignment.data)
  }

  downloadAllRealignments = () => {
    this.state.realignments.forEach(realignment => {
      download(realignment.id, realignment.data)
    })
  }

  onSelectFiles = () => {
    openFile({ multiple: true, accept: '.fasta,.txt' })
    .then(files => {
      files.forEach(file => {
        this.addEntry(ENTRY_TYPE.FILE, file.name)

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
      this.addEntry(ENTRY_TYPE.ACCESSION, accession)

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
      const start = { type: ENTRY_TYPE.FILE, id: file.name, isValid: true, isLoading: true, data: undefined }

      this.setState({ start })

      readFileAsText(file)
      .then(content => {
        const data = content.trim().toUpperCase()
        const start = { ...this.state.start, isValid: isAllowed(data), isLoading: false, data }

        if (data.length < 50) {
          this.setState({ start: undefined, startMessage: 'File must have a minimum length of 50 characters' })
          return
        }

        if (!start.isValid) {
          this.setState({ start: undefined, startMessage: 'File contains invalid characters' })
          return
        }

        this.setState({ start, startMessage: undefined })
      })
      .catch(err => {
        this.setState({
          start: undefined,
          startMessage: `Error while reading file: ${err.message}`
        })
      })
    })
  }

  onEnterStart = (value) => {
    if (value.length < 50) {
      this.setState({ startMessage: 'Sequence must have a minimum length of 50 characters' })
      return
    }

    if (!isAllowed(value)) {
      this.setState({ start: undefined, startMessage: 'Sequence contains invalid characters' })
      return
    }

    const start = {
      type: ENTRY_TYPE.TEXT,
      id: 'text',
      isValid: true,
      isLoading: false,
      data: value.toUpperCase()
    }

    this.setState({ start, startMessage: undefined })
  }

  onClickProcess = () => {
    const { entries, start } = this.state

    const realignments = entries.map(entry => {
      const { success, result } = realignFasta(entry.data, start.data)
      const isReversed = success && result.isReversed

      if (success)
        console.assert(result.sequence.length === entry.data.sequence.length)

      return {
        success: success,
        id: getName(entry, isReversed),
        entry: entry,
        isReversed: isReversed,
        data: success && fastaToString(result),
      }
    })

    this.setState({ realignments })
  }

  renderInputStep() {
    const { entries } = this.state
    const hasInvalidEntries = entries.some(e => e.isValid === false)

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
                  onEnter={this.onEnterAccession}
                />
              </div>
          }
          <div className='InputStep__entries'>
          {
            entries.map(entry =>
              <div key={entry.id} className='Entry'>
                <div className='Entry__icon'>
                  { entry.isValid &&
                    <Icon name={getEntryIconName(entry.type)} muted />
                  }
                  { !entry.isValid &&
                    <Icon name='exclamation-triangle' error />
                  }
                </div>
                <div className='Entry__id' ref={onRefEllipsis}>
                  <div className='Entry__id__content'>
                    {entry.id}
                  </div>
                </div>
                <div className='Entry__button'>
                  <Button
                    flat
                    icon='close'
                    iconButton
                    loading={entry.isLoading}
                    onClick={() => this.removeEntry(entry.id)}
                  />
                </div>
              </div>
            )
          }
          </div>
          {
            hasInvalidEntries &&
              <p className='text-error bold'>
                Some files are not FASTA files. Please remove them.
              </p>
          }
          {
            entries.length > 0 &&
              <button className='link' onClick={this.resetInput}>
                Change
              </button>
          }
        </div>
      </div>
    )
  }

  renderStartStep() {
    const { entries, start, startMessage } = this.state

    const isActive = entries.length > 0 && !entries.some(e => e.isValid === false)
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
                className='MainInput margin-bottom-1'
                placeholder='Paste it: AACGAT…'
                disabled={!isActive}
                onKeyPress={onKeyPressFilterATCG}
                onEnter={this.onEnterStart}
              />

              {
                startMessage !== undefined &&
                  <p className='text-warning bold'>
                    <Icon name='exclamation-triangle' /> {startMessage}
                  </p>
              }
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
              <button className='link' onClick={this.resetStart}>
                Change
              </button>
            </div>
        }
        {
          start !== undefined && start.type === ENTRY_TYPE.FILE &&
            <div className='Step__content'>
              {
                start.isValid && start.data &&
                  <div className='StartStep__value'>
                    {start.data.slice(0, 200)}
                  </div>
              }
              {
                start.isLoading &&
                  <Spinner />
              }
              {
                !start.isLoading && start.isValid &&
                  <div className='StartStep__length'>
                    Length: {start.data.length} bases
                  </div>
              }
              {
                !start.isValid &&
                  <p className='text-error bold'>
                    This files isn't a sequence of ATCG bases. Please change it.
                  </p>
              }
              {
                !start.isLoading &&
                  <button className='link' onClick={this.resetStart}>
                    Change
                  </button>
              }
            </div>
        }
      </div>
    )
  }

  renderProcessStep() {
    const { entries, start, realignments } = this.state

    const shouldActivate =
      (entries.length > 0 && entries.every(e => e.isValid))
      && (start !== undefined && start.isValid)
    const isLoading = shouldActivate && (entries.some(e => e.isLoading) || (start !== undefined && start.isLoading))
    const isActive = shouldActivate && !isLoading

    const hasUnsuccessfulRealignments = realignments.some(r => r.success === false)
    const hasSuccessfulRealignments = realignments.some(r => r.success === true)

    return (
      <div className={cx('Step', { active: isActive })}>
        <div className='Step__separator'/>
        <img className='Step__icon' src={cachedIcon} alt='Process' />
        {
          realignments.length === 0 &&
            <div className='Step__content'>
              <Button className='main'
                disabled={!isActive}
                loading={isLoading}
                onClick={this.onClickProcess}
              >
                Re-Align
              </Button>
            </div>
        }
        {
          realignments.length !== 0 &&
            <div className='Step__content'>

              <div className='ProcessStep__entries'>
              {
                realignments.map(realignment =>
                  <div key={realignment.id} className='Entry'>
                    <div className='Entry__icon'>
                      { realignment.success &&
                        <Icon name='check' success />
                      }
                      { !realignment.success &&
                        <Icon name='exclamation-triangle' error />
                      }
                    </div>
                    <div className='Entry__id' ref={onRefEllipsis}>
                      <div className='Entry__id__content'>
                        {realignment.id}
                      </div>
                    </div>
                    <div className='Entry__button'>
                      {
                        realignment.success &&
                          <Button
                            flat
                            icon='download'
                            iconButton
                            onClick={() => this.downloadRealignment(realignment.id)}
                          />
                      }
                    </div>
                  </div>
                )
              }
              </div>
              {
                (hasUnsuccessfulRealignments && hasSuccessfulRealignments) &&
                  <p className='text-warning bold'>
                    Start sequence was not found on some files.
                  </p>
              }
              {
                (hasUnsuccessfulRealignments && !hasSuccessfulRealignments) &&
                  <p className='text-error bold'>
                    Start sequence was not found on any file.
                  </p>
              }
              <Button
                className='main ProcessStep__download'
                icon='download'
                disabled={!hasSuccessfulRealignments}
                onClick={this.downloadAllRealignments}
              >
                Download
              </Button>
              <button className='link' onClick={this.reset}>
                Reset
              </button>
            </div>
        }
      </div>
    )
  }

  render() {
    return (
      <div className='App'>
        <main className='App__main'>

          <div className='App__steps row'>

            { this.renderInputStep() }
            { this.renderStartStep() }
            { this.renderProcessStep() }

          </div>

        </main>
        <footer className='App__footer'>
          <span>Made with <span className='text-error'>❤️</span> in Montréal</span>
        </footer>
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

function onKeyPressFilterATCG(ev) {
  const { altKey, ctrlKey, metaKey, key, code } = ev
  console.log(altKey, ctrlKey, metaKey, key, code)

  if (
       altKey === false
    && ctrlKey === false
    && metaKey === false
    && key.length === 1 && !isAllowed(key)
  )
    ev.preventDefault()
}

function getName(entry, isReversed) {
  let name = entry.type === ENTRY_TYPE.ACCESSION ? entry.id + '.fasta' : entry.id

  if (isReversed) {
    const extname = path.extname(name)
    const basename = name.slice(0, name.length - extname.length)
    name = `${basename}.reversed${extname}`
  }

  {
    const extname = path.extname(name)
    const basename = name.slice(0, name.length - extname.length)
    name = `${basename}.realigned${extname}`
  }

  return name
}

function onRefEllipsis(ref) {
  if (!ref)
    return

  const element = ref
  const child = element.children[0]
  const box = element.getBoundingClientRect()
  const text = child.textContent

  let count = 0
  let childBox = child.getBoundingClientRect()

  while (childBox.width > box.width) {
    count++

    const length = text.length - count
    const startLength = Math.ceil(length / 2)
    const endLength = Math.floor(length / 2)

    child.textContent = truncateMiddle(text, startLength, endLength, '…')

    childBox = child.getBoundingClientRect()
  }

  element.title = text
}

export default App;
