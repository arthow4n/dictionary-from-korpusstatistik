#!/bin/bash
set -euo pipefail

# Note: This is not fully automated but more like a notebook of commands

cut -f1 "$1" | \ # stats_all.txt
awk '/^[a-zA-ZÄÅÉÖäåéö]+$/' | tr '[:upper:]ÄÅÉÖ' '[:lower:]äåéö' |
    awk '{ print length, $0 }' | sort -n | cut -d" " -f2- | uniq | \ # stats_all_reg_uq.txt
sed '/./' >"$2"

full="$(readlink -f "$2")"
mkdir splitted
cd splitted
split -da 8 -l 1000 "$full" --additional-suffix=".txt"

# Some ideas of filtering with sed /regex/d:
# sed '/\(.\{2,\}\)\1/d'
# abcdefghijklmnopqrstuvwxyzåäö
# aeiouyåäö
# bcdfghjklmnpqrstvwxz
# [bcdfghjklmnpqrstvwxz]{2}(?!a|e|i|o|u|y|å|ä|ö|s|sj|tj|st) # probably not pronounceable
# ^OBS! Will miss cases: förarutbildningen studentbostäderna
# [aeiouyåäö]{2} # probably not pronounceable
# ^OBS! Will miss cases: öarnas rea rean reor
#
# '/\(.\{3,\}s\{0,1\}\)\1/d' # probably repeated too much
# '/\(.\{6,\}\).*\1/d' # probably repeated too much
# [bcdfghjklmnpqrstvwxz]{4}(?!a|e|i|o|u|y|å|ä|ö|s|t) # probably not pronounceable
# ^OBS! Will miss cases: tillfredsställelse
# [aeiouyåäöst]{3} # probably not pronounceable
# ^OBS! Will miss cases: tvättstuga
# sed '/\[bcdfghjklmnpqrstvwxz\]\{3\}\(?!a|e|i|o|u|y|å|ä|ö|s|t\)/d; /\[aeiouyåäöst\]\{3\}/d; /\(.\{3,\}s\{0,1\}\)\1/d; /\(.\{6,\}\).*\1/d' ./stats_all_reg_uq.txt > ./stats_all_reg_uq_v2_dd.txt

# '/\(.\{3,\}s\{0,1\}\)\1/d' # probably repeated too much
# '/\(.\{6,\}\).*\1/d' # probably repeated too much
# '/\[bcdfghjklmnpqrstvwxz\]\{4\}\(?!a|e|i|o|u|y|å|ä|ö|s|t\)/d' # probably not pronounceable
# '/\[aeiouyåäö\]\{3\}/d' # probably not pronounceable
# sed '/\[aeiouyåäö\]\{3\}/d; /\[bcdfghjklmnpqrstvwxz\]\{4\}\(?!a|e|i|o|u|y|å|ä|ö|s|t\)/d; /\(.\{6,\}\).*\1/d; /\(.\{3,\}s\{0,1\}\)\1/d' ./stats_all_reg_uq.txt > ./stats_all_reg_uq_v3.txt

#
# docker run --rm -it -v "$(readlink -f .)/tmp/stats_all_reg_uq:/tmp/stats_all_reg_uq" docker.io/arthow4n/sparv-pipeline:latest
