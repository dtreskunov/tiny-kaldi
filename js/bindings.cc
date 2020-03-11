#include <emscripten/bind.h>
#include "../src/kaldi_recognizer.h"
#include "../src/model.h"
#include "../src/spk_model.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(vosk) {
    class_<Model>("Model")
        .constructor<const char *>()
        .function("SampleFrequency", &Model::SampleFrequency)
        ;

    class_<SpkModel>("SpkModel")
        .constructor<const char *>()
        ;

    class_<KaldiRecognizer>("KaldiRecognizer")
        .constructor<Model &, float>()
        .function("AcceptWaveform",
            select_overload<bool(const float *, int)>(&KaldiRecognizer::AcceptWaveform),
            allow_raw_pointers())
        .function("Result", &KaldiRecognizer::Result)
        .function("FinalResult", &KaldiRecognizer::FinalResult)
        .function("PartialResult", &KaldiRecognizer::PartialResult)
        ;
}
