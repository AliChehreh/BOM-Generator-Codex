from typing import Optional

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
from app.services.formula.lexer import Lexer, Token


class Parser:
    def __init__(self, text: str):
        self.text = text
        self.tokens = Lexer(text).tokenize()
        self.index = 0

    def _current(self) -> Token:
        return self.tokens[self.index]

    def _advance(self) -> Token:
        token = self.tokens[self.index]
        self.index += 1
        return token

    def _match(self, token_type: str, value: Optional[str] = None) -> bool:
        token = self._current()
        if token.type != token_type:
            return False
        if value is not None and token.value != value:
            return False
        return True

    def _match_ident(self, value: str) -> bool:
        token = self._current()
        return token.type == "IDENT" and token.value.upper() == value.upper()

    def _expect(self, token_type: str, value: Optional[str] = None) -> Token:
        token = self._current()
        if token.type != token_type or (value is not None and token.value != value):
            raise FormulaError(
                message=f"Expected {token_type}",
                formula=self.text,
                position=token.position,
            )
        self._advance()
        return token

    def parse(self) -> Node:
        expr = self._parse_or()
        if self._current().type != "EOF":
            token = self._current()
            raise FormulaError(
                message="Unexpected token",
                formula=self.text,
                position=token.position,
            )
        return expr

    def _parse_or(self) -> Node:
        left = self._parse_and()
        while self._match_ident("OR"):
            token = self._advance()
            right = self._parse_and()
            left = BinaryOp(position=token.position, left=left, op="OR", right=right)
        return left

    def _parse_and(self) -> Node:
        left = self._parse_not()
        while self._match_ident("AND"):
            token = self._advance()
            right = self._parse_not()
            left = BinaryOp(position=token.position, left=left, op="AND", right=right)
        return left

    def _parse_not(self) -> Node:
        if self._match_ident("NOT"):
            token = self._advance()
            operand = self._parse_not()
            return UnaryOp(position=token.position, op="NOT", operand=operand)
        return self._parse_comparison()

    def _parse_comparison(self) -> Node:
        left = self._parse_add()
        while self._current().type == "OP" and self._current().value in (
            "=",
            "<>",
            "<",
            ">",
            "<=",
            ">=",
        ):
            token = self._advance()
            right = self._parse_add()
            left = BinaryOp(position=token.position, left=left, op=token.value, right=right)
        return left

    def _parse_add(self) -> Node:
        left = self._parse_mul()
        while self._current().type == "OP" and self._current().value in ("+", "-"):
            token = self._advance()
            right = self._parse_mul()
            left = BinaryOp(position=token.position, left=left, op=token.value, right=right)
        return left

    def _parse_mul(self) -> Node:
        left = self._parse_power()
        while self._current().type == "OP" and self._current().value in ("*", "/"):
            token = self._advance()
            right = self._parse_power()
            left = BinaryOp(position=token.position, left=left, op=token.value, right=right)
        return left

    def _parse_power(self) -> Node:
        left = self._parse_unary()
        if self._current().type == "OP" and self._current().value == "^":
            token = self._advance()
            right = self._parse_power()
            return BinaryOp(position=token.position, left=left, op="^", right=right)
        return left

    def _parse_unary(self) -> Node:
        if self._current().type == "OP" and self._current().value in ("+", "-"):
            token = self._advance()
            operand = self._parse_unary()
            return UnaryOp(position=token.position, op=token.value, operand=operand)
        return self._parse_primary()

    def _parse_primary(self) -> Node:
        token = self._current()
        if token.type == "NUMBER":
            self._advance()
            return Literal(position=token.position, value=token.value)
        if token.type == "STRING":
            self._advance()
            return Literal(position=token.position, value=token.value)
        if token.type == "IDENT":
            return self._parse_identifier()
        if token.type == "LPAREN":
            self._advance()
            expr = self._parse_or()
            self._expect("RPAREN")
            return expr
        if token.type == "LBRACKET":
            return self._parse_list()
        raise FormulaError(
            message="Unexpected token",
            formula=self.text,
            position=token.position,
        )

    def _parse_list(self) -> Node:
        start = self._expect("LBRACKET")
        items: list[Node] = []
        if self._current().type != "RBRACKET":
            while True:
                items.append(self._parse_or())
                if self._current().type == "COMMA":
                    self._advance()
                    continue
                break
        self._expect("RBRACKET")
        return ListLiteral(position=start.position, items=items)

    def _parse_identifier(self) -> Node:
        token = self._expect("IDENT")
        ident = token.value
        ident_upper = ident.upper()

        if ident_upper in ("TRUE", "FALSE"):
            return Literal(position=token.position, value=ident_upper == "TRUE")

        if ident_upper == "ROW" and self._current().type == "LPAREN":
            return self._parse_row_ref(token)

        if self._current().type == "DOT":
            self._advance()
            next_token = self._expect("IDENT")
            if ident_upper == "CFG":
                return ConfigRef(position=token.position, field_name=next_token.value)
            if ident_upper == "VAR":
                return VariableRef(position=token.position, name=next_token.value)
            return InputRef(position=token.position, name=f"{ident}.{next_token.value}")

        if self._current().type == "LPAREN":
            return self._parse_function_call(ident, token.position)

        return InputRef(position=token.position, name=ident)

    def _parse_function_call(self, name: str, position: int) -> Node:
        self._expect("LPAREN")
        args: list[Node] = []
        if self._current().type != "RPAREN":
            while True:
                args.append(self._parse_or())
                if self._current().type == "COMMA":
                    self._advance()
                    continue
                break
        self._expect("RPAREN")
        return FunctionCall(position=position, name=name, args=args)

    def _parse_row_ref(self, token: Token) -> Node:
        self._expect("LPAREN")
        row_token = self._current()
        if row_token.type == "IDENT":
            row_id = row_token.value
            self._advance()
        elif row_token.type == "STRING":
            row_id = row_token.value
            self._advance()
        else:
            raise FormulaError(
                message="Expected row id",
                formula=self.text,
                position=row_token.position,
            )
        self._expect("RPAREN")
        self._expect("DOT")
        field_token = self._expect("IDENT")
        return RowRef(position=token.position, row_id=row_id, field_name=field_token.value)
