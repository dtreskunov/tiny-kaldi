[![Build Status](https://travis-ci.com/dtreskunov/tiny-kaldi.svg?branch=master)](https://travis-ci.com/dtreskunov/tiny-kaldi)

Language bindings for Vosk and Kaldi to access high-quality speech recognition algorithms
from various languages and on various platforms.

  * Python on Linux, Windows and Raspberry Pi
  * Node
  * Java
  * Android
  * iOS

-----
This is a fork of [alphacep/vosk-api](https://github.com/alphacep/vosk-api) aimed at
providing timely releases and minor additions to the upstream project. I intend to provide
PRs for my changes, hoping that they would get merged so that this fork can be archived.

You can see the list of changes in this fork using [GitHub compare view](https://github.com/alphacep/vosk-api/compare/master...dtreskunov:master).

**Releases** While the upstream project uses three-number version strings, this fork
appends a fourth number so as to indicate which *vosk-api* release it's based on and not
clash with the upstream releases. You can download the latest release on the
[Releases](https://github.com/dtreskunov/tiny-kaldi/releases) page.

**Development Plans**
- [x] Create automatic build pipeline
- [x] Produce easily-installable packages for Windows
- [ ] Produce easily-installable packages for Mac
- [ ] Publish Java JAR to Maven Central

-----

## Android build

```
cd android
gradle build
```

Please note that medium blog post about 64-bit is not relevant anymore, the script builds x86, arm64 and armv7 libraries automatically without any modifications.

## Python installation from PyPI

The easiest way to install Vosk is with `pip`. You do not have to compile anything. We currently support Linux on x86_64 and Raspberry Pi (armv6 and armv7). Mac builds will come soon.

Make sure you have newer pip and python:

  * Python version >= 3.5
  * pip version >= 19.0

Uprade python and pip if needed. Then install Vosk on Linux with a simple command

```
pip3 install vosk
```

## Compilation from source

If you still want to build from scratch, you can compile Kaldi and Vosk yourself. The compilation is straightforward but might be a little confusing for a newbie. In case you want to follow this, please watch the errors.

#### Kaldi compilation for local Python, Node and Java modules

```
git clone -b lookahead --single-branch https://github.com/alphacep/kaldi
cd kaldi/tools
make
```

install all dependencies and repeat `make` if needed

```
extras/install_openblas.sh
cd ../src
./configure --mathlib=OPENBLAS --shared --use-cuda=no
make -j 10
```

#### Java example API build

```
cd java && KALDI_ROOT=<KALDI_ROOT> make
wget https://github.com/alphacep/kaldi-android-demo/releases/download/2020-01/alphacep-model-android-en-us-0.3.tar.gz
tar xf alphacep-model-android-en-us-0.3.tar.gz 
mv alphacep-model-android-en-us-0.3 model
make run
```

#### Python module build

Then build the python module

```
export KALDI_ROOT=<KALDI_ROOT>
cd python
python3 setup.py install
```

## Running the example code with python

Run like this:

```
cd vosk-api/python/example
wget https://github.com/alphacep/kaldi-android-demo/releases/download/2020-01/alphacep-model-android-en-us-0.3.tar.gz
tar xf alphacep-model-android-en-us-0.3.tar.gz 
mv alphacep-model-android-en-us-0.3 model
python3 ./test_local.py test.wav
```

There are models for other languages available too.

To run with your audio file make sure it has proper format - PCM 16khz 16bit mono, otherwise decoding will not work.

Microphone example will come soon.
