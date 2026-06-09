import { faker } from '@faker-js/faker';
import { count, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { analysisIssues, submissions, suggestedFixes } from '@/db/schema';

const LANGUAGES = [
  { name: 'javascript', weight: 25 },
  { name: 'typescript', weight: 15 },
  { name: 'python', weight: 15 },
  { name: 'go', weight: 5 },
  { name: 'rust', weight: 5 },
  { name: 'java', weight: 8 },
  { name: 'php', weight: 8 },
  { name: 'ruby', weight: 4 },
  { name: 'csharp', weight: 4 },
  { name: 'sql', weight: 6 },
  { name: 'html', weight: 3 },
  { name: 'css', weight: 2 },
];

const VERDICTS = ['critical', 'warning', 'good', 'needs_serious_help'] as const;
const ROAST_MODES = ['honest', 'sarcasm'] as const;
const _SEVERITIES = ['critical', 'warning', 'good'] as const;
const _DIFF_TYPES = ['removed', 'added', 'context'] as const;

const ROAST_QUOTES = [
  'this code was clearly written at 3am after a 12-hour energy drink bender.',
  'did you write this with your face? because it looks like you fell on the keyboard.',
  'this code has more red flags than a soviet parade.',
  "i've seen better code from a random number generator.",
  'this is not a code review, this is a crime scene investigation.',
  "the only thing 'clean' about this code is the mess.",
  "this code is why we can't have nice things.",
  "if this code was a person, i'd unfriend it.",
  "this code doesn't just have bugs, it has a whole ecosystem.",
  "somewhere, a junior developer is crying and it's because of this code.",
  'this code looks like it was translated from french via google translate.',
  "i'd rather debug a production outage than read this code again.",
  'this code is the programming equivalent of eating cereal with a fork.',
  'your code is like a onion. it makes me cry and has layers of problems.',
  "this code has been written, but that's the nicest thing i can say about it.",
  "i've seen production code that was less of a production than this.",
  'this code is held together by duct tape and prayers.',
  'the only design pattern here is the "please work" pattern.',
  'this code is why we have code reviews. and therapy.',
  'looking at this code is like watching a car crash in slow motion.',
  'this code is the digital equivalent of a participation trophy.',
  'if god wanted us to read this code, he would have given us better eyesight.',
  'this code violates the geneva convention.',
  'somewhere, a linter just cried itself to sleep because of this.',
  'this code is a great argument for AI taking over programming jobs.',
  'this code went through the wrong end of the refactoring machine.',
  'every time you write code like this, a senior developer loses their wings.',
  'this code is technically valid. technically.',
  "i've seen spaghetti code, but this is more like a whole italian restaurant.",
  'the worst part of this code is that it probably works.',
  'this code is what happens when Stack Overflow answers go wrong.',
  'your code is like a horror movie, the more you watch the worse it gets.',
  'this is not code, this is a cry for help.',
  'this code smells worse than a dumpster in july.',
  "i'm not saying this code is bad, but i've seen better error handling in minecraft.",
  'who hurt you? and why did they teach you to code like this?',
  'this code is the reason "undefined is not a function" was invented.',
  'this code has more issues than a magazine subscription.',
  'this is what happens when you skip code review for a week.',
  'i\'d say this code needs work, but "work" is an understatement.',
  'this code is the programming equivalent of a mullet. business in the front, party in the back.',
  'if this code was a car, it would be a pinto.',
  'this code is like a bouncy castle. looks fun but will collapse under pressure.',
  'this code has more layers of bad decisions than an onion has layers.',
  "i don't know what's worse, the code or the fact someone thought it was okay.",
  'this code belongs in a museum. of bad code.',
];

const CODE_TEMPLATES: {
  code: string;
  language: string;
  scoreRange: [number, number];
}[] = [
  {
    language: 'javascript',
    scoreRange: [1.0, 4.0],
    code: `function processData(input) {
  var result = [];
  for (var i = 0; i < input.length; i++) {
    var item = input[i];
    if (item.status == "active") {
      var processed = doStuff(item);
      result.push(processed);
    }
  }
  return result;
}`,
  },
  {
    language: 'javascript',
    scoreRange: [2.0, 5.0],
    code: `const btn = document.getElementById("submit");
btn.onclick = function() {
  const val = document.getElementById("input").value;
  eval("console.log(" + val + ")");
  localStorage.setItem("data", val);
}`,
  },
  {
    language: 'python',
    scoreRange: [1.0, 3.5],
    code: `def get_user_data(id):
    db = sqlite3.connect("users.db")
    cursor = db.cursor()
    query = "SELECT * FROM users WHERE id = " + str(id)
    cursor.execute(query)
    result = cursor.fetchone()
    return result`,
  },
  {
    language: 'python',
    scoreRange: [2.0, 5.0],
    code: `try:
    result = some_function()
except:
    pass
finally:
    print("done")

x = [1, 2, 3]
y = x
y.append(4)`,
  },
  {
    language: 'typescript',
    scoreRange: [2.0, 4.5],
    code: `function calculateTotal(items: any) {
  var total = 0;
  items.forEach(function(item) {
    total = total + item.price;
  });
  return total;
}`,
  },
  {
    language: 'typescript',
    scoreRange: [1.5, 3.5],
    code: `const data = await fetch("/api/users");
const json = await JSON.parse(data);
for (let i = 0; i < json.length; i++) {
  if (json[i].name !== null && json[i].name !== undefined) {
    console.log(json[i].name);
  }
}`,
  },
  {
    language: 'go',
    scoreRange: [3.0, 6.0],
    code: `func ProcessItems(items []string) {
  for i := 0; i < len(items); i++ {
    item := items[i]
    if item != "" {
      fmt.Println("Processing: " + item)
    }
  }
}`,
  },
  {
    language: 'rust',
    scoreRange: [3.0, 6.0],
    code: `fn calculate(data: Vec<i32>) -> i32 {
  let mut total = 0;
  for i in 0..data.len() {
    total += data[i];
  }
  total
}`,
  },
  {
    language: 'java',
    scoreRange: [2.0, 5.0],
    code: `public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    System.out.println("Enter name:");
    String name = sc.nextLine();
    System.out.println("Hello " + name);
    sc.close();
  }
}`,
  },
  {
    language: 'php',
    scoreRange: [1.0, 4.0],
    code: `<?php
$conn = mysqli_connect("localhost", "root", "", "db");
$id = $_GET['id'];
$query = "SELECT * FROM users WHERE id = $id";
$result = mysqli_query($conn, $query);
while ($row = mysqli_fetch_assoc($result)) {
  echo $row['name'];
}
?>`,
  },
  {
    language: 'ruby',
    scoreRange: [2.0, 5.0],
    code: `def process(list)
  result = []
  list.each do |item|
    if item[:active] == true then
      result << item[:name]
    end
  end
  result
end`,
  },
  {
    language: 'csharp',
    scoreRange: [2.0, 5.0],
    code: `public class DataManager {
  public void SaveData(object data) {
    string json = JsonConvert.SerializeObject(data);
    System.IO.File.WriteAllText("data.json", json);
  }
}`,
  },
  {
    language: 'sql',
    scoreRange: [1.0, 3.0],
    code: `SELECT *
FROM users
WHERE 1=1
  AND name LIKE '%' + @search + '%'
  AND password = @password
ORDER BY name`,
  },
  {
    language: 'html',
    scoreRange: [2.0, 4.0],
    code: `<!DOCTYPE html>
<html>
<head><title>My App</title></head>
<body>
  <div style="color: red; font-size: 24px;">
    <marquee>Welcome!!!</marquee>
  </div>
  <table border="1" width="100%">
    <tr><td bgcolor="yellow">DATA</td></tr>
  </table>
</body>
</html>`,
  },
  {
    language: 'css',
    scoreRange: [1.5, 3.5],
    code: `.element {
  color: red;
  font-size: 12px;
  margin: 10px 10px 10px 10px;
  padding: 0px 0px 0px 0px;
  background: #FFF;
  background: #FFFFFF;
  background: white;
}`,
  },
  {
    language: 'javascript',
    scoreRange: [0.5, 2.5],
    code: `const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  const data = fs.readFileSync('./data.json');
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write("<h1>" + data + "</h1>");
  res.end();
}).listen(3000);`,
  },
  {
    language: 'python',
    scoreRange: [1.0, 3.0],
    code: `import os
import sys

def run_command(cmd):
  os.system(cmd)

user_input = sys.argv[1]
run_command("echo " + user_input)`,
  },
  {
    language: 'javascript',
    scoreRange: [1.5, 4.0],
    code: `function formatDate(date) {
  return date.getDate() + "/" +
    (date.getMonth() + 1) + "/" +
    date.getFullYear();
}

const d = new Date();
console.log("Today is " + formatDate(d));`,
  },
  {
    language: 'typescript',
    scoreRange: [2.5, 5.5],
    code: `interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

const config: Config = {
  apiUrl: "http://localhost:3000",
  timeout: 3000,
  retries: 3,
};

export function getConfig() {
  return config;
}`,
  },
  {
    language: 'javascript',
    scoreRange: [1.0, 3.0],
    code: `const numbers = [1, 2, 3, 4, 5];
const doubled = [];
for (let i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2);
}

let sum = 0;
for (let i = 0; i < doubled.length; i++) {
  sum += doubled[i];
}
console.log(sum);`,
  },
  {
    language: 'python',
    scoreRange: [2.0, 5.0],
    code: `class DataProcessor:
    def __init__(self):
        self.data = {}
    
    def add(self, key, value):
        self.data[key] = value
    
    def get(self, key):
        return self.data[key] if key in self.data else None

proc = DataProcessor()
proc.add("name", "John")
proc.add("age", "30")
print(proc.get("name"))`,
  },
  {
    language: 'sql',
    scoreRange: [1.5, 3.5],
    code: `CREATE TABLE orders (
  id INT,
  user_id INT,
  product VARCHAR(255),
  price DECIMAL(10,2),
  quantity INT
);

INSERT INTO orders VALUES (1, 1, 'Widget', 9.99, 1);
INSERT INTO orders VALUES (2, 1, 'Gadget', 19.99, 2);

SELECT * FROM orders WHERE user_id = 1;`,
  },
];

const ISSUE_TEMPLATES = [
  {
    severity: 'critical' as const,
    patterns: ['var'],
    title: 'Using var instead of const/let',
    description:
      "The var keyword is function-scoped rather than block-scoped, which can lead to unexpected behavior and bugs. In modern JavaScript, const should be used for values that won't be reassigned, and let for those that will be.",
    fixRemoved: 'var ',
    fixAdded: 'const ',
  },
  {
    severity: 'critical' as const,
    patterns: ['eval'],
    title: 'Dangerous use of eval()',
    description:
      'The eval() function executes arbitrary code passed to it, creating a severe security vulnerability. It can lead to code injection attacks and makes debugging significantly harder.',
    fixRemoved: 'eval(',
    fixAdded: 'JSON.parse(',
  },
  {
    severity: 'critical' as const,
    patterns: ['os.system', 'exec('],
    title: 'Command injection vulnerability',
    description:
      'Passing unsanitized user input to system commands creates a command injection vulnerability. Attackers can execute arbitrary commands on the server.',
  },
  {
    severity: 'critical' as const,
    patterns: ['=='],
    title: 'Using == instead of ===',
    description:
      'The == operator performs type coercion, which can lead to unexpected comparisons. Using === ensures both value and type are compared, preventing subtle bugs.',
    fixRemoved: '==',
    fixAdded: '===',
  },
  {
    severity: 'critical' as const,
    patterns: ['1=1'],
    title: 'SQL injection vulnerability',
    description:
      'Concatenating user input directly into SQL queries creates SQL injection vulnerabilities. Always use parameterized queries or prepared statements.',
  },
  {
    severity: 'warning' as const,
    patterns: [
      'for (var i',
      'for(var i',
      'for ( let i = 0; i <',
      'for(let i = 0; i <',
    ],
    title: 'Verbose imperative loop',
    description:
      'Using raw for loops with manual indexing is verbose and error-prone. Consider using array methods like map(), filter(), reduce(), or forEach() for cleaner, more declarative code.',
    fixRemoved: 'for (var i = 0; i < items.length; i++) {',
    fixAdded: 'items.forEach((item) => {',
  },
  {
    severity: 'warning' as const,
    patterns: ['try:\n    '],
    title: 'Bare except clause',
    description:
      'A bare except clause catches ALL exceptions, including SystemExit and KeyboardInterrupt. Always specify the exception type to avoid masking critical errors.',
  },
  {
    severity: 'warning' as const,
    patterns: ['onclick', 'onclick='],
    title: 'Using inline event handlers',
    description:
      'Inline event handlers mix behavior with presentation, making code harder to maintain. Use addEventListener() for better separation of concerns.',
  },
  {
    severity: 'warning' as const,
    patterns: ['<marquee'],
    title: 'Using deprecated HTML elements',
    description:
      'Elements like <marquee> and <blink> are deprecated and not part of any modern HTML specification. Use CSS animations instead.',
  },
  {
    severity: 'warning' as const,
    patterns: ['font-size: 12px', 'font-size:12px'],
    title: 'Hardcoded pixel values for text',
    description:
      'Hardcoding font sizes in pixels prevents users from scaling text based on their browser settings. Use relative units like rem or em for better accessibility.',
  },
  {
    severity: 'warning' as const,
    patterns: ['innerHTML'],
    title: 'Using innerHTML',
    description:
      'Setting innerHTML can expose your application to XSS attacks and is slower than DOM manipulation methods. Use textContent for text and createElement for complex structures.',
    fixRemoved: 'innerHTML',
    fixAdded: 'textContent',
  },
  {
    severity: 'warning' as const,
    patterns: ['var result'],
    title: 'Unnecessary intermediate variable',
    description:
      'This intermediate variable is only used once and adds unnecessary verbosity. Consider inlining the expression directly.',
  },
  {
    severity: 'good' as const,
    patterns: ['try {'],
    title: 'Using try/catch — good error awareness',
    description:
      'Good job wrapping potentially failing code in try/catch. Consider being more specific about which errors you catch.',
  },
  {
    severity: 'good' as const,
    patterns: ['return total', 'return result'],
    title: 'Function returns a value',
    description:
      'The function returns a value rather than mutating global state, which is a good functional practice.',
  },
  {
    severity: 'good' as const,
    patterns: ['function formatDate'],
    title: 'Encapsulated logic in a function',
    description:
      'Extracting date formatting into its own function improves reusability and makes the code more testable.',
  },
  {
    severity: 'critical' as const,
    patterns: ['password = @password', 'password ='],
    title: 'Storing passwords in plaintext',
    description:
      'Storing or comparing passwords directly in queries is a severe security issue. Always hash passwords using bcrypt or argon2.',
  },
  {
    severity: 'warning' as const,
    patterns: ['margin: 10px 10px 10px 10px'],
    title: 'Redundant CSS shorthand values',
    description:
      'When all four values in the margin/padding shorthand are the same, you can use a single value to reduce redundancy.',
    fixRemoved: '10px 10px 10px 10px',
    fixAdded: '10px',
  },
  {
    severity: 'critical' as const,
    patterns: ['mysql_real_escape_string', 'mysqli_query'],
    title: 'SQL injection risk with query concatenation',
    description:
      'Building SQL queries by concatenating user input is extremely dangerous. Use prepared statements with parameterized queries.',
  },
  {
    severity: 'warning' as const,
    patterns: ['while ((row = '],
    title: 'Assignment inside condition',
    description:
      'Assigning a value inside a condition expression can be confusing and error-prone. Separate the assignment from the condition check.',
  },
  {
    severity: 'warning' as const,
    patterns: ['typeof '],
    title: 'Verbose null check',
    description:
      'Checking for null and undefined separately is verbose. Use the optional chaining (?.) and nullish coalescing (??) operators instead.',
  },
];

const FIX_CONTEXT_TEMPLATES = [
  {
    code: '// context: this pattern is commonly found in legacy codebases',
    sortOrder: 0,
  },
  {
    code: '// context: modern alternatives exist in the standard library',
    sortOrder: 0,
  },
  {
    code: '// context: consider using a linter to catch this automatically',
    sortOrder: 2,
  },
  {
    code: '// context: this is a common mistake for beginners',
    sortOrder: 0,
  },
];

function _pickWeighted<T extends { weight?: number }>(items: T[]): T {
  const totalWeight = items.reduce(
    (sum, item) => sum + ((item as { weight?: number }).weight ?? 1),
    0,
  );
  let random = faker.number.int({ min: 1, max: totalWeight });
  for (const item of items) {
    random -= (item as { weight?: number }).weight ?? 1;
    if (random <= 0) return item;
  }
  return items[0];
}

function generateScore(scoreMin: number, scoreMax: number): string {
  const base = faker.number.float({
    min: scoreMin,
    max: scoreMax,
    fractionDigits: 1,
  });
  return base.toFixed(1);
}

function generateVerdict(score: number): (typeof VERDICTS)[number] {
  if (score <= 2.9) return 'critical';
  if (score <= 4.9) return 'needs_serious_help';
  if (score <= 6.9) return 'warning';
  return 'good';
}

function matchingIssues(
  code: string,
  _language: string,
): (typeof ISSUE_TEMPLATES)[number][] {
  return ISSUE_TEMPLATES.filter((template) =>
    template.patterns.some((pattern) => code.includes(pattern)),
  ).slice(0, faker.number.int({ min: 1, max: 4 }));
}

async function seedMass() {
  const [{ total }] = await db
    .select({ total: count() })
    .from(submissions)
    .where(isNotNull(submissions.score));

  if (total >= 100) {
    console.log(`Database already has ${total} submissions, skipping seed.`);
    return;
  }

  if (total > 0) {
    console.log(
      `Database has ${total} submissions. Clearing before re-seed...`,
    );
    await db.delete(suggestedFixes);
    await db.delete(analysisIssues);
    await db.delete(submissions);
  }

  console.log('Generating 100 roasts...');

  let totalIssues = 0;
  let totalFixes = 0;

  for (let i = 0; i < 100; i++) {
    const template = faker.helpers.arrayElement(CODE_TEMPLATES);
    const scoreMin = template.scoreRange[0];
    const scoreMax = template.scoreRange[1];
    const score = generateScore(scoreMin, scoreMax);
    const verdict = generateVerdict(Number(score));
    const roastMode = faker.helpers.arrayElement(ROAST_MODES);
    const roastQuote = faker.helpers.arrayElement(ROAST_QUOTES);

    const language = faker.helpers.arrayElement(LANGUAGES).name;

    const createdAt = faker.date.between({
      from: '2025-01-01',
      to: new Date(),
    });

    const [sub] = await db
      .insert(submissions)
      .values({
        codeContent: template.code,
        language,
        score,
        roastQuote,
        roastMode,
        verdict,
        createdAt,
      })
      .returning();

    const issues = matchingIssues(template.code, language);
    const insertedIssues: { id: number; severity: string }[] = [];

    for (const issue of issues) {
      const lineStart = faker.number.int({ min: 1, max: 5 });
      const lineEnd = lineStart + faker.number.int({ min: 0, max: 3 });

      const [ins] = await db
        .insert(analysisIssues)
        .values({
          submissionId: sub.id,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          lineStart,
          lineEnd,
        })
        .returning();

      insertedIssues.push({ id: ins.id, severity: issue.severity });
      totalIssues++;

      const fixVariations: {
        diffType: 'removed' | 'added';
        code: string;
      }[] = [];

      if (issue.fixRemoved) {
        fixVariations.push({ diffType: 'removed', code: issue.fixRemoved });
      }
      if (issue.fixAdded) {
        fixVariations.push({ diffType: 'added', code: issue.fixAdded });
      }

      if (fixVariations.length > 0) {
        const fixData = fixVariations.map((f, idx) => ({
          issueId: ins.id,
          diffType: f.diffType,
          codeContent: f.code,
          lineNumber: lineStart,
          sortOrder: idx,
        }));

        await db.insert(suggestedFixes).values(fixData);
        totalFixes += fixData.length;
      }

      const ctx = faker.helpers.arrayElement(FIX_CONTEXT_TEMPLATES);
      if (faker.datatype.boolean(0.3)) {
        await db
          .insert(suggestedFixes)
          .values({
            issueId: ins.id,
            diffType: 'context',
            codeContent: ctx.code,
            sortOrder: ctx.sortOrder,
          })
          .returning();
        totalFixes++;
      }
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  ${i + 1}/100 submissions inserted...`);
    }
  }

  console.log(`\nSeed complete:`);
  console.log(`  Submissions: 100`);
  console.log(`  Analysis issues: ${totalIssues}`);
  console.log(`  Suggested fixes: ${totalFixes}`);
}

seedMass()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .then(() => process.exit(0));
