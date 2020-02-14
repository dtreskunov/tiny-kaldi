#!/usr/bin/env bash

set -euo pipefail

# OpenBLAS gets installed by Conan so we just need to find it
cmake_property() {
	cat "$1" | grep "set($2 " | sed -e 's/.*"\(.*\)").*/\1/'
}

OPENBLAS_DIR=$(cmake_property "${TRAVIS_BUILD_DIR}/conan_paths.cmake" CONAN_OPENBLAS_ROOT)
(
	echo "Starting OpenBLAS build at $(date)"
	source "$(dirname "$0")/util.sh"

	echo "OpenBLAS is installed in ${OPENBLAS_DIR}"
	find_files_with_ext .lib "$OPENBLAS_DIR"
) >&2

echo $OPENBLAS_DIR
