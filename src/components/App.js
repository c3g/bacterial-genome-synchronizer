import React, { Component } from 'react';
import path from 'path'
import cx from 'classname'
import truncateMiddle from 'truncate-middle'

import addIcon from '../static/baseline-add_box-24px.svg';
import fingerprintIcon from '../static/baseline-fingerprint-24px.svg';
import cachedIcon from '../static/baseline-cached-24px.svg';

import './App.scss';
import Button from './Button'
import Help from './Help'
import Icon from './Icon'
import Input from './Input'
import Spinner from './Spinner'
import download from '../helpers/download'
import downloadZip from '../helpers/download-zip'
import openFile from '../helpers/open-file'
import readFileAsText from '../helpers/read-file-as-text'
import fetchNCBI from '../helpers/fetch-ncbi'
import { fastaToString, realignFasta, validateFastaFile, isAllowed } from '../helpers/fasta'

const COUNTER_URL = 'https://c3g-funding.vhost38.genap.ca/bacterial-genome-synchronizer-counter'

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
  showHelp: false,
  entries: [],
  start: undefined,
  startMessage: undefined,
  realignments: [],
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = INITIAL_STATE

    this.inputInput = React.createRef()
    this.startInput = React.createRef()
  }

  addEntry(type, id) {
    const entry = { type, id, isValid: true, isLoading: true, data: undefined }
    this.setState(state => ({ entries: state.entries.concat(entry) }))
  }

  removeEntry(id) {
    this.setState({ entries: this.state.entries.filter(e => e.id !== id) })
  }

  downloadEntry(entry) {
    download(`${entry.id}.fasta`, fastaToString(entry.data))
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

  toggleHelp = () => {
    this.setState({ showHelp: !this.state.showHelp })
  }

  downloadRealignment(id) {
    const realignment = this.state.realignments.find(r => r.id === id)
    download(realignment.id, realignment.data)
  }

  downloadAllRealignments = () => {
    const files =
      this.state.realignments
        .filter(realignment => realignment.success)
        .map(realignment => ({ filename: realignment.id, text: realignment.data }))

    if (files.length === 1)
      return download(files[0].filename, files[0].text)

    downloadZip(files)
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

  onAcceptAccession = () => {
    const value = this.inputInput.current.value
    const accessions = value.split(/( +)|( *, *)/).filter(a => Boolean(a) && !/^ *$/.test(a))
    accessions.forEach(accession => {
      this.addEntry(ENTRY_TYPE.ACCESSION, accession)

      fetchNCBI(accession)
      .then(result => {
        this.setState({
          entries: this.state.entries.map(e => e.id === accession ?
            validateEntry(e, result.data) :
            e)
        })
      })
      .catch(err => {
        console.error(err)
        this.setState({
          entries: this.state.entries.map(e => e.id === accession ?
            failEntry(e) :
            e)
        })
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
        const validation = validateFastaFile(content)
        const data = validation.success ? validation.result.sequence : prepareStart(content)
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

  onAcceptStart = () => {
    const value = prepareStart(this.startInput.current.value)

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

    pingCounter()

    const realignments = entries.map(entry => {
      const { success, result } = realignFasta(entry.data, start.data)
      const isReversed = success && result.isReversed

      if (success)
        console.assert(result.sequence.length === entry.data.sequence.length)

      return {
        success: success,
        id: success ? getResultFileName(entry, result) : entry.id,
        entry: entry,
        isReversed: isReversed,
        data: success && fastaToString(result),
      }
    })

    this.setState({ realignments })
  }

  renderInputStep() {
    const { entries } = this.state
    const hasInvalidFiles = entries.some(e => e.type === ENTRY_TYPE.FILE && e.isValid === false)
    const hasInvalidAccession = entries.some(e => e.type === ENTRY_TYPE.ACCESSION && e.isValid === false)

    return (
      <div className='Step active'>
        <img className='Step__icon' src={addIcon} alt='Add File' />
        <div className='Step__content'>
          {
            entries.length === 0 &&
              <div>
                <Button className='MainButton' onClick={this.onSelectFiles}>
                  Select Files
                </Button>
                <div className='Step__or'>OR</div>
                <div className='InputGroup'>
                  <Input
                    className='MainInput'
                    placeholder='Paste NCBI numbers'
                    ref={this.inputInput}
                    onEnter={this.onAcceptAccession}
                  />
                  <Button
                    className='MainButton'
                    icon='thumbs-o-up'
                    onClick={this.onAcceptAccession}
                  />
                </div>
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
                <div className={cx('Entry__id', { 'text-muted': !entry.isValid })} ref={onRefEllipsis}>
                  <div className='Entry__id__content'>
                    {entry.id}
                  </div>
                </div>
                <div className='Entry__button'>
                  {
                    entry.type === ENTRY_TYPE.ACCESSION && !entry.isLoading && entry.isValid &&
                      <Button
                        flat
                        icon='download'
                        title='Download'
                        iconButton
                        onClick={() => this.downloadEntry(entry)}
                      />
                  }
                  <Button
                    flat
                    icon='close'
                    title='Remove'
                    iconButton
                    loading={entry.isLoading}
                    className={cx({ 'text-error': !entry.isValid })}
                    onClick={() => this.removeEntry(entry.id)}
                  />
                </div>
              </div>
            )
          }
          </div>
          {
            hasInvalidFiles &&
              <p className='text-error bold'>
                Some files are not FASTA files. Please remove them.
              </p>
          }
          {
            hasInvalidAccession &&
              <p className='text-error bold'>
                Some accession numbers could not be loaded. Check that they
                are valid and that the network is working.
              </p>
          }
          {
            entries.length > 0 &&
              <button className='Step__action link' onClick={this.resetInput}>
                Change
              </button>
          }
        </div>
      </div>
    )
  }

  renderStartStep() {
    const { entries, start, startMessage } = this.state

    const isActive = entries.length > 0 && entries.every(e => e.isValid && !e.isLoading)
    const className = cx('Step', { active: isActive })

    return (
      <div className={className}>
        <div className='Step__separator'/>
        <img className='Step__icon' src={fingerprintIcon} alt='Start sequence' />
        {
          start === undefined &&
            <div className='Step__content'>
              <Button className='MainButton' disabled={!isActive} onClick={this.onSelectStart}>
                Select Start
              </Button>
              <div className='Step__or'>OR</div>
              <div className='InputGroup margin-bottom-1'>
                <Input
                  className='MainInput'
                  placeholder='Paste it: AACGAT…'
                  disabled={!isActive}
                  ref={this.startInput}
                  onKeyPress={onKeyPressFilterATCG}
                  onEnter={this.onAcceptStart}
                />
                <Button
                  className='MainButton'
                  icon='thumbs-o-up'
                  disabled={!isActive}
                  onClick={this.onAcceptStart}
                />
              </div>

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
              <button className='Step__action link' onClick={this.resetStart}>
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
                  <button className='Step__action link' onClick={this.resetStart}>
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
    const successfulRealignments = realignments.filter(r => r.success).length

    return (
      <div className={cx('Step', { active: isActive })}>
        <div className='Step__separator'/>
        <img className='Step__icon' src={cachedIcon} alt='Process' />
        {
          realignments.length === 0 &&
            <div className='Step__content'>
              <Button className='MainButton'
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
                    <div className={cx('Entry__id', { 'text-muted': !realignment.success })} ref={onRefEllipsis}>
                      <div className='Entry__id__content'>
                        {realignment.success ? realignment.id : realignment.entry.id}
                      </div>
                    </div>
                    <div className='Entry__button'>
                      {
                        realignment.success &&
                          <Button
                            flat
                            icon='download'
                            title='Download single file'
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
              <div>
                <Button
                  className='MainButton ProcessStep__download'
                  icon='download'
                  disabled={!hasSuccessfulRealignments}
                  onClick={this.downloadAllRealignments}
                >
                  Download ({successfulRealignments})
                </Button>
              </div>
              <button className='Step__action link' onClick={this.reset}>
                Reset
              </button>
            </div>
        }
      </div>
    )
  }

  render() {
    const { showHelp } = this.state

    return (
      <div className='App'>
        <main className='App__main'>

          <Button
            className='App__helpButton'
            flat
            iconButton
            icon={ showHelp ? 'times' : 'question-circle' }
            onClick={this.toggleHelp}
          />

          <div className='App__steps row'>

            { this.renderInputStep() }
            { this.renderStartStep() }
            { this.renderProcessStep() }

          </div>

          <div className={cx('App__help', { visible: showHelp } )}>
            <Help />
          </div>

        </main>
        <footer className='App__footer'>
          <span>Made with <span className='text-error' role="img" aria-label="heart">❤️</span> in Montréal
            — Implemented by Romain Grégoire, based on an original tool by Matthew D'Iorio & Ken Dewar</span>
        </footer>
        <div className='App__contact'>
          If there are any issues, please contact us at
            <a style={{marginLeft: '5px', color: 'white'}} href="mailto:microbiome.genome@mcgill.ca">
              microbiome.genome@mcgill.ca
            </a>
        </div>
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

function failEntry(entry) {
  return { ...entry, isValid: false, isLoading: false, data: undefined }
}

function prepareStart(value) {
  return value.replace(/[ \t\n]/g, '').toUpperCase()
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

function getResultFileName(entry, { isReversed, conversions }) {
  let name = entry.type === ENTRY_TYPE.ACCESSION ? entry.id + '.fasta' : entry.id

  if (isReversed) {
    const extname = path.extname(name)
    const basename = name.slice(0, name.length - extname.length)
    name = `${basename}.reverseComp${extname}`
  }

  if (conversions > 0) {
    const extname = path.extname(name)
    const basename = name.slice(0, name.length - extname.length)
    name = `${basename}.${conversions}N${extname}`
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

function pingCounter() {
  if (navigator.sendBeacon)
    navigator.sendBeacon(COUNTER_URL)
  else
    fetch(COUNTER_URL)
    .then(() => { console.log('Pinged counter') })
    .catch(error => { console.error('Error while pinging counter', error) })
}

export default App;
