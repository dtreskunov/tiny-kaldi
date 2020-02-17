#!/usr/bin/env bash
set -e -x

build_wheel="$(dirname $0)/build-wheel.sh"

# Compile wheels
for pypath in /opt/python/cp3*; do
    if [[ $pypath == *cp34* ]]; then
        echo "Skipping building wheel for deprecated Python version ${pypath}"
        continue
    fi

    # use _PYTHON_HOST_PLATFORM to tell distutils.util.get_platform() the actual platform
    # otherwise, building on linux-armv6l will create a wheel with armv7 tags
    case $DEFAULT_DOCKCROSS_IMAGE in
        *linux-armv6*)
            export _PYTHON_HOST_PLATFORM=linux-armv6l
    esac

    python_exe="${pypath}/bin/python3"

    # call build-wheel.sh
    PYTHON_CFLAGS=$(${pypath}/bin/python3-config --cflags) \
        KALDI_ROOT=/opt/kaldi \
        build_wheel "$python_exe" /io /opt/wheelhouse

    "$python_exe" -m pip install --upgrade auditwheel

    mkdir -p /io/wheelhouse
    if [[ $DEFAULT_DOCKCROSS_IMAGE == *manylinux* ]]; then
        # Bundle external shared libraries into the wheels
        "$python_exe" -m auditwheel repair /opt/wheelhouse/*.whl -w /io/wheelhouse
        rm /opt/wheelhouse/*.whl
    else
        # If not running on a manylinux-compatible image, we just have to hope for the best :)
        "$python_exe" -m auditwheel show /opt/wheelhouse/*.whl
        mv /opt/wheelhouse/*.whl /io/wheelhouse
    fi
done
