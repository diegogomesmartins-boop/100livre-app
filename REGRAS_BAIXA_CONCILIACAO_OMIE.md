# Regras de Baixa e Conciliação Automática — OMIE / 100% Livre

**Versão 2.0 · 14/07/2026** · substitui `regras-conciliacao-bancaria-robo.md` (v1.0)
**Em produção:** `robo_bancos.py` · GitHub Actions · **06:00, 12:00 e 18:00 BRT**

> **Como ler.** Cada afirmação é marcada:
> **[V]** = verificado contra dado real, com a evidência ao lado.
> **[P]** = proposta ainda não validada. Não trate como decisão tomada.
>
> A v1.0 tinha metade das regras em **[P]**. Esta versão promove o que foi medido
> e **derruba o que se provou falso** — inclusive coisas que eu mesmo afirmei.

---

## 1. Princípio inegociável

**Zero baixa divergente.** É melhor deixar 100 créditos na fila de exceção do que
baixar 1 título errado. Baixa errada some com o atrasado real e gera cobrança
indevida em quem já pagou — o pior erro possível neste sistema.

1. **Na dúvida, não baixa.** Ambiguidade, divergência para menos, canal não
   identificado → fila de revisão, nunca chute.
2. **Toda baixa é logada** com título, NF, valor pago, juros e data.
3. **`DRY_RUN=1` não escreve nada.** Ao mexer na lógica de baixa, rode simulado antes.

---

## 2. O que a API do OMIE faz e NÃO faz — **[V] mapa definitivo**

Esta seção existe para ninguém perder um dia redescobrindo o que já foi testado.

| Ação | Endpoint / método | Funciona? |
|---|---|---|
| Ler títulos | `financas/contareceber` → `ListarContasReceber` | **Sim** |
| Ler extrato | `financas/extrato` → `ListarExtrato` | **Sim** |
| **Dar baixa** | `financas/contareceber` → `LancarRecebimento` | **Sim** — em produção |
| Ler lançamentos do CC | `financas/contacorrentelancamentos` → `ListarLancCC` | **Sim** |
| 2ª via do boleto | `financas/contareceberboleto` → `ObterBoleto` | **Sim** → `cLinkBoleto`, `cCodBarras` |
| Ler cliente | `geral/clientes` → `ConsultarCliente` | **Sim** |
| Alterar cliente | `geral/clientes` → `AlterarCliente` | **Sim** — exige o cadastro inteiro (ver 10.4) |
| **Conciliar (o ✓ do extrato)** | — | **NÃO EXISTE** |

### 2.1 A API não concilia — **[V] provado em 14/07/2026**

Não há método "Conciliar". Os campos de conciliação (`dDtConc`, `cHrConc`,
`cUsConc`) vivem no bloco `diversos`, são **devolvidos** pelo `ListarLancCC` e
**recusados** na escrita. Três tentativas, três recusas do servidor:

```
AlterarLancCC + {diversos:{dDtConc}}   → ERROR: Tag [DIVERSOS] não faz parte
                                          da estrutura do tipo complexo
                                          [lanccAlterarRequest]!
AlterarLancCC + {detalhes:{dDtConc,cHrConc}} → ERROR: Tag [CHRCONC] não faz
                                          parte da estrutura [detalhes]!
AlterarLancCC + {detalhes:{dDtConc}}   → ERROR: Tag [DDTCONC] não faz parte
                                          da estrutura [detalhes]!
```

`lanccAlterarRequest` aceita apenas: `nCodLanc`, `cCodIntLanc`, `cabecalho`,
`detalhes`, `transferencia`, `departamentos`. **Conciliação é leitura, não escrita.**

**Consequência:** o ✓ é manual no OMIE. O robô **enxerga e lista** (seção 8), não clica.

### 2.2 Conciliação automática nativa — **[V] só para 3 bancos**

A tela "Importar Extrato → Buscar Automaticamente", que casa e concilia sozinha,
exige **Integração Bancária Automática**, que o OMIE oferece para
**Caixa, Itaú e Safra**. **Inter não está na lista.**

O que existe com o Inter é a integração de **boletos** (cobrança): ela traz o
pagamento e baixa o título, mas **não entrega o extrato** para conciliar. É por
isso que o movimento do Inter nasce "Não conciliado".

> **Frente aberta:** ligar a Integração Bancária do **Itaú** é o único caminho em
> que este ciclo fecha de fábrica, sem gambiarra. Não está ligada.

---

## 3. Regra de escopo — **[V] a trava mais importante**

**Só entra no controle quem tem boleto emitido:** `boleto.cGerado == "S"`,
separado por `id_conta_corrente`.

Isso não é um filtro de conveniência — é o que torna o sistema seguro **por
construção**. Ele exclui automaticamente, sem ninguém lembrar de excluir:

- **Antecipação UY3** — deságio de 0% a 28% por lote (nunca inferível). Ver 6.3.
- **Gap Einstein** — R$ 171,4 mil recebidos com título "A VENCER".
- Redes que pagam por PIX/TED/borderô, para quem nunca emitimos boleto.

**Origem da regra:** a v1 do painel filtrava por conta corrente e trouxe clientes
para quem não emitimos boleto. O Diego pegou: *"Muitos clientes que estão
aparecendo, não emitimos boletos a eles."*

---

## 4. Contas e canais

| Conta | `nCodCC` | Baixa automática | Rastreabilidade |
|---|---|---|---|
| **Banco Inter** | `1972977169` | **LIGADA** | **[V]** integração grava `"Boleto Inter: <nosso nº> / NF: <nf>"` na observação |
| **Itaú** | `1973103311` | **LIGADA** (14/07) | **[V]** `cDocumentoFiscal` preenchido em **358 de 381** recebimentos |
| Santander | `1973114603` | não | PIX/TED — sem chave forte por boleto |
| UY3 | `2191851961` | **nunca** | antecipação — ver 6.3 |

**[V] Itaú — a medição que destravou:** dos 381 recebimentos, 358 são
`"Conta Recebida"` **com NF**. Os 23 sem NF são `"Crédito de Transferência"` e
`"Crédito em Conta Corrente"` — não são boleto, e a regra §3 já os exclui.
Eu tinha deixado o Itaú desligado por precaução, supondo que o extrato não
trouxesse NF. **A suposição estava errada; a medição corrigiu.**

---

## 5. Fluxo do robô (como está em produção)

```
1. ListarContasReceber (janela 240d)  → boletos emitidos, separados por conta
2. ListarExtrato (por conta)          → pagamentos, com NF
3. Casar pagamento × título POR NF    → exata, nunca por valor aproximado
4. Baixar (LancarRecebimento)         → com juros/multa quando houver
5. PORTÃO §9                          → tira da cobrança quem já tem crédito
6. ObterBoleto dos atrasados          → link do PDF + linha digitável
7. ListarLancCC (BAXR)                → fila "a conciliar" (só lista)
8. Gravar Firestore bancos/<slug>     → dashboard lê
```

---

## 6. Regras de match

### 6.1 Boleto (Inter / Itaú) — **[V] em produção**

| # | Chave | Condição | Ação |
|---|---|---|---|
| 1 | **NF exata** (extrato × título) | valor igual | **Baixa** |
| 2 | NF exata, pago **a mais** | diferença = juros/multa | **Baixa** com `juros` (ver 7) |
| 3 | NF exata, pago **a menos** | qualquer | **Fila de revisão** — nunca baixa |
| 4 | Sem NF no pagamento | — | Ignora (não é boleto rastreável) |

**[V] Base de confiança:** auditoria de jul/2026 fechou **480 de 481 boletos do
Itaú com valor exato (99,8%)**. A exceção foi a **NF 35598 (R$ 160)** — paga, com
título ainda atrasado. É exatamente o caso que o portão §9 existe para pegar.

### 6.2 PIX / TED (Santander) — **[P] fora do escopo atual**

Sem boleto, não há chave forte. Fica fora até existir decisão explícita.

### 6.3 Antecipação (UY3) — **[V] nunca automatizar por extrato**

O extrato da UY3 mostra **R$ 110 mil** líquidos; o OMIE registra **R$ 363,8 mil**
baixados NF a NF. **Os dois estão certos** — o banco mostra o repasse consolidado,
o OMIE a liquidação individual. Casar crédito × título aqui produz lixo.

**[V] O deságio não é constante.** Gabarito jan/fev, 575 NFs, 7 lotes:
de **0% a 28%**, média 15,1%. Qualquer tolerância baseada em "≈15%" reprova
metade dos lotes e aprova valores errados na outra metade. **O deságio vem do
export do portal, linha a linha. Nunca é inferido.**

A regra §3 já mantém a UY3 fora do robô.

---

## 7. Juros e multa — **[V] confirmado no mesmo dia**

**Boleto vencido do Inter aceita pagamento com juros e multa.**

**Evidência (14/07/2026):** NF 36328 (Santa Muerte), título de **R$ 255,92**,
vencido em 09/07. O cliente pagou **R$ 261,45** — **R$ 5,53 de juros/multa** por
5 dias.

**Regra:** o robô baixa o **valor do título** e lança a diferença para mais no
campo `juros`. Sem isso, a baixa de R$ 255,92 num crédito de R$ 261,45 deixaria
R$ 5,53 de resíduo quebrando a conciliação.

`ObterBoleto` também devolve `nPerJuros` e `nPerMulta` do título.

---

## 8. Fila de conciliação — o que o robô faz e o que não faz

O robô lista, via `ListarLancCC` com `cOrigem="BAXR"`, os movimentos **sem
`dDtConc`**, ligando cada um ao título por **`nCodLancCR`**.

Isso vira o KPI **"A conciliar"** no painel. **Situação em 14/07: 19 movimentos ·
R$ 4.707,39 no Inter.**

**O ✓ continua manual** (seção 2.1) — mas sem garimpo: a lista vem pronta,
ordenada por valor, com lançamento e título.

Estrutura de um lançamento **já conciliado**:

```json
"diversos": {
  "cOrigem":    "BAXR",          // baixa de contas a receber
  "dDtConc":    "17/11/2025",    // vazio = a conciliar
  "cHrConc":    "18:00:25",
  "cUsConc":    "P001167792",
  "nCodLancCR": 1999080824       // liga ao título
}
```

---

## 9. Portão anti-cobrança-indevida — **[V] em produção**

**Nem todo atrasado é inadimplência.** Antes de montar a fila de cobrança, o robô
cruza cada título aberto contra os créditos do extrato:

| Classe | Critério | Cobra? |
|---|---|---|
| **Pago não baixado** | existe crédito compatível | **NÃO** — vai para `bloqueados` |
| **Antecipado não baixado** | lote já liquidado | **NÃO** — nem entra (regra §3) |
| **Cancelado** | `status_titulo = CANCELADO` | **NÃO** |
| **Inadimplência real** | vencido, sem crédito, não cancelado | **SIM** |

**[V] Resultado em 14/07:** cruzamento dos 22 atrasados do Itaú (R$ 8.303,23)
contra todos os créditos desde novembro → **0 falsos atrasados**. A lista está limpa.

> Hoje deu zero. O valor do portão não é hoje — é no dia em que der um, e
> ninguém estiver olhando.

---

## 10. Armadilhas da API — **[V] todas custaram tempo**

### 10.1 NF vem com zeros à esquerda
`numero_documento_fiscal` = `"00036328"`, **não** `"36328"`.
Comparar como string falha silenciosamente. **Sempre `int()`.**

### 10.2 `registros_por_pagina` é capado em 100
Pedir 200 devolve 100. Confie no `total_de_paginas` da resposta, não na sua conta.

### 10.3 Falha silenciosa da paginação
Se a página 1 vier com `faultstring`, `nTotPaginas` fica indefinido, o loop não
roda e a extração **retorna zero sem erro**. **Valide que o total veio preenchido.**
Total zerado é falha, não "não houve recebimento".

### 10.4 `AlterarCliente` exige o cadastro inteiro
Mandar só o telefone falha em cascata: primeiro pede endereço, depois e-mail.
**Faça `ConsultarCliente` antes e reenvie endereço + e-mail + o campo novo.**

### 10.5 Bloqueio por consumo — **[V] aconteceu em 14/07**
```
ERROR: API bloqueada por consumo indevido
```
Disparado por rodar o robô 4× seguidas com consultas em paralelo. É temporário,
mas derruba tudo. **Não rode o robô várias vezes seguidas.** Pausa de 400–500ms
entre chamadas; `ObterBoleto` só dos atrasados (26 chamadas), nunca dos 63 abertos.

### 10.6 O runner do GitHub roda em UTC
`datetime.now()` marca 3h a mais. Use `timezone(timedelta(hours=-3))`.
O cron do Actions também é UTC: **06/12/18 BRT = 09/15/21 UTC**. E ele não é
pontual — pode atrasar até ~15 min sob carga do GitHub.

### 10.7 Timeout NÃO é HTTPError — **[V] derrubou o 1º run automático**
Em 15/07/2026 a primeira execução agendada (06h) morreu inteira:
```
TimeoutError: The read operation timed out
```
O `except` só pegava `urllib.error.HTTPError`. **`TimeoutError` é `OSError`**, não
passa por ali — o robô morreu sem retry, sem baixa e sem painel. O OMIE fica lento
de manhã; isso vai acontecer de novo.
**Regra:** capture `(HTTPError, URLError, TimeoutError, OSError, JSONDecodeError)`,
backoff progressivo (5s→25s), `timeout=120`. Um robô que roda sem ninguém olhando
precisa ser paranoico com rede, não só com dado.

---

## 11. Qualidade de cadastro — **[V] o risco que quase passou**

**Os telefones do OMIE estavam errados.** Em 14/07, dos 5 clientes atrasados do
Inter, o cadastro tinha:

| Cliente | Cadastro | Real |
|---|---|---|
| Santa Muerte | 11 5681-1388 | 11 9**5681-1388** |
| Thiago Lima | 11 2726-7931 | 11 **97455-4781** |
| Caique Cesar | 11 4767-5472 | 11 **99984-1958** |
| Ana Karolina | 11 9863-2672 | 11 **95147-1711** |
| Seu Coxinha | 11 7214-9766 | 11 9**7214-9766** |

**Três eram de outra pessoa.** Dois estavam no formato antigo de 8 dígitos.
Cobrança automática teria mandado boleto e valor para o WhatsApp de estranhos.

**Regras que nasceram disso:**
1. Telefone com **8 dígitos** é marcado como suspeito (celular BR = DDD + 9 dígitos).
2. O número é **editável** antes de enviar.
3. **Nada é enviado sem confirmação humana** enquanto o cadastro não estiver limpo.
4. O nome do cadastro **não é** o nome de quem responde (ex.: cadastro "Ana
   Karolina", contato real "Pedro").

---

## 12. Cobrança (saída) — regras

- Canal: **link `wa.me` / WhatsApp Web**, não a API oficial. Com ~5 cobranças/dia,
  entrega o mesmo sem verificação da Meta, sem template aprovado e **sem risco de
  banir o número da empresa**.
- **[V] O link não anexa arquivo** — só texto. O boleto vai como **link do PDF**
  (`cLinkBoleto`) + **linha digitável** (`cCodBarras`, 47 dígitos). Anexo real só
  pela Cloud API.
- O envio é sempre **após confirmação** — o painel abre a mensagem pronta, o
  humano aperta enviar.
- Marca "cobrado hoje" para não cobrar duas vezes no mesmo dia.

---

## 13. Pendências reais

| # | Pendência | Situação |
|---|---|---|
| 1 | **✓ da conciliação** — 19 movs · R$ 4.707,39 (Inter) | API não permite (§2.1). Manual, ou ligar integração do Itaú |
| 2 | **Integração Bancária do Itaú** | Disponível, **desligada**. Único caminho nativo |
| 3 | Confirmar se o **Inter tem antecipação** (R$ 27,7 mil de deságio em jul) | Se tiver, §3 já protege — mas vale saber |
| 4 | Gap **Einstein** (R$ 171,4 mil recebido, título A VENCER) | Contabilidade. Fora do robô por §3 |
| 5 | Extração **UY3** incompleta (1.085 de 1.863 movs) | Gabarito é piso, não total |
| 6 | **Rotacionar** app_key/app_secret do OMIE | Credenciais circularam em texto |
| 7 | Revogar o **token do GitHub** (`robo-inter`) | Robô roda pelos secrets |

---

## Apêndice — endpoints em uso

```python
# títulos
POST /api/v1/financas/contareceber/     ListarContasReceber
     {pagina, registros_por_pagina:100, filtrar_por_emissao_de/ate}
     → conta_receber_cadastro[]: codigo_lancamento_omie, numero_documento_fiscal,
       id_conta_corrente, valor_documento, data_vencimento, status_titulo,
       boleto:{cGerado, cNumBancario}

# extrato
POST /api/v1/financas/extrato/          ListarExtrato
     {nCodCC, dPeriodoInicial, dPeriodoFinal}
     → listaMovimentos[]: cNatureza("R"), cOrigem, cDocumentoFiscal,
       nValorDocumento, cDataInclusao, cSituacao, cObservacoes

# baixa (ESCRITA)
POST /api/v1/financas/contareceber/     LancarRecebimento
     {codigo_lancamento, codigo_conta_corrente, valor, data, observacao, juros?}

# 2ª via
POST /api/v1/financas/contareceberboleto/  ObterBoleto
     {nCodTitulo} → cLinkBoleto, cCodBarras, cNumBancario, nPerJuros, nPerMulta

# lançamentos do CC (conciliação — só leitura)
POST /api/v1/financas/contacorrentelancamentos/  ListarLancCC
     {nPagina, nRegPorPagina:100, cOrigem:"BAXR", dtPagInicial, dtPagFinal}
     → listaLancamentos[]: nCodLanc, cabecalho{nCodCC,dDtLanc,nValorLanc},
       diversos{dDtConc, cHrConc, cUsConc, nCodLancCR, cOrigem}

# cliente
POST /api/v1/geral/clientes/            ConsultarCliente / AlterarCliente
     → telefone1_ddd, telefone1_numero, email, endereco...
```

**Status:** `A VENCER` · `ATRASADO` · `VENCE HOJE` · `RECEBIDO` · `CANCELADO`
**Segurança:** app_key/app_secret **não entram neste arquivo**. Secrets do GitHub.
**Rede:** a API do OMIE é **bloqueada a partir do sandbox**; responde do GitHub
Actions e do navegador autenticado (same-origin).
