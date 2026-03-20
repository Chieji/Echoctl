#!/bin/bash

###############################################################################
# Gemini Workflow Examples for Echoctl
# Practical use cases and templates for common tasks
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Gemini Workflow Examples${NC}"
echo -e "${BLUE}========================================${NC}\n"

###############################################################################
# Example 1: Document OCR and Extraction
###############################################################################
example_document_ocr() {
    echo -e "${YELLOW}Example 1: Document OCR and Data Extraction${NC}"
    echo "Extracting text and data from a PDF document..."
    
    # OCR extraction
    echoctl exec gemini-workflow:analyzeDocument \
        --documentPath "./examples/sample_invoice.pdf" \
        --analysisType ocr
    
    # Data extraction
    echoctl exec gemini-workflow:analyzeDocument \
        --documentPath "./examples/sample_invoice.pdf" \
        --analysisType extraction
    
    echo -e "${GREEN}✓ Document analysis complete\n${NC}"
}

###############################################################################
# Example 2: Code Review Pipeline
###############################################################################
example_code_review() {
    echo -e "${YELLOW}Example 2: Automated Code Review${NC}"
    echo "Reviewing TypeScript code for quality and security..."
    
    CODE='
    async function fetchUserData(userId: string) {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        return data;
    }
    '
    
    # Code review
    echoctl exec gemini-workflow:analyzeCode \
        --code "$CODE" \
        --analysisType review
    
    # Generate tests
    echoctl exec gemini-workflow:analyzeCode \
        --code "$CODE" \
        --analysisType test
    
    echo -e "${GREEN}✓ Code review complete\n${NC}"
}

###############################################################################
# Example 3: Multimodal Image Analysis
###############################################################################
example_multimodal_analysis() {
    echo -e "${YELLOW}Example 3: Multimodal Image Analysis${NC}"
    echo "Analyzing screenshot with context..."
    
    # Take screenshot
    if command -v gnome-screenshot &> /dev/null; then
        gnome-screenshot -f /tmp/screenshot.png
        
        echoctl exec gemini-workflow:multimodalAnalysis \
            --text "This is a user interface screenshot" \
            --imagePath "/tmp/screenshot.png" \
            --prompt "Identify all UI elements, describe the layout, and suggest improvements"
    else
        echo "Screenshot tool not available on this system"
    fi
    
    echo -e "${GREEN}✓ Multimodal analysis complete\n${NC}"
}

###############################################################################
# Example 4: Long Document Analysis
###############################################################################
example_long_context() {
    echo -e "${YELLOW}Example 4: Long Document Analysis${NC}"
    echo "Analyzing multiple documents with context awareness..."
    
    # Create sample documents
    cat > /tmp/doc1.txt << 'EOF'
Machine learning is a subset of artificial intelligence that enables systems
to learn and improve from experience without being explicitly programmed.
EOF
    
    cat > /tmp/doc2.txt << 'EOF'
Deep learning uses neural networks with multiple layers to process data.
It has revolutionized computer vision, natural language processing, and
other AI domains.
EOF
    
    echoctl exec gemini-workflow:processLongContext \
        --documents '["/tmp/doc1.txt", "/tmp/doc2.txt"]' \
        --query "Summarize the relationship between machine learning and deep learning"
    
    echo -e "${GREEN}✓ Long context analysis complete\n${NC}"
}

###############################################################################
# Example 5: Structured Data Extraction
###############################################################################
example_structured_extraction() {
    echo -e "${YELLOW}Example 5: Structured Data Extraction${NC}"
    echo "Extracting structured data in JSON format..."
    
    CONTENT="
    Customer: John Doe
    Email: john@example.com
    Phone: +1-555-0123
    Order ID: ORD-2024-001
    Total: \$299.99
    Status: Shipped
    "
    
    # Extract as JSON
    echoctl exec gemini-workflow:extractStructuredData \
        --content "$CONTENT" \
        --format json \
        --extractionPrompt "Extract customer name, email, phone, order ID, total amount, and status"
    
    # Extract as CSV
    echoctl exec gemini-workflow:extractStructuredData \
        --content "$CONTENT" \
        --format csv \
        --extractionPrompt "Extract all fields"
    
    echo -e "${GREEN}✓ Structured extraction complete\n${NC}"
}

###############################################################################
# Example 6: Conversational Workflow
###############################################################################
example_conversational() {
    echo -e "${YELLOW}Example 6: Multi-turn Conversational Workflow${NC}"
    echo "Conducting a multi-turn conversation with context..."
    
    MESSAGES='[
        {"role": "user", "content": "What is TypeScript?"},
        {"role": "assistant", "content": "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript."},
        {"role": "user", "content": "How does it improve code quality?"},
        {"role": "assistant", "content": "TypeScript provides static type checking, better IDE support, and catches errors at compile time."},
        {"role": "user", "content": "What are the main benefits?"}
    ]'
    
    echoctl exec gemini-workflow:conversationalWorkflow \
        --messages "$MESSAGES" \
        --systemPrompt "You are an expert software engineer explaining programming concepts"
    
    echo -e "${GREEN}✓ Conversational workflow complete\n${NC}"
}

###############################################################################
# Example 7: Batch Processing
###############################################################################
example_batch_processing() {
    echo -e "${YELLOW}Example 7: Batch Processing Multiple Files${NC}"
    echo "Processing multiple code files in batch..."
    
    # Create sample files
    mkdir -p /tmp/batch_files
    
    cat > /tmp/batch_files/file1.ts << 'EOF'
function add(a: number, b: number): number {
    return a + b;
}
EOF
    
    cat > /tmp/batch_files/file2.ts << 'EOF'
function multiply(x: number, y: number): number {
    return x * y;
}
EOF
    
    # Process each file
    for file in /tmp/batch_files/*.ts; do
        echo "Processing $file..."
        
        echoctl exec gemini-workflow:analyzeCode \
            --code "$(cat $file)" \
            --analysisType document
    done
    
    echo -e "${GREEN}✓ Batch processing complete\n${NC}"
}

###############################################################################
# Example 8: Document Layout Analysis
###############################################################################
example_document_layout() {
    echo -e "${YELLOW}Example 8: Document Layout Analysis${NC}"
    echo "Analyzing document structure and layout..."
    
    echoctl exec gemini-workflow:analyzeDocument \
        --documentPath "./examples/sample_report.pdf" \
        --analysisType layout
    
    echo -e "${GREEN}✓ Layout analysis complete\n${NC}"
}

###############################################################################
# Example 9: Code Optimization
###############################################################################
example_code_optimization() {
    echo -e "${YELLOW}Example 9: Code Optimization Suggestions${NC}"
    echo "Analyzing code for performance improvements..."
    
    CODE='
    function findMax(arr: number[]): number {
        let max = arr[0];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        return max;
    }
    '
    
    echoctl exec gemini-workflow:analyzeCode \
        --code "$CODE" \
        --analysisType optimize
    
    echo -e "${GREEN}✓ Optimization analysis complete\n${NC}"
}

###############################################################################
# Example 10: Invoice Processing Workflow
###############################################################################
example_invoice_workflow() {
    echo -e "${YELLOW}Example 10: Complete Invoice Processing Workflow${NC}"
    echo "Processing invoice: extract data, validate, and notify..."
    
    # 1. Extract data
    echo "Step 1: Extracting invoice data..."
    INVOICE_DATA=$(echoctl exec gemini-workflow:analyzeDocument \
        --documentPath "./examples/sample_invoice.pdf" \
        --analysisType extraction)
    
    echo "Extracted: $INVOICE_DATA"
    
    # 2. Send notification
    echo "Step 2: Sending notification..."
    echoctl exec slack:sendMessage \
        --channel "#finance" \
        --text "Invoice processed: $INVOICE_DATA"
    
    # 3. Store in database (simulated)
    echo "Step 3: Storing in database..."
    echo "$INVOICE_DATA" > /tmp/invoice_record.json
    
    echo -e "${GREEN}✓ Invoice workflow complete\n${NC}"
}

###############################################################################
# Main Menu
###############################################################################
show_menu() {
    echo -e "${BLUE}Select an example to run:${NC}"
    echo "1. Document OCR and Extraction"
    echo "2. Automated Code Review"
    echo "3. Multimodal Image Analysis"
    echo "4. Long Document Analysis"
    echo "5. Structured Data Extraction"
    echo "6. Conversational Workflow"
    echo "7. Batch Processing"
    echo "8. Document Layout Analysis"
    echo "9. Code Optimization"
    echo "10. Invoice Processing Workflow"
    echo "11. Run All Examples"
    echo "0. Exit"
    echo ""
}

run_all_examples() {
    example_document_ocr
    example_code_review
    example_multimodal_analysis
    example_long_context
    example_structured_extraction
    example_conversational
    example_batch_processing
    example_document_layout
    example_code_optimization
    example_invoice_workflow
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice: " choice
    
    case $choice in
        1) example_document_ocr ;;
        2) example_code_review ;;
        3) example_multimodal_analysis ;;
        4) example_long_context ;;
        5) example_structured_extraction ;;
        6) example_conversational ;;
        7) example_batch_processing ;;
        8) example_document_layout ;;
        9) example_code_optimization ;;
        10) example_invoice_workflow ;;
        11) run_all_examples ;;
        0) echo "Exiting..."; exit 0 ;;
        *) echo "Invalid choice. Please try again." ;;
    esac
    
    echo ""
done
