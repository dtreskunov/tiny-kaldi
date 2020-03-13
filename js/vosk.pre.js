// https://emscripten.org/docs/api_reference/module.html#Module.preRun
Vosk.preRun = Vosk.preRun || [];
Vosk.preRun.push(function() {
    // plumb some libraries so they're accessible from user HTML
    Vosk.FS = FS;
    Vosk.MEMFS = MEMFS;
    Vosk.NODEFS = NODEFS;
    Vosk.IDBFS = IDBFS;
    Vosk.WORKERFS = WORKERFS;
});
