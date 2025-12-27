import React, { } from 'react';
import { useFormulaEditor, Suggestion } from './useFormulaEditor';
import { FormulaSuggestions } from './FormulaSuggestions';
import { FormulaHelp } from './FormulaHelp';
import { FormulaPicker } from './FormulaPicker';
import './styles.css';

interface FormulaEditorProps {
    functions: Suggestion[];
    variables: Suggestion[];
    initialValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
    functions,
    variables,
    initialValue = '',
    onChange,
    placeholder = 'Enter formula or select from dynamic content...'
}) => {
    const {
        content,
        editorRef,
        handleInput,
        handleKeyDown,
        suggestions,
        showSuggestions,
        suggestionIndex,
        insertSuggestion,
        activeFunction
    } = useFormulaEditor({ functions, variables, onChange });

    return (
        <div className="formula-editor-wrapper">
            <div className="formula-editor-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontSize: '12px',
                    color: '#605e5c'
                }}
            >
                <span>Fx Formula</span>
            </div>
            <div className="formula-editor-container">
                <div className="formula-fx-label" style={{
                    marginRight: 8,
                    color: '#605e5c',
                    fontWeight: 600,
                    userSelect: 'none'
                }}>fx</div>
                <div
                    ref={editorRef}
                    className="formula-editor-input"
                    contentEditable
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    data-placeholder={placeholder}
                >
                </div>

                {showSuggestions && (
                    <FormulaSuggestions
                        suggestions={suggestions}
                        activeIndex={suggestionIndex}
                        onSelect={insertSuggestion}
                        position={{ top: 30, left: 10 }}
                    />
                )}

                {activeFunction && (
                    <FormulaHelp functionDef={activeFunction} />
                )}
            </div>

            <div className="formula-picker-container" style={{ display: 'flex', gap: 16 }}>
                {/* We could make this collapsible or separate, but for the requirement "reusable formula edit" 
                    showing it alongside is very "Power Automate" */}
                <FormulaPicker
                    variables={variables}
                    functions={functions}
                    onInsert={insertSuggestion}
                />
            </div>
        </div>
    );
};
