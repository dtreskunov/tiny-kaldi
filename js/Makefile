MAKEFILE_ROOT := $(CURDIR)
PROJ_ROOT := $(realpath $(CURDIR)/..)
KALDI_ROOT ?= /opt/kaldi

COMPILE_FLAGS := \
	-r \
	-O3 \
	-std=c++17 \
	-Wno-unused-function \
	-I/opt/include \
	-I$(KALDI_ROOT)/src \
	-I$(KALDI_ROOT)/tools/openfst/include \
	-I$(MAKEFILE_ROOT)

LINK_FLAGS := \
	--bind \
	-O3 \
	-std=c++17 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=Vosk

LIBS = \
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
	${KALDI_ROOT}/tools/openfst/lib/libfst.a \
	${KALDI_ROOT}/tools/openfst/lib/libfstngram.a \
	/opt/lib/libarchive.so

SRC = \
	$(MAKEFILE_ROOT)/bindings.cc \
	$(MAKEFILE_ROOT)/utils.cc \
	$(PROJ_ROOT)/src/kaldi_recognizer.cc \
	$(PROJ_ROOT)/src/model.cc \
	$(PROJ_ROOT)/src/spk_model.cc

all: dist example

dist: build/dist/vosk.js

build/vosk.bc: $(SRC)
	mkdir -p $(dir $@)
	$(CXX) -o $@ $(COMPILE_FLAGS) $(SRC)

build/dist/vosk.js: build/vosk.bc vosk.pre.js
	mkdir -p $(dir $@)
	cd $(dir $@); \
	$(CXX) -o $(notdir $@) $(MAKEFILE_ROOT)/build/vosk.bc --pre-js $(MAKEFILE_ROOT)/vosk.pre.js $(LINK_FLAGS) $(LIBS)

build/example/model-en.tar.gz:
	mkdir -p $(dir $@)
	curl --fail -L -o $@ https://github.com/alphacep/kaldi-android-demo/releases/download/2020-01/alphacep-model-android-en-us-0.3.tar.gz

example: build/example/model-en.tar.gz build/dist/vosk.js
	install --target-directory=build/example example/*

clean:
	git clean -f -X .

.PHONY: all dist clean example
