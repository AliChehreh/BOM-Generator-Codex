import React, { useState } from 'react';
import { Suggestion } from './useFormulaEditor';
import './styles.css';

interface FormulaPickerProps {
    variables: Suggestion[];
    functions: Suggestion[];
    onInsert: (item: Suggestion) => void;
}

export const FormulaPicker: React.FC<FormulaPickerProps> = ({
    variables,
    functions,
    onInsert
}) => {
    const [activeTab, setActiveTab] = useState<'dynamic' | 'expression'>('dynamic');
    const [searchText, setSearchText] = useState('');

    const filteredVariables = variables.filter(v =>
        v.label.toLowerCase().includes(searchText.toLowerCase())
    );

    const filteredFunctions = functions.filter(f =>
        f.label.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="formula-picker">
            <div className="picker-tabs">
                <button
                    className={`picker-tab ${activeTab === 'dynamic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dynamic')}
                >
                    Dynamic Content
                </button>
                <button
                    className={`picker-tab ${activeTab === 'expression' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expression')}
                >
                    Expression
                </button>
            </div>

            <div className="picker-search">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            <div className="picker-content">
                {activeTab === 'dynamic' && (
                    <div className="picker-list">
                        {filteredVariables.map(v => (
                            <div
                                key={v.id}
                                className="picker-item variable"
                                onClick={() => onInsert(v)}
                            >
                                <div className="picker-item-icon">⚡</div>
                                <div className="picker-item-details">
                                    <div className="picker-item-label">{v.label}</div>
                                    <div className="picker-item-desc">Variable</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'expression' && (
                    <div className="picker-list">
                        {filteredFunctions.map(f => (
                            <div
                                key={f.id}
                                className="picker-item function"
                                onClick={() => onInsert(f)}
                            >
                                <div className="picker-item-icon">fx</div>
                                <div className="picker-item-details">
                                    <div className="picker-item-label">{f.label}</div>
                                    <div className="picker-item-desc">{f.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
