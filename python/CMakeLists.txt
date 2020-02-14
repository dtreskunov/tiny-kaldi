cmake_minimum_required(VERSION 3.10.1)
project(vosk)

set(TOP_SRCDIR "${CMAKE_SOURCE_DIR}/..")
if("x$ENV{WHEEL_FLAGS}" STREQUAL "x")
    find_package (Python REQUIRED COMPONENTS Interpreter Development)
    message(STATUS "Python found, Python_INCLUDE_DIRS=${Python_INCLUDE_DIRS}")
else()
    # docker case
    set(Python_INCLUDE_DIRS "")
    set(Python_LIBRARY "")
    set(TOP_SRCDIR "/io")
endif()

set(KALDI_ROOT "$ENV{KALDI_ROOT}")
if(MSVC)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /O2 /DFST_NO_DYNAMIC_LINKING")
    set(OPENFST_INCLUDE "${KALDI_ROOT}/../openfst/src/include")
    set(VOSK_LIBRARIES
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-online2.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-decoder.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-ivector.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-gmm.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-nnet3.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-tree.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-feat.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-lat.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-hmm.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-transform.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-cudamatrix.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-matrix.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-fstext.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-util.lib
        ${KALDI_ROOT}/kaldiwin_vs2017_OPENBLAS/x64/Release/kaldi-base.lib
        ${KALDI_ROOT}/../openfst/build64/src/lib/Release/fst.lib
        ${KALDI_ROOT}/../openfst/build64/src/extensions/ngram/Release/fstngram.lib
        ${KALDI_ROOT}/../openblas/lib/libopenblas.lib
    )
else()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -O3 -DFST_NO_DYNAMIC_LINKING")
    set(OPENFST_INCLUDE "${KALDI_ROOT}/tools/openfst/include")
    set(VOSK_LIBRARIES
        ${KALDI_ROOT}/src/online2/kaldi-online2.a
        ${KALDI_ROOT}/src/decoder/kaldi-decoder.a
        ${KALDI_ROOT}/src/ivector/kaldi-ivector.a
        ${KALDI_ROOT}/src/gmm/kaldi-gmm.a
        ${KALDI_ROOT}/src/nnet3/kaldi-nnet3.a
        ${KALDI_ROOT}/src/tree/kaldi-tree.a
        ${KALDI_ROOT}/src/feat/kaldi-feat.a
        ${KALDI_ROOT}/src/lat/kaldi-lat.a
        ${KALDI_ROOT}/src/hmm/kaldi-hmm.a
        ${KALDI_ROOT}/src/transform/kaldi-transform.a
        ${KALDI_ROOT}/src/cudamatrix/kaldi-cudamatrix.a
        ${KALDI_ROOT}/src/matrix/kaldi-matrix.a
        ${KALDI_ROOT}/src/fstext/kaldi-fstext.a
        ${KALDI_ROOT}/src/util/kaldi-util.a
        ${KALDI_ROOT}/src/base/kaldi-base.a
        ${KALDI_ROOT}/tools/openfst/lib/libfst.a
        ${KALDI_ROOT}/tools/openfst/lib/libfstngram.a
        ${KALDI_ROOT}/tools/OpenBLAS/libopenblas.a
        -lgfortran
    )
endif()

include_directories("${TOP_SRCDIR}/src" "${KALDI_ROOT}/src" ${OPENFST_INCLUDE} ${Python_INCLUDE_DIRS})
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} $ENV{WHEEL_FLAGS}")

find_package(SWIG REQUIRED)
include(${SWIG_USE_FILE})

set_property(SOURCE "${TOP_SRCDIR}/src/vosk.i" PROPERTY CPLUSPLUS ON)
swig_add_library(vosk TYPE SHARED LANGUAGE Python OUTPUT_DIR "${CMAKE_LIBRARY_OUTPUT_DIRECTORY}" OUTFILE_DIR "."
    SOURCES "${TOP_SRCDIR}/src/kaldi_recognizer.cc" "${TOP_SRCDIR}/src/vosk.i" "${TOP_SRCDIR}/src/model.cc")

swig_link_libraries(vosk ${VOSK_LIBRARIES})

set_target_properties(_vosk PROPERTIES LINK_FLAGS_RELEASE -s)
