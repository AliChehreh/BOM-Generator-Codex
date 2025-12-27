from dataclasses import dataclass
from typing import Any


@dataclass
class Node:
    position: int


@dataclass
class Literal(Node):
    value: Any


@dataclass
class InputRef(Node):
    name: str


@dataclass
class ConfigRef(Node):
    field_name: str


@dataclass
class VariableRef(Node):
    name: str


@dataclass
class RowRef(Node):
    row_id: str
    field_name: str


@dataclass
class UnaryOp(Node):
    op: str
    operand: Node


@dataclass
class BinaryOp(Node):
    left: Node
    op: str
    right: Node


@dataclass
class FunctionCall(Node):
    name: str
    args: list[Node]


@dataclass
class ListLiteral(Node):
    items: list[Node]
