#!/bin/bash
set -euo pipefail
trap cleanup ERR EXIT
trap leave SIGINT SIGTERM

LEAVING=0

cleanup() {
    echo "$(date -u)" "Cleaning up..."
    trap - ERR EXIT
    mv *.txt ../splitted
    echo "$(date -u)" "Stopping sparv preload..."
    sparv preload stop --socket /tmp/sparv_preload.sock
}

leave() {
    echo "$(date -u)" "Leaving after this round..."
    trap - SIGINT SIGTERM
    LEAVING=1
}

sparv preload --socket /tmp/sparv_preload.sock --processes 16 &
until ss -l | grep -q /tmp/sparv_preload.sock; do
    echo "$(date -u)" "Waiting for sparv preload..."
    sleep 3
done

COUNTER=0
for f in ../splitted/*.txt; do
    echo "$(date -u)" processng "$f"
    mv "$f" .
    COUNTER=$(($COUNTER + 1))
    if [[ $COUNTER -gt 256 ]]; then
        COUNTER=0
        rm -rf sparv-workdir/ .snakemake/ logs/
        sparv run -v -j 16 --socket /tmp/sparv_preload.sock
        if [[ $LEAVING -ne 0 ]]; then
            break
        fi
        rm *.txt
    fi
done
