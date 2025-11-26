#!/bin/bash

set -e

if [ $# -ne 2 ]; then
  echo "Usage: $0 <input-pdf> <output-dir>"
  exit 1
fi

INPUT_PDF="$1"
OUTPUT_DIR="$2"

if [ ! -f "$INPUT_PDF" ]; then
  echo "Error: input file '$INPUT_PDF' does not exist."
  exit 1
fi

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

USER_PWD="userpass"
OWNER_PWD="ownerpass"

# Format: "<suffix> <qpdf encryption args...> --"
CONFIGS=(
  "rc4-40 --encrypt \"$USER_PWD\" \"$OWNER_PWD\" 40 --"
  "rc4-128 --encrypt \"$USER_PWD\" \"$OWNER_PWD\" 128 --"
  "aes-128 --encrypt \"$USER_PWD\" \"$OWNER_PWD\" 128 --"
  "aes-256 --encrypt \"$USER_PWD\" \"$OWNER_PWD\" 256 --"
)

for config in "${CONFIGS[@]}"; do
  SUFFIX=$(echo "$config" | awk '{print $1}')
  ARGS=$(echo "$config" | cut -d' ' -f2-)
  echo $ARGS
  OUTPUT="$OUTPUT_DIR/$(basename "${INPUT_PDF%.pdf}")-$SUFFIX.pdf"
  echo "🔐 Creating $OUTPUT"
  eval qpdf "\"$INPUT_PDF\"" "\"$OUTPUT\"" $ARGS --allow-weak-crypto
done

echo "✅ Done. Encrypted PDFs saved to: $OUTPUT_DIR"
