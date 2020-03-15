'use strict';

if (!location.protocol.match(/^http/)) {
    const message = "Please serve this page over HTTP (e.g. python -m http.server)!";
    alert(message);
    throw new Error(message);
}
LoadVosk().then(async function (Vosk) {
    const FS = Vosk.FS;
    const storagePath = '/vosk';
    console.debug('Setting up persistent storage at ' + storagePath);
    FS.mkdir(storagePath);
    FS.mount(Vosk.IDBFS, {}, storagePath);
    await Vosk.syncFilesystem(true);
    const modelPath = storagePath + '/model-en';
    await Vosk.downloadAndExtract('model-en.tar.gz', modelPath);
    await Vosk.syncFilesystem(false);

    const model = new Vosk.Model(modelPath);
    console.log(`Model loaded, SampleFrequency=${model.SampleFrequency()}`)

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            // this desn't seem to be respected in practice
            channelCount: { ideal: 1 },
            sampleSize: { ideal: 16 },
            sampleRate: { ideal: model.SampleFrequency() },
        },
        video: false,
    });

    const audioCtx = new AudioContext();
    const origSource = audioCtx.createMediaStreamSource(stream);

    // Kaldi expects each sample to be a floating point number between -32768 and 32767 (range of signed Int16)
    // However, web audio samples are represented as floating point numbers between -1.0 and 1.0
    const source = audioCtx.createGain();
    source.gain.value = 0x8000;
    origSource.connect(source);

    var scriptNode = audioCtx.createScriptProcessor(4096, 1, 0);
    let modelInitialized, recognizer, emscriptenFloatArrayOffset;

    function handleAudioProcessingEvent(event) {
        const buffer = event.inputBuffer;
        if (buffer.numberOfChannels < 1) {
            throw new Error(`AudioProcessingEvent contained ${buffer.numberOfChannels} channels`);
        }
        if (!modelInitialized) {
            modelInitialized = true;
            if (model.SampleFrequency() < buffer.sampleRate) {
                model.SetAllowDownsample(true);
                console.log(`Turning on downsampling (input: ${buffer.sampleRate}, model: ${model.SampleFrequency()})`);
            } else if (model.SampleFrequency() > buffer.sampleRate) {
                console.warn(`Turning on upsampling (input: ${buffer.sampleRate}, model: ${model.SampleFrequency()})`);
                model.SetAllowUpsample(true);
            }
        }
        if (!recognizer) {
            recognizer = new Vosk.KaldiRecognizer(model, buffer.sampleRate);
            console.log(`Created KaldiRecognizer (sampleRate=${buffer.sampleRate})`);
        }
        let result;
        const data = buffer.getChannelData(0);
        if (!(data instanceof Float32Array)) {
            throw new Error(`Channel data is not a Float32Array as expected: ${data}`);
        }
        if (!emscriptenFloatArrayOffset) {
            emscriptenFloatArrayOffset = Vosk._malloc(data.length * data.BYTES_PER_ELEMENT);
            console.debug(`Allocated buffer of ${data.length} * ${data.BYTES_PER_ELEMENT} bytes at addr ${emscriptenFloatArrayOffset}`);
        }
        Vosk.HEAPF32.set(data, emscriptenFloatArrayOffset / data.BYTES_PER_ELEMENT);

        if (recognizer.AcceptWaveform(emscriptenFloatArrayOffset, data.length)) {
            result = JSON.parse(recognizer.Result());
        } else {
            result = JSON.parse(recognizer.PartialResult());
        }
        if (result.partial || result.text) {
            console.log(result);
        } else {
            console.log('No speech detected');
        }
    }

    scriptNode.onaudioprocess = event => {
        // This event fires in Firefox, but doesn't work in Chrome
        // https://stackoverflow.com/questions/19791472/web-audio-cant-get-scriptprocessor-node-to-work-in-chrome
        try {
            handleAudioProcessingEvent(event);
        } catch(e) {
            console.error('Error while handling AudioProcessingEvent', e);
            stream.getAudioTracks().forEach(function (track) {
                track.stop();
            });
            source.disconnect(scriptNode);
            if (emscriptenFloatArrayOffset) {
                Vosk._free(emscriptenFloatArrayOffset);
                console.debug(`Freed buffer at addr ${emscriptenFloatArrayOffset}`);
                emscriptenFloatArrayOffset = null;
            }
        }
    }

    source.connect(scriptNode);
});
