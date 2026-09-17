with open("generate_html.py", "r") as f:
    content = f.read()

# Make runAllTests return the results instead of just updating DOM (or we can just return it in addition).
patch = """
        runAllTests: function(silent=false) {
            let output = document.getElementById('validation-results');
            if(!silent) document.getElementById('validation-modal').style.display = 'block';
            if(!silent) output.innerHTML = "과학적 검증 프레임워크 수행 중 (Running Tests)...\\n\\n";
            let passCount = 0;
            let results = [];
            for(let t of this.tests) {
                let res = t.runFn();
                res.name = t.name;
                results.push(res);
                if(res.pass) passCount++;
                if(!silent) {
                    let status = res.pass ? "PASS" : "FAIL";
                    output.innerHTML += `${t.name}\\n  [${status}] Expected: ${res.expected}, Got: ${res.got.toPrecision ? res.got.toPrecision(4) : res.got}, Error: ${(res.error*100).toPrecision(3)}%\\n\\n`;
                }
            }
            if(!silent) output.innerHTML += `========================\\nResult: ${passCount}/${this.tests.length} Passed.`;
            return results;
        }
"""

import re
# We need to replace the original runAllTests block
content = re.sub(r'runAllTests:\s*function\(\)\s*\{.*?return results;\s*\}', patch.strip(), content, flags=re.DOTALL)

# Let's just do a simpler replacement since the regex might fail.
import sys
content = content.replace("""        runAllTests: function() {
            let output = document.getElementById('validation-results');
            document.getElementById('validation-modal').style.display = 'block';
            output.innerHTML = "과학적 검증 프레임워크 수행 중 (Running Tests)...\\n\\n";
            let passCount = 0;
            for(let t of this.tests) {
                let res = t.runFn();
                if(res.pass) passCount++;
                let status = res.pass ? "PASS" : "FAIL";
                output.innerHTML += `${t.name}\\n  [${status}] Expected: ${res.expected}, Got: ${res.got.toPrecision ? res.got.toPrecision(4) : res.got}, Error: ${(res.error*100).toPrecision(3)}%\\n\\n`;
            }
            output.innerHTML += `========================\\nResult: ${passCount}/${this.tests.length} Passed.`;
        }""", patch.strip())

# Also fix showAudit call to use silent=true
content = content.replace("Validator.runAllTests()", "Validator.runAllTests(true)")
content = content.replace("onclick=\"Validator.runAllTests(true)\"", "onclick=\"Validator.runAllTests(false)\"")

with open("generate_html.py", "w") as f:
    f.write(content)
