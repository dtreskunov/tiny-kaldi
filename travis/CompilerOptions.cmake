# https://stackoverflow.com/a/46000520

if (MSVC)
    # no warnings, please - TravisCI kills me after 20000 lines
    string (REGEX REPLACE "/W[0-4]" "/W0" CMAKE_CXX_FLAGS_INIT "${CMAKE_CXX_FLAGS_INIT}")
endif()
