from app.schemas.formula import FormulaContext, FormulaInputs, VariableContext, LookupTableContext, LookupRowContext, LookupColumnContext
from app.services.formula import evaluate_formula
from app.services.formula.evaluator import EvaluationMeta
from app.models.enums import VariableType


def test_basic_formula_math_and_logic():
    context = FormulaContext(
        inputs=FormulaInputs(LS_L=10.0, LS_H=5.0, Order_Qty=2),
        config={"Width": 3},
        variables=[],
        rows={},
        lookup_tables=[],
    )
    meta = EvaluationMeta()
    assert evaluate_formula("LS_L + LS_H * 2", context, meta) == 20.0
    assert evaluate_formula("IF(LS_L > 5, 1, 0)", context, meta) == 1
    assert evaluate_formula("LS_L >= 10 AND LS_H < 6", context, meta) is True


def test_variable_dependencies():
    context = FormulaContext(
        inputs=FormulaInputs(LS_L=12.0),
        config={},
        variables=[
            VariableContext(name="A", type=VariableType.number, formula="LS_L * 2"),
            VariableContext(name="B", type=VariableType.number, formula="VAR.A + 1"),
        ],
        rows={},
        lookup_tables=[],
    )
    meta = EvaluationMeta()
    assert evaluate_formula("VAR.B", context, meta) == 25.0


def test_xlookup_exact_and_nearest():
    table = LookupTableContext(
        name="Sizes",
        columns=[LookupColumnContext(name="cost"), LookupColumnContext(name="weight")],
        rows=[
            LookupRowContext(list_size=10, values={"cost": 5, "weight": 1.2}),
            LookupRowContext(list_size=20, values={"cost": 9, "weight": 2.5}),
        ],
    )
    context = FormulaContext(
        inputs=FormulaInputs(),
        config={},
        variables=[],
        rows={},
        lookup_tables=[table],
    )
    meta = EvaluationMeta()
    assert evaluate_formula("XLOOKUP(20, Sizes, cost, EXACT)", context, meta) == 9
    assert evaluate_formula("XLOOKUP(12, Sizes, cost, NEAREST)", context, meta) == 5
    assert evaluate_formula("XLOOKUP(10, Sizes, [cost, weight], EXACT)", context, meta) == {
        "cost": 5,
        "weight": 1.2,
    }
