#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Robô Inter — baixas diárias + snapshot de cobrança (100% Livre)
================================================================
Fala SÓ com a API do OMIE (aproveita a integração Inter↔OMIE já existente)
e escreve o painel no Firestore (coleção bancos/inter) para a aba BANCOS.

Regra de escopo (definida com o Diego):
  usa APENAS boletos EMITIDOS  →  título.boleto.cGerado == "S"
  e na conta Inter (id_conta_corrente == INTER_CC).
  Isso exclui automaticamente o que não é boleto (redes que pagam por
  antecipação/outro banco, títulos só "vinculados" a uma conta, etc.).

Fluxo:
  1. ListarExtrato (conta Inter)      -> pagamentos "Conta Recebida" (traz NF)
  2. ListarContasReceber              -> boletos Inter emitidos, abertos e pagos
  3. casa pagamento x título aberto POR NF  -> baixa (LancarRecebimento)
  4. monta KPIs + aging + lista de cobrança -> grava em Firestore bancos/inter

Segurança:
  - DRY_RUN=1  -> NÃO baixa nada; só monta o painel (modo de validação).
  - idempotente: só baixa título A VENCER/ATRASADO cujo pagamento existe no extrato.
  - log de auditoria de tudo que baixou.

Roda no GitHub Actions (server-side; a API do OMIE é acessível de lá).
"""

import os, sys, json, datetime, time
import urllib.request

# ── Config (via env / secrets) ─────────────────────────────────────
OMIE_KEY    = os.environ["OMIE_APP_KEY"]
OMIE_SECRET = os.environ["OMIE_APP_SECRET"]
INTER_CC    = int(os.environ.get("INTER_CC", "1972977169"))   # Banco Inter no OMIE
DRY_RUN     = os.environ.get("DRY_RUN", "1") == "1"           # 1 = não baixa
JANELA_DIAS = int(os.environ.get("JANELA_DIAS", "120"))       # emissões a olhar
HOJE        = datetime.date.today()

# ── OMIE API ───────────────────────────────────────────────────────
def omie(endpoint, call, param):
    url  = f"https://app.omie.com.br/api/v1/{endpoint}/"
    body = json.dumps({"call": call, "app_key": OMIE_KEY,
                       "app_secret": OMIE_SECRET, "param": [param]}).encode()
    req  = urllib.request.Request(url, data=body,
                                  headers={"Content-Type": "application/json"})
    for tent in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                j = json.loads(r.read().decode())
            if isinstance(j, dict) and j.get("faultstring"):
                # rate-limit do OMIE -> espera e tenta de novo
                if "REDUNDANT" in j["faultstring"] or "sendo executada" in j["faultstring"]:
                    time.sleep(20); continue
                raise RuntimeError(j["faultstring"])
            return j
        except urllib.error.HTTPError as e:
            if tent == 3: raise
            time.sleep(5)
    raise RuntimeError("OMIE indisponível")

def ddmmaaaa(dt):  # date -> 'dd/mm/aaaa'
    return dt.strftime("%d/%m/%Y")

def parse_dt(s):   # 'dd/mm/aaaa' -> date
    d, m, y = map(int, s.split("/")); return datetime.date(y, m, d)

# ── 1. pagamentos no extrato do Inter (NF na observação) ───────────
def pagamentos_inter():
    ini = ddmmaaaa(HOJE - datetime.timedelta(days=JANELA_DIAS))
    ext = omie("financas/extrato", "ListarExtrato",
               {"nCodCC": INTER_CC, "dPeriodoInicial": ini, "dPeriodoFinal": ddmmaaaa(HOJE)})
    pagos = {}
    for m in ext.get("listaMovimentos", []):
        if m.get("cNatureza") == "R" and m.get("cOrigem") == "Conta Recebida":
            nf = m.get("cDocumentoFiscal") or ""
            try: nf = int(nf)
            except: continue
            pagos[nf] = {"data": m.get("cDataInclusao"), "conciliado": m.get("cSituacao")}
    return pagos

# ── 2. boletos Inter emitidos (abertos e pagos) ────────────────────
def boletos_inter():
    ini = ddmmaaaa(HOJE - datetime.timedelta(days=JANELA_DIAS))
    out, pagina, total = [], 1, 1
    while pagina <= total:
        j = omie("financas/contareceber", "ListarContasReceber",
                 {"pagina": pagina, "registros_por_pagina": 200,
                  "filtrar_por_emissao_de": ini, "filtrar_por_emissao_ate": ddmmaaaa(HOJE)})
        total = j.get("total_de_paginas", 1)
        for c in j.get("conta_receber_cadastro", []):
            b = c.get("boleto") or {}
            if b.get("cGerado") == "S" and c.get("id_conta_corrente") == INTER_CC:
                out.append({
                    "cod":   c["codigo_lancamento_omie"],
                    "nf":    int(c["numero_documento_fiscal"]),
                    "cli":   c["codigo_cliente_fornecedor"],
                    "valor": c["valor_documento"],
                    "venc":  c["data_vencimento"],
                    "status": c["status_titulo"],
                    "nosso": b.get("cNumBancario", ""),
                })
        pagina += 1
        time.sleep(0.4)
    return out

# ── 3. baixa dos pagos ainda em aberto ─────────────────────────────
def baixar(bol, pagos):
    fila, feitas = [], []
    abertos = [b for b in bol if b["status"] in ("A VENCER", "ATRASADO", "VENCE HOJE")]
    for b in abertos:
        pg = pagos.get(b["nf"])
        if not pg:
            continue                       # ainda não pago -> nada a fazer
        item = {"nf": b["nf"], "valor": b["valor"], "data": pg["data"], "cod": b["cod"]}
        if DRY_RUN:
            fila.append(item); continue
        try:
            r = omie("financas/contareceber", "LancarRecebimento", {
                "codigo_lancamento": b["cod"],
                "codigo_conta_corrente": INTER_CC,
                "valor": b["valor"],
                "data": pg["data"],
                "observacao": "Baixa automática — robô Inter",
            })
            feitas.append({**item, "codigo_baixa": r.get("codigo_baixa")})
            time.sleep(0.6)
        except Exception as e:
            fila.append({**item, "erro": str(e)})
    return feitas, fila

# ── resolve nomes/telefones dos clientes ───────────────────────────
def nomes(codigos):
    m = {}
    for code in sorted(set(codigos)):
        try:
            j = omie("geral/clientes", "ConsultarCliente", {"codigo_cliente_omie": code})
            m[code] = {"nome": (j.get("nome_fantasia") or j.get("razao_social") or "").strip(),
                       "tel": "".join(ch for ch in (str(j.get("telefone1_ddd") or "") +
                                str(j.get("telefone1_numero") or "")) if ch.isdigit())}
        except Exception:
            m[code] = {"nome": f"Cliente {code}", "tel": ""}
        time.sleep(0.12)
    return m

# ── monta o snapshot do painel ─────────────────────────────────────
def snapshot(bol, pagos, feitas, fila):
    nm = nomes([b["cli"] for b in bol if b["status"] in ("A VENCER","ATRASADO","VENCE HOJE")])
    def cli(c): return (nm.get(c) or {}).get("nome") or f"Cliente {c}"
    def tel(c): return (nm.get(c) or {}).get("tel") or ""
    def dias(v): return (HOJE - parse_dt(v)).days
    abertos = []
    for b in bol:
        if b["status"] in ("A VENCER","ATRASADO","VENCE HOJE"):
            abertos.append({"nf": b["nf"], "cliente": cli(b["cli"]), "tel": tel(b["cli"]),
                            "valor": round(b["valor"],2), "venc": b["venc"],
                            "dias": dias(b["venc"]), "nosso": b["nosso"]})
    atrasado = sorted([a for a in abertos if a["dias"] > 0], key=lambda x:-x["dias"])
    avencer  = sorted([a for a in abertos if a["dias"] <= 0], key=lambda x:x["dias"])
    pagos_ct = [b for b in bol if b["status"] == "RECEBIDO"]
    s = lambda arr: round(sum(x["valor"] for x in arr), 2)
    return {
        "updated": datetime.datetime.now().strftime("%d/%m/%Y %H:%M"),
        "dry_run": DRY_RUN,
        "kpi": {
            "a_receber": s(abertos), "n_aberto": len(abertos),
            "a_vencer": s(avencer), "n_avencer": len(avencer),
            "vencido": s(atrasado), "n_vencido": len(atrasado),
            "pago_v": round(sum(b["valor"] for b in pagos_ct),2), "pago_n": len(pagos_ct),
            "baixa_feita": len(feitas), "baixa_fila": len(fila),
        },
        "atrasado": atrasado, "aVencer": avencer,
        "baixas_log": feitas, "fila_revisao": fila,
    }

# ── grava no Firestore (Admin SDK) ─────────────────────────────────
def gravar_firestore(snap):
    import firebase_admin
    from firebase_admin import credentials, firestore
    sa = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT"])
    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(sa))
    db = firebase_admin.firestore.client()
    db.collection("bancos").document("inter").set(snap)
    print("Firestore bancos/inter atualizado.")

# ── main ───────────────────────────────────────────────────────────
def main():
    print(f"== Robô Inter == {HOJE}  DRY_RUN={DRY_RUN}")
    pagos = pagamentos_inter();        print(f"pagamentos no extrato: {len(pagos)}")
    bol   = boletos_inter();           print(f"boletos Inter emitidos: {len(bol)}")
    feitas, fila = baixar(bol, pagos)
    print(f"baixas {'(simuladas)' if DRY_RUN else 'executadas'}: {len(feitas)} | fila revisão: {len(fila)}")
    snap = snapshot(bol, pagos, feitas, fila)
    print("KPIs:", json.dumps(snap["kpi"], ensure_ascii=False))
    if os.environ.get("FIREBASE_SERVICE_ACCOUNT"):
        gravar_firestore(snap)
    else:
        with open("bancos_inter_snapshot.json", "w", encoding="utf-8") as f:
            json.dump(snap, f, ensure_ascii=False, indent=2)
        print("Sem Firebase; snapshot salvo em bancos_inter_snapshot.json")

if __name__ == "__main__":
    main()
