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
