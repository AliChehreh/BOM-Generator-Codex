import React from 'react';
import { Suggestion } from './useFormulaEditor';
import './styles.css';

interface FormulaSuggestionsProps {
    suggestions: Suggestion[];
    activeIndex: number;
    onSelect: (suggestion: Suggestion) => void;
    position?: { top: number; left: number };
}

export const FormulaSuggestions: React.FC<FormulaSuggestionsProps> = ({
    suggestions,
    activeIndex,
    onSelect,
    position
}) => {
    if (suggestions.length === 0) return null;

    return (
        <div
            className="formula-suggestions"
            style={position ? { top: position.top, left: position.left } : {}}
        >
            {suggestions.map((suggestion, index) => (
                <div
                    key={suggestion.id}
                    className={`suggestion-item ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => onSelect(suggestion)}
                >
                    <span className="suggestion-label">{suggestion.label}</span>
                    <span className="suggestion-type">{suggestion.type}</span>
                </div>
            ))}
        </div>
    );
};
