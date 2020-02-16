# From https://github.com/raydouglass/cmake_setuptools

# See https://cmake.org/cmake/help/latest/manual/cmake.1.html for cmake CLI options

import os
import subprocess
import shutil
import sys
from glob import glob
from setuptools import Extension
from setuptools.command.build_ext import build_ext
from setuptools.command.build_py import build_py
from setuptools.command.install_lib import install_lib

CMAKE_EXE = os.environ.get('CMAKE_EXE', shutil.which('cmake'))


def check_for_cmake():
    if not CMAKE_EXE:
        print('cmake executable not found. '
              'Set CMAKE_EXE environment or update your path')
        sys.exit(1)


class CMakeExtension(Extension):
    """
    setuptools.Extension for cmake
    """

    def __init__(self, name, pkg_name, sourcedir=''):
        check_for_cmake()
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)
        self.pkg_name = pkg_name


class CMakeBuildExt(build_ext):
    """
    setuptools build_exit which builds using cmake & make
    You can add cmake args with the CMAKE_COMMON_VARIABLES environment variable
    """

    def build_extension(self, ext):
        check_for_cmake()
        if isinstance(ext, CMakeExtension):
            output_dir = os.path.abspath(
                os.path.dirname(self.get_ext_fullpath(ext.pkg_name + "/" + ext.name)))

            build_type = 'Debug' if self.debug else 'Release'
            cmake_args = [CMAKE_EXE,
                          '-S', ext.sourcedir,
                          '-B', self.build_temp,
                          '-Wno-dev',
                          '--debug-output',
                          '-DPython_EXECUTABLE=' + sys.executable.replace("\\", "/"),
                          '-DCMAKE_VERBOSE_MAKEFILE:BOOL=ON',
                          '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=' + output_dir.replace("\\", "/"),
                          '-DCMAKE_BUILD_TYPE=' + build_type]
            cmake_args.extend(
                [x for x in
                 os.environ.get('CMAKE_COMMON_VARIABLES', '').split(' ')
                 if x])

            env = os.environ.copy()
            print('Generating native project files:', cmake_args)
            subprocess.check_call(cmake_args,
                                  env=env)
            build_args = [CMAKE_EXE, '--build', self.build_temp]

            # This ugly hack is needed because CMake Visual Studio generator ignores CMAKE_BUILD_TYPE and creates
            # Debug (default) and Release configurations. When building, the first one is chosen by default.
            # For some reason, setting CMAKE_CONFIGURATION_TYPES inside CMakeLists.txt leads to error MSB8020 during build.
            if os.name == 'nt':
                build_args.extend(['--config', build_type])

            print('Building:', build_args)
            subprocess.check_call(build_args,
                                  env=env)
            print()
        else:
            super().build_extension(ext)



class CMakeBuildExtFirst(build_py):
    def run(self):
        self.run_command("build_ext")
        return super().run()

class InstallCMakeLibs(install_lib):
    """
    Get the libraries from the parent distribution, use those as the outfiles

    Skip building anything; everything is already built, forward libraries to
    the installation step
    """

    def run(self):
        """
        Copy libraries from the bin directory and place them as appropriate
        """
        # We have already built the libraries in the previous build_ext step
        self.skip_build = True
        bin_dir = self.distribution.bin_dir

        # Depending on the files that are generated from your cmake
        # build chain, you may need to change the below code, such that
        # your files are moved to the appropriate location when the installation
        # is run
        self.announce(f"Moving library files bin_dir={bin_dir} build_dir={self.build_dir}, install_dir={self.install_dir}", level=3)
        self.announce('.pyd files in bin_dir: ' + '\n'.join(glob(bin_dir + '/**/*.pyd')), level=3)

        # libs = [os.path.join(bin_dir, _lib) for _lib in 
        #         os.listdir(bin_dir) if 
        #         os.path.isfile(os.path.join(bin_dir, _lib)) and 
        #         os.path.splitext(_lib)[1] in [".dll", ".so"]
        #         and not (_lib.startswith("python") or _lib.startswith(PACKAGE_NAME))]

        # for lib in libs:

        #     shutil.move(lib, os.path.join(self.build_dir,
        #                                   os.path.basename(lib)))

        # Mark the libs for installation, adding them to 
        # distribution.data_files seems to ensure that setuptools' record 
        # writer appends them to installed-files.txt in the package's egg-info
        #
        # Also tried adding the libraries to the distribution.libraries list, 
        # but that never seemed to add them to the installed-files.txt in the 
        # egg-info, and the online recommendation seems to be adding libraries 
        # into eager_resources in the call to setup(), which I think puts them 
        # in data_files anyways. 
        # 
        # What is the best way?

        # These are the additional installation files that should be
        # included in the package, but are resultant of the cmake build
        # step; depending on the files that are generated from your cmake
        # build chain, you may need to modify the below code

        # self.distribution.data_files = [os.path.join(self.install_dir, 
        #                                              os.path.basename(lib))
        #                                 for lib in libs]

        # Must be forced to run after adding the libs to data_files

        # self.distribution.run_command("install_data")

        super().run()
    
    def get_outputs(self):
        res = super().get_outputs()
        self.announce(f"get_outputs: returning {res}")
        return res

__all__ = ['CMakeBuildExt', 'CMakeExtension', 'CMakeBuildExtFirst', 'InstallCMakeLibs']
