#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Robô Bancos — baixas diárias + painel de cobrança (100% Livre)
==============================================================
Multi-banco. Fala SÓ com a API do OMIE e grava um documento por banco
no Firestore (bancos/<slug>) para a aba BANCOS do dashboard.

Regra de escopo (Diego): APENAS boletos EMITIDOS -> boleto.cGerado == "S",
separados pela conta corrente (id_conta_corrente).

Baixa automática por banco:
  - inter: LIGADA. A integração Inter↔OMIE grava a NF na observação do
    pagamento ("Boleto Inter: <nosso número> / NF: <nf>") -> casamento exato.
  - itau: LIGADA (14/07/2026). Verificado: o extrato do Itaú traz a NF em
    358 de 381 recebimentos ("Conta Recebida"). Os 23 sem NF são transferências
    e créditos em conta — não são boleto e ficam fora do escopo por construção.

PORTÃO (Regras §9): título com crédito compatível no extrato NÃO entra na fila
de cobrança ("pago não baixado" não é inadimplência). Verificado em 14/07/2026:
0 falsos atrasados entre os 22 do Itaú.

Segurança: DRY_RUN=1 não baixa nada; só casa por NF exata; casos duvidosos
vão para a fila de revisão; log de auditoria de tudo.
"""

import os, json, datetime, time, re
import urllib.request, urllib.error

OMIE_KEY    = os.environ["OMIE_APP_KEY"]
OMIE_SECRET = os.environ["OMIE_APP_SECRET"]
DRY_RUN     = os.environ.get("DRY_RUN", "1") == "1"
JANELA_DIAS = int(os.environ.get("JANELA_DIAS", "240"))
BRT         = datetime.timezone(datetime.timedelta(hours=-3))   # runner roda em UTC
AGORA       = datetime.datetime.now(BRT)
HOJE        = AGORA.date()

BANCOS = [
    {"slug": "inter", "nome": "Inter", "cc": int(os.environ.get("INTER_CC", "1972977169")),
     "baixa": os.environ.get("INTER_BAIXA", "1") == "1"},
    {"slug": "itau",  "nome": "Itaú",  "cc": int(os.environ.get("ITAU_CC", "1973103311")),
     "baixa": os.environ.get("ITAU_BAIXA", "1") == "1"},
]

# ── OMIE API ───────────────────────────────────────────────────────
def omie(endpoint, call, param, tentativas=5):
    """Chamada resiliente. IMPORTANTE: o OMIE fica lento e devolve timeout —
    em 15/07/2026 o run agendado das 6h morreu com TimeoutError porque o except
    só pegava HTTPError. Timeout NÃO é HTTPError. Pegue OSError também."""
    url  = f"https://app.omie.com.br/api/v1/{endpoint}/"
    body = json.dumps({"call": call, "app_key": OMIE_KEY,
                       "app_secret": OMIE_SECRET, "param": [param]}).encode()
    ultimo = None
    for tent in range(tentativas):
        req = urllib.request.Request(url, data=body,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                j = json.loads(r.read().decode())
            if isinstance(j, dict) and j.get("faultstring"):
                fs = j["faultstring"]
                if "REDUNDANT" in fs or "sendo executada" in fs:
                    time.sleep(20); ultimo = RuntimeError(fs); continue
                raise RuntimeError(fs)          # erro de negócio -> não insiste
            return j
        except (urllib.error.HTTPError, urllib.error.URLError,
                TimeoutError, OSError, json.JSONDecodeError) as e:
            ultimo = e
            espera = 5 * (tent + 1)             # backoff: 5s, 10s, 15s, 20s
            print(f"   ! {call}: {type(e).__name__} — tentativa {tent+1}/{tentativas}, "
                  f"aguardando {espera}s")
            time.sleep(espera)
    raise RuntimeError(f"OMIE indisponível após {tentativas} tentativas: {ultimo}")

def ddmmaaaa(d): return d.strftime("%d/%m/%Y")
def parse_dt(s):
    d, m, y = map(int, s.split("/")); return datetime.date(y, m, d)

def nf_de(mov):
    """NF do pagamento: campo fiscal ou extraída da observação ('/ NF: 36324')."""
    v = mov.get("cDocumentoFiscal") or ""
    try:
        return int(str(v).strip())
    except Exception:
        pass
    m = re.search(r"NF[:\s]+(\d+)", mov.get("cObservacoes") or "", re.I)
    return int(m.group(1)) if m else None

# ── 1. pagamentos no extrato de uma conta ──────────────────────────
def pagamentos(cc, nome):
    ini = ddmmaaaa(HOJE - datetime.timedelta(days=JANELA_DIAS))
    ext = omie("financas/extrato", "ListarExtrato",
               {"nCodCC": cc, "dPeriodoInicial": ini, "dPeriodoFinal": ddmmaaaa(HOJE)})
    movs = ext.get("listaMovimentos", []) or []
    receb = [m for m in movs if m.get("cNatureza") == "R"]
    # diagnóstico (aparece no log do Actions)
    origens, com_nf = {}, 0
    for m in receb:
        o = m.get("cOrigem") or "(vazio)"
        origens[o] = origens.get(o, 0) + 1
        if nf_de(m) is not None: com_nf += 1
    print(f"   [{nome}] extrato: {len(movs)} movs · {len(receb)} recebimentos · "
          f"{com_nf} com NF identificada")
    print(f"   [{nome}] origens: {json.dumps(origens, ensure_ascii=False)}")
    pg = {}
    for m in receb:
        nf = nf_de(m)
        if nf is None: continue
        pg[nf] = {"data": m.get("cDataInclusao"), "origem": m.get("cOrigem"),
                  "valor": m.get("nValorDocumento")}
    return pg

# ── 2. boletos emitidos (uma varredura para todos os bancos) ───────
def todos_boletos():
    ini = ddmmaaaa(HOJE - datetime.timedelta(days=JANELA_DIAS))
    out, pagina, total = [], 1, 1
    while pagina <= total:
        j = omie("financas/contareceber", "ListarContasReceber",
                 {"pagina": pagina, "registros_por_pagina": 200,
                  "filtrar_por_emissao_de": ini, "filtrar_por_emissao_ate": ddmmaaaa(HOJE)})
        total = j.get("total_de_paginas", 1)
        for c in j.get("conta_receber_cadastro", []):
            b = c.get("boleto") or {}
            if b.get("cGerado") != "S":
                continue                       # não é boleto emitido -> fora
            try: nf = int(c.get("numero_documento_fiscal"))
            except Exception: continue
            out.append({"cc": c.get("id_conta_corrente"),
                        "cod": c["codigo_lancamento_omie"], "nf": nf,
                        "cli": c["codigo_cliente_fornecedor"],
                        "valor": c["valor_documento"], "venc": c["data_vencimento"],
                        "status": c["status_titulo"], "nosso": b.get("cNumBancario", "")})
        pagina += 1
        time.sleep(0.4)
    return out

ABERTO = ("A VENCER", "ATRASADO", "VENCE HOJE")

# ── 2a. 2ª via do boleto (link + linha digitável) ──────────────────
def fmt_linha(c):
    """cCodBarras vem com 47 dígitos = linha digitável. Formata para leitura."""
    d = "".join(ch for ch in (c or "") if ch.isdigit())
    if len(d) != 47: return d
    return f"{d[0:5]}.{d[5:10]} {d[10:15]}.{d[15:21]} {d[21:26]}.{d[26:32]} {d[32]} {d[33:47]}"

def enriquecer_boletos(rows, nome):
    """Busca link/linha só dos ATRASADOS (são os que vão para cobrança).
    Chamada por título — cuidado com o rate limit do OMIE."""
    ok = 0
    for r in rows:
        try:
            j = omie("financas/contareceberboleto", "ObterBoleto", {"nCodTitulo": r["cod"]})
            link = (j.get("cLinkBoleto") or "").strip()
            linha = fmt_linha(j.get("cCodBarras"))
            if link:  r["link"]  = link
            if linha: r["linha"] = linha
            if link or linha: ok += 1
        except Exception as e:
            r["boleto_erro"] = str(e)[:60]
        time.sleep(0.5)
    print(f"   [{nome}] 2ª via obtida: {ok}/{len(rows)} atrasados")
    return rows

# ── 2b. fila de conciliação ────────────────────────────────────────
def a_conciliar(cc, nome):
    """Movimentos de baixa de contas a receber (BAXR) sem data de conciliação.

    CORRIGIDO 17/07: o OMIE CONCILIA por API. A crença anterior ("não expõe
    conciliação") vinha de testar AlterarLancCC — endpoint errado. O certo é
    financas/contareceber -> ConciliarRecebimento{codigo_baixa}, provado ponta a
    ponta (conciliar + desconciliar) em 17/07. Baixa nova já nasce conciliada via
    conciliar_documento="S" em baixar().

    Esta função continua listando o BACKLOG: baixas antigas, feitas antes desta
    correção ou pela integração bancária, sem codigo_baixa guardado. Para
    conciliá-las: financas/mf -> ListarMovimentos (cNumDocFiscal COM zeros à
    esquerda; a baixa vem na ULTIMA página, cOrigem=APBR) devolve nCodBaixa.
    Ver regra 2.1 do REGRAS_BAIXA_CONCILIACAO_OMIE.md."""
    ini = ddmmaaaa(HOJE - datetime.timedelta(days=JANELA_DIAS))
    out, pag, tot = [], 1, 1
    while pag <= tot:
        j = omie("financas/contacorrentelancamentos", "ListarLancCC",
                 {"nPagina": pag, "nRegPorPagina": 100, "cOrigem": "BAXR",
                  "dtPagInicial": ini, "dtPagFinal": ddmmaaaa(HOJE)})
        tot = j.get("nTotPaginas") or 1          # armadilha conhecida: se vier vazio, não confie
        for x in j.get("listaLancamentos", []) or []:
            cab = x.get("cabecalho") or {}
            div = x.get("diversos") or {}
            if cab.get("nCodCC") != cc:
                continue
            if (div.get("dDtConc") or "").strip():
                continue                          # já conciliado
            out.append({"lanc": x.get("nCodLanc"), "titulo": div.get("nCodLancCR"),
                        "valor": round(cab.get("nValorLanc") or 0, 2),
                        "data": cab.get("dDtLanc")})
        pag += 1
        time.sleep(0.4)
    out.sort(key=lambda x: -x["valor"])
    print(f"   [{nome}] a conciliar: {len(out)} movimento(s) · "
          f"R$ {sum(x['valor'] for x in out):.2f}")
    return out

# ── 3. baixa dos pagos ainda em aberto ─────────────────────────────
def baixar(bol, pg, cc, pode_baixar):
    """Baixa o título pelo valor do documento; a diferença para mais (juros/multa
    de boleto pago após o vencimento) vai no campo juros. Pagamento MENOR que o
    título nunca é baixado automaticamente -> fila de revisão."""
    feitas, fila = [], []
    for b in [x for x in bol if x["status"] in ABERTO]:
        p = pg.get(b["nf"])
        if not p: continue
        pago = p.get("valor")
        dif  = round((pago or 0) - b["valor"], 2) if pago else 0.0
        item = {"nf": b["nf"], "valor": b["valor"], "pago": pago, "juros": max(dif, 0.0),
                "data": p["data"], "cod": b["cod"]}
        if pago and dif < -0.01:
            fila.append({**item, "motivo": f"pagamento menor que o título (dif {dif})"})
            continue
        if DRY_RUN or not pode_baixar:
            fila.append({**item, "motivo": "simulação" if DRY_RUN else "baixa desligada"})
            continue
        param = {"codigo_lancamento": b["cod"], "codigo_conta_corrente": cc,
                 "valor": b["valor"], "data": p["data"],
                 "observacao": "Baixa automática — robô bancos",
                 # conciliar_documento: baixa + conciliação numa chamada atômica.
                 # [V] 17/07: a API CONCILIA. A crença anterior ("não expõe
                 # conciliação") veio de testar o endpoint errado (AlterarLancCC).
                 # Ver regra 2.1 do REGRAS_BAIXA_CONCILIACAO_OMIE.md.
                 "conciliar_documento": "S"}
        if dif > 0.01:
            param["juros"] = dif
            param["observacao"] += f" (juros/multa R$ {dif:.2f})"
        try:
            r = omie("financas/contareceber", "LancarRecebimento", param)
            feitas.append({**item, "codigo_baixa": r.get("codigo_baixa")})
            time.sleep(0.6)
        except Exception as e:
            fila.append({**item, "erro": str(e)})
    return feitas, fila

_cache_nomes = {}
def nomes(codigos):
    for code in sorted(set(codigos)):
        if code in _cache_nomes: continue
        try:
            j = omie("geral/clientes", "ConsultarCliente", {"codigo_cliente_omie": code})
            _cache_nomes[code] = {
                "nome": (j.get("nome_fantasia") or j.get("razao_social") or "").strip(),
                "tel": "".join(ch for ch in (str(j.get("telefone1_ddd") or "") +
                       str(j.get("telefone1_numero") or "")) if ch.isdigit())}
        except Exception:
            _cache_nomes[code] = {"nome": f"Cliente {code}", "tel": ""}
        time.sleep(0.12)
    return _cache_nomes

def snapshot(banco, bol, feitas, fila, pg, conc):
    """Monta o painel. PORTÃO (Regras §9): nenhum título entra na fila de cobrança
    se existir crédito compatível no extrato — 'pago não baixado' não é inadimplência.
    Cobrar quem já pagou é o dano que este sistema existe para evitar."""
    nm = nomes([b["cli"] for b in bol if b["status"] in ABERTO])
    dias = lambda v: (HOJE - parse_dt(v)).days
    abertos, bloqueados = [], []
    for b in bol:
        if b["status"] not in ABERTO:
            continue
        item = {"nf": b["nf"], "cliente": (nm.get(b["cli"]) or {}).get("nome") or f"Cliente {b['cli']}",
                "tel": (nm.get(b["cli"]) or {}).get("tel") or "", "valor": round(b["valor"], 2),
                "venc": b["venc"], "dias": dias(b["venc"]), "nosso": b["nosso"], "cod": b["cod"]}
        p = pg.get(b["nf"])
        if p:                      # crédito existe -> falso atrasado, NÃO cobrar
            bloqueados.append({**item, "pago_em": p.get("data"), "pago_valor": p.get("valor"),
                               "motivo": "crédito no extrato — pago não baixado"})
            continue
        abertos.append(item)
    if bloqueados:
        print(f"   PORTÃO: {len(bloqueados)} título(s) fora da cobrança (já têm crédito no extrato): "
              + ", ".join(f"NF {x['nf']}" for x in bloqueados[:8]))
    atrasado = sorted([a for a in abertos if a["dias"] > 0], key=lambda x: -x["dias"])
    enriquecer_boletos(atrasado, banco["nome"])          # 2ª via só de quem vai ser cobrado
    avencer  = sorted([a for a in abertos if a["dias"] <= 0], key=lambda x: x["dias"])
    pagos    = [b for b in bol if b["status"] == "RECEBIDO"]
    s = lambda arr: round(sum(x["valor"] for x in arr), 2)
    return {"updated": AGORA.strftime("%d/%m/%Y %H:%M"),
            "banco": banco["nome"], "dry_run": DRY_RUN or not banco["baixa"],
            "kpi": {"a_receber": s(abertos), "n_aberto": len(abertos),
                    "a_vencer": s(avencer), "n_avencer": len(avencer),
                    "vencido": s(atrasado), "n_vencido": len(atrasado),
                    "pago_v": round(sum(b["valor"] for b in pagos), 2), "pago_n": len(pagos),
                    "baixa_feita": len(feitas), "baixa_fila": len(fila),
                    "sem_tel": len([a for a in abertos if not a["tel"]]),
                    "bloqueados": len(bloqueados),
                    "conc_n": len(conc), "conc_v": round(sum(c["valor"] for c in conc), 2)},
            "atrasado": atrasado, "aVencer": avencer,
            "baixas_log": feitas, "fila_revisao": fila, "bloqueados": bloqueados,
            "aConciliar": conc}

def firestore_db():
    import firebase_admin
    from firebase_admin import credentials, firestore
    sa = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT"])
    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(sa))
    return firestore.client()

def main():
    print(f"== Robô Bancos == {HOJE}  DRY_RUN={DRY_RUN}  janela={JANELA_DIAS}d")
    bol = todos_boletos()
    print(f"boletos emitidos (cGerado=S) no período: {len(bol)}")
    db = firestore_db() if os.environ.get("FIREBASE_SERVICE_ACCOUNT") else None
    for banco in BANCOS:
        print(f"\n-- {banco['nome']} (cc {banco['cc']}) · baixa={'ON' if banco['baixa'] else 'OFF'}")
        meus = [b for b in bol if b["cc"] == banco["cc"]]
        print(f"   boletos deste banco: {len(meus)} "
              f"(abertos {len([b for b in meus if b['status'] in ABERTO])})")
        pg = pagamentos(banco["cc"], banco["nome"])
        casa = len([b for b in meus if b["status"] in ABERTO and b["nf"] in pg])
        print(f"   abertos com pagamento casado por NF: {casa}")
        feitas, fila = baixar(meus, pg, banco["cc"], banco["baixa"])
        conc = a_conciliar(banco["cc"], banco["nome"])
        print(f"   baixas: {len(feitas)} · fila revisão: {len(fila)}")
        snap = snapshot(banco, meus, feitas, fila, pg, conc)
        print("   KPIs:", json.dumps(snap["kpi"], ensure_ascii=False))
        if snap["kpi"].get("sem_tel"):
            print(f"   ATENÇÃO: {snap['kpi']['sem_tel']} cliente(s) em aberto sem telefone no cadastro OMIE")
        if db:
            db.collection("bancos").document(banco["slug"]).set(snap)
            print(f"   Firestore bancos/{banco['slug']} atualizado.")
        else:
            with open(f"snapshot_{banco['slug']}.json", "w", encoding="utf-8") as f:
                json.dump(snap, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
