#include <emscripten/bind.h>
#include "utils.h"
#include "../src/kaldi_recognizer.h"
#include "../src/model.h"
#include "../src/spk_model.h"

using namespace emscripten;

struct ArchiveHelperWrapper : public wrapper<ArchiveHelper> {
    EMSCRIPTEN_WRAPPER(ArchiveHelperWrapper);
    void onsuccess() {
        return call<void>("onsuccess");
    }
    void onerror(const std::string &what) {
        return call<void>("onerror", what);
    }
};

EMSCRIPTEN_BINDINGS(vosk) {
    class_<ArchiveHelper>("ArchiveHelper")
        .function("Extract", &ArchiveHelper::Extract)
        .allow_subclass<ArchiveHelperWrapper>("ArchiveHelperWrapper")
        .function("onsuccess", optional_override([](ArchiveHelper& self) {
            return self.ArchiveHelper::onsuccess();
        }))
        .function("onerror", optional_override([](ArchiveHelper& self, const std::string &what) {
            return self.ArchiveHelper::onerror(what);
        }))
        ;

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
