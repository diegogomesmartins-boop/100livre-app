# Regras de Baixa e Conciliação — OMIE / 100% Livre

**Versão 2.1 · 17/07/2026** · **arquivo único**. Funde e substitui:
`REGRAS_BAIXA_CONCILIACAO_OMIE.md` (v2.0, 14/07) + `Regras_Sistema_Conciliacao.md` (12–13/07).
Originais preservados em `_backup_17-07/`.
**Em produção:** `robo_bancos.py` · GitHub Actions · **06:17, 12:23 e 18:41 BRT**

> **Como ler.** Cada afirmação é marcada:
> **[V]** = verificado contra dado real, com a evidência ao lado.
> **[P]** = proposta ainda não validada. Não trate como decisão tomada.
>
> Esta versão promove o que foi medido e **derruba o que se provou falso** —
> inclusive coisas que este documento afirmou com **[V]**.

> **Por que virou um arquivo só (17/07).** A memória estava em dois arquivos.
> Em 17/07 o Claude leu apenas o `REGRAS_BAIXA_CONCILIACAO_OMIE.md`, clicou no ✓
> de um movimento real para descobrir o que ele fazia, e conciliou sem evidência.
> O aviso exato — *"esse clique commita direto, sem tela de confirmação"* — estava
> no **outro** arquivo, que ele não abriu. **Memória partida é memória que não
> funciona.** Daqui pra frente: um arquivo. Se nascer um segundo, ele é índice
> para este, nunca conteúdo paralelo.

---

## 0. Registro de erros e melhorias — **a seção mais importante**

**Por que existe.** Em 17/07 o mesmo tipo de erro aconteceu duas vezes no mesmo dia.
Erro sem registro vira erro recorrente. Toda regra abaixo nasceu de um erro real, e
o custo está anotado — porque regra sem a cicatriz do lado é regra que alguém revoga
por conveniência daqui a três meses.

**Como usar.** Errou? Escreve aqui **no mesmo dia**, com: o que fez, o que quebrou,
o custo, e a **regra derivada**. Sem culpa e sem rodeio — o registro é a entrega.

| # | Data | O que aconteceu | Custo | Regra derivada |
|---|------|-----------------|-------|----------------|
| **E1** | 17/07 | Claude clicou no ✓ "Conciliar" de um movimento real (Santander, R$ 899,70, NF 35572) **para descobrir o que o botão fazia**. Conciliou na hora, sem confirmação. Revertido em seguida via "Remover Conciliação"; API confirmou volta a "Não conciliado". | Baixo (revertido em ~1 min), mas foi conciliação sem lastro em dado financeiro ao vivo. | **R-E1: Nunca acionar controle de escrita para descobrir o que ele faz.** Descobrir por doc, por probe read-only, ou perguntando. Se precisar mesmo testar: registro conhecido, reverter no mesmo minuto, anotar aqui. |
| **E2** | 17/07 | Causa raiz do E1: o aviso *"esse clique commita direto, sem tela de confirmação"* já existia — no `Regras_Sistema_Conciliacao.md`, que não foi lido. Só o outro arquivo foi. | O dia inteiro operado com metade da memória. | **R-E2: Um arquivo só.** Esta é a fonte única. Antes de agir no OMIE, ler **este** documento inteiro — não um pedaço. |
| **E3** | 17/07 | `robo-heartbeat` v1 contava execução de **qualquer** origem. Um dispatch manual completava a cota e mascarava a janela agendada perdida — o vigia era cego para o único caso que existia para pegar. Passou verde (`sucesso: 4`) num período em que a janela das 18:00 furou. | Zero (pego antes de entrar em regime), só porque o **log foi lido**. | **R-E3: Check verde não é evidência.** Um alerta só vale depois de você **vê-lo falhar** no caso real que ele deve pegar. Ler o log, não o ícone. |
| **E4** | 14/07 → corrigido 17/07 | v2.0 afirmou **[V]** *"A API não concilia — provado"*. O teste foi `AlterarLancCC` + `diversos:{dDtConc}` — escrever o campo no **lançamento**. Isso falha mesmo. Mas o método certo é **`ConciliarRecebimento{codigo_baixa}`** no serviço `contareceber`, que **existe** e já tinha sido testado com sucesso em 12/07 (R$ 160, NF 35598). O documento derrubou uma verdade e promoveu uma falsidade a [V]. | **Alto.** Essa linha entrou no skill do robô como *"a API não concilia, não tente"*. O dia 17/07 inteiro foi conduzido assumindo conciliação manual — quando ela era automatizável desde 12/07. | **R-E4: "A API não faz X" só é [V] depois de tentar todos os endpoints plausíveis do serviço.** Um endpoint recusar não prova que a capacidade não existe. Escrever "não existe" exige o probe diferencial (ver 2.4-A). |
| **E5** | 11/07 | Clique errado no grid **desconciliou** o R$ 160 — o lápis e o ✓ ficam a ~14px um do outro. | Baixo, corrigido na hora. | **R-E5: Robô nunca edita campo de movimento clicando na tela.** Observação vai na baixa (`LancarRecebimento.observacao`), por API. (E1 é a reincidência disto — o grid do OMIE é uma armadilha conhecida.) |
| **E6** | 11/07 | Lista de conciliação montada só a partir do relatório de boletos pagos, sem checar o status no OMIE. Itens já conciliados (ex.: NF 34156) apareceram como pendentes. | Retrabalho + lista errada entregue. | **R-E6 (= regra 00): O OMIE é a matriz.** O que "falta conciliar" vem sempre do `cSituacao` do OMIE. Fonte externa é conferência por NF, nunca origem da fila. |

| **E7** | 17/07 | 4 movimentos do DIA BRASIL (R$ 4.995) mandados para exceção como "ambíguo". A ambiguidade **não existia**: cada baixa já tem seu `nCodMovCC`, e `ConciliarRecebimento` age sobre a baixa. Pior: nem se procurou o lastro fora do OMIE. O Diego perguntou *"procurou na rede SharePoint?"* — o extrato estava lá, e fecha no centavo (2 × 1.341,25 = crédito de 2.682,50 em 12/12). | R$ 4.995 parados por engano; teriam ficado parados indefinidamente se o Diego não perguntasse. | **R-E7: "ambíguo no OMIE" ≠ "sem resposta".** Procurar lastro fora do OMIE antes de mandar para exceção. Ver 15.2. |
| **E8** | 17/07 | Ao ver `BLOQUEIO JUDICIAL` no extrato e "EM RECUPERAÇÃO JUDICIAL" no nome do DIA, foi insinuado que tinham relação. **Não têm.** Correção do Diego. | Ruído apresentado como sinal; quase virou motivo para não conciliar. | **R-E8: não inferir conexão entre fatos só porque aparecem juntos.** Coincidir na mesma tela não é evidência de relação. Se não dá para provar o vínculo, não mencionar como se fosse achado. |

| **E9** | 17/07 | Varredura inteira do backlog agrupada por **`cDataInclusao`**, achando que era a data do banco — porque **o skill do robô afirma isso**. É a data de digitação. Gerou: diagnóstico de "758 não conciliados no Santander" como se fosse caos generalizado (são 758 em 9.683, com 93% concentrados em 3 meses); "janeiro tem 211 movimentos em 7 datas, isso é lançamento em lote" (janeiro tem 695 mov, 672 conciliados, **14** pendentes); e a explicação errada da armadilha 10.1-b, culpando o filtro do OMIE por um erro de leitura. | Meia sessão de análise em cima do campo errado. Quase virou execução: a regra de casamento proposta ("data+valor") teria falhado em massa. | **R-E9: `dDataLancamento` é o banco; `cDataInclusao` é a digitação.** Para qualquer comparação com extrato/OFX, usar `dDataLancamento`. Ver 10.1-a. |

### Padrão que os erros revelam

**E1, E5** são o mesmo erro: agir na tela antes de entender. **E3, E4** são o mesmo
erro: aceitar um resultado verde/negativo sem provar. **E7, E8** são o mesmo erro: parar
de procurar cedo demais e preencher a lacuna com suposição. Os três se resumem a:

> **Não confunda "não deu erro" com "está certo", nem "falhou uma vez" com "é impossível",
> nem "não achei" com "não existe".**

**E4 e E9 são gêmeos, e o parentesco importa:** os dois nasceram de **acreditar numa
frase escrita** — "a API não concilia" e "cDataInclusao é a data do banco" — ambas no
skill do robô, ambas falsas, ambas nunca conferidas contra o sistema. **Documentação
errada é pior que documentação ausente:** ausência faz você olhar; erro faz você parar de
olhar. É por isso que o item 0 e as marcas [V]/[P] existem.

**E quem pegou o quê.** E3, E4 e E9 foram pegos por ler log, doc e dado. **E1, E7 e E8
foram pegos pelo Diego** — perguntando "o que você quer excluir?", "procurou no
SharePoint?" e "bloqueio judicial não tem nada a ver". Três dos nove. E o E9 só apareceu
porque ele mandou **mostrar cada grupo antes de efetivar** — a análise ia para execução
com o campo errado. A revisão humana não é formalidade aqui: é o que fecha a diferença
entre um sistema que parece certo e um que está certo.

---

## 0.1 Combinados de 17/07

1. **Um arquivo só** (R-E2). Este.
2. **Conciliação:** é por **API** (`ConciliarRecebimento`), não por clique. Ver 2.1.
3. **Só concilia com lastro:** movimento casado com linha de extrato/OFX por NF ou por
   data+valor **único**. Valor repetido na mesma data sem NF → fila de exceção.
4. **Erro novo → linha na tabela do item 0, no mesmo dia.**
5. **Cron fora da hora cheia** (ver 11) e **heartbeat conta só `schedule`** (ver 12).

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
| **Conciliar** | `financas/contareceber` → `ConciliarRecebimento` | **Sim** — por `codigo_baixa`. Ver 2.1 |
| **Desconciliar (rollback)** | `financas/contareceber` → `DesconciliarRecebimento` | **Sim** — por `codigo_baixa` |
| **Baixar + conciliar atômico** | `LancarRecebimento` + `conciliar_documento:"S"` | **Sim** — caminho preferido |
| Conciliar escrevendo no lançamento | `AlterarLancCC` + `diversos.dDtConc` | **NÃO EXISTE** — é aqui que a v2.0 se enganou (E4) |

### 2.1 A API **CONCILIA** — **[V] corrigido em 17/07/2026**

> **Esta seção derruba o que a v2.0 afirmava com [V].** A v2.0 dizia *"A API não
> concilia — provado em 14/07"*. **Estava errado**, e o erro está registrado em **E4**.

**O que a v2.0 testou (e por que falhou):** `AlterarLancCC` + `diversos:{dDtConc}`,
ou seja, tentar escrever o campo de conciliação **no lançamento de conta corrente**.
Isso realmente é recusado — os campos `dDtConc`/`cHrConc`/`cUsConc` são **devolvidos**
pelo `ListarLancCC` e **recusados** na escrita:

```
AlterarLancCC + {diversos:{dDtConc}}          → ERROR: Tag [DIVERSOS] não faz parte
                                                 da estrutura do tipo complexo
AlterarLancCC + {detalhes:{dDtConc,cHrConc}}  → ERROR: Tag [CHRCONC] não faz parte
                                                 da estrutura [detalhes]!
AlterarLancCC + {detalhes:{dDtConc}}          → ERROR: Tag [DDTCONC] não faz parte
```

`lanccAlterarRequest` aceita apenas: `nCodLanc`, `cCodIntLanc`, `cabecalho`,
`detalhes`, `transferencia`, `departamentos`.

**Essa parte da v2.0 continua [V] e vale manter:** pelo `AlterarLancCC`, conciliação é
**leitura, não escrita**. Três tentativas, três recusas. O erro da v2.0 não foi o teste
— foi a **conclusão** que tirou dele: generalizou "este endpoint não escreve" para "a
API não concilia", sem procurar o serviço certo.

**O método certo é outro serviço e outra chave.** Não se concilia o *lançamento* —
concilia-se a **baixa**:

| Método (`financas/contareceber`) | Entrada | Efeito |
|---|---|---|
| **`ConciliarRecebimento`** | `{codigo_baixa}` | Concilia. Equivale ao ✓ da tela. |
| **`DesconciliarRecebimento`** | `{codigo_baixa}` | Rollback por API. |
| **`LancarRecebimento`** + `conciliar_documento:"S"` | — | **Baixa + conciliação atômicas**, uma chamada. |
| `CancelarRecebimento` | `{codigo_baixa}` | Desfaz a baixa. |

**[V] Evidência 1 — teste ponta a ponta em 12/07** (R$ 160, NF 35598, `codigo_baixa`
2297471366): `DesconciliarRecebimento` → *"Conciliação da Baixa revertida com sucesso!"*
→ extrato virou "Não conciliado". `ConciliarRecebimento` → *"Baixa conciliada com
sucesso!"* → voltou a "Conciliado", observação intacta. Ciclo reversível provado.

**[V] Evidência 2 — probe diferencial em 17/07.** Para separar "método não existe" de
"método existe e recusou meu argumento", comparar a resposta contra um método
sabidamente inexistente:

```
ConciliarRecebimento {codigo_baixa: 1}   → FAULT: "A conciliação da baixa falhou!"
MetodoQueNaoExiste   {codigo_baixa: 1}   → {"status":"error","message":"Method \"MetodoQueNaoExiste\" not exists"}
```

Respostas **diferentes** ⇒ `ConciliarRecebimento` existe e executou; só rejeitou o
`codigo_baixa` falso. Se não existisse, diria `not exists`.

**Consequência:** o ciclo completo é **100% API**. Sem clique, sem risco de acertar o
lápis em vez do ✓ (E5), sem conciliação sem lastro (E1).

#### 2.1.1 Como obter o `codigo_baixa` — **[V] resolvido em 17/07**

Para baixas **feitas pelo robô**, o `codigo_baixa` vem no retorno do `LancarRecebimento`
— basta guardar. Para baixas **pré-existentes** (vindas da integração bancária, que o robô
não fez), a fonte é o serviço **`financas/mf` → `ListarMovimentos`**. É o campo
**`nCodBaixa`**, dentro de `detalhes`.

```
POST /api/v1/financas/mf/
{ "call":"ListarMovimentos",
  "param":[{ "nPagina":1, "nRegPorPagina":20,
             "cNumDocFiscal":"00035572",   // ← zeros à esquerda! (ver 10.1)
             "lDadosCad":true }] }
```

**[V] Exemplo real (NF 35572, Santander, 17/07):**

| Campo | Valor |
|---|---|
| `nCodBaixa` | **2301064998** ← é este que o `ConciliarRecebimento` quer |
| `nCodMovCC` | 2301064997 (movimento — **número diferente**) |
| `nCodTitulo` | 2273053053 |
| `dDtConcilia` | `""` = **não conciliado** |
| `cOrigem` | `APBR` (a baixa) |
| `nCodCC` | 1973114603 (Santander) |
| `dDtPagamento` | 16/07/2026 |

**Três armadilhas — [V] todas custaram tentativa:**

1. **A NF exige zeros à esquerda no filtro.** `cNumDocFiscal:"35572"` → **0 registros,
   sem erro**. `"00035572"` → acha. Falha silenciosa, do tipo mais perigoso.
2. **A baixa vem na ÚLTIMA página, não na primeira.** A consulta devolve `total=2`, mas
   **1 registro por página**: pág. 1 = o **título** (`cOrigem: VENR`, sem `nCodBaixa`);
   pág. 2 = a **baixa** (`cOrigem: APBR`, com `nCodBaixa`). Ler só a pág. 1 leva à
   conclusão errada de que o campo não existe.
3. **`nCodCC` do título ≠ conta do dinheiro.** Na pág. 1 o `nCodCC` veio 1973103311
   (Itaú — a conta padrão do título); na pág. 2, 1973114603 (Santander — onde o dinheiro
   caiu). **Para saber onde entrou, usar o registro da baixa.**

**Onde não está** (testado em 17/07, para ninguém repetir): `ListarContasReceber` não traz
campo de baixa; `ConsultarContaReceber` devolve `recebimento: null` e
`lancamento_detalhe: null`.

**`ListarLancCC` — os parâmetros certos.** Em 17/07 foram tentados `nCodCC`, `dDtLancDe`
e `cCodIntLanc`: **todos recusados** por `lanccListarRequest`. Os corretos já estavam no
`robo_bancos.py`, na função `a_conciliar()`:

```python
{"nPagina": 1, "nRegPorPagina": 100, "cOrigem": "BAXR",
 "dtPagInicial": "...", "dtPagFinal": "..."}
```

> **Lição (a mesma da 2.4, terceira vez no dia):** a resposta estava **no próprio código
> do robô**. Antes de adivinhar nome de parâmetro, `grep` no repo e ler a doc oficial.
> Adivinhar custou 3 tentativas aqui e 3 no `nCodBaixa`.

> **Como foi achado — vale mais que o resultado.** Depois de adivinhar nome de parâmetro
> três vezes (anti-padrão da 2.4), a saída foi **ler a lista oficial de serviços**
> (`developer.omie.com.br/service-list/`), onde `financas/mf` está descrito como
> *"Consulta de pagamentos, **baixas**, lançamentos no Conta Corrente"*. A resposta
> estava na primeira linha da documentação. **Ler a doc é mais rápido que adivinhar.**

**Consequência: o ciclo completo está destravado.** `ListarExtrato` dá a fila de não
conciliados com a NF → `mf/ListarMovimentos` dá o `nCodBaixa` → `ConciliarRecebimento`
concilia. Tudo por API, sem tela.

#### 2.1.2 Ciclo ponta a ponta — **[V] provado e revertido em 17/07**

Rodado numa baixa que o robô **não** fez (NF 35572, Santander, `nCodBaixa` 2301064998),
justamente o caso que se acreditava impossível:

| Passo | Resultado |
|---|---|
| Estado inicial (`ListarExtrato`) | `Não conciliado` |
| `ConciliarRecebimento{codigo_baixa:2301064998}` | `codigo_status:"0"` · *"Baixa conciliada com sucesso!"* |
| Releitura (2 fontes) | `cSituacao=Conciliado` · `dDtConcilia=17/07/2026 08:33:16` · `cUsConcilia=WEBSERVICE` |
| `DesconciliarRecebimento{codigo_baixa:2301064998}` | `codigo_status:"0"` · *"Conciliação da Baixa revertida com sucesso!"* |
| Estado final | `Não conciliado` · `dDtConcilia=""` · título intacto em `RECEBIDO` |

`cUsConcilia = "WEBSERVICE"` é a assinatura da conciliação por API — dá para auditar
depois o que foi robô e o que foi humano.

##### ⚠️ Atraso de leitura pós-escrita — **[V] o mais traiçoeiro daqui**

**A escrita retorna sucesso antes de a leitura refletir.** Medido em 17/07:

- **+2,5s** após conciliar → `ListarExtrato` ainda dizia **"Não conciliado"**.
- **~+30s** → `"Conciliado"`.

A escrita tinha funcionado desde o primeiro instante. Quem relê rápido e acredita conclui
que **falhou** — e o reflexo natural é **tentar de novo**, ou pior, "corrigir na mão".

> **Regra: nunca decidir sobre o resultado de uma escrita na primeira releitura.**
> Reler com retentativa até estabilizar (30s+), e só então marcar feito. Conferir por
> **duas fontes** (`ListarExtrato.cSituacao` + `mf.dDtConcilia`). Consulta do **mês
> inteiro** é mais confiável que janela curta — janela curta às vezes volta vazia.
>
> Isto se soma à regra "confia mas verifica": **nem o retorno de sucesso, nem a primeira
> releitura são evidência.** O par (sucesso + releitura estável em duas fontes) é.

### 2.2 Conciliação automática nativa — **[V] NÃO está contratada em nenhuma conta**

**[V] Verificado na tela — Santander e Itaú** (Diego, 17/07). Em `Finanças →
Movimentação de Contas Correntes → Importar Extrato`, as duas oferecem **apenas**
*"Importar agora — o arquivo OFX a partir do meu computador"*. **Não existe o botão
"Buscar Automaticamente".** O Santander foi reconferido pelo Claude em 17/07.

**[P] Inter e Cora: não verificados na tela.** Aparecem no seletor de conta do diálogo
de importação, mas **isso só prova que aceitam OFX** — não diz nada sobre terem ou não
a busca automática. Para o Inter há um indício independente: o OMIE só cataloga
Caixa/Itaú/Safra na integração bancária, então provavelmente **nem é suportado**. Falta
abrir a tela dos dois e olhar.

> Este parágrafo já nasceu errado uma vez: a v2.1 afirmou "Inter, Itaú, Santander e
> Cora verificados" tendo olhado só o Santander. Corrigido no mesmo dia. É a regra 2.4
> falhando dentro da seção que existe para corrigi-la — ver **E4**.

O OMIE suportar Caixa/Itaú/Safra no catálogo **não significa que a conta tem o
serviço** — catálogo do fornecedor ≠ contrato do cliente.

> **Correção de premissa.** Entre 14 e 17/07 este documento afirmou que "ligar a
> Integração Bancária do Itaú fecha o ciclo". Isso foi escrito lendo a documentação,
> **sem olhar a tela**. Ver 2.4.

### 2.3 Os três caminhos de conciliação — **[V] corrigido em 17/07**

> A v2.0 dizia *"Importar OFX + conciliar na tela — único caminho vivo"*. **Falso em
> dois pontos:** existe a API (2.1), e existe o ✓ direto sem OFX nenhum.

| Caminho | Existe? | Usar? |
|---|---|---|
| **`ConciliarRecebimento` por API** | **Sim** — 2.1 | **Sim. É o caminho oficial.** Determinístico, reversível, sem clique. |
| **✓ na tela (Movimentação)** | **Sim** | **Não.** Ver abaixo. |
| **Importar OFX + auto-match na tela** | Sim | Só para o **passivo antigo** e para trazer o extrato do banco pra dentro. |
| `AlterarLancCC` (`diversos.dDtConc`) | **Não** | Impossível — 2.1. |
| "Buscar Automaticamente" (integração bancária) | **Não contratado** no Itaú/Santander | — 2.2. **Inter provavelmente nem é suportado** (OMIE só cataloga Caixa/Itaú/Safra). |

**Para contratar a integração bancária** (se um dia virar prioridade): a pergunta ao
OMIE/gerente é *"quanto custa e o que exige habilitar a Integração Bancária Automática
do Itaú nesta conta"* — **não** *"existe?"*. Vale só para o Itaú; Inter e Santander não
têm a opção. Onde a integração já concilia sozinha, não precisamos agir.

#### 2.3.1 O ✓ da tela — **[V] testado e revertido em 17/07 (erro E1)**

Na tela `Movimentação da Conta Corrente`, cada linha "Não Conciliado" tem um ✓ na
coluna Opções:

- **1 clique concilia na hora.** Sem tela de confirmação, sem pedir OFX, sem perguntar nada.
- É **reversível**: o mesmo lugar vira **"Remover Conciliação"**.
- **Ele não casa com linha nenhuma do extrato.** Marca o movimento como conciliado e pronto.

> **Por que isso é perigoso.** O ✓ produz conciliação **sem evidência**: deixa o
> "Saldo Conciliado" bonito sem que ninguém tenha olhado o banco — que é exatamente o
> oposto do que o KPI serve. Conciliar os 24 pendentes por aí levaria 2 minutos e
> destruiria o único indicador que diz se a operação bate com a realidade.
>
> **Regra: o robô nunca usa o ✓.** Conciliação é por API, com lastro. Se um humano
> usar o ✓, é decisão consciente dele, registrada.

**O passivo:** em 17/07 a tela do Santander mostrava **Saldo Conciliado −R$ 268.793,33
× Saldo Atual R$ 286.845,80** — distância de **R$ 555.639,13**. Não é dinheiro
faltando: é o acúmulo de baixas nunca amarradas ao extrato. **O "Saldo Conciliado" do
OMIE não é confiável enquanto esse passivo não for zerado.**

---

## 2.4 REGRA DE MÉTODO — **verificar antes de afirmar**

*(Definida pelo Diego em 17/07/2026, depois de eu errar exatamente nisso.)*

**Sempre confirmar se a informação/recurso existe no OMIE do cliente — na tela ou
na API — antes de propor solução ou registrar como fato.**

Documentação de fornecedor descreve o que o produto *pode* fazer. Só o ambiente do
cliente diz o que ele *tem*. Confundir os dois produziu, neste projeto:

1. "Ligar a integração do Itaú" — recomendado 3 dias; **não existe na conta** (2.2).
2. "O Itaú não deve ter NF no extrato" — suposição que manteve a baixa desligada;
   a medição mostrou **358 de 381 com NF** (§4).
3. "A integração do Inter não baixa sozinha" — ela baixa (§4).
4. "Os telefones não estão no cadastro" — estavam, **errados** (§11).

Em todos, o custo de verificar era de minutos. **Marque [P] e verifique, ou não escreva.**

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

> **Corrigido em 17/07:** a v2.0 dizia aqui *"o ✓ continua manual"*. **Não continua** —
> a conciliação é por API (`ConciliarRecebimento`, seção 2.1). Esta fila deixa de ser
> "lista para alguém clicar" e passa a ser **fila de execução do robô**, assim que o
> `codigo_baixa` de baixas pré-existentes for resolvido (2.1.1).

A lista vem pronta,
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

### 10.1-a ⚠️ `cDataInclusao` NÃO é a data do banco — **[V] 17/07, o erro mais caro do dia**

**`dDataLancamento` = data do banco.** É quando o dinheiro andou.
**`cDataInclusao` = data de digitação no OMIE.** É quando alguém lançou. **Nada a ver.**

**[V] Prova (Santander, janela `01/01–31/01/2026`, 14 não conciliados):**

```
cDataInclusao  : 08/07/2026  em TODOS os 14      ← digitados de uma vez, em julho
dDataLancamento: 15/01, 16/01, 19/01, 20/01, 22/01, 23/01, 26/01, 27/01, 30/01   ← o banco
```

**O filtro `dPeriodoInicial`/`dPeriodoFinal` usa `dDataLancamento`.** Não está deslocado,
não tem bug: quem lê `cDataInclusao` é que está na coluna errada.

> **Correção de premissa — o skill do robô está errado.** O skill diz *"cDataInclusao é
> a data real do banco; o filtro de período vem deslocado ~1 dia"*. **As duas metades são
> falsas.** Essa frase produziu, em 17/07:
> - varredura inteira agrupada pelo campo errado;
> - um falso alarme de *"211 movimentos em 7 datas, isso é lançamento em lote"* — era
>   artefato de ler a data de digitação;
> - a explicação errada da 10.1-b (abaixo), que culpava o filtro.
>
> **Regra: para qualquer coisa que se compare com o banco — OFX, extrato, data de
> crédito — usar `dDataLancamento`. `cDataInclusao` só serve para auditar quem digitou
> o quê e quando.**

### 10.1-b O período do `ListarExtrato` NÃO filtra por `cDataInclusao` — **[V] 17/07**

**O filtro `dPeriodoInicial`/`dPeriodoFinal` usa uma data diferente da data do banco.**
Consequência medida em 17/07: movimentos com `cDataInclusao = 01/07/2026` **não voltam**
na consulta de `01/07` a `31/07` — voltam na consulta de **junho**.

Exemplo real: NF 35499 e 35428 (Inter, R$ 100 cada, `cDataInclusao` 01/07/2026)
apareceram só na janela `01/06–30/06`. A consulta de julho devolveu 1 pendente; a
varredura mês a mês, agrupando por `cDataInclusao`, achou 3.

**[V] Exemplo que fecha o raciocínio.** NF 30336 e 30494 (Itaú, DIA BRASIL) têm
`cDataInclusao = 04/02/2026` e **só aparecem na janela `01/12–31/12/2025`** — porque o
`dDataLancamento` delas é 12/12 e 19/12/2025, que é quando o banco creditou (confirmado
no extrato: R$ 2.682,50 e R$ 2.312,50). Nada de anômalo: **o filtro está certo, a leitura
é que estava errada** (ver 10.1-a).

> **Corolário:** não existe "desvio da janela" a compensar. **Use `dDataLancamento` e o
> filtro casa.** Agrupar backlog por `cDataInclusao` produz relatório sem sentido —
> mistura o que o banco fez com o que a digitação fez.

**Por que isso morde:** dá para varrer "o mês inteiro", ver zero pendências, e concluir
que fechou — enquanto existem movimentos daquele mês pendurados na janela vizinha.
Aconteceu em 17/07: a afirmação *"zero pendências em julho"* era verdadeira **para a
janela 01–31/07**, e falsa para "todos os movimentos com data de julho".

> **Regra: para varredura de backlog, cobrir o período inteiro mês a mês e agrupar pelo
> `cDataInclusao` do movimento — nunca concluir cobertura a partir de uma única janela.**
> Sempre incluir um mês de folga antes e depois do alvo.

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

### 11.1 Telefone pelo WhatsApp Web — [V] 18/07/2026

Quando o cadastro do OMIE tem fixo, número errado ou vazio, o histórico do WhatsApp Web da empresa casa o nome/CNPJ do devedor com uma conversa real. Regras do que funciona: uma busca por vez, limpar pelo X (Ctrl+A NÃO seleciona a busca e as consultas se concatenam), esperar ~6s e ler por SCREENSHOT, não por script (o painel atualiza depois do DOM, então script rápido devolve o resultado da busca anterior). Buscar por nome fantasia, razão social e pedaços do CNPJ. Confirmar abrindo a conversa: nome que casa no texto de uma mensagem antiga não é o cliente.

**Limite [V]:** o WhatsApp Web só mostra histórico a partir de 17/03/2026 (aviso na tela). Devedores antigos (76–213 dias) provavelmente conversaram antes disso, então "não achei aqui" NÃO prova ausência — o histórico completo está no celular. **Antes de gravar,** o badge "8 díg." confunde 3 casos: fixo (11 3155-7563, válido mas não é WhatsApp), lixo (11 2222-2222) e celular antigo de verdade. Só o último é erro.

**Varredura 18/07 (7 devedores Itaú sem celular):** Cumbuca Boa (NF 36044) → 11 96627-1695, financeiro da Cumbuca, conversa de ontem — gravado (número antigo preservado no telefone2). Terraço Italia e Emporium: candidatos não confirmados, não gravados. 8F, G.M.A.P, Rodrigo Aparecido e Lejazz Pinheiros: nada no histórico pós-17/03. **Ao gravar** use AlterarCliente reenviando o cadastro inteiro (§10) e guarde o número antigo no telefone2 — nunca apague.

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

---

## 14. Agendamento — **[V] o GH Actions engole janela (17/07)**

**O que aconteceu.** Em 17/07 a conferência achou **duas janelas que simplesmente não
rodaram**: 16/07 às 18:00 BRT e 17/07 às 06:00 BRT. Não falharam — **não existem**.
Nenhum run, nenhum log, nenhum e-mail. O silêncio parecia sucesso.

**Diagnóstico.** O cron estava em hora cheia (`0 9/15/21 * * *`). Todas as execuções
saíam **1 a 2h atrasadas** — sintoma clássico de fila. O agendador do GitHub Actions é
*best-effort*: sob carga ele **atrasa e descarta**, e a hora cheia é o horário mais
disputado do mundo.

**Correção (commit `9f02879`, 17/07):** minutos quebrados.

| Janela | Cron (UTC) | BRT |
|---|---|---|
| Abre o dia | `17 9 * * *` | 06:17 |
| Meio-dia | `23 15 * * *` | 12:23 |
| Fecha o dia | `41 21 * * *` | 18:41 |

**O que salvou dessa vez:** o robô é **idempotente** — varre boletos pagos e baixa.
Janela perdida não perde dado; a seguinte recupera. Confirmado: os 24 movimentos não
conciliados tinham todos título RECEBIDO, nada ficou para trás. **O risco não é o
passado, é o futuro:** se entrar dinheiro e duas janelas seguidas caírem, o título
fica aberto e ninguém sabe.

## 15. `robo-heartbeat` — **[V] em produção desde 17/07**

**Problema que resolve.** Janela descartada **não gera run**, logo **não gera falha**,
logo **não gera aviso**. O modo de falha mais perigoso do sistema é o silencioso.

**Como funciona** (`.github/workflows/robo-heartbeat.yml`, commit `f4283e6`):
roda **22:13 BRT**, conta as execuções do `robo-inter` nas últimas 24h e **falha se
vier menos que 3**. A falha **é** o alerta — o GitHub manda e-mail automático pro dono
do cron. Sem infra nova, sem escolher canal.

**Conta só `event == "schedule"`** — de propósito. Ver **E3**: a v1 contava qualquer
origem, e um dispatch manual mascarava justamente a janela agendada que furou.

**[V] Provado no caso real:** rodado em 17/07, **falhou** com
*"robo-inter teve apenas 2 execucao(oes) AGENDADA(s) bem-sucedida(s) nas ultimas 24h;
esperado 3"* — detectando sozinho o incidente das janelas engolidas.

**Limite conhecido — [P] em aberto.** Se o agendador engolir o **próprio heartbeat**,
ele não avisa. Não tem solução dentro do GitHub Actions: precisa de um pinger externo
(Healthchecks.io / cron-job.org / UptimeRobot) fazendo dead-man switch. **Pendente.**
O cadastro da conta externa é do Diego — o Claude não cria conta.

## 15.1 Backlog Inter+Itaú zerado por API — **[V] 17/07**

Varredura de **nov/2025 a jul/2026**, mês a mês, agrupando por `cDataInclusao` (ver 10.1-b).

| | Movimentos | Valor |
|---|---|---|
| Encontrados `Não conciliado` | 111 | R$ 53.595,79 |
| **Conciliados por API** | **106** | **R$ 38.881,96** |
| Exceções reais | 5 | R$ 14.713,83 |

*(102 na 1ª passada + 4 do DIA BRASIL, resolvidos depois — ver 15.2.)*

**Critério de "casa exato"** (o mesmo de julho, 127/127 sem uma falha):
`nCodBaixa` existe · a baixa está **na mesma conta** do movimento · `dDtConcilia` vazio ·
título `RECEBIDO` · **exatamente uma** baixa para aquela NF naquela conta.

**As 9 exceções — e por que cada uma é legítima:**

| Caso | Valor | Motivo |
|---|---|---|
| Inter 27/04 · s/ NF | R$ 13.702,94 | `Crédito em Conta Corrente` — **não é baixa de título**, não tem `codigo_baixa`. Pelo porte e origem, provável **antecipação UY3** → regra 6.3: nunca automatizar por extrato. |
| DIA BRASIL · NF 30336 ×2 | R$ 1.341,25 cada | Mesma NF, mesmo valor, **2 movimentos e 2 baixas**. Não há como saber qual baixa pertence a qual movimento. |
| DIA BRASIL · NF 30494 ×2 | R$ 1.156,25 cada | Idem. |
| 4 créditos s/ NF | R$ 1.010,89 | `Crédito em Conta Corrente` / `de Transferência` — sem título. |

> **O DIA BRASIL é a regra do "valor repetido" pegando um caso real.** A regra dizia
> *"valor repetido = não conciliar sem a NF exata"*. Aqui **nem a NF resolve** — ela
> também se repete. É o caso em que a fila de exceção existe: conciliar chutando teria
> 50% de chance de amarrar a baixa ao movimento errado.

**Verificação (o que dá confiança, não o retorno de sucesso):** revarredura das 18
janelas → restaram 9, e são **exatamente** os 9 previstos. Soma fecha:
33.886,96 + 19.708,83 = 53.595,79. Se a conta não fechasse, algo teria escapado.

## 15.2 DIA BRASIL — a exceção que não era — **[V] 17/07**

**Como entrou na fila de exceção.** NF 30336 (2 × R$ 1.341,25) e NF 30494
(2 × R$ 1.156,25): mesma NF, mesmo valor, 2 movimentos e 2 baixas cada. Foram
classificadas como *"ambíguo — não dá pra saber qual baixa é de qual movimento"*.

**Erro 1 — a ambiguidade era imaginária.** `ConciliarRecebimento` recebe o
**`codigo_baixa`**, e cada baixa **já tem seu `nCodMovCC`**:

```
NF 30336:  baixa 2186448558 -> movimento 2186448537   (pago 12/12/2025)
           baixa 2186449203 -> movimento 2186449187   (pago 12/12/2025)
NF 30494:  baixa 2186450488 -> movimento 2186450471   (pago 19/12/2025)
           baixa 2186451083 -> movimento 2186451065   (pago 19/12/2025)
```

O vínculo baixa↔movimento **já existe no OMIE**. Não se escolhe pareamento; conciliar
as duas baixas concilia os dois movimentos. **Não existe pareamento errado possível.**

**Erro 2 — inferência sem evidência.** Ao ver `BLOQUEIO JUDICIAL` no extrato e "EM
RECUPERAÇÃO JUDICIAL" no nome do DIA, foi sugerido que uma coisa tinha a ver com a
outra. **Não tem.** São lançamentos independentes na mesma conta. Correção do Diego.

**O lastro estava no SharePoint — e fecha no centavo.** Pergunta do Diego: *"procurou na
rede SharePoint?"*. Não tinha procurado. Em `Financeiro/YASMIN/Extrato_..._dez.pdf`:

| Extrato Itaú | Valor | Baixas OMIE | Soma |
|---|---|---|---|
| `12/12/2025 RECEBIMENTOS DIA BRASIL` | R$ 2.682,50 | 2 × 1.341,25 (NF 30336) | **2.682,50** ✓ |
| `19/12/2025 RECEBIMENTOS DIA BRASIL` | R$ 2.312,50 | 2 × 1.156,25 (NF 30494) | **2.312,50** ✓ |

**O DIA credita em lote diário** — um crédito no banco, N baixas no OMIE. É o mesmo
padrão que este documento já registrava para o Itaú ("OFX do Itaú credita boleto em LOTE
diário"), e não foi reconhecido quando apareceu.

**Os 4 foram conciliados e verificados** (`Conciliado` na releitura).

> **Regra derivada (R-E7): "ambíguo no OMIE" ≠ "sem resposta".** Antes de mandar algo
> para a fila de exceção, procurar o lastro **fora** do OMIE — SharePoint
> (`Financeiro/04-Extratos`, `Financeiro/YASMIN`, `Financeiro/05-Clientes/<cliente>`),
> pastas de rede, portal do cliente. A fila de exceção é para o que **não tem** lastro,
> não para o que dá trabalho achar.
>
> **Regra derivada (R-E8): N movimentos somando 1 crédito é lote, não duplicata.**
> Quando vários movimentos de mesma NF/valor/data aparecerem, **somar antes de julgar**.
> Se a soma casa com um crédito único do extrato, está certo — é lote.

## 15.3 Santander — o passivo de R$ 555k, diagnosticado — **[V] 17/07**

**Varredura completa por `dDataLancamento`, jan/2025 → jul/2026** (19 janelas):

| | Movimentos |
|---|---|
| Total no período | **9.683** |
| **Já conciliados** | **8.567 (88%)** |
| Não conciliados | **758** |
| Líquido dos 758 | **R$ 555.338,93** |

**O gap é exatamente esta fila.** Saldo Conciliado −267.443,78 × Saldo Atual 286.845,80
= **554.289,58**. Diferença para o líquido: **R$ 1.049,35** (movimentos anteriores a
jan/2025). **Não é dinheiro sumido — é o ✓ que faltou**, agora quantificado.

**E está concentrado em 3 meses:**

| Mês | Não conc. | Valor |
|---|---|---|
| **12/2025** | 254 | R$ 200.028,10 |
| **11/2025** | 225 | R$ 282.744,31 |
| **06/2026** | 224 | R$ 139.758,46 |
| 10/2025 | 28 | −R$ 46.584,29 |
| 01/2026 | 14 | −R$ 19.677,51 |
| demais 6 meses | 13 | ~R$ 900 |

**703 dos 758 (93%) estão em nov/25, dez/25 e jun/26.** Os outros 16 meses estão
essencialmente fechados — jul/25 e set/25 com **zero** pendências em 613 e 812
movimentos. **Alguém já conciliou quase tudo; três meses ficaram para trás.**

> **Correção do que foi dito antes.** Durante 17/07 foi afirmado que o Santander tinha
> "758 não conciliados" como se fosse desordem generalizada, e que janeiro/2026 tinha
> "211 movimentos em 7 datas". **Ambos errados**, pelo mesmo motivo: agrupamento por
> `cDataInclusao` (ver 10.1-a). Janeiro tem **695 movimentos, 672 conciliados, 14
> pendentes**. O problema é 10× menor e 5× mais localizado do que o diagnóstico inicial.

**Composição dos 758** (por `cOrigem`, a ser refeita por `dDataLancamento`):
`Conta Recebida` 384 · `Conta Paga` 132 · `Débito de Transferência` 109 ·
`Débito em Conta Corrente` 17 · demais 5.

**[V] Assimetria da API — confirmada por doc e por probe:**

| Serviço | Conciliar por API? |
|---|---|
| `financas/contareceber` | **Sim** — `ConciliarRecebimento` / `DesconciliarRecebimento` |
| `financas/contapagar` | **NÃO** — a lista de métodos não tem nenhum `Conciliar*` |

Métodos do `contapagar` (doc oficial, 17/07): `AlterarContaPagar`, `CancelarPagamento`,
`ConsultarContaPagar`, `ExcluirContaPagar`, `IncluirContaPagar`, `IncluirContaPagarPorLote`,
`LancarPagamento`, `ListarContasPagar`, `UpsertContaPagar`, `UpsertContaPagarPorLote`.
Existe `conciliar_documento` no **momento da baixa** (`LancarPagamento`), não para baixa
já feita.

> **⚠️ Armadilha aritmética — conciliar só os recebimentos PIORA o KPI.**
> Conciliar os 384 `Conta Recebida` por API levaria o Saldo Conciliado de −267.443,78
> para ~+793.125, contra Saldo Atual de 286.845,80 — o gap **inverte de sinal** e vira
> −506k, exatamente o peso dos pagamentos deixados para trás. **Meia conciliação não é
> meio caminho andado: é o erro trocando de lado.** R e P têm de fechar juntos, no mesmo
> período.

## 16. Inventário de OFX — **[V] 17/07**

- **Jan–Jun/2026:** 25 arquivos nas pastas conectadas (`01- Janeiro` … `06- Junho`),
  Inter / Itaú / Santander / Cora / UY3. Confirmado por `DTEND` interno: **param em 30/06**.
- **Julho:** subido pelo Diego em 17/07 (Inter, Itaú, Santander).
- **Santander no OMIE:** arquivo importado cobrindo **17/06 a 16/07**, 373 registros.

**Regra:** OFX é insumo de **lastro**, não de baixa. Serve para provar que o crédito
existe no banco antes de conciliar.

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

---

# Parte II — Histórico operacional (ex-`Regras_Sistema_Conciliacao.md`)

> Absorvido integralmente em 17/07 (v2.1). É **memória de execução**: casos reais,
> repertório por cliente, decodificações e fechamentos dia a dia.
> A Parte I acima é a regra vigente e **prevalece** em caso de conflito.
> Mantido na íntegra de propósito — foi a metade da memória que faltou em **E2**.

Documento vivo. Atualizado conforme decidimos, durante a execução.

### Visão (o objetivo final)
Um sistema **operado pela funcionária do financeiro**, onde ela sobe os extratos e documentos, o sistema sugere as baixas e ela acompanha/aprova. **Não pode depender do Claude nem do Diego** para rodar no dia a dia.

### Regras de conciliação (decididas até agora)

00. **O OMIE É A MATRIZ DE REFERÊNCIA.** O que "falta conciliar" vem SEMPRE da tela do OMIE (coluna Situação = "Não Conciliado"), nunca de uma lista externa. Fontes (boletos, extratos, portal) são só **referência de conferência por NF**. Motivo: o status de conciliação não existe na API — só na tela. Erro que gerou esta regra: montei uma "lista de conciliação" a partir só do relatório de boletos pagos (sem checar o status no OMIE) e itens já conciliados (ex.: NF 34156) apareceram como pendentes.

0. **CICLO COMPLETO (objetivo).** Uma baixa só está "feita" quando as DUAS etapas ocorrem:
   - (1) **Baixa/recebimento do título** (`LancarRecebimento`) → título vira RECEBIDO e gera o movimento na conta corrente;
   - (2) **Conciliação bancária** → casar esse movimento com a linha do **extrato importado**, deixando o movimento como "Conciliado".
   ⚠️ Baixa ≠ conciliação. Fazer só a (1) deixa o movimento como "Não Conciliado" — não é o objetivo.

1. **Chave de casamento = Nota Fiscal (NF).** Não usar valor sozinho nem o CNPJ do extrato:
   - o CNPJ que paga costuma ser a antecipadora/confirming, não o cliente do título;
   - a data da baixa no OMIE é a data de processamento do operador, não a do dinheiro.

2. **Cada canal tem sua fonte-NF:**
   - **Boleto** → relatório de boletos pagos (a coluna "Seu Número" = NF).
   - **Antecipação** → export "operacoes" do portal (SPROUT/UY3): NF, valor bruto, deságio, valor antecipado.
   - **Direto (PIX/TED)** → extrato do banco + CNPJ do pagador.

3. **Fórmula da baixa:** `valor recebido + desconto = valor do título`.
   - Boleto pago integral → desconto 0.
   - Antecipação → desconto = deságio (+ desconto comercial/devolução, quando houver).

4. **Conta corrente — REGRA FIRME:** só preencher a conta da baixa **quando houver o vínculo comprovado do recebimento** (o crédito identificado no extrato daquela conta). **Sem vínculo, não se define a conta e a baixa fica em espera — nunca chutar.**
   - ⚠️ NÃO usar o `id_conta_corrente` do título como conta de recebimento — ele é só a conta *prevista*, não a real (ex.: o Mambo não recebe no Banco Inter, embora o título dissesse isso).
   - O vínculo vem do cruzamento: fonte-NF (identifica NF + valor + desconto) **+** crédito no extrato (identifica a conta e a data reais).
   - Exceção já confirmada: boleto → Itaú (o retorno do boleto já é o vínculo).

5. **Autorização (escrita é irreversível):** toda baixa é validada por um humano antes de enviar. Na fase de teste, **uma a uma**. Nunca reprocessar em lote sem pausa (limite OMIE: 240 req/min, 4 simultâneas).

6. **Rastreabilidade (padrão de observação) — formato claro e rotulado.** Toda baixa preenche o campo `observacao` com rótulos em linhas separadas:
   ```
   Boleto: <nosso número>
   NF: <número da NF>
   ```
   - Ex. do R$ 160: `Boleto: 1040` / `NF: 35598`.
   - Antecipação (sem boleto): `Boleto: -` / `NF: <NF>` (ou a origem no lugar do boleto).
   - O robô já nasce preenchendo assim.

7. **Período contábil fechado:** se o mês estiver bloqueado no OMIE, não baixar — enfileirar e alertar quem reabre.

8. **Sincronização:** manter uma base própria sincronizada de forma incremental; não re-varrer o histórico do OMIE (a API é lenta e sem filtro de data).

### CORREÇÃO IMPORTANTE — a conciliação TEM API de escrita (12/07)
Revisando a documentação oficial do serviço `financas/contareceber`, a conciliação **existe como método de API** — a conclusão anterior ("não tem API") estava errada.
- **`ConciliarRecebimento`** — concilia o recebimento. Entrada: `{ codigo_baixa }` (o mesmo código que `LancarRecebimento` retorna) ou `codigo_baixa_integracao`. É o equivalente por API ao clique no ✓ (conciliação manual do movimento).
- **`DesconciliarRecebimento`** — desfaz a conciliação (mesma entrada). Rollback por API.
- **Ainda melhor:** `LancarRecebimento` aceita `conciliar_documento: "S"` → **baixa + conciliação em uma única chamada atômica**. E `IncluirContaReceber`/`UpsertContaReceber` aceitam `baixar_documento:"S"` + `conciliar_documento:"S"`.
- **Consequência:** o **ciclo completo passa a ser 100% via API** — sem cliques na tela, sem risco de clicar no ✓/lápis errado e desconciliar. Mais seguro e determinístico.
- Continua valendo: a integração bancária (Itaú/Santander/Bradesco/Caixa) também auto-concilia por conta própria; onde ela já concilia, não precisamos agir.

#### (Histórico) Conclusão anterior — substituída pela seção acima
Antes acreditávamos que a conciliação só existia na tela (clique no ✓) ou pela integração bancária. Mantido só como registro do aprendizado.

### Caminho B — como a conciliação é feita na tela (mapeado no R$ 160)
Tela: Finanças → Conciliar Contas Correntes → "Movimentação da Conta Corrente" (escolher a conta e o período).
- Cada movimento tem status **Conciliado** (✓ preto) ou **Não Conciliado** (⚠ vermelho).
- Para conciliar um movimento "Não Conciliado": **1 clique no ícone ✓ (verde ao passar o mouse)** na coluna Opções da linha. Ele vira **Conciliado na hora** — é a "conciliação manual" do OMIE (não exige importar OFX). Ação reversível (desconciliar).
- ⚠️ Atenção: esse clique **commita direto**, sem tela de confirmação. No robô, a confirmação humana tem que vir ANTES do clique.
- Observação: a conciliação manual marca o movimento como conciliado sem necessariamente casar com uma linha específica do extrato importado. Se o objetivo for o match "de verdade" com o OFX, aí sim é o fluxo de Importar Extrato + auto-match.

#### Casos de repertório (conciliação confirmada por NF)
| # | NF | Cliente | Valor | Como foi confirmado | Status |
|---|----|---------|-------|---------------------|--------|
| 1 | 35598 | Le Mellow Jazz | 160,00 | boleto pago (único) | Conciliado ✅ |
| 2 | 35781 | Six Street Burger | 319,90 | boleto pago (cliente+valor únicos) | Conciliado ✅ |

Regra reforçada: só conciliar quando cliente+valor (ou a NF) forem **únicos** entre os boletos pagos. Valor repetido (ex.: 3 boletos de R$276) = NÃO conciliar sem a NF exata.

#### Título de referência (R$ 160 — NF 35598) — CICLO COMPLETO ✅
- Baixa (API `LancarRecebimento`) → título RECEBIDO (cód. baixa 2297471366).
- Conciliação (clique no ✓ na Movimentação) → movimento **Conciliado**.
- É o nosso modelo ponta a ponta do Caminho B.

### CORREÇÃO: a conciliação TEM API (via ListarExtrato) — descoberta 12/07
Endpoint `financas/extrato/ListarExtrato` retorna, por movimento, tudo o que precisamos — de forma confiável e em escala:
- `cSituacao` = **Conciliado / Não Conciliado** (o status que eu achava que era só tela!)
- `cDocumentoFiscal` = **NF** · `cNossoNumero` = **número do boleto** · `cObservacoes` = observação · `cDocCliente` = CNPJ · `nValorDocumento`, `dDataLancamento`, `dDataConciliacao`, `nCodLancamento`, `cNatureza` (R/P).
- Consequência: a **lista real de "Não Conciliado" sai por API, já com a NF** → casamento seguro por NF, sem raspar tela. (O `financas/mf/ListarMovimentos` NÃO tinha esse campo; o `extrato` tem.)
- A regra "OMIE é a matriz" continua: a fonte da verdade é o `cSituacao` do OMIE — agora lido por API.

### Observação / rastreabilidade — onde o texto fica (descoberta 11/07)
- A observação passada na **baixa** (`LancarRecebimento` → `observacao`) NÃO aparece no campo observação do **título** (fica no **movimento** da conta corrente).
- `AlterarContaReceber` só com `observacao` retorna sucesso mas **não altera** a observação do título (RECEBIDO) — sem efeito colateral (valor/status/NF intactos).
- Conclusão prática: o texto **"Boleto: / NF:"** deve ser gravado **no momento da baixa** (`LancarRecebimento.observacao`) — é onde fica e é o que o robô vai preencher.
- ⚠️ NÃO editar a observação depois clicando no grid: o lápis e o ✓ ficam a ~14px; num teste, o clique errado **desconciliou** o R$ 160 (corrigido na hora). Regra: o robô grava a observação na baixa (API); **nunca** editar campos do movimento clicando na tela.

### Backlog de conciliação — por que NÃO dá para limpar "no olho" (descoberta 11/07)
Ao verificar os "Não Conciliado" visíveis contra o relatório de boletos pagos:
- SIX STREET 319,90 = pago ✓ · LEJAZZ MELLOW 192 = NÃO consta pago ⚠ · LEJAZZ IGUATEMI 425 = NÃO consta pago ⚠ · LEJAZZ MELLOW 276 = ambíguo (3 boletos de R$276).
- **Conclusão:** conciliar pela tela (cliente + valor) é inseguro — valor engana, alguns nem estão pagos, o status de conciliação não vem pela API e a NF não aparece no grid.
- **Regra:** só conciliar com casamento **por NF** (NF do movimento ↔ NF da fonte de pagamento). Sem isso, não há "100% de certeza". → Limpar o backlog com segurança é tarefa do robô (que rastreia NF↔movimento), não de cliques manuais no grid.

### Qualidade de dados observada (a corrigir na origem)
- **GPA:** a coluna NF vem "#N/A" em muitos títulos (erro de fórmula) — só 8 de 51 puderam ser cruzados. Corrigir na planilha de origem.
- **Sonda:** mistura títulos "P1" (viram NF) com "P3" (numeração 156xxx, outra coisa) — só os P1 casam.
- Cada rede muda o layout (Carrefour teve 4 formatos em 5 meses) — o leitor precisa ser tolerante.

### Achado estrutural — OFX do Itaú credita boleto em LOTE diário (12/07)
Cruzamento dos créditos dos OFX do Itaú (abr/mai/jun, 159 créditos) contra os 90 Não Conciliado, por valor+data:
- **0 casamentos exatos** e **48 sem nenhum crédito no valor**. Motivo: o Itaú credita os boletos como **um lançamento diário agregado** — "BOLETO RECEBIDO DD/MM" = soma de todos os boletos do dia (ex.: 24/06 = R$ 1.228,63; 01/06 = R$ 319,00 quando só teve 1). O boleto individual **não** existe como linha no extrato.
- Já **PIX/antecipação vêm individualizados** (ex.: "PIX RECEBIDO SPROUT 09/06 = 43.000", "PIX BR FINANCIAL = 1.210,80"). Para esses canais o OFX serve para casar 1:1.
- **Consequência (importante):**
  - **Importar OFX não concilia boleto individual** (não há linha 1:1) e ainda cria a linha do lump diário → risco de duplicidade. OFX **não é** o caminho para os boletos.
  - O que concilia boleto individual é a **integração de boletos do Itaú** (casa cada título ao lump via retorno CNAB) — foi ela que auto-conciliou jan–mar (obs "Recebimento automático a partir da integração com o Itaú | BOLETOS RECEBIDOS").
  - As 47 seguras estão "Não conciliado" porque foram **baixadas fora da integração** (manualmente / por nós; obs "Boleto:/NF:"). Para elas, o correto é a **conciliação manual (✓ na tela)** — que marca conciliado sem precisar de linha do extrato nem de codigo_baixa — OU deixar a integração de boletos processá-las.
  - ⚠️ Não misturar os dois mecanismos na mesma conta sem cuidado: conciliar manualmente as baixas individuais **e** depois trazer o lump diário do OFV/integração = dinheiro contado em dobro. Escolher **um** mecanismo por conta.
- OFX serve bem para: conciliar o **lump diário de boletos** (1 linha) e os **PIX/antecipação individuais** (Souza Cruz, Cencoderma, SPROUT/UY3, BR Financial, etc.).

### Landscape completo — Não Conciliado por conta (12/07, todas as contas)
Varredura por API (`ListarExtrato`, só recebimentos, jan–jul/2026):
| Conta | nCodCC | Não Conciliado | Valor | Concentração |
|-------|--------|----------------|-------|--------------|
| Itaú Unibanco | 1973103311 | 89 (era 90, -1 conciliado) | ~R$ 30.402 | jun/jul |
| Santander | 1973114603 | 121 | R$ 350.840 | junho (111) |
| Cora | 2275013231 | 14 | R$ 126.661 | abr/mai (tickets grandes — Zona Sul) |
| UY3 (Soc. Crédito) | 2191851961 | 76 | R$ 90.309 | tudo em maio |
| Banco Inter | 1972977169 | 14 | R$ 2.863 | espalhado |
| **Total** | | **~314** | **~R$ 601.075** | |
Outras contas: Omie.CASH 1969453687, UY3(CG) 2241769932, Adiantamento de Cliente 2087788900.
Observações: Santander explode em junho (Souza Cruz/Cencoderma/Carrefour vêm daí); Cora poucos itens mas alto valor; UY3 é antecipação (maio). Prioridade continua Itaú → depois Santander.

### Pente fino dos 47 ALTA — análise de colisão (12/07)
Grupos "mesmo valor + mesmo dia" entre os Não Conciliado do Itaú = 9. Cruzando com os 47 ALTA:
- **Só 1 grupo afeta os 47:** R$ 255,92 em 02/07 → NF **36130 (Caique César)** + NF **36233 (Thiago Lima)** — ambos são alvos. Risco baixo: conciliar as duas linhas e verificar cada NF por API depois.
- As outras 8 colisões são entre os "sem boleto" (Hirota 279,74 e 226,16 e 93,06; Caique 319,90; Maria Clara 100; Shopper 109,35) — **não entram nos 47**, então não afetam a lista de ataque.
- **Conclusão:** os 47 estão praticamente livres de risco de clique ambíguo. Procedimento por item: base por API → clique no ✓ → verificação por API do NF exato. Para a dupla 36130/36233, conciliar ambas e conferir as duas NFs.

#### Observação "Boleto:/NF:" em baixas antigas — DÁ para gravar por API (descoberta 13/07)
`financas/contacorrentelancamentos/AlterarLancCC` grava a observação no **movimento** (campo `detalhes.cObs`), mirando pelo **`nCodLanc`** (código do movimento, único). Validado no 35875 e no bloco 24/06:
- Preserva categoria/valor/cliente (echo do `ConsultaLancCC` antes) e **NÃO desconcilia**.
- Nosso número vem do `cNossoNumero` do extrato → obs = `Boleto: <nossoNumero> / NF: <NF>`.
- Consulta pode vir em cache (obs aparece vazia) — confirmar pela leitura do **mês inteiro** no extrato.
- Fluxo por item do backlog legado: **(1) gravar obs por API (AlterarLancCC, preciso) → (2) conciliar pelo ✓ na tela → (3) verificar por API**.
- ⚠️ A sessão da TELA do OMIE (gestão) cai sozinha às vezes ("conexão encerrada — Reconectar"); as chamadas de API não são afetadas. Reconectar e reabrir Conciliar Contas Correntes.

Log de conciliação (✓ na tela, verificado por API):
| NF | Cliente | Valor | Data | Obs (Boleto/NF) | Conciliado |
|----|---------|-------|------|-----------------|-----------|
| 35875 | Le Jazz Boulangerie | 319,00 | 03/06 | ✅ (109/00001103-0) | ✅ 12/07 |
| 35646 | Le Mellow Jazz | 308,00 | 24/06 | ✅ (109/00001070-1) | ✅ 13/07 |
| 35648 | Le Jazz Bar | 223,00 | 24/06 | ✅ (109/00001072-7) | ✅ 13/07 |
| 35663 | 5M Comércio | 201,73 | 24/06 | ✅ (109/00001073-5) | ✅ 13/07 |
| 35664 | 5M Comércio | 305,47 | 24/06 | ✅ (109/00001074-3) | ✅ 13/07 |
| 35665 | 5M Comércio | 209,14 | 24/06 | ✅ (109/00001075-0) | ✅ 13/07 |
| 35667 | 5M Comércio | 512,29 | 24/06 | ✅ (109/00001077-6) | ✅ 13/07 |

| 35264 | Alme Nutrição | 179,96 | 25/06 | ✅ (109/00000994-3) | ✅ 13/07 |
| 35647 | Le Jazz Boulevard | 404,00 | 25/06 | ✅ (109/00001071-9) | ✅ 13/07 |
| 35263 | Ana Livia Rosinha | 749,85 | 25/06 | ✅ (109/00000993-5) | ✅ 13/07 |
| 35325 | 5M Comércio | 491,17 | 25/06 | ✅ (109/00001003-2) | ✅ 13/07 |

| 35692 | Le Jazz Higienópolis | 319,00 | 26/06 | ✅ (109/00001082-6) | ✅ 13/07 |
| 35934 | Filipe Tadeu (Dom Capuchon) | 319,90 | 26/06 | ✅ (109/00001108-9) | ✅ 13/07 |
| 35687 | Famiglia Nino (Cozinha Nino) | 2.280,00 | 26/06 | ✅ (109/00001078-4) | ✅ 13/07 |

| 35739 | Cumbuca Boa | 979,00 | 29/06 | ✅ (109/00001083-4) | ✅ 13/07 |
| 35784 | Le Jazz Bar | 117,00 | 29/06 | ✅ (109/00001091-7) | ✅ 13/07 |
| 35742 | Le Jazz Boulangerie | 191,00 | 29/06 | ✅ (109/00001086-7) | ✅ 13/07 |

| 36042 · 36085 · 35801 · 35825 · 35823 · 35821 · 35822 | RDC/Coxinha/Cumbuca/5M×4 | — | 01/07 | ✅ (7/7) | ✅ 13/07 |

| 36086·36130·36233·36084·35471·35513 | Garagem/Caique/Thiago/Iapo/AnaLivia/5M | — | 02/07 | ✅ (6/6) | ✅ 13/07 |

**Progresso: 30/47 conciliados** (+ 02/07, 6/6). **Dupla 36130/36233 (255,92) conciliada OK** — cada NF confirmada por API; na tela os nomes eram distintos (Caique vs Thiago). Restam 17: 03/07(3), 06/07(2), 07/07(3), 08/07(4), 09/07(2), 22/06(1: 35574), 23/06(1: 35597), 02/04(1: 33151).

| 35872·35874·35873 | Le Jazz Bar/Boulevard/Higienópolis | — | 03/07 | ✅ (3/3) | ✅ 13/07 |

**Progresso: 33/47.** Restam 14: 06/07(2), 07/07(3), 08/07(4), 09/07(2), 22/06(1: 35574), 23/06(1: 35597), 02/04(1: 33151).

| 35786·35932 | Famiglia Nino · Le Mellow | — | 06/07 | ✅ (2/2) | ✅ 13/07 |

**Progresso: 35/47.**
- **Desvio 4 (importante) — linha "Atrasado"/"Previsto" na grade:** em 06/07 apareceu uma 3ª linha (NF 36202, 319,90) com status **"Atrasado"** na tela = **`cSituacao "Previsto"`** por API (previsão de recebimento, NÃO baixada). **Não é alvo, não clicar.** A checagem por API (filtrar `cSituacao === "Não conciliado"`) já a excluiu — validou a trava. Regra reforçada: **só clicar linhas que a API confirmou como "Não conciliado" E cujo valor está na lista de alvos.**
Restam 12: 07/07(3), 08/07(4), 09/07(2), 22/06(1), 23/06(1), 02/04(1).

| 35977·35974·35978 | Terraço/5M/Le Jazz Hig. | — | 07/07 | ✅ (3/3) | ✅ 13/07 |

**Progresso: 38/47.** Restam 9: 08/07(4), 09/07(2), 22/06(1: 35574), 23/06(1: 35597), 02/04(1: 33151).

| 36017·36018·36019·36021 | 5M ×4 | — | 08/07 | ✅ (4/4) | ✅ 13/07 |

**Progresso: 42/47.** Restam 5: 09/07(2), 22/06(1: 35574), 23/06(1: 35597), 02/04(1: 33151).

| 36314·35666 | L'Arca · 5M | — | 09/07 | ✅ (2/2) | ✅ 13/07 |  (linha "Atrasado" Cumbuca 1.691 = Previsto, ignorada — Desvio 4)

**Progresso: 44/47.** Restam 3 avulsos: 22/06 (35574 · 276), 23/06 (35597 · 425), 02/04 (33151 · 1.599,80).

| 35574 | Le Mellow Jazz | 276,00 | 22/06 | ✅ (109/00001037-0) | ✅ 13/07 |
| 35597 | Le Jazz Boulevard | 425,00 | 23/06 | ✅ (109/00001039-6) | ✅ 13/07 |
| 33151 | Famiglia Nino | 1.599,80 | 02/04 | ✅ (sem nosso número) | ✅ 13/07 |

### ✅ CONCLUÍDO — 47/47 conciliados (13/07)
Todos os 47 títulos ALTA do Itaú conciliados e verificados por API, cada um com observação "Boleto/NF". Total **R$ 21.497,86**.
- **Desvio 5 — vizinho não-alvo do mesmo cliente:** 22/06 tinha 2 Le Mellow (276 alvo + 192 NÃO-alvo, NF 35818). Conciliei só a de 276; a de 192 seguiu Não Conciliado. Prova da trava por valor.
- **Desvio 6 — item sem nosso número:** NF 33151 (Famiglia Nino) não tinha `cNossoNumero` no movimento → observação "Boleto: - / NF: 33151". (Melhoria robô: quando faltar nosso número, buscar via `ObterBoleto` pelo nCodTitulo.)
- **Desvio 7 — Período da tela ≠ filtro de data:** 02/04 está fora de "Últimos 60 dias"; foi preciso trocar Período para "Período específico" (01–05/04) para a data aparecer. Regra: ajustar o Período antes do filtro de data para meses antigos.
- **Desvio 8 — janela de 1 dia no ListarExtrato é instável** (às vezes volta vazia) → usar janela do mês; senão o nosso número vem "-" e a observação sai errada (aconteceu e foi corrigido).

#### Método por bloco (padrão) + desvios/aprendizados
Padrão validado: (1) gravar observação por API nos alvos do dia; (2) **checar por API quantos "Não conciliado" existem naquele dia** (garante que só os alvos serão clicados; se aparecer não-alvo, não clicar nele); (3) filtrar a grade por data; (4) clicar os ✓ dos alvos (✓ em x≈1376; linhas em y≈220,246,272,298,324,350); (5) verificar por API.
- **Desvio 1 — nome na tela ≠ nossos dados:** a grade mostra o **nome fantasia/unidade** ("05 BEM BARATO", "14 Taboão", "LEJAZZ IGUATEMI", "16 Baeta Neves") enquanto nossos dados têm a razão social ("5M Comércio", "Le Jazz Boulevard"). Por isso o casamento é por **valor + NF via API**, nunca por nome na tela. (Melhoria p/ o robô: mapear fantasia↔razão↔NF.)
- **Desvio 2 — baixas antigas sem observação:** todas as baixas legadas vinham com `cObs` vazio; agora preenchidas via API.
- **Desvio 3 — sessão da tela cai:** já ocorreu 1x; reconectar não afeta API.
- **Padrão observado (17 itens, blocos 24–29/06):** em todos os dias feitos, **100% dos "Não conciliado" do dia eram nossos alvos** (nenhum item de fora) e a verificação por API bateu 100%. Reassegurador, mas **não garantido** — manter a checagem por API antes de cada bloco.
  - ⚠️ Onde o padrão pode quebrar: **02/07** (dupla 36130/36233, mesmo valor 255,92 — clicar as duas e conferir cada NF) e dias com **Hirota / itens "sem boleto" (antecipação BR Financial)**, que podem trazer "Não conciliado" que NÃO são alvos → clicar só os valores da nossa lista, nunca todos.
- **Melhoria aplicada:** registrar no log o **nosso número do boleto** de cada item (já gravado na observação) — base do ledger do robô e do cruzamento anti-duplo-uso (NF ↔ nosso número ↔ movimento).

### Integridade — travas contra duplo uso / valor repetido (regra 12/07)
Pergunta do Diego: garantir que um recebimento não seja baixado com 2 NFs (valores se repetem muito). Travas, em camadas:

1. **Chave = NF, nunca valor.** Valor repetido não decide nada. É o que mata a confusão de R$ 319 x vários clientes. (Já é a regra 1.)
2. **Cada título (NF) baixado no máximo 1x.** Antes de baixar, ler o status (`ConsultarContaReceber`): se já RECEBIDO, pula. Baixa nova usa **chave de integração** própria → reenvio não duplica.
3. **Cada crédito do banco consumido no máximo 1x.** Usar o **`FITID` do OFX** (id único da transação no banco) como chave: um ledger nosso marca o FITID como "consumido" e não deixa reusar em outra NF.
4. **Topologia do crédito importa:**
   - **Direto (PIX/TED individual):** 1 crédito ↔ 1 NF. Trava = FITID consumido + NF única.
   - **Boleto em lote / antecipação (BR Financial, SPROUT):** 1 crédito ↔ **N NFs**. Aqui NÃO se força 1:1; a trava é **conservação**: soma das NFs alocadas ≤ valor do crédito, e **nenhuma NF entra em dois lotes**. Sobra/diferença é sinalizada para humano.
5. **Automação do ✓ na tela:** identificar a linha **pelo NF / código do movimento (único)**, nunca pela posição ou valor. Se houver duas linhas de mesmo valor no dia, o alvo é sempre o `nCodLancamento`/NF exato.
6. **Ledger próprio (auditoria):** registrar NF ↔ movimento ↔ crédito(FITID) ↔ baixa. É o que dá rastreabilidade e detecta/impede reuso. Complementa a observação "Boleto:/NF:".

### Casamento consolidado do Itaú (todas as fontes) — 12/07
Cruzamento dos 90 Não Conciliado contra boletos pagos (NF) + lotes diários + PIX/antecipação do OFX (abr–jun):
- **47 Boleto** confirmados por NF → conciliar pelo ✓ (confiança ALTA).
- **24 Hirota** → CORREÇÃO (Diego 12/07): a Hirota é **antecipada via BR Financial**, não é boleto. Casa pelos créditos "PIX RECEBIDO BR FINANCIAL" do OFX, pela lógica de antecipação (deságio). Precisa do **export de operações da BR Financial** (NF + valor bruto + deságio + líquido), igual SPROUT/UY3 — não do relatório de boletos. Conta de recebimento: Itaú (onde o BR Financial credita).
- **19 Indefinidos** → não estão no relatório de boletos que temos e não batem com PIX individual (BAIXA). São clientes de restaurante — provavelmente boletos **fora do relatório atual**.
- **Diagnóstico central:** o que trava o casamento 100% não é o método, é **completude de dados**. Falta o **relatório COMPLETO de boletos pagos** (com NF/nosso número) cobrindo Hirota + os 19; e o **OFX de julho** (27 títulos).
- Canais vistos no OFX do Itaú: boleto em lote diário; antecipação SPROUT e BR Financial (PIX individual); DIA Brasil (recebíveis); poucos PIX diretos de cliente (QR).
- Entregue em `Conciliacao_Itau_casamento.xlsx` (worklist dos 90 por canal/fonte/ação/confiança + resumo).

### Hirota — análise do arquivo de operações (13/07)
Arquivo: `Financeiro/05-Clientes/Hirota/Operações 100% livre - dez-junho (1).xlsx` (aba "Listagem de Fluxo Simplificado"). Colunas: Cliente(antecipadora), Sacado, Nota(NF), Vcto, Valor(bruto), Borderô(lote), Data da operação.
- **Antecipadora = SPROUT HOLDINGS (100%)**, NÃO BR Financial (contraria a premissa do Diego — CONFIRMAR). Sacado = Supermercado Hirota. 94 NFs, 15 borderôs, operações 03/03–01/06, **bruto R$ 42.892,26**.
- Cruzamento das 94 NFs × extrato Itaú (OMIE): **93 achadas** (baixadas), **1 não achada (35191)**.
  - **69 já conciliadas**; **24 não conciliadas**.
  - Dos 24 não conciliados: **22 com valor batendo exato ops×OMIE = SUBCONJUNTO SEGURO, R$ 4.682,82** → conciliar (mesmo método dos 47; já estão baixados, falta só conciliar).
  - 2 não conciliados com **diferença de centavos**: 33408 (ops 22,95 / omie 22,65) e 35188 (ops 173,71 / omie 174,11) → investigar (arredondamento/ajuste).
  - **35191** (ops 279,74): não aparece no Itaú → investigar (outra conta? não baixado?).
- **O arquivo NÃO traz deságio/líquido.** Os títulos estão baixados no valor bruto; se o deságio precisa ser registrado contabilmente, é questão à parte (contador). O crédito da SPROUT no Itaú vem em PIX agregando vários clientes (difícil casar borderô↔PIX 1:1).
- **Veredito:** frente **segura para os 22** (valor idêntico ops×OMIE, baixados, não conciliados). Antes de rodar: confirmar SPROUT×BR Financial. Investigar os 3 anômalos (33408, 35188, 35191).
- NFs seguras (22): 33369,33371,33409,33410,33411,33412,34808,34809,34810,34811,34856,34857,34858,34948,34949,34950,34951,34952,34953,34954,35189,35192.

#### ✅ Hirota conciliado — 21/21 (13/07)
Conciliados 21 dos 22 seguros (o 34954 não apareceu no extrato abr–mai → investigar). Observação de antecipação gravada ("Antecip. SPROUT Bord. <n> / NF: <nf>"). **Todos os 7 não-alvos ficaram intactos** (33408, 34942, 34965, 34969, 34987, 35188, 35426 seguem Não conciliado) — validou a trava mesmo com 5× R$ 279,74 no mesmo dia (18/05).
- Por dia: 01/04 (6), 12/05 (3), 14/05 (2), 18/05 (7), 25/05 (2), 29/05 (1) = 21.
- **34954 resolvido:** estava baixado em **03/06** (não 18/05 do borderô); conciliado → **22/22 seguros da Hirota concluídos.**
- **Anômalos restantes (NÃO conciliados, aguardam decisão):**
  - **33408** (ops 22,95 / omie 22,65) e **35188** (ops 173,71 / omie 174,11) — diferença de centavos entre a operação SPROUT e o valor no OMIE. Baixos, mas não batem exato → revisar (arredondamento? ajuste de devolução?).
  - **35191** (ops 279,74) — **não existe no extrato do Itaú** (mar–jul). Título não baixado, cancelado/substituído, ou em outra conta → investigar na origem.
  - **Confirmar antecipadora SPROUT × BR Financial** com o Diego (o arquivo diz SPROUT 100%).

### Varredura segura multi-conta (13/07) — fonte-mestra pronta, cross pendente de API
- **Fonte-mestra de valores confirmados** montada em `master_source.json`: **1.675 NFs** com valor + origem. Cobertura: boletos pagos (481), Hirota (94), GPA (`GPA Baixa.xlsx`, ~967 linhas), Mambo (134). Sonda pendente (parser estourou o tempo — bônus). Só **1 conflito de valor** entre fontes (NF 34671).
- **Método da varredura:** para cada conta (Santander, Inter, Cora, UY3, Itaú restante), puxar os "Não conciliado" do OMIE e cruzar por **NF + valor exato** contra a fonte-mestra. Onde bate exato → **seguro para conciliar** (zero risco). Divergência/ausência → não age.
  - Segurança intrínseca: valor errado na fonte no máximo faz "não casar" (nunca concilia errado).
- **RESULTADO da varredura (13/07, API voltou):** 267 Não Conciliado nas 5 contas (148 com NF, 119 sem NF = PIX/TED direto). Cruzados por NF+valor:
  - **SAFE = 50 itens · R$ 20.416,28** (`safe_list_multiconta.json`): **UY3 49** (títulos GPA antecipados via UY3, registrados pelo LÍQUIDO — casaram por NF + Líquido do `GPA Baixa.xlsx`, R$ 19.637,78) + **Inter 1** (NF 33935, GPA bruto, R$ 778,50).
  - **Descoberta-chave:** UY3 grava o valor **líquido** (bruto − deságio, ratio ~0,674); casar com a coluna **Líquido** do GPA resolve com segurança. (Antes davam "valor difere"; com o líquido, batem exato.)
  - **Pendências (precisam de fonte própria, NÃO conciliar):** UY3 45 sem-fonte, Cora 13 (Zona Sul, sem arquivo), Santander 4 c/NF + 117 sem NF (PIX/TED direto — Souza Cruz/Cencoderma/Carrefour direto), Itaú 19 indefinidos.
  - Regra confirmada: onde a fonte não cobre, NÃO conciliar (risco). Fontes que destravam mais: export de operações UY3 (para os 45), Zona Sul (Cora), diretos do Santander.

### Banco Inter — fechado (13/07)
Diego subiu o OFX completo do Inter (jan–13/07, conta 70032580) + arquivo .RET (extrato CNAB, benef. SPROUT) + os `operacoes_*.xlsx` (antecipação). Inter tinha **17 pendências**:
- **✅ 4 conciliados** (crédito único confirmado no OFX do Inter, verif. API): NF 36324 (R$3, boleto), 36378 (Belfit, 233,94, PIX), 36380 (Hamburgueria, 251,94, PIX), 36376 (Grelhados, 255,92, boleto). Layout da grade do Inter é atípico e a sessão da tela cai — usar período estreito (ex.: 08–10/07) + ✓ em x≈1281.
- **⚠️ Lista de revisão (NÃO conciliar — precisam de ação do financeiro):**
  - **Maria Clara Vasconcellos — 8 baixas de R$100, mas só 5 PIX reais no extrato** → 3 baixas sem lastro (baixa a mais?). Investigar.
  - **5M 313,34 (32188) · WMB 113,43 e 312,83 (31788, 31589) · CBD/GPA 778,50 (33935):** sem crédito no OFX do Inter. Como o Inter só recebe desde julho, são baixas fev–jun na **conta errada** (Inter era "conta prevista"). Reclassificar.
  - **1 transferência UY3→Inter (R$ 606,53):** transferência interna, tratamento à parte.
- **Achado:** boletos do Inter são emitidos sob **SPROUT** (benef. no .RET). O .RET é extrato CNAB (sem NF por linha), não retorno de boleto — não ajuda a identificar por NF.

### Próximas frentes seguras — mapa de fontes por cliente (investigação 13/07)
Pasta `Financeiro/05-Clientes/` tem 13 clientes, cada um com pasta. Fontes encontradas (a receita segura da Hirota se repete: arquivo de operações → cruza NF+valor com OMIE → concilia só idênticos):
| Cliente | Arquivo-fonte | Traz deságio? | Conta provável | Backlog |
|---------|---------------|---------------|----------------|---------|
| **GPA** | `Títulos Antecipados GPA.xlsx` (Bruto/Desconto/Líquido) + `GPA Baixa.xlsx` (Data/NF/Bruto/Desc/Líq) | **SIM** | Itaú (SPROUT) | grande (446 antecip.) |
| **Sonda** | `SondaNet *.csv/xlsx` (lotes) + `Sonda 2026.xlsx` | a verificar | antecipação | médio (⚠ mistura P1/P3) |
| **Mambo** | `100%LIVRE - 2026.xlsx` + `Antecipação 30-06.pdf` | a verificar | antecipação | pequeno |
| **Carrefour** | `Carrefour_Extrato*` + `Carrefour_DescontosAberto*` (4 formatos) | parcial | Santander/antecip. | médio |
| **Souza Cruz** | pasta no SharePoint (não montada) | — | Santander (PIX direto) | parte dos 121 |
| **Cencoderma** | pasta no SharePoint | — | Santander | parte dos 121 |
| **Zona Sul** | pasta no SharePoint | — | Cora→UY3 | Cora 14 / UY3 |
| **DIA** | pasta no SharePoint | — | Itaú ("RECEBIMENTOS DIA") | parte dos 19 indef. |
| **Einstein** | `NF Entregues.xlsx` (só NFs) | não | antecipação SPROUT | — |
| Assaí / Irmãos Mufato | vazias (local) | — | — | — |

#### Plano priorizado (mais seguro → maior valor)
1. **GPA (Itaú)** — fonte mais completa (tem deságio), grande volume, mesma receita da Hirota. **Próximo recomendado.**
2. **Sonda** e **Mambo** — antecipação, arquivos existem; aplicar a mesma receita (Sonda com parser tolerante P1/P3).
3. **Carrefour** — antecipação/Santander; formatos variados, exige parser cuidadoso.
4. **Santander (Souza Cruz + Cencoderma)** — maior backlog (121); precisa montar a conta Santander (nCodCC 1973114603) no mesmo fluxo + puxar as fontes do SharePoint.
5. **DIA (Itaú)** — recebíveis diretos; resolve parte dos 19 indefinidos do Itaú.
6. **Faxina final Itaú** — os 19 indefinidos e os anômalos (33408, 35188, 35191) já mapeados.
Regra transversal: em toda frente, só conciliar quando **NF + valor batem exato** entre a fonte e o OMIE; divergência → investigar, nunca conciliar no escuro.

### Recursos da API do OMIE para segurança e garantia (investigação 12/07)
Garimpo na documentação oficial (`developer.omie.com.br` + serviços `financas/contareceber`, `financas/contareceberboleto`, `geral/anexo`). O que passamos a usar para tornar o robô mais seguro:

1. **Idempotência (chave de integração) — a mais importante.** Toda baixa/título aceita uma **chave nossa**: `codigo_lancamento_integracao` (no título) e `codigo_baixa_integracao` / `codigo_recebimento_integracao` (na baixa).
   - Definimos um ID único por operação, ex.: `BX-NF35598-20260622`.
   - Reenviar a mesma chave **não duplica** a baixa (o OMIE reconhece). Elimina o risco de baixar duas vezes se o robô repetir.
   - Permite achar/consultar o registro pela **nossa** chave e amarrar OMIE ↔ log do robô.

2. **Conciliação e desfazer por API:** `ConciliarRecebimento` / `DesconciliarRecebimento` (por `codigo_baixa`). Ciclo completo sem tela.

3. **Rollback da baixa:** `CancelarRecebimento` (por `codigo_baixa`) desfaz uma baixa errada por API. Rede de segurança para a fase de teste.

4. **Verificação pós-baixa ("confia mas verifica"):** `ConsultarContaReceber` (por `codigo_lancamento_omie` ou pela nossa chave) relê o estado real do título depois de agir. Regra do robô: **só marca "feito" depois de reler e conferir status/valor/conciliação** — nunca confia só no retorno da chamada.

5. **Comprovante na própria baixa:** campo `nsu` ("Número Sequencial Único – comprovante de pagamento") guarda o ID da transação do banco (end-to-end do PIX / nosso número do boleto) dentro da baixa.

6. **Nosso número do boleto por API:** `ObterBoleto` (serviço `contareceberboleto`) devolve `cNumBoleto`, `cNumBancario` (nosso número) e `cCodBarras` por `nCodTitulo` → preenche o "Boleto:" da observação **sem raspar relatório** (para boletos gerados no OMIE; Hirota, se emite fora, não entra aqui).

7. **Anexar comprovante ao título (auditoria):** `IncluirAnexo` (serviço `geral/anexo`) anexa o PDF do comprovante / a linha do OFX / o boleto ao título (arquivo zip→base64). Fica tudo auditável dentro do próprio OMIE.

8. **Worklist com filtros de verdade:** `ListarContasReceber` filtra por `filtrar_por_status`, `filtrar_conta_corrente`, `filtrar_apenas_titulos_em_aberto`, `filtrar_por_cpf_cnpj`, datas e `exibir_obs`. Melhor fonte para montar a fila do que o `mf`. (Status de conciliação continua vindo do `extrato/ListarExtrato`.)

#### Teste confirmado — Conciliar/Desconciliar por API (12/07)
Rodado no R$ 160 (NF 35598, `codigo_baixa` 2297471366), ciclo reversível:
- `DesconciliarRecebimento{codigo_baixa}` → `codigo_status:"0"` "Conciliação da Baixa revertida com sucesso!" → extrato passou a "Não conciliado".
- `ConciliarRecebimento{codigo_baixa}` → `codigo_status:"0"` "Baixa conciliada com sucesso!" → extrato voltou a "Conciliado" (dDataConciliacao 12/07), observação intacta.
- **Confirmado:** os dois métodos funcionam por API. O R$ 160 ficou no estado original.
- Detalhes técnicos para o robô:
  - Conta Itaú Unibanco: `nCodCC` = **1973103311**.
  - `ListarExtrato` expõe `cSituacao` ("Conciliado"/"Não conciliado"), `cDocumentoFiscal` (NF, com zeros à esquerda: "00035598"), `cNossoNumero`, `cObservacoes`, `dDataConciliacao`, `nCodLancamento`. Chaves do request válidas: `nCodCC`, `dPeriodoInicial`, `dPeriodoFinal` (NÃO existe `cExibirTodos`).
  - `nCodLancamento` (movimento) ≠ `codigo_baixa`. A conciliação usa o **codigo_baixa**.
  - ⚠️ **Atraso de leitura pós-escrita:** logo após conciliar/desconciliar, o `ListarExtrato` pode retornar em cache o estado antigo. Reler com retentativa (poucos segundos) até estabilizar; a consulta do **mês inteiro** é mais confiável que a de janela curta (janela curta às vezes volta vazia).

#### Padrão de execução seguro do robô (consolidado)
Para cada item da fila, na ordem: (a) gera a **chave de integração**; (b) `LancarRecebimento` com `desconto`, `observacao` "Boleto:/NF:", `nsu` e `conciliar_documento:"S"` (baixa + conciliação atômicas); (c) `ConsultarContaReceber` para **confirmar**; (d) opcional `IncluirAnexo` com o comprovante. Erro em qualquer etapa → `CancelarRecebimento`/`DesconciliarRecebimento` e volta para a fila com o motivo. Validação humana **antes** de (b).

### Lista corrigida — Itaú pela matriz OMIE (12/07)
Refeita seguindo a regra 00. Fonte: `financas/extrato/ListarExtrato` do Itaú, mês a mês, filtrando `cSituacao = "Não conciliado"`.
- **90 movimentos Não Conciliado** no Itaú (abr–jul), **R$ 30.562,29**. (Jan–mar = 0, auto-conciliados pela integração bancária.)
- Cruzados por **NF + valor exato** contra os boletos pagos (`target_boletos.json`, 481 NFs):
  - **47 SEGUROS** (NF casa e valor bate exatamente) → **R$ 21.497,86** → prontos para conciliar, um a um.
  - **0** com NF paga e valor divergente (bom sinal).
  - **43 SEM boleto** (NF não está no relatório de boletos) → **R$ 9.064,43** → NÃO conciliar ainda.
- Composição dos 43 sem boleto: **Hirota = 24** (falta o relatório de boletos da própria Hirota — não está na base atual) + pessoas físicas/PIX direto (Caique César, Felipe Tompson, Maria Clara, Shopper, etc.) + algumas casas que não constam pagas (Le Mellow 192, Le Jazz Higienópolis 202).
- Entregue em `Conciliacao_Itau_matriz_OMIE.xlsx` (aba "Conciliar Itau (47)" + aba "Aguardar sem boleto (43)" + "Resumo e regras").
- Substitui a antiga `Lista_Segura_Conciliacao.xlsx` (que estava errada por não checar o status no OMIE).

### Log de baixas de teste
(Preenchido conforme executamos.)

| # | NF | Cliente | Conta | Recebido | Desconto | Data | Status |
|---|----|---------|-------|----------|----------|------|--------|
| 1 | 35598 | Le Mellow Jazz | Itaú | 160,00 | 0,00 | 22/06/2026 | ✅ CICLO COMPLETO — RECEBIDO + Conciliado |
| 2 | 33577 | Carrefour | Santander | 223,47 | 445,90 | 01/04/2026 | a conferir |
| 3 | 33661 | Carrefour | Santander | 373,79 | 75,95 | 01/04/2026 | a conferir |
| 4 | 33677 | Sonda | Banco Inter | 769,56 | 90,19 | 07/04/2026 | a conferir |
| 5 | 35016 | Mambo | Banco Inter | 207,05 | 45,41 | 08/06/2026 | a conferir |
| 6 | 35017 | Mambo | Banco Inter | 223,42 | 24,83 | 08/06/2026 | a conferir |
| 7 | 35018 | Mambo | Banco Inter | 169,69 | 18,86 | 08/06/2026 | a conferir |
| 8 | 35019 | Mambo | Banco Inter | 180,37 | 31,24 | 08/06/2026 | a conferir |
| 9 | 35380 | Mambo | Banco Inter | 189,85 | 21,10 | 08/06/2026 | a conferir |

#### Regra nova aprendida na baixa #1
- A chamada `LancarRecebimento` funcionou com: `codigo_lancamento`, `codigo_conta_corrente`, `valor`, `desconto`, `juros`, `multa`, `data`, `observacao`. Retorno traz `codigo_baixa` e "Baixa executada com sucesso!".
- ⚠️ A `id_conta_corrente` do título é a conta PREVISTA, não a real (o Mambo não recebe no Inter). Conta real precisa vir do financeiro / do extrato. Só o boleto (Itaú) está confirmado.

---

### PENTE-FINO ITAÚ — fechamento (13/07/2026)

Após conciliar os 49 boletos + 22 Hirota, restaram **26 movimentos "Não conciliado"** na conta Itaú (nCodCC 1973103311), todos com NF, todos origem "Conta Recebida" (baixa já lançada no OMIE), soma **R$ 6.183,53**.

**Cruzamento feito (26 itens):**
- fonte-mestra (boleto/antecipação) por NF+valor;
- OFX Itaú completo por **valor + data** (PIX/crédito individual).

**Resultado: nenhum dos 26 tem hoje um crédito bancário casado (valor+data) na nossa base.** O backlog SEGURO do Itaú está **esgotado** — o que sobra depende de dado do financeiro.

**Reforço de regra (importante):** 7 itens casavam por **valor** (319,90 ×5 e 100,00 ×2), mas ao conferir o OFX, o único PIX de 319,90 do extrato cai em **data diferente** e não há PIX desses valores nas datas dos títulos. **Valor sozinho NUNCA basta** — confirmou-se na prática que teria gerado conciliação errada.

**Os 26 pendentes, por dependência (o que o financeiro precisa fornecer):**
- **Grupo A — Hirota (antecipação SPROUT), diferença de centavos (2):** NF 33408 (OMIE 22,65 × operação 22,95) e NF 35188 (OMIE 174,11 × operação 173,71). Precisa a SPROUT/financeiro explicar a diferença (juros/desconto) para ajustar e conciliar.
- **Grupo B — Boletos recentes 13/07, aguardando liquidação (5):** NF 35689 (Ana Livia), 36080 (Le Jazz Higienópolis), 36081 (Le Jazz Boulevard), 36083 (Le Jazz Boulangerie), 36133 (Le Mellow). Têm boleto emitido; conciliar quando aparecerem no "boletos pagos"/lote do extrato.
- **Grupo C — Recebimentos sem boleto no relatório atual (19):** restaurantes/PF (Caique ×4, Felipe ×2, Maria Clara ×2, Shopper ×2, Bruno Luques, Burger do Chapa, Brenda, O Brasileiro, Ana Livia, Giovani, Six Street, Le Jazz Higienópolis, Le Mellow). Provável PIX direto/cartão. Precisa relatório de "boletos pagos" atualizado OU identificação da forma de recebimento + linha no extrato.

Obs.: os 26 já estão baixados (recebimento lançado) no OMIE; falta apenas a **conciliação bancária**, que não fazemos sem a linha real do banco.

---

### CORA (banco 403, nCodCC 2275013231) — pendência (13/07/2026)

Conta de recebimento do **Super Mercado Zona Sul** (principal), + transferências internas UY3 e algumas entradas Americanas.
- Entradas jan–jul: 99 créditos, ~R$ 203.230. Top: Zona Sul ~R$156k, Transf UY3 ~R$33k, Americanas ~R$14k.
- **Saldo atual R$ 28.733,48 × saldo conciliado R$ 20.643,17 → GAP NÃO CONCILIADO = R$ 8.090,31** (~13 movimentos recentes).
- Particularidade técnica: a ListarExtrato dessa conta volta em **modo resumo** (sem cSituacao por linha). Para itemizar os 13 é preciso a tela "Conciliar Contas Correntes" ou o relatório do banco.
- **O que trava:** falta a fonte para casar por NF — o relatório de **recebimentos/boletos pagos do Zona Sul**. Sem ele (e sem a linha do banco identificada), não conciliamos (mesma regra dos outros bancos).
- **Frente possível de baixo risco:** as transferências internas **UY3 → Cora** podem ser conciliadas como par de transferência (igual Santander), sem depender do Zona Sul.

#### CORA — lista autoritativa (tela Movimentação, filtro Situação = Não conciliado, 01/01–13/07)
21 não conciliados (o "R$8.090" do modo-resumo NÃO era a medida certa — a tela é a fonte autoritativa). Correção: as transferências internas em aberto são **Cora → Santander** (não UY3→Cora; as UY3→Cora já estão conciliadas).

**Grupo 1 — Transferências internas Cora → Santander (4 saídas) — SEGURO conciliar como par (contra a entrada no Santander):**
-5.071,85 ; -17.089,35 ; -2.996,12 ; -12.322,93  (total -37.480,25). Tipo Pix / Saída de Transferência.

**Grupo 2 — Recebimentos Super Mercado Zona Sul (13 entradas, Receita Serviços/NFe) — depende de fonte (NF/boleto do Zona Sul):**
9.863,87 ; 3.281,05 ; 12.925,39 ; 2.996,12 ; 5.071,85 ; 17.089,35 ; 12.322,93 ; 3.727,77 ; 3.279,66 ; 18.517,90 ; 4.027,14 ; 10.932,40 ; 8.625,09  (total 112.660,52). Coluna Documento vazia = sem nosso-número no lançamento.

**Grupo 3 — Comissões Diego Gomes (3 saídas) — depende do financeiro (o que são: retirada?):**
-4.000,00 ; -13.990,00 ; -13.990,00.

**Grupo 4 — Americanas S.A (1 entrada, R$ 14.000,00, Outros) — depende de fonte.**

Obs.: 4 valores do Grupo 2 (5.071,85 / 17.089,35 / 2.996,12 / 12.322,93) coincidem com as 4 saídas Cora→Santander — provável repasse do recebido para o Santander (mesmo assim são conciliações independentes: entrada=recebimento cliente, saída=transferência).

#### CORA — tentativa de conciliar as 4 transferências (13/07): BLOQUEIO técnico
Verificado no Santander (nCodCC 1973114603): as 4 entradas de transferência vindas da Cora existem e estão "Não conciliado" (06/04 5.071,85 · 10/04 17.089,35 · 17/04 2.996,12 · 24/04 12.322,93). São transferências internas legítimas (Cora→Santander, Pix, criadas por Marcelo Nunes).
PORÉM, na tela "Conciliar Contas Correntes" (= Movimentação da Conta Corrente):
- O ✓ na coluna Opções de uma linha de TRANSFERÊNCIA abre o editor "Transferência entre Contas Correntes" (Salvar/Anexos/Excluir) — NÃO concilia.
- Selecionar a linha (checkbox) só oferece "Alterar o Lançamento" / "Excluir o Lançamento" — sem ação "Conciliar".
- Clicar no ícone de status "Não Conciliado" não faz nada.
CONCLUSÃO: a conciliação da Cora depende de **importar o extrato/OFX da Cora** ("Importar Extrato" → auto-match). Sem o arquivo da Cora (que não temos), nem as transferências podem ser marcadas conciliadas por aqui. Mesmo bloqueio de "falta fonte" — vale para TODA a conta, inclusive as transferências. Nenhuma alteração foi feita nesta tentativa.
Caminho para destravar: (a) obter/importar o OFX da Cora; ou (b) conciliar pelo lado do Santander SE o extrato do Santander estiver importado (a conciliar/confirmar).

#### CORA — busca de OFX no SharePoint (13/07): NÃO existe
Pasta Financeiro/04-Extratos (mensais, = pastas montadas): cada mês tem OFX de Inter/Itaú/Santander/UY3. **Cora não tem OFX em nenhum mês** (jan–jun; março vazio). Menções a "Cora" no SharePoint = comprovantes PIX / contraparte, não extrato.
DESCOBERTA: a conta "Cora" do OMIE (Ag 3980, Cc 13005390-1) está no nome da **SPROUT HOLDINGS** → é a conta da antecipadora SPROUT onde caem os recebimentos antecipados do Zona Sul antes do repasse ao Santander. O extrato viria do internet banking da Cora/SPROUT, por isso não está com os extratos dos bancos próprios.
DESTRAVAR CORA: baixar o OFX da conta Cora/SPROUT e (a) importar em "Importar Extrato" no OMIE, ou (b) colocar na pasta 04-Extratos para eu cruzar. Sem isso, as 4 transferências e os 13 recebimentos Zona Sul ficam pendentes.

#### CORA — extrato OBTIDO e salvo na rede (13/07)
Diego enviou o OFX da Cora (arquivo "sprout-holdings...ofx"): ORG "Cora SCD SA", banco 0403, ACCTID 62037835, 01/01–13/07 (tx reais 03/02–05/06), 61 lançamentos.
CRUZAMENTO: bate com os 21 pendentes → 4 transferências (débito "Transf Pix enviada SPROUT", 06/04·10/04·17/04·24/04), 13 Zona Sul (crédito "Transf Pix recebida SUPER MERCADO", 13/13), 3 Diego (1 boleto BTG 4.000 + 2 Pix 13.990), 1 Americanas (14.000). TODOS confirmados por valor+data.
SALVO NA REDE (pasta Financeiro/04-Extratos, convenção MM-Banco.ofx): 02-Cora.ofx(35tx), 03-Cora.ofx(6), 04-Cora.ofx(8), 05-Cora.ofx(10), 06-Cora.ofx(2) — soma 61 tx, validados. Original completo tb em outputs.
DESTRAVADO: com o extrato importado no OMIE ("Importar Extrato"), a Cora pode ser conciliada (as 4 transferências + os 13 Zona Sul por valor+data). Nota: nome da conta = SPROUT/Cora (antecipadora); ver com Diego se ag 3980/cc 13005390-1 é Santander (ele indicou) vs a conta Cora 62037835 do OFX.

#### CORA — IMPORTAÇÃO + CONCILIAÇÃO EXECUTADA (13/07)
Importado o OFX da Cora no OMIE (Importar Extrato → conta Cora). O OMIE gerou "Extrato para Conciliação" (61 linhas, 03/02–05/06) e sugeriu matches por valor+data+cliente(+NF).
CONCILIADOS por mim (via "Conciliar este lançamento", cada um verificado por NF/valor/cliente): 12 recebimentos Zona Sul (13/03, 20/03, 27/03, 06/04, 10/04, 24/04, 04/05, 08/05, 15/05, 22/05, 29/05, 05/06) + Americanas 14.000 (10/02) = **13 itens**. As entradas Zona Sul de fevereiro já vieram verdes (auto-conciliadas na importação).
RESULTADO: Cora caiu de **21 → 8 não conciliados** (verificado na tela Movimentação, filtro Não conciliado).
FALTAM 8 (deixados para revisão, NÃO forçados):
- 4 Transf. Cora >> Santander (−5.071,85 −17.089,35 −2.996,12 −12.322,93): no OFX a perna de saída aparece como "enviada SPROUT HOLDINGS" (não Santander) — o auto-match não casou o lançamento de transferência. Rever pareamento de transferência (Cora↔Santander/SPROUT).
- 3 "Comissões" Diego Gomes (−4.000 boleto BTG; −13.990 e −13.990 Pix): financeiro classificar.
- 1 Zona Sul 2.996,12 (17/04): "lançamento não encontrado" no auto-match (colisão de valor com a transferência de 2.996,12 do mesmo dia) — conciliar manualmente associando à NF correta.
ATENÇÃO: após importar, o "Saldo Conciliado" da Cora exibiu 95.197,61 (> Saldo Atual 28.733,48) — provável efeito de recomputo/duplicidade da importação; conferir se o extrato importou linhas além do saldo. As conciliações item-a-item estão corretas (cada uma casada por NF/valor/data).

#### CORA — 2ª rodada (13/07): transferências + comissões
Reimportado o mesmo OFX (OMIE de-dupe: "já importado antes", sem duplicar).
- 4 transferências Cora→Santander conciliadas (perna de saída "enviada SPROUT", categoria Saída de Transferência, valores 5.071,85/17.089,35/2.996,12/12.322,93). Filtro por valor negativo isolou o débito.
- 1 comissão conciliada: -4.000 boleto BTG (06/02), categoria Comissões, Diego Gomes.
- SALDO agora consistente: Saldo Conciliado 53.717,36 − pendentes (-13.990 -13.990 +2.996,12) = 28.733,48 = Saldo Atual. (A "anomalia" anterior era só o meio da conciliação.)

CORA caiu de 21 → **3 não conciliados**:
1+2. DIEGO GOMES −13.990 (Comissões) ×2: o OFX tem só **1** débito de 13.990 (10/02) e ele já está conciliado a um lançamento "Salários Operacional". Logo há 2 lançamentos de Comissões −13.990 SEM lastro no banco → provável duplicidade/duplo registro (Salários + Comissões). FINANCEIRO: deduplicar/recategorizar (decidir se o pagamento real é Salário ou Comissão e excluir o(s) duplicado(s)).
3. SUPER MERCADO ZONA SUL 2.996,12 (17/04): mantido pendente a pedido do Diego (colisão de valor com a transferência de 2.996,12 do mesmo dia; conciliar manual amarrando à NF correta).

---

### MERCADO PAGO (cartão via link) → Santander (13/07)
3 vendas por link de cartão (arquivo Vendas_MercadoPago), referência externa "SPROUT", cliente NÃO informado no arquivo:
| Txn | Data | Bruto | Tarifa | Líquido | Cartão |
|---|---|---|---|---|---|
| 156684469670 | 27/04 | 299,90 | -14,94 | 284,96 | Mastercard 7908 |
| 155358119121 | 23/04 | 223,93 | -11,15 | 212,78 | C6 3671 |
| 155096795656 | 16/04 | 223,93 | -11,16 | 212,77 | C6 3671 |

CONFIRMAÇÃO no Santander (lado banco OK): 
- 04/05 PIX RECEBIDO 284,96 (de 35763406000100/SPROUT) = líquido da venda 299,90.
- 27/04 PIX RECEBIDO 425,55 (de SPROUT) = SOMA dos 2 líquidos 212,78 + 212,77 (as duas vendas de 223,93 vieram num PIX só).
→ Os 3 líquidos entraram no Santander via PIX da SPROUT.

PENDENTE p/ baixa: identificar o cliente/NF de cada título. O arquivo do MP não traz cliente; 223,93 casa com múltiplas NFs (34988/34767/36086/33793 boleto; 299,90 → 33604 boleto — mas estes são de boleto, provavelmente NÃO são os do cartão). Baixa exige o título certo → confirmar cliente com Diego.
Plano de baixa (quando souber o título): LancarRecebimento(cod título, conta=Santander, valor=líquido, desconto=tarifa MP) → total = bruto; depois conciliar o PIX no Santander (284,96 e 425,55).

#### MERCADO PAGO — cliente identificado (Diego, 13/07)
Cliente pagador das 3 vendas de cartão (link MP):
- CNPJ: 63.620.469/0001-43
- Endereço: R. Vanderley, 1585 - Perdizes, São Paulo/SP - CEP 05011-002
As 3 vendas: 299,90 (Mastercard, 27/04) + 223,93 (C6, 23/04) + 223,93 (C6, 16/04) → mesmo cliente.
PLANO DE EXECUÇÃO (quando a API/sessão OMIE estabilizar):
1. ListarClientes por CNPJ 63620469000143 → pegar codigo_cliente_omie.
2. ListarContasReceber filtrar_por_cliente → localizar os 3 títulos (1×299,90 + 2×223,93) em aberto.
3. Baixa de cada: LancarRecebimento(cod título, conta=Santander 1973114603, valor=líquido, desconto=tarifa MP) → total=bruto (284,96+14,94=299,90; 212,78+11,15=223,93; 212,77+11,16=223,93).
4. Conciliar no Santander: PIX 284,96 (04/05) = venda 299,90; PIX 425,55 (27/04) = as duas de 223,93 juntas.
STATUS: pausado — sessão OMIE travada (timeouts). Retomar quando estabilizar.

#### SANTANDER — mapa (13/07, só leitura, nada alterado)
Conta Ag 3980 / 130053901 (ACCTID 3980130053901). OFX jan–jun = 2.510 mov: 573 créditos (R$ 4.130.671,72) + 1.937 débitos.
573 recebimentos por tipo:
- SPROUT (35763406000100): 194 · R$1.013.640,85 — repasses/antecipação (inclui 4 Cora→Santander + líquidos MP). Interno.
- Aplicações CDB/RDB: 60 · R$474.608,61 — resgates, não é cliente.
- Aportes Diego (22775873898): 36 · R$134.799,55.
- Recebimentos de clientes: 283 · R$2.507.622,71 — "baixar cliente" real; casa por pagador CNPJ+valor+data.
IMPORTANTE: o memo do OFX NÃO rotula transferência; casamento seguro dos 283 só sai importando (OMIE casa por pagador). Por fora, só 3 têm valor único no master.
Decisão do Diego: SÓ MAPEAR, sem importar. Relatório: Mapa_Santander_13-07.docx.
Quando for conciliar: importar OFX (combinado em outputs/Santander_combinado_jan-jun.ofx) e conciliar por blocos (internos primeiro, depois clientes em lotes verificados).

#### SANTANDER — ACHADO CHAVE (13/07): conta já conciliada
Importado o extrato de ABRIL (do SharePoint 04-Extratos/04-Abril/04-Santander.ofx, 379 mov). Na tela "Extrato para Conciliação", filtro Situação=Não conciliado → **NENHUM registro**. Ou seja, TODO o extrato de abril já está conciliado no OMIE ("já importado/conciliado antes").
CONCLUSÃO: o Santander é CONCILIADO ATIVAMENTE pelo financeiro — NÃO há backlog de recebimento seguro para baixar (diferente da Cora). As 4 transferências Cora→Santander já estão fechadas nos dois lados (o lado Santander/entrada estava verde).
Os 252 "não conciliado" vistos na Movimentação são lançamentos do lado OMIE SEM contrapartida no extrato (provisões/duplicidades/itens de revisão), majoritariamente contas a PAGAR — não são "baixar cliente". São itens de revisão do financeiro, não conciliação segura.
Nenhuma alteração feita (re-import deduplicado, fechado sem conciliar).

#### SANTANDER — lista dos 252 não conciliados (13/07)
Capturado da tela Movimentação (6 páginas). Composição (por conteúdo):
- **Transferências internas UY3 ↔ Santander: a grande maioria** (~200 mov, ~R$ 207 mil) — repasses internos, SEGUROS de conciliar como par (igual Cora→Santander).
- **Contas a pagar (fornecedores/tarifas): ~25** (~ -R$ 35,5 mil): CAJU (benefícios, -900/-2.800/-8.584,70), Nathalia Correia (marketing -150), IFCO (-43,59/-866,18), Quadrilatero (condomínio -1.224,45), KENTISA (-620/-938/-493), KIELING (-489,98), Mercado Pago (-55,80), CHAMPETIT (-2.320), CATHO (-191,81), LUIZ KOITI (-680), tarifas bancárias, etc.
- **Recebimentos de cliente: ~5** (ex.: CARREFOUR 2640 DF 135,04).
CONCLUSÃO: o não-conciliado do Santander é quase todo TRANSFERÊNCIA INTERNA (segura) + poucas contas a pagar. Praticamente não há recebimento de cliente pendente.

#### ITAÚ JULHO (13/07) — importado + salvo na rede
Diego subiu Extrato_7053_998972_13-07-2026.ofx (Itaú, banco 0341, ag 7053/998972, 01–13/07, 45 mov).
- IMPORTADO no OMIE (Importar Extrato → Itaú). Os "BOLETOS RECEBIDOS DD/07S" (recebimentos de cliente) entraram VERDES = já conciliados.
- O restante = "Lançamento não encontrado" (sem título/lançamento no OMIE): tarifas (TAR/CUSTAS, TAR PIX), pagamentos (SISPAG DIVERSOS/SALARIOS), saldos diários, e antecipações (SPROUT 06/07 23.100 · 07/07 30.775 · 08/07 11.000; BR FINANCIAL 973,05; BR SOC 1.832,32/2.361,25). Esses precisam de lançamento/classificação do financeiro — não é conciliação segura por valor.
- SALVO NA REDE: SharePoint Financeiro/04-Extratos/JULHO/Extrato_7053_998972_13-07-2026.ofx.
CONCLUSÃO: recebimentos de cliente do Itaú julho já conciliados; itens operacionais (tarifas/SISPAG/antecipação) ficam para o financeiro.

#### UY3 ↔ SANTANDER — iniciado, mas OMIE travou (13/07)
Objetivo: conciliar as ~200 transferências internas UY3↔Santander (Saída/Entrada de Transferência, muitas de -437,19), bloco seguro (igual Cora→Santander).
Plano/mecanismo: importar o extrato Santander do mês → na tela "Extrato para Conciliação" filtrar por valor da transferência → "Conciliar este lançamento" (casa com o lançamento Saída/Entrada de Transferência). Fazer mês a mês (jan,fev,mar,mai,jun; abril já veio 100% conciliado).
STATUS: importei JUNHO (06-Santander.ofx, 441 mov) mas o OMIE ficou "analisando os movimentos" travado >60s (backend degradado hoje — mesma instabilidade da API). PAUSADO. Retomar quando o OMIE estiver responsivo: reimportar junho (dedup) e conciliar os transfers por valor, depois os demais meses.

#### UY3 ↔ SANTANDER — ACHADO DECISIVO (13/07): NÃO são movimentos bancários
Importado JUNHO Santander (441 mov) → tela veio 100% conciliada (igual abril). Lado banco do Santander já é conciliado pelo financeiro.
Filtro do valor -437,19 (o transfer recorrente "Santander >> UY3") no import de junho → NENHUM registro.
Grep nos OFX: valor 437.19 NÃO existe em NENHUM extrato do Santander NEM da UY3. "UY3" não aparece nos memos do Santander.
CONCLUSÃO: as ~200 "Transf. Santander >> UY3" (bulk de -437,19 e afins) NÃO têm contrapartida bancária em nenhum dos dois extratos → são lançamentos internos no OMIE (provisão/rateio/modelagem), NÃO transferências bancárias reais. Por isso ficam "não conciliado" e o import NÃO resolve. NÃO é bloco seguro de conciliação.
OBS: transferências UY3↔Santander REAIS existem e já estão conciliadas (ex.: PIX RECEBIDO 27531301000106 38.500,00 verde). O problema é só o bulk de lançamentos-fantasma sem lastro.
AÇÃO: financeiro precisa esclarecer o que são esses lançamentos recorrentes (por que existem sem movimento no banco) antes de qualquer conciliação. Não dá para conciliar por valor com segurança.

#### VERIFICAÇÃO FINAL DE LASTRO (13/07) — backlog seguro esgotado
- Transferências UY3↔Santander GRANDES (91.890, 62.791,50, 7.154...): 0 ocorrências no OFX Santander → TODO o bloco de transfers é sem lastro (não só os 437,19).
- Recebimentos Santander: SONDA 990,72 e Carrefour 135,04 = 0 no OFX (fantasma); Rio de Una 901,10 (3x) e Iguarias 255,92 (6x) existem no OFX MAS o banco Santander já está 100% conciliado → linhas já casadas com outros lançamentos; os "não conciliado" são ÓRFÃOS.
- UY3 49 (GPA-líquido): 0/49 bateram nos OFX UY3 disponíveis (jan/fev/mai). Faltam extratos UY3 de mar/abr/jun. Antecipação cai em lote (não NF a NF) → não confirmável agora.
CONCLUSÃO: NÃO há conciliação segura autônoma restante. Todo o não-conciliado do Santander (252) é órfão/fantasma (lançamentos internos sem linha de banco disponível) = revisão do financeiro. Sistema essencialmente conciliado; o que resta é decisão/insumo do financeiro.
PARA DESTRAVAR (insumos do financeiro):
- Extratos OFX da UY3 de mar, abr, jun (para checar os 49).
- Relatório "boletos pagos" Itaú atualizado (mai–jul) → resolve os 26 do Itaú.
- Decisão contábil: bloco transfers UY3↔Santander sem lastro; 2× Diego 13.990 (dedup); contas a pagar Santander.

#### BOLETOS PAGOS ITAÚ + UY3 (13/07) — insumos recebidos
RELATÓRIO DE COBRANÇA ITAÚ (Seu Número=NF, Status, Data Pagamento) cruzado com os 26:
- PAGOS (5) → CONCILIAR: NF 35689 (399,92), 36080 (287), 36081 (404), 36083 (424), 36133 (287) — todos pagos 10/07, somam 1.801,92 = lote "BOLETOS RECEBIDOS 13/07S" do extrato Itaú.
- CANCELADOS (17): 34987,34942,34965,34969,35395,35426,32068,32086,35306,35544,35454,35575,33352,34786,34541,34676,33654 — boleto CANCELADO → clientes pagaram por outro canal (PIX/cartão). EXPLICA o "sem fonte". Financeiro reconciliar o canal real.
- NÃO CONSTA (4): 33408, 35188 (Hirota/antecipação), 34274 (Bruno), 35818 (Le Mellow).
UY3 (item 1, OFX banco 457 conta 2570703, abr–jul): 0/49 batem crédito individual. Créditos são LOTES grandes (borderô: 38.745, 35.189, 31.345...). Antecipação não concilia NF a NF → precisa mapa borderô→NFs (reconciliação antecipadora), não é individual seguro.
AÇÃO: conciliar os 5 boletos pagos do Itaú (seguro). Resto = financeiro.

#### ITAÚ — 100% CONCILIADO (13/07)
Após importar o extrato de julho e o pagamento dos boletos, a conta Itaú passou a mostrar "Não conciliado" = ZERO (1.276 movimentos, todos conciliados). Os 5 boletos pagos (35689/36080/36081/36083/36133) já entraram conciliados automaticamente. Nada a fazer manualmente.
Os 17 boletos CANCELADOS e os itens não-boleto continuam sendo caso do financeiro (reconciliar canal real de pagamento), mas não aparecem mais como pendência de conciliação bancária no Itaú.
Saldo Conciliado -177.176,04 × Atual -185.757,76 (dif ~8.581 = previstas, natureza P; realizados 100% conciliados).

#### GPA — ANÁLISE DA ANTECIPAÇÃO / BORDERÔS (13/07)
Arquivos em Financeiro/05-Clientes/GPA 2026/Arquivos (17 xlsx "rmXXXX"): 13 são BORDERÔS de antecipação, 4 são PROMOT (ajustes/descontos promocionais, estrutura diferente).
FLUXO entendido:
1. GPA junta várias NFs num borderô/aviso.
2. Por NF: Bruto − descontos comerciais (51-DESC.FINANCEIRO, 62-PARCERIA, 53-ADIC.NÃO TROCA, 54-PDANET, 65-ANIVERSÁRIO...) = Líquido.
3. Antecipadora (UY3) antecipa o borderô aplicando DESÁGIO (varia ~1–6% conforme dias até vencimento). Fonte por NF: "Títulos Antecipados GPA.xlsx" (col Líquido, Antecipção=deságio, Ajustado=recebido).
4. O Ajustado do borderô cai no SANTANDER como UM crédito (LOTE).
5. No OMIE existem "Transf. UY3" por NF ("00-Transferências Antecipação.xlsx") = as PERNAS por NF. Por isso os transfers UY3↔Santander não batem individualmente no extrato — só o LOTE bate.
CORREÇÃO ao achado anterior: parte dos transfers UY3↔Santander "sem lastro" são, na verdade, as pernas por NF da antecipação GPA (reais, mas pagas em lote → conciliam por borderô, não NF a NF). (O bloco recorrente de -437,19 ainda a confirmar se é antecipação ou item fixo à parte.)
13 borderôs: 678 NFs, líquido R$ 335.155,98. Deliverable: GPA_Composicao_Borderos_13-07.xlsx (detalhe NF a NF + resumo).
RECONCILIAÇÃO: casar cada crédito GPA no Santander (lote) com o borderô de Ajustado próximo → as NFs do borderô são as que conciliam. Deságio variável dificulta match exato só por líquido; usar o "Ajustado" por borderô.

#### GPA — DECODIFICAÇÃO DOS .scp (13/07) + recebimentos diretos (não-UY3)
Diego pediu focar nos recebimentos GPA que NÃO passam pelo UY3 (caem direto no Santander via TED do CNPJ 47508411000156), jun+jul.
- 11 TEDs GPA-diretos no Santander (jun+jul): R$ 319.919,78. (jun: 09/06 46.785,40; 10/06 23.061,76 e 99.333,63; 11/06 14.605,06; 15/06 12.678,26; 16/06 11.177,54; 17/06 4.029,93; 26/06 46.378,23. jul: 01/07 23.494,63; 03/07 13.795,46; 08/07 24.579,88.)
- Arquivos .scp (CNAB do GPA): rm...541=Santander (banco 033), rm...532=UY3 (banco 457). O xlsx "Num" = NF do record 15 do .scp (chave de cruzamento). Os 17 xlsx borderôs = UY3 (282 NFs em comum). O Santander tem NFs próprias (faixa 36xxx).
- DECODIFICAÇÃO do .scp (validada com xlsx): record tipo 15/16 = título; pos 2-11 = NF; pos 55 (15 dígitos, centavos) = BRUTO; pos 224 (15 díg, centavos) = LÍQUIDO. Ex NF 36210: bruto 611,34 líq 486,93.
- .scp Santander (rm...541) = 1 aviso, líquido R$ 55.117,67. Cada TED tem seu .scp aviso próprio (baixar do site do GPA).
Deliverable: GPA_Santander_scp_composicao_13-07.xlsx (NF, bruto, desconto, líquido).
PRÓXIMO: para fechar os 11 TEDs, obter o .scp de cada aviso; ou navegar no site do GPA (Diego deixa aberto/logado) para o de-para TED→NFs.

#### GPA .scp — DECODE REFINADO (13/07)
Validação contra xlsx UY3 (chave Num=NF): pos 55=Bruto, pos 224=Líquido → 260/269 NFs exatas (97%). As 9 falhas = NFs em >1 borderô. Decode CONFIÁVEL.
5 avisos: 2 UY3 (532=366.709,77; 308=234.143,55) + 3 Santander (541=55.117,67; 316=169.780,06; 326=45.384,03 → total 270.281,76 / 534 NFs).
TEDs GPA-direto Santander (jun+jul): 11, R$ 319.919,78.
LIMITE: o .scp NÃO tem o elo aviso↔TED nem o ajuste final do pagamento. Datas no .scp = vencimento/programação (03/07,08/07,03/08), não data do crédito. Agrupamento por data NÃO reproduz os TEDs. Gap 270k×320k (~50k) = ajuste promocional GPA (arquivos PROMOT à parte) + possível aviso não baixado.
CONCLUSÃO: composição NF a NF está pronta e confiável (GPA_Santander_Notas_a_baixar_13-07.xlsx). O de-para exato TED→aviso→NFs precisa do site do GPA (mostra cada pagamento = seu aviso) OU do relatório de conciliação do GPA que amarra valor pago ao aviso.
PROCESSO DE BAIXA (resposta ao Diego): planilha = mapa aviso→NFs; no OMIE "Baixar Contas a Receber", selecionar as NFs do aviso e baixar juntas na conta Santander (com desconto por NF); coluna "Status baixa" rastreia. 

#### GPA-DIRETO (não-UY3) — RECONCILIAÇÃO 100% FECHADA (13/07)
Fonte: site GPA (Pdanet > Aviso Previsto). Cada aviso tem Valor Bruto/Desconto/Abatimento/Devolução/Abat.Crédito/Líquido + VALOR ANTECIPADO + Data antecipação + Data pagamento. Legenda: verde=antecipado, vermelho=pago no vencimento.
CHAVE: o TED que cai no Santander (CNPJ GPA 47508411000156) = SOMA dos "Valor Antecipado" dos avisos antecipados no mesmo dia. Fechou 100% (11 TEDs = R$319.919,78):
- 09/06 46.785,40 = avisos 457+461
- 10/06 23.061,76 = 456
- 10/06 99.333,63 = 458+459+462+463
- 11/06 14.605,06 = 460
- 15/06 12.678,26 = 465+464
- 16/06 11.177,54 = 466
- 17/06 4.029,93 = 467
- 26/06 46.378,23 = 469+468+470
- 01/07 23.494,63 = 471
- 03/07 13.795,46 = 473+472
- 08/07 24.579,88 = 474
Avisos ainda não creditados (antecip 13/07 / a pagar): 454, 455, 475, 476.
NFs por aviso: no site (Visualizar) e no .scp (composição). O gap antigo (270k×320k) era porque eu comparava LÍQUIDO; o certo é VALOR ANTECIPADO (líquido − abatimento − devolução − deságio).
Deliverable: Reconciliacao_GPA_Santander_13-07.xlsx.

#### DICIONÁRIO DE LAYOUT DO .scp (GPA / CNANB-400) — engenharia reversa 13/07, 100% validado
Arquivo texto, linhas fixas de 400 chars, sem separador. Cada arquivo = vários LOTES; cada lote = 1 AVISO, delimitado por header '01' … trailer '90'. Registros (pos 0-1 = tipo):
- **01 HEADER**: conta destino em pos[57:69] → `000130053901`=SANTANDER (antecipação direta), `000002570703`=UY3. No corpo o padrão `<data 2026MMDD><const 0043548X><aviso 9díg>001` → nº do aviso + data (pagamento/antecipação). CNPJ pagador GPA 47508411000156, beneficiário SPROUT 35763406000100.
- **15 TÍTULO/NF**: NF em pos[2:11]; série pos[11:15]; **BRUTO** pos[55:70] (15 díg centavos). Soma dos type-15 = bruto do trailer (validado nos 35 avisos).
- **16**: linhas de desconto (valor pos[55:70]).
- **24/25/26/27** (detalhe) e **34/35/36/37** (resumo): descrição do desconto — 25=DESC.FINANCEIRO, 26=PARCERIA COMERC., 27=BONIF LOJA CONTR., 24=NFS CARGA/DESCARGA.
- **90 TRAILER**: pos[2:9] contador; depois grupos de 15 díg (centavos) a partir de pos 9: g0=**LÍQUIDO**, g1=**BRUTO**, g2=DESC1, g4=DESC2 (BRUTO−LÍQUIDO = DESC1+DESC2).

ACHADOS-CHAVE:
1. **Conta destino por aviso** → o próprio arquivo separa antecipação Santander-direta × UY3.
2. **Dois esquemas de numeração** aparecem nos downloads: avisos de **6 díg** (109207…) = crédito final, LÍQUIDO = valor exato do TED no Santander (sem deságio); avisos de **3 díg** (454-476) = visão comercial GPA (antes do deságio). Deságio da antecipadora = líq(3díg) − líq(6díg); NÃO consta no arquivo.
3. Os 11 avisos 6-díg Santander somam LÍQUIDO 319.919,78 = soma exata dos 11 TEDs (bate 1:1). 594 NFs no total.
Parser reutilizável: parse_scp.py (salvo em outputs e na rede GPA 2026). Uso: `python3 parse_scp.py *.scp`.
Deliverable: GPA_Santander_Conciliacao_definitiva_13-07.xlsx (aba TED-Aviso + aba NFs por aviso).

#### ACHADO (13/07): vínculo GPA×Banco Inter é FALSO
Os títulos do GPA no OMIE estão vinculados ao Banco Inter como se tivessem boleto emitido. Isso é ERRO de cadastro: NÃO emitimos boleto contra o GPA; o GPA paga via antecipação/borderô que cai no SANTANDER. Consequência prática: ao baixar antecipação GPA, TROCAR a conta de Inter → Santander e aplicar o desconto comercial. A tela de Recebimentos defaulta pro Inter por causa desse vínculo indevido. (Confirmado por Diego.)
Baixa correta = agrupada: todas as NFs do aviso → 1 crédito no Santander (valor antecipado) + desconto total (soma brutos − valor antecipado). Nunca NF a NF no Santander.

#### PIPELINE API OMIE — baixa de antecipação GPA (13/07)
API OMIE funciona pelo navegador (fetch same-origin na app.omie.com.br); sandbox bloqueia (403). Serializa por método (erro "requisição em execução") e barra repetição idêntica ("REDUNDANT, aguarde 20s"). registros_por_pagina teto 100.
- Localizar títulos: ListarContasReceber com filtrar_por_emissao_de/ate (ÚNICO filtro útil; não há filtro por NF/vencimento). Emissão das NFs = datas do .scp.
- Campos: numero_documento_fiscal (=NF), valor_documento (=bruto), status_titulo, data_vencimento, codigo_lancamento_omie (=id p/ baixa), id_conta_corrente, codigo_cliente_fornecedor.
- Contas correntes (nCodCC): Inter=1972977169 (077/00001-9/7003258-0) ; Santander=1973114603 (033/3980/13005390-1) ; Itaú=1973103311 ; UY3=2191851961 ; Cora=2275013231 ; Omie.CASH=1969453687.
ACHADO: os 49 títulos do aviso 139406 estão TODOS "A VENCER", vinculados ao Inter (vínculo errado) — devem ser recebidos no Santander. Aviso de junho (117072) já baixado.
LIMITAÇÃO: desconto por NF não está no .scp (só no nível do aviso) e os borderôs de julho não estão na rede (só até 17/06). Para baixa exata por NF, buscar borderô de julho; senão ratear o desconto proporcional ao bruto (fecha o total no TED).
Baixa = LancarRecebimento (financas/contareceber) por codigo_lancamento → AÇÃO IRREVERSÍVEL, só com aval explícito.
Deliverable: GPA_Aviso139406_Plano_Baixa_13-07.xlsx.

#### BAIXA EXECUTADA — aviso 139406 (13/07) ✅ PROCESSO PROVADO
Método API: LancarRecebimento (endpoint financas/contareceber). Param aceito:
  {codigo_lancamento, codigo_conta_corrente, valor, data:"DD/MM/AAAA", desconto, observacao}
  valor+desconto = bruto do título → liquida 100%. Resposta: descricao_status "Baixa executada com sucesso!", codigo_baixa.
Executadas 49 baixas (Inter→Santander cc 1973114603, data 08/07), desconto RATEADO proporcional ao bruto, ajuste de centavos na última NF. Total recebido = R$ 24.579,88 = TED exato. Todos os 49 títulos → status RECEBIDO (verificado por ListarContasReceber, filtrar_por_emissao_de/ate).
Observação: desconto por NF é proporcional (o borderô de julho não estava na rede; o .scp só traz desconto por aviso). Para exato por NF futuramente, usar borderô.
PROCESSO REPETÍVEL p/ demais avisos: (1) parse_scp → NFs+bruto+líquido do aviso; (2) ListarContasReceber filtrar_por_emissao para achar codigo_lancamento; (3) LancarRecebimento por título com rateio. Deliverable: GPA_Aviso139406_Baixa_EXECUTADA_13-07.xlsx.

#### BAIXAS GPA-SANTANDER CONCLUÍDAS (13/07) — resumo
Baixados os 3 avisos julho abertos: 139406 (49 NF, TED 08/07, R$24.579,88), 133216 (38 NF, TED 01/07, R$23.494,63), 134395 (26 NF, TED 03/07, R$13.795,46). Total 113 NF, R$61.869,97 recebidos no Santander. Todos RECEBIDO (verificado). Avisos junho (117072,118550,120110,120980,122369,123173,124261,128785) já estavam RECEBIDO.
Pendente: conciliar no extrato Santander os TEDs 01/07, 03/07, 08/07 contra as baixas; classificação contábil do desconto; UY3 não tocado.
Deliverables financeiro: Relatorio_Baixas_GPA_Santander_Financeiro_13-07.docx + GPA_Baixas_Consolidado_Financeiro_13-07.xlsx.

#### CONCILIAÇÃO BANCÁRIA SANTANDER — antecipações (13/07)
Mecanismo: Movimentação da Conta Corrente > filtrar Santander + data > clicar ✓ (Opções) em cada lançamento = conciliação manual (reversível). NÃO há conciliação em lote nem API pública. Precisa clique + espera ~2s por linha.
IMPORTANTE: a importação do OFX de julho pelo Diego veio LIMPA (sem duplicar TEDs — verificado filtrando valor 24.579,88 = nenhum registro).
FEITO: aviso 139406 (08/07) 100% conciliado — filtrei Data 08/07-08/07 (isolou os 50 mov. do aviso), cliquei ✓ em todos. Saldo Conciliado subiu de -216.477,80 → -191.897,92 = +24.579,88 exato. ✔
PENDENTE: avisos 133216 (23.494,63) e 134395 (13.795,46). O filtro de data do OMIE ficou instável (01/07 retornou vazio; 03/07 voltou a mostrar todos os 134) — não deu p/ isolar com segurança sem risco de desfazer o 139406. Terminar em sessão estável: filtrar a data do aviso, conferir que isolou, e clicar ✓ nas linhas cujos valores constam em GPA_Baixas_Consolidado_Financeiro_13-07.xlsx (abas por aviso). Valores recebidos por NF já estão nessa planilha.

#### CONCILIAÇÃO SANTANDER — 3 AVISOS 100% CONCILIADOS (14/07) ✅ CICLO FECHADO
Todos os 113 movimentos das antecipações GPA (avisos 139406, 133216, 134395) conciliados no Santander.
Método que funcionou: Movimentação da Conta Corrente > Santander > filtrar por DATA do aviso (isola o grupo daquele aviso) > clicar ✓ em cada linha cujos valores constam no plano (pulando débitos não-GPA). Depois filtrar Situação="Não Conciliado" no período completo p/ achar os que os cliques deixaram passar e concluir.
Prova: filtro "Não Conciliado" em 01-13/07 → sobra só 1 lançamento (OMIEXPERIENCE -520,30, boleto Cessão de Uso, NÃO é GPA). Saldo Conciliado -216.477,80 → -159.244,53 = +57.233,27 (+4.636,70 do 1º teste = 61.869,97 = soma dos 3 avisos). Bate no centavo.
Dica: filtro de data às vezes trava; se travar, recarregar (Reconectar) e refazer. Cliques ✓ precisam de ~2s entre si; em lote rápido não registram.
CICLO GPA-SANTANDER COMPLETO: arquivo .scp decodificado → baixas (113 NF, 61.869,97) → conciliação bancária (3 TEDs). Falta só: UY3 (não tocado) e classificação contábil do desconto.
