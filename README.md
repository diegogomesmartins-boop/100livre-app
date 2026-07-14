# 100% Livre — Dashboard & Robô de Cobrança

Painel financeiro e automação de baixas da 100% Livre (Sprout Holdings).
**Este repositório é a fonte da verdade.** O que está aqui é o que está no ar.

- **Dashboard ao vivo:** https://diegogomesmartins-boop.github.io/100livre-app/dashboard-100livre.html
- **Robô de baixas:** roda sozinho todo dia às **06:00 (BRT)** no GitHub Actions.

---

## Como as peças se ligam

```
        OMIE (ERP — fonte dos dados)
                 │  API
                 ▼
   robo_bancos.py  ── roda no GitHub Actions (não no seu computador)
     1. lê boletos emitidos      (ListarContasReceber)
     2. lê pagamentos no extrato (ListarExtrato)
     3. casa pagamento × boleto  POR NF
     4. dá baixa                 (LancarRecebimento)
     5. grava o resumo do dia
                 │
                 ▼
        FIRESTORE  ·  coleção "bancos"
          bancos/inter   bancos/itau
                 │
                 ▼
   dashboard-100livre.html  ·  aba Visão › Bancos
     KPIs · lista de cobrança · botão Cobrar (WhatsApp)
```

Nada roda na sua máquina. Se o computador desligar, o robô continua.

---

## Arquivos que importam

| Arquivo | O que é |
|---|---|
| `dashboard-100livre.html` | O dashboard inteiro, num arquivo só. A aba **Bancos** é um `<script type="module">` **no final do arquivo**, que se auto-instala. |
| `robo_bancos.py` | O robô: lê OMIE, dá baixa, grava no Firestore. Multi-banco. |
| `.github/workflows/robo-inter.yml` | Agendamento (cron 06:00 BRT) + botão de execução manual. |
| `robo_inter.py` | Versão anterior, só Inter. Mantido como histórico — **não é mais usado**. |

---

## A regra de escopo (importante)

O painel usa **apenas boletos emitidos** — no OMIE: `boleto.cGerado == "S"`,
separados pela **conta corrente**.

Isso exclui de propósito quem paga por outro meio (antecipação, borderô, outro banco).
Sem essa regra, apareciam clientes para quem nunca emitimos boleto.

| Banco | Conta OMIE | Baixa automática |
|---|---|---|
| Inter | `1972977169` | **LIGADA** |
| Itaú | `1973103311` | Desligada — só painel (ver abaixo) |
| Santander | `1973114603` | Não implementado |

**Por que o Inter baixa e o Itaú não:** a integração Inter↔OMIE grava a NF na
observação do pagamento (`"Boleto Inter: 90765294080 / NF: 36324"`). É isso que
permite casar pagamento com título **de forma exata**. Sem a NF não existe
casamento seguro — e baixa no chute não se desfaz. O log do robô mostra, a cada
execução, quantos pagamentos do Itaú vêm com NF identificada. Quando esse número
for consistente, ligar com `itau_baixa=1`.

---

## Rodar o robô na mão

Actions → **robo-inter** → *Run workflow*:

| Campo | Valor |
|---|---|
| `dry_run` | `0` = baixa de verdade · `1` = simula (não baixa, só atualiza o painel) |
| `itau_baixa` | `0` = Itaú só painel · `1` = Itaú também baixa |

Comece sempre com `dry_run=1` ao mexer na lógica de baixa.

---

## Travas de segurança do robô

- **Casa só por NF exata.** Nunca por valor aproximado.
- **Pagou a mais** (juros/multa de boleto vencido) → baixa o valor do título e lança a
  diferença como **juros**.
- **Pagou a menos** → **não baixa**. Vai para a fila de revisão.
- **Erro na baixa** → fila de revisão, com o erro registrado.
- `dry_run=1` não escreve nada no OMIE.

---

## Botão Cobrar (WhatsApp)

Abre um painel com o **número editável** e a **mensagem pronta** (nome, NF, valor,
vencimento). O botão *Abrir WhatsApp* é um link `wa.me` — abre a conversa com o texto
digitado, e **você aperta enviar**. Nada é enviado sem você.

Não usa a API oficial do WhatsApp de propósito: com ~5 cobranças/dia, o link entrega
o mesmo resultado sem verificação da Meta, sem template aprovado e sem risco de
banir o número da empresa. Se um dia precisar de régua automática, aí sim vale a
Cloud API.

**Cuidado conhecido — telefones do cadastro estão errados.** Em 14/07/2026, dos 5
clientes atrasados, 3 tinham no OMIE um número **completamente diferente** do real e
2 estavam no formato antigo de 8 dígitos. Por isso o painel marca `telefone antigo
(8 díg.)` e o número é editável antes de enviar. **Não automatize o envio enquanto o
cadastro não estiver limpo** — o erro sai da contabilidade e vai parar no WhatsApp de
um estranho.

---

## Segredos (Settings → Secrets → Actions)

| Secret | Para quê |
|---|---|
| `OMIE_APP_KEY` / `OMIE_APP_SECRET` | API do OMIE |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço, para escrever no Firestore |

Não dá para ler um secret de volta — nem você. Se perder o JSON do Firebase, gere uma
chave nova no console do Firebase e atualize o secret.

---

## Limite da API do OMIE

O OMIE bloqueia por "consumo indevido" se você bater demais em pouco tempo — aconteceu
em 14/07/2026 rodando o robô 4× seguidas junto com consultas paralelas. O bloqueio é
temporário. **Não rode o robô várias vezes seguidas**; espere a execução anterior
terminar.

---

## Se algo der errado

O dashboard sumiu ou quebrou → cada commit é um ponto de restauração:
`git log --oneline` acha o último bom, `git revert <sha>` desfaz.

O robô falhou → Actions → última execução → o log mostra tudo: quantos boletos achou,
quantos pagamentos casaram por NF, o que baixou e o que foi para revisão.

O painel está desatualizado → o carimbo "atualizado" é a hora da última execução.
Rode manualmente pelo *Run workflow*.

---

## Regra de trabalho

Publique sempre **pelo GitHub**. Se for mexer numa cópia local, dê `git pull` antes —
uma cópia velha com push por cima apaga o que está no ar, e em silêncio.
