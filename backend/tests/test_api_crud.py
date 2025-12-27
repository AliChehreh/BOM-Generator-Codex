
def test_config_values_crud(client):
    build_family = client.post(
        "/api/v1/build-families",
        json={"name": "Family A", "description": "Test"},
    ).json()

    field = client.post(
        f"/api/v1/build-families/{build_family['id']}/config-fields",
        json={
            "field_name": "Width",
            "field_type": "decimal",
            "enum_values": None,
            "is_required": True,
            "display_order": 1,
        },
    ).json()

    model_code = client.post(
        f"/api/v1/build-families/{build_family['id']}/model-codes",
        json={"model_code": "MC-1", "marketing_category_id": None, "manufacturing_department_id": None},
    ).json()

    values = client.put(
        f"/api/v1/model-codes/{model_code['id']}/config-values",
        json={"values": [{"field_id": field["id"], "value_json": 12.5}]},
    ).json()
    assert len(values) == 1

    validation = client.get(
        f"/api/v1/model-codes/{model_code['id']}/config-values/validate"
    ).json()
    assert validation["missing_required_fields"] == []


def test_lookup_table_crud(client):
    table = client.post(
        "/api/v1/lookup-tables",
        json={"name": "Sizes", "scope": "global", "build_family_id": None, "description": "Test"},
    ).json()

    columns_resp = client.put(
        f"/api/v1/lookup-tables/{table['id']}/columns",
        json={
            "columns": [
                {"column_name": "cost", "column_type": "number", "display_order": 1},
                {"column_name": "weight", "column_type": "number", "display_order": 2},
            ]
        },
    )
    assert columns_resp.status_code == 200

    rows = client.put(
        f"/api/v1/lookup-tables/{table['id']}/rows",
        json={
            "rows": [
                {"list_size": 10, "row_values_json": {"cost": 5, "weight": 1.2}},
                {"list_size": 20, "row_values_json": {"cost": 9, "weight": 2.5}},
            ]
        },
    ).json()
    assert rows[0]["list_size"] == 10


def test_variables_crud(client):
    build_family = client.post(
        "/api/v1/build-families",
        json={"name": "Family B", "description": None},
    ).json()

    variable = client.post(
        f"/api/v1/build-families/{build_family['id']}/variables",
        json={"name": "V1", "type": "number", "formula": "1+1", "display_order": 1},
    ).json()
    assert variable["name"] == "V1"

    updated = client.put(
        f"/api/v1/variables/{variable['id']}",
        json={"name": "V1", "type": "number", "formula": "2+2", "display_order": 2},
    ).json()
    assert updated["formula"] == "2+2"

    delete_resp = client.delete(f"/api/v1/variables/{variable['id']}")
    assert delete_resp.status_code == 204
