"""phase1 foundation

Revision ID: 0001_phase1_foundation
Revises: None
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "0001_phase1_foundation"
down_revision = None
branch_labels = None
depends_on = None


config_field_type = sa.Enum(
    "boolean",
    "int",
    "decimal",
    "text",
    "enum",
    name="config_field_type",
)
lookup_table_scope = sa.Enum("global", "build_family", name="lookup_table_scope")
lookup_column_type = sa.Enum(
    "number",
    "boolean",
    "text",
    "component_bundle_marker",
    name="lookup_column_type",
)
variable_type = sa.Enum("boolean", "number", "text", name="variable_type")


def upgrade():
    op.create_table(
        "build_families",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False, unique=True),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "marketing_categories",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False, unique=True),
    )

    op.create_table(
        "manufacturing_departments",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False, unique=True),
    )

    op.create_table(
        "model_codes",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("build_family_id", sa.Uuid(), sa.ForeignKey("build_families.id"), nullable=False),
        sa.Column("model_code", sa.String(length=100), nullable=False),
        sa.Column("marketing_category_id", sa.Uuid(), sa.ForeignKey("marketing_categories.id")),
        sa.Column(
            "manufacturing_department_id",
            sa.Uuid(),
            sa.ForeignKey("manufacturing_departments.id"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("build_family_id", "model_code", name="uq_model_code_family"),
    )

    op.create_table(
        "model_code_config_fields",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("build_family_id", sa.Uuid(), sa.ForeignKey("build_families.id"), nullable=False),
        sa.Column("field_name", sa.String(length=200), nullable=False),
        sa.Column("field_type", config_field_type, nullable=False),
        sa.Column("enum_values", sa.JSON(), nullable=True),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("build_family_id", "field_name", name="uq_config_field_family"),
    )

    op.create_table(
        "model_code_config_values",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("model_code_id", sa.Uuid(), sa.ForeignKey("model_codes.id"), nullable=False),
        sa.Column("field_id", sa.Uuid(), sa.ForeignKey("model_code_config_fields.id"), nullable=False),
        sa.Column("value_json", sa.JSON(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("model_code_id", "field_id", name="uq_config_value_model_field"),
    )

    op.create_table(
        "lookup_tables",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("scope", lookup_table_scope, nullable=False),
        sa.Column("build_family_id", sa.Uuid(), sa.ForeignKey("build_families.id")),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("scope", "build_family_id", "name", name="uq_lookup_table_scope_name"),
    )

    op.create_table(
        "lookup_table_columns",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("lookup_table_id", sa.Uuid(), sa.ForeignKey("lookup_tables.id"), nullable=False),
        sa.Column("column_name", sa.String(length=200), nullable=False),
        sa.Column("column_type", lookup_column_type, nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("lookup_table_id", "column_name", name="uq_lookup_column_table_name"),
    )

    op.create_table(
        "lookup_table_rows",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("lookup_table_id", sa.Uuid(), sa.ForeignKey("lookup_tables.id"), nullable=False),
        sa.Column("list_size", sa.Numeric(18, 3), nullable=False),
        sa.Column("row_values_json", sa.JSON(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("lookup_table_id", "list_size", name="uq_lookup_row_size"),
    )

    op.create_table(
        "variables",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("build_family_id", sa.Uuid(), sa.ForeignKey("build_families.id"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("type", variable_type, nullable=False),
        sa.Column("formula", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("build_family_id", "name", name="uq_variable_family_name"),
    )

    op.create_table(
        "bom_template_rows",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("build_family_id", sa.Uuid(), sa.ForeignKey("build_families.id"), nullable=False),
        sa.Column("row_id", sa.String(length=100), nullable=False),
        sa.Column("level_type", sa.String(length=100), nullable=True),
        sa.Column("component_no", sa.String(length=100), nullable=True),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("uom_code", sa.String(length=50), nullable=True),
        sa.Column("nest_level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("f_qty_per_product", sa.Text(), nullable=True),
        sa.Column("f_qty", sa.Text(), nullable=True),
        sa.Column("f_size_per_unit", sa.Text(), nullable=True),
        sa.Column("f_qty_per_assembly", sa.Text(), nullable=True),
        sa.Column("f_unit_cost", sa.Text(), nullable=True),
        sa.Column("f_price_per_product", sa.Text(), nullable=True),
        sa.Column("f_extended_price", sa.Text(), nullable=True),
        sa.UniqueConstraint("build_family_id", "row_id", name="uq_bom_row_family"),
    )

    op.execute(
        """
        INSERT INTO marketing_categories (id, name) VALUES
        (NEWID(), 'Supply'),
        (NEWID(), 'Return'),
        (NEWID(), 'Curved Blade'),
        (NEWID(), 'Non-vision'),
        (NEWID(), 'Filter grille'),
        (NEWID(), 'Bar Linear'),
        (NEWID(), 'Slot Linear'),
        (NEWID(), 'Louvers'),
        (NEWID(), 'Industrial'),
        (NEWID(), 'Eggcrate'),
        (NEWID(), 'Accessories');
        """
    )

    op.execute(
        """
        INSERT INTO manufacturing_departments (id, name) VALUES
        (NEWID(), 'Supply & Return'),
        (NEWID(), 'Filter grille'),
        (NEWID(), 'Barlinear'),
        (NEWID(), 'Slot linear'),
        (NEWID(), 'Louver'),
        (NEWID(), 'Industrial');
        """
    )


def downgrade():
    op.drop_table("bom_template_rows")
    op.drop_table("variables")
    op.drop_table("lookup_table_rows")
    op.drop_table("lookup_table_columns")
    op.drop_table("lookup_tables")
    op.drop_table("model_code_config_values")
    op.drop_table("model_code_config_fields")
    op.drop_table("model_codes")
    op.drop_table("manufacturing_departments")
    op.drop_table("marketing_categories")
    op.drop_table("build_families")
    variable_type.drop(op.get_bind(), checkfirst=True)
    lookup_column_type.drop(op.get_bind(), checkfirst=True)
    lookup_table_scope.drop(op.get_bind(), checkfirst=True)
    config_field_type.drop(op.get_bind(), checkfirst=True)
