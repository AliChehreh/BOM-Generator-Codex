import React, { useState } from 'react';
import { FormulaEditor } from '../components/formula-editor/FormulaEditor';
import { Suggestion } from '../components/formula-editor/useFormulaEditor';
import { Box, Typography, Paper } from '@mui/material';

const MOCK_FUNCTIONS: Suggestion[] = [
    { id: '1', label: 'SUM', type: 'function', value: 'SUM', syntax: 'value1, [value2], ...', description: 'Calculates the sum of values.' },
    { id: '2', label: 'AVERAGE', type: 'function', value: 'AVERAGE', syntax: 'value1, [value2], ...', description: 'Calculates the average of values.' },
    { id: '3', label: 'IF', type: 'function', value: 'IF', syntax: 'condition, true_value, false_value', description: 'Returns one value if true, another if false.' },
    { id: '4', label: 'CONCAT', type: 'function', value: 'CONCAT', syntax: 'text1, [text2], ...', description: 'Joins text strings.' },
];

const MOCK_VARIABLES: Suggestion[] = [
    { id: '101', label: 'TotalCost', type: 'variable', value: '@TotalCost' },
    { id: '102', label: 'Quantity', type: 'variable', value: '@Quantity' },
    { id: '103', label: 'UnitPrice', type: 'variable', value: '@UnitPrice' },
    { id: '104', label: 'Discount', type: 'variable', value: '@Discount' },
];

const FormulaTestPage: React.FC = () => {
    const [formula, setFormula] = useState('');

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>Formula Editor Test</Typography>
            <Paper sx={{ p: 3, maxWidth: 800 }}>
                <Typography variant="body1" gutterBottom>
                    Try typing functions like <code>SUM</code> or <code>IF</code>, or use <code>@</code> to trigger variables.
                </Typography>

                <Box sx={{ my: 2 }}>
                    <FormulaEditor
                        functions={MOCK_FUNCTIONS}
                        variables={MOCK_VARIABLES}
                        onChange={setFormula}
                        placeholder="Type your formula here..."
                    />
                </Box>

                <Typography variant="h6" sx={{ mt: 3 }}>Current Value:</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
                    {formula}
                </Paper>
            </Paper>
        </Box>
    );
};

export default FormulaTestPage;
