(function councilFAB() {
  var LABELS = {
    gerencial: 'Gerencial — Alavancas de EBITDA',
    investidor: 'Investidor — Estrutura de Capital',
    comercial: 'Comercial — Priorização de Canal',
    logistica: 'Logística — Gig vs CLT',
    rentabilidade: 'Rentabilidade — Mix de Produtos',
    producao: 'Produção — Make vs Buy',
    custos: 'Custos — Centros de Corte',
    experimentos: 'Experimentos — Canal de Lançamento',
    nicotina: 'Nicotina JV — Posicionamento SC/BAT'
  };

  function getView() {
    var views = ['gerencial','investidor','comercial','logistica','rentabilidade','producao','custos','experimentos','nicotina'];
    for (var i = 0; i < views.length; i++) {
      var el = document.getElementById('view-' + views[i]);
      if (el && getComputedStyle(el).display !== 'none') return views[i];
    }
    return (typeof currentView !== 'undefined') ? currentView : 'gerencial';
  }

  function inject() {
    if (document.getElementById('council-fab')) return;
    if (!document.body) return;

    var fab = document.createElement('button');
    fab.id = 'council-fab';
    fab.innerHTML = '⚖️';
    fab.title = 'Convocar o Council';
    fab.style.cssText = [
      'position:fixed', 'bottom:28px', 'right:28px', 'z-index:99999',
      'width:52px', 'height:52px', 'border-radius:50%',
      'background:#1A7A4A', 'border:none', 'cursor:pointer',
      'box-shadow:0 4px 20px rgba(26,122,74,0.6)',
      'font-size:22px', 'color:white', 'transition:all .2s',
      'display:flex', 'align-items:center', 'justify-content:center'
    ].join(';');

    var tt = document.createElement('div');
    tt.id = 'council-tt';
    tt.style.cssText = [
      'position:fixed', 'bottom:88px', 'right:24px', 'z-index:99999',
      'background:#0f1824', 'color:#e8f0fe', 'font-size:11px',
      'font-family:monospace', 'padding:5px 12px', 'border-radius:6px',
      'border:0.5px solid #1d2d42', 'opacity:0', 'transition:opacity .2s',
      'pointer-events:none', 'white-space:nowrap'
    ].join(';');

    var ol = document.createElement('div');
    ol.id = 'council-overlay';
    ol.style.cssText = 'display:none;position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.95);flex-direction:column;';
    ol.innerHTML = '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:#06111e;border-bottom:1px solid #1d2d42;flex-shrink:0;">'
      + '<span style="font-size:11px;color:#22c55e;font-family:monospace;font-weight:700;letter-spacing:2px;">SPROUT // COUNCIL</span>'
      + '<span id="council-ol-label" style="font-size:13px;color:#e8f0fe;font-weight:600;"></span>'
      + '<button onclick="fecharCouncil()" style="margin-left:auto;background:transparent;border:0.5px solid #1d2d42;color:#94a3b8;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-family:sans-serif;">← Voltar</button>'
      + '</div>'
      + '<iframe id="council-iframe" src="" style="flex:1;width:100%;border:none;min-height:0;"></iframe>';

    document.body.appendChild(fab);
    document.body.appendChild(tt);
    document.body.appendChild(ol);

    fab.onmouseover = function() {
      var v = getView();
      tt.textContent = '⚖️ ' + (LABELS[v] || v);
      fab.style.transform = 'scale(1.1)';
      tt.style.opacity = '1';
    };
    fab.onmouseout = function() {
      fab.style.transform = 'scale(1)';
      tt.style.opacity = '0';
    };
    fab.onclick = function() {
      buildCouncilSnapshot(function() { openQuestionModal(); });
    };

    function buildCouncilSnapshot(cb) {
      var BASE = 'https://firestore.googleapis.com/v1/projects/livre-gestao/databases/(default)/documents';
      var gn = function(f,k){ return parseFloat((f&&f[k]&&(f[k].doubleValue||f[k].integerValue))||0); };
      var R = function(v){ return 'R$'+Math.round(v).toLocaleString('pt-BR'); };
      var P = function(v){ return v.toFixed(1)+'%'; };
      var meses = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07'];
      var labels = ['Jan','Fev','Mar','Abr','Mai','Jun'];

      Promise.all([
        Promise.all(meses.map(function(m){ return fetch(BASE+'/faturamento_mensal/'+m).then(function(r){ return r.json(); }); })),
        Promise.all(meses.map(function(m){ return fetch(BASE+'/dre_mensal/'+m).then(function(r){ return r.json(); }); }))
      ]).then(function(results) {
        var fat_data = results[0], dre_data = results[1];
        var lines = ['=== SNAPSHOT COMPLETO — Sprout Holdings / 100% Livre — Jun/2026 ===', ''];
        lines.push('REGRA DE DECISAO: Usar APENAS Mai+Jun/2026 como base.');
        lines.push('Houve reajuste de tabela de precos em Mai/2026 — dados anteriores (Jan-Abr) refletem precos desatualizados e NAO devem ser usados para projecoes ou comparacoes futuras.');
        lines.push('Toda analise de R$/kg, margem e rentabilidade deve referenciar os ultimos 60 dias.');
        lines.push('');

        lines.push('FATURAMENTO MENSAL (competencia):');
        var tot_br=0, tot_lq=0, tot_dv=0;
        fat_data.forEach(function(d,i){
          var f=d.fields||{}, br=Math.round(gn(f,'faturamento_bruto')), lq=Math.round(gn(f,'faturamento_liquido')), dv=Math.round(gn(f,'total_devolucoes'));
          tot_br+=br; tot_lq+=lq; tot_dv+=dv;
          lines.push('  '+labels[i]+'/26: Bruto '+R(br)+' | Dev '+R(dv)+(br>0?' ('+P(dv/br*100)+')':'')+' | Liq '+R(lq));
        });
        lines.push('  ACUM Jan-Jun: Bruto '+R(tot_br)+' | Dev '+R(tot_dv)+' ('+P(tot_dv/tot_br*100)+') | Liq '+R(tot_lq));
        lines.push('');

        lines.push('DRE CUSTOS MENSAIS:');
        var tc=0,tp=0,ta=0,tf=0,te=0;
        dre_data.forEach(function(d,i){
          var f=d.fields||{};
          var cmv=Math.round(gn(f,'cmv')), pes=Math.round(gn(f,'pessoal')||gn(f,'folha')),
              alg=Math.round(gn(f,'aluguel')), fre=Math.round(gn(f,'frete')),
              ebt=Math.round(gn(f,'ebitda_cogumelos'));
          tc+=cmv; tp+=pes; ta+=alg; tf+=fre; te+=ebt;
          lines.push('  '+labels[i]+'/26: CMV '+R(cmv)+' | Pessoal '+R(pes)+' | Aluguel '+R(alg)+' | Frete '+R(fre)+' | EBITDA '+R(ebt));
        });
        lines.push('  ACUM: CMV '+R(tc)+' | Pessoal '+R(tp)+' | Aluguel '+R(ta)+' | Frete '+R(tf)+' | EBITDA '+R(te));
        lines.push('');

        lines.push('RENTABILIDADE POR FAMILIA (Mai+Jun/26 — base de decisao reajustada):');
        var tbody = document.getElementById('rent-prod-tbody');
        var prodTable = document.querySelector('#rent-prod-tbody')?.closest('table'); var ths = prodTable ? Array.prototype.slice.call(prodTable.querySelectorAll('thead th')).map(function(t){ return t.textContent.replace(/[▼▲]/g,'').trim(); }) : [];
        if (tbody && tbody.querySelectorAll('tr').length > 0 && ths.length > 0) {
          Array.prototype.slice.call(tbody.querySelectorAll('tr')).forEach(function(r){
            var cells = Array.prototype.slice.call(r.children).map(function(td){ return td.textContent.trim(); });
            if (cells[0]) lines.push('  '+ths.map(function(h,i){ return h+': '+cells[i]; }).join(' | '));
          });
        } else {
          lines.push('  (dados nao disponiveis — abra Rentabilidade > Por Produto)');
        }
        lines.push('');

        lines.push('CMV DE REFERENCIA (fonte: Kentisa/fornecedores):');
        ['Shimeji Branco: R$15,74/kg','Shimeji Preto: R$24,16/kg','Paris/Sujo: R$27,60/kg',
         'Portobello: R$32,04/kg','Shitake bloco pronto: R$7,80/2,5kg','Paris producao propria yield 9,7%: CMV ~R$28/kg substrato'].forEach(function(l){ lines.push('  '+l); });
        lines.push('');

        lines.push('DESCONTOS COMERCIAIS POR REDE:');
        lines.push('  GPA 21% | Carrefour 9% | Sonda 7% | Zona Sul 5% | Sams 10% | Mambo 10% | Hirota 10% | Einstein 0% | 5M 0% | Restaurantes 0%');
        lines.push('');

        lines.push('ESTRUTURA COMERCIAL:');
        lines.push('  Lucas: Sams, Mambo, Carrefour, Einstein, Zona Sul, GPA fora-SP');
        lines.push('  Anderson: GPA-SP, Hirota, DIA, Sonda, Muffato');
        lines.push('  Diego: Le Jazz, Souza Cruz, Cencoderma, Natural Farms');
        lines.push('  Julia: food service e pequenos restaurantes (0% desconto)');
        lines.push('  Canal Einstein: 0% devolucao, 0% desconto, paga premium');
        lines.push('');

        lines.push('ESTRUTURA OPERACIONAL:');
        lines.push('  Osasco: cogumelos (Paris, Portobello, Shitake, Shimeji), tabaco, cannabis P&D');
        lines.push('  Ipiranga: morango exp., moyashi, botanicas Boticario');
        lines.push('  Frete gig: 7 motoristas, R$291k Jan-Jun = 12,9% fat.liq.');
        lines.push('=== FIM DO SNAPSHOT ===');

        var snapshot = lines.join('\n');
        window.__councilSnapshot = snapshot;
        if (cb) cb(snapshot);
      }).catch(function(e){ if (cb) cb(''); });
    }

    function openQuestionModal() {
      var v = getView();
      var old = document.getElementById('council-q-modal');
      if (old) old.remove();
      var modal = document.createElement('div');
      modal.id = 'council-q-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;';
      modal.innerHTML =
        '<div style="background:#0f1824;border:1px solid #1d2d42;border-radius:12px;padding:24px;width:560px;max-width:90vw;">' +
          '<div style="font-size:11px;color:#22c55e;font-family:monospace;font-weight:700;letter-spacing:2px;margin-bottom:4px;">\u2696\uFE0F CONVOCAR COUNCIL</div>' +
          '<div style="font-size:13px;color:#94a3b8;margin-bottom:16px;">' + (LABELS[v] || v) + '</div>' +
          '<label style="font-size:11px;color:#64748b;display:block;margin-bottom:6px;">O que voc\u00ea quer saber? (deixe em branco para usar a pergunta padr\u00e3o)</label>' +
          '<textarea id="council-q-input" rows="3" style="width:100%;background:#162030;border:1px solid #1d2d42;border-radius:8px;padding:10px;color:#e8f0fe;font-size:13px;font-family:inherit;resize:vertical;margin-bottom:14px;box-sizing:border-box;"></textarea>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button id="council-q-cancel" style="padding:8px 16px;border-radius:6px;border:1px solid #1d2d42;background:transparent;color:#94a3b8;cursor:pointer;font-size:12px;">Cancelar</button>' +
            '<button id="council-q-launch" style="padding:8px 18px;border-radius:6px;border:none;background:#1A7A4A;color:#fff;cursor:pointer;font-size:12px;font-weight:600;">Convocar \u2192</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
      var input = document.getElementById('council-q-input');
      input.focus();
      document.getElementById('council-q-cancel').onclick = function() { modal.remove(); };
      modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
            document.getElementById('council-q-launch').onclick = function() {
        var q = input.value.trim();
        modal.remove();
        document.getElementById('council-overlay').style.display = 'flex';
        document.getElementById('council-ol-label').textContent = LABELS[v] || v;
        var qParam = q ? '&q=' + encodeURIComponent(q) : '';
        try {
          var snap = window.__councilSnapshot || null;
          if (snap) sessionStorage.setItem('council_live_ctx_' + v, snap);
        } catch(e) {}
        document.getElementById('council-iframe').src = '/council.html?v=' + v + qParam + '&t=' + Date.now();
      };
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) document.getElementById('council-q-launch').click();
        if (e.key === 'Escape') modal.remove();
      });
    }

    window.abrirCouncil = openQuestionModal;

    window.fecharCouncil = function() {
      document.getElementById('council-overlay').style.display = 'none';
      document.getElementById('council-iframe').src = '';
    };

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') window.fecharCouncil();
    });

    console.log('[council] FAB ok — view: ' + getView());
  }

  // 4 estratégias de timing
  if (document.body) { inject(); }
  document.addEventListener('DOMContentLoaded', inject);
  window.addEventListener('load', inject);
  setTimeout(inject, 800);
  setTimeout(inject, 2000);
}());



/* ═══════════════════════════════════════════════════════════════════
   SPROUT PATCH v2 — 100% Livre Dashboard
   Funciona em: localhost E GitHub Pages
   Estratégia: event delegation (não depende de window.setView)
   Dados: embutidos inline (não depende de localStorage cross-origin)
   Versão: 2025-07-05
═══════════════════════════════════════════════════════════════════ */
(function sproutPatch() {

  // ── DADOS DOS 3 CICLOS ────────────────────────────────────────
  var CICLOS_DATA = [
    {id:'exp1',num:1,status:'CONCLUÍDO',statusColor:'#378ADD',titulo:'Lírio Asiático',especie:'Lilium asiaticum',sala:'Sala 4',plantio:'19/nov/2025',ciclo_dias:'~D35',vasos:18,substrato:'Sphagnotec 12',ec_ph:'1,8 / 5,8',fotoperiodo:'12h',potencia:'280–300 µmol/m²/s',temperatura:'25°C / 18°C',
      avaliacoes:[{dia:'D0',data:'19/nov/25',label:'Plantio',obs:'EC 1,8/pH 5,8 · Sala 4'},{dia:'D15',data:'04/dez/25',label:'1ª Avaliação',obs:'Brotação · 24–42 cm'},{dia:'D21',data:'10/dez/25',label:'2ª Avaliação',obs:'Botões · 17–60 cm'},{dia:'D28',data:'17/dez/25',label:'3ª Avaliação',obs:'Florescimento · 28–71 cm'},{dia:'D35',data:'24/dez/25',label:'Est. Colheita',obs:'Ciclo curto · Asiático'}],
      resultados:{botoes:[{nome:'Brindisi',val:3.75},{nome:'Navona',val:3.50},{nome:'Black out',val:3.00},{nome:'Brunello',val:2.67},{nome:'Dazzle',val:2.00}],altura:[{nome:'Brunello',val:74.0},{nome:'Brindisi',val:70.5},{nome:'Black out',val:68.7},{nome:'Navona',val:67.5},{nome:'Dazzle',val:62.8}],v2:{botoes:3.08,altura:69.4,db:'+8,6%',da:'+4,7%'},v1:{botoes:2.83,altura:66.3}},
      aprendizados:['V2 gerou +8,6% botões e +4,7% altura vs. V1','Brindisi e Navona = cultivares mais produtivos','Brunello = maior altura (74 cm)','1 bulbo/vaso: baseline validado'],gaps:['1 bulbo/vaso limita produtividade/m² vs. campo']},
    {id:'exp2',num:2,status:'CONCLUÍDO',statusColor:'#1D9E75',titulo:'Lírio Oriental Sorbonne',especie:'Lilium orientalis cv. Sorbonne',sala:'Sala 6',plantio:'26/fev/2026 (L1) · 05/mar/2026 (L2)',ciclo_dias:'D82 (L1) · D75 (L2)',vasos:18,substrato:'Sphagnotec 12',ec_ph:'1,8 / 5,8',fotoperiodo:'12h',potencia:'280–300 µmol/m²/s',temperatura:'25°C / 18°C',
      lotes:[{label:'Lote 1',plantio:'26/fev',colheita_d:'D82',bulbos:'1–3/vaso',resultado:'✓ Flores rosa · 40% na janela ideal'},{label:'Lote 2',plantio:'05/mar',colheita_d:'D75',bulbos:'1–3/vaso',resultado:'✗ 100% imaturos · D75 insuficiente'}],
      avaliacoes:[{dia:'D0',data:'26/fev/26',label:'Plantio L1',obs:'germ. D+7'},{dia:'D0',data:'05/mar/26',label:'Plantio L2',obs:'germ. D+10'},{dia:'D27/D20',data:'25/mar/26',label:'1ª Aval.',obs:'10–28 cm'},{dia:'D41/D34',data:'08/abr/26',label:'2ª Aval.',obs:'Primórdios florais'},{dia:'D48/D41',data:'15/abr/26',label:'3ª Aval.',obs:'1–3 botões/haste'},{dia:'D55/D48',data:'22/abr/26',label:'4ª Aval.',obs:'49–81 cm'},{dia:'D81/D74',data:'18/mai/26',label:'6ª Aval.',obs:'1ª flor rosa (L1)'},{dia:'D82/D75',data:'19/mai/26',label:'Colheita',obs:'L1 OK · L2 imaturos'},{dia:'D83/D76',data:'20/mai/26',label:'Recebimento',obs:'53 botões · Boticário'}],
      boticario:{total:53,macos:15,vasos:14,janela_ok:21,janela_pct:40,imaturos:24,imaturos_pct:45,degradados:5,degradados_pct:9,lote1:{botoes:19,vasos:10,abertos:10,qualidade:7,degradados:3,pré_abertura:7,imaturos:0},lote2:{botoes:26,vasos:8,abertos:0,imaturos:24,esbranq:2}},
      aprendizados:['Ciclo = D82 — nunca coletar antes de D80','D75: 100% imaturos — ciclo insuficiente','Ponto: botão ≥10cm, rosa, haste ≥28cm','3 bulbos/vaso = melhor densidade (Vaso 3: 8 botões)','V2: +8,6% botões, +4,7% altura'],gaps:['Bulbo 14/16cm vs. padrão 16/18cm','Fotoperíodo 12h vs. 16h recomendado']},
    {id:'exp3',num:3,status:'EM ANDAMENTO',statusColor:'#EF9F27',titulo:'Sorbonne + Zambesi · Alta Densidade',especie:'L. orientalis Sorbonne + Zambesi',sala:'Sala 6 + Sala 2',plantio:'26/mai/2026 (S6) · 29/mai/2026 (S2)',ciclo_dias:'D83–86 (S6) · D80–83 (S2)',vasos:33,substrato:'Sphagnotec 9',ec_ph:'1,8 / 5,8',fotoperiodo:'12h',potencia:'280–300 (S6) · 160–200 (S2) µmol/m²/s',temperatura:'25°C / 18°C',
      salas:[{sala:'Sala 6',vasos:18,densidades:'3/4/5/6/7/8 bulbos/vaso',espectro:'V2',plantio:'26/mai',colheita:'~20/ago · D86'},{sala:'Sala 2',vasos:15,densidades:'5/6/7 bulbos/vaso',espectro:'V2',plantio:'29/mai',colheita:'~17/ago · D80'}],
      destaque:{vasos:'15, 16, 17, 18',tipo:'bulbos frescos · 5–7b/vaso',abertura:'03/jul/2026',dia:'D78',cultivares:'Vaso 15+17: Zambesi · Vaso 16+18: Sorbonne',vs:'D82 Exp.2 · −4 dias · bulbos congelados'},
      hipoteses:[{icon:'✓',title:'Bulbos frescos',desc:'Congelados causam estresse celular que atrasa florescimento. Frescos chegam sem esse trauma.',color:'var(--green)'},{icon:'→',title:'Alta densidade como acelerador?',desc:'5–7b/vaso podem induzir florescimento precoce por competição. A validar com vasos 1–14.',color:'var(--amber)'}],
      avaliacoes:[{dia:'D0',data:'16/abr/26',label:'Plantio vasos 15–18',obs:'frescos · Sala 6'},{dia:'D0',data:'26/mai/26',label:'Plantio S6',obs:'3–8 bulbos'},{dia:'D0',data:'29/mai/26',label:'Plantio S2',obs:'5–7 bulbos'},{dia:'D78',data:'03/jul/26',label:'🏆 Abertura 15–18',obs:'novo recorde · frescos'},{dia:'D83–86',data:'~20/ago/26',label:'Colheita S6',obs:'nunca antes D80'},{dia:'D80–83',data:'~17/ago/26',label:'Colheita S2',obs:'nunca antes D78'}],
      proximas_acoes:['Monitorar vasos 1–14: abertura antes D82 confirma densidade como fator','Colher vasos 15–18: botão ≥10cm · rosa · haste ≥28cm','Comparar flores/m²/ciclo entre densidades 3–8b (S6) e 5–7b (S2)','Incluir Zambesi (15+17) na análise vs. Sorbonne'],
      aprendizados:['D78 (vasos 15–18, frescos) = novo recorde — 4 dias mais rápido que D82','Bulbos frescos eliminam estresse de descongelamento','Alta densidade (5–7b) possivelmente acelera florescimento'],
      gaps:['Vasos 1–14 ainda em ciclo — aguardar colheita','Resultado de flores/m²/ciclo ainda sem dado final']}
  ];

  // ── HELPERS ────────────────────────────────────────────────────
  function B(t,c){return '<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;background:'+c+'22;color:'+c+';margin-right:4px">'+t+'</span>';}
  function K(l,v,s,c){return '<div style="background:var(--bg3);border-radius:8px;padding:10px 12px;min-width:0"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">'+l+'</div><div style="font-size:18px;font-weight:700;color:'+(c||'var(--text)')+';font-family:DM Mono,monospace;line-height:1.1">'+v+'</div>'+(s?'<div style="font-size:10px;color:var(--muted);margin-top:3px">'+s+'</div>':'')+'</div>';}
  function KPI(l,v,s,c){return '<div class="kpi" style="min-width:0"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">'+l+'</div><div style="font-size:20px;font-weight:700;color:'+(c||'var(--text)')+';font-family:DM Mono,monospace;line-height:1.1">'+v+'</div>'+(s?'<div style="font-size:10px;color:var(--muted);margin-top:3px">'+s+'</div>':'')+'</div>';}
  function SH(t,s){return '<div style="margin:18px 0 8px"><div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">'+t+'</div>'+(s?'<div style="font-size:10px;color:var(--muted2);margin-top:1px">'+s+'</div>':'')+'</div>';}
  function HB(v,mx,c){return '<div style="background:var(--bg3);border-radius:3px;height:8px;overflow:hidden;flex:1"><div style="width:'+Math.min(100,Math.round(v/mx*100))+'%;height:100%;background:'+c+';border-radius:3px"></div></div>';}
  function KT(l,d,dt,s,c){return '<div style="background:var(--bg3);border-radius:8px;padding:10px 12px;min-width:0"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">'+l+'</div><div style="display:flex;align-items:baseline;gap:8px;margin-bottom:2px"><div style="font-size:20px;font-weight:700;color:'+(c||'var(--text)')+';font-family:DM Mono,monospace;line-height:1">'+d+'</div><div style="font-size:11px;color:var(--muted2);font-family:DM Mono,monospace">'+dt+'</div></div>'+(s?'<div style="font-size:10px;color:var(--muted);margin-top:2px">'+s+'</div>':'')+'</div>';}

  // ── RENDER CICLO ────────────────────────────────────────────────
  function renderCiclo(c) {
    var tl = '<div style="display:flex;gap:0;overflow-x:auto;padding-bottom:8px;margin-bottom:4px">';
    (c.avaliacoes||[]).forEach(function(a,i,arr){
      tl += '<div style="display:flex;flex-direction:column;align-items:center;min-width:100px;padding:0 4px;position:relative">';
      if(i>0) tl += '<div style="position:absolute;left:0;top:17px;width:50%;height:2px;background:var(--border2)"></div>';
      if(i<arr.length-1) tl += '<div style="position:absolute;right:0;top:17px;width:50%;height:2px;background:var(--border2)"></div>';
      tl += '<div style="width:10px;height:10px;border-radius:50%;background:'+(i===arr.length-1?c.statusColor:'var(--bg3)')+';border:2px solid '+c.statusColor+';margin-bottom:5px;position:relative;z-index:1;flex-shrink:0"></div>';
      tl += '<div style="font-size:13px;font-weight:700;color:'+c.statusColor+';font-family:DM Mono,monospace;text-align:center;line-height:1">'+a.dia+'</div>';
      tl += '<div style="font-size:9px;color:var(--muted);text-align:center;margin-top:1px">'+a.data+'</div>';
      tl += '<div style="font-size:10px;font-weight:600;text-align:center;margin-top:3px;color:var(--text);line-height:1.2">'+a.label+'</div>';
      tl += '<div style="font-size:9px;color:var(--muted2);text-align:center;margin-top:2px;line-height:1.3">'+a.obs+'</div></div>';
    });
    tl += '</div>';
    var sp = '';
    if(c.id==='exp1'&&c.resultados){var r=c.resultados;sp=SH('Botões por cultivar')+r.botoes.map(function(x){return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:72px;font-size:11px">'+x.nome+'</div>'+HB(x.val,4,'var(--blue)')+'<div style="font-size:11px;font-family:DM Mono,monospace;color:var(--muted);width:28px;text-align:right">'+x.val.toFixed(2)+'</div></div>';}).join('')+SH('Altura — D28')+r.altura.map(function(x){return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:72px;font-size:11px">'+x.nome+'</div>'+HB(x.val,80,'var(--purple)')+'<div style="font-size:11px;font-family:DM Mono,monospace;color:var(--muted);width:40px;text-align:right">'+x.val+'cm</div></div>';}).join('')+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div style="background:var(--bg3);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">V2(L1)</div><div style="font-size:13px;font-weight:600;color:var(--purple)">'+r.v2.botoes+' bot · '+r.v2.altura+'cm</div><div style="font-size:10px;color:var(--green)">'+r.v2.db+' · '+r.v2.da+'</div></div><div style="background:var(--bg3);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">V1(L2/L3)</div><div style="font-size:13px;font-weight:600;color:var(--blue)">'+r.v1.botoes+' bot · '+r.v1.altura+'cm</div><div style="font-size:10px;color:var(--muted)">baseline</div></div></div>';}
    if(c.id==='exp2'&&c.boticario){var b=c.boticario;sp=SH('Lotes')+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+(c.lotes||[]).map(function(l){return'<div style="background:var(--bg3);border-radius:8px;padding:10px"><b>'+l.label+' · '+l.plantio+' · '+l.colheita_d+'</b><div style="font-size:10px;color:var(--muted);margin-top:3px">'+l.resultado+'</div></div>';}).join('')+'</div>'+SH('Pós-colheita — Boticário')+'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">'+KPI('Total','53','botões','var(--muted)')+KPI('Janela',b.janela_ok+'/53',b.janela_pct+'%','var(--green)')+KPI('Imaturos',b.imaturos+'/53',b.imaturos_pct+'%','var(--red)')+KPI('Degr.',b.degradados+'/53',b.degradados_pct+'%','var(--amber)')+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px"><div style="background:rgba(29,158,117,.08);border:1px solid rgba(29,158,117,.2);border-radius:8px;padding:10px"><b style="color:var(--green)">Lote 1 — D82 ✓</b><div style="font-size:11px;color:var(--muted);margin-top:4px"><div>✓ 10 abertos (53%)</div><div>✓ 7 qualidade ≥10cm</div><div>✓ 0 imaturos</div></div></div><div style="background:rgba(226,75,74,.08);border:1px solid rgba(226,75,74,.2);border-radius:8px;padding:10px"><b style="color:var(--red)">Lote 2 — D75 ✗</b><div style="font-size:11px;color:var(--muted);margin-top:4px"><div style="color:var(--red)">✗ 0 abertos</div><div style="color:var(--red)">✗ 24 imaturos</div><div style="color:var(--red)">✗ D75=PRECOCE</div></div></div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><div style="background:rgba(29,158,117,.1);border:1px solid rgba(29,158,117,.3);border-radius:7px;padding:8px"><div style="font-size:9px;font-weight:700;color:var(--green);text-transform:uppercase;margin-bottom:3px">✓ IDEAL</div><div style="font-size:10px;line-height:1.5">≥10cm Rosa<br>Haste ≥28cm</div></div><div style="background:rgba(239,159,39,.1);border:1px solid rgba(239,159,39,.3);border-radius:7px;padding:8px"><div style="font-size:9px;font-weight:700;color:var(--amber);text-transform:uppercase;margin-bottom:3px">⚠ LIMITE</div><div style="font-size:10px;line-height:1.5">8–10cm<br>verde→rosa</div></div><div style="background:rgba(226,75,74,.1);border:1px solid rgba(226,75,74,.3);border-radius:7px;padding:8px"><div style="font-size:9px;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:3px">✗ RECUSAR</div><div style="font-size:10px;line-height:1.5">&lt;6cm verde<br>&gt;96h=esbranq.</div></div></div>';}
    if(c.id==='exp3'&&c.destaque){var d=c.destaque;sp='<div style="background:linear-gradient(135deg,rgba(29,158,117,.15),rgba(239,159,39,.1));border:1.5px solid rgba(29,158,117,.4);border-radius:10px;padding:14px;margin-bottom:12px"><div style="font-size:14px;font-weight:700;color:var(--green);margin-bottom:4px">🏆 Novo Recorde — '+d.dia+' · '+d.abertura+'</div><div style="font-size:11px;color:var(--muted);margin-bottom:8px">Vasos '+d.vasos+' · '+d.tipo+' · vs: '+d.vs+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+(c.hipoteses||[]).map(function(h){return'<div style="background:rgba(0,0,0,.2);border-radius:7px;padding:10px"><div style="font-size:10px;font-weight:700;color:'+h.color+';text-transform:uppercase;margin-bottom:3px">'+h.icon+' '+h.title+'</div><div style="font-size:11px;color:var(--muted);line-height:1.4">'+h.desc+'</div></div>';}).join('')+'</div></div>'+SH('Salas')+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+(c.salas||[]).map(function(s){return'<div style="background:var(--bg3);border-radius:8px;padding:10px"><b>'+s.sala+' · '+s.vasos+' vasos</b><div style="font-size:10px;color:var(--muted);line-height:1.5;margin-top:4px">Densidades: <b style="color:var(--amber)">'+s.densidades+'</b><br>'+s.espectro+' · '+s.plantio+' · <b style="color:var(--amber)">'+s.colheita+'</b></div></div>';}).join('')+'</div>'+SH('Próximas ações')+(c.proximas_acoes||[]).map(function(a,i){return'<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:var(--muted2);font-size:11px;flex-shrink:0">'+(i+1)+'.</span><span style="font-size:11px;color:var(--muted)">'+a+'</span></div>';}).join('');}
    var conds=[['Sala',c.sala],['Substrato',c.substrato],['EC/pH',c.ec_ph],['Fotoperíodo',c.fotoperiodo],['Potência',c.potencia],['Temperatura',c.temperatura]];
    var apr=(c.aprendizados||[]).map(function(a){return'<div style="display:flex;gap:6px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:11px"><span style="color:var(--green);flex-shrink:0">✓</span><span style="color:var(--muted)">'+a+'</span></div>';}).join('');
    var gaps=(c.gaps||[]).map(function(g){return'<div style="display:flex;gap:6px;padding:4px 0;font-size:11px"><span style="color:var(--amber);flex-shrink:0">→</span><span style="color:var(--muted)">'+g+'</span></div>';}).join('');
    return '<div style="padding:14px 0">'+SH('Linha do tempo · D0 = transplantio')+tl+sp+SH('Condições')+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px;margin-bottom:12px">'+conds.map(function(kv){return'<div style="background:var(--bg3);border-radius:7px;padding:8px 10px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:2px">'+kv[0]+'</div><div style="font-size:11px;font-weight:600;font-family:DM Mono,monospace">'+(kv[1]||'–')+'</div></div>';}).join('')+'</div>'+SH('Aprendizados')+'<div style="margin-bottom:10px">'+apr+'</div>'+(c.gaps&&c.gaps.length?SH('Gaps')+'<div>'+gaps+'</div>':'')+'</div>';
  }

  // ── BUILD LIRIO TAB ────────────────────────────────────────────
  function buildLirioTab(ac) {
    var ciclos=CICLOS_DATA,active=null;
    for(var i=0;i<ciclos.length;i++){if(ciclos[i].id===ac){active=ciclos[i];break;}}
    if(!active)active=ciclos[0];
    var kpis='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:20px">'+K('🏆 Ciclo recorde','D78','vasos 15–18 · frescos','var(--green)')+K('Ciclo base','D82','Exp.2 · L1 · congelado','var(--muted)')+K('Ganho frescos','−4 dias','confirmado','var(--amber)')+K('Flores OK','40%','21/53 · janela ideal','var(--green)')+K('Botões atual','1–3','bulbo 14/16cm','var(--red)')+K('Botões meta','4–7','bulbo 16/18cm','var(--green)')+'</div>';
    var cards='<div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Histórico — clique para detalhar</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">'+ciclos.map(function(c){var col=c.id===active.id?c.statusColor:'var(--border)';var bg=c.id===active.id?'rgba('+(c.statusColor==='#1D9E75'?'29,158,117':c.statusColor==='#378ADD'?'55,138,221':'239,159,39')+',.08)':'var(--bg2)';return'<div onclick="sproutSelectCiclo(\''+c.id+'\')" style="cursor:pointer;background:'+bg+';border:1.5px solid '+col+';border-radius:12px;padding:14px 16px"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px">Exp. '+c.num+'</div><div style="font-size:14px;font-weight:700">'+c.titulo+'</div><div style="font-size:10px;color:var(--muted);margin-top:2px"><em>'+c.especie+'</em></div></div><span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;background:'+c.statusColor+'22;color:'+c.statusColor+'">'+c.status+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;color:var(--muted)"><div>📅 <b style="color:var(--text)">'+c.plantio.split('(')[0].trim()+'</b></div><div>⏱ <b style="color:'+c.statusColor+'">'+c.ciclo_dias+'</b></div><div>🏠 '+c.sala+'</div><div>🪴 '+(c.vasos||c.vasos_total)+' vasos</div></div><div style="margin-top:8px;font-size:10px;color:'+(c.id===active.id?c.statusColor:'var(--muted)')+';font-weight:'+(c.id===active.id?'700':'400')+'">'+(c.id===active.id?'▼ detalhes abertos':'Clique →')+'</div></div>';}).join('')+'</div>';
    var detail='<div style="background:var(--bg2);border:1px solid var(--border);border-left:4px solid '+active.statusColor+';border-radius:12px;padding:0 18px 18px"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0 10px;border-bottom:1px solid var(--border);margin-bottom:4px"><div><div style="font-size:15px;font-weight:700">Exp. '+active.num+' · '+active.titulo+'</div><div style="font-size:11px;color:var(--muted);margin-top:2px"><em>'+active.especie+'</em> · '+active.sala+'</div></div><span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;background:'+active.statusColor+'22;color:'+active.statusColor+'">'+active.status+'</span></div>'+renderCiclo(active)+'</div>';
    return kpis+cards+detail;
  }

  function buildPatchouliTab(){return'<div style="background:var(--bg3);border-radius:10px;padding:14px;margin-bottom:14px"><div style="font-size:11px;color:var(--muted);line-height:1.6"><em>Pogostemon cablin</em> — fixador de fragrâncias Boticário. Indonésia domina ~80% do mercado. 100% Livre é <b style="color:var(--green)">pioneiro em cultivo indoor comercial</b>.</div></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:16px">'+K('Status','Ativo','em produção','var(--green)')+K('Ciclo campo','120–180d','convencional','var(--muted)')+K('Óleo campo','US$35–70','por kg','var(--amber)')+K('Óleo orgânico','US$90–120','certificado · alvo','var(--green)')+'</div><div style="background:rgba(239,159,39,.08);border:1px solid rgba(239,159,39,.2);border-radius:8px;padding:12px;margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase;margin-bottom:8px">Perguntas críticas</div>'+['Teor de patchoulol? → análise GC laboratorial','Rendimento folha seca/m²? → base do ROI','Volume mínimo Boticário? → define escala'].map(function(q,i){return'<div style="display:flex;gap:8px;padding:4px 0;font-size:11px;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:var(--amber)">'+(i+1)+'.</span><span style="color:var(--muted)">'+q+'</span></div>';}).join('')+'</div><div style="font-size:10px;color:var(--muted2);padding:8px;background:var(--bg3);border-radius:6px">📌 Foco atual: finalizar Lírio (Exp. 3), depois aprofundar Patchouli.</div>';}

  function buildBoticView(ae,at){
    ae=ae||'exp1';at=at||'lirio';
    return '<div style="padding-bottom:40px"><div style="background:var(--bg2);border-radius:12px;padding:16px 18px;margin-bottom:16px;border-left:4px solid #1D9E75"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px"><div><div style="font-size:20px;font-weight:700;letter-spacing:-.01em">🌿 B2B — Grupo Boticário</div><div style="font-size:11px;color:var(--muted);margin-top:3px">Contrato ativo · Osasco / Ipiranga · Lírio · Patchouli · Gardênia · Rosa</div></div><div>'+B('CONTRATO ATIVO','#1D9E75')+B('INGREDIENTE COSMÉTICO','#7F77DD')+B('ZERO AGROTÓXICO','#378ADD')+'</div></div></div><div style="display:flex;gap:8px;margin-bottom:20px"><button id="btab-lirio" onclick="sproutBoticTab(\'lirio\')" style="padding:8px 18px;border-radius:8px;border:1.5px solid '+(at==='lirio'?'var(--green)':'var(--border2)')+';background:'+(at==='lirio'?'rgba(29,158,117,.15)':'transparent')+';color:'+(at==='lirio'?'var(--green)':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🌸 Lírio (Lilium)</button><button id="btab-patchouli" onclick="sproutBoticTab(\'patchouli\')" style="padding:8px 18px;border-radius:8px;border:1.5px solid '+(at==='patchouli'?'var(--purple)':'var(--border2)')+';background:'+(at==='patchouli'?'rgba(127,119,221,.15)':'transparent')+';color:'+(at==='patchouli'?'var(--purple)':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🌿 Patchouli</button></div><div id="botic-content-lirio" style="'+(at==='lirio'?'':'display:none')+'">'+buildLirioTab(ae)+'</div><div id="botic-content-patchouli" style="'+(at==='patchouli'?'':'display:none')+'">'+buildPatchouliTab()+'</div></div>';
  }

  // ── GLOBAL INTERACTION FUNCTIONS ───────────────────────────────
  window._activeLirioExp = 'exp1';
  window._activeBotTab   = 'lirio';
  window._CICLOS = CICLOS_DATA;

  window.sproutSelectCiclo = function(id) {
    window._activeLirioExp = id;
    var vb = document.getElementById('view-boticario');
    if(vb) vb.innerHTML = buildBoticView(id, 'lirio');
    document.getElementById('view-boticario').scrollIntoView({behavior:'smooth',block:'start'});
  };

  window.sproutBoticTab = function(t) {
    window._activeBotTab = t;
    var vb = document.getElementById('view-boticario');
    if(vb) vb.innerHTML = buildBoticView(window._activeLirioExp, t);
  };

  // ── SHOW BOTICARIO (called by nav button) ──────────────────────
  window.sproutShowBoticario = function() {
    // Hide all views
    var allViews = document.querySelectorAll('[id^="view-"]');
    for(var i=0;i<allViews.length;i++) allViews[i].style.display = 'none';
    // Show boticario
    var vb = document.getElementById('view-boticario');
    if(vb) {
      vb.style.display = '';
      vb.innerHTML = buildBoticView(window._activeLirioExp, window._activeBotTab);
    }
    // Update page title
    var pt=document.getElementById('page-title'), ps=document.getElementById('page-sub');
    if(pt) pt.textContent = 'B2B — Grupo Boticário';
    if(ps) ps.textContent = 'Lírio · Patchouli · 3 ciclos de experimento';
    // Update nav active state
    var navItems = document.querySelectorAll('.nav-item');
    for(var i=0;i<navItems.length;i++) navItems[i].classList.remove('active');
    var btn = document.querySelector('[onclick="sproutShowBoticario()"]');
    if(btn) btn.classList.add('active');
  };

  // ── LIRIO HTML para aba Experimentos ──────────────────────────
  function buildLirioExpHtml() {
    return '<div class="ecard ec-prod"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px"><div><div style="font-size:18px;font-weight:700;letter-spacing:-.01em">🌸 Lírio (Lilium)</div><div style="font-size:11px;color:var(--muted);margin-top:3px">Sala 4 · Sala 6 · Sala 2 · Grupo Boticário · Ingrediente cosmético</div></div><div><span class="ebadge ec-prod">Em Produção</span><span class="ebadge ec-val" style="margin-left:4px">Exp. 3 em andamento</span><span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;background:rgba(29,158,117,.2);color:var(--green);margin-left:4px">🏆 Recorde D78</span></div></div>'+SH('KPIs consolidados — 3 Experimentos')+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px">'+K('🏆 Recorde Exp.3','D78','vasos 15–18 · frescos · 03/jul','var(--green)')+K('D75 reprovado','0 flores','Lote 2 · 100% imaturos','var(--red)')+K('Flores OK Exp.2','21/53','40% · janela ideal','var(--green)')+K('Melhor densidade','3 bulbos','Vaso 3 · 8 botões','var(--green)')+K('V2 vs V1','+8,6%','botões · +4,7% altura','var(--purple)')+K('Colheita alvo','~ago/26','S6: D83–86 · S2: D80–83','var(--amber)')+K('Botões/haste atual','1–3','bulbo 14/16cm','var(--red)')+K('Botões/haste meta','4–7','bulbo 16/18cm','var(--green)')+'</div></div><div class="ecard ec-neg" style="margin-top:14px"><div style="font-size:13px;font-weight:700;margin-bottom:2px">Experimento 1 · Lírio Asiático · <span style="font-weight:400;color:var(--muted)">Sala 4 · D0: 19/nov/25</span></div>'+SH('Linha do tempo')+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(115px,1fr));gap:8px;margin-bottom:14px">'+KT('Plantio','D0','19/nov/25','Sala 4','var(--muted)')+KT('1ª Avaliação','D15','04/dez/25','24–42 cm','var(--blue)')+KT('2ª Avaliação','D21','10/dez/25','botões · 17–60cm','var(--blue)')+KT('3ª Avaliação','D28','17/dez/25','28–71 cm','var(--blue)')+KT('Est. Colheita','D35','24/dez/25','ciclo curto','var(--amber)')+'</div>'+SH('Botões por cultivar')+CICLOS_DATA[0].resultados.botoes.map(function(x){return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:72px;font-size:11px">'+x.nome+'</div>'+HB(x.val,4,'var(--blue)')+'<div style="font-size:11px;font-family:DM Mono,monospace;color:var(--muted);width:28px;text-align:right">'+x.val.toFixed(2)+'</div></div>';}).join('')+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div style="background:var(--bg3);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">V2(L1)</div><div style="font-size:13px;font-weight:600;color:var(--purple)">3,08 bot · 69,4cm</div><div style="font-size:10px;color:var(--green)">+8,6% botões · +4,7% altura</div></div><div style="background:var(--bg3);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">V1(L2/L3)</div><div style="font-size:13px;font-weight:600;color:var(--blue)">2,83 bot · 66,3cm</div><div style="font-size:10px;color:var(--muted)">baseline</div></div></div></div><div class="ecard ec-prod" style="margin-top:14px"><div style="font-size:13px;font-weight:700;margin-bottom:2px">Experimento 2 · Sorbonne · <span style="font-weight:400;color:var(--muted)">Sala 6 · L1: 26/fev · L2: 05/mar</span></div>'+SH('Linha do tempo · D0 por lote')+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:8px">'+KT('Plantio L1','D0','26/fev/26','germ. D+7','var(--muted)')+KT('Plantio L2','D0','05/mar/26','germ. D+10','var(--muted)')+KT('2ª Aval.','D41/D34','08/abr/26','primórdios florais','var(--blue)')+KT('3ª Aval.','D48/D41','15/abr/26','1–3 botões/haste','var(--blue)')+KT('6ª Aval.','D81/D74','18/mai/26','1ª flor rosa (L1)','var(--green)')+KT('Colheita','D82/D75','19/mai/26','L1 OK · L2 imaturos','var(--amber)')+KT('Recebimento','D83/D76','20/mai/26','53 botões · Boticário','var(--green)')+'</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">'+K('Recebido','53','botões · 15 maços','var(--muted)')+K('Janela ideal','21/53','40% · rosa ≥10cm','var(--green)')+K('Imaturos','24/53','45% · L2 · D75','var(--red)')+K('Degradados','5/53','9%','var(--amber)')+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div style="background:rgba(29,158,117,.08);border:1px solid rgba(29,158,117,.2);border-radius:8px;padding:10px"><div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:5px">Lote 1 — D82 · 26/fev ✓</div><div style="font-size:11px;color:var(--muted);display:grid;gap:2px"><div>✓ 10 abertos (53%)</div><div>✓ 7 com qualidade ≥10cm</div><div>✓ 0 imaturos — D82 = correto</div></div></div><div style="background:rgba(226,75,74,.08);border:1px solid rgba(226,75,74,.2);border-radius:8px;padding:10px"><div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:5px">Lote 2 — D75 · 05/mar ✗</div><div style="font-size:11px;color:var(--muted);display:grid;gap:2px"><div style="color:var(--red)">✗ 0 abertos</div><div style="color:var(--red)">✗ 24 imaturos · verdes 4–8cm</div><div style="color:var(--red)">✗ D75 = PRECOCE</div></div></div></div></div><div class="ecard ec-val" style="margin-top:14px"><div style="font-size:13px;font-weight:700;margin-bottom:8px">Experimento 3 · Sorbonne + Zambesi · Alta Densidade <span style="font-size:10px;font-weight:400;color:var(--muted)">Sala 6 + Sala 2 · 26/mai/26</span></div><div style="background:linear-gradient(135deg,rgba(29,158,117,.15),rgba(239,159,39,.1));border:1.5px solid rgba(29,158,117,.4);border-radius:10px;padding:14px;margin-bottom:12px"><div style="font-size:14px;font-weight:700;color:var(--green);margin-bottom:4px">🏆 Novo Recorde — D78 · 03/jul/26</div><div style="font-size:11px;color:var(--muted);margin-bottom:8px">Vasos 15–18 · bulbos frescos · 5–7b/vaso · −4 dias vs. D82 Exp.2</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div style="background:rgba(0,0,0,.2);border-radius:7px;padding:10px"><div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;margin-bottom:3px">✓ Bulbos frescos</div><div style="font-size:11px;color:var(--muted);line-height:1.4">Congelados causam estresse celular. Frescos chegam sem esse trauma.</div></div><div style="background:rgba(0,0,0,.2);border-radius:7px;padding:10px"><div style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase;margin-bottom:3px">→ Alta densidade?</div><div style="font-size:11px;color:var(--muted);line-height:1.4">5–7b/vaso pode induzir florescimento precoce. A validar com vasos 1–14.</div></div></div></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(115px,1fr));gap:8px;margin-bottom:12px">'+KT('Plantio vasos 15–18','D0','16/abr/26','frescos · Sala 6','var(--muted)')+KT('Plantio S6','D0','26/mai/26','3–8 bulbos','var(--muted)')+KT('Plantio S2','D0','29/mai/26','5–7 bulbos','var(--muted)')+KT('🏆 Abertura 15–18','D78','03/jul/26','recorde · frescos','var(--green)')+KT('Colheita S6','D83–86','~20/ago','nunca antes D80','var(--amber)')+KT('Colheita S2','D80–83','~17/ago','nunca antes D78','var(--amber)')+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div style="background:var(--bg3);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Sala 6 · 18 vasos</div><div style="font-size:11px;line-height:1.5">Densidades: <b style="color:var(--amber)">3/4/5/6/7/8 b/vaso</b><br>V2 · Plantio 26/mai · ~20/ago</div></div><div style="background:var(--bg3);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Sala 2 · 15 vasos</div><div style="font-size:11px;line-height:1.5">Densidades: <b style="color:var(--amber)">5/6/7 b/vaso</b><br>V2 · Plantio 29/mai · ~17/ago</div></div></div></div>';
  }

  // ── INSTALL ────────────────────────────────────────────────────
  function install() {
    var main = document.querySelector('main.main');
    if(!main) { setTimeout(install, 300); return; }

    // 1. Create view-boticario
    if(!document.getElementById('view-boticario')) {
      var vb = document.createElement('div');
      vb.id = 'view-boticario';
      vb.style.display = 'none';
      main.appendChild(vb);
    }

    // 2. Add Boticário nav button (uses sproutShowBoticario — always works)
    var navLbls = document.querySelectorAll('.nav-lbl'), b2s = null;
    for(var i=0;i<navLbls.length;i++){if(navLbls[i].textContent.trim()==='B2B / JV'){b2s=navLbls[i].parentElement;break;}}
    if(b2s && !document.querySelector('[onclick="sproutShowBoticario()"]')) {
      var nb = document.createElement('button');
      nb.className = 'nav-item';
      nb.setAttribute('onclick', 'sproutShowBoticario()');
      nb.innerHTML = '<span class="nav-dot"></span>Boticário';
      b2s.appendChild(nb);
    }

    // 3. ALSO patch setView if it exists on window (for localhost)
    if(typeof window.setView === 'function') {
      var _sv = window.setView;
      window.setView = function(v) {
        _sv(v);
        if(v === 'boticario') { sproutShowBoticario(); }
      };
    }

    // 4. Intercept Lírio tab click via event delegation (works everywhere)
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('button');
      if(!btn) return;
      var oc = btn.getAttribute('onclick') || '';
      // Lírio tab click
      if(oc.includes("setExpTab('lirio')") || oc.includes('setExpTab("lirio")') || btn.textContent.trim() === 'Lírio') {
        setTimeout(function() {
          var ec = document.getElementById('exp-content');
          if(ec) ec.innerHTML = buildLirioExpHtml();
        }, 60);
      }
      // Morango nav (already works natively — no touch needed)
    }, true);

    // 5. Save to localStorage for this domain
    try {
      localStorage.setItem('sprout_ciclos_v2', JSON.stringify(CICLOS_DATA));
      localStorage.setItem('sprout_patch_ver', '2025-07-05-v2');
    } catch(e) {}

    console.log('[Sprout v2] ✓ installed — event delegation, domain-agnostic');
  }

  // Multiple retries — handles Firebase async loading delay
  setTimeout(install, 1000);
  setTimeout(install, 2000);
  setTimeout(install, 4000);
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(install, 1000);
      setTimeout(install, 2500);
    });
  }

})();
