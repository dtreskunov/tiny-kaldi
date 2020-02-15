#!/usr/bin/env bash

set -euo pipefail

build_for_python_version() {
	local version=$1
	local dest=$2
	local two_digit_version=$(echo "$version" | sed -e 's:[^0-9]::g' | head -c 2)
	local python_root="/c/Python${two_digit_version}"

	echo "Building wheel for Python ${version} to ${dest}..."
	mkdir -p "${dest}"
	choco install python3 --no-progress -y --force --version "$version"
	"${python_root}/python" -m pip install pip wheel setuptools
	"${python_root}/python" "${TRAVIS_BUILD_DIR}/python/setup.py" bdist_wheel --dist-dir="$dest"
	echo "Wheel built for Python ${version}!"
}

build_for_python_version "$@"
