from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from app.models.enums import VariableType
from app.services.formula.ast_nodes import (
    BinaryOp,
    ConfigRef,
    FunctionCall,
    InputRef,
    ListLiteral,
    Literal,
    Node,
    RowRef,
    UnaryOp,
    VariableRef,
)
from app.services.formula.errors import FormulaError
from app.services.formula.parser import Parser


@dataclass
class VariableDefinition:
    name: str
    type: VariableType
    formula: Optional[str]
    value: Optional[Any]


@dataclass
class LookupTableData:
    name: str
    rows: list[dict[str, Any]]


@dataclass
class EvaluationMeta:
    build_family_id: Optional[UUID] = None
    row_id: Optional[str] = None
    field_name: Optional[str] = None
    variable_name: Optional[str] = None


class FormulaContextData:
    def __init__(
        self,
        inputs: dict[str, Any],
        config: dict[str, Any],
        variables: list[VariableDefinition],
        rows: dict[str, dict[str, Any]],
        lookup_tables: dict[str, LookupTableData],
    ) -> None:
        self.inputs = inputs
        self.config = config
        self.variable_defs = {var.name: var for var in variables}
        self.rows = rows
        self.lookup_tables = lookup_tables
        self._variable_cache: dict[str, Any] = {}
        self._variable_stack: set[str] = set()

    def resolve_variable(self, name: str, meta: EvaluationMeta) -> Any:
        if name in self._variable_cache:
            return self._variable_cache[name]
        if name in self._variable_stack:
            raise FormulaError(
                message=f"Circular variable reference: {name}",
                formula="",
                position=None,
                build_family_id=meta.build_family_id,
                row_id=meta.row_id,
                field_name=meta.field_name,
                variable_name=name,
            )
        var = self.variable_defs.get(name)
        if var is None:
            raise FormulaError(
                message=f"Unknown variable '{name}'",
                formula="",
                position=None,
                build_family_id=meta.build_family_id,
                row_id=meta.row_id,
                field_name=meta.field_name,
                variable_name=name,
            )
        if var.formula is None:
            value = var.value
        else:
            self._variable_stack.add(name)
            evaluator = FormulaEvaluator(self, meta, variable_name=name)
            value = evaluator.evaluate_formula(var.formula)
            self._variable_stack.remove(name)
        self._variable_cache[name] = value
        return value


class FormulaEvaluator:
    def __init__(self, context: FormulaContextData, meta: EvaluationMeta, variable_name: Optional[str] = None):
        self.context = context
        self.meta = meta
        if variable_name is not None:
            self.meta = EvaluationMeta(
                build_family_id=meta.build_family_id,
                row_id=meta.row_id,
                field_name=meta.field_name,
                variable_name=variable_name,
            )

    def evaluate_formula(self, formula: str) -> Any:
        try:
            node = Parser(formula).parse()
            return self.evaluate(node)
        except FormulaError as exc:
            if exc.formula == "":
                exc.formula = formula
            exc.build_family_id = exc.build_family_id or self.meta.build_family_id
            exc.row_id = exc.row_id or self.meta.row_id
            exc.field_name = exc.field_name or self.meta.field_name
            exc.variable_name = exc.variable_name or self.meta.variable_name
            raise

    def evaluate(self, node: Node) -> Any:
        if isinstance(node, Literal):
            return node.value
        if isinstance(node, InputRef):
            if node.name in self.context.inputs:
                return self.context.inputs[node.name]
            raise FormulaError(
                message=f"Unknown input '{node.name}'",
                formula="",
                position=node.position,
                build_family_id=self.meta.build_family_id,
                row_id=self.meta.row_id,
                field_name=self.meta.field_name,
                variable_name=self.meta.variable_name,
            )
        if isinstance(node, ConfigRef):
            if node.field_name in self.context.config:
                return self.context.config[node.field_name]
            raise FormulaError(
                message=f"Missing config field '{node.field_name}'",
                formula="",
                position=node.position,
                build_family_id=self.meta.build_family_id,
                row_id=self.meta.row_id,
                field_name=node.field_name,
                variable_name=self.meta.variable_name,
            )
        if isinstance(node, VariableRef):
            return self.context.resolve_variable(node.name, self.meta)
        if isinstance(node, RowRef):
            row = self.context.rows.get(node.row_id)
            if row is None:
                raise FormulaError(
                    message=f"Unknown row '{node.row_id}'",
                    formula="",
                    position=node.position,
                    build_family_id=self.meta.build_family_id,
                    row_id=node.row_id,
                    field_name=node.field_name,
                    variable_name=self.meta.variable_name,
                )
            if node.field_name not in row:
                raise FormulaError(
                    message=f"Missing field '{node.field_name}' in row '{node.row_id}'",
                    formula="",
                    position=node.position,
                    build_family_id=self.meta.build_family_id,
                    row_id=node.row_id,
                    field_name=node.field_name,
                    variable_name=self.meta.variable_name,
                )
            return row[node.field_name]
        if isinstance(node, ListLiteral):
            return [self.evaluate(item) for item in node.items]
        if isinstance(node, UnaryOp):
            return self._eval_unary(node)
        if isinstance(node, BinaryOp):
            return self._eval_binary(node)
        if isinstance(node, FunctionCall):
            return self._eval_function(node)
        raise FormulaError(
            message="Unsupported expression",
            formula="",
            position=node.position,
        )

    def _eval_unary(self, node: UnaryOp) -> Any:
        value = self.evaluate(node.operand)
        if node.op == "-":
            return -self._require_number(value, node.position)
        if node.op == "+":
            return self._require_number(value, node.position)
        if node.op == "NOT":
            return not self._require_boolean(value, node.position)
        raise FormulaError(
            message=f"Unknown unary operator '{node.op}'",
            formula="",
            position=node.position,
        )

    def _eval_binary(self, node: BinaryOp) -> Any:
        if node.op in ("AND", "OR"):
            left = self._require_boolean(self.evaluate(node.left), node.position)
            if node.op == "AND":
                return left and self._require_boolean(self.evaluate(node.right), node.position)
            return left or self._require_boolean(self.evaluate(node.right), node.position)
        left = self.evaluate(node.left)
        right = self.evaluate(node.right)
        if node.op in ("+", "-", "*", "/", "^"):
            left_num = self._require_number(left, node.position)
            right_num = self._require_number(right, node.position)
            if node.op == "+":
                return left_num + right_num
            if node.op == "-":
                return left_num - right_num
            if node.op == "*":
                return left_num * right_num
            if node.op == "/":
                if right_num == 0:
                    raise FormulaError(
                        message="Division by zero",
                        formula="",
                        position=node.position,
                    )
                return left_num / right_num
            if node.op == "^":
                return left_num**right_num
        if node.op in ("=", "<>", "<", ">", "<=", ">="):
            return self._compare_values(left, right, node.op)
        raise FormulaError(
            message=f"Unknown operator '{node.op}'",
            formula="",
            position=node.position,
        )

    def _eval_function(self, node: FunctionCall) -> Any:
        name = node.name.upper()
        if name == "IF":
            if len(node.args) != 3:
                raise FormulaError(
                    message="IF requires 3 arguments",
                    formula="",
                    position=node.position,
                )
            condition = self._require_boolean(self.evaluate(node.args[0]), node.position)
            if condition:
                return self.evaluate(node.args[1])
            return self.evaluate(node.args[2])
        if name == "AND":
            for arg in node.args:
                if not self._require_boolean(self.evaluate(arg), node.position):
                    return False
            return True
        if name == "OR":
            for arg in node.args:
                if self._require_boolean(self.evaluate(arg), node.position):
                    return True
            return False
        if name == "NOT":
            if len(node.args) != 1:
                raise FormulaError(
                    message="NOT requires 1 argument",
                    formula="",
                    position=node.position,
                )
            return not self._require_boolean(self.evaluate(node.args[0]), node.position)
        if name == "XLOOKUP":
            return self._eval_xlookup(node)
        raise FormulaError(
            message=f"Unknown function '{node.name}'",
            formula="",
            position=node.position,
        )

    def _eval_xlookup(self, node: FunctionCall) -> Any:
        if len(node.args) < 4:
            raise FormulaError(
                message="XLOOKUP requires 4 arguments",
                formula="",
                position=node.position,
            )
        value = self.evaluate(node.args[0])
        table_name = self._eval_identifier_like(node.args[1])
        return_fields = self._eval_identifier_like(node.args[2])
        match_mode = self._eval_identifier_like(node.args[3])

        if not isinstance(table_name, str):
            raise FormulaError(
                message="XLOOKUP table name must be text",
                formula="",
                position=node.position,
            )
        table = self.context.lookup_tables.get(table_name)
        if table is None:
            raise FormulaError(
                message=f"Lookup table '{table_name}' not found",
                formula="",
                position=node.position,
            )
        try:
            value_num = float(value)
        except (TypeError, ValueError):
            raise FormulaError(
                message="XLOOKUP value must be numeric",
                formula="",
                position=node.position,
            )

        match = str(match_mode).upper()
        if match not in ("EXACT", "NEAREST"):
            raise FormulaError(
                message="XLOOKUP match mode must be EXACT or NEAREST",
                formula="",
                position=node.position,
            )
        rows = table.rows
        if not rows:
            raise FormulaError(
                message=f"Lookup table '{table_name}' has no rows",
                formula="",
                position=node.position,
            )
        if match == "EXACT":
            row = next((r for r in rows if r["list_size"] == value_num), None)
            if row is None:
                raise FormulaError(
                    message="XLOOKUP exact match not found",
                    formula="",
                    position=node.position,
                )
        else:
            row = min(rows, key=lambda r: abs(r["list_size"] - value_num))

        return self._extract_lookup_return(row, return_fields, node.position)

    def _extract_lookup_return(self, row: dict[str, Any], return_fields: Any, position: int) -> Any:
        if isinstance(return_fields, list):
            values: dict[str, Any] = {}
            for field in return_fields:
                if not isinstance(field, str):
                    raise FormulaError(
                        message="XLOOKUP return fields must be text",
                        formula="",
                        position=position,
                    )
                if field not in row["values"]:
                    raise FormulaError(
                        message=f"XLOOKUP field '{field}' not found",
                        formula="",
                        position=position,
                    )
                values[field] = row["values"][field]
            return values
        if isinstance(return_fields, str):
            if return_fields in ("*", "ALL"):
                return row["values"]
            if return_fields not in row["values"]:
                raise FormulaError(
                    message=f"XLOOKUP field '{return_fields}' not found",
                    formula="",
                    position=position,
                )
            return row["values"][return_fields]
        raise FormulaError(
            message="XLOOKUP return field must be text or list",
            formula="",
            position=position,
        )

    def _eval_identifier_like(self, node: Node) -> Any:
        if isinstance(node, InputRef):
            if node.name in self.context.inputs:
                return self.context.inputs[node.name]
            return node.name
        if isinstance(node, ListLiteral):
            return [self._eval_identifier_like(item) for item in node.items]
        return self.evaluate(node)

    def _require_number(self, value: Any, position: int) -> float:
        if isinstance(value, bool) or value is None:
            raise FormulaError(
                message="Expected number",
                formula="",
                position=position,
            )
        try:
            return float(value)
        except (TypeError, ValueError):
            raise FormulaError(
                message="Expected number",
                formula="",
                position=position,
            )

    def _require_boolean(self, value: Any, position: int) -> bool:
        if isinstance(value, bool):
            return value
        raise FormulaError(
            message="Expected boolean",
            formula="",
            position=position,
        )

    def _compare_values(self, left: Any, right: Any, op: str) -> bool:
        if isinstance(left, (int, float, Decimal)) and isinstance(right, (int, float, Decimal)):
            if op == "=":
                return left == right
            if op == "<>":
                return left != right
            if op == "<":
                return left < right
            if op == ">":
                return left > right
            if op == "<=":
                return left <= right
            if op == ">=":
                return left >= right
        if op == "=":
            return left == right
        if op == "<>":
            return left != right
        if op == "<":
            return str(left) < str(right)
        if op == ">":
            return str(left) > str(right)
        if op == "<=":
            return str(left) <= str(right)
        if op == ">=":
            return str(left) >= str(right)
        raise FormulaError(
            message=f"Unknown comparison operator '{op}'",
            formula="",
            position=None,
        )
