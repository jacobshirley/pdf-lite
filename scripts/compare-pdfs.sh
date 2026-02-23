#!/bin/bash

# PDF Comparison Script
# Usage: ./compare-pdfs.sh <file1.pdf> <file2.pdf> [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo "PDF Comparison Script"
    echo ""
    echo "Usage: $0 <file1.pdf> <file2.pdf> [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -b, --binary        Binary comparison (default)"
    echo "  -x, --hex           Compare hex dumps"
    echo "  -s, --structure     Compare PDF structure using qpdf"
    echo "  -e, --end           Compare file endings (last 500 bytes)"
    echo "  -o, --offsets       Compare byte offsets"
    echo "  -a, --all           Run all comparison types"
    echo ""
    echo "Examples:"
    echo "  $0 original.pdf modified.pdf"
    echo "  $0 file1.pdf file2.pdf --structure"
    echo "  $0 file1.pdf file2.pdf --all"
}

# Check if files exist
check_files() {
    if [[ ! -f "$1" ]]; then
        echo -e "${RED}Error: File '$1' not found${NC}"
        exit 1
    fi
    if [[ ! -f "$2" ]]; then
        echo -e "${RED}Error: File '$2' not found${NC}"
        exit 1
    fi
}

# Binary comparison
binary_compare() {
    echo -e "${BLUE}== Binary Comparison ==${NC}"
    
    # File sizes
    local size1=$(stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null)
    local size2=$(stat -f%z "$2" 2>/dev/null || stat -c%s "$2" 2>/dev/null)
    
    echo "File 1 size: $size1 bytes"
    echo "File 2 size: $size2 bytes"
    echo "Size difference: $((size2 - size1)) bytes"
    echo ""
    
    # Binary diff
    if cmp -s "$1" "$2"; then
        echo -e "${GREEN}Files are identical${NC}"
    else
        echo -e "${YELLOW}Files differ${NC}"
        echo "First difference at:"
        cmp -l "$1" "$2" | head -5
    fi
    echo ""
}

# Hex dump comparison
hex_compare() {
    echo -e "${BLUE}== Hex Dump Comparison ==${NC}"
    
    # Create temporary files for hex dumps
    local hex1=$(mktemp)
    local hex2=$(mktemp)
    
    hexdump -C "$1" > "$hex1"
    hexdump -C "$2" > "$hex2"
    
    if diff -q "$hex1" "$hex2" >/dev/null; then
        echo -e "${GREEN}Hex dumps are identical${NC}"
    else
        echo -e "${YELLOW}Hex dumps differ:${NC}"
        diff -u "$hex1" "$hex2" | head -20
    fi
    
    rm -f "$hex1" "$hex2"
    echo ""
}

# PDF structure comparison using qpdf
structure_compare() {
    echo -e "${BLUE}== PDF Structure Comparison ==${NC}"
    
    # Check if qpdf is available
    if ! command -v qpdf &> /dev/null; then
        echo -e "${RED}qpdf not found. Install with: brew install qpdf${NC}"
        return 1
    fi
    
    # Create temporary files
    local struct1=$(mktemp)
    local struct2=$(mktemp)
    local xref1=$(mktemp)
    local xref2=$(mktemp)
    
    # Get structure info
    echo "Checking PDF validity..."
    echo "File 1:"
    qpdf --check "$1" 2>&1 || true
    echo ""
    echo "File 2:"
    qpdf --check "$2" 2>&1 || true
    echo ""
    
    # Compare xref tables
    echo "Comparing cross-reference tables..."
    qpdf --show-xref "$1" > "$xref1" 2>/dev/null || echo "Failed to extract xref from file 1"
    qpdf --show-xref "$2" > "$xref2" 2>/dev/null || echo "Failed to extract xref from file 2"
    
    if [[ -s "$xref1" ]] && [[ -s "$xref2" ]]; then
        if diff -q "$xref1" "$xref2" >/dev/null; then
            echo -e "${GREEN}Cross-reference tables are identical${NC}"
        else
            echo -e "${YELLOW}Cross-reference tables differ:${NC}"
            diff -u "$xref1" "$xref2" | head -20
        fi
    fi
    
    rm -f "$struct1" "$struct2" "$xref1" "$xref2"
    echo ""
}

# Compare file endings
ending_compare() {
    echo -e "${BLUE}== File Endings Comparison (last 500 bytes) ==${NC}"
    
    echo "File 1 ending:"
    tail -c 500 "$1" | hexdump -C
    echo ""
    
    echo "File 2 ending:"
    tail -c 500 "$2" | hexdump -C
    echo ""
    
    # Compare endings
    local end1=$(mktemp)
    local end2=$(mktemp)
    
    tail -c 500 "$1" > "$end1"
    tail -c 500 "$2" > "$end2"
    
    if cmp -s "$end1" "$end2"; then
        echo -e "${GREEN}File endings are identical${NC}"
    else
        echo -e "${YELLOW}File endings differ${NC}"
        echo "Differences:"
        diff -u <(hexdump -C "$end1") <(hexdump -C "$end2") | head -10
    fi
    
    rm -f "$end1" "$end2"
    echo ""
}

# Compare byte offsets at specific locations
offset_compare() {
    echo -e "${BLUE}== Byte Offset Comparison ==${NC}"
    
    # Check startxref locations
    echo "Looking for startxref locations..."
    
    echo "File 1 startxref locations:"
    grep -abo "startxref" "$1" || echo "No startxref found"
    
    echo "File 2 startxref locations:"
    grep -abo "startxref" "$2" || echo "No startxref found"
    
    echo ""
    
    # Check %%EOF locations
    echo "File 1 %%EOF locations:"
    grep -abo "%%EOF" "$1" || echo "No %%EOF found"
    
    echo "File 2 %%EOF locations:"
    grep -abo "%%EOF" "$2" || echo "No %%EOF found"
    
    echo ""
}

# Main function
main() {
    local file1=""
    local file2=""
    local do_binary=false
    local do_hex=false
    local do_structure=false
    local do_ending=false
    local do_offsets=false
    local do_all=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -b|--binary)
                do_binary=true
                shift
                ;;
            -x|--hex)
                do_hex=true
                shift
                ;;
            -s|--structure)
                do_structure=true
                shift
                ;;
            -e|--end)
                do_ending=true
                shift
                ;;
            -o|--offsets)
                do_offsets=true
                shift
                ;;
            -a|--all)
                do_all=true
                shift
                ;;
            *)
                if [[ -z "$file1" ]]; then
                    file1="$1"
                elif [[ -z "$file2" ]]; then
                    file2="$1"
                else
                    echo -e "${RED}Error: Too many arguments${NC}"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Check if we have both files
    if [[ -z "$file1" ]] || [[ -z "$file2" ]]; then
        echo -e "${RED}Error: Please provide two PDF files to compare${NC}"
        show_help
        exit 1
    fi
    
    # Check if files exist
    check_files "$file1" "$file2"
    
    # If no specific options, default to binary comparison
    if [[ "$do_all" == true ]]; then
        do_binary=true
        do_hex=true
        do_structure=true
        do_ending=true
        do_offsets=true
    elif [[ "$do_binary" == false ]] && [[ "$do_hex" == false ]] && [[ "$do_structure" == false ]] && [[ "$do_ending" == false ]] && [[ "$do_offsets" == false ]]; then
        do_binary=true
    fi
    
    echo -e "${GREEN}Comparing PDFs:${NC}"
    echo "File 1: $file1"
    echo "File 2: $file2"
    echo ""
    
    # Run comparisons
    [[ "$do_binary" == true ]] && binary_compare "$file1" "$file2"
    [[ "$do_hex" == true ]] && hex_compare "$file1" "$file2"
    [[ "$do_structure" == true ]] && structure_compare "$file1" "$file2"
    [[ "$do_ending" == true ]] && ending_compare "$file1" "$file2"
    [[ "$do_offsets" == true ]] && offset_compare "$file1" "$file2"
    
    echo -e "${GREEN}Comparison complete.${NC}"
}

# Run main function
main "$@"