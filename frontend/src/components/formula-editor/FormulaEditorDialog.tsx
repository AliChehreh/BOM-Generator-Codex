import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { FormulaEditor } from './FormulaEditor';
import { Suggestion } from './useFormulaEditor';

interface FormulaEditorDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (value: string) => void;
    initialValue: string;
    variables: Suggestion[];
    functions?: Suggestion[]; // Optional if we want to provide standard set
}

// Basic default functions for now - could be moved to a shared constant
const DEFAULT_FUNCTIONS: Suggestion[] = [
    { id: 'fn_sum', label: 'SUM', type: 'function', value: 'SUM', description: 'Returns the sum of values.', syntax: 'SUM(number1, [number2], ...)' },
    { id: 'fn_avg', label: 'AVERAGE', type: 'function', value: 'AVERAGE', description: 'Returns the average of values.', syntax: 'AVERAGE(number1, [number2], ...)' },
    { id: 'fn_if', label: 'IF', type: 'function', value: 'IF', description: 'Checks a condition.', syntax: 'IF(logical_test, value_if_true, value_if_false)' },
    { id: 'fn_min', label: 'MIN', type: 'function', value: 'MIN', description: 'Returns the minimum value.', syntax: 'MIN(number1, [number2], ...)' },
    { id: 'fn_max', label: 'MAX', type: 'function', value: 'MAX', description: 'Returns the maximum value.', syntax: 'MAX(number1, [number2], ...)' },
    { id: 'fn_concat', label: 'CONCAT', type: 'function', value: 'CONCAT', description: 'Combines text strings.', syntax: 'CONCAT(text1, [text2], ...)' },
    { id: 'fn_round', label: 'ROUND', type: 'function', value: 'ROUND', description: 'Rounds a number to a specified number of digits.', syntax: 'ROUND(number, num_digits)' },
    { id: 'fn_vlookup', label: 'VLOOKUP', type: 'function', value: 'VLOOKUP', description: 'Looks for a value in the leftmost column of a table.', syntax: 'VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])' },
];

export const FormulaEditorDialog: React.FC<FormulaEditorDialogProps> = ({
    open,
    onClose,
    onSave,
    initialValue,
    variables,
    functions = DEFAULT_FUNCTIONS
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [currentValue, setCurrentValue] = React.useState(initialValue);

    // Reset current value when dialog opens with new initialValue
    React.useEffect(() => {
        if (open) {
            setCurrentValue(initialValue);
        }
    }, [open, initialValue]);

    const handleSave = () => {
        onSave(currentValue);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen}
            aria-labelledby="formula-editor-dialog-title"
        >
            <DialogTitle id="formula-editor-dialog-title">Edit Formula</DialogTitle>
            <DialogContent dividers sx={{
                height: '60vh',
                display: 'flex',
                flexDirection: 'column',
                p: 0,
                // Override content styles to fit editor better
                '& .formula-editor-wrapper': {
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                },
                '& .formula-editor-container': {
                    flex: 1
                }
            }}>
                <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FormulaEditor
                        functions={functions}
                        variables={variables}
                        initialValue={initialValue}
                        onChange={setCurrentValue}
                        placeholder="Start typing your formula..."
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
};
