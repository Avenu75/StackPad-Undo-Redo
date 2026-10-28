package com.example.editor;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.Stack;

@RestController
@RequestMapping("/api/editor")
public class EditorController {
    private static final String STATE_KEY = "undoRedoEditorState";

    public static class EditorState {
        public String currentText = "";
        public final Stack<String> undoStack = new Stack<>();
        public final Stack<String> redoStack = new Stack<>();
    }

    public record ChangeRequest(String text) {}
    public record EditorResponse(
            String text, boolean canUndo, boolean canRedo,
            int undoCount, int redoCount
    ) {}

    private EditorState getState(HttpSession session) {
        EditorState state = (EditorState) session.getAttribute(STATE_KEY);
        if (state == null) {
            state = new EditorState();
            session.setAttribute(STATE_KEY, state);
        }
        return state;
    }

    private EditorResponse response(EditorState state) {
        return new EditorResponse(
                state.currentText,
                !state.undoStack.isEmpty(),
                !state.redoStack.isEmpty(),
                state.undoStack.size(),
                state.redoStack.size()
        );
    }

    @GetMapping
    public EditorResponse getEditor(HttpSession session) {
        return response(getState(session));
    }

    @PostMapping("/change")
    public EditorResponse changeText(@RequestBody ChangeRequest request,
                                     HttpSession session) {
        EditorState state = getState(session);
        String newText = request.text() == null ? "" : request.text();

        if (!newText.equals(state.currentText)) {
            state.undoStack.push(state.currentText);
            state.currentText = newText;
            state.redoStack.clear();
        }
        return response(state);
    }

    @PostMapping("/undo")
    public EditorResponse undo(HttpSession session) {
        EditorState state = getState(session);
        if (!state.undoStack.isEmpty()) {
            state.redoStack.push(state.currentText);
            state.currentText = state.undoStack.pop();
        }
        return response(state);
    }

    @PostMapping("/redo")
    public EditorResponse redo(HttpSession session) {
        EditorState state = getState(session);
        if (!state.redoStack.isEmpty()) {
            state.undoStack.push(state.currentText);
            state.currentText = state.redoStack.pop();
        }
        return response(state);
    }

    @PostMapping("/clear")
    public EditorResponse clear(HttpSession session) {
        EditorState state = getState(session);
        if (!state.currentText.isEmpty()) {
            state.undoStack.push(state.currentText);
            state.currentText = "";
            state.redoStack.clear();
        }
        return response(state);
    }

    @GetMapping("/history")
    public HistoryResponse history(HttpSession session) {
        EditorState state = getState(session);
        return new HistoryResponse(
                state.undoStack.stream().toList(),
                state.redoStack.stream().toList()
        );
    }

    public record HistoryResponse(
            java.util.List<String> undoHistory,
            java.util.List<String> redoHistory
    ) {}
}
