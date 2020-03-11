KALDI_ROOT ?= /opt/kaldi
CFLAGS := -g -O2 -DPIC -fPIC -Wno-unused-function -std=c++11
CPPFLAGS := -I$(KALDI_ROOT)/src -I$(KALDI_ROOT)/tools/openfst/include -I.
EMCC_PATH := $(shell which emcc)
EMCC_DIRNAME := $(shell dirname $(EMCC_PATH))
WEBIDL_BINDER := python $(EMCC_DIRNAME)/tools/webidl_binder.py

KALDI_LIBS = \
             ${KALDI_ROOT}/src/base/kaldi-base.bc \
             ${KALDI_ROOT}/src/cudamatrix/kaldi-cudamatrix.bc \
             ${KALDI_ROOT}/src/decoder/kaldi-decoder.bc \
             ${KALDI_ROOT}/src/feat/kaldi-feat.bc \
             ${KALDI_ROOT}/src/fstext/kaldi-fstext.bc \
             ${KALDI_ROOT}/src/gmm/kaldi-gmm.bc \
             ${KALDI_ROOT}/src/hmm/kaldi-hmm.bc \
             ${KALDI_ROOT}/src/ivector/kaldi-ivector.bc \
             ${KALDI_ROOT}/src/lat/kaldi-lat.bc \
             ${KALDI_ROOT}/src/matrix/kaldi-matrix.bc \
             ${KALDI_ROOT}/src/nnet3/kaldi-nnet3.bc \
             ${KALDI_ROOT}/src/online2/kaldi-online2.bc \
             ${KALDI_ROOT}/src/transform/kaldi-transform.bc \
             ${KALDI_ROOT}/src/tree/kaldi-tree.bc \
             ${KALDI_ROOT}/src/util/kaldi-util.bc \
             ${KALDI_ROOT}/tools/gsl/cblas/.libs/libgslcblas.so \
             ${KALDI_ROOT}/tools/CLAPACK-WA/F2CLIBS/libf2c.bc \
             ${KALDI_ROOT}/tools/CLAPACK-WA/lapack_WA.bc \
             ${KALDI_ROOT}/tools/CLAPACK-WA/libcblaswr.bc \
             ${KALDI_ROOT}/tools/openfst/src/lib/libfst.a \
             ${KALDI_ROOT}/tools/openfst/src/extensions/ngram/libfstngram.a

all: vosk.js vosk.wasm

vosk.bc: glue.cpp
	$(CXX) -o $@ $(CPPFLAGS) $(CFLAGS) \
		-include ../src/kaldi_recognizer.h \
		-include ../src/model.h \
		-include ../src/spk_model.h \
		../src/kaldi_recognizer.cc \
		../src/model.cc \
		../src/spk_model.cc \
		glue.cpp

vosk.js vosk.wasm: vosk.bc glue.js
	$(CXX) -o vosk.js vosk.bc $(KALDI_LIBS) \
		-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
		-s MODULARIZE=1 \
		-s EXPORT_NAME=Vosk \
		--post-js glue.js

glue.cpp glue.js: vosk.idl
	$(WEBIDL_BINDER) vosk.idl glue

clean:
	$(RM) -r build
	$(RM) -r org model-en

model-en:
	wget https://github.com/alphacep/kaldi-android-demo/releases/download/2020-01/alphacep-model-android-en-us-0.3.tar.gz
	tar xf alphacep-model-android-en-us-0.3.tar.gz && rm alphacep-model-android-en-us-0.3.tar.gz
	mv alphacep-model-android-en-us-0.3 model-en

run: model-en
	javac test/*.java org/kaldi/*.java
	java -Djava.library.path=. -cp . test.DecoderTest
