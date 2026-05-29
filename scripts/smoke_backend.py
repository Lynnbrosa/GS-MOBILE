"""
Smoke test que valida o contrato REST que o app mobile consome.
Reproduz as chamadas que o mobile faz (src/services/auth.ts e satellite.ts)
e confere que cada resposta tem TODOS os campos esperados pelo app.
"""
import json
import sys
import time
import urllib.request
import urllib.error

BASE = "http://localhost:8080"
EMAIL = f"mobile-smoke-{int(time.time())}@orbittapi.dev"
PASSWORD = "Abcdefg1"

failures = []
checks = []


def http(method, path, body=None, headers=None):
    url = BASE + path
    data = None
    hdrs = {"Accept": "application/json"}
    if headers:
        hdrs.update(headers)
    if body is not None:
        hdrs["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return e.code, {}


def check(label, cond, detail=""):
    icon = "OK" if cond else "FAIL"
    line = f"[{icon}] {label}" + (f" - {detail}" if detail and not cond else "")
    checks.append(line)
    if not cond:
        failures.append(label)


# 1) POST /auth/register
print(">>> POST /auth/register")
status, body = http("POST", "/auth/register", {"email": EMAIL, "password": PASSWORD})
check("register status 201", status == 201, f"got {status}")
for f in ("accountId", "email", "token"):
    check(f"register response has '{f}'", f in body)
# apiKey e expiresAt sao opcionais no contrato do mobile, mas vamos confirmar
check("register response has 'apiKey' (extra)", "apiKey" in body)
check("register response has 'expiresAt' (extra)", "expiresAt" in body)
TOKEN = body.get("token")
ACCOUNT_ID = body.get("accountId")
print(f"    accountId={ACCOUNT_ID}")
print(f"    token len={len(TOKEN) if TOKEN else 0}")
print()

# 2) POST /auth/login
print(">>> POST /auth/login")
status, body = http("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
check("login status 200", status == 200, f"got {status}")
for f in ("accountId", "email", "token"):
    check(f"login response has '{f}'", f in body)
TOKEN = body.get("token") or TOKEN
print()

# 3) GET /me com Bearer
print(">>> GET /me")
status, body = http("GET", "/me", headers={"Authorization": f"Bearer {TOKEN}"})
check("me status 200", status == 200, f"got {status}")
# mobile aceita accountId OU id; usa o que tiver. Vamos checar pelo menos um.
check("me has id-like field", ("accountId" in body) or ("id" in body))
check("me has 'email'", "email" in body)
# name e opcional no mobile (faz fallback). Nao falhamos se ausente.
print(f"    /me payload keys: {sorted(body.keys())}")
print()

# 4) GET /landuse
print(">>> GET /landuse")
status, body = http(
    "GET", "/landuse?lat=-23.5&lng=-46.6",
    headers={"Authorization": f"Bearer {TOKEN}"},
)
check("landuse status 200", status == 200, f"got {status}")
for f in (
    "latitude", "longitude", "vegetationPercent", "urbanPercent",
    "waterPercent", "bareSoilPercent", "imageDate", "source", "cacheHit",
):
    check(f"landuse has '{f}'", f in body)
print()

# 5) GET /vegetation
print(">>> GET /vegetation")
status, body = http(
    "GET", "/vegetation?lat=-23.5&lng=-46.6",
    headers={"Authorization": f"Bearer {TOKEN}"},
)
check("vegetation status 200", status == 200, f"got {status}")
for f in (
    "latitude", "longitude", "ndvi", "health",
    "imageDate", "source", "cacheHit",
):
    check(f"vegetation has '{f}'", f in body)
print()

# 6) ProblemDetail format (RFC 7807) em erro
print(">>> GET /me sem token (esperado 401 ProblemDetail)")
status, body = http("GET", "/me")
check("/me sem token -> 401", status == 401, f"got {status}")
# axios interceptor do mobile espera 'title', 'detail', 'status' no body
for f in ("title", "status"):
    check(f"ProblemDetail has '{f}'", f in body)
# detail e opcional no mobile mas o backend sempre envia
check("ProblemDetail has 'detail' (preferido)", "detail" in body)
print()

# Resumo
print("=" * 60)
print("RESUMO")
print("=" * 60)
for line in checks:
    print(line)
print()
if failures:
    print(f"!!! {len(failures)} falhas: {failures}")
    sys.exit(1)
print(f"OK - {len(checks)} verificacoes passaram. Mobile contract preserved.")
