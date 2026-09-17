with open("generate_html.py", "r") as f:
    lines = f.readlines()

out = []
for line in lines:
    if "let results = Validator.runAllTests(true);" in line:
        out.append(line)
        out.append("            if(!results) results = [];\n")
    else:
        out.append(line)

with open("generate_html.py", "w") as f:
    f.writelines(out)
