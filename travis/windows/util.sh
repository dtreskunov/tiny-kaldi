# "source" this file rather than executing it directly

check_travis_remaining_time_budget_s() {
	if [[ ! "${TRAVIS_WILL_KILL_BUILD_AT:-}" ]]; then
		echo "Unable to check remaining time budget since TRAVIS_WILL_KILL_BUILD_AT is not set"
		return 1
	fi
	local now=$(date +%s)
	local remaining=$(($TRAVIS_WILL_KILL_BUILD_AT - $now))
	local minimum=$1
    if [ $remaining -lt $minimum ]; then
		echo "Travis CI will kill this build in ${remaining} seconds, less than required minimum of ${minimum}"
		return 2
	fi
}

find_files_with_ext() {
    echo "Listing ${1} files in ${2}:"
    find "$2" -type f -name "*${1}"
}

if [ -f "${HOME}/.travis/functions" ]; then
	source "${HOME}/.travis/functions"
else
	source "$(dirname $0)/fake.sh"
fi
