KALDI_ROOT ?= /opt/kaldi

COMPILE_FLAGS := \
	-r \
	-std=c++11 \
	-O3 \
	-Wno-unused-function \
	-I$(KALDI_ROOT)/src \
	-I$(KALDI_ROOT)/tools/openfst/include \
	-I.

LINK_FLAGS := \
	--bind \
	-O3 \
	-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=Vosk

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
	${KALDI_ROOT}/tools/openfst/lib/libfst.a \
	${KALDI_ROOT}/tools/openfst/lib/libfstngram.a

SRC = \
	bindings.cc \
	../src/kaldi_recognizer.cc \
	../src/model.cc \
	../src/spk_model.cc

all: vosk.js vosk.wasm

vosk.bc: $(SRC)
	$(CXX) -o $@ $(COMPILE_FLAGS) $(SRC)

vosk.js vosk.wasm: vosk.bc
	$(CXX) -o vosk.js vosk.bc $(LINK_FLAGS) $(KALDI_LIBS)

clean:
	git clean -f -X .
