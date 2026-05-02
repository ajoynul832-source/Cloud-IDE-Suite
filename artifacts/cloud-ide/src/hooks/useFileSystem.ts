import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "cloudide_files";

const DEFAULT_FILES: Record<string, string> = {
  "lib/main.dart": `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
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
    setState(() {
      _counter++;
    });
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
          children: <Widget>[
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
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

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`,
  "README.md": `# My Flutter App

Edit files on the left, click Run to preview, or Build APK to compile.
`
};

export function useFileSystem() {
  const [files, setFiles] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFiles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse files", e);
        setFiles(DEFAULT_FILES);
      }
    } else {
      setFiles(DEFAULT_FILES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FILES));
    }
  }, []);

  const saveFile = useCallback((path: string, content: string) => {
    setFiles((prev) => {
      const next = { ...prev, [path]: content };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const createFile = useCallback((path: string, content: string = "") => {
    if (!path.trim()) return false;
    setFiles((prev) => {
      if (prev[path]) return prev;
      const next = { ...prev, [path]: content };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return true;
  }, []);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    if (!newPath.trim() || oldPath === newPath) return false;
    setFiles((prev) => {
      if (!prev[oldPath] || prev[newPath]) return prev;
      const next = { ...prev };
      next[newPath] = next[oldPath];
      delete next[oldPath];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return true;
  }, []);

  const deleteFile = useCallback((path: string) => {
    setFiles((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    files,
    saveFile,
    createFile,
    renameFile,
    deleteFile,
  };
}
