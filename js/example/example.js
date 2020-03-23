'use strict'

const CURRENT_SCRIPT_URL = new URL(typeof(document) === 'undefined' ? location.href : document.currentScript.src)

class BaseMicrophoneProcessor {
    // Chrome only allows using audio after user interaction
    // see https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
    constructor() {
        this._active = Promise.resolve(false)
        this._context = null
        this._stream = null
        this._nodes = null
    }
    /**
     * Override this to do actual processing
     * @param {AudioBuffer} buffer
     */
    processAudioBuffer(buffer) {
        console.debug('.')
    }
    /**
     * @param {AudioContext} _context
     * @returns {AudioNode[]}
     */
    createIntermediateNodes(_context) {
        return []
    }
    getActive() {
        return this._active
    }
    setActive(active) {
        this._active = new Promise((resolve, reject) => {
            (active ? this._start() : this._stop())
            .then(() => resolve(active))
            .catch(e => reject(e))
        })
        return this._active
    }
    /**
     * 
     * @param {Boolean} connect 
     * @param {AudioNode[]} nodes 
     */
    static _connectAudioNodesInSequence(connect, nodes) {
        for (let i=0; i<nodes.length - 1; i++) {
            const src = nodes[i]
            const dst = nodes[i+1]
            if (connect)
                src.connect(dst)
            else
                src.disconnect(dst)
        }
        return nodes
    }
    _stop() {
        // The spec states that: "Any AudioNodes which are connected in a cycle
        // and are directly or indirectly connected to the AudioDestinationNode
        // of the AudioContext will stay alive as long as the AudioContext is alive."
        // w3.org/TR/webaudio/#lifetime-AudioNode
        if (this._nodes) {
            BaseMicrophoneProcessor._connectAudioNodesInSequence(false, this._nodes)
            this._nodes = null
        }
        if (this._stream) {
            this._stream.getTracks().forEach(track => track.stop())
            this._stream = null
        }
        if (this._context) {
            this._context = null
        }
        return Promise.resolve()
    }
    _start() {
        return navigator.mediaDevices.getUserMedia({
            audio: {channelCount: 1},
            video: false
        }).then(stream => {
            this._stream = stream
            this._context = new AudioContext()

            const microphoneNode = this._context.createMediaStreamSource(this._stream)

            // output channel is unused but needed to receive onaudioprocess events in Chrome
            const processorNode = this._context.createScriptProcessor(4096, 1, 1)
            processorNode.onaudioprocess = e => {
                try {
                    this.processAudioBuffer(e.inputBuffer)
                } catch (e) {
                    console.error('processAudioBuffer failed, stopping', e)
                    this._stop();
                }
            }

            // connecting processorNode to destination was required to get it working in Chrome
            this._nodes = BaseMicrophoneProcessor._connectAudioNodesInSequence(true, [
                microphoneNode,
                ...this.createIntermediateNodes(this._context),
                processorNode,
                this._context.destination,
            ])
        })
    }
}

class WorkerClient {
    constructor(workerUrl) {
        this._worker = new Worker(workerUrl)
        const _this = this
        this._worker.onmessage = event => _this._onmessage(event)
        this._messageIdsequence = 0
        this._inflightMessages = new Map() // maps messageId to [resolve, reject] pair
    }
    callWorkerMethod(method, ...params) {
        this._worker.postMessage({method, params})
    }
    callWorkerMethodAndWait(method, ...params) {
        const messageId = (this._messageIdsequence += 1)
        this._worker.postMessage({method, params, messageId})
        const promise = new Promise((resolve, reject) => {
            this._inflightMessages.set(messageId, [resolve, reject])
        })
        return promise
    }
    handleWorkerMessage(_data) {
        // to be overridden
    }
    _onmessage(event) {
        console.debug('WorkerClient: received event.data', event.data)
        var {result, error, messageId} = event.data
        if (messageId) {
            let inflightMessage = this._inflightMessages.get(messageId)
            if (inflightMessage) {
                this._inflightMessages.delete(messageId)
                let [resolve, reject] = inflightMessage
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            } else {
                console.warn(`WorkerClient: received unexpected message ${messageId}`)
            }
        } else {
            this.handleWorkerMessage(event.data)
        }
    }
}

class WorkerServer {
    constructor() {
        const _this = this
        onmessage = event => _this.onmessage(event)
    }
    onmessage(event) {
        console.debug('WorkerServer: received event.data', event.data)
        let {method, params, messageId} = event.data
        try {
            let _method = this[method]
            if (typeof(_method) !== 'function') {
                throw new Error(`WorkerServer: method '${method}' not found`)
            }
            let result = _method.apply(this, params)
            if (result instanceof Promise) {
                result
                    .then(actualResult => postMessage({messageId, result: actualResult}))
                    .catch(actualError => postMessage({messageId, error: actualError}))
            } else if (typeof(result) !== 'undefined' || typeof(messageId) !== 'undefined') {
                postMessage({result, messageId})
            }
        } catch (error) {
            postMessage({error, messageId})
        }
    }
}

class Recognizer extends BaseMicrophoneProcessor {
    constructor(modelUrl) {
        super()

        const workerUrl = new URL(CURRENT_SCRIPT_URL)
        workerUrl.searchParams.set('worker', 'true')
        workerUrl.searchParams.set('modelUrl', modelUrl)
        this._workerClient = new WorkerClient(workerUrl)
        const _this = this
        this._workerClient.handleWorkerMessage = data => _this.handleWorkerMessage(data)
    }
    handleWorkerMessage(data) {
        const {result} = data
        if (typeof(result) === 'object' && (result.partial || result.text)) {
            this.onresult(result)
        }
    }
    onresult(result) {
        console.debug('Recognizer: got result', result)
    }
    _start() {
        return this._workerClient.callWorkerMethodAndWait('start').then(() => super._start())
    }
    _stop() {
        return super._stop().then(() => this._workerClient.callWorkerMethodAndWait('stop'))
    }
    /**
     * Kaldi expects each sample to be a floating point number between -32768 and 32767 (range of signed Int16)
     * However, web audio samples are represented as floating point numbers between -1.0 and 1.0
     * @param {AudioContext} context 
     */
    createIntermediateNodes(context) {
        const gainNode = context.createGain()
        gainNode.gain.value = 0x8000
        return [gainNode]
    }
    /**
     * @param {AudioBuffer} buffer 
     */
    processAudioBuffer(buffer) {
        if (buffer.numberOfChannels < 1) {
            throw new Error(`AudioProcessingEvent contained ${buffer.numberOfChannels} channels`);
        }
        const data = buffer.getChannelData(0);
        if (!(data instanceof Float32Array)) {
            throw new Error(`Channel data is not a Float32Array as expected: ${data}`);
        }
        this._workerClient.callWorkerMethod('processAudioChunk', {
            data: data,
            sampleRate: buffer.sampleRate,
            duration: buffer.duration,
        }, [data.buffer])
        // last param passes ownership of Transferable object data.buffer to the worker
        // data.buffer.byteLength becomes zero after postMessage()
    }
}

class RecognizerWorker extends WorkerServer {
    constructor(modelUrl) {
        super()
        console.debug(`RecognizerWorker: constructed with modelUrl=${modelUrl}`)
        importScripts('vosk.js')
        this._Vosk = null
        this._modelUrl = modelUrl
        this._bufferAddr = null // address of buffer on the heap, has to be _malloc/_free-d
        this._bufferSize = null
        this._model = null
        this._recognizer = null
        this._running = false
    }
    start() {
        console.debug('RecognizerWorker: starting')
        const storagePath = '/vosk'
        const modelPath = storagePath + '/' + this._modelUrl
        return new Promise((resolve, reject) => LoadVosk().then(loaded => {
            this._Vosk = loaded
            resolve()
        }))
        .then(() => {
            console.debug('Setting up persistent storage at ' + storagePath)
            this._Vosk.FS.mkdir(storagePath)
            this._Vosk.FS.mount(this._Vosk.IDBFS, {}, storagePath)
            return this._Vosk.syncFilesystem(true)
        })
        .then(() => {
            return this._Vosk.downloadAndExtract(this._modelUrl, modelPath)
        })
        .then(() => {
            return this._Vosk.syncFilesystem(false)
        })
        .then(() => {
            this._model = new this._Vosk.Model(modelPath)
            this._model.SetAllowDownsample(true)
            console.debug(`RecognizerWorker: new Model(), SampleFrequency=${this._model.SampleFrequency()}`)
        })
        .then(() => {
            this._running = true
        })
    }
    stop() {
        console.debug('RecognizerWorker: stopping')
        if (this._recognizer) {
            postMessage({result: JSON.parse(this._recognizer.FinalResult())})
            this._recognizer.delete()
            this._recognizer = null
            console.debug('RecognizerWorker: ~KaldiRecognizer()')
        }
        if (this._model) {
            this._model.delete()
            this._model = null
            console.debug('RecognizerWorker: ~Model()')
        }
        this._freeBuffer()
        this._running = false
    }
    _allocateBuffer(size) {
        if (this._bufferAddr !== null && this._bufferSize === size) {
            return
        }
        this._freeBuffer()
        this._bufferAddr = this._Vosk._malloc(size)
        this._bufferSize = size
        console.debug(`RecognizerWorker: allocated buffer of ${this._bufferSize} bytes`);
    }
    _freeBuffer() {
        if (this._bufferAddr === null) {
            return
        }
        this._Vosk._free(this._bufferAddr)
        console.debug(`RecognizerWorker: freed buffer of ${this._bufferSize} bytes`);
        this._bufferAddr = null
        this._bufferSize = null
    }
    processAudioChunk({data, sampleRate, duration}) {
        if (!this._running) {
            console.debug('RecognizerWorker: not running, dropping message')
            return
        }
        if (this._recognizer === null) {
            this._recognizer = new this._Vosk.KaldiRecognizer(this._model, sampleRate)
            console.debug(`RecognizerWorker: new KaldiRecognizer (sampleRate=${sampleRate})`)
        }
        const requiredSize = data.length * data.BYTES_PER_ELEMENT
        this._allocateBuffer(requiredSize)
        this._Vosk.HEAPF32.set(data, this._bufferAddr / data.BYTES_PER_ELEMENT)
        let json
        if (this._recognizer.AcceptWaveform(this._bufferAddr, data.length)) {
            json = this._recognizer.Result()
        } else {
            json = this._recognizer.PartialResult()
        }
        return JSON.parse(json)
    }
}

// this is similar to POSIX fork() - same code is loaded in two different threads
// Here we detect if we are inside the worker context
if (CURRENT_SCRIPT_URL.searchParams.get('worker') === 'true') {
    const modelUrl = CURRENT_SCRIPT_URL.searchParams.get('modelUrl')
    const worker = new RecognizerWorker(modelUrl)
}
