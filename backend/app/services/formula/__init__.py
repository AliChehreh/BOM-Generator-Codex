from app.services.formula.evaluator import (
    EvaluationMeta,
    FormulaContextData,
    FormulaEvaluator,
    LookupTableData,
    VariableDefinition,
)
from app.schemas.formula import FormulaContext


def build_context(context: FormulaContext) -> FormulaContextData:
    inputs = context.inputs.model_dump()
    config = context.config
    variables = [
        VariableDefinition(
            name=var.name,
            type=var.type,
            formula=var.formula,
            value=var.value,
        )
        for var in context.variables
    ]
    rows = context.rows
    lookup_tables = {}
    for table in context.lookup_tables:
        sorted_rows = sorted(table.rows, key=lambda row: row.list_size)
        lookup_tables[table.name] = LookupTableData(
            name=table.name,
            rows=[{"list_size": row.list_size, "values": row.values} for row in sorted_rows],
        )
    return FormulaContextData(
        inputs=inputs,
        config=config,
        variables=variables,
        rows=rows,
        lookup_tables=lookup_tables,
    )


def evaluate_formula(formula: str, context: FormulaContext, meta: EvaluationMeta):
    ctx = build_context(context)
    evaluator = FormulaEvaluator(ctx, meta)
    return evaluator.evaluate_formula(formula)
