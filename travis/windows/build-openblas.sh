#!/usr/bin/env bash

set -euo pipefail

# OpenBLAS gets installed by Conan so we just need to find it
cmake_property() {
	cat "$1" | grep "set($2 " | sed -e 's/.*"\(.*\)").*/\1/'
}

OPENBLAS_DIR="${TRAVIS_BUILD_DIR}/travis/openblas"
(
	echo "Starting OpenBLAS build at $(date)"
	source "$(dirname "$0")/util.sh"

	# Conan package comes with lib/openblas.lib and include/openblas/cblas.h
	# Kaldi build expects to find lib/openblas.lib and include/cblas.h
	# see https://github.com/kaldi-asr/kaldi/blob/master/windows/kaldiwin_openblas.props
	CONAN_OPENBLAS_ROOT=$(cmake_property "${TRAVIS_BUILD_DIR}/conan_paths.cmake" CONAN_OPENBLAS_ROOT)
	[ -d "$CONAN_OPENBLAS_ROOT" ]
	mkdir -p "${OPENBLAS_DIR}/lib"
	cp -r "${CONAN_OPENBLAS_ROOT}/lib/*" "${OPENBLAS_DIR}/lib"
	mkdir -p "${OPENBLAS_DIR}/include"
	cp -r "${CONAN_OPENBLAS_ROOT}/include/openblas/*" "${OPENBLAS_DIR}/include"

	echo "OpenBLAS is installed in ${OPENBLAS_DIR}"
	find_files_with_ext .lib "$OPENBLAS_DIR"
	find_files_with_ext .h "$OPENBLAS_DIR"
) >&2

echo $OPENBLAS_DIR
