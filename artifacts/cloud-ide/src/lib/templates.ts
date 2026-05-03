export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  language: string;
  runnable?: boolean;
  files: Record<string, string>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // ── Web / Runnable — execute instantly in the sandbox ─────────────────────
  {
    id: "js-starter",
    name: "JavaScript",
    description: "Vanilla JS with async/await, array methods, and modern syntax",
    icon: "⚡",
    language: "JavaScript",
    runnable: true,
    files: {
      "index.js": `// JavaScript Starter — click Run ▶ or press Ctrl+Enter

// Arrays & higher-order functions
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log("Evens:  ", numbers.filter(n => n % 2 === 0));
console.log("Squares:", numbers.map(n => n ** 2));
console.log("Sum:    ", numbers.reduce((a, b) => a + b, 0));

// Async / await
async function fetchData(id) {
  await new Promise(r => setTimeout(r, 100)); // simulate async work
  return { id, name: \`Item \${id}\`, value: Math.random().toFixed(4) };
}

async function main() {
  const items = await Promise.all([1, 2, 3].map(fetchData));
  items.forEach(({ id, name, value }) => {
    console.log(\`[\${id}] \${name} → \${value}\`);
  });
}

main();

// Destructuring & spread
const { filter, map } = Array.prototype;
const user = { name: "Alice", role: "admin", age: 30 };
const { name, ...rest } = user;
console.log("User:", name, "| rest:", rest);
`,
    },
  },

  {
    id: "ts-starter",
    name: "TypeScript",
    description: "TypeScript with interfaces, generics, and type guards",
    icon: "📘",
    language: "TypeScript",
    runnable: true,
    files: {
      "index.ts": `// TypeScript Starter — click Run ▶ or press Ctrl+Enter

// Interfaces & types
interface User {
  id:    number;
  name:  string;
  email: string;
  role:  "admin" | "user" | "guest";
}

interface ApiResponse<T> {
  data:    T;
  status:  number;
  message: string;
}

// Generic function
function createResponse<T>(data: T, status = 200): ApiResponse<T> {
  return { data, status, message: status === 200 ? "OK" : "Error" };
}

// Type guard
function isAdmin(user: User): user is User & { role: "admin" } {
  return user.role === "admin";
}

// Usage
const users: User[] = [
  { id: 1, name: "Alice",   email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob",     email: "bob@example.com",   role: "user"  },
  { id: 3, name: "Charlie", email: "charlie@example.com", role: "guest"},
];

const response = createResponse(users);
console.log("Response status:", response.status);
console.log("Users loaded:   ", response.data.length);

const admins = users.filter(isAdmin);
console.log("Admins:", admins.map(u => u.name));

// Utility types
type PartialUser  = Partial<User>;
type ReadonlyUser = Readonly<User>;
type UserKeys     = keyof User;

console.log("User fields:", ["id", "name", "email", "role"] as UserKeys[]);
`,
    },
  },

  {
    id: "python-starter",
    name: "Python",
    description: "Python script with classes, comprehensions, and stdlib",
    icon: "🐍",
    language: "Python",
    runnable: true,
    files: {
      "main.py": `# Python Starter — click Run ▶ or press Ctrl+Enter

# List comprehensions
squares   = [x**2 for x in range(1, 11)]
evens     = [x for x in range(20) if x % 2 == 0]
print("Squares:", squares)
print("Evens:  ", evens)

# Functions & closures
def make_counter(start=0, step=1):
    count = [start]
    def increment():
        val = count[0]
        count[0] += step
        return val
    return increment

counter = make_counter(step=5)
print("Counter:", [counter() for _ in range(5)])

# Classes
class Stack:
    def __init__(self):
        self._data = []

    def push(self, item):
        self._data.append(item)
        return self

    def pop(self):
        if not self._data:
            raise IndexError("Stack is empty")
        return self._data.pop()

    def peek(self):
        return self._data[-1] if self._data else None

    def __len__(self):
        return len(self._data)

    def __repr__(self):
        return f"Stack({self._data})"

s = Stack()
for i in [10, 20, 30, 40]:
    s.push(i)
print("Stack:", s)
print("Pop:", s.pop())
print("Peek:", s.peek())
print("Size:", len(s))

# Dictionary operations
words = "the quick brown fox jumps over the lazy dog".split()
freq  = {}
for w in words:
    freq[w] = freq.get(w, 0) + 1
print("\\nWord frequencies:")
for word, count in sorted(freq.items(), key=lambda x: -x[1]):
    print(f"  {word:<8} {count}")
`,
    },
  },

  {
    id: "python-data",
    name: "Python Data",
    description: "Data analysis, statistics, and visualization with Python stdlib",
    icon: "📊",
    language: "Python",
    runnable: true,
    files: {
      "data.py": `# Python Data Analysis — click Run ▶ or press Ctrl+Enter
import statistics
import collections
import random

# Generate sample dataset
random.seed(42)
scores = [random.gauss(75, 15) for _ in range(100)]
scores = [round(max(0, min(100, s)), 1) for s in scores]

# Descriptive statistics
print("=== Exam Score Analysis ===")
print(f"Count:   {len(scores)}")
print(f"Mean:    {statistics.mean(scores):.2f}")
print(f"Median:  {statistics.median(scores):.2f}")
print(f"Stdev:   {statistics.stdev(scores):.2f}")
print(f"Min:     {min(scores):.1f}")
print(f"Max:     {max(scores):.1f}")

# Grade distribution
def grade(score):
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"

grades = collections.Counter(grade(s) for s in scores)
print("\\n=== Grade Distribution ===")
for letter in "ABCDF":
    count = grades[letter]
    bar   = "█" * (count // 2)
    print(f"  {letter}  {bar:<25} {count:>3} students")

# Quartiles
q1 = statistics.quantiles(scores, n=4)[0]
q3 = statistics.quantiles(scores, n=4)[2]
iqr = q3 - q1
print(f"\\nQ1={q1:.1f}  Q3={q3:.1f}  IQR={iqr:.1f}")

outliers = [s for s in scores if s < q1 - 1.5*iqr or s > q3 + 1.5*iqr]
print(f"Outliers ({len(outliers)}): {sorted(outliers)}")
`,
    },
  },

  {
    id: "html-page",
    name: "HTML Page",
    description: "Interactive HTML page with CSS and JavaScript — live preview",
    icon: "🌐",
    language: "HTML",
    runnable: true,
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CloudIDE Preview</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1.5rem;
    }
    h1 { font-size: 2rem; font-weight: 700; }
    h1 span { color: #4ade80; }
    .card {
      background: #161b22;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 12px;
      padding: 1.5rem;
      width: 100%;
      max-width: 420px;
    }
    label { display: block; font-size: .85rem; color: #8b949e; margin-bottom: .5rem; }
    input[type="text"] {
      width: 100%;
      padding: .6rem .85rem;
      background: #0d1117;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 8px;
      color: #e6edf3;
      font-size: .95rem;
      margin-bottom: 1rem;
      outline: none;
      transition: border-color .2s;
    }
    input[type="text"]:focus { border-color: #4ade80; }
    button {
      width: 100%;
      padding: .65rem 1rem;
      background: #4ade80;
      color: #000;
      border: none;
      border-radius: 8px;
      font-size: .95rem;
      font-weight: 700;
      cursor: pointer;
      transition: background .2s, transform .1s;
    }
    button:hover  { background: #22c55e; }
    button:active { transform: scale(.98); }
    #output {
      margin-top: 1rem;
      padding: .75rem 1rem;
      background: #0d1117;
      border: 1px solid rgba(74,222,128,.2);
      border-radius: 8px;
      font-family: monospace;
      font-size: .9rem;
      color: #4ade80;
      min-height: 2.5rem;
    }
    .counter-row {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin-top: 1rem;
    }
    .counter-btn {
      width: 40px;
      height: 40px;
      font-size: 1.3rem;
      font-weight: 700;
      border-radius: 8px;
    }
    #count-display {
      flex: 1;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #4ade80;
    }
  </style>
</head>
<body>
  <h1>HTML <span>Live Preview</span></h1>

  <div class="card">
    <label for="name-input">Say hello to…</label>
    <input type="text" id="name-input" placeholder="Your name" />
    <button onclick="greet()">Greet me!</button>
    <div id="output">Output will appear here.</div>
  </div>

  <div class="card">
    <label>Counter</label>
    <div class="counter-row">
      <button class="counter-btn" onclick="delta(-1)">−</button>
      <div id="count-display">0</div>
      <button class="counter-btn" onclick="delta(1)">+</button>
    </div>
  </div>

  <script>
    function greet() {
      const name = document.getElementById('name-input').value.trim() || 'World';
      document.getElementById('output').textContent =
        'Hello, ' + name + '! 👋 — ' + new Date().toLocaleTimeString();
    }

    let count = 0;
    function delta(n) {
      count += n;
      document.getElementById('count-display').textContent = count;
    }
  </script>
</body>
</html>
`,
    },
  },

  {
    id: "html-canvas",
    name: "HTML Canvas",
    description: "Canvas 2D animation — bouncing balls with physics",
    icon: "🎨",
    language: "HTML",
    runnable: true,
    files: {
      "canvas.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Canvas Animation</title>
  <style>
    body { margin: 0; background: #0d1117; overflow: hidden; }
    canvas { display: block; }
    #info {
      position: absolute;
      top: 10px; left: 10px;
      font-family: monospace;
      font-size: 12px;
      color: rgba(255,255,255,.4);
    }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <div id="info">Click to add a ball</div>
  <script>
    const canvas = document.getElementById('c');
    const ctx    = canvas.getContext('2d');
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const COLORS = ['#4ade80','#60a5fa','#f472b6','#facc15','#fb923c','#a78bfa'];
    const balls  = [];

    function Ball(x, y) {
      this.x  = x; this.y = y;
      this.r  = 8 + Math.random() * 22;
      this.vx = (Math.random() - .5) * 6;
      this.vy = (Math.random() - .5) * 6;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha = 0.85;
    }

    Ball.prototype.update = function() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.18; // gravity
      if (this.x - this.r < 0)  { this.x = this.r;   this.vx *= -0.8; }
      if (this.x + this.r > W)  { this.x = W - this.r; this.vx *= -0.8; }
      if (this.y + this.r > H)  { this.y = H - this.r; this.vy *= -0.75; this.vx *= 0.98; }
    };

    Ball.prototype.draw = function() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + 'cc';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Spawn initial balls
    for (let i = 0; i < 12; i++) {
      balls.push(new Ball(Math.random() * W, Math.random() * H * .4));
    }

    canvas.addEventListener('click', e => {
      balls.push(new Ball(e.clientX, e.clientY));
    });

    function loop() {
      ctx.fillStyle = 'rgba(13,17,23,0.25)';
      ctx.fillRect(0, 0, W, H);
      balls.forEach(b => { b.update(); b.draw(); });
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>
`,
    },
  },

  {
    id: "js-algorithms",
    name: "JS Algorithms",
    description: "Sorting algorithms, binary search, and data structures",
    icon: "🔢",
    language: "JavaScript",
    runnable: true,
    files: {
      "algorithms.js": `// Algorithms & Data Structures — click Run ▶

// ── Sorting ────────────────────────────────────────────────────────
function bubbleSort(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a.length - i - 1; j++)
      if (a[j] > a[j+1]) [a[j], a[j+1]] = [a[j+1], a[j]];
  return a;
}

function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid   = Math.floor(arr.length / 2);
  const left  = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length)
    result.push(left[i] <= right[j] ? left[i++] : right[j++]);
  return [...result, ...left.slice(i), ...right.slice(j)];
}

function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  return [
    ...quickSort(arr.filter(x => x < pivot)),
    ...arr.filter(x => x === pivot),
    ...quickSort(arr.filter(x => x > pivot)),
  ];
}

const data = [64, 34, 25, 12, 22, 11, 90, 45, 78, 3];
console.log("Input:      ", data);
console.log("Bubble sort:", bubbleSort(data));
console.log("Merge sort: ", mergeSort(data));
console.log("Quick sort: ", quickSort(data));

// ── Binary Search ──────────────────────────────────────────────────
function binarySearch(sorted, target) {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === target) return mid;
    sorted[mid] < target ? (lo = mid + 1) : (hi = mid - 1);
  }
  return -1;
}

const sorted = mergeSort(data);
console.log("\\nBinary search for 45:", binarySearch(sorted, 45));
console.log("Binary search for 99:", binarySearch(sorted, 99));

// ── Linked List ────────────────────────────────────────────────────
class Node { constructor(val) { this.val = val; this.next = null; } }
class LinkedList {
  constructor() { this.head = null; this.size = 0; }
  push(val) {
    const node = new Node(val);
    if (!this.head) { this.head = node; }
    else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this.size++;
  }
  toArray() {
    const out = []; let cur = this.head;
    while (cur) { out.push(cur.val); cur = cur.next; }
    return out;
  }
}

const list = new LinkedList();
[5, 10, 15, 20].forEach(v => list.push(v));
console.log("\\nLinked list:", list.toArray(), "size:", list.size);

// ── Fibonacci (memoized) ───────────────────────────────────────────
function fib(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  return memo[n] = fib(n-1, memo) + fib(n-2, memo);
}

const fibs = Array.from({ length: 10 }, (_, i) => fib(i));
console.log("\\nFibonacci[0..9]:", fibs);
`,
    },
  },

  {
    id: "python-input",
    name: "Python Input",
    description: "Stdin demo — set input in the Console tab then press Run",
    icon: "⌨️",
    language: "Python",
    runnable: true,
    files: {
      "main.py": `# Python stdin demo — reads real input from the Stdin panel
# 1. Click the CONSOLE tab (top-right)
# 2. Expand "Stdin" and paste these 3 lines:
#       Alice
#       30
#       3 7 42
# 3. Press Run ▶

name  = input("Name:  ")
age   = int(input("Age:   "))
nums  = list(map(int, input("Nums:  ").split()))

print(f"\\nHello, {name}! You are {age} years old.")
print(f"Next birthday: {age + 1}")
print(f"Numbers: {nums}")
print(f"Sum: {sum(nums)}  Max: {max(nums)}  Min: {min(nums)}")
`,
    },
  },

  {
    id: "bash-script",
    name: "Bash Script",
    description: "Shell scripting — variables, arrays, functions, and text processing",
    icon: "🐚",
    language: "Bash",
    runnable: true,
    files: {
      "script.sh": `#!/usr/bin/env bash
# Bash Script — click Run ▶ or press Ctrl+Enter
set -euo pipefail

echo "=== Bash Scripting Demo ==="
echo

# Variables & arithmetic
NAME="CloudIDE"
VERSION=2
SUM=$((37 + 5))
echo "App:  $NAME v$VERSION"
echo "Sum:  37 + 5 = $SUM"
echo

# Arrays
echo "=== Arrays ==="
FRUITS=("apple" "banana" "cherry" "mango" "kiwi")
echo "Fruits: \${FRUITS[*]}"
echo "Count:  \${#FRUITS[@]}"
echo "Sorted: $(printf '%s\\n' "\${FRUITS[@]}" | sort | tr '\\n' ' ')"
echo

# String operations
echo "=== Strings ==="
TEXT="Hello, World from Bash!"
echo "Original:   $TEXT"
echo "Uppercase:  \${TEXT^^}"
echo "Length:     \${#TEXT}"
echo "Replace:    \${TEXT/World/CloudIDE}"
echo

# Functions
echo "=== Functions ==="
factorial() {
    local n=$1
    if [ "$n" -le 1 ]; then echo 1; return; fi
    echo $(( n * $(factorial $((n-1))) ))
}
for i in 0 1 2 3 4 5 6; do
    printf "  %d! = %d\\n" "$i" "$(factorial "$i")"
done
echo

# Word frequency
echo "=== Word Frequency ==="
SENTENCE="the quick brown fox jumps over the lazy dog the fox"
declare -A FREQ
for W in $SENTENCE; do FREQ[$W]=$(( \${FREQ[$W]:-0} + 1 )); done
for W in "\${!FREQ[@]}"; do
    printf "  %-8s %d\\n" "$W" "\${FREQ[$W]}"
done | sort -k2 -rn
echo
echo "✓ Done!"
`,
    },
  },

  {
    id: "c-program",
    name: "C Program",
    description: "C with structs, pointers, sorting, and dynamic memory — compiled with gcc",
    icon: "⚙️",
    language: "C",
    runnable: true,
    files: {
      "main.c": `// C Program — click Run ▶ (compiles with gcc, then executes)
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

// ── Struct + comparator ─────────────────────────────────────────
typedef struct { char name[32]; int score; } Student;

int cmp_score(const void *a, const void *b) {
    return ((Student*)b)->score - ((Student*)a)->score;
}

// ── Sorting ─────────────────────────────────────────────────────
void bubble_sort(int *a, int n) {
    for (int i = 0; i < n-1; i++)
        for (int j = 0; j < n-i-1; j++)
            if (a[j] > a[j+1]) { int t=a[j]; a[j]=a[j+1]; a[j+1]=t; }
}

void print_arr(int *a, int n) {
    printf("[");
    for (int i=0; i<n; i++) printf(i<n-1?"%d, ":"%d", a[i]);
    printf("]\\n");
}

// ── Linked list ─────────────────────────────────────────────────
typedef struct Node { int val; struct Node *next; } Node;

Node *prepend(Node *head, int val) {
    Node *n = malloc(sizeof(Node));
    n->val = val; n->next = head; return n;
}

void print_list(Node *h) {
    printf("[");
    while (h) { printf(h->next?"%d -> ":"%d", h->val); h=h->next; }
    printf("]\\n");
}

void free_list(Node *h) {
    while (h) { Node *t=h; h=h->next; free(t); }
}

// ── Main ─────────────────────────────────────────────────────────
int main(void) {
    printf("=== C Program ===\\n\\n");

    // Sorting
    int nums[] = {64, 34, 25, 12, 22, 11, 90, 45};
    int n = (int)(sizeof(nums)/sizeof(nums[0]));
    printf("Before: "); print_arr(nums, n);
    bubble_sort(nums, n);
    printf("After:  "); print_arr(nums, n);
    printf("\\n");

    // Structs + qsort
    Student students[] = {{"Alice",92},{"Bob",78},{"Charlie",95},{"Diana",88}};
    int ns = (int)(sizeof(students)/sizeof(students[0]));
    qsort(students, ns, sizeof(Student), cmp_score);
    printf("Leaderboard:\\n");
    for (int i=0; i<ns; i++)
        printf("  %d. %-10s %d\\n", i+1, students[i].name, students[i].score);
    printf("\\n");

    // Linked list
    Node *list = NULL;
    for (int i=5; i>=1; i--) list = prepend(list, i*10);
    printf("List:   "); print_list(list);
    free_list(list);
    printf("\\n");

    // Math
    printf("Square roots:\\n");
    for (int i=1; i<=6; i++)
        printf("  sqrt(%2d) = %.4f\\n", i*i, sqrt((double)(i*i)));

    return 0;
}
`,
    },
  },

  {
    id: "cpp-program",
    name: "C++ Program",
    description: "Modern C++17 — STL containers, lambdas, templates, and algorithms",
    icon: "🔷",
    language: "C++",
    runnable: true,
    files: {
      "main.cpp": `// C++ Program — click Run ▶ (compiled with g++ -std=c++17)
#include <iostream>
#include <vector>
#include <map>
#include <algorithm>
#include <numeric>
#include <string>
#include <sstream>

// ── Template function ───────────────────────────────────────────
template<typename T>
void printVec(const std::string& label, const std::vector<T>& v) {
    std::cout << label << ": [";
    for (size_t i=0; i<v.size(); i++) {
        std::cout << v[i];
        if (i+1 < v.size()) std::cout << ", ";
    }
    std::cout << "]\\n";
}

// ── Stack using vector ───────────────────────────────────────────
template<typename T>
class Stack {
    std::vector<T> data;
public:
    void push(T val)     { data.push_back(val); }
    T    pop()           { T v=data.back(); data.pop_back(); return v; }
    T    peek() const    { return data.back(); }
    bool empty() const   { return data.empty(); }
    size_t size() const  { return data.size(); }
};

int main() {
    std::cout << "=== C++17 Demo ===\\n\\n";

    // STL algorithms + lambdas
    std::vector<int> nums = {9,2,7,4,1,8,3,6,5};
    printVec("Original", nums);
    std::sort(nums.begin(), nums.end());
    printVec("Sorted  ", nums);

    auto evens = nums;
    evens.erase(std::remove_if(evens.begin(), evens.end(),
        [](int x){ return x%2!=0; }), evens.end());
    printVec("Evens   ", evens);

    int sum = std::accumulate(nums.begin(), nums.end(), 0);
    double avg = (double)sum / nums.size();
    std::cout << "Sum=" << sum << "  Avg=" << avg << "\\n\\n";

    // std::map — word frequency
    std::string text = "the quick brown fox jumps over the lazy dog the fox";
    std::map<std::string,int> freq;
    std::istringstream ss(text);
    std::string w;
    while (ss >> w) freq[w]++;

    std::cout << "Word frequencies:\\n";
    std::vector<std::pair<std::string,int>> pairs(freq.begin(),freq.end());
    std::sort(pairs.begin(),pairs.end(),[](auto& a,auto& b){ return a.second>b.second; });
    for (auto& [word,count] : pairs)
        std::cout << "  " << word << ": " << count << "\\n";
    std::cout << "\\n";

    // Template stack
    Stack<int> stk;
    for (int v : {10,20,30,40,50}) stk.push(v);
    std::cout << "Stack (top→bottom): ";
    while (!stk.empty()) std::cout << stk.pop() << " ";
    std::cout << "\\n";

    return 0;
}
`,
    },
  },

  {
    id: "perl-script",
    name: "Perl Script",
    description: "Perl — text processing, regex, hashes, and array manipulation",
    icon: "🐪",
    language: "Perl",
    runnable: true,
    files: {
      "script.pl": `#!/usr/bin/perl
# Perl Script — click Run ▶ or press Ctrl+Enter
use strict;
use warnings;
use List::Util qw(sum min max first reduce);
use POSIX qw(floor);

print "=== Perl Demo ===\\n\\n";

# Arrays
my @nums = (9, 2, 7, 4, 1, 8, 3, 6, 5, 10);
print "Original: [@nums]\\n";
my @sorted = sort { $a <=> $b } @nums;
print "Sorted:   [@sorted]\\n";
my @evens  = grep { $_ % 2 == 0 } @nums;
print "Evens:    [@evens]\\n";
my @sq     = map  { $_ ** 2 } @nums[0..4];
print "Squares:  [@sq]\\n";
printf "Sum=%d  Min=%d  Max=%d\\n\\n", sum(@nums), min(@nums), max(@nums);

# Hashes
print "=== Hashes ===\\n";
my %scores = (Alice => 92, Bob => 78, Charlie => 95, Diana => 88);
for my $name (sort { $scores{$b} <=> $scores{$a} } keys %scores) {
    printf "  %-10s %d\\n", $name, $scores{$name};
}
print "\\n";

# Regex & text processing
print "=== Regex ===\\n";
my $text = "The quick brown Fox jumps over 42 lazy dogs!";
(my $clean = $text) =~ s/[^a-zA-Z ]//g;
print "Original: $text\\n";
print "Cleaned:  $clean\\n";
my @words = split /\\s+/, $clean;
printf "Words:    %d\\n", scalar @words;
my $upper = uc($text);
print "Upper:    $upper\\n\\n";

# Word frequency
print "=== Word Frequency ===\\n";
my $sentence = "the quick brown fox jumps over the lazy dog the fox";
my %freq;
$freq{$_}++ for split /\\s+/, $sentence;
for my $w (sort { $freq{$b} <=> $freq{$a} } keys %freq) {
    printf "  %-8s %d\\n", $w, $freq{$w};
}
print "\\nDone!\\n";
`,
    },
  },

  {
    id: "css-animations",
    name: "CSS Animations",
    description: "Keyframe animations, transitions, gradients — live preview instantly",
    icon: "🎨",
    language: "CSS",
    runnable: true,
    files: {
      "styles.css": `/* CSS Animations — click Run ▶ to see the live preview */

/* ── Reset & base ─────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0d1117;
  color: #e6edf3;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  min-height: 100vh;
}

/* ── Keyframes ─────────────────────────────────────────────────── */
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .65; transform: scale(.93); }
}
@keyframes slideIn {
  from { transform: translateX(-60px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); animation-timing-function: ease-in; }
  50%       { transform: translateY(-28px); animation-timing-function: ease-out; }
}
@keyframes gradientShift {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}
@keyframes fadeScale {
  from { opacity: 0; transform: scale(.8); }
  to   { opacity: 1; transform: scale(1);  }
}

/* ── Title with animated gradient text ──────────────────────────── */
h1 {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4ade80, #60a5fa, #f472b6, #facc15);
  background-size: 300% 300%;
  animation: gradientShift 4s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -.02em;
}

/* ── Spinner ─────────────────────────────────────────────────────── */
.spinner {
  width: 64px; height: 64px;
  border: 5px solid rgba(255,255,255,.1);
  border-top-color: #4ade80;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ── Pulse button ────────────────────────────────────────────────── */
.pulse-btn {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #000;
  border: none;
  padding: .9rem 2.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 32px rgba(74,222,128,.35);
}

/* ── Slide-in card ───────────────────────────────────────────────── */
.slide-card {
  background: #161b22;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  width: 280px;
  animation: slideIn .7s cubic-bezier(.2,.8,.4,1) forwards;
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
}
.slide-card h2 { font-size: 1.1rem; margin-bottom: .5rem; color: #4ade80; }
.slide-card p  { color: rgba(255,255,255,.55); font-size: .9rem; }

/* ── Bounce ball ──────────────────────────────────────────────────── */
.bounce-ball {
  width: 48px; height: 48px;
  background: radial-gradient(circle at 35% 35%, #f472b6, #ec4899);
  border-radius: 50%;
  animation: bounce 1s ease infinite;
  box-shadow: 0 12px 20px rgba(244,114,182,.4);
}

/* ── Fade-scale items ─────────────────────────────────────────────── */
.items { display: flex; gap: 1rem; }
.item {
  padding: .6rem 1.2rem;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  font-size: .85rem;
  animation: fadeScale .4s ease both;
}
.item:nth-child(1) { animation-delay: 0s;    }
.item:nth-child(2) { animation-delay: .15s;  }
.item:nth-child(3) { animation-delay: .3s;   }
.item:nth-child(4) { animation-delay: .45s;  }
`,
    },
  },

  {
    id: "markdown-doc",
    name: "Markdown Doc",
    description: "Full Markdown showcase — rendered as HTML in the preview tab",
    icon: "📄",
    language: "Markdown",
    runnable: true,
    files: {
      "README.md": `# CloudIDE Markdown Preview

> Write documentation, README files, wikis, and notes.  
> Click **Run ▶** (or Ctrl+Enter) to see the live rendered preview.

---

## Features

CloudIDE is a **browser-based code editor** with real execution:

| Language    | How it runs         | Preview tab |
|-------------|---------------------|-------------|
| JavaScript  | Node.js sandbox     | Console     |
| TypeScript  | tsx sandbox         | Console     |
| Python      | Python 3 sandbox    | Console     |
| Bash / Perl | Shell execution     | Console     |
| C / C++     | gcc / g++ compile   | Console     |
| HTML        | Direct render       | ✅ Preview  |
| CSS         | Sample page         | ✅ Preview  |
| **Markdown**| **This file!**      | **✅ Preview** |
| JSON        | Syntax viewer       | ✅ Preview  |
| SVG         | Direct render       | ✅ Preview  |

---

## Text Formatting

- **Bold** with \`**text**\`
- *Italic* with \`*text*\`
- ***Bold italic*** with \`***text***\`
- ~~Strikethrough~~ with \`~~text~~\`
- \`inline code\` with backticks
- [Hyperlinks](https://cloudide.replit.app) with \`[text](url)\`

---

## Code Blocks

\`\`\`javascript
// JavaScript
const fib = (n, memo = {}) =>
  n in memo ? memo[n] : n <= 1 ? n : (memo[n] = fib(n-1,memo) + fib(n-2,memo));

console.log(Array.from({length:10}, (_,i) => fib(i)));
// → [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

\`\`\`python
# Python
def sieve(n):
    is_prime = [True] * (n+1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n**.5)+1):
        if is_prime[i]:
            for j in range(i*i, n+1, i):
                is_prime[j] = False
    return [i for i, p in enumerate(is_prime) if p]

print(sieve(50))
\`\`\`

---

## Lists

### Ordered
1. Open a file
2. Press **Run ▶** or \`Ctrl+Enter\`
3. See output instantly
4. Share with one click

### Unordered
- Languages with instant preview
  - HTML, CSS, Markdown, JSON, SVG
- Languages with console output
  - JavaScript, TypeScript, Python
  - Bash, Perl, C, C++

---

## Blockquote

> "First, solve the problem. Then, write the code."  
> — John Johnson

---

*Rendered by CloudIDE's built-in Markdown engine.*
`,
    },
  },

  {
    id: "svg-art",
    name: "SVG Art",
    description: "Vector graphics with gradients, filters, and geometry — live preview",
    icon: "🖼️",
    language: "SVG",
    runnable: true,
    files: {
      "artwork.svg": `<?xml version="1.0" encoding="UTF-8"?>
<!-- SVG Art — click Run ▶ to preview instantly -->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 500 500" width="500" height="500">

  <defs>
    <!-- Background gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="65%">
      <stop offset="0%"   stop-color="#1a2332"/>
      <stop offset="100%" stop-color="#0d1117"/>
    </radialGradient>

    <!-- Accent gradients -->
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="g4" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#facc15"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <!-- Glow filter -->
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Soft shadow -->
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity=".5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="500" height="500" fill="url(#bgGrad)"/>

  <!-- Outer decorative rings -->
  <circle cx="250" cy="250" r="200" fill="none" stroke="rgba(255,255,255,.03)" stroke-width="1"/>
  <circle cx="250" cy="250" r="165" fill="none" stroke="rgba(255,255,255,.04)" stroke-width="1"/>
  <circle cx="250" cy="250" r="130" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="1"/>

  <!-- Rotated hexagons (petal pattern) -->
  <g transform="translate(250,250)" opacity=".18">
    <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="url(#g1)" transform="rotate(0)"/>
    <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="url(#g2)" transform="rotate(30)"/>
    <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="url(#g3)" transform="rotate(60)"/>
    <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="url(#g4)" transform="rotate(90)"/>
  </g>

  <!-- Inner triangle motif -->
  <g transform="translate(250,250)" opacity=".35">
    <polygon points="0,-55 47,27 -47,27" fill="url(#g2)" transform="rotate(0)"/>
    <polygon points="0,-55 47,27 -47,27" fill="url(#g3)" transform="rotate(120)"/>
    <polygon points="0,-55 47,27 -47,27" fill="url(#g1)" transform="rotate(240)"/>
  </g>

  <!-- Cardinal accent dots (glowing) -->
  <circle cx="250" cy="55"  r="9" fill="#4ade80" filter="url(#glow)" opacity=".9"/>
  <circle cx="445" cy="250" r="9" fill="#60a5fa" filter="url(#glow)" opacity=".9"/>
  <circle cx="250" cy="445" r="9" fill="#f472b6" filter="url(#glow)" opacity=".9"/>
  <circle cx="55"  cy="250" r="9" fill="#facc15" filter="url(#glow)" opacity=".9"/>

  <!-- Diagonal accent dots -->
  <circle cx="393" cy="107" r="6" fill="#4ade80" opacity=".5"/>
  <circle cx="393" cy="393" r="6" fill="#60a5fa" opacity=".5"/>
  <circle cx="107" cy="393" r="6" fill="#f472b6" opacity=".5"/>
  <circle cx="107" cy="107" r="6" fill="#facc15" opacity=".5"/>

  <!-- Center core -->
  <circle cx="250" cy="250" r="52" fill="url(#g1)" filter="url(#shadow)" opacity=".95"/>
  <circle cx="250" cy="250" r="36" fill="#0d1117"/>
  <circle cx="250" cy="250" r="20" fill="url(#g1)" filter="url(#glow)"/>
  <circle cx="250" cy="250" r="8"  fill="#fff" opacity=".9"/>

  <!-- Label -->
  <text x="250" y="486" text-anchor="middle"
        font-family="'Menlo','Monaco',monospace" font-size="12"
        fill="rgba(255,255,255,.35)" letter-spacing="2">
    CLOUDIDE · SVG PREVIEW
  </text>
</svg>
`,
    },
  },

  {
    id: "json-explorer",
    name: "JSON Explorer",
    description: "JSON data with syntax highlighting and validation — live formatted viewer",
    icon: "📋",
    language: "JSON",
    runnable: true,
    files: {
      "data.json": `{
  "project": {
    "name": "CloudIDE",
    "version": "2.0.0",
    "description": "Browser-based code editor with real execution",
    "author": "CloudIDE Team",
    "license": "MIT"
  },
  "languages": [
    { "id": "javascript", "name": "JavaScript", "extension": ".js",  "runs": true,    "preview": "console" },
    { "id": "typescript", "name": "TypeScript", "extension": ".ts",  "runs": true,    "preview": "console" },
    { "id": "python",     "name": "Python",     "extension": ".py",  "runs": true,    "preview": "console" },
    { "id": "html",       "name": "HTML",        "extension": ".html","runs": true,    "preview": "iframe"  },
    { "id": "css",        "name": "CSS",         "extension": ".css", "runs": true,    "preview": "iframe"  },
    { "id": "markdown",   "name": "Markdown",    "extension": ".md",  "runs": true,    "preview": "iframe"  },
    { "id": "json",       "name": "JSON",        "extension": ".json","runs": true,    "preview": "iframe"  },
    { "id": "svg",        "name": "SVG",         "extension": ".svg", "runs": true,    "preview": "iframe"  },
    { "id": "bash",       "name": "Bash",        "extension": ".sh",  "runs": true,    "preview": "console" },
    { "id": "perl",       "name": "Perl",        "extension": ".pl",  "runs": true,    "preview": "console" },
    { "id": "c",          "name": "C",           "extension": ".c",   "runs": true,    "preview": "console", "compiled": true },
    { "id": "cpp",        "name": "C++",         "extension": ".cpp", "runs": true,    "preview": "console", "compiled": true },
    { "id": "flutter",    "name": "Flutter",     "extension": ".dart","runs": false,   "preview": "apk"     },
    { "id": "android",    "name": "Android",     "extension": ".kt",  "runs": false,   "preview": "apk"     }
  ],
  "stats": {
    "totalRuns":      142897,
    "activeUsers":    3841,
    "templatesCount": 16,
    "sharedProjects": 2741
  },
  "config": {
    "maxRunsPerDay":    50,
    "execTimeoutSec":   10,
    "maxOutputKB":      100,
    "supportedFormats": ["zip", "json"],
    "features": {
      "auth":         true,
      "projects":     true,
      "sharing":      true,
      "buildAPK":     false,
      "collaboration": false
    }
  }
}
`,
    },
  },

  {
    id: "api-mock",
    name: "API Mock",
    description: "Simulate REST API calls with mock data — fetch patterns, async/await, error handling",
    icon: "🔌",
    language: "JavaScript",
    runnable: true,
    files: {
      "api-mock.js": `// API Mock — simulates real REST API calls
// The sandbox blocks network access, so we mock the responses here.
// This shows real async/await + fetch patterns you can use in production.

// ── Mock database ─────────────────────────────────────────────────────────────
const DB = {
  users: [
    { id: 1, name: "Alice Chen",   email: "alice@example.com", role: "admin",  active: true  },
    { id: 2, name: "Bob Smith",    email: "bob@example.com",   role: "user",   active: true  },
    { id: 3, name: "Carol Davis",  email: "carol@example.com", role: "user",   active: false },
    { id: 4, name: "Dave Wilson",  email: "dave@example.com",  role: "admin",  active: true  },
  ],
  posts: [
    { id: 1, userId: 1, title: "Getting Started with CloudIDE", likes: 42 },
    { id: 2, userId: 2, title: "10 JavaScript Tricks",          likes: 87 },
    { id: 3, userId: 1, title: "Python vs JavaScript in 2024",  likes: 156 },
  ],
};

// ── Mock fetch function ───────────────────────────────────────────────────────
async function mockFetch(url, options = {}) {
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100)); // simulate latency

  const method = (options.method ?? "GET").toUpperCase();
  const body   = options.body ? JSON.parse(options.body) : null;

  // Route: GET /users
  if (url === "/api/users" && method === "GET") {
    return { ok: true, status: 200, json: async () => ({ data: DB.users, total: DB.users.length }) };
  }

  // Route: GET /users/:id
  const userMatch = url.match(/^\\/api\\/users\\/(\\d+)$/);
  if (userMatch && method === "GET") {
    const user = DB.users.find(u => u.id === parseInt(userMatch[1]));
    if (!user) return { ok: false, status: 404, json: async () => ({ error: "User not found" }) };
    return { ok: true, status: 200, json: async () => ({ data: user }) };
  }

  // Route: POST /users
  if (url === "/api/users" && method === "POST") {
    if (!body?.name || !body?.email) {
      return { ok: false, status: 400, json: async () => ({ error: "name and email are required" }) };
    }
    const newUser = { id: DB.users.length + 1, role: "user", active: true, ...body };
    DB.users.push(newUser);
    return { ok: true, status: 201, json: async () => ({ data: newUser }) };
  }

  // Route: GET /posts
  if (url === "/api/posts" && method === "GET") {
    const enriched = DB.posts.map(p => ({
      ...p,
      author: DB.users.find(u => u.id === p.userId)?.name ?? "Unknown",
    }));
    return { ok: true, status: 200, json: async () => ({ data: enriched }) };
  }

  return { ok: false, status: 404, json: async () => ({ error: \`Route not found: \${method} \${url}\` }) };
}

// ── API client wrapper ────────────────────────────────────────────────────────
async function apiCall(url, options = {}) {
  try {
    const res  = await mockFetch(url, options);
    const data = await res.json();
    if (!res.ok) throw new Error(\`\${res.status}: \${data.error}\`);
    return data;
  } catch (err) {
    throw new Error(\`API Error — \${err.message}\`);
  }
}

// ── Main program ──────────────────────────────────────────────────────────────
async function main() {
  console.log("=== GET /api/users ===");
  const { data: users, total } = await apiCall("/api/users");
  console.log(\`  Found \${total} users\`);
  users.filter(u => u.active).forEach(u => console.log(\`  [\${u.id}] \${u.name} (\${u.role})\`));

  console.log("\\n=== GET /api/users/2 ===");
  const { data: bob } = await apiCall("/api/users/2");
  console.log(\`  Name: \${bob.name}  Email: \${bob.email}\`);

  console.log("\\n=== GET /api/users/99 (404) ===");
  try { await apiCall("/api/users/99"); }
  catch (e) { console.log(\`  Error: \${e.message}\`); }

  console.log("\\n=== POST /api/users ===");
  const { data: newUser } = await apiCall("/api/users", {
    method: "POST",
    body: JSON.stringify({ name: "Eve Torres", email: "eve@example.com" }),
  });
  console.log(\`  Created: [\${newUser.id}] \${newUser.name}\`);

  console.log("\\n=== POST /api/users (400 — missing fields) ===");
  try { await apiCall("/api/users", { method: "POST", body: JSON.stringify({ name: "Incomplete" }) }); }
  catch (e) { console.log(\`  Error: \${e.message}\`); }

  console.log("\\n=== GET /api/posts ===");
  const { data: posts } = await apiCall("/api/posts");
  posts.sort((a, b) => b.likes - a.likes).forEach(p =>
    console.log(\`  [\${p.likes} ♥] \${p.title} — by \${p.author}\`)
  );

  console.log("\\n=== Parallel requests ===");
  const [r1, r2] = await Promise.all([
    apiCall("/api/users/1"),
    apiCall("/api/users/4"),
  ]);
  console.log(\`  Parallel result: \${r1.data.name} & \${r2.data.name}\`);
}

main().catch(console.error);
`,
    },
  },

  {
    id: "regex-playground",
    name: "Regex Playground",
    description: "Test regular expressions against text — matches, groups, replace, flags",
    icon: "🔍",
    language: "JavaScript",
    runnable: true,
    files: {
      "regex.js": `// Regex Playground — test patterns interactively

function test(label, pattern, text, expected) {
  const result = pattern.test(text);
  const mark   = result === expected ? "✓" : "✗";
  console.log(\`\${mark} \${label}: \${result}\`);
}

function matchAll(label, pattern, text) {
  const matches = [...text.matchAll(pattern)];
  console.log(\`\\n--- \${label} ---\`);
  if (!matches.length) { console.log("  (no matches)"); return; }
  matches.forEach((m, i) => {
    const groups = m.groups
      ? Object.entries(m.groups).map(([k, v]) => \`\${k}=\${JSON.stringify(v)}\`).join(", ")
      : m.slice(1).map((g, j) => \`group\${j + 1}=\${JSON.stringify(g)}\`).join(", ");
    console.log(\`  [\${i}] match=\${JSON.stringify(m[0])}  index=\${m.index}\${groups ? "  " + groups : ""}\`);
  });
}

// ── 1. Basic validation ───────────────────────────────────────────────────────
console.log("=== Email Validation ===");
const EMAIL = /^[\\w.+-]+@[\\w-]+\\.[a-z]{2,}$/i;
test("valid email",     EMAIL, "user@example.com",        true);
test("valid subdomain", EMAIL, "user@mail.example.co.uk", false); // subdomain TLD
test("missing @",       EMAIL, "userexample.com",         false);
test("no TLD",          EMAIL, "user@example",            false);

console.log("\\n=== Phone Numbers ===");
const PHONE = /^(\\+1[- ]?)?(\\(\\d{3}\\)|\\d{3})[- ]?\\d{3}[- ]?\\d{4}$/;
test("US with +1",     PHONE, "+1 (555) 867-5309", true);
test("plain 10-digit", PHONE, "5558675309",        true);
test("dashes",         PHONE, "555-867-5309",      true);
test("too short",      PHONE, "555-867",           false);

// ── 2. Named capture groups ───────────────────────────────────────────────────
const DATE_RE = /(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/g;
const dateSrc  = "Launched 2024-03-15, updated 2024-11-02, deadline 2025-01-31";
matchAll("ISO dates with named groups", DATE_RE, dateSrc);

// ── 3. URL parser ─────────────────────────────────────────────────────────────
const URL_RE = /(?<protocol>https?):\\/\\/(?<host>[^/]+)(?<path>\\/[^?#]*)?(?:\\?(?<query>[^#]*))?(?:#(?<hash>.*))?/g;
const urls   = "Visit https://cloudide.app/ide?lang=js#console or http://example.com";
matchAll("URL parts", URL_RE, urls);

// ── 4. String replacement ─────────────────────────────────────────────────────
console.log("\\n=== String Replace ===");
const camel   = "getUserProfileData";
const snake   = camel.replace(/([A-Z])/g, "_$1").toLowerCase();
console.log(\`  camelCase → snake_case: "\${camel}" → "\${snake}"\`);

const template = "Hello, {{name}}! You have {{count}} messages.";
const result   = template.replace(/{{(\\w+)}}/g, (_, key) =>
  ({ name: "Alice", count: 7 })[key] ?? \`{{MISSING:\${key}}}\`
);
console.log(\`  Template: "\${result}"\`);

// ── 5. Extract all hashtags ───────────────────────────────────────────────────
const tweet    = "Loving #JavaScript and #TypeScript! Check out #CloudIDE 🚀 #coding";
const hashtags = tweet.match(/#\\w+/g) ?? [];
console.log(\`\\n=== Hashtags ===\\n  \${hashtags.join(", ")}\`);

// ── 6. Password strength ──────────────────────────────────────────────────────
function passwordStrength(pw) {
  const rules = [
    [/[a-z]/,    "lowercase"],
    [/[A-Z]/,    "uppercase"],
    [/\\d/,       "digit"],
    [/[^\\w]/,    "special char"],
    [/.{8,}/,    "min 8 chars"],
  ];
  const passed = rules.filter(([re]) => re.test(pw));
  const score  = passed.length;
  const label  = score <= 2 ? "Weak" : score <= 3 ? "Fair" : score <= 4 ? "Good" : "Strong";
  return { score, label, missing: rules.filter(([re]) => !re.test(pw)).map(([,l]) => l) };
}
console.log("\\n=== Password Strength ===");
["abc", "password", "Pass1234", "P@ssw0rd!"].forEach(pw => {
  const { score, label, missing } = passwordStrength(pw);
  const missing_str = missing.length ? \`  missing: \${missing.join(", ")}\` : "";
  console.log(\`  "\${pw.padEnd(12)}" → \${label} (\${score}/5)\${missing_str}\`);
});
`,
    },
  },

  {
    id: "data-structures",
    name: "Data Structures",
    description: "Linked list, hash map, binary search tree, and stack — all from scratch in JS",
    icon: "🧱",
    language: "JavaScript",
    runnable: true,
    files: {
      "data-structures.js": `// Data Structures from scratch in JavaScript

// ── 1. Linked List ────────────────────────────────────────────────────────────
class ListNode { constructor(val) { this.val = val; this.next = null; } }

class LinkedList {
  constructor() { this.head = null; this.size = 0; }
  append(val)   { const n = new ListNode(val); if (!this.head) { this.head = n; } else { let c = this.head; while (c.next) c = c.next; c.next = n; } this.size++; }
  prepend(val)  { const n = new ListNode(val); n.next = this.head; this.head = n; this.size++; }
  remove(val)   { if (!this.head) return; if (this.head.val === val) { this.head = this.head.next; this.size--; return; } let c = this.head; while (c.next && c.next.val !== val) c = c.next; if (c.next) { c.next = c.next.next; this.size--; } }
  toArray()     { const arr = []; let c = this.head; while (c) { arr.push(c.val); c = c.next; } return arr; }
  reverse()     { let prev = null, curr = this.head; while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; } this.head = prev; }
}

const list = new LinkedList();
[1,2,3,4,5].forEach(v => list.append(v));
console.log("=== Linked List ===");
console.log("  Forward:", list.toArray());
list.reverse();
console.log("  Reversed:", list.toArray());
list.remove(3);
console.log("  After remove(3):", list.toArray(), "| size:", list.size);

// ── 2. HashMap (separate chaining) ───────────────────────────────────────────
class HashMap {
  constructor(capacity = 16) { this.buckets = Array.from({ length: capacity }, () => []); this.capacity = capacity; this.count = 0; }
  _hash(key)    { let h = 0; for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) % this.capacity; return h; }
  set(key, val) { const b = this.buckets[this._hash(key)]; const existing = b.find(([k]) => k === key); if (existing) { existing[1] = val; } else { b.push([key, val]); this.count++; } }
  get(key)      { const b = this.buckets[this._hash(key)]; return b.find(([k]) => k === key)?.[1]; }
  has(key)      { return this.get(key) !== undefined; }
  delete(key)   { const i = this._hash(key); const b = this.buckets[i]; const idx = b.findIndex(([k]) => k === key); if (idx >= 0) { b.splice(idx, 1); this.count--; } }
  keys()        { return this.buckets.flat().map(([k]) => k); }
}

console.log("\\n=== HashMap ===");
const map = new HashMap();
map.set("name", "Alice"); map.set("age", 30); map.set("city", "NYC");
console.log("  name:", map.get("name"), "| age:", map.get("age"));
console.log("  has('city'):", map.has("city"), "| has('zip'):", map.has("zip"));
map.delete("age");
console.log("  After delete('age') — keys:", map.keys().join(", "), "| count:", map.count);

// ── 3. Binary Search Tree ─────────────────────────────────────────────────────
class BSTNode { constructor(val) { this.val = val; this.left = this.right = null; } }

class BST {
  constructor() { this.root = null; }
  insert(val) {
    const n = new BSTNode(val);
    if (!this.root) { this.root = n; return; }
    let c = this.root;
    while (true) {
      if (val < c.val) { if (!c.left)  { c.left  = n; return; } c = c.left;  }
      else             { if (!c.right) { c.right = n; return; } c = c.right; }
    }
  }
  inorder(node = this.root, res = []) { if (node) { this.inorder(node.left, res); res.push(node.val); this.inorder(node.right, res); } return res; }
  search(val, node = this.root) { if (!node) return false; if (val === node.val) return true; return val < node.val ? this.search(val, node.left) : this.search(val, node.right); }
  height(node = this.root) { if (!node) return 0; return 1 + Math.max(this.height(node.left), this.height(node.right)); }
}

console.log("\\n=== Binary Search Tree ===");
const bst = new BST();
[50, 30, 70, 20, 40, 60, 80].forEach(v => bst.insert(v));
console.log("  Inorder (sorted):", bst.inorder());
console.log("  Search 40:", bst.search(40), "| Search 55:", bst.search(55));
console.log("  Height:", bst.height());

// ── 4. Stack ──────────────────────────────────────────────────────────────────
class Stack {
  constructor() { this.data = []; }
  push(v)  { this.data.push(v); }
  pop()    { return this.data.pop(); }
  peek()   { return this.data[this.data.length - 1]; }
  isEmpty(){ return this.data.length === 0; }
  get size(){ return this.data.length; }
}

function isBalanced(s) {
  const stack = new Stack();
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (const c of s) {
    if ("([{".includes(c)) stack.push(c);
    else if (c in pairs) { if (stack.isEmpty() || stack.pop() !== pairs[c]) return false; }
  }
  return stack.isEmpty();
}

console.log("\\n=== Stack (Balanced Brackets) ===");
["{[()]}", "{[(])}", "((()))", "((())", "[]{}()"].forEach(s =>
  console.log(\`  "\${s}" → \${isBalanced(s) ? "✓ balanced" : "✗ unbalanced"}\`)
);
`,
    },
  },

  // ── Mobile / Build Required ────────────────────────────────────────────────
  {
    id: "flutter",
    name: "Flutter",
    description: "Cross-platform apps with Dart — iOS, Android, Web, Desktop",
    icon: "🐦",
    language: "Dart",
    files: {
      "lib/main.dart": `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Flutter Demo'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() { _counter++; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('You have pushed the button this many times:'),
            Text('$_counter', style: Theme.of(context).textTheme.headlineMedium),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
`,
      "pubspec.yaml": `name: flutter_app
description: A new Flutter project.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`,
      "README.md": `# Flutter App

A new Flutter project.

## Getting started

Run \`flutter pub get\` then \`flutter run\`.
`,
    },
  },

  {
    id: "expo-starter",
    name: "Expo / React Native",
    description: "Live phone preview in the IDE — edits sync to simulator automatically",
    icon: "📱",
    language: "JavaScript",
    files: {
      "App.js": `import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);
  const [color, setColor] = useState('#4ade80');

  const COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa'];
  const nextColor = () => {
    const i = (COLORS.indexOf(color) + 1) % COLORS.length;
    setColor(COLORS[i]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1117" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>☁ CloudIDE</Text>
          <Text style={styles.subtitle}>React Native live preview</Text>
        </View>

        {/* Counter card */}
        <View style={[styles.card, { borderColor: color + '40' }]}>
          <Text style={[styles.count, { color }]}>{count}</Text>
          <Text style={styles.label}>tap counter</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: color }]}
              onPress={() => setCount(c => c + 1)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>+ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => setCount(0)}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color picker card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accent color</Text>
          <View style={styles.colorRow}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  color === c && styles.swatchActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoText}>
            ✏  Edit this file — preview updates automatically
          </Text>
          <Text style={styles.infoText}>
            📱  Scan QR code to run on your real device
          </Text>
          <Text style={styles.infoText}>
            🌐  Switch to Web / iOS tabs above the phone
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d1117' },
  scroll:       { padding: 20 },
  header:       { alignItems: 'center', marginBottom: 28 },
  logo:         { fontSize: 22, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },
  subtitle:     { fontSize: 12, color: '#4ade80', marginTop: 4, opacity: 0.7 },
  card: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff15',
  },
  count:        { fontSize: 72, fontWeight: '900', textAlign: 'center', lineHeight: 80 },
  label:        { fontSize: 12, color: '#ffffff40', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2 },
  row:          { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
  },
  btnSecondary: { backgroundColor: '#21262d' },
  btnText:      { fontWeight: '700', fontSize: 15, color: '#000' },
  cardTitle:    { fontSize: 13, color: '#ffffff60', marginBottom: 12, fontWeight: '600' },
  colorRow:     { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  swatch:       { width: 32, height: 32, borderRadius: 16 },
  swatchActive: { transform: [{ scale: 1.25 }], shadowColor: '#000', shadowRadius: 6, shadowOpacity: 0.4, elevation: 6 },
  info:         { gap: 8, marginTop: 4 },
  infoText:     { fontSize: 11, color: '#ffffff30', fontFamily: 'monospace' },
});
`,
    },
  },

  {
    id: "react-native-ts",
    name: "React Native (TypeScript)",
    description: "Cross-platform mobile with React — iOS & Android",
    icon: "⚛",
    language: "TypeScript",
    files: {
      "App.tsx": `import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function App(): React.JSX.Element {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.hero}>
          <Text style={styles.title}>React Native App</Text>
          <Text style={styles.subtitle}>Built with TypeScript</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.count}>{count}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setCount(c => c + 1)}>
            <Text style={styles.buttonText}>Increment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.resetBtn]} onPress={() => setCount(0)}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  hero: { padding: 32, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#ffffff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  card: { margin: 16, padding: 24, backgroundColor: '#1a1a1a', borderRadius: 16, alignItems: 'center' },
  count: { fontSize: 64, fontWeight: '800', color: '#4ade80', marginBottom: 24 },
  button: { width: '100%', padding: 14, backgroundColor: '#4ade80', borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  resetBtn: { backgroundColor: '#374151' },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});

export default App;
`,
      "package.json": `{
  "name": "ReactNativeApp",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.6",
    "@types/react-native": "^0.72.0",
    "typescript": "5.0.4"
  }
}
`,
      "tsconfig.json": `{
  "extends": "@react-native/typescript-config/tsconfig.json"
}
`,
      "README.md": `# React Native App (TypeScript)

## Setup
\`\`\`
npm install
npx react-native run-android   # Android
npx react-native run-ios       # iOS
\`\`\`
`,
    },
  },

  {
    id: "android-kotlin",
    name: "Android (Kotlin)",
    description: "Native Android app using Kotlin — Google's preferred language",
    icon: "🤖",
    language: "Kotlin",
    files: {
      "app/src/main/java/com/example/app/MainActivity.kt": `package com.example.app

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private var count = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val countText = findViewById<TextView>(R.id.countText)
        val button = findViewById<Button>(R.id.button)

        button.setOnClickListener {
            count++
            countText.text = count.toString()
        }
    }
}
`,
      "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:background="#0d0d0d">

    <TextView
        android:id="@+id/countText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0"
        android:textSize="72sp"
        android:textColor="#4ade80"
        android:textStyle="bold"
        android:layout_marginBottom="32dp"/>

    <Button
        android:id="@+id/button"
        android:layout_width="200dp"
        android:layout_height="56dp"
        android:text="Increment"
        android:backgroundTint="#4ade80"
        android:textColor="#000000"/>
</LinearLayout>
`,
      "app/src/main/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@style/Theme.App">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
      "app/src/main/res/values/strings.xml": `<resources>
    <string name="app_name">My App</string>
</resources>
`,
      "app/src/main/res/values/themes.xml": `<resources>
    <style name="Theme.App" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">#4ade80</item>
        <item name="colorPrimaryDark">#22c55e</item>
        <item name="colorAccent">#4ade80</item>
    </style>
</resources>
`,
      "app/build.gradle.kts": `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release { isMinifyEnabled = false }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions { jvmTarget = "1.8" }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.10.0")
}
`,
      "build.gradle.kts": `plugins {
    id("com.android.application") version "8.1.4" apply false
    id("org.jetbrains.kotlin.android") version "1.9.10" apply false
}
`,
      "settings.gradle.kts": `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "MyApp"
include(":app")
`,
      "gradle/wrapper/gradle-wrapper.properties": `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,
      "gradlew": `#!/bin/sh
# Gradle start up script for UN*X
APP_HOME="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="Gradle"
CLASSPATH="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"
DEFAULT_JVM_OPTS='-Dfile.encoding=UTF-8 "-Xmx64m" "-Xms64m"'
set -- "$@" org.gradle.wrapper.GradleWrapperMain
exec "$JAVA_HOME/bin/java" $DEFAULT_JVM_OPTS -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
`,
      "README.md": `# Android App (Kotlin)

## Prerequisites
- Android Studio (recommended) **or** Android SDK + Java 17 + Gradle 8.4

## Build
\`\`\`bash
./gradlew assembleDebug
\`\`\`
APK output: \`app/build/outputs/apk/debug/app-debug.apk\`

## Build via Cloud IDE
Upload this project as a ZIP to the Cloud IDE build endpoint.
Requires Android SDK to be configured on the server.
`,
    },
  },

  {
    id: "android-java",
    name: "Android (Java)",
    description: "Native Android app using Java — classic Android development",
    icon: "☕",
    language: "Java",
    files: {
      "app/src/main/java/com/example/app/MainActivity.java": `package com.example.app;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private int count = 0;
    private TextView countText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        countText = findViewById(R.id.countText);
        Button button = findViewById(R.id.button);

        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                count++;
                countText.setText(String.valueOf(count));
            }
        });
    }
}
`,
      "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:background="#0d0d0d">

    <TextView
        android:id="@+id/countText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0"
        android:textSize="72sp"
        android:textColor="#4ade80"
        android:textStyle="bold"
        android:layout_marginBottom="32dp"/>

    <Button
        android:id="@+id/button"
        android:layout_width="200dp"
        android:layout_height="56dp"
        android:text="Increment"
        android:backgroundTint="#4ade80"
        android:textColor="#000000"/>
</LinearLayout>
`,
      "app/src/main/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@style/Theme.App">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
      "app/src/main/res/values/strings.xml": `<resources>
    <string name="app_name">My App</string>
</resources>
`,
      "app/src/main/res/values/themes.xml": `<resources>
    <style name="Theme.App" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">#4ade80</item>
        <item name="colorPrimaryDark">#22c55e</item>
        <item name="colorAccent">#4ade80</item>
    </style>
</resources>
`,
      "app/build.gradle": `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example.app'
    compileSdk 34

    defaultConfig {
        applicationId "com.example.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release { minifyEnabled false }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.10.0'
}
`,
      "build.gradle": `plugins {
    id 'com.android.application' version '8.1.4' apply false
}
`,
      "settings.gradle": `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = 'MyApp'
include ':app'
`,
      "gradle/wrapper/gradle-wrapper.properties": `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,
      "gradlew": `#!/bin/sh
# Gradle start up script for UN*X
APP_HOME="$(cd "$(dirname "$0")" && pwd)"
CLASSPATH="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"
DEFAULT_JVM_OPTS='-Dfile.encoding=UTF-8 "-Xmx64m" "-Xms64m"'
exec "$JAVA_HOME/bin/java" $DEFAULT_JVM_OPTS -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
`,
      "README.md": `# Android App (Java)

## Prerequisites
- Android Studio (recommended) **or** Android SDK + Java 17 + Gradle 8.4

## Build
\`\`\`bash
./gradlew assembleDebug
\`\`\`
APK output: \`app/build/outputs/apk/debug/app-debug.apk\`

## Build via Cloud IDE
Upload this project as a ZIP to the Cloud IDE build endpoint.
Requires Android SDK to be configured on the server.
`,
    },
  },

  {
    id: "ios-swift",
    name: "iOS (Swift)",
    description: "Native iOS apps with SwiftUI — Apple's modern framework",
    icon: "🍎",
    language: "Swift",
    files: {
      "MyApp.swift": `import SwiftUI

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`,
      "ContentView.swift": `import SwiftUI

struct ContentView: View {
    @State private var count = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                Text("\\(count)")
                    .font(.system(size: 80, weight: .bold, design: .rounded))
                    .foregroundColor(.green)

                Button(action: { count += 1 }) {
                    Label("Increment", systemImage: "plus.circle.fill")
                        .font(.title2)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 16)
                        .background(Color.green)
                        .foregroundColor(.black)
                        .cornerRadius(14)
                }

                Button("Reset", action: { count = 0 })
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.black)
            .navigationTitle("Counter")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    ContentView()
}
`,
      "Info.plist": `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>MyApp</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.myapp</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>UILaunchScreen</key>
    <dict/>
</dict>
</plist>
`,
      "README.md": `# iOS App (Swift + SwiftUI)

## Requirements
- macOS with Xcode 15+
- iOS 17+ deployment target

## Run
Open the project in Xcode and press Cmd+R, or run via Xcode CLI:
\`\`\`
xcodebuild -scheme MyApp -destination 'platform=iOS Simulator'
\`\`\`
`,
    },
  },

  {
    id: "python-kivy",
    name: "Python (Kivy)",
    description: "Cross-platform mobile apps with Python — iOS & Android",
    icon: "🐍",
    language: "Python",
    files: {
      "main.py": `"""
Kivy Counter App
Run: python main.py
Build APK: buildozer android debug
"""
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label


class CounterLayout(BoxLayout):
    def __init__(self, **kwargs):
        super().__init__(orientation='vertical', padding=40, spacing=20, **kwargs)
        self.count = 0

        self.label = Label(
            text='0',
            font_size='80sp',
            color=(0.29, 0.87, 0.5, 1),
            bold=True,
        )

        btn = Button(
            text='Increment',
            font_size='24sp',
            size_hint=(1, 0.2),
            background_color=(0.29, 0.87, 0.5, 1),
            color=(0, 0, 0, 1),
        )
        btn.bind(on_press=self.increment)

        reset = Button(
            text='Reset',
            font_size='20sp',
            size_hint=(1, 0.15),
            background_color=(0.2, 0.2, 0.2, 1),
        )
        reset.bind(on_press=self.reset)

        self.add_widget(self.label)
        self.add_widget(btn)
        self.add_widget(reset)

    def increment(self, instance):
        self.count += 1
        self.label.text = str(self.count)

    def reset(self, instance):
        self.count = 0
        self.label.text = '0'


class MyApp(App):
    def build(self):
        self.title = 'Counter App'
        return CounterLayout()


if __name__ == '__main__':
    MyApp().run()
`,
      "buildozer.spec": `[app]
title = My App
package.name = myapp
package.domain = org.example
source.dir = .
source.include_exts = py,png,jpg,kv,atlas
version = 1.0
requirements = python3,kivy
android.permissions = INTERNET

[buildozer]
log_level = 2
`,
      "requirements.txt": `kivy==2.3.0
buildozer==1.5.0
`,
      "README.md": `# Python Kivy Mobile App

## Run locally
\`\`\`bash
pip install -r requirements.txt
python main.py
\`\`\`

## Build APK
\`\`\`bash
pip install buildozer
buildozer android debug
\`\`\`
APK output: \`bin/myapp-1.0-debug.apk\`
`,
    },
  },

  {
    id: "dotnet-maui",
    name: ".NET MAUI (C#)",
    description: "Cross-platform with C# — iOS, Android, macOS, Windows",
    icon: "💜",
    language: "C#",
    files: {
      "MainPage.xaml.cs": `using Microsoft.Maui.Controls;

namespace MauiApp;

public partial class MainPage : ContentPage
{
    int count = 0;

    public MainPage()
    {
        InitializeComponent();
    }

    private void OnCounterClicked(object sender, EventArgs e)
    {
        count++;
        CounterBtn.Text = $"Clicked {count} time{(count == 1 ? "" : "s")}";
        SemanticScreenReader.Announce(CounterBtn.Text);
    }
}
`,
      "MainPage.xaml": `<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="MauiApp.MainPage"
             BackgroundColor="#0d0d0d">

    <ScrollView>
        <VerticalStackLayout Padding="30,0" Spacing="25" VerticalOptions="Center">
            <Image Source="dotnet_bot.png" HeightRequest="185" Aspect="AspectFit"/>
            <Label Text="Hello, World!"
                   Style="{StaticResource Headline}"
                   SemanticProperties.HeadingLevel="Level1"
                   TextColor="White"
                   HorizontalOptions="Center"/>
            <Label Text="Welcome to .NET MAUI"
                   TextColor="#888888"
                   HorizontalOptions="Center"/>
            <Button x:Name="CounterBtn"
                    Text="Click me"
                    SemanticProperties.Hint="Counts the number of times you click"
                    Clicked="OnCounterClicked"
                    HorizontalOptions="Center"
                    BackgroundColor="#4ade80"
                    TextColor="Black"/>
        </VerticalStackLayout>
    </ScrollView>
</ContentPage>
`,
      "App.xaml.cs": `namespace MauiApp;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();
        MainPage = new AppShell();
    }
}
`,
      "MauiProgram.cs": `using Microsoft.Extensions.Logging;

namespace MauiApp;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
`,
      "MauiApp.csproj": `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <TargetFrameworks>net8.0-android;net8.0-ios;net8.0-maccatalyst</TargetFrameworks>
        <RootNamespace>MauiApp</RootNamespace>
        <UseMaui>true</UseMaui>
        <ApplicationDisplayVersion>1.0</ApplicationDisplayVersion>
        <ApplicationVersion>1</ApplicationVersion>
    </PropertyGroup>
</Project>
`,
      "README.md": `# .NET MAUI App (C#)

## Requirements
- .NET 8 SDK
- Visual Studio 2022 or VS Code with C# extension

## Build
\`\`\`bash
dotnet build
dotnet publish -f net8.0-android -c Release
\`\`\`
`,
    },
  },

  {
    id: "ionic-capacitor",
    name: "Ionic / Capacitor",
    description: "Web-first mobile apps with HTML, CSS & TypeScript",
    icon: "⚡",
    language: "TypeScript",
    files: {
      "src/app/home/home.page.ts": `import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  count = 0;

  increment() {
    this.count++;
  }

  reset() {
    this.count = 0;
  }
}
`,
      "src/app/home/home.page.html": `<ion-header>
  <ion-toolbar color="dark">
    <ion-title>Ionic App</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true" class="ion-padding ion-text-center">
  <div class="counter-container">
    <h1 class="count">{{ count }}</h1>
    <ion-button expand="block" color="success" (click)="increment()">
      Increment
    </ion-button>
    <ion-button expand="block" fill="outline" (click)="reset()">
      Reset
    </ion-button>
  </div>
</ion-content>
`,
      "src/app/home/home.page.scss": `.counter-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;

  .count {
    font-size: 80px;
    font-weight: 800;
    color: #4ade80;
    margin: 0;
  }

  ion-button {
    width: 220px;
  }
}
`,
      "capacitor.config.ts": `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'MyIonicApp',
  webDir: 'www',
};

export default config;
`,
      "package.json": `{
  "name": "ionic-app",
  "version": "0.0.1",
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "android": "npx cap sync android && npx cap open android",
    "ios": "npx cap sync ios && npx cap open ios"
  },
  "dependencies": {
    "@angular/core": "^17.0.0",
    "@capacitor/android": "^6.0.0",
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0",
    "@ionic/angular": "^8.0.0"
  }
}
`,
      "README.md": `# Ionic + Capacitor App

## Setup
\`\`\`bash
npm install
\`\`\`

## Run in browser
\`\`\`bash
npx ionic serve
\`\`\`

## Build for Android / iOS
\`\`\`bash
npx ionic build
npx cap sync
npx cap open android   # opens Android Studio
npx cap open ios       # opens Xcode
\`\`\`
`,
    },
  },

  {
    id: "rust-mobile",
    name: "Rust (Tauri Mobile)",
    description: "Blazing-fast mobile apps with Rust + Tauri + WebView",
    icon: "🦀",
    language: "Rust",
    files: {
      "src-tauri/src/main.rs": `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! From Rust.", name)
}
`,
      "src-tauri/Cargo.toml": `[package]
name = "tauri-app"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.0", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`,
      "src-tauri/tauri.conf.json": `{
  "productName": "tauri-app",
  "version": "0.1.0",
  "identifier": "com.example.tauri-app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{ "title": "Tauri App", "width": 800, "height": 600 }]
  }
}
`,
      "src/main.ts": `const { invoke } = window.__TAURI__.core;

const nameInput = document.querySelector<HTMLInputElement>('#name')!;
const greetMsg = document.querySelector<HTMLParagraphElement>('#greet-msg')!;

async function greet() {
  greetMsg.textContent = await invoke('greet', { name: nameInput.value });
}

document.querySelector('#greet-button')!.addEventListener('click', greet);
`,
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tauri App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d0d0d; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; color: #4ade80; margin-bottom: 2rem; }
    input { padding: 12px 20px; font-size: 1rem; border-radius: 8px; border: 1px solid #333; background: #1a1a1a; color: #fff; margin-bottom: 1rem; display: block; width: 100%; }
    button { padding: 12px 32px; font-size: 1rem; background: #4ade80; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; }
    #greet-msg { margin-top: 1.5rem; color: #4ade80; font-size: 1.2rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Tauri + Rust</h1>
    <input id="name" placeholder="Enter your name" />
    <button id="greet-button">Greet</button>
    <p id="greet-msg"></p>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`,
      "README.md": `# Tauri Mobile App (Rust)

## Requirements
- Rust + Cargo
- Node.js
- Tauri CLI: \`cargo install tauri-cli\`

## Run
\`\`\`bash
npm install
cargo tauri dev
\`\`\`

## Build
\`\`\`bash
cargo tauri build
\`\`\`

## Mobile (Android/iOS)
\`\`\`bash
cargo tauri android init
cargo tauri android dev
\`\`\`
`,
    },
  },

  // ── Extra runnable: API mock + fetch demo ─────────────────────────────────
  {
    id: "js-api-mock",
    name: "JS API Mock",
    description: "REST API mock server pattern — routes, middleware, JSON responses",
    icon: "🔌",
    language: "JavaScript",
    runnable: true,
    files: {
      "api-mock.js": `// REST API Mock — simulates a backend without any server
// Run ▶ to see request/response pairs logged to console

// ── Tiny in-process router ──────────────────────────────────────────
class MockRouter {
  constructor() { this.routes = []; }

  get(path, handler)    { this.routes.push({ method: "GET",    path, handler }); }
  post(path, handler)   { this.routes.push({ method: "POST",   path, handler }); }
  put(path, handler)    { this.routes.push({ method: "PUT",    path, handler }); }
  delete(path, handler) { this.routes.push({ method: "DELETE", path, handler }); }

  async request(method, path, body = null) {
    const route = this.routes.find(
      r => r.method === method && this._match(r.path, path)
    );
    const params = route ? this._params(route.path, path) : {};
    const req  = { method, path, params, body };
    const res  = { status: 200, body: null };
    if (!route) { res.status = 404; res.body = { error: "Not Found" }; }
    else await route.handler(req, res);
    return res;
  }

  _match(pattern, path) {
    const re = pattern.replace(/:([\\w]+)/g, "([^/]+)");
    return new RegExp(\`^\${re}$\`).test(path);
  }
  _params(pattern, path) {
    const keys  = [...pattern.matchAll(/:([\\w]+)/g)].map(m => m[1]);
    const vals  = path.match(pattern.replace(/:([\\w]+)/g, "([^/]+)"))?.slice(1) ?? [];
    return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
  }
}

// ── In-memory data store ────────────────────────────────────────────
let users = [
  { id: 1, name: "Alice",   email: "alice@example.com",   role: "admin" },
  { id: 2, name: "Bob",     email: "bob@example.com",     role: "user"  },
  { id: 3, name: "Charlie", email: "charlie@example.com", role: "user"  },
];
let nextId = 4;

// ── Register routes ─────────────────────────────────────────────────
const app = new MockRouter();

app.get("/users", async (req, res) => {
  res.body = { users, total: users.length };
});

app.get("/users/:id", async (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) { res.status = 404; res.body = { error: "User not found" }; return; }
  res.body = { user };
});

app.post("/users", async (req, res) => {
  const { name, email, role = "user" } = req.body;
  if (!name || !email) { res.status = 400; res.body = { error: "name and email required" }; return; }
  const user = { id: nextId++, name, email, role };
  users.push(user);
  res.status = 201;
  res.body = { user, message: "User created" };
});

app.put("/users/:id", async (req, res) => {
  const idx = users.findIndex(u => u.id === Number(req.params.id));
  if (idx === -1) { res.status = 404; res.body = { error: "User not found" }; return; }
  users[idx] = { ...users[idx], ...req.body };
  res.body = { user: users[idx], message: "User updated" };
});

app.delete("/users/:id", async (req, res) => {
  const before = users.length;
  users = users.filter(u => u.id !== Number(req.params.id));
  if (users.length === before) { res.status = 404; res.body = { error: "User not found" }; return; }
  res.body = { message: "User deleted" };
});

// ── Run test requests ───────────────────────────────────────────────
async function log(method, path, body = null) {
  const res = await app.request(method, path, body);
  const icon = res.status < 300 ? "✓" : res.status < 400 ? "→" : "✗";
  console.log(\`\${icon} \${method} \${path} → \${res.status}\`);
  console.log("  ", JSON.stringify(res.body, null, 2).split("\\n").join("\\n   "));
  console.log();
}

console.log("=== REST API Mock ===\\n");
await log("GET",    "/users");
await log("GET",    "/users/1");
await log("POST",   "/users", { name: "Diana", email: "diana@example.com" });
await log("GET",    "/users/4");
await log("PUT",    "/users/2", { name: "Bobby", role: "admin" });
await log("DELETE", "/users/3");
await log("GET",    "/users");
await log("GET",    "/users/99");  // 404
`,
    },
  },

  {
    id: "js-fetch-mock",
    name: "Fetch & JSON",
    description: "HTTP fetch patterns, async/await, error handling, and data transformation",
    icon: "🌐",
    language: "JavaScript",
    runnable: true,
    files: {
      "fetch-demo.js": `// Fetch & JSON Patterns — async HTTP, error handling, data transforms
// Uses built-in mock data (no real network calls needed)

// ── Mock fetch (works like real fetch, no network needed) ───────────
const MOCK_DB = {
  "https://api.example.com/users": [
    { id: 1, name: "Alice",   email: "alice@example.com",   score: 92 },
    { id: 2, name: "Bob",     email: "bob@example.com",     score: 78 },
    { id: 3, name: "Charlie", email: "charlie@example.com", score: 95 },
    { id: 4, name: "Diana",   email: "diana@example.com",   score: 88 },
    { id: 5, name: "Eve",     email: "eve@example.com",     score: 70 },
  ],
  "https://api.example.com/posts": [
    { id: 1, userId: 1, title: "Getting started with JS",     views: 4200 },
    { id: 2, userId: 1, title: "Async/await patterns",        views: 3100 },
    { id: 3, userId: 2, title: "REST API design",             views: 2800 },
    { id: 4, userId: 3, title: "TypeScript generics",         views: 5600 },
    { id: 5, userId: 3, title: "Performance optimization",    views: 1900 },
  ],
};

async function fetchJson(url) {
  await new Promise(r => setTimeout(r, 10)); // simulate latency
  const data = MOCK_DB[url] ?? MOCK_DB[url.split("?")[0]];
  if (!data) throw new Error(\`404: \${url} not found\`);
  return { ok: true, json: async () => JSON.parse(JSON.stringify(data)) };
}

// ── Pattern 1: Basic fetch + error handling ─────────────────────────
console.log("=== Pattern 1: Basic Fetch ===");
try {
  const res  = await fetchJson("https://api.example.com/users");
  if (!res.ok) throw new Error(\`HTTP error \${res.status}\`);
  const data = await res.json();
  console.log(\`Fetched \${data.length} users\`);
  data.slice(0, 3).forEach(u => console.log(\`  [\${u.id}] \${u.name} (score: \${u.score})\`));
} catch (err) {
  console.error("Fetch failed:", err.message);
}

// ── Pattern 2: Parallel fetch with Promise.all ─────────────────────
console.log("\\n=== Pattern 2: Parallel Fetch ===");
const [usersRes, postsRes] = await Promise.all([
  fetchJson("https://api.example.com/users"),
  fetchJson("https://api.example.com/posts"),
]);
const [users, posts] = await Promise.all([usersRes.json(), postsRes.json()]);
console.log(\`Loaded \${users.length} users and \${posts.length} posts in parallel\`);

// ── Pattern 3: Join + transform ─────────────────────────────────────
console.log("\\n=== Pattern 3: Join + Transform ===");
const userMap = Object.fromEntries(users.map(u => [u.id, u]));
const enriched = posts
  .map(p => ({ ...p, author: userMap[p.userId]?.name ?? "Unknown" }))
  .sort((a, b) => b.views - a.views);

console.log("Top posts by views:");
enriched.forEach(p => {
  const bar = "█".repeat(Math.round(p.views / 400));
  console.log(\`  \${bar.padEnd(15)} \${p.views.toLocaleString()} · "\${p.title}" by \${p.author}\`);
});

// ── Pattern 4: Aggregate stats ──────────────────────────────────────
console.log("\\n=== Pattern 4: Aggregation ===");
const stats = users.reduce((acc, u) => {
  acc.totalScore += u.score;
  acc.max = Math.max(acc.max, u.score);
  acc.min = Math.min(acc.min, u.score);
  return acc;
}, { totalScore: 0, max: -Infinity, min: Infinity });

console.log(\`Average score: \${(stats.totalScore / users.length).toFixed(1)}\`);
console.log(\`Highest:       \${stats.max} (\${users.find(u => u.score === stats.max)?.name})\`);
console.log(\`Lowest:        \${stats.min} (\${users.find(u => u.score === stats.min)?.name})\`);

// ── Pattern 5: Error boundary ───────────────────────────────────────
console.log("\\n=== Pattern 5: Error Handling ===");
const results = await Promise.allSettled([
  fetchJson("https://api.example.com/users"),
  fetchJson("https://api.example.com/missing"),  // will fail
  fetchJson("https://api.example.com/posts"),
]);
results.forEach((r, i) => {
  if (r.status === "fulfilled") console.log(\`  [✓] Request \${i+1} succeeded\`);
  else                          console.log(\`  [✗] Request \${i+1} failed: \${r.reason.message}\`);
});
`,
    },
  },

  {
    id: "go-starter",
    name: "Go",
    description: "Go language — goroutines, channels, structs, interfaces, and stdlib",
    icon: "🐹",
    language: "Go",
    runnable: true,
    files: {
      "main.go": `// Go Starter — click Run ▶ or press Ctrl+Enter
package main

import (
        "fmt"
        "math"
        "sort"
        "strings"
        "sync"
)

// ── Interfaces & structs ─────────────────────────────────────────────
type Shape interface {
        Area()     float64
        Perimeter() float64
        Name()     string
}

type Circle struct{ R float64 }
type Rect   struct{ W, H float64 }

func (c Circle) Area()      float64 { return math.Pi * c.R * c.R }
func (c Circle) Perimeter() float64 { return 2 * math.Pi * c.R }
func (c Circle) Name()      string  { return fmt.Sprintf("Circle(r=%.1f)", c.R) }

func (r Rect) Area()      float64 { return r.W * r.H }
func (r Rect) Perimeter() float64 { return 2 * (r.W + r.H) }
func (r Rect) Name()      string  { return fmt.Sprintf("Rect(%.1f×%.1f)", r.W, r.H) }

func printShape(s Shape) {
        fmt.Printf("  %-22s  area=%-8.2f  perim=%.2f\\n", s.Name(), s.Area(), s.Perimeter())
}

// ── Goroutines + channels ────────────────────────────────────────────
func fibonacci(n int, ch chan<- int) {
        a, b := 0, 1
        for i := 0; i < n; i++ {
                ch <- a
                a, b = b, a+b
        }
        close(ch)
}

// ── Generics (Go 1.18+) ──────────────────────────────────────────────
func Map[T, U any](slice []T, fn func(T) U) []U {
        out := make([]U, len(slice))
        for i, v := range slice { out[i] = fn(v) }
        return out
}

func Filter[T any](slice []T, fn func(T) bool) []T {
        var out []T
        for _, v := range slice { if fn(v) { out = append(out, v) } }
        return out
}

func main() {
        // Shapes
        fmt.Println("=== Shapes ===")
        shapes := []Shape{Circle{5}, Rect{4, 6}, Circle{3}, Rect{10, 2}}
        for _, s := range shapes { printShape(s) }

        // Goroutines
        fmt.Println("\\n=== Fibonacci (goroutine) ===")
        ch := make(chan int, 12)
        go fibonacci(12, ch)
        var fibs []string
        for n := range ch { fibs = append(fibs, fmt.Sprintf("%d", n)) }
        fmt.Println(" ", strings.Join(fibs, ", "))

        // WaitGroup
        fmt.Println("\\n=== Concurrent workers ===")
        var wg sync.WaitGroup
        var mu sync.Mutex
        results := make([]string, 0, 5)
        for i := 1; i <= 5; i++ {
                wg.Add(1)
                go func(id int) {
                        defer wg.Done()
                        mu.Lock()
                        results = append(results, fmt.Sprintf("worker-%d done", id))
                        mu.Unlock()
                }(i)
        }
        wg.Wait()
        sort.Strings(results)
        for _, r := range results { fmt.Println(" ", r) }

        // Generics
        fmt.Println("\\n=== Generics ===")
        nums  := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
        even  := Filter(nums, func(n int) bool { return n%2 == 0 })
        sq    := Map(even, func(n int) int { return n * n })
        fmt.Println("  Evens:   ", even)
        fmt.Println("  Squared:", sq)
}
`,
    },
  },

  {
    id: "rust-starter",
    name: "Rust",
    description: "Rust — ownership, structs, iterators, pattern matching, and error handling",
    icon: "🦀",
    language: "Rust",
    runnable: true,
    files: {
      "main.rs": `// Rust Starter — click Run ▶ or press Ctrl+Enter
use std::collections::HashMap;

// ── Structs & traits ────────────────────────────────────────────────
#[derive(Debug, Clone)]
struct Student {
    name:  String,
    score: f64,
}

impl Student {
    fn new(name: &str, score: f64) -> Self {
        Student { name: name.to_string(), score }
    }
    fn grade(&self) -> &str {
        match self.score as u32 {
            90..=100 => "A",
            80..=89  => "B",
            70..=79  => "C",
            60..=69  => "D",
            _        => "F",
        }
    }
}

impl std::fmt::Display for Student {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:<10} {:.1}  ({})", self.name, self.score, self.grade())
    }
}

// ── Error handling with Result ───────────────────────────────────────
fn parse_score(s: &str) -> Result<f64, String> {
    s.trim()
     .parse::<f64>()
     .map_err(|e| format!("Invalid score '{}': {}", s, e))
}

fn main() {
    // Structs & pattern matching
    println!("=== Student Leaderboard ===");
    let mut students = vec![
        Student::new("Alice",   92.5),
        Student::new("Bob",     78.0),
        Student::new("Charlie", 95.3),
        Student::new("Diana",   88.1),
        Student::new("Eve",     71.4),
    ];
    students.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    for (i, s) in students.iter().enumerate() {
        println!("  {}. {}", i + 1, s);
    }

    // Iterators & closures
    println!("\\n=== Iterator chains ===");
    let total: f64  = students.iter().map(|s| s.score).sum();
    let avg          = total / students.len() as f64;
    let above_avg: Vec<_> = students.iter()
        .filter(|s| s.score > avg)
        .map(|s| s.name.as_str())
        .collect();
    println!("  Average:     {:.2}", avg);
    println!("  Above avg:   {:?}", above_avg);

    // HashMap
    println!("\\n=== Grade distribution ===");
    let mut grades: HashMap<&str, u32> = HashMap::new();
    for s in &students {
        *grades.entry(s.grade()).or_insert(0) += 1;
    }
    let mut sorted_grades: Vec<_> = grades.iter().collect();
    sorted_grades.sort_by_key(|(k, _)| *k);
    for (grade, count) in &sorted_grades {
        let bar = "█".repeat(**count as usize * 4);
        println!("  {}  {}  ({})", grade, bar, count);
    }

    // Result & error handling
    println!("\\n=== Error handling ===");
    for input in &["87.5", "not_a_number", "100", "-5"] {
        match parse_score(input) {
            Ok(s)  => println!("  ✓  '{}' → {:.1}", input, s),
            Err(e) => println!("  ✗  {}", e),
        }
    }

    // Ownership example
    println!("\\n=== Ownership & borrowing ===");
    let names: Vec<String> = students.iter().map(|s| s.name.clone()).collect();
    let upper: Vec<String> = names.iter().map(|n| n.to_uppercase()).collect();
    println!("  Original: {:?}", names);
    println!("  Upper:    {:?}", upper);
}
`,
    },
  },

  {
    id: "go-gomobile",
    name: "Go (gomobile)",
    description: "Go language for Android/iOS via gomobile SDK bindings",
    icon: "🐹",
    language: "Go",
    files: {
      "main.go": `package main

import (
        "fmt"
        "log"

        "golang.org/x/mobile/app"
        "golang.org/x/mobile/event/lifecycle"
        "golang.org/x/mobile/event/paint"
        "golang.org/x/mobile/event/size"
        "golang.org/x/mobile/gl"
)

func main() {
        app.Main(func(a app.App) {
                var glctx gl.Context
                for e := range a.Events() {
                        switch e := a.Filter(e).(type) {
                        case lifecycle.Event:
                                switch e.Crosses(lifecycle.StageVisible) {
                                case lifecycle.CrossOn:
                                        glctx, _ = e.DrawContext.(gl.Context)
                                case lifecycle.CrossOff:
                                        glctx = nil
                                }
                        case paint.Event:
                                if glctx == nil || e.External {
                                        continue
                                }
                                // Clear to dark background
                                glctx.ClearColor(0.05, 0.05, 0.05, 1)
                                glctx.Clear(gl.COLOR_BUFFER_BIT)
                                a.Publish()
                        case size.Event:
                                log.Printf("Window size: %v", e)
                        }
                }
        })
}

// Shared library function callable from Android/iOS
//
//export Greet
func Greet(name string) string {
        return fmt.Sprintf("Hello, %s! From Go.", name)
}
`,
      "go.mod": `module example.com/mobileapp

go 1.21

require (
    golang.org/x/mobile v0.0.0-20231127183840-76ac6878050a
)
`,
      "pkg/counter/counter.go": `package counter

// Counter is a simple counter that can be bound to Android/iOS via gomobile.
type Counter struct {
        value int
}

// Increment increments the counter.
func (c *Counter) Increment() {
        c.value++
}

// Reset resets the counter to zero.
func (c *Counter) Reset() {
        c.value = 0
}

// Value returns the current count.
func (c *Counter) Value() int {
        return c.value
}
`,
      "README.md": `# Go Mobile App (gomobile)

## Requirements
- Go 1.21+
- Android NDK / Xcode
- gomobile: \`go install golang.org/x/mobile/cmd/gomobile@latest\`

## Initialize
\`\`\`bash
gomobile init
\`\`\`

## Build Android AAR
\`\`\`bash
gomobile bind -target android ./pkg/counter
\`\`\`

## Build iOS framework
\`\`\`bash
gomobile bind -target ios ./pkg/counter
\`\`\`

## Build full app APK
\`\`\`bash
gomobile build -target android .
\`\`\`
`,
    },
  },

  {
    id: "cpp-ndk",
    name: "C++ (Android NDK)",
    description: "Native C++ for Android via NDK — games, high-performance code",
    icon: "⚙",
    language: "C++",
    files: {
      "app/src/main/cpp/main.cpp": `#include <jni.h>
#include <string>
#include <android/log.h>

#define LOG_TAG "NativeApp"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

extern "C" {

JNIEXPORT jstring JNICALL
Java_com_example_app_MainActivity_stringFromJNI(
        JNIEnv* env,
        jobject /* this */) {
    std::string hello = "Hello from C++!";
    LOGI("stringFromJNI called");
    return env->NewStringUTF(hello.c_str());
}

JNIEXPORT jint JNICALL
Java_com_example_app_MainActivity_addNumbers(
        JNIEnv* env,
        jobject /* this */,
        jint a,
        jint b) {
    LOGI("addNumbers: %d + %d", a, b);
    return a + b;
}

} // extern "C"
`,
      "app/src/main/cpp/CMakeLists.txt": `cmake_minimum_required(VERSION 3.22.1)
project("nativeapp")

add_library(
    nativeapp
    SHARED
    main.cpp
)

find_library(log-lib log)

target_link_libraries(
    nativeapp
    \${log-lib}
)
`,
      "app/src/main/java/com/example/app/MainActivity.kt": `package com.example.app

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    external fun stringFromJNI(): String
    external fun addNumbers(a: Int, b: Int): Int

    companion object {
        init { System.loadLibrary("nativeapp") }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val tv = findViewById<TextView>(R.id.textView)
        val msg = stringFromJNI()
        val sum = addNumbers(21, 21)
        tv.text = "$msg\n21 + 21 = $sum"
    }
}
`,
      "app/build.gradle.kts": `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.app"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24
        targetSdk = 34
        externalNativeBuild {
            cmake { cppFlags += "-std=c++17" }
        }
    }
    externalNativeBuild {
        cmake { path = file("src/main/cpp/CMakeLists.txt") }
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
}
`,
      "README.md": `# Android NDK App (C++)

## Build
\`\`\`bash
./gradlew assembleDebug
\`\`\`

## Requirements
- Android Studio with NDK & CMake installed
- NDK version 25+
`,
    },
  },
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}
