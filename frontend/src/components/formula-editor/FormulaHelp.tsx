import React from 'react';
import { Suggestion } from './useFormulaEditor';
import './styles.css';

interface FormulaHelpProps {
    functionDef: Suggestion;
    activeArgumentIndex?: number;
}

export const FormulaHelp: React.FC<FormulaHelpProps> = ({ functionDef, activeArgumentIndex = 0 }) => {
    return (
        <div className="formula-help-tooltip">
            <div className="function-signature">
                <span className="function-name">{functionDef.label}</span>
                <span className="function-syntax">({functionDef.syntax || '...'})</span>
            </div>
            {functionDef.description && (
                <div className="function-description">{functionDef.description}</div>
            )}
        </div>
    );
};
