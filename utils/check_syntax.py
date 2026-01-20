with open('form-script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

open_count = 0
close_count = 0
in_string = False
in_template = False
last_unmatched_line = 0

for i, line in enumerate(lines, 1):
    j = 0
    while j < len(line):
        char = line[j]
        
        # Handle backticks for template literals
        if char == '`' and (j == 0 or line[j-1] != '\\'):
            in_template = not in_template
        # Handle regular strings
        elif char in ('"', "'") and (j == 0 or line[j-1] != '\\') and not in_template:
            in_string = not in_string
        # Count braces only outside strings and templates
        elif not in_string and not in_template:
            if char == '{':
                open_count += 1
                last_unmatched_line = i
            elif char == '}':
                close_count += 1
        
        j += 1

print(f"Final - Open: {open_count}, Close: {close_count}, Difference: {open_count - close_count}")
if open_count != close_count:
    print(f"Last unmatched opening brace around line: {last_unmatched_line}")
    # Show context around that line
    if last_unmatched_line < len(lines):
        for idx in range(max(0, last_unmatched_line - 3), min(len(lines), last_unmatched_line + 3)):
            print(f"  {idx+1}: {lines[idx].rstrip()}")
