with open('form-script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
open_count = 0
close_count = 0
open_line = 0

for i, line in enumerate(lines):
    prev_open = open_count
    prev_close = close_count
    
    # Count braces outside strings/comments (simplified)
    in_string = False
    in_template = False
    j = 0
    while j < len(line):
        if line[j] == '`':
            in_template = not in_template
        elif line[j] in ('"', "'"):
            if not in_template:
                in_string = not in_string
        elif not in_string and not in_template:
            if line[j] == '{':
                open_count += 1
                if open_count > close_count:
                    open_line = i + 1
            elif line[j] == '}':
                close_count += 1
        j += 1
    
    diff = open_count - close_count
    if diff > 0 and diff != prev_open - prev_close:
        print(f'Line {i+1}: {line.strip()[:60]} | Open: {open_count}, Close: {close_count}, Balance: {diff}')

print(f'\nFinal - Open: {open_count}, Close: {close_count}, Missing: {open_count - close_count}')
print(f'Last unmatched brace at line: {open_line}')
