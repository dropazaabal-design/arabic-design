#!/usr/bin/env bash
# Everything the comparison needs, in one archive to bring back: outputs, logs, licences, commits.
set -euo pipefail
WORK=${WORK:-/workspace/omni}; cd "$WORK"
tar czf omni-trial-results.tgz out logs licenses
ls -la omni-trial-results.tgz; sha256sum omni-trial-results.tgz
