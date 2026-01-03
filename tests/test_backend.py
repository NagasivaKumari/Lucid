def test_read_config(client):
    response = client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    assert "app_id" in data
    assert "algod_url" in data
    assert "genesis_id" in data
