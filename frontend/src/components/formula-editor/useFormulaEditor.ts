import { useState, useRef, useEffect, useCallback } from 'react';

export interface Suggestion {
    id: string;
    label: string;
    type: 'function' | 'variable';
    value: string;
    description?: string;
    syntax?: string;
}

interface UseFormulaEditorProps {
    functions: Suggestion[];
    variables: Suggestion[];
    onChange?: (value: string) => void;
}

export const useFormulaEditor = ({ functions, variables, onChange }: UseFormulaEditorProps) => {
    const [content, setContent] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [activeFunction, setActiveFunction] = useState<Suggestion | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const savedRange = useRef<Range | null>(null);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            // Ensure the range is actually inside our editor
            if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
                savedRange.current = range.cloneRange();
            }
        }
    };

    // Helper to get cursor position relative to text content
    const getCaretIndex = (element: HTMLElement) => {
        let position = 0;
        const isSupported = typeof window.getSelection !== "undefined";
        if (isSupported) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount !== 0) {
                const range = window.getSelection()?.getRangeAt(0);
                const preCaretRange = range?.cloneRange();
                preCaretRange?.selectNodeContents(element);
                preCaretRange?.setEnd(range!.endContainer, range!.endOffset);
                position = preCaretRange?.toString().length || 0;
            }
        }
        return position;
    };

    // Helper to extract clean value (chip values + text)
    const getValueFromEditor = (element: HTMLElement) => {
        let value = '';
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                value += node.textContent || '';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.dataset.value) {
                    value += el.dataset.value;
                } else if (el.tagName === 'BR') {
                    // Ignore or handle newlines if needed
                } else {
                    // Recurse or just take text content? 
                    // For simple bold/spans without dataset, take text
                    value += el.innerText;
                }
            }
        });
        return value;
    };

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        if (!editorRef.current) return;
        saveSelection();

        const html = editorRef.current.innerHTML;
        setContent(html); // We still keep HTML state for contentEditable display

        const cleanValue = getValueFromEditor(editorRef.current);
        if (onChange) onChange(cleanValue);

        const pos = getCaretIndex(editorRef.current);
        setCursorPosition(pos);

        // Check for trigger characters or typing words
        const text = editorRef.current.innerText;
        const lastWordRegex = /[@a-zA-Z0-9_]+$/;
        const textBeforeCaret = text.substring(0, pos);
        const match = textBeforeCaret.match(lastWordRegex);

        if (match) {
            const query = match[0];
            const normalizedQuery = query.toLowerCase().replace('@', '');

            const filteredFunctions = functions.filter(f => f.label.toLowerCase().startsWith(normalizedQuery));
            const filteredVariables = variables.filter(v => v.label.toLowerCase().includes(normalizedQuery));


            const combined = [...filteredFunctions, ...filteredVariables];
            if (combined.length > 0) {
                setSuggestions(combined);
                setShowSuggestions(true);
                setSuggestionIndex(0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }

        // Detect active function
        // Need to use text content for regex matching, not HTML
        // editorRef.current.innerText gives us text with likely newlines
        // We need a robust way. For now, innerText is fine.
        const textForDetection = editorRef.current.innerText;

        const textUpToCursor = textForDetection.substring(0, pos);
        // Regex to find a word followed by (
        const funcMatch = [...textUpToCursor.matchAll(/([a-zA-Z0-9_]+)\(/g)];

        if (funcMatch.length > 0) {
            const lastMatch = funcMatch[funcMatch.length - 1];
            const startOfFuncArgs = lastMatch.index! + lastMatch[0].length;
            const argsSegment = textUpToCursor.substring(startOfFuncArgs);

            let openCount = 0;
            for (let char of argsSegment) {
                if (char === '(') openCount++;
                if (char === ')') openCount--;
            }

            if (openCount >= 0) {
                const funcName = lastMatch[1];
                const foundFunc = functions.find(f => f.label === funcName);
                setActiveFunction(foundFunc || null);
            } else {
                setActiveFunction(null);
            }
        } else {
            setActiveFunction(null);
        }
    }, [functions, variables, onChange]);

    const insertSuggestion = (suggestion: Suggestion) => {
        if (!editorRef.current) return;

        // Try to use current selection, fallback to saved range
        let range: Range | null = null;
        const sel = window.getSelection();

        if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
            range = sel.getRangeAt(0);
        } else if (savedRange.current) {
            range = savedRange.current;
        }

        if (!range) {
            // Fallback: append to end if no range found
            editorRef.current.focus();
            // Maybe create a range at the end
            range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
        }

        // Restore selection to this range before operations
        sel?.removeAllRanges();
        sel?.addRange(range);

        // We need to find the trigger word before the caret to replace it.
        // This is harder with HTML nodes. 
        // For simplicity in this demo, if using the picker, we just insert at cursor.
        // If triggering via typing '@', we should try to replace the text node content.

        let nodeToInsert: Node;

        if (suggestion.type === 'variable') {
            const span = document.createElement('span');
            span.className = 'formula-token-variable';
            span.contentEditable = 'false';
            span.innerText = suggestion.value.replace('@', ''); // Show label without @ usually, or keep it
            // Or better, use label
            span.innerText = suggestion.label;
            span.dataset.value = suggestion.value;

            // Add a space after
            nodeToInsert = span;
        } else {
            const text = suggestion.value + '(';
            nodeToInsert = document.createTextNode(text);
        }

        // Check if we are replacing a trigger word
        const text = editorRef.current.innerText;
        // This logic is tricky with DOM nodes. 
        // A simple approach for "Power Automate" style is often just "insert at cursor" 
        // and rely on user to delete the "@" if they typed it, OR simplistic replacement.

        // Let's go with: delete the characters that matched the query from the current text node if possible
        // But for robust implementation, let's just insert at cursor for now (Picker interaction)
        // If it came from autocomplete, we might want to delete the typed prefix.

        // If suggestionIndex is valid and we are showing suggestions, it implies we matched something.
        // We can try to delete back N chars.

        // Basic insertion at range:
        range.deleteContents();
        range.insertNode(nodeToInsert);

        // Move caret after
        range.setStartAfter(nodeToInsert);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);

        // If variable, maybe add a space after automatically
        if (suggestion.type === 'variable') {
            const space = document.createTextNode('\u00A0');
            range.insertNode(space);
            range.setStartAfter(space);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }

        // Trigger change
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
            const cleanValue = getValueFromEditor(editorRef.current);
            if (onChange) onChange(cleanValue);
        }

        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertSuggestion(suggestions[suggestionIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    const handleKeyUp = () => saveSelection();
    const handleMouseUp = () => saveSelection();
    const handleBlur = () => saveSelection();

    return {
        content,
        editorRef,
        handleInput,
        handleKeyDown,
        handleKeyUp,
        handleMouseUp,
        handleBlur,
        suggestions,
        showSuggestions,
        suggestionIndex,
        insertSuggestion,
        activeFunction
    };
};
