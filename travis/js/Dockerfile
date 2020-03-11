FROM dockcross/web-wasm

RUN apt-get update \
    && apt-get install -y \
        subversion \
        zlib1g-dev \
        unzip sox \
        gfortran \
        libc6-dev-i386

WORKDIR /opt/kaldi
RUN git clone https://github.com/kaldi-asr/kaldi . \
    && git checkout 31b0f0861
ADD kaldi.patch /tmp
RUN git apply -v /tmp/kaldi.patch

WORKDIR /opt/kaldi/tools
RUN extras/check_dependencies.sh
RUN emmake make -j $(nproc) CXXFLAGS=-O3 LDFLAGS=-O3 openfst OPENFST_CONFIGURE="--enable-static --disable-shared --enable-far --enable-ngram-fsts --enable-lookahead-fsts --with-pic"
RUN find . -type f -path '*/.libs/*.a' -exec sh -xc 'mv {} $(dirname {})/..' \;

WORKDIR /opt/kaldi/tools/CLAPACK-WA
RUN git clone https://github.com/adrianbg/CLAPACK-WA .
ADD CLAPACK-WA.patch /tmp
RUN git apply -v /tmp/CLAPACK-WA.patch
RUN emmake make -j $(nproc)

WORKDIR /opt/kaldi/tools/gsl
RUN curl --fail -q -L http://mirrors.ocf.berkeley.edu/gnu/gsl/gsl-2.6.tar.gz | \
    tar xz --strip-components=1
RUN emconfigure ./configure
RUN emmake make -j $(nproc)

WORKDIR /opt/kaldi/src
RUN CXXFLAGS=-O3 LDFLAGS=-O3 emconfigure ./configure --use-cuda=no --static --static-fst=yes --clapack-root=../tools/CLAPACK-WA --gsl-root=../tools/gsl --fst-root=../tools/openfst-1.6.7/src
RUN emmake make -j $(nproc)
