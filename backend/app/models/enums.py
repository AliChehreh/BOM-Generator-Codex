from enum import Enum


class ConfigFieldType(str, Enum):
    boolean = "boolean"
    integer = "int"
    decimal = "decimal"
    text = "text"
    enum = "enum"


class LookupTableScope(str, Enum):
    global_scope = "global"
    build_family = "build_family"


class LookupColumnType(str, Enum):
    number = "number"
    boolean = "boolean"
    text = "text"
    component_bundle_marker = "component_bundle_marker"


class VariableType(str, Enum):
    boolean = "boolean"
    number = "number"
    text = "text"
