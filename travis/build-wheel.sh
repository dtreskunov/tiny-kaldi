#!/usr/bin/env bash

set -euo pipefail

build_for_python_version() {
	local python_exe="$1"
	local src="$2" # root of git repo
	local dest="$3" # where the whl file is to be written
	local version_to_build=$(${python_exe} "${src}/python/setup.py" --version)

	echo "Building wheel (python_exe=${python_exe}, src=${src}, dest=${dest}, version_to_build=${version_to_build})..."
	mkdir -p "${dest}"
	"${python_exe}" -m pip install --upgrade pip wheel setuptools
	TOP_SRCDIR="$src" \
		VERSION="$version_to_build" \
		"${python_exe}" -m pip wheel "${src}/python" --wheel-dir "$dest" -v
	echo "Wheel built (python_exe=${python_exe}, src=${src}, dest=${dest}, version_to_build=${version_to_build})"
}

build_for_python_version "$@"
