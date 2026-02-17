"""
Quick test: call the Python AI Recipe Engine search endpoint.
Run while the API is running (python api.py). Usage: python test_agent_request.py [base_url]
First search can take 1-2 min on CPU (T5 generation). Wait for it.
"""
import sys
import json
import urllib.request
import urllib.error

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"


def test_health():
    print("1. Testing GET /health ...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/health", method="GET")
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode())
            print(f"   OK: {data}")
            return data.get("engine_loaded") is True
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


def test_search(query="seed", max_results=5):
    print(f"2. Testing POST /api/recipes/search query={query!r} max_results={max_results} ...")
    try:
        body = json.dumps({
            "query": query,
            "max_results": max_results,
            "generate_if_no_match": True,
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/recipes/search",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=120) as r:
            data = json.loads(r.read().decode())
            total = data.get("total_results", 0)
            results = data.get("results") or []
            types = [r.get("type") for r in results[:5]]
            print(f"   OK: total_results={total}, query_type={data.get('query_type')!r}")
            print(f"   First result types: {types}")
            if results:
                first = results[0].get("recipe", {})
                print(f"   First recipe title: {first.get('title') or first.get('name')}")
            return total > 0
    except urllib.error.HTTPError as e:
        print(f"   HTTP FAIL: {e.code} {e.reason}")
        try:
            body = e.read().decode()
            print(f"   Body: {body[:300]}")
        except Exception:
            pass
        return False
    except Exception as e:
        print(f"   FAIL: {e}")
        return False


if __name__ == "__main__":
    print(f"Base URL: {BASE_URL}\n")
    ok_health = test_health()
    print()
    ok_search = test_search()
    print()
    if ok_health and ok_search:
        print("Agent is working. Node backend should use it (check AI_RECIPE_ENGINE_URL).")
    else:
        print("Agent test failed. Fix the Python engine or connection.")
