# StackPad — Undo & Redo Text Editor

A responsive browser-based text editor demonstrating two stack data structures, implemented in Java with Spring Boot.

## Features
- Text editor with debounced saving to the Java backend
- Undo and redo using two `Stack<String>` instances
- Clear text (can be undone)
- History modal for undo and redo states
- Keyboard shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z
- Per-browser-session state using `HttpSession`
- Responsive layout for desktop and mobile

## Requirements
- Java 17+
- Maven 3.6+ (or use the included Dockerfile to build/deploy)

## Run locally
From this directory:

```bash
mvn spring-boot:run
```

Open http://localhost:8080

Alternatively:

```bash
mvn clean package
java -jar target/undo-redo-editor-1.0.0.jar
```

## Deploy publicly with Render
1. Create a GitHub repository and push the contents of this project to it.
2. Sign in to Render and choose **New + → Web Service** (or use the Blueprint option for `render.yaml`).
3. Connect your repository. The included Dockerfile builds and runs the app.
4. Deploy and wait for the build to finish.
5. Open the public `onrender.com` URL Render gives you and test Undo, Redo, Clear and History.

The hosting account and deployment must be completed by the project owner. A public link is not created until the deployment succeeds.

## How the stacks work
- When the text changes, the previous state is pushed onto `undoStack`; the redo stack is cleared.
- Undo pushes the current text onto `redoStack`, then pops the previous text from `undoStack`.
- Redo pushes the current text onto `undoStack`, then pops the next text from `redoStack`.
- Each browser session has its own state. This is a demonstration app, not persistent cloud storage.

## Important limitations
- State is kept in the server's HTTP session and may be lost when the session expires or the service restarts.
- This is a learning project; do not use it for sensitive or confidential text.
- The app stores snapshots after typing pauses rather than grouping keystrokes into full editing transactions.
