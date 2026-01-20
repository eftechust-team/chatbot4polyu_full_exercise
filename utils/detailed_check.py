import re

with open('form-script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Try to find where string/template literal isn't closed
paren_count = 0
bracket_count = 0
brace_count = 0
in_string = False
in_template = False
string_char = None
line_num = 1

for i, char in enumerate(content):
    if char == '\n':
        line_num += 1
    
    # Skip escape sequences
    if i > 0 and content[i-1] == '\\':
        continue
    
    # Handle template literals
    if char == '`':
        in_template = not in_template
    # Handle regular strings  
    elif char in ('"', "'") and not in_template:
        if not in_string:
            in_string = True
            string_char = char
        elif char == string_char:
            in_string = False
    
    # Count brackets only outside strings
    elif not in_string and not in_template:
        if char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
        elif char == '[':
            bracket_count += 1
        elif char == ']':
            bracket_count -= 1
        elif char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1

print(f"Line: {line_num}")
print(f"Parentheses: {paren_count}")
print(f"Brackets: {bracket_count}")
print(f"Braces: {brace_count}")
print(f"In template: {in_template}")
print(f"In string: {in_string}")

if paren_count != 0 or bracket_count != 0 or brace_count != 0 or in_template or in_string:
    print("\nERROR: Unbalanced or unclosed elements detected!")
else:
    print("\nOK: All elements balanced")
