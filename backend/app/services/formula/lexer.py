from dataclasses import dataclass
from typing import Optional

from app.services.formula.errors import FormulaError


@dataclass
class Token:
    type: str
    value: Optional[object]
    position: int


OPERATORS = {"+", "-", "*", "/", "^", "=", "<>", "<", ">", "<=", ">="}


class Lexer:
    def __init__(self, text: str):
        self.text = text
        self.index = 0
        self.length = len(text)

    def _current(self) -> str:
        return self.text[self.index]

    def _advance(self) -> None:
        self.index += 1

    def _peek(self) -> str:
        if self.index + 1 >= self.length:
            return ""
        return self.text[self.index + 1]

    def tokenize(self) -> list[Token]:
        tokens: list[Token] = []
        while self.index < self.length:
            char = self._current()
            if char.isspace():
                self._advance()
                continue
            if char.isdigit() or (char == "." and self._peek().isdigit()):
                tokens.append(self._read_number())
                continue
            if char.isalpha() or char == "_":
                tokens.append(self._read_identifier())
                continue
            if char in ("\"", "'"):
                tokens.append(self._read_string())
                continue
            if char == ",":
                tokens.append(Token("COMMA", ",", self.index))
                self._advance()
                continue
            if char == "(":
                tokens.append(Token("LPAREN", "(", self.index))
                self._advance()
                continue
            if char == ")":
                tokens.append(Token("RPAREN", ")", self.index))
                self._advance()
                continue
            if char == ".":
                tokens.append(Token("DOT", ".", self.index))
                self._advance()
                continue
            if char == "[":
                tokens.append(Token("LBRACKET", "[", self.index))
                self._advance()
                continue
            if char == "]":
                tokens.append(Token("RBRACKET", "]", self.index))
                self._advance()
                continue
            if char in ("<", ">"):
                tokens.append(self._read_comparison())
                continue
            if char in ("+", "-", "*", "/", "^", "="):
                tokens.append(Token("OP", char, self.index))
                self._advance()
                continue
            raise FormulaError(
                message=f"Unexpected character '{char}'",
                formula=self.text,
                position=self.index,
            )
        tokens.append(Token("EOF", None, self.index))
        return tokens

    def _read_number(self) -> Token:
        start = self.index
        has_dot = False
        while self.index < self.length:
            char = self._current()
            if char == ".":
                if has_dot:
                    break
                has_dot = True
                self._advance()
                continue
            if not char.isdigit():
                break
            self._advance()
        value = float(self.text[start:self.index])
        return Token("NUMBER", value, start)

    def _read_identifier(self) -> Token:
        start = self.index
        while self.index < self.length:
            char = self._current()
            if not (char.isalnum() or char == "_"):
                break
            self._advance()
        value = self.text[start:self.index]
        return Token("IDENT", value, start)

    def _read_string(self) -> Token:
        quote = self._current()
        start = self.index
        self._advance()
        chars = []
        while self.index < self.length:
            char = self._current()
            if char == "\\":
                self._advance()
                if self.index < self.length:
                    chars.append(self._current())
                    self._advance()
                continue
            if char == quote:
                self._advance()
                return Token("STRING", "".join(chars), start)
            chars.append(char)
            self._advance()
        raise FormulaError(
            message="Unterminated string literal",
            formula=self.text,
            position=start,
        )

    def _read_comparison(self) -> Token:
        start = self.index
        char = self._current()
        next_char = self._peek()
        if char == "<" and next_char == ">":
            self._advance()
            self._advance()
            return Token("OP", "<>", start)
        if char == "<" and next_char == "=":
            self._advance()
            self._advance()
            return Token("OP", "<=", start)
        if char == ">" and next_char == "=":
            self._advance()
            self._advance()
            return Token("OP", ">=", start)
        self._advance()
        return Token("OP", char, start)
