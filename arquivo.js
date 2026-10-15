/* =====================================================================
 * GABOrg · arquivo.js — aplicação completa (front-end)
 * Secretaria de Estado de Educação de Mato Grosso · Decreto nº 2.236/2026
 * Arquivos do sistema: index.html (tela e estilos) + arquivo.js (este) + Codigo.gs (backend no Apps Script)
 * ===================================================================== */

/* ===================== APP INSTALÁVEL: ÍCONES E MANIFESTO GERADOS AQUI =====================
 * Nada de arquivos extras: os ícones são desenhados num canvas e o manifesto é montado em memória. */
(function prepararApp(){
  function icone(tam, cheio, margem){
    const c = document.createElement('canvas'); c.width = c.height = tam;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, tam);
    gr.addColorStop(0, '#2563eb'); gr.addColorStop(1, '#0e7490'); g.fillStyle = gr;
    const r = cheio ? 0 : tam * .22;
    g.beginPath(); g.moveTo(r, 0); g.arcTo(tam, 0, tam, tam, r); g.arcTo(tam, tam, 0, tam, r); g.arcTo(0, tam, 0, 0, r); g.arcTo(0, 0, tam, 0, r); g.closePath(); g.fill();
    const u = tam * margem, o = (tam - u) / 2, X = v => o + v * u, Y = v => o + v * u;
    g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = Math.max(1.5, u * .045); g.lineCap = 'square';
    g.beginPath(); g.moveTo(X(.5), Y(.3)); g.lineTo(X(.5), Y(.47)); g.moveTo(X(.17), Y(.47)); g.lineTo(X(.83), Y(.47));
    [.17, .5, .83].forEach(x => { g.moveTo(X(x), Y(.47)); g.lineTo(X(x), Y(.62)); }); g.stroke();
    const caixa = (x0, y0, x1, y1) => { const rr = u * .05; g.beginPath(); g.moveTo(X(x0) + rr, Y(y0)); g.arcTo(X(x1), Y(y0), X(x1), Y(y1), rr); g.arcTo(X(x1), Y(y1), X(x0), Y(y1), rr); g.arcTo(X(x0), Y(y1), X(x0), Y(y0), rr); g.arcTo(X(x0), Y(y0), X(x1), Y(y0), rr); g.closePath(); g.fill(); };
    caixa(.30, .08, .70, .32); [.17, .5, .83].forEach(x => caixa(x - .15, .62, x + .15, .86));
    return c.toDataURL('image/png');
  }
  const link = (rel, href, extra) => { const l = document.createElement('link'); l.rel = rel; l.href = href; Object.assign(l, extra || {}); document.head.appendChild(l); };
  try {
    const i192 = icone(192, false, .78), i512 = icone(512, false, .78), iMask = icone(512, true, .62);
    link('icon', icone(32, false, .82), { type:'image/png' });
    link('apple-touch-icon', icone(180, true, .78));
    const base = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
    const manifesto = {
      name:'GABOrg · Organização Institucional SEDUC-MT', short_name:'GABOrg',
      description:'Setores, hierarquias, valores, impactos e validações da SEDUC-MT, com mapa interativo da estrutura.',
      id:base, start_url:base, scope:base, display:'standalone', orientation:'any',
      background_color:'#0b1222', theme_color:'#0b1222', lang:'pt-BR',
      icons:[{ src:i192, sizes:'192x192', type:'image/png', purpose:'any' }, { src:i512, sizes:'512x512', type:'image/png', purpose:'any' }, { src:iMask, sizes:'512x512', type:'image/png', purpose:'maskable' }]
    };
    link('manifest', 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifesto)));
  } catch (e) {}
})();

'use strict';
/* =====================================================================
   GABOrg · Organização institucional da SEDUC-MT
   Front-end único. Backend: Google Apps Script + Google Sheets (Codigo.gs)
   ===================================================================== */
const VERSAO = '1.4.0';
const NW = 236, NH = 82, GX = 26, GY = 50, GV = 14, IND = 30;

const TIPOS = {
  'Gabinete':           { cor:'#1e3a8a', ic:'fa-landmark', estilo:'cheio' },
  'Superintendência':   { cor:'#2563eb', ic:'fa-sitemap', estilo:'tinto' },
  'Coordenadoria':      { cor:'#0891b2', ic:'fa-diagram-project' },
  'Gerência':           { cor:'#0d9488', ic:'fa-briefcase' },
  'Núcleo':             { cor:'#14b8a6', ic:'fa-circle-nodes' },
  'Unidade':            { cor:'#7c3aed', ic:'fa-cube' },
  'Conselho':           { cor:'#475569', ic:'fa-people-group', estilo:'tinto' },
  'Colegiado':          { cor:'#64748b', ic:'fa-users-rectangle' },
  'Câmara':             { cor:'#78716c', ic:'fa-scale-balanced' },
  'Secretaria':         { cor:'#a16207', ic:'fa-file-signature' },
  'Comissão':           { cor:'#db2777', ic:'fa-handshake' },
  'Ouvidoria':          { cor:'#e11d48', ic:'fa-comments' },
  'Diretoria':          { cor:'#ea580c', ic:'fa-building-columns', estilo:'tinto' },
  'Diretoria Adjunta':  { cor:'#f59e0b', ic:'fa-building' },
  'Núcleo Regional':    { cor:'#65a30d', ic:'fa-location-dot' },
  'Unidades Escolares': { cor:'#16a34a', ic:'fa-school' },
  'Outro':              { cor:'#475569', ic:'fa-shapes' }
};
const STATUS_SETOR = { 'Ativo':'#16a34a', 'Em revisão':'#d97706', 'Proposto':'#2563eb', 'Extinto':'#94a3b8' };
const STATUS_VAL = { 'Sem validação':'#94a3b8', 'Pendente':'#d97706', 'Aprovado':'#16a34a', 'Aprovado com ressalvas':'#0891b2', 'Reprovado':'#dc2626' };
const IMPACTO = [ ['Não avaliado','#94a3b8'], ['Muito baixo','#22c55e'], ['Baixo','#84cc16'], ['Médio','#eab308'], ['Alto','#f97316'], ['Crítico','#dc2626'] ];
const TIPOS_VINCULO = ['Apoio técnico','Supervisão','Fluxo de processos','Colaboração','Atuação regional','Vinculação administrativa'];
const PALETA_AREA = ['#1e3a8a','#0891b2','#7c3aed','#ea580c','#059669','#db2777','#ca8a04','#4f46e5','#0d9488','#9333ea','#64748b','#be123c'];

const CAMPOS = {
  setores: ['id','nome','sigla','tipo','paiId','ordem','status','responsavel','contato','competencias','entregas','orcamento','custoMensal','servidores','comissionados','impacto','impactoDescricao','positivos','negativos','layout','colunas','dx','dy','atualizadoEm','atualizadoPor'],
  validacoes: ['id','setorId','validadorId','status','parecer','solicitadoEm','solicitadoPor','respondidoEm','respondidoPor'],
  vinculos: ['id','origemId','destinoId','tipo','descricao'],
  historico: ['id','setorId','data','usuario','acao'],
  rubricas: ['id','codigo','nome','categoria','valorMensal','encargos','meses','observacao','ativo','atualizadoEm','atualizadoPor'],
  despesas: ['id','setorId','rubricaId','descricao','quantidade','valorUnitario','meses','cenario','observacao','atualizadoEm','atualizadoPor']
};
const TABS_DB = ['setores','validacoes','vinculos','historico','rubricas','despesas'];

/* ===================== ESTRUTURA DO DECRETO Nº 2.236/2026 =====================
   Hierarquia montada a partir do anexo (organograma). Cada nível = 2 espaços.
   [SIGLA] opcional · {h6} = filhos lado a lado em até 6 colunas · {v} = filhos em lista */
const SEED_TXT = `
Gabinete do Secretário de Estado de Educação [GS] {h8}
  Colégio Diretivo Estratégico
  Colégio de Avaliação das Estratégias
  Comitês Setoriais
  Conselho Estadual de Alimentação Escolar [CEAE]
  Conselho Estadual de Educação Indígena [CEEI]
  Núcleo de Gestão Estratégica para Resultados [NGER]
  Unidade de Desenvolvimento Organizacional
  Unidade de Comunicação da Educação
  Unidade Setorial PGE
  Ouvidoria Setorial
  Comissão de Ética
  Unidade Setorial de Correição
  Unidade Setorial de Controle Interno [UNISECI]
  Unidade de Apoio Estratégico
  Gabinete de Direção
  Unidade de Assessoria
  Conselho Estadual de Educação [CEE]
    Secretaria do Conselho
    Coordenadoria de Apoio às Câmaras
      Câmara de Educação Básica
      Câmara de Educação Profissional e Ensino Superior
    Coordenadoria de Suporte Operacional
  Gabinete do Secretário Adjunto Executivo [SAEX]
    Unidade de Coordenação do Programa
    Unidade de Cerimonial
    Unidade de Microplanejamento
    Unidade Executiva e de Negócios da Secretaria Adjunta Executiva
    Unidade de Normas da Secretaria Adjunta Executiva
    Unidade de Inteligência de Dados na Educação
    Superintendência de Tecnologia da Informação [STI]
      Coordenadoria de Desenvolvimento de Soluções de TI
        Núcleo de Análise e Desenvolvimento de Soluções de TI
        Núcleo de Inteligência de Negócios
        Núcleo de Tecnologias Educacionais
      Coordenadoria de Infraestrutura e Segurança da Informação
        Núcleo de Infraestrutura de TI
        Núcleo de Suporte Técnico de TI
        Núcleo de Serviços de TI
        Núcleo de Segurança da Informação e Proteção de Dados
    Superintendência de Escolas Estaduais Militares e Cívico-Militares
      Núcleo de Escolas Estaduais Militares
      Núcleo de Escolas Estaduais Cívico-Militares
  Gabinete do Secretário Adjunto de Gestão de Pessoas [SAGP]
    Unidade Executiva e de Negócio da Gestão de Pessoas
    Unidade de Normas da Gestão de Pessoas
    Unidade de Políticas de Formação Continuada
    Superintendência de Provimento e Movimentação
      Coordenadoria de Provimento
        Núcleo de Quadro de Pessoal
      Coordenadoria de Movimentação
      Coordenadoria de Recrutamento e Seleção
        Núcleo de Seletivos
    Superintendência de Desenvolvimento, Aplicação, Saúde e Segurança
      Coordenadoria de Saúde e Segurança
      Coordenadoria de Aplicação e Vida Funcional
        Núcleo de Progressão e Enquadramento Funcional
        Núcleo de Informação da Vida Funcional
      Coordenadoria de Desenvolvimento
        Núcleo de e-Formação e Mídia
        Núcleo de Monitoramento da Qualificação Profissional
        Núcleo de Estágio e Residência
        Núcleo de Logística de Formação
    Superintendência de Monitoramento e Folha de Pagamento
      Coordenadoria de Controle de Despesa e Conformidade da Folha
        Núcleo de Conformidade da Folha
        Núcleo de Controle de Despesas de Pessoal
        Núcleo de Impacto Pessoal
      Coordenadoria de Monitoramento de Pessoal
        Núcleo de Gestão da Assiduidade
  Gabinete do Secretário Adjunto de Infraestrutura e Patrimônio [SAIP]
    Unidade Executiva e de Negócio da Infraestrutura e Patrimônio
    Unidade de Normas da Infraestrutura e Patrimônio
    Superintendência de Patrimônio
      Coordenadoria de Patrimônio Imobiliário
        Núcleo de Patrimônio Imobiliário
      Coordenadoria de Patrimônio Mobiliário
        Núcleo de Patrimônio Mobiliário
    Superintendência de Obras
      Coordenadoria de Execução de Obras
        Núcleo de Fiscalização de Obras
      Coordenadoria de Projetos e Manutenção
        Núcleo de Desenvolvimento de Projetos
        Núcleo de Manutenção
        Núcleo de Infraestrutura
  Gabinete do Secretário Adjunto de Administração Sistêmica [SAAS]
    Unidade Executiva e de Negócio da Administração Sistêmica
    Unidade de Normas da Administração Sistêmica
    Superintendência de Aquisições e Contratos
      Coordenadoria de Gestão de Aquisições
      Coordenadoria de Gestão de Contratos
        Núcleo de Processo de Irregularidade Contratual
        Núcleo de Conformidade de Pagamentos de Contratos
    Superintendência de Finanças
      Coordenadoria de Orçamento
        Núcleo de Conformidade
      Coordenadoria Financeira
        Núcleo de Receita
    Superintendência Contábil
      Gerência de Informações Contábeis
      Gerência de Prestação e Conformidade
      Gerência de Sistema de Informação Orçamentário Público da Educação
    Superintendência Administrativa
      Coordenadoria Administrativa
        Gerência de Protocolo
        Gerência de Arquivo Central
        Núcleo de Serviços Gerais
      Núcleo de Frotas
    Superintendência de Convênios e Prestação de Contas
      Coordenadoria de Convênios e Prestação de Contas
        Núcleo de Convênios de Ingresso
        Núcleo de Convênios de Descentralização
        Núcleo de Análise de Projetos de Descentralização
        Núcleo de Prestação de Contas
        Núcleo de Prestação de Contas de Diárias
  Gabinete do Secretário Adjunto de Gestão Educacional [SAGE]
    Unidade Executiva e de Negócio da Gestão Educacional
    Unidade de Normas da Gestão Educacional
    Unidade de Cenários e Indicadores da Gestão Educacional
    Superintendência de Desenvolvimento Curricular
      Coordenadoria de Ensino Fundamental
      Coordenadoria de Ensino Médio
      Coordenadoria de Educação de Jovens e Adultos
      Coordenadoria de Educação Integrada e Inovação
      Núcleo de Currículo
      Núcleo do Sistema Estruturado de Ensino no Ensino Fundamental
      Núcleo do Sistema Estruturado de Ensino no Ensino Médio
    Superintendência de Equidade e Inclusão
      Coordenadoria de Educação Inclusiva
        Centro de Apoio e Suporte à Inclusão da Educação Especial [CASIES]
      Coordenadoria de Educação Escolar Indígena
      Coordenadoria de Educação Étnico-Racial e Ambiental
    Superintendência de Avaliação de Educação Básica
      Coordenadoria de Monitoramento e Avaliação Educacional
        Núcleo de Análise da Aprendizagem
      Coordenadoria de Gestão para Aprendizagem
        Núcleo de Recomposição das Aprendizagens
        Núcleo de Acompanhamento de Prioridades Pedagógicas
    Superintendência de Educação Profissional, Tecnológica e Tempo Integral
      Coordenadoria de Educação Profissional Tecnológica
      Coordenadoria de Educação em Tempo Integral
  Gabinete do Secretário Adjunto de Gestão Regional [SAGR] {h5}
    Unidade Executiva e de Negócio da Gestão Regional
    Unidade de Normas da Gestão Regional
    Unidade de Cenários da Gestão Regional
    Unidades Escolares
    Superintendência de Gestão Regional
      Núcleo de Monitoramento das DREs
    Superintendência de Gestão Escolar
      Coordenadoria de Gestão da Rede
        Núcleo de Estrutura e Funcionamento de Gestão Escolar
        Núcleo de Mediação Escolar
        Núcleo de Gestão de Repasses
        Núcleo de Escrituração
        Núcleo de Matrículas
        Núcleo de Bem-Estar Escolar
        Núcleo de Busca Ativa Escolar
      Coordenadoria de Alimentação Escolar
        Núcleo de Gestão das Aquisições da Alimentação Escolar
        Núcleo de Nutrição e Monitoramento
  Gabinete do Secretário Adjunto de Regime de Colaboração [SARC]
    Unidade Executiva e de Negócio do Regime de Colaboração
    Unidade de Normas do Regime de Colaboração
    Superintendência de Alfabetização em Regime de Colaboração
      Coordenadoria de Impacto Educacional
      Núcleo de Apoio e Desenvolvimento da Educação Infantil
      Núcleo de Apoio e Desenvolvimento da Alfabetização e Anos Iniciais
      Núcleo de Apoio e Desenvolvimento à Gestão Municipal
      Núcleo Educa-MT
      Núcleo de Análise e Monitoramento de Indicadores
    Superintendência de Políticas em Regime de Colaboração
      Coordenadoria de Transporte Escolar
      Núcleo de Informações Estatísticas
      Núcleo de Regime de Colaboração
`;
const DRES = [
  ['Rondonópolis', []], ['Sinop', ['Colíder','Lucas do Rio Verde']], ['Barra do Garças', ['Campinápolis','Canarana','Água Boa','Querência']],
  ['Cáceres', []], ['Confresa', ['Santa Terezinha','São Félix do Araguaia','São José do Xingu']], ['Diamantino', ['Nova Mutum']],
  ['Juína', ['Aripuanã','Cotriguaçu','Juara','Colniza']], ['Primavera do Leste', ['Paranatinga']], ['Tangará da Serra', []],
  ['Alta Floresta', ['Apiacás']], ['Matupá', []], ['Pontes e Lacerda', ['Rondolândia']]
];
const COORDS_DRE = ['Coordenadoria de Formação Continuada','Coordenadoria de Gestão Pedagógica','Coordenadoria de Gestão Escolar e de Rede','Coordenadoria Administrativa e Financeira','Coordenadoria de Gestão de Pessoas','Coordenadoria de Infraestrutura, Patrimônio e TI'];

function tipoPorNome(n){
  const t = norm(n);
  const r = [['gabinete','Gabinete'],['superintend','Superintendência'],['coordenadoria','Coordenadoria'],['nucleo regional','Núcleo Regional'],['nucleo','Núcleo'],['gerencia','Gerência'],['unidades escolares','Unidades Escolares'],['unidade','Unidade'],['centro','Unidade'],['conselho','Conselho'],['colegio','Colegiado'],['comite','Colegiado'],['camara','Câmara'],['secretaria','Secretaria'],['comissao','Comissão'],['ouvidoria','Ouvidoria'],['diretoria adjunta','Diretoria Adjunta'],['diretoria','Diretoria']];
  for (const [p,tp] of r) if (t.startsWith(p)) return tp;
  return 'Outro';
}
function construirDecreto(){
  const L = [], V = []; let seq = 0;
  const add = (nome, pai, extra) => { const s = novoSetor(Object.assign({ id:'d'+String(++seq).padStart(3,'0'), nome, tipo:tipoPorNome(nome), paiId:pai||'', ordem:String(seq) }, extra||{})); L.push(s); return s.id; };
  const pilha = [], ref = {};
  SEED_TXT.split('\n').forEach(l => {
    if (!l.trim()) return;
    const m = l.match(/^( *)(.+?)(?: \[([^\]]+)\])?(?: \{([hv])(\d*)\})?\s*$/);
    const nivel = m[1].length / 2; pilha.length = nivel;
    const id = add(m[2], nivel ? pilha[nivel-1] : '', { sigla:m[3]||'', layout:m[4]||'', colunas:m[5]||'' });
    pilha[nivel] = id; ref[m[2]] = id;
  });
  const gr = ref['Gabinete do Secretário Adjunto de Gestão Regional'];
  const pol = ref['Superintendência de Políticas em Regime de Colaboração'];
  const met = add('Diretoria Metropolitana de Educação', gr, { sigla:'DME' });
  ['Conselho Deliberativo','Conselho Fiscal','Unidade de Assessoria'].forEach(n => add(n, met));
  const a1 = add('Diretoria Adjunta Metropolitana de Educação I', met); COORDS_DRE.forEach(n => add(n, a1));
  add('Diretoria Adjunta Metropolitana de Educação II', met);
  let nv = 0;
  DRES.forEach(([cid, nucs]) => {
    const d = add('Diretoria Regional de Educação de ' + cid, gr, { sigla:'DRE ' + cid });
    ['Conselho Deliberativo','Conselho Fiscal','Unidade de Assessoria'].forEach(n => add(n, d));
    const ad = add('Diretoria Adjunta Regional de ' + cid, d); COORDS_DRE.forEach(n => add(n, ad));
    nucs.forEach(n => add('Núcleo Regional de Educação de ' + n, d));
    const nrc = add('Núcleo de Regime de Colaboração da Diretoria Regional de ' + cid, pol);
    V.push(novoReg('vinculos', { id:'dv'+String(++nv).padStart(3,'0'), origemId:nrc, destinoId:d, tipo:'Atuação regional', descricao:'Atua junto à DRE de ' + cid + ' no regime de colaboração com os municípios.' }));
  });
  return { setores:L, vinculos:V, validacoes:[], historico:[], rubricas:[], despesas:[] };
}

/* ===================== UTILITÁRIOS ===================== */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const num = v => { const n = Number(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const arg = v => esc(JSON.stringify(String(v ?? '')));
const agora = () => new Date().toISOString();
const novoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtN = v => num(v).toLocaleString('pt-BR');
const fmtR = v => num(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
const fmtRc = v => { const n = num(v); if (n >= 1e9) return 'R$ ' + (n/1e9).toLocaleString('pt-BR',{maximumFractionDigits:1}) + ' bi'; if (n >= 1e6) return 'R$ ' + (n/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1}) + ' mi'; if (n >= 1e3) return 'R$ ' + (n/1e3).toLocaleString('pt-BR',{maximumFractionDigits:0}) + ' mil'; return fmtR(n); };
const fmtData = v => { const t = Date.parse(v); return isFinite(t) ? new Date(t).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'; };
const iniciais = n => { const p = String(n||'').trim().split(/\s+/).filter(Boolean); return p.length ? (p[0][0] + (p.length > 1 ? p[p.length-1][0] : '')).toUpperCase() : '?'; };
function parseValor(v){
  let t = String(v ?? '').replace(/R\$|\s/g, '');
  if (!t) return '';
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t); return isFinite(n) ? String(n) : '';
}
const linhasDe = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
const store = {
  get(k, p){ try { const v = localStorage.getItem(k); return v === null ? p : JSON.parse(v); } catch(e){ return p; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
function novoReg(tab, o){ const r = {}; CAMPOS[tab].forEach(k => r[k] = ''); Object.assign(r, o || {}); Object.keys(r).forEach(k => r[k] = r[k] == null ? '' : String(r[k])); return r; }
function novoSetor(o){ return novoReg('setores', Object.assign({ status:'Ativo' }, o)); }
let toastT;
function toast(msg, tipo){
  const t = $('#toast'); t.querySelector('span').textContent = msg;
  t.querySelector('i').className = 'fa-solid ' + (tipo === 'erro' ? 'fa-circle-xmark' : tipo === 'aviso' ? 'fa-triangle-exclamation' : 'fa-circle-check');
  t.querySelector('i').style.color = tipo === 'erro' ? '#f87171' : tipo === 'aviso' ? '#fbbf24' : '#4ade80';
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
}
function confirmar(titulo, texto, rotulo, perigo){
  return new Promise(ok => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="cx" role="dialog" aria-modal="true"><h3>${esc(titulo)}</h3><p>${texto}</p><div class="acoes"><button class="btn btn-s" data-r="0">Cancelar</button><button class="btn ${perigo ? 'btn-perigo' : 'btn-p'}" data-r="1">${esc(rotulo || 'Confirmar')}</button></div></div>`;
    m.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b || e.target === m){ m.remove(); ok(!!(b && b.dataset.r === '1')); } });
    document.body.appendChild(m); m.querySelector('[data-r="1"]').focus();
  });
}

/* ===================== ESTADO ===================== */
let DB = { setores:[], validacoes:[], vinculos:[], historico:[], rubricas:[], despesas:[] };
let backendVersao = '';
const URL_PADRAO = 'https://script.google.com/macros/s/AKfycbzZsM71FJARYYoqpRcFY4tHUAVBV-EdVW2NDL6eLaMId-iXY6Z-bnhuOkxA2nyfrdUz/exec';
let cfg = Object.assign({ url:URL_PADRAO, login:'', usuario:'', perfil:'', modo:'' }, store.get('gaborg_cfg', {}));
if (!cfg.url) cfg.url = URL_PADRAO;
delete cfg.chave;
// Token de sessão: localStorage com "Manter conectado", senão só nesta aba (sessionStorage)
const sessao = {
  get(){ try { return sessionStorage.getItem('gaborg_token') || localStorage.getItem('gaborg_token') || ''; } catch (e) { return ''; } },
  set(t, lembrar){ try { sessionStorage.removeItem('gaborg_token'); localStorage.removeItem('gaborg_token'); if (t) (lembrar ? localStorage : sessionStorage).setItem('gaborg_token', t); } catch (e) {} },
  lembrado(){ try { return !!localStorage.getItem('gaborg_token'); } catch (e) { return false; } }
};
cfg.token = sessao.get();
const ehAdmin = () => cfg.perfil === 'Administrador';
const somenteLeitura = () => cfg.perfil !== 'Administrador' && cfg.perfil !== 'Editor';
let porId = new Map(), filhos = new Map(), prof = new Map(), areaDe = new Map(), areas = [], valPorSetor = new Map();
let abertos = new Set(store.get('gaborg_abertos', []));
let listaAbertos = new Set(store.get('gaborg_lista_abertos', []));
let selId = '', abaPainel = 'dados', vistaAtual = 'mapa';

function indexar(){
  porId = new Map(DB.setores.map(s => [s.id, s]));
  filhos = new Map([['', []]]);
  DB.setores.forEach(s => { const p = porId.has(s.paiId) && s.paiId !== s.id ? s.paiId : ''; if (!filhos.has(p)) filhos.set(p, []); filhos.get(p).push(s); });
  filhos.forEach(l => l.sort((a, b) => num(a.ordem) - num(b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR')));
  prof = new Map(); areaDe = new Map(); areas = [];
  const visit = (s, d, area) => {
    if (prof.has(s.id)) return;
    prof.set(s.id, d); areaDe.set(s.id, area);
    if (d === 1) areas.push(s.id);
    (filhos.get(s.id) || []).forEach(k => visit(k, d + 1, d === 0 ? k.id : area));
  };
  filhos.get('').forEach(r => visit(r, 0, r.id));
  // Ciclos criados por edição manual na planilha: ficam como raiz
  DB.setores.forEach(s => { if (!prof.has(s.id)) { s.paiId = ''; filhos.get('').push(s); visit(s, 0, s.id); } });
  valPorSetor = new Map();
  DB.validacoes.forEach(v => { if (!valPorSetor.has(v.setorId)) valPorSetor.set(v.setorId, []); valPorSetor.get(v.setorId).push(v); });
  atualizarBadgeVal();
}
const raizes = () => filhos.get('') || [];
const filhosDe = id => filhos.get(id) || [];
function descendentes(id, acc = new Set()){ filhosDe(id).forEach(k => { if (!acc.has(k.id)) { acc.add(k.id); descendentes(k.id, acc); } }); return acc; }
function caminho(id){ const r = []; let s = porId.get(id), g = 0; while (s && s.paiId && porId.has(s.paiId) && g++ < 60){ s = porId.get(s.paiId); r.unshift(s); } return r; }
function statusVal(id){
  const l = valPorSetor.get(id) || [];
  if (!l.length) return 'Sem validação';
  if (l.some(v => v.status === 'Reprovado')) return 'Reprovado';
  if (l.some(v => !v.status || v.status === 'Pendente')) return 'Pendente';
  if (l.some(v => v.status === 'Aprovado com ressalvas')) return 'Aprovado com ressalvas';
  return 'Aprovado';
}
const corTipo = t => (TIPOS[t] || TIPOS.Outro).cor;
const icTipo = t => (TIPOS[t] || TIPOS.Outro).ic;
function corArea(id){ const i = areas.indexOf(id); return i < 0 ? '#1e3a8a' : PALETA_AREA[i % PALETA_AREA.length]; }
function nomeCurto(s){ if (!s) return '—'; return s.sigla ? s.sigla : s.nome.replace(/^Gabinete do Secretário Adjunto (de |do )?/, 'SA ').replace(/^Gabinete do Secretário de Estado de Educação$/, 'Gabinete do Secretário'); }
function somaSub(id){
  const ids = [id, ...descendentes(id)]; const r = { servidores:0, comissionados:0, orcamento:0, custoMensal:0, setores:ids.length };
  ids.forEach(i => { const s = porId.get(i); if (!s || s.status === 'Extinto') return; ['servidores','comissionados','orcamento','custoMensal'].forEach(k => r[k] += num(s[k])); });
  return r;
}

/* ===================== PERSISTÊNCIA LOCAL ===================== */
let tLocal;
function salvarLocal(){ clearTimeout(tLocal); tLocal = setTimeout(() => store.set('gaborg_db', DB), 400); }
const salvarAbertos = () => { store.set('gaborg_abertos', [...abertos]); };

/* ===================== NUVEM (APPS SCRIPT) ===================== */
let fila = store.get('gaborg_fila', []);
let enviando = false, tFila, versaoNuvem = '', ultimoErro = '';
const online = () => cfg.modo === 'nuvem' && !!cfg.url && !!cfg.token;

async function chamar(body, ms = 45000){
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(cfg.url, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify(Object.assign({ token:cfg.token }, body)), redirect:'follow', signal:ctrl.signal });
    const txt = await r.text();
    if (txt.trim().startsWith('<')) throw new Error('O Google devolveu uma página de login. Publique o Apps Script com acesso "Qualquer pessoa".');
    const j = JSON.parse(txt);
    if (j.code === 'AUTH' && body.action !== 'login') sessaoEncerrada(j.message);
    else if (j.code === 'TROCAR_SENHA') setTimeout(() => modalTrocarSenha(true), 0);
    return j;
  } catch (e) { if (e.name === 'AbortError') throw new Error('A planilha demorou demais para responder.'); throw e; }
  finally { clearTimeout(t); }
}
async function lerNuvem(){
  const r = await chamar({ action:'read' }, 60000);
  if (r.status !== 'success') throw new Error(r.message || 'Falha ao ler a planilha.');
  if (r.usuario) aplicarUsuario(r.usuario);
  const d = r.dados || {};
  TABS_DB.forEach(t => { DB[t] = (d[t] || []).map(x => novoReg(t, x)); });
  versaoNuvem = String(r.versao || ''); backendVersao = String(r.backend || '');
  aplicarFilaNaMemoria();
  indexar(); salvarLocal();
}
function enfileirar(table, record, del){
  salvarLocal();
  if (!online()) return statusSync();
  fila.push({ op: del ? 'delete' : 'upsert', table, record: del ? { id:record.id } : Object.assign({}, record) });
  store.set('gaborg_fila', fila);
  clearTimeout(tFila); tFila = setTimeout(enviarFila, 700); statusSync();
}
function compactar(ops){
  const ult = new Map(); ops.forEach((o, i) => ult.set(o.table + '|' + o.record.id, i));
  return ops.filter((o, i) => ult.get(o.table + '|' + o.record.id) === i);
}
async function enviarFila(){
  if (enviando || !fila.length || !online()) return;
  enviando = true; statusSync();
  const n = Math.min(fila.length, 500);
  try {
    const r = await chamar({ action:'batch', ops:compactar(fila.slice(0, n)) });
    if (r.status !== 'success') throw new Error(r.message || 'A planilha recusou a gravação.');
    fila.splice(0, n); store.set('gaborg_fila', fila);
    if (r.versao) versaoNuvem = String(r.versao);
    ultimoErro = '';
  } catch (e) {
    ultimoErro = e.message || 'Sem conexão';
    setTimeout(enviarFila, 10000);
  }
  enviando = false; statusSync();
  if (fila.length && !ultimoErro) setTimeout(enviarFila, 200);
}
function aplicarFilaNaMemoria(){
  fila.forEach(o => {
    const l = DB[o.table]; if (!l) return;
    const i = l.findIndex(x => x.id === o.record.id);
    if (o.op === 'delete') { if (i >= 0) l.splice(i, 1); }
    else if (i >= 0) l[i] = Object.assign(l[i], o.record); else l.push(novoReg(o.table, o.record));
  });
}
function statusSync(){
  const el = $('#sync'); if (!el) return;
  let c, t;
  if (!online()) { c = 'local'; t = 'Desconectado'; }
  else if (ultimoErro) { c = 'erro'; t = 'Sem gravar: ' + ultimoErro; }
  else if (enviando || fila.length) { c = 'env'; t = `Enviando ${fila.length} alteração(ões)...`; }
  else { c = 'ok'; t = 'Planilha sincronizada'; }
  el.className = 'sync ' + c; el.querySelector('span').textContent = t; el.title = t;
}
// Alterações de outras pessoas: confere a versão a cada 20 s
setInterval(async () => {
  if (!online() || document.hidden || fila.length || enviando) return;
  try {
    const r = await chamar({ action:'version' }, 15000);
    if (r.status === 'success' && r.versao && String(r.versao) !== versaoNuvem && !document.querySelector('#painel :focus')) {
      await lerNuvem(); redesenharTudo(); toast('Estrutura atualizada com alterações de outra pessoa.');
    }
  } catch (e) {}
}, 20000);
window.addEventListener('beforeunload', e => { if (fila.length) { e.preventDefault(); e.returnValue = ''; } });

/* ===================== HISTÓRICO E ALTERAÇÕES ===================== */
function registrar(setorId, acao){
  const h = novoReg('historico', { id:novoId('h'), setorId, data:agora(), usuario:cfg.usuario || 'Usuário', acao });
  DB.historico.unshift(h); if (DB.historico.length > 3000) DB.historico.length = 3000;
  enfileirar('historico', h);
}
const ROTULOS = { nome:'Nome', sigla:'Sigla', tipo:'Tipo', paiId:'Setor superior', status:'Situação', responsavel:'Responsável', contato:'Contato', competencias:'Competências', entregas:'Entregas', orcamento:'Orçamento anual', custoMensal:'Custo mensal', servidores:'Servidores', comissionados:'Cargos comissionados', impacto:'Impacto', impactoDescricao:'Descrição do impacto', positivos:'Pontos positivos', negativos:'Pontos negativos', layout:'Disposição dos subordinados', colunas:'Colunas', ordem:'Ordem' };
const ESTRUTURAIS = ['paiId','layout','colunas','ordem','nome','tipo','status','dx','dy'];
function alterar(s, campo, valor, silencioso){
  valor = String(valor ?? '');
  if (s[campo] === valor) return;
  const antes = s[campo]; s[campo] = valor;
  s.atualizadoEm = agora(); s.atualizadoPor = cfg.usuario || '';
  enfileirar('setores', s);
  if (!silencioso && ROTULOS[campo]) {
    let txt = ROTULOS[campo] + ' alterado';
    if (campo === 'paiId') txt = `Subordinado a ${porId.get(valor) ? porId.get(valor).nome : '(raiz)'}`;
    else if (['nome','sigla','tipo','status','responsavel','impacto','servidores','comissionados','orcamento','custoMensal'].includes(campo)) txt += `: ${antes || '—'} → ${valor || '—'}`;
    registrar(s.id, txt);
  }
  if (ESTRUTURAIS.includes(campo) || campo === 'impacto') indexar();
  atualizarVistaAtual();
}

/* ===================== LAYOUT DO MAPA ===================== */
let caixas = new Map(), modos = new Map(), pos = new Map(), visiveis = [], origemRaiz = new Map();
const temFilhos = id => filhosDe(id).length > 0;
const filhosVis = id => abertos.has(id) ? filhosDe(id) : [];
function modoDe(s, d){ return s.layout === 'h' || s.layout === 'v' ? s.layout : (d === 0 ? 'h' : 'v'); }
function medir(s, d){
  const ks = d > 40 ? [] : filhosVis(s.id), m = modoDe(s, d); modos.set(s.id, m);
  const b = { w:NW, h:NH, nx:0, rel:new Map() };
  if (ks.length) {
    ks.forEach(k => medir(k, d + 1));
    if (m === 'v') {
      let y = NH + GV + 6, w = NW;
      ks.forEach(k => { const c = caixas.get(k.id); b.rel.set(k.id, { x:IND, y }); y += c.h + GV + (abertos.has(k.id) && temFilhos(k.id) ? 6 : 0); w = Math.max(w, IND + c.w); });
      b.w = w; b.h = y - GV;
    } else {
      const folhas = ks.filter(k => !temFilhos(k.id)), ramos = ks.filter(k => temFilhos(k.id));
      const cf = Math.min(folhas.length, s.layout === 'h' && num(s.colunas) && !ramos.length ? num(s.colunas) : 4) || 1;
      const gw = folhas.length ? cf * NW + (cf - 1) * GX : 0;
      const maxC = Math.max(1, num(s.colunas) || 6);
      const linhas = []; for (let i = 0; i < ramos.length; i += maxC) linhas.push(ramos.slice(i, i + maxC));
      const lw = linhas.map(l => l.reduce((a, k) => a + caixas.get(k.id).w, 0) + (l.length - 1) * GX);
      b.w = Math.max(NW, gw, ...lw); b.nx = (b.w - NW) / 2;
      let y = NH + GY;
      if (folhas.length) {
        const x0 = (b.w - gw) / 2;
        folhas.forEach((k, i) => b.rel.set(k.id, { x:x0 + (i % cf) * (NW + GX) - caixas.get(k.id).nx, y:y + Math.floor(i / cf) * (NH + GV + 8) }));
        y += Math.ceil(folhas.length / cf) * (NH + GV + 8) - GV - 8 + GY;
      }
      linhas.forEach((l, i) => { let x = (b.w - lw[i]) / 2, hm = 0; l.forEach(k => { const c = caixas.get(k.id); b.rel.set(k.id, { x, y }); x += c.w + GX; hm = Math.max(hm, c.h); }); y += hm + GY + 10; });
      b.h = y - GY - 10;
    }
  }
  caixas.set(s.id, b); return b;
}
function posicionar(s, ox, oy){
  const b = caixas.get(s.id), dx = num(s.dx), dy = num(s.dy);
  pos.set(s.id, { x:ox + b.nx + dx, y:oy + dy }); visiveis.push(s);
  b.rel.forEach((r, kid) => posicionar(porId.get(kid), ox + dx + r.x, oy + dy + r.y));
}
function calcularLayout(){
  caixas = new Map(); modos = new Map(); origemRaiz = new Map();
  let x = 0;
  raizes().forEach(r => { medir(r, 0); origemRaiz.set(r.id, x); x += caixas.get(r.id).w + 140; });
  reposicionar();
}
function reposicionar(){
  pos = new Map(); visiveis = [];
  raizes().forEach(r => posicionar(r, origemRaiz.get(r.id) || 0, 0));
}

/* ===================== DESENHO DO MAPA ===================== */
let view = store.get('gaborg_view', { x:60, y:90, k:.8 });
const elNo = new Map();
function corDe(s){
  const m = $('#m-cor').value;
  if (m === 'area') return corArea(areaDe.get(s.id));
  if (m === 'validacao') return STATUS_VAL[statusVal(s.id)];
  if (m === 'impacto') return IMPACTO[num(s.impacto)] ? IMPACTO[num(s.impacto)][1] : IMPACTO[0][1];
  if (m === 'status') return STATUS_SETOR[s.status] || '#64748b';
  return corTipo(s.tipo);
}
function cardHTML(s){
  const p = pos.get(s.id), n = filhosDe(s.id).length, ab = abertos.has(s.id);
  const estilo = $('#m-cor').value === 'tipo' ? ((TIPOS[s.tipo] || {}).estilo || '') : (prof.get(s.id) === 0 ? 'cheio' : '');
  const sv = statusVal(s.id), imp = num(s.impacto);
  const ser = num(s.servidores);
  return `<div class="no ${estilo} ${s.status === 'Extinto' ? 'extinto' : ''} ${modos.get(s.id) === 'v' ? 'v-mode' : ''} ${s.id === selId ? 'sel' : ''} ${multi.has(s.id) ? 'msel' : ''}" data-id="${esc(s.id)}" style="--c:${corDe(s)};transform:translate(${p.x}px,${p.y}px)" title="${esc(s.nome)}">
    <div class="no-tipo"><i class="fa-solid ${icTipo(s.tipo)}"></i>${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</div>
    <div class="no-nome">${esc(s.nome)}</div>
    <div class="no-pe"><span class="r">${s.responsavel ? '<i class="fa-solid fa-user"></i> ' + esc(s.responsavel) : 'Sem responsável'}</span>${ser ? `<span><i class="fa-solid fa-users"></i> ${fmtN(ser)}</span>` : ''}${imp ? `<span class="p" style="background:${IMPACTO[imp][1]}" title="Impacto: ${IMPACTO[imp][0]}"></span>` : ''}${sv !== 'Sem validação' ? `<span class="p" style="background:${STATUS_VAL[sv]};border-radius:2px" title="Validação: ${sv}"></span>` : ''}</div>
    ${n ? `<button class="no-exp ${ab ? 'aberto' : ''}" data-exp title="${ab ? 'Recolher' : 'Mostrar'} ${n} subordinado(s)">${ab ? '<i class="fa-solid fa-minus"></i>' : n}</button>` : ''}
  </div>`;
}
function desenharMapa(){
  if (vistaAtual !== 'mapa') return;
  calcularLayout();
  $('#nos').innerHTML = visiveis.map(cardHTML).join('');
  elNo.clear(); document.querySelectorAll('#nos .no').forEach(el => elNo.set(el.dataset.id, el));
  desenharArestas(); aplicarView(); desenharLegenda(); desenharMini(); atualizarBarraSel();
}
function caminhoAresta(p, c){
  const a = pos.get(p.id), b = pos.get(c.id);
  if (modos.get(p.id) === 'v') {
    const x1 = a.x + 16, y1 = a.y + NH, y2 = b.y + NH / 2, r = Math.min(10, Math.abs(y2 - y1) / 2);
    return `M${x1},${y1} V${y2 - r} Q${x1},${y2} ${x1 + r},${y2} H${b.x}`;
  }
  const x1 = a.x + NW / 2, y1 = a.y + NH, x2 = b.x + NW / 2, y2 = b.y, k = Math.max(26, Math.abs(y2 - y1) / 2);
  return `M${x1},${y1} C${x1},${y1 + k} ${x2},${y2 - k} ${x2},${y2}`;
}
function desenharArestas(){
  const ativos = new Set(selId ? [selId, ...caminho(selId).map(s => s.id)] : []);
  let h = '';
  visiveis.forEach(s => { filhosVis(s.id).forEach(k => { if (pos.has(k.id)) h += `<path d="${caminhoAresta(s, k)}" class="${ativos.has(k.id) ? 'ativa' : ''}"/>`; }); });
  DB.vinculos.forEach(v => {
    const a = pos.get(v.origemId), b = pos.get(v.destinoId); if (!a || !b) return;
    const x1 = a.x + NW / 2, y1 = a.y + NH / 2, x2 = b.x + NW / 2, y2 = b.y + NH / 2, my = Math.min(y1, y2) - 80;
    h += `<path d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}" class="vin ${v.origemId === selId || v.destinoId === selId ? 'ativa' : ''}"><title>${esc(v.tipo)}</title></path>`;
  });
  $('#arestas').innerHTML = h;
}
function aplicarView(anim){
  const m = $('#mundo');
  if (anim) { m.classList.add('anim'); setTimeout(() => m.classList.remove('anim'), 480); }
  m.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`;
  const vp = $('#vp'); const g = 22 * view.k;
  vp.style.backgroundSize = `${g}px ${g}px`; vp.style.backgroundPosition = `${view.x}px ${view.y}px`;
  $('#m-zv').textContent = Math.round(view.k * 100) + '%';
  store.set('gaborg_view', view);
  desenharMiniVisor();
}
function limites(){
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  pos.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + NW); y1 = Math.max(y1, p.y + NH); });
  return isFinite(x0) ? { x0, y0, x1, y1 } : { x0:0, y0:0, x1:NW, y1:NH };
}
function ajustar(anim){
  const vp = $('#vp').getBoundingClientRect(), L = limites();
  const k = Math.max(.12, Math.min(1.1, Math.min((vp.width - 80) / (L.x1 - L.x0), (vp.height - 170) / (L.y1 - L.y0))));
  view = { k, x:(vp.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:90 - L.y0 * k + Math.max(0, (vp.height - 170 - (L.y1 - L.y0) * k) / 2) };
  if (vp.width < 820 && k < .42) {
    // celular: em vez de miniaturizar tudo, mostra o topo da estrutura legível, centrado na raiz
    const r = raizes()[0], p = r && pos.get(r.id), kk = .42;
    view = { k:kk, x:vp.width / 2 - ((p ? p.x : L.x0) + NW / 2) * kk, y:130 - L.y0 * kk };
  }
  aplicarView(anim);
}
function zoomPor(f, cx, cy){
  const vp = $('#vp').getBoundingClientRect();
  if (cx === undefined) { cx = vp.width / 2; cy = vp.height / 2; }
  const k = Math.max(.1, Math.min(2.5, view.k * f)); const r = k / view.k;
  view = { k, x:cx - (cx - view.x) * r, y:cy - (cy - view.y) * r }; aplicarView();
}
function centralizar(id, anim){
  const p = pos.get(id); if (!p) return;
  const vp = $('#vp').getBoundingClientRect(), pn = $('#painel').classList.contains('aberto') && window.innerWidth > 820 ? 460 : 0;
  const k = Math.max(view.k, .75);
  view = { k, x:(vp.width - pn) / 2 - (p.x + NW / 2) * k, y:vp.height / 2.6 - (p.y + NH / 2) * k };
  aplicarView(anim !== false);
}
function desenharLegenda(){
  const m = $('#m-cor').value; let it = [];
  if (m === 'tipo') { const usados = new Set(DB.setores.map(s => s.tipo)); it = Object.keys(TIPOS).filter(t => usados.has(t)).map(t => [t, TIPOS[t].cor]); }
  else if (m === 'area') it = areas.map(a => [nomeCurto(porId.get(a)), corArea(a)]);
  else if (m === 'validacao') it = Object.entries(STATUS_VAL);
  else if (m === 'impacto') it = IMPACTO.map(x => [x[0], x[1]]);
  else it = Object.entries(STATUS_SETOR);
  $('#m-leg').innerHTML = it.map(([n, c]) => `<span><i class="q" style="background:${c}"></i>${esc(n)}</span>`).join('')
    + `<span class="dica"><i class="fa-solid fa-hand"></i> Arraste o fundo para navegar · roda do mouse para zoom · arraste um setor para reposicionar (encaixa nas guias; <b>Alt</b> solta livre) · <b>Ctrl</b> + clique seleciona vários · <b>Ctrl</b> + arrastar o fundo seleciona uma área · setas movem a seleção · <b>Shift</b> + arrastar sobre outro setor para subordinar · duplo clique abre/fecha</span>`;
}
/* Minimapa */
function desenharMini(){
  const c = $('#mini'); if (!c || !c.offsetWidth) return;
  const W = c.width = c.offsetWidth * 2, H = c.height = c.offsetHeight * 2, L = limites();
  const s = Math.min((W - 16) / (L.x1 - L.x0), (H - 16) / (L.y1 - L.y0));
  c._esc = { s, ox:8 - L.x0 * s + ((W - 16) - (L.x1 - L.x0) * s) / 2, oy:8 - L.y0 * s + ((H - 16) - (L.y1 - L.y0) * s) / 2 };
  const g = c.getContext('2d'); g.clearRect(0, 0, W, H);
  visiveis.forEach(n => { const p = pos.get(n.id); g.fillStyle = corDe(n); g.fillRect(c._esc.ox + p.x * s, c._esc.oy + p.y * s, Math.max(2, NW * s), Math.max(2, NH * s)); });
  c._base = g.getImageData(0, 0, W, H); desenharMiniVisor();
}
function desenharMiniVisor(){
  const c = $('#mini'); if (!c || !c._base) return;
  const g = c.getContext('2d'); g.putImageData(c._base, 0, 0);
  const vp = $('#vp').getBoundingClientRect(), e = c._esc;
  const x = e.ox + (-view.x / view.k) * e.s, y = e.oy + (-view.y / view.k) * e.s, w = vp.width / view.k * e.s, h = vp.height / view.k * e.s;
  g.strokeStyle = '#2563eb'; g.lineWidth = 3; g.fillStyle = 'rgba(37,99,235,.08)'; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
}
$('#m-mini').addEventListener('pointerdown', e => {
  const c = $('#mini'), r = c.getBoundingClientRect(), es = c._esc; if (!es) return;
  const mx = (e.clientX - r.left) * 2, my = (e.clientY - r.top) * 2;
  const wx = (mx - es.ox) / es.s, wy = (my - es.oy) / es.s, vp = $('#vp').getBoundingClientRect();
  view.x = vp.width / 2 - wx * view.k; view.y = vp.height / 2 - wy * view.k; aplicarView(true);
});

/* Interação: arrastar, pan, zoom, pinça, seleção múltipla */
let drag = null; const ponteiros = new Map(); let pinca = null;
const vpEl = $('#vp');
let multi = new Set(), modoSel = false;
const SNAP = 8; // px de tela para encaixar nas guias
function aditivo(e){ return modoSel || e.ctrlKey || e.metaKey; }
// Quando um superior e um subordinado estão selecionados, só o superior é movido (o ramo o acompanha)
function raizesDoConjunto(ids){ const set = new Set(ids); return [...set].filter(id => porId.has(id) && !caminho(id).some(a => set.has(a.id))); }
function aParaMundo(cx, cy){ const r = vpEl.getBoundingClientRect(); return { x:(cx - r.left - view.x) / view.k, y:(cy - r.top - view.y) / view.k }; }
vpEl.addEventListener('pointerdown', e => {
  if (e.target.closest('[data-exp]')) return;
  ponteiros.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if (ponteiros.size === 2) { const [a, b] = [...ponteiros.values()]; pinca = { d:Math.hypot(a.x - b.x, a.y - b.y), k:view.k }; drag = null; $('#laco').classList.add('hidden'); return; }
  const no = e.target.closest('.no');
  if (no) {
    const s = porId.get(no.dataset.id);
    drag = { tipo:'no', s, x0:e.clientX, y0:e.clientY, moveu:false, alvo:null, adit:aditivo(e) };
  } else if (aditivo(e) && !somenteLeitura()) {
    drag = { tipo:'laco', x0:e.clientX, y0:e.clientY, base:new Set(multi), moveu:false };
  } else { drag = { tipo:'pan', x0:e.clientX, y0:e.clientY, vx:view.x, vy:view.y, moveu:false }; vpEl.classList.add('pan'); }
  vpEl.setPointerCapture(e.pointerId);
});
function iniciarArrasto(){
  // grupo: a seleção múltipla (se o setor arrastado faz parte dela) ou só o setor
  let ids = multi.size > 1 && multi.has(drag.s.id) ? raizesDoConjunto(multi) : [drag.s.id];
  if (!multi.has(drag.s.id) && multi.size) { limparMulti(true); }
  drag.grupo = ids.map(id => { const s = porId.get(id); return { s, dx0:num(s.dx), dy0:num(s.dy) }; });
  guardarPos(drag.grupo.map(g => g.s));
  drag.desc = new Set(); drag.grupo.forEach(g => { drag.desc.add(g.s.id); descendentes(g.s.id, drag.desc); });
  drag.grupo.forEach(g => elNo.get(g.s.id)?.classList.add('arrastando'));
  // referências para as guias: setores visíveis que não se movem
  drag.refs = visiveis.filter(n => !drag.desc.has(n.id)).map(n => pos.get(n.id));
}
function encaixe(p){
  const lim = SNAP / view.k; let bx = null, by = null, gx = null, gy = null;
  drag.refs.forEach(o => {
    const mesmaLinha = Math.abs(o.y - p.y) < NH * 1.5, mesmaColuna = Math.abs(o.x - p.x) < NW * 1.2;
    // alinhamento direto
    [[o.x, o.x], ...(mesmaLinha ? [[o.x + NW + GX, null], [o.x - NW - GX, null]] : [])].forEach(([cx, linha]) => {
      const d = cx - p.x; if (Math.abs(d) <= lim && (bx === null || Math.abs(d) < Math.abs(bx))) { bx = d; gx = linha === null ? null : cx; }
    });
    [[o.y, o.y], ...(mesmaColuna ? [[o.y + NH + GV, null], [o.y - NH - GV, null]] : [])].forEach(([cy, linha]) => {
      const d = cy - p.y; if (Math.abs(d) <= lim && (by === null || Math.abs(d) < Math.abs(by))) { by = d; gy = linha === null ? null : cy; }
    });
  });
  return { dx:bx || 0, dy:by || 0, gx, gy };
}
function desenharGuias(g, p){
  const el = $('#guias'); if (!g) { el.innerHTML = ''; return; }
  const L = limites(); let s = '';
  if (g.gx !== null) s += `<line x1="${g.gx}" y1="${L.y0 - 200}" x2="${g.gx}" y2="${L.y1 + 200}"/>`;
  if (g.gy !== null) s += `<line x1="${L.x0 - 200}" y1="${g.gy}" x2="${L.x1 + 200}" y2="${g.gy}"/>`;
  el.innerHTML = s;
}
function moverVisual(){
  reposicionar();
  visiveis.forEach(n => { const el = elNo.get(n.id), p = pos.get(n.id); if (el) el.style.transform = `translate(${p.x}px,${p.y}px)`; });
  desenharArestas();
}
vpEl.addEventListener('pointermove', e => {
  if (ponteiros.has(e.pointerId)) ponteiros.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if (pinca && ponteiros.size === 2) {
    const [a, b] = [...ponteiros.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = vpEl.getBoundingClientRect();
    zoomPor((pinca.k * d / pinca.d) / view.k, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moveu && Math.hypot(dx, dy) < 5) return;
  if (drag.tipo === 'pan') { drag.moveu = true; view.x = drag.vx + dx; view.y = drag.vy + dy; aplicarView(); return; }
  if (drag.tipo === 'laco') {
    drag.moveu = true;
    const r = vpEl.getBoundingClientRect(), lc = $('#laco');
    const x = Math.min(e.clientX, drag.x0) - r.left, y = Math.min(e.clientY, drag.y0) - r.top;
    Object.assign(lc.style, { left:x + 'px', top:y + 'px', width:Math.abs(dx) + 'px', height:Math.abs(dy) + 'px' }); lc.classList.remove('hidden');
    const a = aParaMundo(drag.x0, drag.y0), b = aParaMundo(e.clientX, e.clientY);
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    multi = new Set(drag.base);
    visiveis.forEach(n => { const p = pos.get(n.id); if (p.x < x1 && p.x + NW > x0 && p.y < y1 && p.y + NH > y0) multi.add(n.id); });
    elNo.forEach((el, id) => el.classList.toggle('msel', multi.has(id)));
    atualizarBarraSel(); return;
  }
  if (somenteLeitura()) return;
  if (!drag.moveu) { drag.moveu = true; iniciarArrasto(); }
  const ox = dx / view.k, oy = dy / view.k;
  drag.grupo.forEach(g => { g.s.dx = String(Math.round(g.dx0 + ox)); g.s.dy = String(Math.round(g.dy0 + oy)); });
  reposicionar();
  let gd = null;
  if (!e.altKey) {
    gd = encaixe(pos.get(drag.s.id));
    if (gd.dx || gd.dy) drag.grupo.forEach(g => { g.s.dx = String(Math.round(num(g.s.dx) + gd.dx)); g.s.dy = String(Math.round(num(g.s.dy) + gd.dy)); });
  }
  moverVisual(); desenharGuias(gd);
  if (drag.alvo) { elNo.get(drag.alvo)?.classList.remove('alvo'); drag.alvo = null; }
  if (e.shiftKey) {
    const sob = document.elementsFromPoint(e.clientX, e.clientY).map(x => x.closest && x.closest('.no')).find(x => x && !drag.desc.has(x.dataset.id));
    if (sob) { drag.alvo = sob.dataset.id; sob.classList.add('alvo'); }
  }
});
function fimDrag(e){
  ponteiros.delete(e.pointerId); if (ponteiros.size < 2) pinca = null;
  vpEl.classList.remove('pan');
  if (!drag) return;
  const d = drag; drag = null;
  desenharGuias(null);
  if (d.tipo === 'laco') { $('#laco').classList.add('hidden'); atualizarBarraSel(); if (d.moveu && multi.size) toast(`${multi.size} setor(es) selecionado(s).`); return; }
  if (d.tipo === 'pan') { if (!d.moveu && multi.size && !modoSel) limparMulti(); return; }
  if (!d.moveu) {
    if (d.adit && !somenteLeitura()) alternarMulti(d.s.id);
    else { if (multi.size) limparMulti(true); selecionar(d.s.id); }
    return;
  }
  d.grupo.forEach(g => elNo.get(g.s.id)?.classList.remove('arrastando'));
  if (d.alvo) {
    const alvo = porId.get(d.alvo); elNo.get(d.alvo)?.classList.remove('alvo');
    abertos.add(alvo.id); salvarAbertos();
    let ord = Math.max(0, ...filhosDe(alvo.id).map(k => num(k.ordem)));
    d.grupo.forEach(g => { g.s.dx = ''; g.s.dy = ''; g.s.ordem = String(++ord); alterar(g.s, 'paiId', alvo.id); });
    desfazerPilha.pop(); // subordinação tem histórico próprio
    toast(d.grupo.length > 1 ? `${d.grupo.length} setores agora são subordinados a ${alvo.nome}.` : `${d.s.nome} agora é subordinado a ${alvo.nome}.`);
  } else {
    d.grupo.forEach(g => { g.s.atualizadoEm = agora(); enfileirar('setores', g.s); });
    desenharMini();
  }
}
vpEl.addEventListener('pointerup', fimDrag);
vpEl.addEventListener('pointercancel', fimDrag);

/* Seleção múltipla */
function alternarMulti(id){
  if (!multi.size && selId && selId !== id && pos.has(selId)) multi.add(selId);
  multi.has(id) ? multi.delete(id) : multi.add(id);
  elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k)));
  atualizarBarraSel();
}
function limparMulti(silencioso){
  multi.clear(); elNo.forEach(el => el.classList.remove('msel')); atualizarBarraSel();
}
function alternarModoSel(forcar){
  modoSel = forcar !== undefined ? forcar : !modoSel;
  $('#m-modosel')?.classList.toggle('on', modoSel); vpEl.classList.toggle('modo-sel', modoSel);
  if (modoSel) toast('Modo seleção: arraste no fundo para marcar uma área ou toque nos setores.');
}
function atualizarBarraSel(){
  const b = $('#m-sel'); if (!b) return;
  [...multi].forEach(id => { if (!porId.has(id)) multi.delete(id); });
  $('#ms-n').textContent = multi.size;
  b.classList.toggle('hidden', multi.size < 1);
  const inp = $('#ms-esp'); if (inp && !inp.value) inp.value = store.get('gaborg_espaco', GX);
}
function selecionarIrmaos(){
  const base = multi.size ? [...multi] : (selId ? [selId] : []);
  if (!base.length) return;
  base.forEach(id => { const s = porId.get(id); filhosDe(s ? s.paiId : '').forEach(k => { if (pos.has(k.id)) multi.add(k.id); }); });
  elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k))); atualizarBarraSel();
}

/* Desfazer movimentações */
let desfazerPilha = [];
function guardarPos(lista){
  desfazerPilha.push(lista.map(s => ({ id:s.id, dx:s.dx, dy:s.dy })));
  if (desfazerPilha.length > 60) desfazerPilha.shift();
}
function desfazerPos(){
  if (somenteLeitura()) return;
  const ult = desfazerPilha.pop(); if (!ult) return toast('Nada para desfazer.');
  ult.forEach(o => { const s = porId.get(o.id); if (!s) return; s.dx = o.dx; s.dy = o.dy; s.atualizadoEm = agora(); enfileirar('setores', s); });
  desenharMapa(); toast('Movimentação desfeita.');
}

/* Alinhar, distribuir e espaçar a seleção */
function alinharSel(modo){
  if (somenteLeitura()) return;
  const ids = [...multi].filter(id => pos.has(id));
  if (modo === 'auto') {
    if (!ids.length) return;
    guardarPos(ids.map(id => porId.get(id)));
    ids.forEach(id => { const s = porId.get(id); s.dx = ''; s.dy = ''; s.atualizadoEm = agora(); enfileirar('setores', s); });
    desenharMapa(); return toast('Posição automática restaurada.');
  }
  if (ids.length < 2) return toast('Selecione pelo menos 2 setores (Ctrl + clique).', 'aviso');
  if ((modo === 'distH' || modo === 'distV') && ids.length < 3) return toast('Para distribuir, selecione pelo menos 3 setores.', 'aviso');
  let esp = Math.max(0, Math.min(600, Number($('#ms-esp').value)));
  if (!isFinite(esp)) esp = GX;
  store.set('gaborg_espaco', esp);
  const P = new Map(ids.map(id => [id, Object.assign({}, pos.get(id))]));
  const ys = ids.map(id => P.get(id).y), xs = ids.map(id => P.get(id).x);
  const porX = [...ids].sort((a, b) => P.get(a).x - P.get(b).x || P.get(a).y - P.get(b).y);
  const porY = [...ids].sort((a, b) => P.get(a).y - P.get(b).y || P.get(a).x - P.get(b).x);
  const alvo = new Map();
  // Mesma linha/coluna: se algum ficaria por cima de outro, enfileira com o espaço escolhido
  const sobrepoe = (lista, eixo, tam) => lista.some((id, i) => i && P.get(id)[eixo] - P.get(lista[i - 1])[eixo] < tam);
  let ajustou = false;
  if (modo === 'linha') { if (sobrepoe(porX, 'x', NW)) { modo = 'filaH'; ajustou = true; } else { const y = Math.min(...ys); ids.forEach(id => alvo.set(id, { y })); } }
  if (modo === 'coluna') { if (sobrepoe(porY, 'y', NH)) { modo = 'filaV'; ajustou = true; } else { const x = Math.min(...xs); ids.forEach(id => alvo.set(id, { x })); } }
  if (modo === 'distH') { const a = P.get(porX[0]).x, b = P.get(porX[porX.length - 1]).x, st = (b - a) / (porX.length - 1); porX.forEach((id, i) => alvo.set(id, { x:a + i * st })); }
  if (modo === 'distV') { const a = P.get(porY[0]).y, b = P.get(porY[porY.length - 1]).y, st = (b - a) / (porY.length - 1); porY.forEach((id, i) => alvo.set(id, { y:a + i * st })); }
  if (modo === 'filaH') { const y = Math.min(...ys), x0 = P.get(porX[0]).x; porX.forEach((id, i) => alvo.set(id, { x:x0 + i * (NW + esp), y })); }
  if (modo === 'filaV') { const x = Math.min(...xs), y0 = P.get(porY[0]).y; porY.forEach((id, i) => alvo.set(id, { x, y:y0 + i * (NH + esp) })); }
  guardarPos(ids.map(id => porId.get(id)));
  // superiores primeiro: ao mover um superior o ramo dele vem junto, e o subordinado é corrigido depois
  [...ids].sort((a, b) => (prof.get(a) || 0) - (prof.get(b) || 0)).forEach(id => {
    reposicionar();
    const s = porId.get(id), p = pos.get(id), t = alvo.get(id); if (!t) return;
    if (t.x !== undefined) s.dx = String(Math.round(num(s.dx) + t.x - p.x));
    if (t.y !== undefined) s.dy = String(Math.round(num(s.dy) + t.y - p.y));
  });
  ids.forEach(id => { const s = porId.get(id); s.atualizadoEm = agora(); enfileirar('setores', s); });
  desenharMapa();
  if (ajustou) return toast(`Alinhados e espaçados em ${esp} px para nenhum setor ficar por cima de outro.`);
  toast({ linha:'Alinhados na mesma linha.', coluna:'Alinhados na mesma coluna.', distH:'Distribuídos com espaço igual na horizontal.', distV:'Distribuídos com espaço igual na vertical.', filaH:`Em linha, com ${esp} px entre eles.`, filaV:`Em coluna, com ${esp} px entre eles.` }[modo]);
}

/* Teclado no mapa: setas movem a seleção (Shift = 10 px), Ctrl+Z desfaz, Esc limpa */
let ultimaSeta = 0;
document.addEventListener('keydown', e => {
  if (vistaAtual !== 'mapa' || document.querySelector('.modal') || !$('#tv-modo').classList.contains('hidden') || e.target.closest('input,textarea,select,[contenteditable]')) return;
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); desfazerPos(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !somenteLeitura()) { e.preventDefault(); visiveis.forEach(n => multi.add(n.id)); elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k))); atualizarBarraSel(); return; }
  if (e.key === 'Escape' && (multi.size || modoSel)) { limparMulti(); alternarModoSel(false); e.stopImmediatePropagation(); return; }
  const dir = { ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1] }[e.key];
  if (!dir || somenteLeitura()) return;
  const ids = multi.size ? raizesDoConjunto(multi) : (selId && pos.has(selId) ? [selId] : []);
  if (!ids.length) return;
  e.preventDefault();
  const passo = e.shiftKey ? 10 : 1, lista = ids.map(id => porId.get(id));
  if (Date.now() - ultimaSeta > 900) guardarPos(lista);
  ultimaSeta = Date.now();
  lista.forEach(s => { s.dx = String(num(s.dx) + dir[0] * passo); s.dy = String(num(s.dy) + dir[1] * passo); s.atualizadoEm = agora(); enfileirar('setores', s); });
  moverVisual();
}, true);
vpEl.addEventListener('wheel', e => { e.preventDefault(); const r = vpEl.getBoundingClientRect(); zoomPor(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0015)), e.clientX - r.left, e.clientY - r.top); }, { passive:false });
vpEl.addEventListener('click', e => { const b = e.target.closest('[data-exp]'); if (b) alternarAberto(b.closest('.no').dataset.id); });
vpEl.addEventListener('dblclick', e => { const no = e.target.closest('.no'); if (no && temFilhos(no.dataset.id)) alternarAberto(no.dataset.id); });
function alternarAberto(id, forcar){
  const abrir = forcar !== undefined ? forcar : !abertos.has(id);
  abrir ? abertos.add(id) : abertos.delete(id); salvarAbertos(); desenharMapa();
}
function expandirNivel(){
  const prox = visiveis.filter(s => temFilhos(s.id) && !abertos.has(s.id));
  if (!prox.length) return toast('Tudo já está aberto.');
  prox.forEach(s => abertos.add(s.id)); salvarAbertos(); desenharMapa(); ajustar(true);
}
function recolherTudo(){ abertos = new Set(raizes().map(r => r.id)); salvarAbertos(); desenharMapa(); ajustar(true); }
async function reorganizar(){
  const mexidos = DB.setores.filter(s => s.dx || s.dy);
  if (!mexidos.length) { ajustar(true); return toast('O mapa já está na disposição automática.'); }
  if (!await confirmar('Reorganizar o mapa', `${mexidos.length} setor(es) foram movidos manualmente. Voltar todos para a disposição automática?`, 'Reorganizar')) return;
  guardarPos(mexidos);
  mexidos.forEach(s => { s.dx = ''; s.dy = ''; enfileirar('setores', s); });
  desenharMapa(); ajustar(true);
}

/* Busca no mapa */
let resIdx = 0;
$('#m-busca').addEventListener('input', () => { resIdx = 0; renderBusca(); });
$('#m-busca').addEventListener('keydown', e => {
  const bs = [...document.querySelectorAll('#m-res button')]; if (!bs.length) return;
  if (e.key === 'ArrowDown') { resIdx = Math.min(bs.length - 1, resIdx + 1); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { resIdx = Math.max(0, resIdx - 1); e.preventDefault(); }
  else if (e.key === 'Enter') { bs[resIdx].click(); return; }
  else if (e.key === 'Escape') { $('#m-res').classList.add('hidden'); return; }
  bs.forEach((b, i) => b.classList.toggle('on', i === resIdx));
});
document.addEventListener('pointerdown', e => { if (!e.target.closest('.m-busca')) $('#m-res').classList.add('hidden'); });
function renderBusca(){
  const q = norm($('#m-busca').value), box = $('#m-res');
  if (!q) { box.classList.add('hidden'); return; }
  const r = DB.setores.filter(s => norm(s.nome + ' ' + s.sigla + ' ' + s.responsavel).includes(q)).slice(0, 12);
  box.innerHTML = r.length ? r.map((s, i) => `<button class="${i === resIdx ? 'on' : ''}" onclick="irPara(${arg(s.id)})"><span class="ic" style="color:${corTipo(s.tipo)}"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><span style="min-width:0"><span class="t">${esc(s.nome)}</span><br><span class="s">${esc(caminho(s.id).map(nomeCurto).join(' › ') || 'Raiz')}</span></span></button>`).join('') : '<div class="vazio">Nenhum setor encontrado.</div>';
  box.classList.remove('hidden');
}
function irPara(id){
  $('#m-res').classList.add('hidden'); $('#m-busca').value = '';
  if (vistaAtual !== 'mapa') trocarVista('mapa');
  caminho(id).forEach(a => abertos.add(a.id)); salvarAbertos();
  selId = id; desenharMapa(); renderPainel(); setTimeout(() => centralizar(id), 30);
}

/* ===================== SELEÇÃO E PAINEL LATERAL ===================== */
function selecionar(id){
  selId = id;
  document.querySelectorAll('#nos .no.sel').forEach(x => x.classList.remove('sel'));
  elNo.get(id)?.classList.add('sel');
  if (vistaAtual === 'mapa') desenharArestas();
  if (vistaAtual === 'lista') renderLista();
  renderPainel();
}
function fecharPainel(){ selId = ''; $('#painel').classList.remove('aberto'); document.querySelectorAll('.no.sel').forEach(x => x.classList.remove('sel')); if (vistaAtual === 'mapa') desenharArestas(); if (vistaAtual === 'lista') renderLista(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.querySelector('.modal') && !e.target.closest('input,textarea,select')) fecharPainel();
  if (e.key === '/' && vistaAtual === 'mapa' && !e.target.closest('input,textarea,select')) { e.preventDefault(); $('#m-busca').focus(); }
});

const ABAS = [['dados','Dados','fa-id-card'],['valores','Valores','fa-coins'],['analise','Análise','fa-scale-unbalanced'],['validacoes','Validações','fa-stamp'],['vinculos','Vínculos','fa-link'],['historico','Histórico','fa-clock-rotate-left']];
function renderPainel(){
  const s = porId.get(selId), p = $('#painel');
  if (!s) { p.classList.remove('aberto'); return; }
  const cor = corTipo(s.tipo), cam = caminho(s.id), sv = statusVal(s.id);
  const contagem = { validacoes:(valPorSetor.get(s.id) || []).length, vinculos:DB.vinculos.filter(v => v.origemId === s.id || v.destinoId === s.id).length, historico:DB.historico.filter(h => h.setorId === s.id).length, analise:linhasDe(s.positivos).length + linhasDe(s.negativos).length };
  p.style.setProperty('--c', cor);
  p.innerHTML = `
    <div class="pn-topo">
      <button class="btn btn-g btn-i fechar" onclick="fecharPainel()" title="Fechar (Esc)"><i class="fa-solid fa-xmark"></i></button>
      <div class="pn-cam">${cam.length ? cam.map(a => `<button onclick="irPara(${arg(a.id)})" title="${esc(a.nome)}">${esc(nomeCurto(a))}</button><i class="fa-solid fa-chevron-right"></i>`).join('') : '<span>Nível mais alto da estrutura</span>'}</div>
      <div class="pn-tit"><span class="ic"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><div style="min-width:0"><h2 id="pn-nome">${esc(s.nome)}</h2>
        <div class="tags"><span class="chip sem" style="--c:${cor}">${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</span><span class="chip" style="--c:${STATUS_SETOR[s.status] || '#64748b'}">${esc(s.status || 'Ativo')}</span><span class="chip" style="--c:${STATUS_VAL[sv]}">${sv}</span></div></div></div>
      <div class="pn-acoes">
        <button class="btn btn-s btn-sm" onclick="irPara(${arg(s.id)})"><i class="fa-solid fa-location-crosshairs"></i>Mostrar no mapa</button>
        <button class="btn btn-s btn-sm so-edit" onclick="novoSetorEm(${arg(s.id)})"><i class="fa-solid fa-plus"></i>Subordinado</button>
        ${temFilhos(s.id) ? `<button class="btn btn-s btn-sm" onclick="abrirRamo(${arg(s.id)})"><i class="fa-solid fa-angles-down"></i>Abrir ramo</button>` : ''}
        <button class="btn btn-s btn-sm so-edit" onclick="duplicarSetor(${arg(s.id)})" title="Duplicar setor"><i class="fa-regular fa-copy"></i></button>
        <button class="btn btn-perigo btn-sm so-edit" onclick="excluirSetor(${arg(s.id)})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="pn-abas" role="tablist">${ABAS.map(([k, n, ic]) => `<button class="${abaPainel === k ? 'on' : ''}" onclick="abaPainel='${k}';renderPainel()" role="tab"><i class="fa-solid ${ic}"></i>${n}${contagem[k] ? `<span class="n">${contagem[k]}</span>` : ''}</button>`).join('')}</div>
    </div>
    <div class="pn-corpo" id="pn-corpo">${CORPO[abaPainel](s)}</div>`;
  p.classList.add('aberto');
}
function opcoesSetores(excluir, valor, vazio){
  const ex = excluir || new Set(); let h = vazio !== undefined ? `<option value="">${esc(vazio)}</option>` : '';
  const visit = (s, d) => { if (ex.has(s.id)) return; h += `<option value="${esc(s.id)}" ${s.id === valor ? 'selected' : ''}>${'\u00a0\u00a0'.repeat(d)}${d ? '└ ' : ''}${esc(s.nome)}</option>`; filhosDe(s.id).forEach(k => visit(k, d + 1)); };
  raizes().forEach(r => visit(r, 0)); return h;
}
const sel = (campo, opcoes, valor) => `<select class="campo" data-campo="${campo}">${opcoes.map(o => `<option ${o === valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
const CORPO = {
  dados(s){
    const irmaos = filhosDe(s.paiId && porId.has(s.paiId) ? s.paiId : ''), i = irmaos.indexOf(s);
    return `
      <label><span class="rot">Nome do setor</span><input class="campo" data-campo="nome" value="${esc(s.nome)}" maxlength="200"></label>
      <div class="g2">
        <label><span class="rot">Sigla</span><input class="campo" data-campo="sigla" value="${esc(s.sigla)}" maxlength="30"></label>
        <label><span class="rot">Tipo</span>${sel('tipo', Object.keys(TIPOS), s.tipo)}</label>
      </div>
      <label><span class="rot">Setor superior <small>a quem responde</small></span><select class="campo" data-campo="paiId">${opcoesSetores(new Set([s.id, ...descendentes(s.id)]), s.paiId, '— Nenhum (nível mais alto) —')}</select></label>
      <div class="g2">
        <label><span class="rot">Situação</span>${sel('status', Object.keys(STATUS_SETOR), s.status || 'Ativo')}</label>
        <div><span class="rot">Posição entre os pares</span><div style="display:flex;gap:6px"><button class="btn btn-s btn-sm" ${i <= 0 ? 'disabled' : ''} onclick="moverOrdem(${arg(s.id)},-1)"><i class="fa-solid fa-arrow-up"></i>Antes</button><button class="btn btn-s btn-sm" ${i < 0 || i >= irmaos.length - 1 ? 'disabled' : ''} onclick="moverOrdem(${arg(s.id)},1)"><i class="fa-solid fa-arrow-down"></i>Depois</button></div></div>
      </div>
      <div class="g2">
        <label><span class="rot">Responsável</span><input class="campo" data-campo="responsavel" value="${esc(s.responsavel)}" placeholder="Nome do titular"></label>
        <label><span class="rot">Contato</span><input class="campo" data-campo="contato" value="${esc(s.contato)}" placeholder="E-mail ou ramal"></label>
      </div>
      <label><span class="rot">Competências e funções <small>uma por linha</small></span><textarea class="campo" data-campo="competencias" rows="6" placeholder="O que o setor faz, conforme o decreto ou regimento">${esc(s.competencias)}</textarea></label>
      <label><span class="rot">Principais entregas e produtos</span><textarea class="campo" data-campo="entregas" rows="3" placeholder="Serviços, documentos, programas que o setor entrega">${esc(s.entregas)}</textarea></label>
      ${temFilhos(s.id) ? `<div class="g2">
        <label><span class="rot">Subordinados no mapa</span><select class="campo" data-campo="layout"><option value="" ${!s.layout ? 'selected' : ''}>Automático</option><option value="h" ${s.layout === 'h' ? 'selected' : ''}>Lado a lado</option><option value="v" ${s.layout === 'v' ? 'selected' : ''}>Em lista</option></select></label>
        <label><span class="rot">Colunas <small>lado a lado</small></span><input class="campo" data-campo="colunas" type="number" min="1" max="20" value="${esc(s.colunas)}" placeholder="6"></label>
      </div>` : ''}
      <p style="margin:0;font-size:11.5px;color:var(--mut)">${s.atualizadoEm ? `Última alteração em ${fmtData(s.atualizadoEm)}${s.atualizadoPor ? ' por ' + esc(s.atualizadoPor) : ''}.` : 'Estrutura original do Decreto nº 2.236/2026.'}</p>`;
  },
  valores(s){
    return `
      <div class="sec-t"><i class="fa-solid fa-coins"></i>Valores do próprio setor</div>
      <div class="g2">
        <label><span class="rot">Orçamento anual (R$)</span><input class="campo" data-campo="orcamento" data-num value="${s.orcamento ? esc(num(s.orcamento).toLocaleString('pt-BR')) : ''}" inputmode="decimal" placeholder="0"></label>
        <label><span class="rot">Custo mensal de pessoal (R$)</span><input class="campo" data-campo="custoMensal" data-num value="${s.custoMensal ? esc(num(s.custoMensal).toLocaleString('pt-BR')) : ''}" inputmode="decimal" placeholder="0"></label>
        <label><span class="rot">Servidores</span><input class="campo" data-campo="servidores" data-num value="${esc(s.servidores)}" inputmode="numeric" placeholder="0"></label>
        <label><span class="rot">Cargos comissionados</span><input class="campo" data-campo="comissionados" data-num value="${esc(s.comissionados)}" inputmode="numeric" placeholder="0"></label>
      </div>
      <div id="pn-soma">${blocoSoma(s)}</div>
      ${blocoFinSetor(s)}`;
  },
  analise(s){
    const imp = num(s.impacto), pos_ = linhasDe(s.positivos), neg = linhasDe(s.negativos), tot = pos_.length + neg.length;
    const lista = (campo, itens, ic, cor) => `<div class="lista-i" style="--c:${cor}">${itens.map((t, i) => `<div class="it"><i class="m fa-solid ${ic}"></i><span>${esc(t)}</span><button onclick="rmItem(${arg(s.id)},'${campo}',${i})" title="Remover"><i class="fa-solid fa-xmark"></i></button></div>`).join('') || `<div style="font-size:12.5px;color:var(--mut2)">Nenhum item.</div>`}
      <form class="add-i" onsubmit="event.preventDefault();addItem(${arg(s.id)},'${campo}',this.t)"><input name="t" class="campo" placeholder="Adicionar e tecle Enter" maxlength="300"><button class="btn btn-s btn-i" title="Adicionar"><i class="fa-solid fa-plus"></i></button></form></div>`;
    return `
      <div class="sec-t"><i class="fa-solid fa-bolt"></i>Impacto do setor na Secretaria</div>
      <div class="imp">${[1,2,3,4,5].map(n => `<button class="${imp === n ? 'on' : ''}" style="--c:${IMPACTO[n][1]}" onclick="alterar(porId.get(${arg(s.id)}),'impacto','${imp === n ? '' : n}');renderPainel()"><b>${n}</b>${IMPACTO[n][0]}</button>`).join('')}</div>
      <label><span class="rot">Descrição do impacto <small>o que muda se o setor parar</small></span><textarea class="campo" data-campo="impactoDescricao" rows="3">${esc(s.impactoDescricao)}</textarea></label>
      ${tot ? `<div><div class="balanco"><span style="width:${pos_.length * 100 / tot}%;background:#16a34a"></span><span style="width:${neg.length * 100 / tot}%;background:#dc2626"></span></div><div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--mut);margin-top:4px"><span>${pos_.length} positivo(s)</span><span>${neg.length} negativo(s)</span></div></div>` : ''}
      <div class="sec-t" style="--c:#16a34a"><i class="fa-solid fa-circle-plus"></i>Pontos positivos</div>${lista('positivos', pos_, 'fa-check', '#16a34a')}
      <div class="sec-t" style="--c:#dc2626"><i class="fa-solid fa-circle-minus"></i>Pontos negativos</div>${lista('negativos', neg, 'fa-xmark', '#dc2626')}`;
  },
  validacoes(s){
    const minhas = (valPorSetor.get(s.id) || []), deles = DB.validacoes.filter(v => v.validadorId === s.id);
    const item = (v, mostrar) => { const o = porId.get(mostrar === 'validador' ? v.validadorId : v.setorId); return `<div class="val-it">
      <div class="l1"><i class="fa-solid ${mostrar === 'validador' ? 'fa-user-check' : 'fa-inbox'}" style="color:var(--mut)"></i><b title="${esc(o ? o.nome : '')}">${esc(o ? o.nome : '(setor removido)')}</b><span class="chip" style="--c:${STATUS_VAL[v.status || 'Pendente']}">${esc(v.status || 'Pendente')}</span><button class="btn btn-g btn-i btn-sm" onclick="rmValidacao(${arg(v.id)})" title="Remover"><i class="fa-solid fa-trash-can"></i></button></div>
      <select class="campo" data-val="${esc(v.id)}" data-vcampo="status">${Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(x => `<option ${x === (v.status || 'Pendente') ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <textarea class="campo" data-val="${esc(v.id)}" data-vcampo="parecer" rows="2" placeholder="Parecer do setor validador">${esc(v.parecer)}</textarea>
      <span style="font-size:11px;color:var(--mut)">Solicitada em ${fmtData(v.solicitadoEm)}${v.solicitadoPor ? ' por ' + esc(v.solicitadoPor) : ''}${v.respondidoEm ? ` · respondida em ${fmtData(v.respondidoEm)}${v.respondidoPor ? ' por ' + esc(v.respondidoPor) : ''}` : ''}</span></div>`; };
    return `
      <div class="sec-t"><i class="fa-solid fa-paper-plane"></i>Pedir validação a outro setor</div>
      <div style="display:flex;gap:6px"><select id="val-novo" class="campo">${opcoesSetores(new Set([s.id]), '', 'Escolha o setor validador')}</select><button class="btn btn-p" onclick="solicitarValidacao(${arg(s.id)})"><i class="fa-solid fa-plus"></i>Pedir</button></div>
      <div class="sec-t"><i class="fa-solid fa-stamp"></i>Validações deste setor <span class="chip" style="--c:${STATUS_VAL[statusVal(s.id)]}">${statusVal(s.id)}</span></div>
      ${minhas.map(v => item(v, 'validador')).join('') || '<div class="vazio"><i class="fa-regular fa-folder-open"></i>Nenhuma validação pedida.</div>'}
      ${deles.length ? `<div class="sec-t"><i class="fa-solid fa-inbox"></i>Este setor deve validar</div>${deles.map(v => item(v, 'setor')).join('')}` : ''}`;
  },
  vinculos(s){
    const l = DB.vinculos.filter(v => v.origemId === s.id || v.destinoId === s.id);
    return `
      <p style="margin:0;font-size:12.5px;color:var(--mut);line-height:1.5">Relações fora da linha hierárquica (apoio, fluxos, atuação regional). Aparecem no mapa como linhas tracejadas roxas.</p>
      <div class="sec-t"><i class="fa-solid fa-plus"></i>Novo vínculo</div>
      <select id="vin-dest" class="campo">${opcoesSetores(new Set([s.id]), '', 'Setor relacionado')}</select>
      <div style="display:flex;gap:6px"><select id="vin-tipo" class="campo">${TIPOS_VINCULO.map(t => `<option>${t}</option>`).join('')}</select><button class="btn btn-p" onclick="addVinculo(${arg(s.id)})"><i class="fa-solid fa-link"></i>Vincular</button></div>
      <input id="vin-desc" class="campo" placeholder="Descrição (opcional)">
      <div class="sec-t"><i class="fa-solid fa-link"></i>Vínculos existentes</div>
      ${l.map(v => { const outro = porId.get(v.origemId === s.id ? v.destinoId : v.origemId); return `<div class="val-it"><div class="l1"><i class="fa-solid ${v.origemId === s.id ? 'fa-arrow-right' : 'fa-arrow-left'}" style="color:#8b5cf6"></i><b>${esc(outro ? outro.nome : '(removido)')}</b><span class="chip sem" style="--c:#8b5cf6">${esc(v.tipo)}</span><button class="btn btn-g btn-i btn-sm" onclick="rmVinculo(${arg(v.id)})"><i class="fa-solid fa-trash-can"></i></button></div>${v.descricao ? `<span style="font-size:12.5px;color:var(--txt2)">${esc(v.descricao)}</span>` : ''}</div>`; }).join('') || '<div class="vazio"><i class="fa-solid fa-link-slash"></i>Sem vínculos.</div>'}`;
  },
  historico(s){
    const l = DB.historico.filter(h => h.setorId === s.id).sort((a, b) => Date.parse(b.data) - Date.parse(a.data)).slice(0, 100);
    return l.length ? `<div class="hist">${l.map(h => `<div><i class="fa-solid fa-circle"></i><span>${esc(h.acao)}<small>${fmtData(h.data)} · ${esc(h.usuario)}</small></span></div>`).join('')}</div>` : '<div class="vazio"><i class="fa-regular fa-clock"></i>Nenhuma alteração registrada.</div>';
  }
};
function blocoSoma(s){
  const t = somaSub(s.id), g = somaSub(raizes()[0] ? raizes()[0].id : s.id);
  const pct = (a, b) => b ? ` · ${Math.round(a * 100 / b)}% do total` : '';
  return `<div class="sec-t"><i class="fa-solid fa-layer-group"></i>Somando ${t.setores > 1 ? `os ${t.setores - 1} subordinados` : 'só este setor'}</div>
    <div class="soma">
      <div><b>${fmtRc(t.orcamento)}</b><span>Orçamento anual${pct(t.orcamento, g.orcamento)}</span></div>
      <div><b>${fmtRc(t.custoMensal)}</b><span>Custo mensal${pct(t.custoMensal, g.custoMensal)}</span></div>
      <div><b>${fmtN(t.servidores)}</b><span>Servidores${pct(t.servidores, g.servidores)}</span></div>
      <div><b>${fmtN(t.comissionados)}</b><span>Comissionados${pct(t.comissionados, g.comissionados)}</span></div>
    </div>`;
}
// Campos do painel: grava ao sair do campo (sem redesenhar o painel, para não perder o foco)
$('#painel').addEventListener('change', e => {
  const el = e.target, s = porId.get(selId); if (!s) return;
  if (el.dataset.val) { editarValidacao(el.dataset.val, el.dataset.vcampo, el.value); return; }
  const c = el.dataset.campo; if (!c) return;
  let v = el.value;
  if (el.hasAttribute('data-num')) { v = parseValor(v); if (v && ['orcamento','custoMensal'].includes(c)) el.value = num(v).toLocaleString('pt-BR'); }
  if (c === 'nome' && !v.trim()) { el.value = s.nome; return toast('O nome não pode ficar vazio.', 'aviso'); }
  if (c === 'nome' && !s.tipo) s.tipo = tipoPorNome(v);
  if (c === 'paiId') { s.dx = ''; s.dy = ''; if (v) { abertos.add(v); salvarAbertos(); } }
  alterar(s, c, c === 'nome' ? v.trim() : v);
  if (c === 'nome') $('#pn-nome').textContent = s.nome;
  if (['tipo','status','paiId','layout'].includes(c)) renderPainel();
  if (['orcamento','custoMensal','servidores','comissionados'].includes(c)) $('#pn-soma').innerHTML = blocoSoma(s);
});

/* Ações sobre setores */
function novoSetorEm(paiId){
  const pai = porId.get(paiId);
  const tipoSug = pai ? ({ 'Gabinete':'Superintendência','Superintendência':'Coordenadoria','Coordenadoria':'Núcleo','Diretoria':'Coordenadoria','Diretoria Adjunta':'Coordenadoria' }[pai.tipo] || 'Unidade') : 'Gabinete';
  const s = novoSetor({ id:novoId('s'), nome:'Novo setor', tipo:tipoSug, paiId:pai ? pai.id : '', ordem:String(Math.max(0, ...filhosDe(pai ? pai.id : '').map(k => num(k.ordem))) + 1), status:'Proposto', atualizadoEm:agora(), atualizadoPor:cfg.usuario });
  DB.setores.push(s); indexar(); enfileirar('setores', s); registrar(s.id, 'Setor criado' + (pai ? ' em ' + pai.nome : ''));
  if (pai) { abertos.add(pai.id); salvarAbertos(); }
  selId = s.id; abaPainel = 'dados';
  atualizarVistaAtual(); renderPainel();
  if (vistaAtual === 'mapa') setTimeout(() => centralizar(s.id), 40);
  setTimeout(() => { const i = document.querySelector('#painel [data-campo="nome"]'); if (i) { i.focus(); i.select(); } }, 80);
}
function duplicarSetor(id){
  const o = porId.get(id); if (!o) return;
  const s = novoSetor(Object.assign({}, o, { id:novoId('s'), nome:o.nome + ' (cópia)', dx:String(num(o.dx) + 30), dy:String(num(o.dy) + 30), ordem:String(num(o.ordem) + .5), atualizadoEm:agora(), atualizadoPor:cfg.usuario }));
  DB.setores.push(s); indexar(); enfileirar('setores', s); registrar(s.id, 'Criado a partir de ' + o.nome);
  selId = s.id; atualizarVistaAtual(); renderPainel(); toast('Setor duplicado (sem os subordinados).');
}
async function excluirSetor(id){
  const s = porId.get(id); if (!s) return;
  const desc = descendentes(id);
  if (!await confirmar('Excluir setor', `Excluir <b>${esc(s.nome)}</b>${desc.size ? ` e os <b>${desc.size}</b> setores subordinados a ele` : ''}? As validações e vínculos ligados a eles também serão removidos. Para manter o histórico, prefira mudar a situação para <b>Extinto</b>.`, 'Excluir', true)) return;
  const ids = new Set([id, ...desc]);
  DB.setores.filter(x => ids.has(x.id)).forEach(x => enfileirar('setores', x, true));
  DB.validacoes.filter(v => ids.has(v.setorId) || ids.has(v.validadorId)).forEach(v => enfileirar('validacoes', v, true));
  DB.vinculos.filter(v => ids.has(v.origemId) || ids.has(v.destinoId)).forEach(v => enfileirar('vinculos', v, true));
  DB.setores = DB.setores.filter(x => !ids.has(x.id));
  DB.validacoes = DB.validacoes.filter(v => !ids.has(v.setorId) && !ids.has(v.validadorId));
  DB.vinculos = DB.vinculos.filter(v => !ids.has(v.origemId) && !ids.has(v.destinoId));
  if (s.paiId) registrar(s.paiId, `Subordinado excluído: ${s.nome}${desc.size ? ` (com ${desc.size} setores)` : ''}`);
  indexar(); fecharPainel(); atualizarVistaAtual(); toast('Setor excluído.');
}
function moverOrdem(id, d){
  const s = porId.get(id), irm = filhosDe(s.paiId && porId.has(s.paiId) ? s.paiId : '');
  irm.forEach((x, i) => { if (x.ordem !== String(i + 1)) { x.ordem = String(i + 1); enfileirar('setores', x); } });
  const i = irm.indexOf(s), j = i + d; if (j < 0 || j >= irm.length) return;
  const o = irm[j], t = s.ordem; s.ordem = o.ordem; o.ordem = t; enfileirar('setores', o);
  alterar(s, 'ordem', s.ordem, true); renderPainel();
}
function abrirRamo(id){ [id, ...descendentes(id)].forEach(i => { if (temFilhos(i)) abertos.add(i); }); caminho(id).forEach(a => abertos.add(a.id)); salvarAbertos(); if (vistaAtual !== 'mapa') trocarVista('mapa'); desenharMapa(); setTimeout(() => centralizar(id), 30); }
function addItem(id, campo, input){
  const t = input.value.trim(); if (!t) return;
  const s = porId.get(id); alterar(s, campo, linhasDe(s[campo]).concat(t.replace(/\n/g, ' ')).join('\n'), true);
  registrar(id, `${campo === 'positivos' ? 'Ponto positivo' : 'Ponto negativo'} incluído: ${t}`); renderPainel();
  setTimeout(() => { const f = document.querySelectorAll('#pn-corpo .add-i input')[campo === 'positivos' ? 0 : 1]; if (f) f.focus(); }, 20);
}
function rmItem(id, campo, i){ const s = porId.get(id), l = linhasDe(s[campo]); const t = l.splice(i, 1)[0]; alterar(s, campo, l.join('\n'), true); registrar(id, `${campo === 'positivos' ? 'Ponto positivo' : 'Ponto negativo'} removido: ${t}`); renderPainel(); }

/* Validações */
function solicitarValidacao(id){
  const vid = $('#val-novo').value; if (!vid) return toast('Escolha o setor que vai validar.', 'aviso');
  if ((valPorSetor.get(id) || []).some(v => v.validadorId === vid)) return toast('Esse setor já foi chamado a validar.', 'aviso');
  const v = novoReg('validacoes', { id:novoId('val'), setorId:id, validadorId:vid, status:'Pendente', solicitadoEm:agora(), solicitadoPor:cfg.usuario });
  DB.validacoes.push(v); enfileirar('validacoes', v); registrar(id, 'Validação pedida a ' + porId.get(vid).nome);
  indexar(); renderPainel(); atualizarVistaAtual();
}
function editarValidacao(vid, campo, valor){
  const v = DB.validacoes.find(x => x.id === vid); if (!v || v[campo] === valor) return;
  v[campo] = valor; v.respondidoEm = agora(); v.respondidoPor = cfg.usuario;
  enfileirar('validacoes', v);
  if (campo === 'status') registrar(v.setorId, `Validação de ${(porId.get(v.validadorId) || {}).nome || '?'}: ${valor}`);
  indexar(); if (vistaAtual === 'validacoes') renderValidacoes(); else if (selId) renderPainel();
  if (vistaAtual === 'mapa') desenharMapa();
}
async function rmValidacao(vid){
  if (!await confirmar('Remover validação', 'Remover este pedido de validação?', 'Remover', true)) return;
  const v = DB.validacoes.find(x => x.id === vid); if (!v) return;
  DB.validacoes = DB.validacoes.filter(x => x.id !== vid); enfileirar('validacoes', v, true);
  indexar(); renderPainel(); atualizarVistaAtual();
}
/* Vínculos */
function addVinculo(id){
  const d = $('#vin-dest').value; if (!d) return toast('Escolha o setor relacionado.', 'aviso');
  const v = novoReg('vinculos', { id:novoId('v'), origemId:id, destinoId:d, tipo:$('#vin-tipo').value, descricao:$('#vin-desc').value.trim() });
  DB.vinculos.push(v); enfileirar('vinculos', v); registrar(id, `Vínculo (${v.tipo}) com ${porId.get(d).nome}`);
  renderPainel(); if (vistaAtual === 'mapa') desenharArestas();
}
function rmVinculo(vid){ const v = DB.vinculos.find(x => x.id === vid); if (!v) return; DB.vinculos = DB.vinculos.filter(x => x.id !== vid); enfileirar('vinculos', v, true); renderPainel(); if (vistaAtual === 'mapa') desenharArestas(); }

/* ===================== VISTAS ===================== */
document.querySelectorAll('.nav-b').forEach(b => { b.title = b.querySelector('span').textContent; b.addEventListener('click', () => b.dataset.acao === 'tv' ? abrirModoTV() : trocarVista(b.dataset.vista)); });
function trocarVista(v){
  vistaAtual = v;
  document.querySelectorAll('.nav-b').forEach(b => b.classList.toggle('on', b.dataset.vista === v));
  document.querySelectorAll('.vista').forEach(s => s.classList.toggle('fora', s.id !== 'v-' + v));
  atualizarVistaAtual();
}
function atualizarVistaAtual(){
  if (vistaAtual === 'mapa') desenharMapa();
  else if (vistaAtual === 'lista') renderLista();
  else if (vistaAtual === 'painel') renderPainelInd();
  else if (vistaAtual === 'validacoes') renderValidacoes();
  else if (vistaAtual === 'config') renderConfig();
  else if (vistaAtual === 'usuarios') renderUsuarios();
  else if (vistaAtual === 'financeiro') renderFinanceiro();
}
function redesenharTudo(){ indexar(); atualizarVistaAtual(); if (selId && porId.has(selId)) renderPainel(); else fecharPainel(); }
function atualizarBadgeVal(){ const n = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').length, b = $('#nav-val'); if (!b) return; b.textContent = n; b.classList.toggle('hidden', !n); }
function opcoesFiltro(id, rotulo, valores){
  const el = $(id); const atual = el.value;
  el.innerHTML = `<option value="">${rotulo}</option>` + valores.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('');
  el.value = valores.some(x => x[0] === atual) ? atual : '';
}

/* Lista hierárquica */
function renderLista(){
  opcoesFiltro('#l-tipo', 'Todos os tipos', Object.keys(TIPOS).filter(t => DB.setores.some(s => s.tipo === t)).map(t => [t, t]));
  opcoesFiltro('#l-area', 'Todas as áreas', areas.map(a => [a, nomeCurto(porId.get(a))]));
  opcoesFiltro('#l-val', 'Toda validação', Object.keys(STATUS_VAL).map(t => [t, t]));
  const q = norm($('#l-busca').value), ft = $('#l-tipo').value, fa = $('#l-area').value, fv = $('#l-val').value;
  const filtro = q || ft || fa || fv;
  const casa = s => (!q || norm([s.nome, s.sigla, s.responsavel, s.competencias].join(' ')).includes(q)) && (!ft || s.tipo === ft) && (!fa || areaDe.get(s.id) === fa) && (!fv || statusVal(s.id) === fv);
  let mostrar = null, nCasa = 0;
  if (filtro) { mostrar = new Set(); DB.setores.forEach(s => { if (!casa(s)) return; nCasa++; let x = s, g = 0; while (x && !mostrar.has(x.id) && g++ < 60) { mostrar.add(x.id); x = porId.get(x.paiId); } }); }
  if (!listaAbertos.size && !filtro) raizes().forEach(r => listaAbertos.add(r.id));
  const linhas = [];
  const visit = (s, d) => { if (mostrar && !mostrar.has(s.id)) return; linhas.push([s, d]); if (filtro || listaAbertos.has(s.id)) filhosDe(s.id).forEach(k => visit(k, d + 1)); };
  raizes().forEach(r => visit(r, 0));
  $('#l-resumo').textContent = filtro ? `${nCasa} setor(es) encontrados de ${DB.setores.length}` : `${DB.setores.length} setores na estrutura`;
  $('#l-corpo').innerHTML = linhas.map(([s, d]) => {
    const n = filhosDe(s.id).length, ab = filtro || listaAbertos.has(s.id), sv = statusVal(s.id), imp = num(s.impacto), casaQ = filtro && casa(s);
    return `<tr class="${s.id === selId ? 'sel' : ''}" onclick="selecionar(${arg(s.id)})">
      <td><div class="arv" style="padding-left:${d * 20}px;--c:${corTipo(s.tipo)}">${n ? `<button class="tg" onclick="event.stopPropagation();listaAlternar(${arg(s.id)})" title="${ab ? 'Recolher' : 'Abrir'}"><i class="fa-solid fa-chevron-${ab ? 'down' : 'right'}"></i></button>` : '<span style="width:20px"></span>'}<span class="ic"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><span class="nm" style="${filtro && !casaQ ? 'opacity:.55' : ''}">${esc(s.nome)}</span>${s.sigla ? `<span class="sg">${esc(s.sigla)}</span>` : ''}${n ? `<span class="sg">· ${n}</span>` : ''}</div></td>
      <td>${esc(s.tipo)}</td><td>${esc(s.responsavel) || '<span style="color:var(--mut2)">—</span>'}</td>
      <td class="n">${s.servidores ? fmtN(s.servidores) : '—'}</td><td class="n">${s.orcamento ? fmtRc(s.orcamento) : '—'}</td>
      <td>${imp ? `<span class="chip" style="--c:${IMPACTO[imp][1]}">${IMPACTO[imp][0]}</span>` : '<span style="color:var(--mut2)">—</span>'}</td>
      <td><span class="chip" style="--c:${STATUS_VAL[sv]}">${sv}</span></td><td><span class="chip" style="--c:${STATUS_SETOR[s.status] || '#64748b'}">${esc(s.status || 'Ativo')}</span></td></tr>`;
  }).join('') || `<tr><td colspan="8"><div class="vazio"><i class="fa-solid fa-magnifying-glass"></i>Nenhum setor com esses filtros.</div></td></tr>`;
}
function listaAlternar(id){ listaAbertos.has(id) ? listaAbertos.delete(id) : listaAbertos.add(id); store.set('gaborg_lista_abertos', [...listaAbertos]); renderLista(); }
function listaAbrirTudo(abrir){ listaAbertos = abrir ? new Set(DB.setores.filter(s => temFilhos(s.id)).map(s => s.id)) : new Set(raizes().map(r => r.id)); store.set('gaborg_lista_abertos', [...listaAbertos]); renderLista(); }
function limparFiltrosLista(){ ['#l-busca','#l-tipo','#l-area','#l-val'].forEach(i => $(i).value = ''); renderLista(); }

/* Indicadores */
function renderPainelInd(){
  opcoesFiltro('#p-area', 'Toda a Secretaria', areas.map(a => [a, nomeCurto(porId.get(a))]));
  const fa = $('#p-area').value;
  const base = DB.setores.filter(s => s.status !== 'Extinto' && (!fa || areaDe.get(s.id) === fa));
  const ids = new Set(base.map(s => s.id));
  const soma = k => base.reduce((a, s) => a + num(s[k]), 0);
  const vals = DB.validacoes.filter(v => ids.has(v.setorId));
  const pend = vals.filter(v => !v.status || v.status === 'Pendente').length;
  const comResp = base.filter(s => s.responsavel).length, comComp = base.filter(s => s.competencias).length, comImp = base.filter(s => num(s.impacto)).length;
  const compl = base.length ? Math.round((comResp + comComp + comImp) * 100 / (base.length * 3)) : 0;
  const kpi = (c, ic, r, v, s) => `<div class="cartao kpi" style="--c:${c}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const barras = (pares, cor, fmt) => { const mx = Math.max(1, ...pares.map(p => p[1])); return pares.map(([n, v, c, id]) => `<div class="barra-l" ${id ? `style="cursor:pointer" onclick="irPara(${arg(id)})"` : ''}><span class="n" title="${esc(n)}">${esc(n)}</span><span class="t"><span style="width:${v * 100 / mx}%;background:${c || cor}"></span></span><b>${fmt ? fmt(v) : fmtN(v)}</b></div>`).join('') || '<div class="vazio">Sem dados.</div>'; };
  const porTipo = Object.keys(TIPOS).map(t => [t, base.filter(s => s.tipo === t).length, TIPOS[t].cor]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const porArea = areas.filter(a => !fa || a === fa).map(a => { const sub = base.filter(s => areaDe.get(s.id) === a); return { a, n:sub.length, ser:sub.reduce((x, s) => x + num(s.servidores), 0), orc:sub.reduce((x, s) => x + num(s.orcamento), 0) }; });
  const impDist = [5,4,3,2,1,0].map(n => [IMPACTO[n][0], base.filter(s => num(s.impacto) === n).length, IMPACTO[n][1]]);
  const valDist = Object.keys(STATUS_VAL).map(k => [k, base.filter(s => statusVal(s.id) === k).length, STATUS_VAL[k]]);
  const topImp = base.filter(s => num(s.impacto) >= 4).sort((a, b) => num(b.impacto) - num(a.impacto) || num(b.servidores) - num(a.servidores)).slice(0, 10);
  const semResp = base.filter(s => !s.responsavel && ['Gabinete','Superintendência','Diretoria','Coordenadoria'].includes(s.tipo)).slice(0, 12);
  const saldo = base.map(s => [s, linhasDe(s.positivos).length - linhasDe(s.negativos).length, linhasDe(s.negativos).length]).filter(x => x[2]).sort((a, b) => a[1] - b[1]).slice(0, 8);
  $('#p-corpo').innerHTML = `
    <div class="kpis">
      ${kpi('#1e3a8a','fa-sitemap','Setores ativos', fmtN(base.length), `${porTipo.length} tipos · ${DB.setores.filter(s => s.status === 'Extinto' && (!fa || areaDe.get(s.id) === fa)).length} extintos`)}
      ${kpi('#0891b2','fa-users','Servidores', fmtN(soma('servidores')), `${fmtN(soma('comissionados'))} em cargos comissionados`)}
      ${kpi('#16a34a','fa-coins','Orçamento anual', fmtRc(soma('orcamento')), `custo mensal ${fmtRc(soma('custoMensal'))}`)}
      ${kpi('#d97706','fa-stamp','Validações pendentes', fmtN(pend), `${vals.length} pedidas no total`)}
      ${kpi('#7c3aed','fa-list-check','Cadastro completo', compl + '%', `${comResp} com responsável · ${comComp} com competências`)}
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#1e3a8a"><h3><i class="fa-solid fa-building-columns"></i>Por secretaria adjunta</h3><p class="s">Quantidade de setores em cada área (clique para abrir no mapa)</p>${barras(porArea.map(x => [nomeCurto(porId.get(x.a)), x.n, corArea(x.a), x.a]))}</div>
      <div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-shapes"></i>Por tipo de setor</h3><p class="s">Como a estrutura se distribui</p>${barras(porTipo)}</div>
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#0891b2"><h3><i class="fa-solid fa-users"></i>Servidores por área</h3><p class="s">Soma do campo Servidores</p>${porArea.some(x => x.ser) ? barras(porArea.map(x => [nomeCurto(porId.get(x.a)), x.ser, corArea(x.a), x.a])) : '<div class="vazio"><i class="fa-solid fa-users-slash"></i>Preencha os valores dos setores (aba Valores) para ver esta distribuição.</div>'}</div>
      <div class="cartao bl" style="--c:#16a34a"><h3><i class="fa-solid fa-coins"></i>Orçamento por área</h3><p class="s">Soma do orçamento anual</p>${porArea.some(x => x.orc) ? barras(porArea.map(x => [nomeCurto(porId.get(x.a)), x.orc, corArea(x.a), x.a]), null, fmtRc) : '<div class="vazio"><i class="fa-solid fa-coins"></i>Sem orçamento informado ainda.</div>'}</div>
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#f97316"><h3><i class="fa-solid fa-bolt"></i>Impacto</h3><p class="s">Classificação de impacto dos setores</p>${barras(impDist)}</div>
      <div class="cartao bl" style="--c:#d97706"><h3><i class="fa-solid fa-stamp"></i>Situação das validações</h3><p class="s">Por setor</p>${barras(valDist)}</div>
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-triangle-exclamation"></i>Setores de impacto alto ou crítico</h3><p class="s">Prioridade para acompanhamento</p><div class="pend">${topImp.map(s => `<button onclick="irPara(${arg(s.id)})"><span class="chip" style="--c:${IMPACTO[num(s.impacto)][1]}">${IMPACTO[num(s.impacto)][0]}</span><span>${esc(s.nome)}</span><small style="color:var(--mut)">${esc(nomeCurto(porId.get(areaDe.get(s.id))))}</small></button>`).join('') || '<div class="vazio">Nenhum setor classificado como alto ou crítico.</div>'}</div></div>
      <div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-user-xmark"></i>Chefias sem responsável</h3><p class="s">Gabinetes, superintendências, diretorias e coordenadorias</p><div class="pend">${semResp.map(s => `<button onclick="irPara(${arg(s.id)})"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)};width:16px"></i><span>${esc(s.nome)}</span></button>`).join('') || '<div class="vazio">Todas têm responsável.</div>'}</div></div>
    </div>
    ${saldo.length ? `<div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-scale-unbalanced"></i>Mais pontos negativos que positivos</h3><p class="s">Setores com pontos de atenção registrados</p><div class="pend">${saldo.map(([s, d, n]) => `<button onclick="irPara(${arg(s.id)})"><span class="chip" style="--c:${d < 0 ? '#dc2626' : '#d97706'}">${n} negativo(s)</span><span>${esc(s.nome)}</span></button>`).join('')}</div></div>` : ''}`;
}

/* Validações (todas) */
function renderValidacoes(){
  opcoesFiltro('#v-status', 'Todas as situações', Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(t => [t, t]));
  const usados = [...new Set(DB.validacoes.map(v => v.validadorId))].filter(i => porId.has(i)).sort((a, b) => porId.get(a).nome.localeCompare(porId.get(b).nome, 'pt-BR'));
  opcoesFiltro('#v-validador', 'Todos os validadores', usados.map(i => [i, porId.get(i).nome]));
  const q = norm($('#v-busca').value), fs = $('#v-status').value, fv = $('#v-validador').value;
  const l = DB.validacoes.filter(v => (!fs || (v.status || 'Pendente') === fs) && (!fv || v.validadorId === fv) && (!q || norm([(porId.get(v.setorId) || {}).nome, (porId.get(v.validadorId) || {}).nome, v.parecer].join(' ')).includes(q)))
    .sort((a, b) => ((a.status || 'Pendente') === 'Pendente' ? 0 : 1) - ((b.status || 'Pendente') === 'Pendente' ? 0 : 1) || Date.parse(b.solicitadoEm || 0) - Date.parse(a.solicitadoEm || 0));
  $('#v-corpo').innerHTML = l.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th>Setor avaliado</th><th>Setor validador</th><th>Situação</th><th>Parecer</th><th>Pedida em</th></tr></thead><tbody>${l.map(v => { const s = porId.get(v.setorId), o = porId.get(v.validadorId); return `<tr>
    <td onclick="irPara(${arg(v.setorId)})"><b>${esc(s ? s.nome : '?')}</b></td><td>${esc(o ? o.nome : '?')}</td>
    <td onclick="event.stopPropagation()"><select class="campo" style="height:32px;min-width:190px" onchange="editarValidacao(${arg(v.id)},'status',this.value)">${Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(x => `<option ${x === (v.status || 'Pendente') ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
    <td onclick="event.stopPropagation()" style="white-space:normal;min-width:240px"><input class="campo" style="height:32px" value="${esc(v.parecer)}" placeholder="Parecer" onchange="editarValidacao(${arg(v.id)},'parecer',this.value)"></td>
    <td>${fmtData(v.solicitadoEm)}</td></tr>`; }).join('')}</tbody></table></div>`
    : `<div class="cartao vazio" style="padding:40px"><i class="fa-solid fa-stamp"></i>Nenhuma validação ${DB.validacoes.length ? 'com esses filtros' : 'pedida ainda'}.<br><span style="font-size:12.5px">Abra um setor no mapa e use a aba <b>Validações</b> para pedir a outro setor que valide sua estrutura.</span></div>`;
}

/* Configurações */
function renderConfig(){
  $('#c-corpo').innerHTML = `
    <div class="cartao bl"><h3><i class="fa-solid fa-cloud"></i>Conexão com a planilha</h3>
      <p class="s">Situação: <b>${online() ? 'conectado ao Apps Script' : 'desconectado'}</b>${online() && fila.length ? ` · ${fila.length} alteração(ões) aguardando envio` : ''}${ultimoErro ? ` · <span style="color:var(--perigo)">${esc(ultimoErro)}</span>` : ''}</p>
      <p class="s">Conectado como <b>${esc(cfg.usuario)}</b> (${esc(cfg.login)}) · perfil <b>${esc(cfg.perfil || '—')}</b>${sessao.lembrado() ? ' · sessão mantida neste computador' : ''}</p>
      <label><span class="rot">Endereço do Apps Script (Web App)</span><input id="c-url" class="campo" value="${esc(cfg.url)}" ${ehAdmin() ? '' : 'readonly'} placeholder="https://script.google.com/macros/s/.../exec"></label>
      <div class="acoes"><button class="btn btn-s" onclick="testarConexao()"><i class="fa-solid fa-signal"></i>Testar</button>${ehAdmin() ? `<button class="btn btn-s" onclick="salvarUrl()"><i class="fa-solid fa-floppy-disk"></i>Salvar endereço</button>` : ''}${online() ? `<button class="btn btn-s" onclick="recarregarNuvem()"><i class="fa-solid fa-cloud-arrow-down"></i>Baixar da planilha</button>${ehAdmin() ? `<button class="btn btn-s" onclick="enviarTudo()"><i class="fa-solid fa-cloud-arrow-up"></i>Enviar tudo para a planilha</button>` : ''}` : ''}<button class="btn btn-s" onclick="modalTrocarSenha(false)"><i class="fa-solid fa-key"></i>Alterar minha senha</button></div>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-mobile-screen-button"></i>GABOrg como aplicativo</h3>
      <p class="s">${rodandoComoApp() ? 'Você está usando o GABOrg instalado como app.' : 'Instale o GABOrg no computador ou no celular: ele ganha ícone próprio e abre em tela cheia, sem a barra do navegador. Os dados continuam na planilha.'}</p>
      ${rodandoComoApp() ? '' : `<div class="acoes"><button class="btn btn-p" onclick="instalarApp()"><i class="fa-solid fa-download"></i>Instalar o GABOrg</button></div>
      <p class="s" style="font-size:12px">Android/Chrome/Edge: botão acima ou menu do navegador › <b>Instalar app</b>. iPhone/iPad: Safari › <b>Compartilhar</b> › <b>Adicionar à Tela de Início</b>. É preciso abrir pelo endereço publicado (GitHub Pages), não pelo arquivo.</p>`}
    </div>
    <div class="cartao bl so-adm"><h3><i class="fa-solid fa-file-code"></i>Como instalar ou atualizar o backend</h3>
      <ol class="passos">
        <li>Na planilha, abra <b>Extensões › Apps Script</b>, apague o conteúdo e cole o arquivo <code>Codigo.gs</code>. Salve.</li>
        <li>Execute a função <code>configurarGABOrg</code> uma vez e autorize. Ela cria as abas e o usuário <b>admin</b> com uma <b>senha provisória</b> (mostrada na planilha).</li>
        <li><b>Implantar › Nova implantação › App da Web</b>, executar como <b>Eu</b> e acesso <b>Qualquer pessoa</b>. Para atualizar sem mudar o endereço: <b>Gerenciar implantações › Editar › Nova versão</b>.</li>
        <li>Entre com <b>admin</b> e a senha provisória, defina a sua senha e cadastre as outras pessoas em <b>Usuários</b>.</li>
        <li>Esqueceu a senha do único administrador? Na planilha, use o menu <b>GABOrg › Redefinir senha de um usuário</b>.</li>
      </ol>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-box-archive"></i>Cópias e restauração</h3>
      <p class="s">${DB.setores.length} setores · ${DB.validacoes.length} validações · ${DB.vinculos.length} vínculos · ${DB.historico.length} registros de histórico</p>
      <div class="acoes">
        <button class="btn btn-s" onclick="exportarJSON()"><i class="fa-solid fa-download"></i>Exportar cópia (JSON)</button>
        <label class="btn btn-s so-adm"><i class="fa-solid fa-upload"></i>Importar cópia<input type="file" accept=".json,application/json" class="sr" onchange="importarJSON(this.files[0])"></label>
        <button class="btn btn-s" onclick="exportarCSV()"><i class="fa-solid fa-file-csv"></i>Exportar setores (CSV)</button>
        <button class="btn btn-perigo so-adm" onclick="restaurarDecreto()"><i class="fa-solid fa-rotate-left"></i>Restaurar estrutura do decreto</button>
      </div>
    </div>
    <p style="font-size:11.5px;color:var(--mut)">GABOrg v${VERSAO} · estrutura de referência: Decreto nº 2.236, de 27 de agosto de 2026 (vigência 01/09/2026). A hierarquia foi lida do organograma anexo: confira as subordinações e ajuste no mapa quando necessário.</p>`;
}
async function salvarUrl(){
  const url = $('#c-url').value.trim();
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) return toast('Informe o endereço do Web App do Apps Script.', 'aviso');
  if (url === cfg.url) return toast('O endereço não mudou.');
  if (!await confirmar('Trocar endereço', 'Ao trocar o endereço do Apps Script, você precisará entrar de novo com usuário e senha cadastrados naquela planilha.', 'Trocar e sair')) return;
  cfg.url = url; salvarCfg(); sessao.set(''); cfg.token = ''; location.reload();
}
async function testarConexao(){
  const url = ($('#c-url') && $('#c-url').value.trim()) || cfg.url; if (!url) return toast('Informe o endereço.', 'aviso');
  const t0 = performance.now();
  try { const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=ping').then(x => x.text()).then(JSON.parse); toast(`Apps Script respondeu em ${Math.round(performance.now() - t0)} ms (GABOrg backend v${r.versao || '?'}).`); }
  catch (e) { toast('Não foi possível falar com o Apps Script.', 'erro'); }
}
async function recarregarNuvem(){
  if (fila.length && !await confirmar('Baixar da planilha', `${fila.length} alteração(ões) ainda não foram enviadas. Elas continuam guardadas e serão reaplicadas.`, 'Baixar')) return;
  try { await lerNuvem(); redesenharTudo(); toast('Dados atualizados.'); } catch (e) { toast(e.message, 'erro'); }
}
async function enviarTudo(){
  if (!await confirmar('Enviar tudo para a planilha', 'A planilha será substituída pelos dados desta tela (setores, validações, vínculos e histórico). Continuar?', 'Substituir planilha', true)) return;
  try { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); fila = []; store.set('gaborg_fila', fila); versaoNuvem = String(r.versao || ''); toast('Planilha substituída.'); } catch (e) { toast(e.message, 'erro'); }
  statusSync(); renderConfig();
}
function baixarArquivo(nome, conteudo, tipo){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([conteudo], { type:tipo })); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function exportarJSON(){ baixarArquivo(`gaborg_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ sistema:'GABOrg', versao:VERSAO, exportadoEm:agora(), dados:DB }, null, 1), 'application/json'); }
async function importarJSON(f){
  if (!f) return;
  try {
    const j = JSON.parse(await f.text()), d = j.dados || j;
    if (!Array.isArray(d.setores)) throw new Error('Arquivo sem a lista de setores.');
    if (!await confirmar('Importar cópia', `Substituir a estrutura atual pelos <b>${d.setores.length}</b> setores do arquivo?${online() ? ' A planilha também será substituída.' : ''}`, 'Importar', true)) return;
    TABS_DB.forEach(t => DB[t] = (d[t] || []).map(x => novoReg(t, x)));
    redesenharTudo(); salvarLocal();
    if (online()) { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); versaoNuvem = String(r.versao || ''); }
    toast('Cópia importada.');
  } catch (e) { toast('Falha ao importar: ' + e.message, 'erro'); }
}
function exportarCSV(){
  const q = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' | ')}"`;
  const cab = ['ID','Nome','Sigla','Tipo','Setor superior','Caminho','Área','Situação','Responsável','Contato','Competências','Entregas','Orçamento anual','Custo mensal','Servidores','Comissionados','Impacto','Descrição do impacto','Pontos positivos','Pontos negativos','Validação'];
  const ordenados = []; const visit = s => { ordenados.push(s); filhosDe(s.id).forEach(visit); }; raizes().forEach(visit);
  const linhas = ordenados.map(s => [s.id, s.nome, s.sigla, s.tipo, (porId.get(s.paiId) || {}).nome || '', caminho(s.id).map(a => a.nome).concat(s.nome).join(' > '), nomeCurto(porId.get(areaDe.get(s.id))), s.status, s.responsavel, s.contato, s.competencias, s.entregas, s.orcamento, s.custoMensal, s.servidores, s.comissionados, num(s.impacto) ? IMPACTO[num(s.impacto)][0] : '', s.impactoDescricao, s.positivos, s.negativos, statusVal(s.id)].map(q).join(';'));
  baixarArquivo(`gaborg_setores_${new Date().toISOString().slice(0, 10)}.csv`, '\uFEFF' + [cab.map(q).join(';')].concat(linhas).join('\r\n'), 'text/csv;charset=utf-8');
  toast(`${ordenados.length} setores exportados.`);
}
async function restaurarDecreto(){
  if (!await confirmar('Restaurar estrutura do decreto', 'Todos os setores, valores, validações e vínculos atuais serão substituídos pela estrutura original do Decreto nº 2.236/2026. Exporte uma cópia antes, se precisar.', 'Restaurar', true)) return;
  DB = Object.assign(construirDecreto(), { historico:DB.historico, rubricas:DB.rubricas || [], despesas:DB.despesas || [] });
  indexar();abertos = new Set(raizes().map(r => r.id)); salvarAbertos();
  salvarLocal();
  if (online()) { try { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); versaoNuvem = String(r.versao || ''); } catch (e) { toast(e.message, 'erro'); } }
  fecharPainel(); trocarVista('mapa'); setTimeout(() => ajustar(true), 50); toast('Estrutura do decreto restaurada.');
}

/* ===================== TEMA, LOGIN E INÍCIO ===================== */
function alternarTema(){ const e = document.documentElement.dataset.tema === 'escuro'; if (e) delete document.documentElement.dataset.tema; else document.documentElement.dataset.tema = 'escuro'; store.set('gaborg_tema', e ? 'claro' : 'escuro'); try { localStorage.setItem('gaborg_tema', e ? 'claro' : 'escuro'); } catch (x) {} desenharMini(); }
function preencherUsuario(){
  $('#u-nome').textContent = cfg.usuario || cfg.login || 'Usuário'; $('#u-av').textContent = iniciais(cfg.usuario || cfg.login);
  $('#u-perfil').textContent = cfg.perfil || '';
  document.body.classList.toggle('ro', somenteLeitura());
  document.body.classList.toggle('adm', ehAdmin());
}
function salvarCfg(){ const c = Object.assign({}, cfg); delete c.token; store.set('gaborg_cfg', c); }
function aplicarUsuario(u){ Object.assign(cfg, { usuario:u.nome || u.login, login:u.login, perfil:u.perfil, modo:'nuvem' }); salvarCfg(); preencherUsuario(); }
function verSenha(b){ const i = b.parentNode.querySelector('input'); const v = i.type === 'password'; i.type = v ? 'text' : 'password'; b.innerHTML = `<i class="fa-solid ${v ? 'fa-eye-slash' : 'fa-eye'}"></i>`; b.title = v ? 'Ocultar senha' : 'Mostrar senha'; }
function mostrarLogin(msg){
  $('#app').classList.add('hidden'); $('#login').classList.remove('hidden');
  $('#lg-login').value = cfg.login || ''; $('#lg-url').value = cfg.url || URL_PADRAO; $('#lg-senha').value = '';
  const a = $('#lg-aviso'); if (msg) { a.textContent = msg; a.classList.remove('hidden'); } else a.classList.add('hidden');
  setTimeout(() => (cfg.login ? $('#lg-senha') : $('#lg-login')).focus(), 50);
}
let encerrando = false;
function sessaoEncerrada(msg){
  if (encerrando) return; encerrando = true;
  cfg.token = ''; sessao.set(''); document.querySelectorAll('.modal').forEach(m => m.remove());
  mostrarLogin(msg || 'Sua sessão terminou. Entre novamente.');
  setTimeout(() => { encerrando = false; }, 1000);
}
async function carregarNuvem(){
  await lerNuvem();
  if (!DB.setores.length && ehAdmin()) {
    if (await confirmar('Planilha vazia', 'A planilha ainda não tem setores. Enviar a estrutura do <b>Decreto nº 2.236/2026</b> para começar?', 'Enviar estrutura')) {
      DB = construirDecreto(); indexar(); abertos = new Set(raizes().map(r => r.id)); salvarAbertos();
      const rr = await chamar({ action:'replace_all', dados:DB }, 120000); if (rr.status !== 'success') throw new Error(rr.message);
      versaoNuvem = String(rr.versao || '');
    }
  }
  salvarLocal();
}
$('#f-login').addEventListener('submit', async e => {
  e.preventDefault();
  const login = $('#lg-login').value.trim(), senha = $('#lg-senha').value, lembrar = $('#lg-lembrar').checked, url = $('#lg-url').value.trim() || cfg.url;
  const aviso = m => { const a = $('#lg-aviso'); a.textContent = m; a.classList.remove('hidden'); };
  if (!login || !senha) return aviso('Informe usuário e senha.');
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) { $('#lg-adv').open = true; return aviso('Informe o endereço do Apps Script.'); }
  const b = $('#lg-btn'); b.disabled = true; b.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>Entrando...';
  try {
    if (url !== cfg.url) { cfg.url = url; fila = []; store.set('gaborg_fila', fila); store.set('gaborg_db', null); }
    if (login.toLowerCase() !== String(cfg.login || '').toLowerCase()) { fila = []; store.set('gaborg_fila', fila); }
    cfg.token = '';
    const r = await chamar({ action:'login', login, senha, lembrar }, 30000);
    if (r.status !== 'success') throw new Error(r.message || 'Não foi possível entrar.');
    cfg.token = r.token; sessao.set(r.token, lembrar); aplicarUsuario(r.usuario);
    $('#lg-senha').value = ''; $('#lg-aviso').classList.add('hidden');
    if (r.usuario.trocarSenha === 'Sim') { const ok = await modalTrocarSenha(true, senha); if (!ok) throw new Error('Defina uma nova senha para continuar.'); }
    await carregarNuvem(); abrirApp();
  } catch (err) { aviso(err.message || 'Não foi possível conectar.'); }
  b.disabled = false; b.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i>Entrar';
});
function sair(){
  if (fila.length && !confirm(`${fila.length} alteração(ões) ainda não chegaram à planilha. Elas ficam guardadas neste navegador e serão enviadas quando você entrar de novo. Sair mesmo assim?`)) return;
  cfg.token = ''; sessao.set(''); location.reload();
}
function abrirApp(){
  indexar();
  if (!store.get('gaborg_abertos', null)) { abertos = new Set(raizes().map(r => r.id)); salvarAbertos(); }
  $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
  preencherUsuario(); statusSync();
  { const hv = location.hash.slice(1); if (['mapa','lista','painel','validacoes','config'].includes(hv)) vistaAtual = hv; }
  trocarVista(vistaAtual === 'usuarios' && !ehAdmin() ? 'mapa' : (vistaAtual || 'mapa'));
  if (!store.get('gaborg_view_ok', false)) { setTimeout(() => ajustar(true), 60); store.set('gaborg_view_ok', true); }
  if (fila.length && !somenteLeitura()) enviarFila(); else if (somenteLeitura() && fila.length) { fila = []; store.set('gaborg_fila', fila); }
}

/* ===================== SENHA E USUÁRIOS ===================== */
function abrirModal({ titulo, html, rotulo, perigo, semCancelar, largura, aoConfirmar }){
  return new Promise(ok => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<form class="cx" role="dialog" aria-modal="true" style="${largura ? 'max-width:' + largura + 'px' : ''}"><h3>${esc(titulo)}</h3>${html}<div class="lg-aviso hidden" data-aviso></div><div class="acoes">${semCancelar ? '' : '<button type="button" class="btn btn-s" data-r="0">Cancelar</button>'}<button type="submit" class="btn ${perigo ? 'btn-perigo' : 'btn-p'}" data-ok>${esc(rotulo || 'Confirmar')}</button></div></form>`;
    const fechar = v => { m.remove(); ok(v); };
    m.addEventListener('click', e => { if (e.target.closest('[data-r="0"]') || (e.target === m && !semCancelar)) fechar(false); });
    m.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const bt = m.querySelector('[data-ok]'), av = m.querySelector('[data-aviso]'), txt = bt.innerHTML;
      bt.disabled = true; bt.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>Aguarde...'; av.classList.add('hidden');
      try { const r = aoConfirmar ? await aoConfirmar(m) : true; if (r !== false) fechar(r === undefined ? true : r); }
      catch (err) { av.textContent = err.message || String(err); av.classList.remove('hidden'); }
      bt.disabled = false; bt.innerHTML = txt;
    });
    document.body.appendChild(m);
    const f = m.querySelector('input:not([type=hidden]):not([readonly]),select'); (f || m.querySelector('[data-ok]')).focus();
  });
}
const campoSenha = (id, rot, ac) => `<label><span class="rot">${rot}</span><span class="senha-cx"><input id="${id}" class="campo" type="password" autocomplete="${ac}" required><button type="button" class="ver" title="Mostrar senha" onclick="verSenha(this)"><i class="fa-solid fa-eye"></i></button></span></label>`;
let trocandoSenha = null;
function modalTrocarSenha(obrigatorio, atualConhecida){
  if (trocandoSenha) return trocandoSenha;
  trocandoSenha = abrirModal({
    titulo: obrigatorio ? 'Defina a sua senha' : 'Alterar minha senha',
    html: `<p>${obrigatorio ? 'Você entrou com uma senha provisória. Escolha agora uma senha pessoal.' : 'A nova senha passa a valer em todos os seus acessos.'} Use pelo menos <b>8 caracteres</b>, com letras e números.</p>
      ${atualConhecida ? '' : campoSenha('ts-atual', obrigatorio ? 'Senha provisória' : 'Senha atual', 'current-password')}
      ${campoSenha('ts-nova', 'Nova senha', 'new-password')}${campoSenha('ts-conf', 'Repita a nova senha', 'new-password')}`,
    rotulo: 'Salvar senha', semCancelar: obrigatorio,
    aoConfirmar: async m => {
      const atual = atualConhecida || m.querySelector('#ts-atual').value, nova = m.querySelector('#ts-nova').value, conf = m.querySelector('#ts-conf').value;
      if (nova.length < 8 || !/[A-Za-zÀ-ú]/.test(nova) || !/\d/.test(nova)) throw new Error('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
      if (nova !== conf) throw new Error('As duas senhas não são iguais.');
      const r = await chamar({ action:'change_password', senhaAtual:atual, novaSenha:nova }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      cfg.token = r.token; sessao.set(r.token, sessao.lembrado()); aplicarUsuario(r.usuario);
      toast('Senha alterada.'); return true;
    }
  }).finally(() => { trocandoSenha = null; });
  return trocandoSenha;
}

let usuarios = [], acessos = [], abaAdmAtual = 'usuarios';
const COR_PERFIL = { Administrador:'#dc2626', Editor:'#2563eb', Leitor:'#64748b' };
const COR_EVENTO = { 'Login':'#16a34a', 'Senha incorreta':'#d97706', 'Login recusado':'#dc2626', 'Bloqueado por tentativas':'#dc2626', 'Usuário criado':'#2563eb', 'Usuário alterado':'#0891b2', 'Usuário desativado':'#64748b', 'Usuário excluído':'#dc2626', 'Usuário desbloqueado':'#16a34a', 'Senha alterada pelo usuário':'#7c3aed', 'Senha definida pelo administrador':'#7c3aed', 'Senha provisória gerada':'#7c3aed', 'Sessões encerradas':'#475569' };
function situacaoUsuario(u){
  if (u.ativo !== 'Sim') return ['Desativado', '#94a3b8'];
  if (u.bloqueado) return ['Bloqueado', '#dc2626'];
  if (u.trocarSenha === 'Sim') return [u.ultimoAcesso ? 'Deve trocar a senha' : 'Aguardando 1º acesso', '#d97706'];
  return ['Ativo', '#16a34a'];
}
function abaAdm(a){
  abaAdmAtual = a;
  document.querySelectorAll('.adm-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a));
  renderUsuarios();
}
async function renderUsuarios(recarregar){
  const c = $('#u-corpo'); if (!c) return;
  if (!ehAdmin()) { c.innerHTML = '<div class="cartao vazio">Apenas administradores acessam esta área.</div>'; return; }
  if (abaAdmAtual === 'perfis') return renderPerfis();
  if (abaAdmAtual === 'acessos') return renderAcessos(recarregar);
  if (!usuarios.length) c.innerHTML = '<div class="cartao vazio"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando usuários...</div>';
  try { const r = await chamar({ action:'users_list' }, 30000); if (r.status !== 'success') throw new Error(r.message); usuarios = r.usuarios || []; }
  catch (e) { c.innerHTML = `<div class="cartao vazio" style="color:var(--perigo)">${esc(e.message)}</div>`; return; }
  if (abaAdmAtual !== 'usuarios') return;
  const ativos = usuarios.filter(u => u.ativo === 'Sim');
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const f = { q:($('#ua-q') || {}).value || '', perfil:($('#ua-perfil') || {}).value || '', sit:($('#ua-sit') || {}).value || '' };
  c.innerHTML = `<div class="kpis">
      ${kpi('#2563eb', 'fa-users', 'Usuários', usuarios.length, `${ativos.length} ativo(s)`)}
      ${kpi('#dc2626', 'fa-user-shield', 'Administradores', ativos.filter(u => u.perfil === 'Administrador').length, 'ativos')}
      ${kpi('#d97706', 'fa-hourglass-half', 'Aguardando senha', ativos.filter(u => u.trocarSenha === 'Sim').length, 'precisam definir a senha')}
      ${kpi('#7f1d1d', 'fa-lock', 'Bloqueados', usuarios.filter(u => u.bloqueado).length, 'por senhas erradas')}
    </div>
    <div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="ua-q" class="campo" placeholder="Buscar nome, login ou e-mail" value="${esc(f.q)}" oninput="filtrarUsuarios()"></div>
      <select id="ua-perfil" class="campo" onchange="filtrarUsuarios()"><option value="">Todos os perfis</option>${['Administrador','Editor','Leitor'].map(p => `<option ${f.perfil === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
      <select id="ua-sit" class="campo" onchange="filtrarUsuarios()"><option value="">Todas as situações</option>${['Ativo','Aguardando 1º acesso','Deve trocar a senha','Bloqueado','Desativado'].map(s => `<option ${f.sit === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    </div>
    <div id="ua-lista"></div>
    <p style="font-size:12px;color:var(--mut);margin-top:10px"><i class="fa-solid fa-shield-halved"></i> Senhas nunca aparecem aqui: o sistema guarda só uma versão cifrada. Você pode <b>definir uma senha</b> para a pessoa ou <b>gerar uma provisória</b>; em ambos os casos pode exigir que ela crie a própria no próximo acesso.</p>`;
  filtrarUsuarios();
}
function filtrarUsuarios(){
  const el = $('#ua-lista'); if (!el) return;
  const q = norm($('#ua-q').value), pf = $('#ua-perfil').value, st = $('#ua-sit').value;
  const lista = usuarios.filter(u => (!q || norm(u.nome + ' ' + u.login + ' ' + (u.email || '')).includes(q)) && (!pf || u.perfil === pf) && (!st || situacaoUsuario(u)[0] === st))
    .sort((a, b) => (a.ativo === b.ativo ? 0 : a.ativo === 'Sim' ? -1 : 1) || a.nome.localeCompare(b.nome, 'pt-BR'));
  if (!lista.length) { el.innerHTML = '<div class="cartao vazio">Nenhum usuário com esses filtros.</div>'; return; }
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Nome</th><th>Login</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Último acesso</th><th></th></tr></thead><tbody>${lista.map(u => { const [s, cs] = situacaoUsuario(u); return `<tr>
    <td><span class="u-nome"><span class="u-av" style="background:${COR_PERFIL[u.perfil] || '#64748b'}">${esc(iniciais(u.nome))}</span><span><b>${esc(u.nome)}</b>${u.login === cfg.login ? ' <span class="chip" style="--c:#2563eb">você</span>' : ''}<small>criado ${u.criadoEm ? fmtData(u.criadoEm) : '—'}${u.criadoPor ? ' por ' + esc(u.criadoPor) : ''}</small></span></span></td>
    <td><code>${esc(u.login)}</code></td><td>${esc(u.email || '—')}</td>
    <td><span class="chip" style="--c:${COR_PERFIL[u.perfil] || '#64748b'}">${esc(u.perfil)}</span></td>
    <td><span class="chip" style="--c:${cs}">${s}</span>${Number(u.tentativas) && !u.bloqueado ? `<small style="display:block;color:var(--alerta);font-size:11px;margin-top:3px">${u.tentativas} senha(s) errada(s)</small>` : ''}</td>
    <td>${u.ultimoAcesso ? fmtData(u.ultimoAcesso) : '<span style="color:var(--mut)">nunca</span>'}</td>
    <td><div class="u-acoes"><button class="btn btn-s btn-sm" onclick="formUsuario(${arg(u.id)})"><i class="fa-solid fa-pen"></i>Editar</button><button class="btn btn-p btn-sm" onclick="acoesUsuario(${arg(u.id)})"><i class="fa-solid fa-key"></i>Senha e acesso</button></div></td></tr>`; }).join('')}</tbody></table></div>`;
}

// Painel de ações de um usuário (senha, bloqueio, sessões, situação, exclusão)
function acoesUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const proprio = u.login === cfg.login, [s, cs] = situacaoUsuario(u);
  const it = (a, ic, t, d, cls) => `<button type="button" data-a="${a}" class="${cls || ''}"><i class="fa-solid ${ic}"></i><span><b>${t}</b><small>${d}</small></span></button>`;
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="cx" role="dialog" aria-modal="true" style="max-width:460px">
    <div class="u-nome" style="margin-bottom:4px"><span class="u-av" style="width:42px;height:42px;font-size:14px;background:${COR_PERFIL[u.perfil] || '#64748b'}">${esc(iniciais(u.nome))}</span><span><b style="font-size:15px">${esc(u.nome)}</b><small><code>${esc(u.login)}</code> · ${esc(u.perfil)} · <span style="color:${cs};font-weight:700">${s}</span></small></span></div>
    <div class="sheet-acoes">
      ${it('definir', 'fa-key', 'Definir nova senha', 'Você escolhe a senha e informa à pessoa. Pode exigir que ela troque no próximo acesso.')}
      ${it('provisoria', 'fa-wand-magic-sparkles', 'Gerar senha provisória', 'O sistema cria uma senha aleatória; a pessoa define a própria ao entrar.')}
      ${u.bloqueado || Number(u.tentativas) ? it('desbloquear', 'fa-lock-open', 'Desbloquear', u.bloqueado ? 'Libera o login agora, sem esperar os 15 minutos.' : 'Zera o contador de senhas erradas.') : ''}
      ${proprio ? '' : it('sessoes', 'fa-right-from-bracket', 'Encerrar sessões abertas', 'Desconecta a pessoa de todos os computadores e celulares. A senha não muda.')}
      ${proprio ? '' : it('situacao', u.ativo === 'Sim' ? 'fa-user-slash' : 'fa-user-check', u.ativo === 'Sim' ? 'Desativar acesso' : 'Reativar acesso', u.ativo === 'Sim' ? 'Bloqueia o login sem apagar o usuário. Pode ser reativado depois.' : 'Volta a permitir o login com a senha atual.')}
      ${it('historico', 'fa-clock-rotate-left', 'Ver registro de acessos', 'Logins, tentativas e alterações desta pessoa.')}
      ${proprio ? '' : it('excluir', 'fa-trash-can', 'Excluir usuário', 'Remove o acesso de vez. O histórico de alterações é mantido.', 'perigo')}
    </div>
    <div class="acoes"><button type="button" class="btn btn-s" data-a="fechar">Fechar</button></div></div>`;
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b && e.target !== m) return;
    m.remove(); const a = b && b.dataset.a;
    if (a === 'definir') definirSenhaUsuario(id);
    if (a === 'provisoria') resetarSenha(id);
    if (a === 'desbloquear') acaoSimples(id, 'user_unlock', 'Usuário desbloqueado.');
    if (a === 'sessoes') confirmar('Encerrar sessões', `Desconectar <b>${esc(u.nome)}</b> de todos os aparelhos? Ela precisará entrar de novo com a senha atual.`, 'Encerrar sessões').then(ok => ok && acaoSimples(id, 'user_logout', 'Sessões encerradas.'));
    if (a === 'situacao') alternarAtivo(id);
    if (a === 'historico') { abaAdm('acessos'); setTimeout(() => { const q = $('#ac-q'); if (q) { q.value = u.login; filtrarAcessos(); } }, 400); }
    if (a === 'excluir') excluirUsuario(id);
  });
  document.body.appendChild(m);
}
async function acaoSimples(id, action, msg){
  try { const r = await chamar({ action, id }, 30000); if (r.status !== 'success') throw new Error(r.message); toast(msg); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
async function alternarAtivo(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const ativar = u.ativo !== 'Sim';
  if (!ativar && !await confirmar('Desativar acesso', `<b>${esc(u.nome)}</b> não conseguirá mais entrar e as sessões abertas serão encerradas. Você pode reativar depois.`, 'Desativar', true)) return;
  try { const r = await chamar({ action:'user_save', usuario:{ id:u.id, nome:u.nome, login:u.login, email:u.email, perfil:u.perfil, ativo: ativar ? 'Sim' : 'Não' } }, 30000); if (r.status !== 'success') throw new Error(r.message); toast(ativar ? 'Acesso reativado.' : 'Acesso desativado.'); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
function sugerirSenha(){
  const L = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz', N = '23456789', T = L + N + '@#$%&*';
  const r = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  let s = L[r(L.length)] + N[r(N.length)]; while (s.length < 12) s += T[r(T.length)];
  return s.split('').sort(() => r(3) - 1).join('');
}
function forcaSenha(s){
  let p = 0; if (s.length >= 8) p++; if (s.length >= 12) p++; if (/[a-z]/.test(s) && /[A-Z]/.test(s)) p++; if (/\d/.test(s)) p++; if (/[^A-Za-z0-9]/.test(s)) p++;
  return [['Muito fraca', '#dc2626', 15], ['Fraca', '#dc2626', 30], ['Razoável', '#d97706', 55], ['Boa', '#16a34a', 78], ['Forte', '#16a34a', 100], ['Forte', '#16a34a', 100]][p];
}
function medirSenha(inp){
  const [t, c, w] = forcaSenha(inp.value), cx = inp.closest('form').querySelector('[data-forca]');
  if (!cx) return; cx.querySelector('i').style.cssText = `width:${inp.value ? w : 0}%;background:${c}`; cx.nextElementSibling.textContent = inp.value ? 'Força: ' + t : '';
}
function definirSenhaUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const proprio = u.login === cfg.login;
  let senhaFinal = '';
  abrirModal({ titulo:'Definir nova senha', rotulo:'Salvar senha', largura:460,
    html:`<p>Nova senha de <b>${esc(u.nome)}</b> (<code>${esc(u.login)}</code>). As sessões abertas dessa pessoa serão encerradas.</p>
      <label><span class="rot">Nova senha</span><span class="senha-cx"><input id="ds-senha" class="campo" type="password" autocomplete="new-password" required oninput="medirSenha(this)"><button type="button" class="ver" title="Mostrar senha" onclick="verSenha(this)"><i class="fa-solid fa-eye"></i></button></span></label>
      <div class="forca" data-forca><i></i></div><small style="font-size:11.5px;color:var(--mut)"></small>
      <button type="button" class="btn btn-s btn-sm" style="align-self:flex-start" onclick="const i=this.closest('form').querySelector('#ds-senha');i.value=sugerirSenha();i.type='text';medirSenha(i)"><i class="fa-solid fa-dice"></i>Sugerir senha forte</button>
      <label class="chk"><input type="checkbox" id="ds-trocar" ${proprio ? '' : 'checked'}><span>Exigir que a pessoa crie a própria senha no próximo acesso <small style="display:block;color:var(--mut)">Recomendado: assim só ela conhecerá a senha definitiva.</small></span></label>
      <p style="font-size:12px">Mínimo de <b>8 caracteres</b>, com letras e números.</p>`,
    aoConfirmar: async m => {
      const s = m.querySelector('#ds-senha').value, troca = m.querySelector('#ds-trocar').checked;
      if (s.length < 8 || !/[A-Za-zÀ-ú]/.test(s) || !/\d/.test(s)) throw new Error('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
      const r = await chamar({ action:'user_set_password', id, senha:s, exigirTroca:troca }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      senhaFinal = s; return r;
    }
  }).then(async r => {
    if (!r) return;
    if (proprio) { sessaoEncerrada('Sua senha foi alterada. Entre com a nova senha.'); return; }
    await abrirModal({ titulo:'Senha definida', rotulo:'Pronto', semCancelar:true,
      html:`<p>Passe estes dados a <b>${esc(u.nome)}</b>${r.usuario.trocarSenha === 'Sim' ? '. No próximo acesso o GABOrg pedirá uma senha pessoal' : ''}.</p>
        <p><span class="rot">Usuário</span><code style="font-size:14px">${esc(u.login)}</code></p>
        <div><span class="rot">Senha</span><div class="senha-prov">${esc(senhaFinal)}</div></div>
        <button type="button" class="btn btn-s" onclick="navigator.clipboard && navigator.clipboard.writeText(${arg('Endereço: ' + location.href.split('#')[0] + '\nUsuário: ' + u.login + '\nSenha: ' + senhaFinal)}).then(() => toast('Copiado.'))"><i class="fa-regular fa-copy"></i>Copiar usuário e senha</button>` });
    renderUsuarios();
  });
}

/* Registro de acessos */
async function renderAcessos(recarregar){
  const c = $('#u-corpo');
  if (!acessos.length || recarregar !== false) {
    if (!acessos.length) c.innerHTML = '<div class="cartao vazio"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando registro...</div>';
    try { const r = await chamar({ action:'access_log', limite:1000 }, 30000); if (r.status !== 'success') throw new Error(r.message); acessos = r.acessos || []; }
    catch (e) { c.innerHTML = `<div class="cartao vazio" style="color:var(--perigo)">${esc(e.message)}${/desconhecida/i.test(e.message) ? '<br><small>Atualize o Codigo.gs no Apps Script e publique uma nova versão.</small>' : ''}</div>`; return; }
  }
  if (abaAdmAtual !== 'acessos') return;
  const hoje = new Date().toISOString().slice(0, 10);
  const deHoje = acessos.filter(a => (a.data || '').slice(0, 10) === hoje);
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const eventos = [...new Set(acessos.map(a => a.evento))].sort();
  c.innerHTML = `<div class="kpis">
      ${kpi('#16a34a', 'fa-right-to-bracket', 'Logins hoje', deHoje.filter(a => a.evento === 'Login').length, `${new Set(deHoje.filter(a => a.evento === 'Login').map(a => a.login)).size} pessoa(s)`)}
      ${kpi('#d97706', 'fa-triangle-exclamation', 'Falhas hoje', deHoje.filter(a => /incorreta|recusado|Bloqueado/.test(a.evento)).length, 'senhas erradas e recusas')}
      ${kpi('#7c3aed', 'fa-key', 'Mudanças de senha', acessos.filter(a => /Senha/.test(a.evento)).length, 'no período carregado')}
      ${kpi('#475569', 'fa-list', 'Registros', acessos.length, acessos.length ? 'desde ' + fmtData(acessos[acessos.length - 1].data) : '—')}
    </div>
    <div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="ac-q" class="campo" placeholder="Buscar usuário ou detalhe" oninput="filtrarAcessos()"></div>
      <select id="ac-ev" class="campo" onchange="filtrarAcessos()"><option value="">Todos os eventos</option><option value="__falhas">Só falhas e bloqueios</option>${eventos.map(e => `<option>${esc(e)}</option>`).join('')}</select>
      <button class="btn btn-s" onclick="exportarAcessos()"><i class="fa-solid fa-file-csv"></i>Exportar CSV</button>
    </div>
    <div id="ac-lista"></div>`;
  filtrarAcessos();
}
function acessosFiltrados(){
  const q = norm(($('#ac-q') || {}).value || ''), ev = ($('#ac-ev') || {}).value || '';
  return acessos.filter(a => (!q || norm(a.login + ' ' + a.nome + ' ' + a.detalhe + ' ' + a.autor).includes(q)) && (!ev || (ev === '__falhas' ? /incorreta|recusado|Bloqueado/.test(a.evento) : a.evento === ev)));
}
function filtrarAcessos(){
  const el = $('#ac-lista'); if (!el) return;
  const l = acessosFiltrados();
  if (!l.length) { el.innerHTML = '<div class="cartao vazio">Nenhum registro.</div>'; return; }
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Data</th><th>Usuário</th><th>Evento</th><th>Detalhe</th><th>Feito por</th></tr></thead><tbody>${l.slice(0, 500).map(a => `<tr>
    <td style="white-space:nowrap">${fmtData(a.data)}</td>
    <td class="ev"><b>${esc(a.nome || '—')}</b><br><small><code>${esc(a.login)}</code></small></td>
    <td><span class="chip" style="--c:${COR_EVENTO[a.evento] || '#64748b'}">${esc(a.evento)}</span></td>
    <td class="ev">${esc(a.detalhe || '')}</td>
    <td class="ev">${esc(a.autor || (a.evento === 'Login' || /incorreta|recusado|Bloqueado/.test(a.evento) ? '' : 'a própria pessoa'))}</td></tr>`).join('')}</tbody></table></div>
    ${l.length > 500 ? `<p style="font-size:12px;color:var(--mut)">Mostrando os 500 mais recentes de ${l.length}. Use a busca ou exporte o CSV para ver todos.</p>` : ''}`;
}
function exportarAcessos(){
  const l = acessosFiltrados(), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = '﻿' + ['Data;Login;Nome;Evento;Detalhe;Feito por', ...l.map(a => [fmtData(a.data), a.login, a.nome, a.evento, a.detalhe, a.autor].map(q).join(';'))].join('\r\n');
  const b = new Blob([csv], { type:'text/csv;charset=utf-8' }), u = URL.createObjectURL(b), lk = document.createElement('a');
  lk.href = u; lk.download = 'gaborg-acessos-' + new Date().toISOString().slice(0, 10) + '.csv'; lk.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
}

/* Perfis */
function renderPerfis(){
  const linhas = [
    ['Ver o mapa, a lista e os indicadores', 1, 1, 1], ['Exportar CSV e cópia JSON', 1, 1, 1],
    ['Criar, alterar, mover e excluir setores', 0, 1, 1], ['Valores, análise, validações e vínculos', 0, 1, 1], ['Alinhar e organizar o mapa', 0, 1, 1],
    ['Restaurar a estrutura do decreto / importar cópia', 0, 0, 1], ['Gerenciar usuários, senhas e acessos', 0, 0, 1]
  ];
  const ok = v => v ? '<i class="fa-solid fa-check" style="color:var(--ok)"></i>' : '<span style="color:var(--mut2)">—</span>';
  const n = p => usuarios.filter(u => u.perfil === p && u.ativo === 'Sim').length;
  $('#u-corpo').innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Permissão</th><th style="text-align:center">Leitor (${n('Leitor')})</th><th style="text-align:center">Editor (${n('Editor')})</th><th style="text-align:center">Administrador (${n('Administrador')})</th></tr></thead>
    <tbody>${linhas.map(([t, a, b, c]) => `<tr><td>${t}</td><td style="text-align:center">${ok(a)}</td><td style="text-align:center">${ok(b)}</td><td style="text-align:center">${ok(c)}</td></tr>`).join('')}</tbody></table></div>
    <div class="cartao bl" style="margin-top:14px"><h3><i class="fa-solid fa-shield-halved"></i>Regras de segurança</h3>
      <p class="s" style="line-height:1.7">• Senhas com no mínimo 8 caracteres, letras e números, guardadas só de forma cifrada.<br>• 5 senhas erradas seguidas bloqueiam o login por 15 minutos (o administrador pode desbloquear antes).<br>• Sessão de 12 horas, ou 30 dias com "Manter conectado".<br>• Trocar, definir ou redefinir a senha encerra as sessões abertas da pessoa.<br>• Sempre fica pelo menos um administrador ativo.<br>• Perdeu o acesso de administrador? Na planilha: menu 🏛️ GABOrg › Redefinir senha de um usuário.</p></div>`;
}
function mostrarSenhaProvisoria(u, senha, nova){
  return abrirModal({ titulo: nova ? 'Usuário criado' : 'Senha redefinida', rotulo:'Pronto', semCancelar:true,
    html:`<p>Passe estes dados a <b>${esc(u.nome)}</b>. A senha provisória aparece só agora; no primeiro acesso o GABOrg pede uma senha pessoal.</p>
      <p><span class="rot">Usuário</span><code style="font-size:14px">${esc(u.login)}</code></p>
      <div><span class="rot">Senha provisória</span><div class="senha-prov">${esc(senha)}</div></div>
      <button type="button" class="btn btn-s" onclick="navigator.clipboard && navigator.clipboard.writeText(${arg('Endereço: ' + location.href.split('#')[0] + '\nUsuário: ' + u.login + '\nSenha provisória: ' + senha)}).then(() => toast('Copiado.'))"><i class="fa-regular fa-copy"></i>Copiar usuário e senha</button>` });
}
function formUsuario(id){
  const u = usuarios.find(x => x.id === id) || { login:'', nome:'', email:'', perfil:'Editor', ativo:'Sim' };
  const proprio = u.login && u.login === cfg.login;
  abrirModal({ titulo: id ? 'Editar usuário' : 'Novo usuário', rotulo: id ? 'Salvar' : 'Criar usuário', largura:500,
    html:`<label><span class="rot">Nome completo</span><input id="fu-nome" class="campo" required value="${esc(u.nome)}" placeholder="Como aparecerá no histórico"></label>
      <div class="g2"><label><span class="rot">Login</span><input id="fu-login" class="campo" required autocapitalize="none" spellcheck="false" value="${esc(u.login)}" placeholder="maria.silva"></label>
      <label><span class="rot">E-mail <span style="font-weight:500;color:var(--mut)">(opcional, também serve para entrar)</span></span><input id="fu-email" class="campo" type="email" value="${esc(u.email)}"></label></div>
      <div class="g2"><label><span class="rot">Perfil</span><select id="fu-perfil" class="campo" ${proprio ? 'disabled' : ''}>${['Administrador','Editor','Leitor'].map(p => `<option ${p === u.perfil ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
      <label><span class="rot">Situação</span><select id="fu-ativo" class="campo" ${proprio ? 'disabled' : ''}><option value="Sim" ${u.ativo === 'Sim' ? 'selected' : ''}>Ativo</option><option value="Não" ${u.ativo !== 'Sim' ? 'selected' : ''}>Desativado</option></select></label></div>
      ${id ? '' : '<p style="font-size:12.5px">O sistema gera uma <b>senha provisória</b> e a mostra na próxima tela.</p>'}`,
    aoConfirmar: async m => {
      const dados = { id: id || '', nome:m.querySelector('#fu-nome').value.trim(), login:m.querySelector('#fu-login').value.trim().toLowerCase(), email:m.querySelector('#fu-email').value.trim(), perfil:m.querySelector('#fu-perfil').value, ativo:m.querySelector('#fu-ativo').value };
      if (!/^[a-z0-9._@-]{3,60}$/.test(dados.login)) throw new Error('Login: use de 3 a 60 letras minúsculas, números, ponto, hífen ou @ (sem espaços e acentos).');
      const r = await chamar({ action:'user_save', usuario:dados }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      if (proprio) aplicarUsuario(r.usuario);
      return r;
    }
  }).then(async r => { if (!r) return; if (r.senhaProvisoria) await mostrarSenhaProvisoria(r.usuario, r.senhaProvisoria, true); else toast('Usuário salvo.'); renderUsuarios(); });
}
async function resetarSenha(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  if (!await confirmar('Redefinir senha', `Gerar uma senha provisória para <b>${esc(u.nome)}</b>? A senha atual deixa de funcionar e as sessões abertas dessa pessoa são encerradas.`, 'Gerar senha provisória')) return;
  try { const r = await chamar({ action:'user_reset', id }, 30000); if (r.status !== 'success') throw new Error(r.message); if (u.login === cfg.login) { sessaoEncerrada('Sua senha foi redefinida. Entre com a senha provisória.'); } await mostrarSenhaProvisoria(r.usuario, r.senhaProvisoria, false); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
async function excluirUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  if (!await confirmar('Excluir usuário', `Excluir <b>${esc(u.nome)}</b> (${esc(u.login)})? Ele perde o acesso imediatamente. O histórico de alterações dessa pessoa é mantido. Para suspender sem excluir, edite e marque como desativado.`, 'Excluir', true)) return;
  try { const r = await chamar({ action:'user_delete', id }, 30000); if (r.status !== 'success') throw new Error(r.message); toast('Usuário excluído.'); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}

/* Perfil Leitor: bloqueia qualquer alteração, mesmo que um botão escape da interface */
['alterar','novoSetorEm','duplicarSetor','excluirSetor','moverOrdem','addItem','rmItem','solicitarValidacao','editarValidacao','rmValidacao','addVinculo','rmVinculo','reorganizar','restaurarDecreto','importarJSON','enviarTudo'].forEach(n => {
  const f = window[n]; if (typeof f !== 'function') return;
  const admin = ['restaurarDecreto','importarJSON','enviarTudo'].includes(n);
  window[n] = function(){
    if (admin ? !ehAdmin() : somenteLeitura()) { toast(admin ? 'Apenas administradores podem fazer isso.' : 'Seu perfil é somente leitura.', 'aviso'); if (n === 'alterar' && selId) setTimeout(renderPainel, 0); return; }
    return f.apply(this, arguments);
  };
});
function travarLeitura(raiz){
  if (!somenteLeitura() || !raiz) return;
  raiz.querySelectorAll('input,select,textarea').forEach(el => { el.disabled = true; });
  raiz.querySelectorAll('button').forEach(b => { const oc = b.getAttribute('onclick') || ''; if (!/irPara|abaPainel|selecionar|fecharPainel|abrirRamo/.test(oc)) b.disabled = true; });
}
['renderPainel','renderValidacoes'].forEach(n => {
  const f = window[n];
  window[n] = function(){ const r = f.apply(this, arguments); travarLeitura(n === 'renderPainel' ? $('#pn-corpo') : $('#v-corpo')); if (n === 'renderPainel' && somenteLeitura() && $('#pn-corpo') && !$('#pn-corpo .ro-aviso')) $('#pn-corpo').insertAdjacentHTML('afterbegin', '<div class="ro-aviso"><i class="fa-solid fa-eye"></i>Perfil Leitor: você pode consultar, mas não alterar.</div>'); return r; };
});
window.addEventListener('resize', () => { if (vistaAtual === 'mapa') desenharMini(); });

/* ===================== FINANCEIRO ===================== */
const CATEG_FIN = {
  'Cargo em comissão (DGA)':['#dc2626','fa-user-tie'], 'Função gratificada':['#ea580c','fa-award'], 'Bolsa':['#7c3aed','fa-graduation-cap'],
  'Pessoal efetivo':['#2563eb','fa-id-card'], 'Terceirizado / contrato':['#0891b2','fa-file-contract'], 'Custeio':['#16a34a','fa-receipt'],
  'Diárias e passagens':['#ca8a04','fa-plane'], 'Outro':['#64748b','fa-ellipsis']
};
const CENARIOS = ['Atual', 'Proposto'];
const numBR = v => { let s = String(v ?? '').trim(); if (!s) return 0; if (/,\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/[^\d.-]/g, ''); const n = Number(s); return isFinite(n) ? n : 0; };
const fmtM = v => numBR(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const fmtM0 = v => numBR(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
let abaFinAtual = 'resumo', calcLinhas = [];
const rubricaDe = id => DB.rubricas.find(r => r.id === id);
function calcDesp(d){
  const r = rubricaDe(d.rubricaId) || {};
  const unit = d.valorUnitario !== '' ? numBR(d.valorUnitario) : numBR(r.valorMensal);
  const enc = numBR(r.encargos), qtd = d.quantidade === '' ? 1 : numBR(d.quantidade);
  const mensal = qtd * unit * (1 + enc / 100);
  const meses = d.meses !== '' ? numBR(d.meses) : (r.meses !== '' && r.meses != null ? numBR(r.meses) : 12);
  return { r, unit, enc, qtd, mensal, meses, anual: mensal * meses, categoria: r.categoria || 'Outro' };
}
function backendSemFinanceiro(){ return online() && backendVersao && backendVersao.localeCompare('1.4.0', undefined, { numeric:true }) < 0; }
function despesasFiltradas(area){
  return DB.despesas.filter(d => !area || areaDe.get(d.setorId) === area || d.setorId === area);
}
function totaisFin(lista){
  const t = { Atual:{ m:0, a:0, n:0 }, Proposto:{ m:0, a:0, n:0 } };
  lista.forEach(d => { const c = calcDesp(d), k = d.cenario === 'Proposto' ? 'Proposto' : 'Atual'; t[k].m += c.mensal; t[k].a += c.anual; t[k].n++; });
  return t;
}
function custoSetorFin(id, comSub){
  const ids = new Set([id, ...(comSub ? descendentes(id) : [])]);
  return totaisFin(DB.despesas.filter(d => ids.has(d.setorId)));
}
function abaFin(a){ abaFinAtual = a; document.querySelectorAll('.fin-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a)); renderFinanceiro(); }
function renderFinanceiro(){
  const sel = $('#f-area'), va = sel.value;
  sel.innerHTML = '<option value="">Toda a Secretaria</option>' + areas.map(a => `<option value="${esc(a)}" ${a === va ? 'selected' : ''}>${esc(nomeCurto(porId.get(a)))}</option>`).join('');
  const c = $('#f-corpo');
  const aviso = backendSemFinanceiro() ? `<div class="cartao bl" style="border-color:#f59e0b;margin-bottom:14px"><h3 style="color:#b45309"><i class="fa-solid fa-triangle-exclamation"></i>Atualize o backend</h3><p class="s">A planilha está com o Codigo.gs v${esc(backendVersao)}. Para gravar o Financeiro na planilha, cole o Codigo.gs novo no Apps Script e publique uma nova versão. Até lá, os lançamentos ficam só neste navegador.</p></div>` : '';
  if (abaFinAtual === 'resumo') c.innerHTML = aviso + finResumo(sel.value);
  if (abaFinAtual === 'lancamentos') { c.innerHTML = aviso + finLancamentosCasca(); filtrarLancamentos(); }
  if (abaFinAtual === 'tabela') c.innerHTML = aviso + finTabela();
  if (abaFinAtual === 'calc') c.innerHTML = aviso + finCalc();
}
function barrasFin(itens, max){
  return `<div class="fin-barras">${itens.map(([n, cor, ic, a, p]) => `<div class="fin-barra" style="--c:${cor}"><span class="n" title="${esc(n)}"><i class="fa-solid ${ic}"></i>${esc(n)}</span><span class="t"><span style="width:${max ? a / max * 100 : 0}%"></span><span class="p" style="width:${max ? p / max * 100 : 0}%"></span></span><span class="v">${fmtM0(a)}<small>proposto ${fmtM0(p)}</small></span></div>`).join('')}</div>`;
}
function finResumo(area){
  const lista = despesasFiltradas(area), t = totaisFin(lista);
  const setoresArea = DB.setores.filter(s => s.status !== 'Extinto' && (!area || areaDe.get(s.id) === area || s.id === area));
  const orc = setoresArea.reduce((a, s) => a + numBR(s.orcamento), 0);
  const dif = t.Proposto.a - t.Atual.a;
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v" style="font-size:22px">${v}</div><div class="s">${s}</div></div>`;
  if (!DB.rubricas.length && !DB.despesas.length) return `<div class="cartao bl"><h3><i class="fa-solid fa-sack-dollar"></i>Comece pela tabela de valores</h3><p class="s">Cadastre os valores mensais dos cargos em comissão (DGA), funções gratificadas, bolsas e demais despesas em <b>Tabela de valores</b>. Depois faça os <b>lançamentos</b> em cada setor (quantidade × valor), no cenário <b>Atual</b> e no <b>Proposto</b>. O resumo, o painel do setor e o Modo TV passam a mostrar os totais.</p><div class="acoes"><button class="btn btn-p so-edit" onclick="abaFin('tabela')"><i class="fa-solid fa-table"></i>Abrir a tabela de valores</button></div></div>`;
  // por categoria
  const porCat = {}; lista.forEach(d => { const c = calcDesp(d), k = c.categoria; porCat[k] = porCat[k] || [0, 0]; porCat[k][d.cenario === 'Proposto' ? 1 : 0] += c.anual; });
  const cats = Object.keys(porCat).sort((a, b) => porCat[b][0] - porCat[a][0]);
  const maxC = Math.max(1, ...cats.map(k => Math.max(...porCat[k])));
  // por área ou setor
  const grupo = id => area ? id : areaDe.get(id);
  const porG = new Map(); lista.forEach(d => { const g = grupo(d.setorId) || '—', c = calcDesp(d); const o = porG.get(g) || [0, 0]; o[d.cenario === 'Proposto' ? 1 : 0] += c.anual; porG.set(g, o); });
  const gs = [...porG.entries()].sort((a, b) => b[1][0] - a[1][0]).slice(0, 12), maxG = Math.max(1, ...gs.map(g => Math.max(...g[1])));
  // quadro por item (DGA, bolsas...)
  const porItem = new Map();
  lista.forEach(d => { const c = calcDesp(d), k = d.rubricaId || '__' + (d.descricao || 'Valor próprio'); const o = porItem.get(k) || { r:c.r, nome:c.r.codigo || d.descricao || 'Valor próprio', cat:c.categoria, qa:0, qp:0, ma:0, mp:0 }; if (d.cenario === 'Proposto') { o.qp += c.qtd; o.mp += c.mensal; } else { o.qa += c.qtd; o.ma += c.mensal; } porItem.set(k, o); });
  const itens = [...porItem.values()].sort((a, b) => a.cat.localeCompare(b.cat) || String(a.nome).localeCompare(String(b.nome), 'pt-BR', { numeric:true }));
  const tot = itens.reduce((a, o) => ({ qa:a.qa + o.qa, qp:a.qp + o.qp, ma:a.ma + o.ma, mp:a.mp + o.mp }), { qa:0, qp:0, ma:0, mp:0 });
  const d0 = (a, b) => { const x = b - a; return x ? `<span class="${x > 0 ? 'fin-pos' : 'fin-neg'}">${x > 0 ? '+' : ''}${typeof a === 'number' && Math.abs(x) >= 100 ? fmtM0(x) : x.toLocaleString('pt-BR')}</span>` : '<span style="color:var(--mut2)">—</span>'; };
  return `<div class="kpis">
      ${kpi('#2563eb', 'fa-calendar-day', 'Custo mensal · atual', fmtM0(t.Atual.m), `${t.Atual.n} lançamento(s)`)}
      ${kpi('#0e7490', 'fa-calendar', 'Custo anual · atual', fmtM0(t.Atual.a), orc ? `${(t.Atual.a / orc * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}% do orçamento declarado` : 'sem orçamento declarado nos setores')}
      ${kpi('#7c3aed', 'fa-lightbulb', 'Custo anual · proposto', fmtM0(t.Proposto.a), `${t.Proposto.n} lançamento(s)`)}
      ${kpi(dif > 0 ? '#dc2626' : '#16a34a', dif > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', 'Diferença anual', (dif > 0 ? '+' : '') + fmtM0(dif), t.Atual.a ? `${(dif / t.Atual.a * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}% em relação ao atual` : 'proposto − atual')}
      ${kpi('#16a34a', 'fa-landmark', 'Orçamento declarado', fmtM0(orc), 'soma do campo orçamento dos setores')}
    </div>
    <div class="grade2">
      <div class="cartao bl"><h3><i class="fa-solid fa-layer-group"></i>Custo anual por tipo de despesa</h3><div class="fin-leg"><span><i></i>Atual</span><span><i class="p"></i>Proposto</span></div>
        ${cats.length ? barrasFin(cats.map(k => [k, (CATEG_FIN[k] || CATEG_FIN.Outro)[0], (CATEG_FIN[k] || CATEG_FIN.Outro)[1], porCat[k][0], porCat[k][1]]), maxC) : '<p class="s">Sem lançamentos.</p>'}</div>
      <div class="cartao bl"><h3><i class="fa-solid fa-sitemap"></i>Custo anual por ${area ? 'setor' : 'secretaria adjunta'}</h3><div class="fin-leg"><span><i></i>Atual</span><span><i class="p"></i>Proposto</span></div>
        ${gs.length ? barrasFin(gs.map(([g, v]) => [nomeCurto(porId.get(g)) || 'Sem setor', area ? corTipo((porId.get(g) || {}).tipo) : corArea(g), 'fa-building', v[0], v[1]]), maxG) : '<p class="s">Sem lançamentos.</p>'}</div>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-table-list"></i>Quadro por item (DGA, funções, bolsas e demais)</h3><p class="s">Quantidades e custo mensal com encargos, atual × proposto.</p>
      <div class="tab-wrap" style="margin-top:10px"><table class="tab"><thead><tr><th>Item</th><th>Tipo</th><th class="fin-num">Valor unitário</th><th class="fin-num">Qtd atual</th><th class="fin-num">Qtd proposta</th><th class="fin-num">Δ qtd</th><th class="fin-num">Mensal atual</th><th class="fin-num">Mensal proposto</th><th class="fin-num">Δ mensal</th></tr></thead>
      <tbody>${itens.map(o => `<tr><td><b>${esc(o.nome)}</b>${o.r && o.r.nome ? `<br><small style="color:var(--mut)">${esc(o.r.nome)}</small>` : ''}</td><td><span class="chip" style="--c:${(CATEG_FIN[o.cat] || CATEG_FIN.Outro)[0]}">${esc(o.cat)}</span></td><td class="fin-num">${o.r && o.r.id ? fmtM(o.r.valorMensal) : '—'}</td><td class="fin-num">${o.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${o.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${d0(o.qa, o.qp)}</td><td class="fin-num">${fmtM(o.ma)}</td><td class="fin-num">${fmtM(o.mp)}</td><td class="fin-num">${d0(o.ma, o.mp)}</td></tr>`).join('')}
      <tr class="fin-tot"><td colspan="3">Total</td><td class="fin-num">${tot.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${tot.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${d0(tot.qa, tot.qp)}</td><td class="fin-num">${fmtM(tot.ma)}</td><td class="fin-num">${fmtM(tot.mp)}</td><td class="fin-num">${d0(tot.ma, tot.mp)}</td></tr></tbody></table></div></div>`;
}
function finLancamentosCasca(){
  const cats = Object.keys(CATEG_FIN);
  return `<div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="fl-q" class="campo" placeholder="Buscar setor, item ou descrição" oninput="filtrarLancamentos()"></div>
      <select id="fl-cat" class="campo" onchange="filtrarLancamentos()"><option value="">Todos os tipos</option>${cats.map(c => `<option>${c}</option>`).join('')}</select>
      <select id="fl-cen" class="campo" onchange="filtrarLancamentos()"><option value="">Atual e proposto</option>${CENARIOS.map(c => `<option>${c}</option>`).join('')}</select>
    </div><div id="fl-lista"></div>`;
}
function lancamentosFiltrados(){
  const q = norm(($('#fl-q') || {}).value || ''), cat = ($('#fl-cat') || {}).value || '', cen = ($('#fl-cen') || {}).value || '';
  return despesasFiltradas($('#f-area').value).map(d => ({ d, c:calcDesp(d), s:porId.get(d.setorId) }))
    .filter(o => (!cat || o.c.categoria === cat) && (!cen || (o.d.cenario || 'Atual') === cen) && (!q || norm(((o.s || {}).nome || '') + ' ' + ((o.s || {}).sigla || '') + ' ' + (o.c.r.codigo || '') + ' ' + (o.c.r.nome || '') + ' ' + o.d.descricao).includes(q)))
    .sort((a, b) => ((a.s || {}).nome || '').localeCompare((b.s || {}).nome || '', 'pt-BR') || (a.d.cenario || '').localeCompare(b.d.cenario || ''));
}
function filtrarLancamentos(){
  const el = $('#fl-lista'); if (!el) return;
  const l = lancamentosFiltrados();
  if (!l.length) { el.innerHTML = `<div class="cartao vazio">Nenhum lançamento${DB.despesas.length ? ' com esses filtros' : ''}. <button class="btn btn-p btn-sm so-edit" style="margin-left:8px" onclick="formDespesa()"><i class="fa-solid fa-plus"></i>Novo lançamento</button></div>`; return; }
  const t = totaisFin(l.map(o => o.d));
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Setor</th><th>Item</th><th class="fin-num">Qtd</th><th class="fin-num">Unitário</th><th class="fin-num">Encargos</th><th class="fin-num">Mensal</th><th class="fin-num">Meses</th><th class="fin-num">Anual</th><th>Cenário</th><th></th></tr></thead><tbody>
    ${l.map(({ d, c, s }) => `<tr><td>${s ? `<a href="#" onclick="event.preventDefault();irPara(${arg(s.id)})"><b>${esc(nomeCurto(s))}</b></a><br><small style="color:var(--mut)">${esc(s.nome)}</small>` : '<span style="color:var(--perigo)">setor removido</span>'}</td>
      <td><span class="chip" style="--c:${(CATEG_FIN[c.categoria] || CATEG_FIN.Outro)[0]}">${esc(c.r.codigo || c.categoria)}</span>${d.descricao ? `<br><small>${esc(d.descricao)}</small>` : (c.r.nome ? `<br><small style="color:var(--mut)">${esc(c.r.nome)}</small>` : '')}</td>
      <td class="fin-num">${c.qtd.toLocaleString('pt-BR')}</td><td class="fin-num">${fmtM(c.unit)}${d.valorUnitario !== '' ? ' <small title="Valor próprio, diferente da tabela">*</small>' : ''}</td><td class="fin-num">${c.enc ? c.enc.toLocaleString('pt-BR') + '%' : '—'}</td>
      <td class="fin-num"><b>${fmtM(c.mensal)}</b></td><td class="fin-num">${c.meses.toLocaleString('pt-BR')}</td><td class="fin-num">${fmtM(c.anual)}</td>
      <td><span class="chip" style="--c:${d.cenario === 'Proposto' ? '#7c3aed' : '#2563eb'}">${esc(d.cenario || 'Atual')}</span></td>
      <td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" title="Editar" onclick="formDespesa(${arg(d.id)})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-s btn-sm btn-i" title="Copiar para o outro cenário" onclick="copiarCenario(${arg(d.id)})"><i class="fa-regular fa-copy"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirDespesa(${arg(d.id)})"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`).join('')}
    <tr class="fin-tot"><td colspan="5">Atual (${t.Atual.n})</td><td class="fin-num">${fmtM(t.Atual.m)}</td><td></td><td class="fin-num">${fmtM(t.Atual.a)}</td><td colspan="2"></td></tr>
    <tr class="fin-tot"><td colspan="5">Proposto (${t.Proposto.n})</td><td class="fin-num">${fmtM(t.Proposto.m)}</td><td></td><td class="fin-num">${fmtM(t.Proposto.a)}</td><td colspan="2"></td></tr>
  </tbody></table></div><p style="font-size:12px;color:var(--mut);margin-top:8px">Mensal = quantidade × valor unitário × (1 + encargos). Anual = mensal × meses. * valor próprio do lançamento, diferente da tabela.</p>`;
}
function opcoesSetores(sel){
  const ord = []; const visit = (s, d) => { ord.push([s, d]); filhosDe(s.id).forEach(k => visit(k, d + 1)); }; raizes().forEach(r => visit(r, 0));
  return ord.map(([s, d]) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${'  '.repeat(Math.min(d, 6))}${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)}</option>`).join('');
}
function opcoesRubricas(sel){
  const g = {}; DB.rubricas.filter(r => r.ativo !== 'Não' || r.id === sel).forEach(r => (g[r.categoria || 'Outro'] = g[r.categoria || 'Outro'] || []).push(r));
  return `<option value="">— Sem item da tabela (valor próprio) —</option>` + Object.keys(g).map(c => `<optgroup label="${esc(c)}">${g[c].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true })).map(r => `<option value="${esc(r.id)}" ${r.id === sel ? 'selected' : ''}>${esc(r.codigo || r.nome)} — ${esc(r.nome || '')} (${fmtM(r.valorMensal)})</option>`).join('')}</optgroup>`).join('');
}
function formDespesa(id, setorPadrao){
  if (somenteLeitura()) return toast('Seu perfil é somente leitura.', 'aviso');
  const d = DB.despesas.find(x => x.id === id) || novoReg('despesas', { setorId:setorPadrao || selId || '', quantidade:'1', cenario:'Atual' });
  const prev = m => {
    const o = { rubricaId:m.querySelector('#fd-rub').value, quantidade:m.querySelector('#fd-qtd').value, valorUnitario:m.querySelector('#fd-val').value, meses:m.querySelector('#fd-mes').value };
    const r = rubricaDe(o.rubricaId); m.querySelector('#fd-val').placeholder = r ? 'Tabela: ' + fmtM(r.valorMensal) : 'Valor mensal';
    m.querySelector('#fd-mes').placeholder = r && r.meses ? r.meses : '12';
    const c = calcDesp(o); m.querySelector('#fd-prev').innerHTML = `<div>Total mensal${c.enc ? ` (com ${c.enc.toLocaleString('pt-BR')}% de encargos)` : ''}<b>${fmtM(c.mensal)}</b></div><div>Total anual (${c.meses.toLocaleString('pt-BR')} meses)<b>${fmtM(c.anual)}</b></div>`;
  };
  abrirModal({ titulo: id ? 'Editar lançamento' : 'Novo lançamento', rotulo: id ? 'Salvar' : 'Lançar', largura:540,
    html:`<label><span class="rot">Setor</span><select id="fd-set" class="campo" required>${d.setorId ? '' : '<option value="">Escolha o setor</option>'}${opcoesSetores(d.setorId)}</select></label>
      <label><span class="rot">Item da tabela de valores</span><select id="fd-rub" class="campo">${opcoesRubricas(d.rubricaId)}</select></label>
      <label><span class="rot">Descrição <small>opcional</small></span><input id="fd-desc" class="campo" value="${esc(d.descricao)}" placeholder="ex.: Coordenador, bolsistas do programa X"></label>
      <div class="g2"><label><span class="rot">Quantidade</span><input id="fd-qtd" class="campo" type="number" min="0" step="any" value="${esc(d.quantidade)}"></label>
      <label><span class="rot">Valor unitário mensal <small>vazio = tabela</small></span><input id="fd-val" class="campo" type="number" min="0" step="0.01" value="${esc(d.valorUnitario)}"></label></div>
      <div class="g2"><label><span class="rot">Meses no ano <small>vazio = tabela</small></span><input id="fd-mes" class="campo" type="number" min="0" max="13.34" step="any" value="${esc(d.meses)}"></label>
      <label><span class="rot">Cenário</span><select id="fd-cen" class="campo">${CENARIOS.map(c => `<option ${c === (d.cenario || 'Atual') ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
      <label><span class="rot">Observação</span><input id="fd-obs" class="campo" value="${esc(d.observacao)}"></label>
      <div class="fin-prev" id="fd-prev"></div>`,
    aoConfirmar: async m => {
      const v = { setorId:m.querySelector('#fd-set').value, rubricaId:m.querySelector('#fd-rub').value, descricao:m.querySelector('#fd-desc').value.trim(), quantidade:m.querySelector('#fd-qtd').value, valorUnitario:m.querySelector('#fd-val').value, meses:m.querySelector('#fd-mes').value, cenario:m.querySelector('#fd-cen').value, observacao:m.querySelector('#fd-obs').value.trim() };
      if (!v.setorId) throw new Error('Escolha o setor.');
      if (!v.rubricaId && v.valorUnitario === '') throw new Error('Escolha um item da tabela ou informe o valor unitário.');
      if (!v.rubricaId && !v.descricao) throw new Error('Sem item da tabela, descreva a despesa.');
      Object.assign(d, v, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      if (!DB.despesas.includes(d)) { d.id = novoId('fd'); DB.despesas.push(d); }
      enfileirar('despesas', d);
      const c = calcDesp(d); registrar(d.setorId, `Financeiro: ${id ? 'alterou' : 'lançou'} ${c.r.codigo || d.descricao} × ${c.qtd.toLocaleString('pt-BR')} (${d.cenario}) = ${fmtM(c.mensal)}/mês`);
      return true;
    }
  }).then(ok => { if (ok) { toast('Lançamento salvo.'); posFinanceiro(); } });
  const m = document.querySelectorAll('.modal'); const mm = m[m.length - 1];
  mm.querySelectorAll('#fd-rub,#fd-qtd,#fd-val,#fd-mes').forEach(i => i.addEventListener('input', () => prev(mm))); prev(mm);
}
function posFinanceiro(){ salvarLocal(); if (vistaAtual === 'financeiro') renderFinanceiro(); if (selId && $('#painel').classList.contains('aberto')) renderPainel(); }
function copiarCenario(id){
  const d = DB.despesas.find(x => x.id === id); if (!d || somenteLeitura()) return;
  const n = novoReg('despesas', Object.assign({}, d, { id:novoId('fd'), cenario:d.cenario === 'Proposto' ? 'Atual' : 'Proposto', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }));
  DB.despesas.push(n); enfileirar('despesas', n); toast(`Copiado para o cenário ${n.cenario}.`); posFinanceiro();
}
async function excluirDespesa(id){
  const d = DB.despesas.find(x => x.id === id); if (!d || somenteLeitura()) return;
  if (!await confirmar('Excluir lançamento', 'Excluir este lançamento financeiro?', 'Excluir', true)) return;
  DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true);
  const c = calcDesp(d); registrar(d.setorId, `Financeiro: excluiu ${c.r.codigo || d.descricao} (${d.cenario})`);
  posFinanceiro();
}
/* Tabela de valores */
function finTabela(){
  const usos = id => DB.despesas.filter(d => d.rubricaId === id).length;
  const ro = somenteLeitura() ? 'disabled' : '';
  const lin = r => `<tr data-id="${esc(r.id)}" style="${r.ativo === 'Não' ? 'opacity:.55' : ''}">
    <td><input class="campo fin-edit" ${ro} value="${esc(r.codigo)}" onchange="alterarRubrica(${arg(r.id)},'codigo',this.value)" placeholder="DGA-1"></td>
    <td><input class="campo fin-edit" ${ro} value="${esc(r.nome)}" onchange="alterarRubrica(${arg(r.id)},'nome',this.value)" placeholder="Descrição"></td>
    <td><select class="campo fin-edit" ${ro} onchange="alterarRubrica(${arg(r.id)},'categoria',this.value)">${Object.keys(CATEG_FIN).map(c => `<option ${c === r.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.valorMensal)}" onchange="alterarRubrica(${arg(r.id)},'valorMensal',this.value)" placeholder="0,00"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.encargos)}" onchange="alterarRubrica(${arg(r.id)},'encargos',this.value)" placeholder="0" style="min-width:60px"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="13.34" step="any" value="${esc(r.meses)}" onchange="alterarRubrica(${arg(r.id)},'meses',this.value)" placeholder="12" style="min-width:60px"></td>
    <td class="fin-num">${usos(r.id)}</td>
    <td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" title="${r.ativo === 'Não' ? 'Reativar' : 'Desativar (some da lista de lançamento)'}" onclick="alterarRubrica(${arg(r.id)},'ativo','${r.ativo === 'Não' ? 'Sim' : 'Não'}');renderFinanceiro()"><i class="fa-solid ${r.ativo === 'Não' ? 'fa-eye' : 'fa-eye-slash'}"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirRubrica(${arg(r.id)})"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`;
  const ord = [...DB.rubricas].sort((a, b) => Object.keys(CATEG_FIN).indexOf(a.categoria) - Object.keys(CATEG_FIN).indexOf(b.categoria) || String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true }));
  return `<div class="cartao bl" style="margin-bottom:14px"><h3><i class="fa-solid fa-table"></i>Tabela de valores</h3>
      <p class="s">Valores mensais usados nos cálculos: símbolos DGA dos cargos em comissão, funções gratificadas, bolsas e demais itens. <b>Encargos</b> soma um percentual ao valor (ex.: contribuição patronal). <b>Meses por ano</b>: 12 por padrão; use 13,33 para incluir 13º e 1/3 de férias. Mudar um valor aqui atualiza todos os lançamentos que usam o item.</p>
      <div class="acoes so-edit"><button class="btn btn-p" onclick="novaRubrica()"><i class="fa-solid fa-plus"></i>Novo item</button>${DB.rubricas.length ? '' : '<button class="btn btn-s" onclick="modeloRubricas()"><i class="fa-solid fa-wand-magic-sparkles"></i>Criar modelo inicial (DGA, funções e bolsas)</button>'}</div></div>
    ${DB.rubricas.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th style="min-width:100px">Código</th><th style="min-width:200px">Descrição</th><th style="min-width:170px">Tipo</th><th class="fin-num" style="min-width:120px">Valor mensal (R$)</th><th class="fin-num">Encargos %</th><th class="fin-num">Meses/ano</th><th class="fin-num">Usos</th><th></th></tr></thead><tbody>${ord.map(lin).join('')}</tbody></table></div>` : '<div class="cartao vazio">Nenhum item cadastrado.</div>'}`;
}
function alterarRubrica(id, campo, valor){
  if (somenteLeitura()) return;
  const r = rubricaDe(id); if (!r || r[campo] === String(valor)) return;
  r[campo] = String(valor); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || '';
  enfileirar('rubricas', r); salvarLocal();
}
function novaRubrica(){
  if (somenteLeitura()) return;
  const r = novoReg('rubricas', { id:novoId('rb'), codigo:'', nome:'', categoria:'Cargo em comissão (DGA)', valorMensal:'', encargos:'', meses:'12', ativo:'Sim', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
  DB.rubricas.push(r); enfileirar('rubricas', r); renderFinanceiro();
  setTimeout(() => { const i = document.querySelector(`tr[data-id="${r.id}"] input`); if (i) i.focus(); }, 50);
}
async function excluirRubrica(id){
  const r = rubricaDe(id); if (!r || somenteLeitura()) return;
  const n = DB.despesas.filter(d => d.rubricaId === id).length;
  if (n) return toast(`Este item é usado em ${n} lançamento(s). Desative-o em vez de excluir.`, 'aviso');
  if (!await confirmar('Excluir item', `Excluir <b>${esc(r.codigo || r.nome || 'item')}</b> da tabela de valores?`, 'Excluir', true)) return;
  DB.rubricas = DB.rubricas.filter(x => x !== r); enfileirar('rubricas', r, true); salvarLocal(); renderFinanceiro();
}
function modeloRubricas(){
  if (somenteLeitura()) return;
  const base = [];
  for (let i = 1; i <= 6; i++) base.push(['DGA-' + i, 'Cargo em comissão – símbolo DGA-' + i, 'Cargo em comissão (DGA)']);
  base.push(['FG', 'Função gratificada', 'Função gratificada'], ['BOLSA', 'Bolsa (programa)', 'Bolsa'], ['EFETIVO', 'Servidor efetivo (média)', 'Pessoal efetivo'], ['DIÁRIA', 'Diária', 'Diárias e passagens']);
  base.forEach(([codigo, nome, categoria]) => { const r = novoReg('rubricas', { id:novoId('rb'), codigo, nome, categoria, valorMensal:'', encargos:'', meses:'12', ativo:'Sim', observacao:'Preencher com o valor vigente', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.rubricas.push(r); enfileirar('rubricas', r); });
  renderFinanceiro(); toast('Modelo criado. Preencha os valores mensais de cada item e ajuste os símbolos.');
}
/* Calculadora */
function finCalc(){
  if (!calcLinhas.length) calcLinhas = [{ rub:'', qtd:'1', meses:'' }];
  return `<div class="cartao bl"><h3><i class="fa-solid fa-calculator"></i>Calculadora rápida</h3><p class="s">Simule combinações (ex.: 3 × DGA-2 + 10 bolsas) sem gravar nada. Se quiser, lance o resultado num setor.</p>
    <div id="calc-ls" style="margin-top:12px"></div>
    <div class="acoes" style="justify-content:space-between;flex-wrap:wrap"><button class="btn btn-s" onclick="calcLinhas.push({rub:'',qtd:'1',meses:''});desenharCalc()"><i class="fa-solid fa-plus"></i>Adicionar linha</button><div class="fin-prev" id="calc-tot" style="flex:1;max-width:420px"></div></div>
    <div class="acoes so-edit" style="margin-top:12px;flex-wrap:wrap"><select id="calc-set" class="campo" style="width:auto;max-width:100%"><option value="">Lançar em qual setor?</option>${opcoesSetores(selId)}</select><select id="calc-cen" class="campo" style="width:auto">${CENARIOS.map(c => `<option>${c}</option>`).join('')}</select><button class="btn btn-p" onclick="lancarCalc()"><i class="fa-solid fa-file-import"></i>Lançar no setor</button></div></div>`;
}
function desenharCalc(){
  const el = $('#calc-ls'); if (!el) return;
  el.innerHTML = calcLinhas.map((l, i) => { const c = calcDesp({ rubricaId:l.rub, quantidade:l.qtd, valorUnitario:'', meses:l.meses }); return `<div class="calc-l"><select class="campo" onchange="calcLinhas[${i}].rub=this.value;desenharCalc()">${opcoesRubricas(l.rub).replace('— Sem item da tabela (valor próprio) —', 'Escolha um item')}</select><input class="campo" type="number" min="0" step="any" value="${esc(l.qtd)}" title="Quantidade" oninput="calcLinhas[${i}].qtd=this.value;desenharCalcTot(this,${i})"><input class="campo" type="number" min="0" step="any" value="${esc(l.meses)}" placeholder="${c.meses}" title="Meses" oninput="calcLinhas[${i}].meses=this.value;desenharCalcTot(this,${i})"><span class="v" data-i="${i}">${fmtM(c.mensal)}/mês</span><button class="btn btn-s btn-i" title="Remover" onclick="calcLinhas.splice(${i},1);desenharCalc()"><i class="fa-solid fa-xmark"></i></button></div>`; }).join('');
  desenharCalcTot();
}
function desenharCalcTot(){
  let m = 0, a = 0; calcLinhas.forEach((l, i) => { const c = calcDesp({ rubricaId:l.rub, quantidade:l.qtd, valorUnitario:'', meses:l.meses }); m += c.mensal; a += c.anual; const v = document.querySelector(`.calc-l .v[data-i="${i}"]`); if (v) v.textContent = fmtM(c.mensal) + '/mês'; });
  const t = $('#calc-tot'); if (t) t.innerHTML = `<div>Total mensal<b>${fmtM(m)}</b></div><div>Total anual<b>${fmtM(a)}</b></div>`;
}
function lancarCalc(){
  if (somenteLeitura()) return;
  const sid = $('#calc-set').value, cen = $('#calc-cen').value; if (!sid) return toast('Escolha o setor.', 'aviso');
  const ok = calcLinhas.filter(l => l.rub && numBR(l.qtd)); if (!ok.length) return toast('Nenhuma linha com item e quantidade.', 'aviso');
  ok.forEach(l => { const d = novoReg('despesas', { id:novoId('fd'), setorId:sid, rubricaId:l.rub, quantidade:l.qtd, meses:l.meses, cenario:cen, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); });
  registrar(sid, `Financeiro: ${ok.length} lançamento(s) pela calculadora (${cen})`);
  toast(`${ok.length} lançamento(s) feitos em ${nomeCurto(porId.get(sid))}.`); calcLinhas = []; abaFin('lancamentos');
}
function exportarFinanceiro(){
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const l = DB.despesas.map(d => ({ d, c:calcDesp(d), s:porId.get(d.setorId) }));
  const csv = '﻿' + ['Setor;Sigla;Área;Item;Tipo;Descrição;Quantidade;Valor unitário;Encargos %;Mensal;Meses;Anual;Cenário;Observação', ...l.map(({ d, c, s }) => [s ? s.nome : '(removido)', s ? s.sigla : '', nomeCurto(porId.get(areaDe.get(d.setorId))), c.r.codigo || '', c.categoria, d.descricao, c.qtd, n(c.unit), c.enc, n(c.mensal), c.meses, n(c.anual), d.cenario || 'Atual', d.observacao].map(q).join(';'))].join('\r\n');
  baixarArquivo('gaborg-financeiro-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
}
/* Bloco financeiro no painel do setor (aba Valores) */
function blocoFinSetor(s){
  const p = custoSetorFin(s.id, false), t = custoSetorFin(s.id, true), lst = DB.despesas.filter(d => d.setorId === s.id);
  const temSub = descendentes(s.id).size > 0;
  return `<div class="sec-t" style="margin-top:18px"><i class="fa-solid fa-sack-dollar"></i>Financeiro (lançamentos)</div>
    <div class="fin-prev"><div>Mensal atual<b>${fmtM0(p.Atual.m)}</b></div><div>Mensal proposto<b>${fmtM0(p.Proposto.m)}</b></div>${temSub ? `<div>Com subordinados · atual<b>${fmtM0(t.Atual.m)}</b></div><div>Com subordinados · proposto<b>${fmtM0(t.Proposto.m)}</b></div>` : ''}</div>
    ${lst.length ? `<div class="tab-wrap" style="margin-top:10px"><table class="tab"><tbody>${lst.map(d => { const c = calcDesp(d); return `<tr><td><b>${esc(c.r.codigo || d.descricao || c.categoria)}</b> × ${c.qtd.toLocaleString('pt-BR')}<br><small style="color:var(--mut)">${esc(d.cenario || 'Atual')}</small></td><td class="fin-num">${fmtM(c.mensal)}/mês</td><td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" onclick="formDespesa(${arg(d.id)})" title="Editar"><i class="fa-solid fa-pen"></i></button></div></td></tr>`; }).join('')}</tbody></table></div>` : '<p style="font-size:12.5px;color:var(--mut)">Nenhum lançamento financeiro neste setor.</p>'}
    <div class="acoes" style="margin-top:10px"><button class="btn btn-p btn-sm so-edit" onclick="formDespesa('', ${arg(s.id)})"><i class="fa-solid fa-plus"></i>Lançamento</button><button class="btn btn-s btn-sm" onclick="trocarVista('financeiro');abaFin('lancamentos');setTimeout(()=>{const q=$('#fl-q');if(q){q.value=${arg(s.sigla || s.nome)};filtrarLancamentos()}},50)"><i class="fa-solid fa-arrow-up-right-from-square"></i>Abrir no Financeiro</button></div>`;
}

/* ===================== MENU LATERAL: RECOLHER E AJUSTAR LARGURA ===================== */
let ladoCfg = Object.assign({ mini:false, w:236 }, store.get('gaborg_lado', {}));
function aplicarLado(){
  const larga = window.innerWidth > 820;
  document.body.classList.toggle('lado-mini', larga && ladoCfg.mini);
  document.documentElement.style.setProperty('--lado-w', Math.max(180, Math.min(340, ladoCfg.w)) + 'px');
  const tg = document.querySelector('.lado-tg'); if (tg) tg.title = ladoCfg.mini ? 'Expandir o menu (tecla [ )' : 'Recolher o menu (tecla [ )';
  setTimeout(() => { if (vistaAtual === 'mapa') desenharMini(); }, 260);
}
function alternarLado(forcar){ ladoCfg.mini = forcar !== undefined ? forcar : !ladoCfg.mini; store.set('gaborg_lado', ladoCfg); aplicarLado(); }
(function(){
  const alca = document.querySelector('.lado-alca'), lado = document.querySelector('.lado'); if (!alca) return;
  let ini = null;
  alca.addEventListener('pointerdown', e => { ini = { x:e.clientX, w:lado.getBoundingClientRect().width }; alca.setPointerCapture(e.pointerId); alca.classList.add('on'); lado.classList.add('redim'); e.preventDefault(); });
  alca.addEventListener('pointermove', e => {
    if (!ini) return; const w = ini.w + e.clientX - ini.x;
    if (w < 130) { if (!ladoCfg.mini) { ladoCfg.mini = true; aplicarLado(); } return; }
    if (ladoCfg.mini) { ladoCfg.mini = false; aplicarLado(); }
    ladoCfg.w = Math.max(180, Math.min(340, w)); document.documentElement.style.setProperty('--lado-w', ladoCfg.w + 'px');
  });
  const fim = () => { if (!ini) return; ini = null; alca.classList.remove('on'); lado.classList.remove('redim'); store.set('gaborg_lado', ladoCfg); aplicarLado(); };
  alca.addEventListener('pointerup', fim); alca.addEventListener('pointercancel', fim);
  alca.addEventListener('dblclick', () => { ladoCfg.w = 236; alternarLado(false); });
})();
window.addEventListener('resize', aplicarLado);
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select,[contenteditable]') || document.querySelector('.modal') || !$('#tv-modo').classList.contains('hidden')) return;
  if (e.key === '[' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); alternarLado(); }
});
aplicarLado();

/* ===================== MODO TV ===================== */
const tv = { slides:[], i:0, timer:null, prog:null, relogio:null, pausado:false, inicio:0, seg:Number(store.get('gaborg_tv_seg', 20)), ocioso:null, voltas:0 };
function tvSlides(){
  const L = [['visao', 'Visão geral'], ['mapa', 'Mapa da estrutura'], ['areas', 'Estrutura por área']];
  if (DB.despesas.length) L.push(['fin', 'Financeiro']);
  L.push(['val', 'Validações e impacto']);
  return L;
}
function abrirModoTV(){
  if (vistaAtual !== 'mapa') { const v = vistaAtual; vistaAtual = 'mapa'; calcularLayout(); vistaAtual = v; } else calcularLayout();
  tv.slides = tvSlides(); tv.i = 0; tv.pausado = false; tv.voltas = 0;
  $('#tv-seg').value = String(tv.seg);
  const el = $('#tv-modo'); el.classList.remove('hidden'); el.focus();
  if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  tvRelogio(); clearInterval(tv.relogio); tv.relogio = setInterval(tvRelogio, 1000);
  tvMostrar(0);
}
function fecharModoTV(){
  clearTimeout(tv.timer); cancelAnimationFrame(tv.prog); clearInterval(tv.relogio);
  $('#tv-modo').classList.add('hidden'); $('#tv-palco').innerHTML = '';
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  if (vistaAtual === 'mapa') desenharMapa();
}
function tvTelaCheia(){ if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); }
function tvRelogio(){ const d = new Date(); $('#tv-relogio').textContent = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }); $('#tv-data').textContent = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' }); }
function tvTempo(v){ tv.seg = Number(v); store.set('gaborg_tv_seg', tv.seg); tvAgendar(); }
function tvPausar(forcar){ tv.pausado = forcar !== undefined ? forcar : !tv.pausado; $('#tv-btn-pausa').innerHTML = `<i class="fa-solid ${tv.pausado ? 'fa-play' : 'fa-pause'}"></i>`; tvAgendar(); }
function tvPasso(d){ tvMostrar((tv.i + d + tv.slides.length) % tv.slides.length); }
async function tvMostrar(i){
  if (i === 0 && tv.voltas++ > 0 && online()) { try { await lerNuvem(); calcularLayout(); tv.slides = tvSlides(); } catch (e) {} }
  tv.i = Math.min(i, tv.slides.length - 1);
  const [k, t] = tv.slides[tv.i];
  $('#tv-titulo-slide').textContent = t + ' · ' + (tv.i + 1) + '/' + tv.slides.length;
  $('#tv-pontos').innerHTML = tv.slides.map((s, j) => `<button class="${j === tv.i ? 'on' : ''}" title="${esc(s[1])}" onclick="tvMostrar(${j})"></button>`).join('');
  $('#tv-palco').innerHTML = `<div class="tv-slide">${TV_SLIDE[k]()}</div>`;
  if (k === 'mapa') tvMontarMapa();
  tvAgendar();
}
function tvAgendar(){
  clearTimeout(tv.timer); cancelAnimationFrame(tv.prog);
  const bar = $('#tv-barra'); bar.style.width = '0';
  if (tv.pausado || !tv.seg) return;
  tv.inicio = performance.now(); const dur = tv.seg * 1000;
  const anima = () => { const p = Math.min(1, (performance.now() - tv.inicio) / dur); bar.style.width = (p * 100) + '%'; if (p < 1) tv.prog = requestAnimationFrame(anima); };
  anima(); tv.timer = setTimeout(() => tvPasso(1), dur);
}
const tvKpi = (c, l, v, s, m) => `<div class="tv-kpi" style="--c:${c}"><div class="l">${l}</div><div class="v ${m ? 'm' : ''}">${v}</div><div class="s">${s}</div></div>`;
const TV_SLIDE = {
  visao(){
    const at = DB.setores.filter(s => s.status !== 'Extinto'), soma = k => at.reduce((a, s) => a + num(s[k]), 0);
    const pend = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').length, f = totaisFin(DB.despesas);
    return `<div class="tv-h" style="--c:#60a5fa"><i class="fa-solid fa-building-columns"></i>Secretaria de Estado de Educação<small>Decreto nº 2.236/2026</small></div>
      <div class="tv-kpis">${tvKpi('#3b82f6', 'Setores ativos', at.length.toLocaleString('pt-BR'), `${areas.length} áreas`)}${tvKpi('#22c55e', 'Servidores', soma('servidores').toLocaleString('pt-BR'), `${soma('comissionados').toLocaleString('pt-BR')} comissionados`)}${tvKpi('#a855f7', 'Custo mensal', fmtRc(f.Atual.m), f.Proposto.m ? `proposto ${fmtRc(f.Proposto.m)}` : 'lançamentos atuais', true)}${tvKpi('#f59e0b', 'Validações pendentes', pend, `${DB.validacoes.length} no total`)}${tvKpi('#ef4444', 'Sem responsável', at.filter(s => !s.responsavel && filhosDe(s.id).length).length, 'chefias a definir')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Setores por tipo</h4>${tvBarras(Object.entries(at.reduce((a, s) => (a[s.tipo] = (a[s.tipo] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => [t, n, corTipo(t), n]))}</div>
      <div class="tv-caixa"><h4>Maiores áreas (setores)</h4>${tvBarras(areas.map(a => [nomeCurto(porId.get(a)), DB.setores.filter(s => areaDe.get(s.id) === a && s.status !== 'Extinto').length, corArea(a)]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => [x[0], x[1], x[2], x[1]]))}</div></div>`;
  },
  mapa(){ return `<div class="tv-h" style="--c:#22d3ee"><i class="fa-solid fa-diagram-project"></i>Mapa da estrutura<small>${visiveis.length} setores visíveis</small></div><div class="tv-mapa" id="tv-mapa"><div class="mundo-tv" id="tv-mundo"></div><span class="tv-dica"><i class="fa-solid fa-hand"></i> arraste para mover · roda ou pinça para zoom · duplo clique centraliza</span></div>`; },
  areas(){
    const f = new Map(); DB.despesas.filter(d => d.cenario !== 'Proposto').forEach(d => { const a = areaDe.get(d.setorId); f.set(a, (f.get(a) || 0) + calcDesp(d).mensal); });
    return `<div class="tv-h" style="--c:#a78bfa"><i class="fa-solid fa-sitemap"></i>Estrutura por área<small>${areas.length} unidades ligadas ao Gabinete</small></div>
      <div class="tv-grade">${(() => {
        const grandes = areas.filter(a => DB.setores.filter(x => areaDe.get(x.id) === a).length > 1), unicas = areas.filter(a => !grandes.includes(a));
        const card = (cor, tit, sub, lst, fm) => `<div class="tv-area" style="--c:${cor}"><b>${esc(tit)}</b><small>${esc(sub)}</small><div class="nums"><span><b>${lst.length}</b>setores</span><span><b>${lst.reduce((t, x) => t + num(x.servidores), 0).toLocaleString('pt-BR')}</b>servidores</span>${fm ? `<span><b>${fmtRc(fm)}</b>por mês</span>` : ''}</div></div>`;
        const ativos = a => DB.setores.filter(x => areaDe.get(x.id) === a && x.status !== 'Extinto');
        return grandes.sort((x, y) => ativos(y).length - ativos(x).length).map(a => card(corArea(a), nomeCurto(porId.get(a)), (porId.get(a) || {}).nome || '', ativos(a), f.get(a))).join('')
          + (unicas.length ? card('#94a3b8', 'Unidades do Gabinete', unicas.map(a => nomeCurto(porId.get(a))).join(' · '), unicas.flatMap(ativos), unicas.reduce((t, a) => t + (f.get(a) || 0), 0)) : '');
      })()}</div>`;
  },
  fin(){
    const t = totaisFin(DB.despesas), dif = t.Proposto.a - t.Atual.a;
    const porCat = {}; DB.despesas.forEach(d => { if (d.cenario === 'Proposto') return; const c = calcDesp(d); porCat[c.categoria] = (porCat[c.categoria] || 0) + c.anual; });
    const porSet = new Map(); DB.despesas.forEach(d => { if (d.cenario === 'Proposto') return; porSet.set(d.setorId, (porSet.get(d.setorId) || 0) + calcDesp(d).mensal); });
    return `<div class="tv-h" style="--c:#4ade80"><i class="fa-solid fa-sack-dollar"></i>Financeiro<small>valores com encargos</small></div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${tvKpi('#3b82f6', 'Mensal · atual', fmtRc(t.Atual.m), `${t.Atual.n} lançamentos`, true)}${tvKpi('#06b6d4', 'Anual · atual', fmtRc(t.Atual.a), '', true)}${tvKpi('#a855f7', 'Anual · proposto', fmtRc(t.Proposto.a), `${t.Proposto.n} lançamentos`, true)}${tvKpi(dif > 0 ? '#ef4444' : '#22c55e', 'Diferença anual', (dif > 0 ? '+' : '') + fmtRc(Math.abs(dif)).replace('R$', dif < 0 ? '−R$' : 'R$'), 'proposto − atual', true)}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Custo anual por tipo (atual)</h4>${tvBarras(Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, (CATEG_FIN[k] || CATEG_FIN.Outro)[0], fmtRc(v)]))}</div>
      <div class="tv-caixa"><h4>Setores com maior custo mensal</h4><div class="tv-lista">${[...porSet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([id, v]) => `<div><span>${esc(nomeCurto(porId.get(id)))} · ${esc((porId.get(id) || {}).nome || '')}</span><b>${fmtRc(v)}</b></div>`).join('')}</div></div></div>`;
  },
  val(){
    const cont = {}; DB.validacoes.forEach(v => cont[v.status || 'Pendente'] = (cont[v.status || 'Pendente'] || 0) + 1);
    const pend = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').slice(0, 7);
    const alto = DB.setores.filter(s => num(s.impacto) >= 4 && s.status !== 'Extinto').sort((a, b) => num(b.impacto) - num(a.impacto)).slice(0, 7);
    return `<div class="tv-h" style="--c:#fbbf24"><i class="fa-solid fa-stamp"></i>Validações e impacto</div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${['Pendente', 'Aprovado', 'Aprovado com ressalvas', 'Reprovado'].map(k => tvKpi(STATUS_VAL[k] || '#64748b', k, cont[k] || 0, 'validações', false)).join('')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Aguardando validação</h4><div class="tv-lista">${pend.length ? pend.map(v => `<div><span>${esc(nomeCurto(porId.get(v.setorId)))} → ${esc(nomeCurto(porId.get(v.validadorId)))}</span><b>${v.solicitadoEm ? new Date(v.solicitadoEm).toLocaleDateString('pt-BR') : ''}</b></div>`).join('') : '<div><span>Nenhuma pendência</span><b>✓</b></div>'}</div></div>
      <div class="tv-caixa"><h4>Setores de impacto alto ou crítico</h4><div class="tv-lista">${alto.length ? alto.map(s => `<div><span>${esc(nomeCurto(s))} · ${esc(s.nome)}</span><b style="color:${IMPACTO[num(s.impacto)][1]}">${IMPACTO[num(s.impacto)][0]}</b></div>`).join('') : '<div><span>Nenhum setor avaliado com impacto alto</span><b>—</b></div>'}</div></div></div>`;
  }
};
function tvBarras(itens){ const max = Math.max(1, ...itens.map(x => x[1])); return itens.map(([n, v, c, rot]) => `<div class="tv-bar" style="--c:${c}"><span class="n">${esc(n)}</span><span class="t"><span style="width:${v / max * 100}%"></span></span><span class="v">${rot ?? v}</span></div>`).join(''); }
function tvMontarMapa(){
  const cx = $('#tv-mapa'), mundo = $('#tv-mundo'); if (!cx) return;
  const L = limites();
  let ar = ''; visiveis.forEach(s => filhosVis(s.id).forEach(k => { if (pos.has(k.id)) ar += `<path d="${caminhoAresta(s, k)}"/>`; }));
  mundo.innerHTML = `<svg style="position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible">${ar}</svg>` + visiveis.map(cardHTML).join('').replace(/ sel /g, ' ').replace(/ msel /g, ' ');
  const r = cx.getBoundingClientRect();
  const fit = () => { const k = Math.min((r.width - 40) / (L.x1 - L.x0), (r.height - 40) / (L.y1 - L.y0), 1.2); return { k, x:(r.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:(r.height - (L.y1 - L.y0) * k) / 2 - L.y0 * k }; };
  let v = fit(); const ap = () => { mundo.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`; }; ap();
  let arr = null;
  cx.addEventListener('pointerdown', e => { arr = { x:e.clientX, y:e.clientY, vx:v.x, vy:v.y }; cx.setPointerCapture(e.pointerId); cx.classList.add('pan'); tvPausar(true); });
  cx.addEventListener('pointermove', e => { if (!arr) return; v.x = arr.vx + e.clientX - arr.x; v.y = arr.vy + e.clientY - arr.y; ap(); });
  const solta = () => { arr = null; cx.classList.remove('pan'); }; cx.addEventListener('pointerup', solta); cx.addEventListener('pointercancel', solta);
  cx.addEventListener('wheel', e => { e.preventDefault(); tvPausar(true); const b = cx.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top, k = Math.max(.08, Math.min(3, v.k * Math.exp(-e.deltaY * .0015))), q = k / v.k; v = { k, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; ap(); }, { passive:false });
  cx.addEventListener('dblclick', () => { v = fit(); ap(); });
  tv.moverMapa = (dx, dy, z) => { if (z) { const b = cx.getBoundingClientRect(), mx = b.width / 2, my = b.height / 2, k = Math.max(.08, Math.min(3, v.k * z)), q = k / v.k; v = { k, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; } else { v.x += dx; v.y += dy; } ap(); };
}
document.addEventListener('keydown', e => {
  if ($('#tv-modo').classList.contains('hidden')) return;
  const noMapa = tv.slides[tv.i] && tv.slides[tv.i][0] === 'mapa' && tv.pausado && tv.moverMapa;
  if (e.key === 'Escape') { e.preventDefault(); fecharModoTV(); }
  else if (noMapa && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)) { e.preventDefault(); const p = 60; ({ ArrowLeft:() => tv.moverMapa(p, 0), ArrowRight:() => tv.moverMapa(-p, 0), ArrowUp:() => tv.moverMapa(0, p), ArrowDown:() => tv.moverMapa(0, -p), '+':() => tv.moverMapa(0, 0, 1.2), '=':() => tv.moverMapa(0, 0, 1.2), '-':() => tv.moverMapa(0, 0, 1 / 1.2) })[e.key](); }
  else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); tvPasso(1); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); tvPasso(-1); }
  else if (e.key === ' ') { e.preventDefault(); tvPausar(); }
  else if (e.key.toLowerCase() === 'f') tvTelaCheia();
  e.stopImmediatePropagation();
}, true);
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !$('#tv-modo').classList.contains('hidden')) { /* continua em tela normal */ } });
$('#tv-modo').addEventListener('pointermove', () => { const el = $('#tv-modo'); el.classList.remove('ocioso'); clearTimeout(tv.ocioso); tv.ocioso = setTimeout(() => el.classList.add('ocioso'), 3000); });

/* ===================== MENU DO USUÁRIO ===================== */
function menuUsuario(){
  const sync = $('#sync') ? $('#sync').outerHTML : '';
  const m = document.createElement('div'); m.className = 'modal';
  const escuro = document.documentElement.dataset.tema === 'escuro';
  m.innerHTML = `<div class="cx" role="dialog" aria-modal="true" style="max-width:380px"><div class="menu-u">
    <div class="cab"><span class="av">${esc(iniciais(cfg.usuario || cfg.login))}</span><div style="min-width:0"><b>${esc(cfg.usuario || cfg.login || 'Usuário')}</b><small>${esc(cfg.login || '')} · ${esc(cfg.perfil || '')}</small>${sync}</div></div>
    ${appInstalavel() ? '<button class="it" data-a="instalar"><i class="fa-solid fa-download"></i>Instalar o GABOrg como app</button>' : ''}
    <button class="it" data-a="tv"><i class="fa-solid fa-tv"></i>Modo TV (apresentação)</button>
    <button class="it" data-a="tema"><i class="fa-solid fa-circle-half-stroke"></i>${escuro ? 'Tema claro' : 'Tema escuro'}</button>
    <button class="it" data-a="senha"><i class="fa-solid fa-key"></i>Alterar minha senha</button>
    <button class="it" data-a="config"><i class="fa-solid fa-gear"></i>Configurações</button>
    <button class="it perigo" data-a="sair"><i class="fa-solid fa-power-off"></i>Sair</button>
    <button class="it" data-a="fechar" style="justify-content:center;color:var(--mut)">Fechar</button>
  </div></div>`;
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b && e.target !== m) return;
    m.remove(); const a = b && b.dataset.a;
    if (a === 'instalar') instalarApp();
    if (a === 'tv') abrirModoTV();
    if (a === 'tema') alternarTema();
    if (a === 'senha') modalTrocarSenha(false);
    if (a === 'config') trocarVista('config');
    if (a === 'sair') sair();
  });
  document.body.appendChild(m);
}

/* ===================== APP INSTALÁVEL (PWA) ===================== */
let pedidoInstalacao = null;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const rodandoComoApp = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const appInstalavel = () => !rodandoComoApp() && (!!pedidoInstalacao || (ehIOS() && location.protocol === 'https:'));
function atualizarInstalavel(){ document.body.classList.toggle('pode-instalar', appInstalavel()); }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalacao = e; atualizarInstalavel(); });
window.addEventListener('appinstalled', () => { pedidoInstalacao = null; atualizarInstalavel(); toast('GABOrg instalado. Abra pelo ícone na tela inicial.'); });
async function instalarApp(){
  if (pedidoInstalacao) {
    pedidoInstalacao.prompt();
    try { await pedidoInstalacao.userChoice; } catch (e) {}
    pedidoInstalacao = null; atualizarInstalavel(); return;
  }
  if (ehIOS()) return abrirModal({ titulo:'Instalar no iPhone ou iPad', rotulo:'Entendi', semCancelar:true,
    html:`<p>No <b>Safari</b>:</p><ol style="margin:0;padding-left:20px;font-size:13.5px;line-height:1.9;color:var(--txt2)"><li>Toque em <b>Compartilhar</b> <i class="fa-solid fa-arrow-up-from-bracket"></i> na barra do navegador.</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Confirme em <b>Adicionar</b>. O GABOrg abre em tela cheia, como um app.</li></ol>` });
  toast('Use o menu do navegador › "Instalar app" ou "Adicionar à tela inicial".');
}
// Sem service worker: o app é só index.html + arquivo.js. Remove o de versões anteriores (sw.js), se houver.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
atualizarInstalavel();

(async function iniciar(){
  $('#lg-login').value = cfg.login || ''; $('#lg-url').value = cfg.url || URL_PADRAO;
  $('#lg-lembrar').checked = sessao.lembrado();
  if (!cfg.token || !cfg.url || cfg.modo !== 'nuvem') return mostrarLogin();
  const d = store.get('gaborg_db', null);
  if (d && Array.isArray(d.setores) && d.setores.length) { DB = d; TABS_DB.forEach(t => DB[t] = (DB[t] || []).map(x => novoReg(t, x))); abrirApp(); }
  try {
    const me = await chamar({ action:'me' }, 30000);
    if (me.status !== 'success') { if (me.code !== 'AUTH') throw new Error(me.message); return; }
    aplicarUsuario(me.usuario);
    if (me.usuario.trocarSenha === 'Sim') { const ok = await modalTrocarSenha(true); if (!ok) return; }
    await carregarNuvem();
    if (!$('#app').classList.contains('hidden')) redesenharTudo(); else abrirApp();
    statusSync();
  } catch (e) {
    ultimoErro = e.message; statusSync();
    if ($('#app').classList.contains('hidden')) mostrarLogin(e.message);
  }
})();
