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
const VERSAO = '1.9.0';
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
  setores: ['id','nome','sigla','tipo','paiId','ordem','status','responsavel','contato','competencias','entregas','orcamento','custoMensal','servidores','comissionados','impacto','impactoDescricao','positivos','negativos','layout','colunas','dx','dy','atualizadoEm','atualizadoPor','quantidade'],
  validacoes: ['id','setorId','validadorId','status','parecer','solicitadoEm','solicitadoPor','respondidoEm','respondidoPor'],
  vinculos: ['id','origemId','destinoId','tipo','descricao'],
  historico: ['id','setorId','data','usuario','acao'],
  rubricas: ['id','codigo','nome','categoria','valorMensal','encargos','meses','observacao','ativo','atualizadoEm','atualizadoPor','percEfetivo','fonte'],
  despesas: ['id','setorId','rubricaId','descricao','quantidade','valorUnitario','meses','cenario','observacao','atualizadoEm','atualizadoPor','vinculo'],
  propostas: ['id','nome','descricao','status','itens','criadoEm','criadoPor','atualizadoEm','atualizadoPor']
};
const TABS_DB = ['setores','validacoes','vinculos','historico','rubricas','despesas','propostas'];

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
const ESCOLAS_PADRAO = '631';
const rotuloUnid = s => s.tipo === 'Unidades Escolares' ? 'escolas' : 'unidades';
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
  L.forEach(s => { if (s.tipo === 'Unidades Escolares' && !s.quantidade) s.quantidade = ESCOLAS_PADRAO; });
  return { setores:L, vinculos:V, validacoes:[], historico:[], rubricas:[], despesas:[], propostas:[] };
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
let DB = { setores:[], validacoes:[], vinculos:[], historico:[], rubricas:[], despesas:[], propostas:[] };
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
const ROTULOS = { quantidade:'Unidades representadas', nome:'Nome', sigla:'Sigla', tipo:'Tipo', paiId:'Setor superior', status:'Situação', responsavel:'Responsável', contato:'Contato', competencias:'Competências', entregas:'Entregas', orcamento:'Orçamento anual', custoMensal:'Custo mensal', servidores:'Servidores', comissionados:'Cargos comissionados', impacto:'Impacto', impactoDescricao:'Descrição do impacto', positivos:'Pontos positivos', negativos:'Pontos negativos', layout:'Disposição dos subordinados', colunas:'Colunas', ordem:'Ordem' };
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
  const mk = s._marcas && s._marcas.length ? [...new Set(s._marcas)] : [], qt = num(s.quantidade);
  return `<div class="no ${qt ? 'grupo' : ''} ${estilo} ${s.status === 'Extinto' ? 'extinto' : ''} ${modos.get(s.id) === 'v' ? 'v-mode' : ''} ${s.id === selId ? 'sel' : ''} ${multi.has(s.id) ? 'msel' : ''} ${mk.length ? 'cen-m cen-' + mk[0] : ''}" data-id="${esc(s.id)}" style="--c:${corDe(s)};transform:translate(${p.x}px,${p.y}px)" title="${esc(s.nome)}">
    <div class="no-tipo"><i class="fa-solid ${icTipo(s.tipo)}"></i>${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</div>
    <div class="no-nome">${esc(s.nome)}</div>
    ${qt ? `<span class="no-qt" title="${fmtN(qt)} ${rotuloUnid(s)} representadas neste cartão"><b>${fmtN(qt)}</b>${rotuloUnid(s)}</span>` : ''}
    <div class="no-pe"><span class="r">${qt ? '' : s.responsavel ? '<i class="fa-solid fa-user"></i> ' + esc(s.responsavel) : 'Sem responsável'}</span>${ser ? `<span><i class="fa-solid fa-users"></i> ${fmtN(ser)}</span>` : ''}${imp ? `<span class="p" style="background:${IMPACTO[imp][1]}" title="Impacto: ${IMPACTO[imp][0]}"></span>` : ''}${sv !== 'Sem validação' ? `<span class="p" style="background:${STATUS_VAL[sv]};border-radius:2px" title="Validação: ${sv}"></span>` : ''}</div>
    ${mk.length ? `<span class="cen-tags">${marcasHTML(s)}</span>` : ''}
    ${n ? `<button class="no-exp ${ab ? 'aberto' : ''}" data-exp title="${ab ? 'Recolher' : 'Mostrar'} ${n} subordinado(s)">${ab ? '<i class="fa-solid fa-minus"></i>' : n}</button>` : ''}
  </div>`;
}
function desenharMapa(){
  if (vistaAtual !== 'mapa') return;
  preencherCenarios();
  if (cenMapa) return emCenario(desenharMapaBase);
  desenharMapaBase();
}
function desenharMapaBase(){
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
  if (cenMapa && !desenharArestas.dentro) { desenharArestas.dentro = true; try { return emCenario(desenharArestas); } finally { desenharArestas.dentro = false; } }
  const ativos = new Set(selId ? [selId, ...caminho(selId).map(s => s.id)] : []);
  let h = '';
  visiveis.forEach(s => { filhosVis(s.id).forEach(k => { if (pos.has(k.id)) h += `<path d="${caminhoAresta(s, k)}" class="${ativos.has(k.id) ? 'ativa' : ''}"/>`; }); });
  DB.vinculos.forEach(v => {
    const a = pos.get(v.origemId), b = pos.get(v.destinoId); if (!a || !b) return;
    const x1 = a.x + NW / 2, y1 = a.y + NH / 2, x2 = b.x + NW / 2, y2 = b.y + NH / 2, my = Math.min(y1, y2) - 80;
    h += `<path d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}" class="vin ${v.origemId === selId || v.destinoId === selId ? 'ativa' : ''}"><title>${esc(v.tipo)}</title></path>`;
  });
  if (cenMapa) visiveis.forEach(s => { if (s._paiOrig && pos.has(s._paiOrig) && pos.has(s.id)) { const a = pos.get(s._paiOrig), b = pos.get(s.id); h += `<path d="M${a.x + NW / 2},${a.y + NH} C${a.x + NW / 2},${a.y + NH + 60} ${b.x + NW / 2},${b.y - 60} ${b.x + NW / 2},${b.y}" class="orig"><title>Subordinação anterior</title></path>`; } });
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
  if (cenMapa) it = Object.values(ROT_MARCA).map(([n, c]) => [n + ' (proposta)', c]).concat(it);
  $('#m-leg').innerHTML = it.map(([n, c]) => `<span><i class="q" style="background:${c}"></i>${esc(n)}</span>`).join('')
    + `<span class="dica"><i class="fa-solid fa-hand"></i> Arraste o fundo para navegar · roda do mouse para zoom · arraste um setor para reposicionar (encaixa nas guias; <b>Alt</b> solta livre) · <b>Ctrl</b> + clique seleciona vários · <b>Ctrl</b> + arrastar o fundo seleciona uma área · setas movem a seleção · <b>Shift</b> + arrastar sobre outro setor para subordinar · duplo clique abre/fecha</span>`;
}
/* Minimapa */
function desenharMini(){
  if (cenMapa && !desenharMini.dentro) { desenharMini.dentro = true; try { return emCenario(desenharMini); } finally { desenharMini.dentro = false; } }
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
    const s = porId.get(no.dataset.id) || { id:no.dataset.id, dx:'', dy:'' };
    drag = { tipo:'no', s, x0:e.clientX, y0:e.clientY, moveu:false, alvo:null, adit:aditivo(e) };
  } else if (aditivo(e) && !somenteLeitura() && !cenMapa) {
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
  if (somenteLeitura() || cenMapa) return;
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
    if (cenMapa) { infoCenario(d.s.id); return; }
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
      ${s.tipo === 'Unidades Escolares' || num(s.quantidade) ? `<label><span class="rot">Quantidade de ${rotuloUnid(s)} <small>representadas por este cartão, sem desenhar uma a uma</small></span><input class="campo" data-campo="quantidade" data-num inputmode="numeric" value="${esc(s.quantidade)}" placeholder="ex.: 631"></label>` : ''}
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
  if (c === 'quantidade' && vistaAtual === 'mapa') desenharMapa();
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
  else if (vistaAtual === 'propostas') renderPropostas();
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
      <td><div class="arv" style="padding-left:${d * 20}px;--c:${corTipo(s.tipo)}">${n ? `<button class="tg" onclick="event.stopPropagation();listaAlternar(${arg(s.id)})" title="${ab ? 'Recolher' : 'Abrir'}"><i class="fa-solid fa-chevron-${ab ? 'down' : 'right'}"></i></button>` : '<span style="width:20px"></span>'}<span class="ic"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><span class="nm" style="${filtro && !casaQ ? 'opacity:.55' : ''}">${esc(s.nome)}${num(s.quantidade) ? ` <span class="chip" style="--c:#16a34a">${fmtN(s.quantidade)} ${rotuloUnid(s)}</span>` : ''}</span>${s.sigla ? `<span class="sg">${esc(s.sigla)}</span>` : ''}${n ? `<span class="sg">· ${n}</span>` : ''}</div></td>
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
      ${(() => { const esc_ = base.filter(s => s.tipo === 'Unidades Escolares').reduce((t, s) => t + num(s.quantidade), 0); return esc_ ? kpi('#16a34a','fa-school','Unidades escolares', fmtN(esc_), 'representadas no mapa por um cartão') : ''; })()}
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
  DB = Object.assign(construirDecreto(), { historico:DB.historico, rubricas:DB.rubricas || [], despesas:DB.despesas || [], propostas:DB.propostas || [] });
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
function migrarEscolas(){
  if (somenteLeitura()) return;
  DB.setores.filter(s => s.tipo === 'Unidades Escolares' && s.quantidade === '' && s.status !== 'Extinto').forEach(s => { s.quantidade = ESCOLAS_PADRAO; enfileirar('setores', s); });
}
function abrirApp(){
  indexar(); migrarEscolas();
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
/* Subsídio dos cargos em comissão do Poder Executivo de MT (inclui a SEDUC-MT):
 * Anexo V da LC nº 266/2006, na redação da LC nº 755, de 12/01/2023 (D.O. 13/01/2023).
 * % efetivo = percentual do subsídio pago como gratificação ao servidor efetivo/de carreira nomeado no cargo. */
const DGA_FONTE = 'LC 755/2023 (Anexo V da LC 266/2006)';
const DGA_OFICIAL = [['DGA-1',25096.81,70],['DGA-2',12891.56,70],['DGA-3',9436.62,70],['DGA-4',7700.56,70],['DGA-5',5534.78,70],['DGA-6',4273.12,70],['DGA-7',3217.73,85],['DGA-8',3032.10,85],['DGA-9',1794.51,85],['DGA-10',1344.16,85]];
function carregarDGA(sobrescrever){
  let novos = 0, atualizados = 0;
  DGA_OFICIAL.forEach(([cod, val, pe]) => {
    let r = DB.rubricas.find(x => String(x.codigo).trim().toUpperCase().replace(/\s+/g, '') === cod);
    const dados = { valorMensal:String(val), percEfetivo:String(pe), fonte:DGA_FONTE, categoria:'Cargo em comissão (DGA)' };
    if (!r) {
      r = novoReg('rubricas', Object.assign({ id:novoId('rb'), codigo:cod, nome:'Cargo em comissão – símbolo ' + cod, encargos:'', meses:'12', ativo:'Sim', observacao:'Subsídio do comissionado; servidor efetivo recebe ' + pe + '% como gratificação' }, dados, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }));
      DB.rubricas.push(r); enfileirar('rubricas', r); novos++;
    } else if (sobrescrever || !numBR(r.valorMensal) || r.percEfetivo === '') {
      if (!sobrescrever && numBR(r.valorMensal)) delete dados.valorMensal;
      Object.assign(r, dados, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); enfileirar('rubricas', r); atualizados++;
    }
  });
  salvarLocal();
  return { novos, atualizados };
}
async function atualizarDGAOficial(){
  if (somenteLeitura()) return;
  if (!await confirmar('Tabela oficial DGA', `Gravar os valores de <b>DGA-1 a DGA-10</b> da ${DGA_FONTE}? Os valores que você editou nesses símbolos serão substituídos. Os lançamentos que usam esses itens são recalculados.`, 'Atualizar valores')) return;
  const r = carregarDGA(true); toast(`Tabela DGA: ${r.novos} incluído(s), ${r.atualizados} atualizado(s).`); renderFinanceiro();
}
function reajusteTabela(){
  if (somenteLeitura()) return;
  const cats = Object.keys(CATEG_FIN);
  abrirModal({ titulo:'Aplicar reajuste', rotulo:'Aplicar', largura:460,
    html:`<p>Aplica um percentual (ex.: revisão geral anual) sobre o valor mensal dos itens escolhidos. Arredonda em centavos e registra na observação.</p>
      <div class="g2"><label><span class="rot">Percentual (%)</span><input id="rj-p" class="campo" type="number" step="0.01" required placeholder="ex.: 4,83"></label>
      <label><span class="rot">Aplicar em</span><select id="rj-c" class="campo"><option value="Cargo em comissão (DGA)">Cargos em comissão (DGA)</option><option value="">Todos os itens</option>${cats.filter(c => c !== 'Cargo em comissão (DGA)').map(c => `<option>${c}</option>`).join('')}</select></label></div>
      <label><span class="rot">Referência <small>opcional</small></span><input id="rj-r" class="campo" placeholder="ex.: RGA 2025 – Lei nº 12.793/2025"></label>`,
    aoConfirmar: async m => {
      const pct = numBR(m.querySelector('#rj-p').value), cat = m.querySelector('#rj-c').value, ref = m.querySelector('#rj-r').value.trim();
      if (!pct) throw new Error('Informe o percentual.');
      const alvo = DB.rubricas.filter(r => (!cat || r.categoria === cat) && numBR(r.valorMensal));
      if (!alvo.length) throw new Error('Nenhum item com valor nessa categoria.');
      alvo.forEach(r => { r.valorMensal = String(Math.round(numBR(r.valorMensal) * (1 + pct / 100) * 100) / 100); r.observacao = ((r.observacao ? r.observacao + ' · ' : '') + `Reajuste de ${pct.toLocaleString('pt-BR')}%${ref ? ' (' + ref + ')' : ''} em ${new Date().toLocaleDateString('pt-BR')}`).slice(0, 500); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || ''; enfileirar('rubricas', r); });
      salvarLocal(); toast(`Reajuste de ${pct.toLocaleString('pt-BR')}% aplicado em ${alvo.length} item(ns).`); return true;
    }
  }).then(ok => { if (ok) renderFinanceiro(); });
}
const numBR = v => { let s = String(v ?? '').trim(); if (!s) return 0; if (/,\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/[^\d.-]/g, ''); const n = Number(s); return isFinite(n) ? n : 0; };
const fmtM = v => numBR(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const fmtM0 = v => numBR(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
let abaFinAtual = 'resumo', calcLinhas = [];
const rubricaDe = id => DB.rubricas.find(r => r.id === id);
function calcDesp(d){
  const r = rubricaDe(d.rubricaId) || {};
  const pe = d.vinculo === 'Efetivo' && r.percEfetivo !== undefined && r.percEfetivo !== '' ? numBR(r.percEfetivo) / 100 : 1;
  const unit = d.valorUnitario !== '' ? numBR(d.valorUnitario) : numBR(r.valorMensal) * pe;
  const enc = numBR(r.encargos), qtd = d.quantidade === '' ? 1 : numBR(d.quantidade);
  const mensal = qtd * unit * (1 + enc / 100);
  const meses = d.meses !== '' ? numBR(d.meses) : (r.meses !== '' && r.meses != null ? numBR(r.meses) : 12);
  return { r, unit, enc, qtd, mensal, meses, anual: mensal * meses, categoria: r.categoria || 'Outro', efetivo: pe !== 1 };
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
/* Cargos padrão das chefias (titulares), no cenário Atual:
 * Secretário(a) de Estado = DGA-1 · Secretários Adjuntos = DGA-2 · Superintendentes = DGA-3 · Coordenadores = DGA-5 */
const CHEFIAS_PADRAO = [
  { cod:'DGA-1', titulo:'Secretário(a) de Estado de Educação', teste:s => !s.paiId || !porId.has(s.paiId) },
  { cod:'DGA-2', titulo:'Secretário(a) Adjunto(a)', teste:s => s.tipo === 'Gabinete' && /^Gabinete d[oa] Secret[aá]ri[oa] Adjunt/i.test(s.nome) },
  { cod:'DGA-3', titulo:'Superintendente', teste:s => s.tipo === 'Superintendência' },
  { cod:'DGA-5', titulo:'Coordenador(a)', teste:s => s.tipo === 'Coordenadoria' }
];
const MARCA_CHEFIA = 'Cargo padrão da chefia', MARCA_HIST = 'Financeiro: cargos padrão das chefias aplicados';
function aplicarCargosChefia(){
  if (somenteLeitura()) return 0;
  carregarDGA(false);
  const rub = cod => DB.rubricas.find(r => String(r.codigo).trim().toUpperCase() === cod);
  let n = 0;
  DB.setores.filter(s => s.status !== 'Extinto').forEach(s => {
    const regra = CHEFIAS_PADRAO.find(c => c.teste(s)); if (!regra) return;
    const r = rub(regra.cod); if (!r) return;
    const ja = DB.despesas.some(d => d.setorId === s.id && d.observacao === MARCA_CHEFIA && (d.cenario || 'Atual') === 'Atual');
    if (ja) return;
    const d = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:r.id, descricao:regra.titulo, quantidade:'1', meses:'', cenario:'Atual', vinculo:'Comissionado', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
    DB.despesas.push(d); enfileirar('despesas', d); n++;
  });
  if (n) { const raiz = raizes()[0]; registrar(raiz ? raiz.id : '', `${MARCA_HIST} (${n} lançamento(s))`); salvarLocal(); }
  return n;
}
async function reaplicarCargosChefia(){
  if (somenteLeitura()) return;
  const n = aplicarCargosChefia();
  toast(n ? `${n} cargo(s) de chefia lançado(s) no cenário Atual.` : 'Todas as chefias já têm o cargo padrão lançado.');
  renderFinanceiro();
}
function renderFinanceiro(){
  if (!somenteLeitura() && !DB.rubricas.some(r => /^DGA-?\d+$/i.test(String(r.codigo).trim()))) { const r = carregarDGA(false); if (r.novos) toast('Tabela DGA-1 a DGA-10 carregada (' + DGA_FONTE + '). Os valores podem ser editados.'); }
  if (!somenteLeitura() && !DB.historico.some(x => String(x.acao).startsWith(MARCA_HIST)) && !DB.despesas.some(d => d.observacao === MARCA_CHEFIA)) {
    const n = aplicarCargosChefia(); if (n) setTimeout(() => toast(`Cargos das chefias lançados: ${n} (Secretário DGA-1, Adjuntos DGA-2, Superintendentes DGA-3, Coordenadores DGA-5).`), 900);
  }
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
      <button class="btn btn-s so-edit" onclick="reaplicarCargosChefia()" title="Lança o cargo do titular nas chefias que ainda não têm: Secretário DGA-1, Adjuntos DGA-2, Superintendentes DGA-3, Coordenadores DGA-5"><i class="fa-solid fa-user-tie"></i>Cargos das chefias</button>
    </div>
    <p style="font-size:12px;color:var(--mut);margin:-4px 0 10px"><i class="fa-solid fa-circle-info"></i> Titulares lançados automaticamente no cenário Atual: Secretário(a) de Estado <b>DGA-1</b>, Secretários Adjuntos <b>DGA-2</b>, Superintendentes <b>DGA-3</b>, Coordenadores <b>DGA-5</b> — como exclusivamente comissionados. Edite cada um para mudar o vínculo (servidor efetivo), o símbolo ou copiar para o Proposto.</p>
    <div id="fl-lista"></div>`;
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
    ${l.map(({ d, c, s }) => `<tr><td>${s ? `<a href="#" style="color:var(--txt);text-decoration:none" onclick="event.preventDefault();irPara(${arg(s.id)})"><b>${esc(s.sigla ? s.sigla + ' · ' + s.nome : s.nome)}</b></a><br><small style="color:var(--mut)">${esc(caminho(s.id).slice(-2).map(nomeCurto).join(' › ') || 'Topo da estrutura')}</small>` : '<span style="color:var(--perigo)">setor removido</span>'}</td>
      <td><span class="chip" style="--c:${(CATEG_FIN[c.categoria] || CATEG_FIN.Outro)[0]}">${esc(c.r.codigo || c.categoria)}</span>${d.descricao ? `<br><small>${esc(d.descricao)}</small>` : (c.r.nome ? `<br><small style="color:var(--mut)">${esc(c.r.nome)}</small>` : '')}</td>
      <td class="fin-num">${c.qtd.toLocaleString('pt-BR')}</td><td class="fin-num">${fmtM(c.unit)}${d.valorUnitario !== '' ? ' <small title="Valor próprio, diferente da tabela">*</small>' : ''}${c.efetivo ? `<br><small style="color:var(--mut)">efetivo · ${numBR(c.r.percEfetivo).toLocaleString('pt-BR')}%</small>` : ''}</td><td class="fin-num">${c.enc ? c.enc.toLocaleString('pt-BR') + '%' : '—'}</td>
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
    const o = { rubricaId:m.querySelector('#fd-rub').value, quantidade:m.querySelector('#fd-qtd').value, valorUnitario:m.querySelector('#fd-val').value, meses:m.querySelector('#fd-mes').value, vinculo:m.querySelector('#fd-vinc').value };
    const r = rubricaDe(o.rubricaId), temPe = !!(r && r.percEfetivo !== '');
    m.querySelector('#fd-vinc-cx').style.display = temPe ? '' : 'none'; if (!temPe) o.vinculo = '';
    m.querySelector('#fd-val').placeholder = r ? 'Tabela: ' + fmtM(numBR(r.valorMensal) * (o.vinculo === 'Efetivo' ? numBR(r.percEfetivo) / 100 : 1)) : 'Valor mensal';
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
      <label id="fd-vinc-cx"><span class="rot">Ocupante do cargo</span><select id="fd-vinc" class="campo"><option value="Comissionado" ${d.vinculo !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100% do subsídio)</option><option value="Efetivo" ${d.vinculo === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (gratificação de % do subsídio)</option></select></label>
      <label><span class="rot">Observação</span><input id="fd-obs" class="campo" value="${esc(d.observacao)}"></label>
      <div class="fin-prev" id="fd-prev"></div>`,
    aoConfirmar: async m => {
      const v = { setorId:m.querySelector('#fd-set').value, rubricaId:m.querySelector('#fd-rub').value, descricao:m.querySelector('#fd-desc').value.trim(), quantidade:m.querySelector('#fd-qtd').value, valorUnitario:m.querySelector('#fd-val').value, meses:m.querySelector('#fd-mes').value, cenario:m.querySelector('#fd-cen').value, observacao:m.querySelector('#fd-obs').value.trim(), vinculo:'' };
      const rr = rubricaDe(v.rubricaId); if (rr && rr.percEfetivo !== '') v.vinculo = m.querySelector('#fd-vinc').value;
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
  mm.querySelectorAll('#fd-rub,#fd-qtd,#fd-val,#fd-mes,#fd-vinc').forEach(i => i.addEventListener('input', () => prev(mm))); prev(mm);
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
    <td><input class="campo fin-edit" ${ro} value="${esc(r.nome)}" onchange="alterarRubrica(${arg(r.id)},'nome',this.value)" placeholder="Descrição">${r.fonte ? `<small style="display:block;color:var(--mut);font-size:10.5px;margin-top:2px" title="Fonte / base legal"><i class="fa-solid fa-scale-balanced"></i> ${esc(r.fonte)}</small>` : ''}</td>
    <td><select class="campo fin-edit" ${ro} onchange="alterarRubrica(${arg(r.id)},'categoria',this.value)">${Object.keys(CATEG_FIN).map(c => `<option ${c === r.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.valorMensal)}" onchange="alterarRubrica(${arg(r.id)},'valorMensal',this.value)" placeholder="0,00"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.encargos)}" onchange="alterarRubrica(${arg(r.id)},'encargos',this.value)" placeholder="0" style="min-width:60px"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="13.34" step="any" value="${esc(r.meses)}" onchange="alterarRubrica(${arg(r.id)},'meses',this.value)" placeholder="12" style="min-width:60px"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="100" step="0.01" value="${esc(r.percEfetivo)}" onchange="alterarRubrica(${arg(r.id)},'percEfetivo',this.value)" placeholder="—" style="min-width:60px" title="Percentual do valor pago quando o ocupante é servidor efetivo (gratificação)"></td>
    <td class="fin-num">${usos(r.id)}</td>
    <td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" title="${r.ativo === 'Não' ? 'Reativar' : 'Desativar (some da lista de lançamento)'}" onclick="alterarRubrica(${arg(r.id)},'ativo','${r.ativo === 'Não' ? 'Sim' : 'Não'}');renderFinanceiro()"><i class="fa-solid ${r.ativo === 'Não' ? 'fa-eye' : 'fa-eye-slash'}"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirRubrica(${arg(r.id)})"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`;
  const ord = [...DB.rubricas].sort((a, b) => Object.keys(CATEG_FIN).indexOf(a.categoria) - Object.keys(CATEG_FIN).indexOf(b.categoria) || String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true }));
  return `<div class="cartao bl" style="margin-bottom:14px"><h3><i class="fa-solid fa-table"></i>Tabela de valores</h3>
      <p class="s">Valores mensais usados nos cálculos: símbolos DGA dos cargos em comissão, funções gratificadas, bolsas e demais itens. <b>Encargos</b> soma um percentual ao valor (ex.: contribuição patronal). <b>Meses por ano</b>: 12 por padrão; use 13,33 para incluir 13º e 1/3 de férias. Mudar um valor aqui atualiza todos os lançamentos que usam o item.</p>
      <div class="acoes so-edit"><button class="btn btn-p" onclick="novaRubrica()"><i class="fa-solid fa-plus"></i>Novo item</button><button class="btn btn-s" onclick="atualizarDGAOficial()"><i class="fa-solid fa-scale-balanced"></i>Atualizar DGA pela LC 755/2023</button><button class="btn btn-s" onclick="reajusteTabela()"><i class="fa-solid fa-percent"></i>Aplicar reajuste (RGA)</button>${DB.rubricas.some(r => r.categoria !== 'Cargo em comissão (DGA)') ? '' : '<button class="btn btn-s" onclick="modeloRubricas()"><i class="fa-solid fa-wand-magic-sparkles"></i>Incluir modelos de função, bolsa e diária</button>'}</div>
      <p class="s" style="margin-top:10px;font-size:12px"><i class="fa-solid fa-circle-info"></i> DGA-1 a DGA-10: subsídio dos cargos em comissão do Executivo de MT, conforme o Anexo V da LC 266/2006 na redação da <b>LC nº 755, de 12/01/2023</b>. O servidor efetivo nomeado em cargo DGA recebe a gratificação de <b>70%</b> (DGA-1 a 6) ou <b>85%</b> (DGA-7 a 10) desse valor. Se houver reajuste posterior (revisão geral anual), use "Aplicar reajuste" ou edite os valores.</p></div>
    ${DB.rubricas.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th style="min-width:100px">Código</th><th style="min-width:200px">Descrição</th><th style="min-width:170px">Tipo</th><th class="fin-num" style="min-width:120px">Valor mensal (R$)</th><th class="fin-num">Encargos %</th><th class="fin-num">Meses/ano</th><th class="fin-num" title="Percentual pago ao servidor efetivo nomeado no cargo">% efetivo</th><th class="fin-num">Usos</th><th></th></tr></thead><tbody>${ord.map(lin).join('')}</tbody></table></div>` : '<div class="cartao vazio">Nenhum item cadastrado.</div>'}`;
}
function alterarRubrica(id, campo, valor){
  if (somenteLeitura()) return;
  const r = rubricaDe(id); if (!r || r[campo] === String(valor)) return;
  r[campo] = String(valor); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || '';
  if (campo === 'valorMensal' && r.fonte && !/editado/.test(r.fonte)) r.fonte += ' · valor editado em ' + new Date().toLocaleDateString('pt-BR');
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
  const n = DB.despesas.filter(d => d.rubricaId === id).length + (DB.propostas || []).reduce((t, p) => t + itensProp(p).filter(i => i.rubricaId === id).length, 0);
  if (n) return toast(`Este item é usado em ${n} lançamento(s) ou proposta(s). Desative-o em vez de excluir.`, 'aviso');
  if (!await confirmar('Excluir item', `Excluir <b>${esc(r.codigo || r.nome || 'item')}</b> da tabela de valores?`, 'Excluir', true)) return;
  DB.rubricas = DB.rubricas.filter(x => x !== r); enfileirar('rubricas', r, true); salvarLocal(); renderFinanceiro();
}
function modeloRubricas(){
  if (somenteLeitura()) return;
  carregarDGA(false);
  const base = [];
  base.push(['FG', 'Função gratificada', 'Função gratificada'], ['BOLSA', 'Bolsa (programa)', 'Bolsa'], ['EFETIVO', 'Servidor efetivo (média)', 'Pessoal efetivo'], ['DIÁRIA', 'Diária', 'Diárias e passagens']);
  base.filter(([codigo]) => !DB.rubricas.some(x => x.codigo === codigo)).forEach(([codigo, nome, categoria]) => { const r = novoReg('rubricas', { id:novoId('rb'), codigo, nome, categoria, valorMensal:'', encargos:'', meses:'12', ativo:'Sim', observacao:'Preencher com o valor vigente', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.rubricas.push(r); enfileirar('rubricas', r); });
  renderFinanceiro(); toast('Modelo criado: DGA-1 a DGA-10 com os valores da LC 755/2023 e itens de função, bolsa, efetivo e diária para preencher.');
}
/* Calculadora */
function finCalc(){
  if (!calcLinhas.length) calcLinhas = [{ rub:'', qtd:'1', meses:'', vinc:'Comissionado' }];
  return `<div class="cartao bl"><h3><i class="fa-solid fa-calculator"></i>Calculadora rápida</h3><p class="s">Simule combinações (ex.: 3 × DGA-2 + 10 bolsas) sem gravar nada. Se quiser, lance o resultado num setor.</p>
    <div id="calc-ls" style="margin-top:12px"></div>
    <div class="acoes" style="justify-content:space-between;flex-wrap:wrap"><button class="btn btn-s" onclick="calcLinhas.push({rub:'',qtd:'1',meses:'',vinc:'Comissionado'});desenharCalc()"><i class="fa-solid fa-plus"></i>Adicionar linha</button><div class="fin-prev" id="calc-tot" style="flex:1;max-width:420px"></div></div>
    <div class="acoes so-edit" style="margin-top:12px;flex-wrap:wrap"><select id="calc-set" class="campo" style="width:auto;max-width:100%"><option value="">Lançar em qual setor?</option>${opcoesSetores(selId)}</select><select id="calc-cen" class="campo" style="width:auto">${CENARIOS.map(c => `<option>${c}</option>`).join('')}</select><button class="btn btn-p" onclick="lancarCalc()"><i class="fa-solid fa-file-import"></i>Lançar no setor</button></div></div>`;
}
function desenharCalc(){
  const el = $('#calc-ls'); if (!el) return;
  el.innerHTML = calcLinhas.map((l, i) => { const c = calcDesp({ rubricaId:l.rub, quantidade:l.qtd, valorUnitario:'', meses:l.meses, vinculo:l.vinc }); const rr = rubricaDe(l.rub), temPe = !!(rr && rr.percEfetivo !== ''); return `<div class="calc-l"><select class="campo" onchange="calcLinhas[${i}].rub=this.value;desenharCalc()">${opcoesRubricas(l.rub).replace('— Sem item da tabela (valor próprio) —', 'Escolha um item')}</select><input class="campo" type="number" min="0" step="any" value="${esc(l.qtd)}" title="Quantidade" oninput="calcLinhas[${i}].qtd=this.value;desenharCalcTot(this,${i})"><input class="campo" type="number" min="0" step="any" value="${esc(l.meses)}" placeholder="${c.meses}" title="Meses" oninput="calcLinhas[${i}].meses=this.value;desenharCalcTot(this,${i})"><span class="v" data-i="${i}">${fmtM(c.mensal)}/mês</span>${temPe ? `<select class="campo" style="grid-column:1/-2;height:32px;font-size:12px" onchange="calcLinhas[${i}].vinc=this.value;desenharCalc()"><option value="Comissionado" ${l.vinc !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100%)</option><option value="Efetivo" ${l.vinc === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (${numBR(rr.percEfetivo).toLocaleString('pt-BR')}% do subsídio)</option></select>` : ''}<button class="btn btn-s btn-i" title="Remover" onclick="calcLinhas.splice(${i},1);desenharCalc()"><i class="fa-solid fa-xmark"></i></button></div>`; }).join('');
  desenharCalcTot();
}
function desenharCalcTot(){
  let m = 0, a = 0; calcLinhas.forEach((l, i) => { const c = calcDesp({ rubricaId:l.rub, quantidade:l.qtd, valorUnitario:'', meses:l.meses, vinculo:l.vinc }); m += c.mensal; a += c.anual; const v = document.querySelector(`.calc-l .v[data-i="${i}"]`); if (v) v.textContent = fmtM(c.mensal) + '/mês'; });
  const t = $('#calc-tot'); if (t) t.innerHTML = `<div>Total mensal<b>${fmtM(m)}</b></div><div>Total anual<b>${fmtM(a)}</b></div>`;
}
function lancarCalc(){
  if (somenteLeitura()) return;
  const sid = $('#calc-set').value, cen = $('#calc-cen').value; if (!sid) return toast('Escolha o setor.', 'aviso');
  const ok = calcLinhas.filter(l => l.rub && numBR(l.qtd)); if (!ok.length) return toast('Nenhuma linha com item e quantidade.', 'aviso');
  ok.forEach(l => { const rr = rubricaDe(l.rub); const d = novoReg('despesas', { id:novoId('fd'), setorId:sid, rubricaId:l.rub, quantidade:l.qtd, meses:l.meses, cenario:cen, vinculo:rr && rr.percEfetivo !== '' ? (l.vinc || 'Comissionado') : '', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); });
  registrar(sid, `Financeiro: ${ok.length} lançamento(s) pela calculadora (${cen})`);
  toast(`${ok.length} lançamento(s) feitos em ${nomeCurto(porId.get(sid))}.`); calcLinhas = []; abaFin('lancamentos');
}
function exportarFinanceiro(){
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const l = DB.despesas.map(d => ({ d, c:calcDesp(d), s:porId.get(d.setorId) }));
  const csv = '﻿' + ['Setor;Sigla;Área;Item;Tipo;Descrição;Ocupante;Quantidade;Valor unitário;Encargos %;Mensal;Meses;Anual;Cenário;Observação', ...l.map(({ d, c, s }) => [s ? s.nome : '(removido)', s ? s.sigla : '', nomeCurto(porId.get(areaDe.get(d.setorId))), c.r.codigo || '', c.categoria, d.descricao, d.vinculo === 'Efetivo' ? 'Servidor efetivo' : (d.vinculo ? 'Comissionado' : ''), c.qtd, n(c.unit), c.enc, n(c.mensal), c.meses, n(c.anual), d.cenario || 'Atual', d.observacao].map(q).join(';'))].join('\r\n');
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

/* ===================== PROPOSTAS (cenários de estrutura e valores) ===================== */
const STATUS_PROP = { 'Rascunho':'#64748b', 'Em análise':'#d97706', 'Aprovada':'#16a34a', 'Aplicada':'#2563eb', 'Arquivada':'#94a3b8' };
const TIPOS_ALT = {
  novo:['fa-square-plus', 'Criar setor', '#16a34a'], extinguir:['fa-square-minus', 'Extinguir setor', '#dc2626'], mover:['fa-arrows-up-down-left-right', 'Mudar subordinação', '#7c3aed'],
  renomear:['fa-pen', 'Renomear / mudar tipo', '#0891b2'], cargo:['fa-user-tie', 'Trocar cargo do titular', '#ea580c'], despesa:['fa-coins', 'Despesa ou bolsa', '#ca8a04']
};
let propSel = '', abaPropAtual = 'propostas';
const itensProp = p => { try { const a = JSON.parse(p.itens || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
function salvarItensProp(p, itens, msgHist){
  p.itens = JSON.stringify(itens); p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || '';
  enfileirar('propostas', p); salvarLocal();
}
function backendSemPropostas(){ return online() && backendVersao && backendVersao.localeCompare('1.6.0', undefined, { numeric:true }) < 0; }
/* Estrutura resultante da proposta (cópia virtual; nada muda na estrutura real) */
function estruturaProposta(p){
  const lista = DB.setores.map(s => Object.assign({}, s, { _marcas:[] })), mapa = new Map(lista.map(s => [s.id, s]));
  itensProp(p).forEach(it => {
    if (it.tipo === 'novo') { const s = novoReg('setores', { id:it.novoId, nome:it.nome || 'Novo setor', sigla:it.sigla || '', tipo:it.tipoSetor || 'Coordenadoria', paiId:it.paiId || '', status:'Proposto', ordem:'999' }); s._marcas = ['novo']; lista.push(s); mapa.set(s.id, s); }
    const s = mapa.get(it.setorId); if (!s) return;
    if (it.tipo === 'extinguir') { const alvo = [s.id]; if (it.comSub) { const vis = id => lista.filter(x => x.paiId === id).forEach(x => { alvo.push(x.id); vis(x.id); }); vis(s.id); } alvo.forEach(id => { const x = mapa.get(id); x.status = 'Extinto'; x._marcas.push('extinto'); }); }
    if (it.tipo === 'mover' && it.paiId && it.paiId !== s.id) { if (s._paiOrig === undefined) s._paiOrig = s.paiId; s.paiId = it.paiId; s._marcas.push('movido'); }
    if (it.tipo === 'renomear') { if (it.nome) s.nome = it.nome; if (it.sigla !== undefined && it.sigla !== '') s.sigla = it.sigla; if (it.tipoSetor) s.tipo = it.tipoSetor; s._marcas.push('renomeado'); }
    if (it.tipo === 'cargo') s._marcas.push('cargo');
  });
  return { lista, mapa };
}
/* Linhas de custo da proposta: base atual − setores extintos ± trocas de cargo + novas despesas/bolsas */
function custoProposta(p){
  const E = estruturaProposta(p), extinto = id => { const s = E.mapa.get(id); return !s || s.status === 'Extinto'; };
  let linhas = DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual').map(d => Object.assign({}, d, { _orig:d.id }));
  itensProp(p).forEach(it => {
    if (it.tipo === 'novo' && it.rubricaId) linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.novoId, rubricaId:it.rubricaId, quantidade:'1', vinculo:it.vinculo || 'Comissionado', descricao:'Titular (novo setor)', observacao:MARCA_CHEFIA }));
    if (it.tipo === 'cargo' && it.setorId) {
      const l = linhas.find(x => x.setorId === it.setorId && x.observacao === MARCA_CHEFIA);
      if (it.rubricaId === '__remover') { if (l) linhas = linhas.filter(x => x !== l); }
      else if (l) { l.rubricaId = it.rubricaId; l.vinculo = it.vinculo || l.vinculo; l.valorUnitario = ''; }
      else linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.setorId, rubricaId:it.rubricaId, quantidade:'1', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA }));
    }
    if (it.tipo === 'despesa') linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.setorId || '', rubricaId:it.rubricaId || '', quantidade:String(it.qtd ?? '1'), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '', descricao:it.descricao || '' }));
  });
  linhas = linhas.filter(l => !l.setorId || !extinto(l.setorId));
  let m = 0, a = 0; linhas.forEach(l => { const c = calcDesp(l); m += c.mensal; a += c.anual; });
  return { E, linhas, m, a };
}
function baseAtual(){ let m = 0, a = 0; DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual').forEach(d => { const c = calcDesp(d); m += c.mensal; a += c.anual; }); return { m, a }; }
function abaProp(a){ abaPropAtual = a; document.querySelectorAll('.prop-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a)); renderPropostas(); }
function renderPropostas(){
  const c = $('#pr-corpo'); if (!c) return;
  const aviso = backendSemPropostas() ? `<div class="cartao bl" style="border-color:#f59e0b;margin-bottom:14px"><h3 style="color:#b45309"><i class="fa-solid fa-triangle-exclamation"></i>Atualize o backend</h3><p class="s">A planilha está com o Codigo.gs v${esc(backendVersao)}. Para gravar as propostas na planilha, cole o Codigo.gs novo no Apps Script e publique uma nova versão.</p></div>` : '';
  if (abaPropAtual === 'bolsas') { c.innerHTML = aviso + renderBolsas(); return; }
  if (propSel && !DB.propostas.some(p => p.id === propSel)) propSel = '';
  const base = baseAtual();
  const lista = [...DB.propostas].sort((a, b) => (b.atualizadoEm || '').localeCompare(a.atualizadoEm || ''));
  c.innerHTML = aviso + `<div class="prop-grade">
    <div class="prop-lista">
      <button class="btn btn-p so-edit" style="width:100%;margin-bottom:10px" onclick="novaProposta()"><i class="fa-solid fa-plus"></i>Nova proposta</button>
      ${lista.length ? lista.map(p => { const cp = custoProposta(p), dif = cp.m - base.m, n = itensProp(p).length; return `<button class="prop-card ${p.id === propSel ? 'on' : ''}" onclick="propSel=${esc(JSON.stringify(p.id))};renderPropostas()">
        <span class="chip" style="--c:${STATUS_PROP[p.status] || '#64748b'}">${esc(p.status || 'Rascunho')}</span>
        <b>${esc(p.nome || 'Sem nome')}</b><small>${n} alteração(ões) · ${p.atualizadoPor ? esc(p.atualizadoPor) + ' · ' : ''}${p.atualizadoEm ? new Date(p.atualizadoEm).toLocaleDateString('pt-BR') : ''}</small>
        <span class="prop-dif ${dif > 0 ? 'fin-pos' : dif < 0 ? 'fin-neg' : ''}">${dif ? (dif > 0 ? '+' : '−') + fmtM0(Math.abs(dif)) + '/mês' : 'sem impacto financeiro'}</span></button>`; }).join('') : '<div class="cartao vazio">Nenhuma proposta ainda.</div>'}
    </div>
    <div class="prop-det">${propSel ? detalheProposta(DB.propostas.find(p => p.id === propSel), base) : `<div class="cartao bl"><h3><i class="fa-solid fa-lightbulb"></i>Propostas de estrutura e valores</h3><p class="s" style="line-height:1.7">Monte cenários sem mexer na estrutura oficial: <b>crie, extinga, mova ou renomeie setores</b>, <b>troque o cargo DGA</b> dos titulares e <b>inclua despesas e bolsas</b> com custos próprios. Cada proposta mostra o custo mensal e anual comparado ao atual, a diferença por item (DGA e bolsas) e a estrutura resultante. Quando uma proposta for aprovada, um administrador pode <b>aplicá-la</b> à estrutura oficial.</p><div class="acoes so-edit"><button class="btn btn-p" onclick="novaProposta()"><i class="fa-solid fa-plus"></i>Criar a primeira proposta</button></div></div>`}</div>
  </div>`;
}
function novaProposta(copiaDe){
  if (somenteLeitura()) return toast('Seu perfil é somente leitura.', 'aviso');
  const o = copiaDe ? DB.propostas.find(p => p.id === copiaDe) : null;
  abrirModal({ titulo: o ? 'Duplicar proposta' : 'Nova proposta', rotulo: o ? 'Duplicar' : 'Criar', largura:480,
    html:`<label><span class="rot">Nome da proposta</span><input id="np-nome" class="campo" required value="${o ? esc(o.nome + ' (cópia)') : ''}" placeholder="ex.: Reestruturação da SAGP 2027"></label>
      <label><span class="rot">Descrição / justificativa</span><textarea id="np-desc" class="campo" rows="3">${o ? esc(o.descricao) : ''}</textarea></label>`,
    aoConfirmar: async m => {
      const nome = m.querySelector('#np-nome').value.trim(); if (!nome) throw new Error('Dê um nome à proposta.');
      const p = novoReg('propostas', { id:novoId('pp'), nome, descricao:m.querySelector('#np-desc').value.trim(), status:'Rascunho', itens:o ? o.itens : '[]', criadoEm:agora(), criadoPor:cfg.usuario || '', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.propostas.push(p); enfileirar('propostas', p); salvarLocal(); propSel = p.id; return true;
    }
  }).then(ok => { if (ok) { abaProp('propostas'); } });
}
function nomeVirt(E, id){ const s = E.mapa.get(id); return s ? (s.sigla ? s.sigla + ' · ' : '') + s.nome : '(setor removido)'; }
function descreverAlt(it, E){
  const r = it.rubricaId && it.rubricaId !== '__remover' ? rubricaDe(it.rubricaId) : null, rn = r ? (r.codigo || r.nome) : '';
  if (it.tipo === 'novo') return `<b>${esc(it.nome)}</b>${it.sigla ? ' (' + esc(it.sigla) + ')' : ''} · ${esc(it.tipoSetor || '')} · subordinado a ${esc(nomeVirt(E, it.paiId))}${rn ? ` · titular <b>${esc(rn)}</b>${it.vinculo === 'Efetivo' ? ' (efetivo)' : ''}` : ''}`;
  if (it.tipo === 'extinguir') return `<b>${esc(nomeVirt(E, it.setorId))}</b>${it.comSub ? ' e todos os subordinados' : ' (subordinados ficam sem superior até serem movidos)'}`;
  if (it.tipo === 'mover') return `<b>${esc(nomeVirt(E, it.setorId))}</b> passa a responder a <b>${esc(nomeVirt(E, it.paiId))}</b>`;
  if (it.tipo === 'renomear') { const s = DB.setores.find(x => x.id === it.setorId); return `<b>${esc(s ? s.nome : nomeVirt(E, it.setorId))}</b> → ${esc(it.nome || '(mesmo nome)')}${it.tipoSetor ? ' · tipo ' + esc(it.tipoSetor) : ''}`; }
  if (it.tipo === 'cargo') return `<b>${esc(nomeVirt(E, it.setorId))}</b>: titular ${it.rubricaId === '__remover' ? '<b>sem cargo em comissão</b>' : `passa a <b>${esc(rn)}</b>${it.vinculo === 'Efetivo' ? ' (efetivo)' : ''}`}`;
  if (it.tipo === 'despesa') { const c = calcDesp({ rubricaId:it.rubricaId || '', quantidade:String(it.qtd ?? 1), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '' }); return `${esc(rn || it.descricao || 'Despesa')} × <b>${numBR(it.qtd).toLocaleString('pt-BR')}</b>${it.descricao && rn ? ' · ' + esc(it.descricao) : ''} em ${esc(nomeVirt(E, it.setorId))} · <b>${fmtM(c.mensal)}/mês</b>${c.meses !== 12 ? ` (${c.meses.toLocaleString('pt-BR')} meses)` : ''}`; }
  return '';
}
function detalheProposta(p, base){
  const cp = custoProposta(p), itens = itensProp(p), dif = cp.m - base.m, difA = cp.a - base.a, E = cp.E, ro = somenteLeitura();
  const novos = itens.filter(i => i.tipo === 'novo').length, ext = E.lista.filter(s => s._marcas.includes('extinto')).length;
  // comparativo por item
  const porItem = new Map(); const soma = (lst, k) => lst.forEach(l => { const c = calcDesp(l), key = l.rubricaId || '__' + (l.descricao || 'Valor próprio'); const o = porItem.get(key) || { nome:c.r.codigo || l.descricao || 'Valor próprio', cat:c.categoria, qa:0, qp:0, ma:0, mp:0 }; o['q' + k] += c.qtd; o['m' + k] += c.mensal; porItem.set(key, o); });
  soma(DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual'), 'a'); soma(cp.linhas, 'p');
  const linhasItem = [...porItem.values()].filter(o => o.qa || o.qp).sort((a, b) => Object.keys(CATEG_FIN).indexOf(a.cat) - Object.keys(CATEG_FIN).indexOf(b.cat) || String(a.nome).localeCompare(String(b.nome), 'pt-BR', { numeric:true }));
  const dv = (a, b, moeda) => { const x = b - a; return x ? `<span class="${x > 0 ? 'fin-pos' : 'fin-neg'}">${x > 0 ? '+' : '−'}${moeda ? fmtM(Math.abs(x)) : Math.abs(x).toLocaleString('pt-BR')}</span>` : '<span style="color:var(--mut2)">—</span>'; };
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v" style="font-size:21px">${v}</div><div class="s">${s}</div></div>`;
  return `<div class="cartao bl prop-cab">
      <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:220px"><input class="campo prop-nome" ${ro ? 'disabled' : ''} value="${esc(p.nome)}" onchange="editarProp(${arg(p.id)},'nome',this.value)">
          <textarea class="campo" ${ro ? 'disabled' : ''} rows="2" style="margin-top:6px" placeholder="Descrição / justificativa" onchange="editarProp(${arg(p.id)},'descricao',this.value)">${esc(p.descricao)}</textarea></div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <select class="campo" style="width:auto" ${ro ? 'disabled' : ''} onchange="editarProp(${arg(p.id)},'status',this.value)">${Object.keys(STATUS_PROP).map(s => `<option ${s === (p.status || 'Rascunho') ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <div class="u-acoes"><button class="btn btn-p btn-sm" onclick="verPropostaNoMapa(${arg(p.id)})" title="Ver a estrutura desta proposta no mapa"><i class="fa-solid fa-diagram-project"></i>Ver no mapa</button><button class="btn btn-s btn-sm" onclick="abrirComparativo('', ${arg(p.id)})" title="Comparar com a estrutura atual, lado a lado"><i class="fa-solid fa-code-compare"></i>Comparar</button><button class="btn btn-s btn-sm" onclick="exportarProposta(${arg(p.id)})" title="Exportar comparativo (CSV)"><i class="fa-solid fa-file-csv"></i>CSV</button><button class="btn btn-s btn-sm so-edit" onclick="novaProposta(${arg(p.id)})" title="Duplicar"><i class="fa-regular fa-copy"></i>Duplicar</button>${ehAdmin() && p.status !== 'Aplicada' ? `<button class="btn btn-s btn-sm" onclick="aplicarProposta(${arg(p.id)})" title="Aplicar à estrutura oficial"><i class="fa-solid fa-check-double"></i>Aplicar</button>` : ''}<button class="btn btn-perigo btn-sm btn-i so-edit" onclick="excluirProposta(${arg(p.id)})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button></div>
        </div>
      </div></div>
    <div class="kpis">
      ${kpi('#2563eb', 'fa-calendar-day', 'Custo mensal · atual', fmtM0(base.m), 'lançamentos do cenário Atual')}
      ${kpi('#7c3aed', 'fa-lightbulb', 'Custo mensal · proposta', fmtM0(cp.m), fmtM0(cp.a) + ' por ano')}
      ${kpi(dif > 0 ? '#dc2626' : '#16a34a', dif > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', 'Diferença', (dif > 0 ? '+' : dif < 0 ? '−' : '') + fmtM0(Math.abs(dif)) + '/mês', (difA > 0 ? '+' : difA < 0 ? '−' : '') + fmtM0(Math.abs(difA)) + ' por ano' + (base.m ? ` · ${(dif / base.m * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}%` : ''))}
      ${kpi('#0891b2', 'fa-sitemap', 'Estrutura', `+${novos} / −${ext}`, 'setores criados / extintos')}
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-list-check"></i>Alterações da proposta</h3>
      <div class="prop-add so-edit">${Object.entries(TIPOS_ALT).map(([k, [ic, n, cor]]) => `<button class="btn btn-s btn-sm" style="--c:${cor}" onclick="formAlteracao(${arg(p.id)},'','${k}')"><i class="fa-solid ${ic}" style="color:${cor}"></i>${n}</button>`).join('')}</div>
      ${itens.length ? `<div class="prop-itens">${itens.map((it, i) => `<div class="prop-it" style="--c:${TIPOS_ALT[it.tipo][2]}"><i class="fa-solid ${TIPOS_ALT[it.tipo][0]}"></i><div><small>${TIPOS_ALT[it.tipo][1]}</small><span>${descreverAlt(it, E)}</span></div>
        <div class="u-acoes so-edit">${i ? `<button class="btn btn-s btn-sm btn-i" title="Subir" onclick="moverAlt(${arg(p.id)},${i},-1)"><i class="fa-solid fa-arrow-up"></i></button>` : ''}<button class="btn btn-s btn-sm btn-i" title="Editar" onclick="formAlteracao(${arg(p.id)},${arg(it.id)},'${it.tipo}')"><i class="fa-solid fa-pen"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Remover" onclick="removerAlt(${arg(p.id)},${arg(it.id)})"><i class="fa-solid fa-xmark"></i></button></div></div>`).join('')}</div>` : '<p class="s" style="margin-top:10px">Nenhuma alteração ainda. Use os botões acima: criar, extinguir, mover ou renomear setores, trocar o cargo DGA de um titular ou incluir despesas e bolsas.</p>'}
    </div>
    <div class="grade2" style="margin-top:14px">
      <div class="cartao bl"><h3><i class="fa-solid fa-table-list"></i>Comparativo por item</h3>
        ${linhasItem.length ? `<div class="tab-wrap" style="margin-top:8px"><table class="tab"><thead><tr><th>Item</th><th class="fin-num">Qtd atual</th><th class="fin-num">Qtd proposta</th><th class="fin-num">Δ qtd</th><th class="fin-num">Δ mensal</th></tr></thead><tbody>${linhasItem.map(o => `<tr><td><span class="chip" style="--c:${(CATEG_FIN[o.cat] || CATEG_FIN.Outro)[0]}">${esc(o.nome)}</span></td><td class="fin-num">${o.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${o.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${dv(o.qa, o.qp)}</td><td class="fin-num">${dv(o.ma, o.mp, true)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="s">Sem lançamentos financeiros.</p>'}</div>
      <div class="cartao bl"><h3><i class="fa-solid fa-sitemap"></i>Estrutura resultante <small style="font-weight:500;color:var(--mut)">só setores afetados e seus superiores</small></h3>${arvoreProposta(E)}</div>
    </div>`;
}
function arvoreProposta(E){
  const afetados = E.lista.filter(s => s._marcas.length); if (!afetados.length) return '<p class="s">Nenhuma mudança de estrutura.</p>';
  const mostrar = new Set(); afetados.forEach(s => { let x = s, g = 0; while (x && g++ < 40) { mostrar.add(x.id); x = E.mapa.get(x.paiId); } });
  const filhos = id => E.lista.filter(s => (s.paiId || '') === id && mostrar.has(s.id));
  const ROT = { novo:['novo', '#16a34a'], extinto:['extinto', '#dc2626'], movido:['movido', '#7c3aed'], renomeado:['renomeado', '#0891b2'], cargo:['cargo', '#ea580c'] };
  const raizesV = E.lista.filter(s => (!s.paiId || !E.mapa.has(s.paiId)) && mostrar.has(s.id));
  const no = (s, d) => `<div class="prop-no" style="padding-left:${d * 18}px;${s.status === 'Extinto' ? 'opacity:.6;text-decoration:line-through' : ''}"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)}"></i>${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)} ${[...new Set(s._marcas)].map(m => `<span class="chip" style="--c:${ROT[m][1]};text-decoration:none">${ROT[m][0]}</span>`).join(' ')}</div>` + filhos(s.id).map(f => no(f, d + 1)).join('');
  return `<div class="prop-arvore">${raizesV.map(r => no(r, 0)).join('')}</div>`;
}
function editarProp(id, campo, valor){
  const p = DB.propostas.find(x => x.id === id); if (!p || somenteLeitura()) return;
  if (campo === 'status' && valor === 'Aplicada' && p.status !== 'Aplicada') { toast('Use o botão "Aplicar" para aplicar a proposta à estrutura.', 'aviso'); renderPropostas(); return; }
  p[campo] = String(valor); p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || ''; enfileirar('propostas', p); salvarLocal();
  if (campo !== 'descricao') renderPropostas();
}
async function excluirProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p || somenteLeitura()) return;
  if (!await confirmar('Excluir proposta', `Excluir a proposta <b>${esc(p.nome)}</b>? A estrutura oficial não é afetada.`, 'Excluir', true)) return;
  DB.propostas = DB.propostas.filter(x => x !== p); enfileirar('propostas', p, true); salvarLocal(); propSel = ''; renderPropostas();
}
function moverAlt(pid, i, d){ const p = DB.propostas.find(x => x.id === pid); const a = itensProp(p); if (!a[i + d]) return; [a[i], a[i + d]] = [a[i + d], a[i]]; salvarItensProp(p, a); renderPropostas(); }
function removerAlt(pid, iid){
  const p = DB.propostas.find(x => x.id === pid); let a = itensProp(p); const it = a.find(x => x.id === iid);
  if (it && it.tipo === 'novo' && a.some(x => x !== it && (x.paiId === it.novoId || x.setorId === it.novoId))) return toast('Outras alterações dependem deste novo setor. Remova-as primeiro.', 'aviso');
  a = a.filter(x => x.id !== iid); salvarItensProp(p, a); renderPropostas();
}
function opcoesVirt(E, sel, excluir){
  const ord = []; const visit = (s, d) => { if (excluir && excluir.has(s.id)) return; ord.push([s, d]); E.lista.filter(x => x.paiId === s.id && x.status !== 'Extinto').forEach(k => visit(k, d + 1)); };
  E.lista.filter(s => (!s.paiId || !E.mapa.has(s.paiId)) && s.status !== 'Extinto').forEach(r => visit(r, 0));
  return ord.map(([s, d]) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${'  '.repeat(Math.min(d, 6))}${s._marcas.includes('novo') ? '★ ' : ''}${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)}</option>`).join('');
}
function opcoesDGA(sel, comRemover){
  return (comRemover ? `<option value="__remover" ${sel === '__remover' ? 'selected' : ''}>— Sem cargo em comissão —</option>` : '<option value="">— Sem cargo em comissão —</option>') + DB.rubricas.filter(r => r.categoria === 'Cargo em comissão (DGA)' || r.categoria === 'Função gratificada').sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true })).map(r => `<option value="${esc(r.id)}" ${r.id === sel ? 'selected' : ''}>${esc(r.codigo)} — ${fmtM(r.valorMensal)}</option>`).join('');
}
function formAlteracao(pid, iid, tipo){
  if (somenteLeitura()) return;
  const p = DB.propostas.find(x => x.id === pid); if (!p) return;
  const itens = itensProp(p), it = itens.find(x => x.id === iid) || { id:novoId('al'), tipo };
  // estrutura até antes deste item (para que o item possa referenciar setores criados antes dele)
  const idx = itens.indexOf(it), antes = Object.assign({}, p, { itens:JSON.stringify(idx >= 0 ? itens.slice(0, idx) : itens) }), E = estruturaProposta(antes);
  const tiposSetor = Object.keys(TIPOS);
  const vincSel = v => `<label><span class="rot">Ocupante do cargo</span><select id="fa-vinc" class="campo"><option value="Comissionado" ${v !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100%)</option><option value="Efetivo" ${v === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (gratificação de %)</option></select></label>`;
  let html = '';
  if (tipo === 'novo') html = `<label><span class="rot">Nome do novo setor</span><input id="fa-nome" class="campo" required value="${esc(it.nome)}"></label>
    <div class="g2"><label><span class="rot">Sigla</span><input id="fa-sigla" class="campo" value="${esc(it.sigla)}"></label><label><span class="rot">Tipo</span><select id="fa-tipo" class="campo">${tiposSetor.map(t => `<option ${t === (it.tipoSetor || 'Coordenadoria') ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
    <label><span class="rot">Subordinado a</span><select id="fa-pai" class="campo">${opcoesVirt(E, it.paiId)}</select></label>
    <div class="g2"><label><span class="rot">Cargo do titular</span><select id="fa-rub" class="campo">${opcoesDGA(it.rubricaId)}</select></label>${vincSel(it.vinculo)}</div>`;
  if (tipo === 'extinguir') html = `<label><span class="rot">Setor a extinguir</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <label class="chk"><input type="checkbox" id="fa-sub" ${it.comSub !== false ? 'checked' : ''}><span>Extinguir também todos os subordinados <small style="display:block;color:var(--mut)">Desmarque se os subordinados forem movidos para outro setor nesta proposta.</small></span></label>
    <p style="font-size:12px">Os custos lançados nos setores extintos saem do total da proposta.</p>`;
  if (tipo === 'mover') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label><label><span class="rot">Passa a responder a</span><select id="fa-pai" class="campo">${opcoesVirt(E, it.paiId)}</select></label>`;
  if (tipo === 'renomear') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label><label><span class="rot">Novo nome <small>vazio = mantém</small></span><input id="fa-nome" class="campo" value="${esc(it.nome)}"></label>
    <div class="g2"><label><span class="rot">Nova sigla <small>vazio = mantém</small></span><input id="fa-sigla" class="campo" value="${esc(it.sigla)}"></label><label><span class="rot">Novo tipo</span><select id="fa-tipo" class="campo"><option value="">(mantém)</option>${tiposSetor.map(t => `<option ${t === it.tipoSetor ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>`;
  if (tipo === 'cargo') html = `<label><span class="rot">Setor (titular)</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <div class="g2"><label><span class="rot">Novo cargo</span><select id="fa-rub" class="campo">${opcoesDGA(it.rubricaId || '', true)}</select></label>${vincSel(it.vinculo)}</div>
    <p style="font-size:12px">Substitui o cargo padrão do titular desse setor nesta proposta (ex.: Coordenadoria de DGA-5 para DGA-4).</p>`;
  if (tipo === 'despesa') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <label><span class="rot">Item da tabela (DGA, bolsa, função…)</span><select id="fa-rub" class="campo">${opcoesRubricas(it.rubricaId || '')}</select></label>
    <div class="acoes" style="margin-top:-4px"><button type="button" class="btn btn-s btn-sm" onclick="formBolsa('', true)"><i class="fa-solid fa-graduation-cap"></i>Cadastrar nova bolsa</button></div>
    <label><span class="rot">Descrição</span><input id="fa-desc" class="campo" value="${esc(it.descricao)}" placeholder="ex.: Bolsistas formadores do programa X"></label>
    <div class="g2"><label><span class="rot">Quantidade <small>negativa reduz</small></span><input id="fa-qtd" class="campo" type="number" step="any" value="${esc(it.qtd ?? '1')}"></label><label><span class="rot">Valor mensal próprio <small>vazio = tabela</small></span><input id="fa-val" class="campo" type="number" min="0" step="0.01" value="${esc(it.valor)}"></label></div>
    <div class="g2"><label><span class="rot">Meses no ano <small>vazio = tabela</small></span><input id="fa-mes" class="campo" type="number" min="0" step="any" value="${esc(it.meses)}"></label>${vincSel(it.vinculo)}</div>
    <div class="fin-prev" id="fa-prev"></div>`;
  abrirModal({ titulo:TIPOS_ALT[tipo][1], rotulo: idx >= 0 ? 'Salvar' : 'Incluir na proposta', largura:540, html,
    aoConfirmar: async m => {
      const v = id => { const e = m.querySelector(id); return e ? (e.type === 'checkbox' ? e.checked : e.value) : undefined; };
      const n = Object.assign({}, it);
      if (tipo === 'novo') { n.nome = v('#fa-nome').trim(); n.sigla = v('#fa-sigla').trim(); n.tipoSetor = v('#fa-tipo'); n.paiId = v('#fa-pai'); n.rubricaId = v('#fa-rub'); n.vinculo = v('#fa-vinc'); n.novoId = n.novoId || novoId('pn'); if (!n.nome) throw new Error('Informe o nome.'); }
      if (tipo === 'extinguir') { n.setorId = v('#fa-set'); n.comSub = v('#fa-sub'); }
      if (tipo === 'mover') { n.setorId = v('#fa-set'); n.paiId = v('#fa-pai'); if (n.setorId === n.paiId) throw new Error('Um setor não pode responder a si mesmo.'); const sub = new Set(); const vis = id => E.lista.filter(x => x.paiId === id).forEach(x => { sub.add(x.id); vis(x.id); }); vis(n.setorId); if (sub.has(n.paiId)) throw new Error('O novo superior está dentro do próprio ramo do setor.'); }
      if (tipo === 'renomear') { n.setorId = v('#fa-set'); n.nome = v('#fa-nome').trim(); n.sigla = v('#fa-sigla').trim(); n.tipoSetor = v('#fa-tipo'); if (!n.nome && !n.sigla && !n.tipoSetor) throw new Error('Informe o que muda.'); }
      if (tipo === 'cargo') { n.setorId = v('#fa-set'); n.rubricaId = v('#fa-rub'); n.vinculo = v('#fa-vinc'); }
      if (tipo === 'despesa') { n.setorId = v('#fa-set'); n.rubricaId = v('#fa-rub'); n.descricao = v('#fa-desc').trim(); n.qtd = v('#fa-qtd'); n.valor = v('#fa-val'); n.meses = v('#fa-mes'); n.vinculo = v('#fa-vinc'); if (!n.rubricaId && !n.valor) throw new Error('Escolha um item ou informe o valor.'); if (!n.rubricaId && !n.descricao) throw new Error('Descreva a despesa.'); if (!numBR(n.qtd)) throw new Error('Informe a quantidade.'); }
      const a = itensProp(p), i = a.findIndex(x => x.id === n.id); if (i >= 0) a[i] = n; else a.push(n);
      salvarItensProp(p, a); return true;
    }
  }).then(ok => { if (ok) renderPropostas(); });
  if (tipo === 'despesa') {
    const ms = document.querySelectorAll('.modal'), mm = ms[ms.length - 1];
    const prev = () => { const c = calcDesp({ rubricaId:mm.querySelector('#fa-rub').value, quantidade:mm.querySelector('#fa-qtd').value, valorUnitario:mm.querySelector('#fa-val').value, meses:mm.querySelector('#fa-mes').value, vinculo:mm.querySelector('#fa-vinc').value }); mm.querySelector('#fa-prev').innerHTML = `<div>Mensal<b>${fmtM(c.mensal)}</b></div><div>Anual (${c.meses.toLocaleString('pt-BR')} meses)<b>${fmtM(c.anual)}</b></div>`; const r = rubricaDe(mm.querySelector('#fa-rub').value); mm.querySelector('#fa-vinc').closest('label').style.display = r && r.percEfetivo !== '' ? '' : 'none'; };
    mm.querySelectorAll('#fa-rub,#fa-qtd,#fa-val,#fa-mes,#fa-vinc').forEach(x => x.addEventListener('input', prev)); prev();
    tv.atualizarRubFA = () => { const s = mm.querySelector('#fa-rub'); if (s) { const v = s.value; s.innerHTML = opcoesRubricas(v); prev(); } };
  }
}
async function aplicarProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p || !ehAdmin()) return;
  const itens = itensProp(p); if (!itens.length) return toast('A proposta não tem alterações.', 'aviso');
  if (!await confirmar('Aplicar proposta', `Aplicar as <b>${itens.length}</b> alteração(ões) de <b>${esc(p.nome)}</b> à <b>estrutura oficial</b>? Setores serão criados, extintos, movidos ou renomeados, e os lançamentos do cenário Atual serão ajustados. Recomendo exportar uma cópia antes (Configurações).`, 'Aplicar à estrutura', true)) return;
  const real = new Map(); const R = x => real.get(x) || x;
  itens.forEach(it => {
    if (it.tipo === 'novo') {
      const pai = R(it.paiId), s = novoSetor({ id:novoId('s'), nome:it.nome, sigla:it.sigla || '', tipo:it.tipoSetor || 'Coordenadoria', paiId:pai, ordem:String(Math.max(0, ...filhosDe(pai).map(k => num(k.ordem))) + 1), atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.setores.push(s); enfileirar('setores', s); real.set(it.novoId, s.id); indexar(); registrar(s.id, `Criado pela proposta "${p.nome}"`);
      if (it.rubricaId) { const d = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:it.rubricaId, quantidade:'1', cenario:'Atual', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); }
    }
    const s = porId.get(R(it.setorId));
    if (it.tipo === 'extinguir' && s) { [s.id, ...(it.comSub ? descendentes(s.id) : [])].forEach(i => { const x = porId.get(i); if (x) alterar(x, 'status', 'Extinto', true); }); registrar(s.id, `Extinto pela proposta "${p.nome}"`); DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual' && porId.get(d.setorId) && porId.get(d.setorId).status === 'Extinto').forEach(d => { DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true); }); }
    if (it.tipo === 'mover' && s) { s.dx = ''; s.dy = ''; alterar(s, 'paiId', R(it.paiId)); }
    if (it.tipo === 'renomear' && s) { if (it.nome) alterar(s, 'nome', it.nome); if (it.sigla) alterar(s, 'sigla', it.sigla); if (it.tipoSetor) alterar(s, 'tipo', it.tipoSetor); }
    if (it.tipo === 'cargo' && s) {
      const d = DB.despesas.find(x => x.setorId === s.id && x.observacao === MARCA_CHEFIA && (x.cenario || 'Atual') === 'Atual');
      if (it.rubricaId === '__remover') { if (d) { DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true); } }
      else if (d) { d.rubricaId = it.rubricaId; d.vinculo = it.vinculo || d.vinculo; d.valorUnitario = ''; d.atualizadoEm = agora(); enfileirar('despesas', d); }
      else { const n = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:it.rubricaId, quantidade:'1', cenario:'Atual', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(n); enfileirar('despesas', n); }
      registrar(s.id, `Cargo do titular alterado pela proposta "${p.nome}"`);
    }
    if (it.tipo === 'despesa' && (s || !it.setorId)) { const d = novoReg('despesas', { id:novoId('fd'), setorId:s ? s.id : '', rubricaId:it.rubricaId || '', quantidade:String(it.qtd), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '', descricao:it.descricao || '', cenario:'Atual', observacao:'Proposta: ' + p.nome, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); }
  });
  p.status = 'Aplicada'; p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || ''; enfileirar('propostas', p);
  indexar(); salvarLocal(); toast(`Proposta "${p.nome}" aplicada à estrutura oficial.`); renderPropostas();
}
function exportarProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p) return;
  const cp = custoProposta(p), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const linhas = ['Proposta;' + q(p.nome), 'Situação;' + q(p.status), '', 'Alterações', ...itensProp(p).map(it => q(TIPOS_ALT[it.tipo][1]) + ';' + q(descreverAlt(it, cp.E).replace(/<[^>]+>/g, ''))), '',
    'Setor;Item;Tipo;Descrição;Quantidade;Valor unitário;Mensal;Meses;Anual', ...cp.linhas.map(l => { const c = calcDesp(l), s = cp.E.mapa.get(l.setorId); return [s ? s.nome : '', c.r.codigo || '', c.categoria, l.descricao, c.qtd, n(c.unit), n(c.mensal), c.meses, n(c.anual)].map(q).join(';'); }),
    '', 'Total mensal da proposta;' + n(cp.m), 'Total mensal atual;' + n(baseAtual().m)];
  baixarArquivo('gaborg-proposta-' + (p.nome || 'sem-nome').replace(/[^\w-]+/g, '_').slice(0, 40) + '.csv', '﻿' + linhas.join('\r\n'), 'text/csv;charset=utf-8');
}
/* Bolsas: cadastro próprio com custos diferentes */
function renderBolsas(){
  const bolsas = DB.rubricas.filter(r => r.categoria === 'Bolsa'), ro = somenteLeitura() ? 'disabled' : '';
  const usos = id => DB.despesas.filter(d => d.rubricaId === id).length + DB.propostas.reduce((t, p) => t + itensProp(p).filter(i => i.rubricaId === id).length, 0);
  return `<div class="cartao bl" style="margin-bottom:14px"><h3><i class="fa-solid fa-graduation-cap"></i>Bolsas</h3><p class="s">Cadastre cada tipo de bolsa com o seu valor mensal e a quantidade de meses pagos no ano (ex.: bolsa de 10 meses). Elas aparecem nos lançamentos do Financeiro e nas alterações das Propostas.</p>
    <div class="acoes so-edit"><button class="btn btn-p" onclick="formBolsa()"><i class="fa-solid fa-plus"></i>Nova bolsa</button></div></div>
    ${bolsas.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th style="min-width:110px">Código</th><th style="min-width:220px">Nome da bolsa</th><th class="fin-num" style="min-width:120px">Valor mensal (R$)</th><th class="fin-num">Meses/ano</th><th class="fin-num">Custo anual por bolsista</th><th class="fin-num">Usos</th><th></th></tr></thead><tbody>${bolsas.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')).map(r => `<tr>
      <td><input class="campo fin-edit" ${ro} value="${esc(r.codigo)}" onchange="alterarRubrica(${arg(r.id)},'codigo',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit" ${ro} value="${esc(r.nome)}" onchange="alterarRubrica(${arg(r.id)},'nome',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.valorMensal)}" onchange="alterarRubrica(${arg(r.id)},'valorMensal',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="13.34" step="any" value="${esc(r.meses)}" placeholder="12" style="min-width:60px" onchange="alterarRubrica(${arg(r.id)},'meses',this.value);renderPropostas()"></td>
      <td class="fin-num"><b>${fmtM(numBR(r.valorMensal) * (r.meses !== '' ? numBR(r.meses) : 12))}</b></td><td class="fin-num">${usos(r.id)}</td>
      <td><div class="u-acoes so-edit"><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirRubrica(${arg(r.id)}).then(()=>renderPropostas())"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="cartao vazio">Nenhuma bolsa cadastrada.</div>'}`;
}
function formBolsa(id, deDentro){
  if (somenteLeitura()) return;
  abrirModal({ titulo:'Nova bolsa', rotulo:'Cadastrar', largura:460,
    html:`<label><span class="rot">Nome da bolsa</span><input id="fb-nome" class="campo" required placeholder="ex.: Bolsa Formador Regional"></label>
      <div class="g2"><label><span class="rot">Código <small>opcional</small></span><input id="fb-cod" class="campo" placeholder="ex.: BOLSA-FR"></label><label><span class="rot">Valor mensal (R$)</span><input id="fb-val" class="campo" type="number" min="0" step="0.01" required></label></div>
      <label><span class="rot">Meses pagos no ano</span><input id="fb-mes" class="campo" type="number" min="0" max="13.34" step="any" value="12"></label>`,
    aoConfirmar: async m => {
      const nome = m.querySelector('#fb-nome').value.trim(), val = m.querySelector('#fb-val').value; if (!nome || val === '') throw new Error('Informe o nome e o valor.');
      const r = novoReg('rubricas', { id:novoId('rb'), codigo:m.querySelector('#fb-cod').value.trim() || ('BOLSA-' + (DB.rubricas.filter(x => x.categoria === 'Bolsa').length + 1)), nome, categoria:'Bolsa', valorMensal:val, encargos:'', meses:m.querySelector('#fb-mes').value || '12', ativo:'Sim', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.rubricas.push(r); enfileirar('rubricas', r); salvarLocal(); toast('Bolsa cadastrada.'); return true;
    }
  }).then(ok => { if (!ok) return; if (deDentro && tv.atualizarRubFA) tv.atualizarRubFA(); else renderPropostas(); });
}

/* ===================== MAPA POR CENÁRIO (atual × propostas) E COMPARATIVO ===================== */
let cenMapa = '';
const ROT_MARCA = { novo:['Novo', '#16a34a'], extinto:['Extinto', '#dc2626'], movido:['Movido', '#7c3aed'], renomeado:['Renomeado', '#0891b2'], cargo:['Cargo alterado', '#ea580c'] };
function listaCenario(id){
  const p = id && DB.propostas.find(x => x.id === id);
  return p ? estruturaProposta(p).lista : DB.setores;
}
function linhasCenario(id){
  const p = id && DB.propostas.find(x => x.id === id);
  return p ? custoProposta(p).linhas : DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual');
}
function nomeCenario(id){ const p = id && DB.propostas.find(x => x.id === id); return p ? p.nome : 'Estrutura atual (oficial)'; }
/* Executa fn com a estrutura de um cenário no lugar da oficial (só para desenhar; nada é gravado) */
function comLista(lista, fn, manterLayout, abExtra){
  const S = { setores:DB.setores, porId, filhos, prof, areaDe, areas, valPorSetor, pos, visiveis, caixas, modos, origemRaiz, abertos };
  DB.setores = lista; const jaAtivo = comLista.ativo; comLista.ativo = true;
  try { indexar(); if (abExtra) abertos = new Set([...abertos, ...abExtra]); return fn(); }
  finally {
    comLista.ativo = jaAtivo;
    const L = { pos, visiveis, caixas, modos, origemRaiz };
    DB.setores = S.setores; porId = S.porId; filhos = S.filhos; prof = S.prof; areaDe = S.areaDe; areas = S.areas; valPorSetor = S.valPorSetor; abertos = S.abertos;
    if (manterLayout) { pos = L.pos; visiveis = L.visiveis; caixas = L.caixas; modos = L.modos; origemRaiz = L.origemRaiz; }
    else { pos = S.pos; visiveis = S.visiveis; caixas = S.caixas; modos = S.modos; origemRaiz = S.origemRaiz; }
  }
}
const emCenario = fn => !comLista.ativo && cenMapa && DB.propostas.some(p => p.id === cenMapa) ? comLista(listaCenario(cenMapa), fn, true) : fn();
function ancestraisMarcados(lista){
  const m = new Map(lista.map(s => [s.id, s])), r = new Set();
  lista.filter(s => s._marcas && s._marcas.length).forEach(s => { let x = m.get(s.paiId), g = 0; while (x && g++ < 40) { r.add(x.id); x = m.get(x.paiId); } if (s._paiOrig) { let y = m.get(s._paiOrig), h = 0; while (y && h++ < 40) { r.add(y.id); y = m.get(y.paiId); } } });
  return r;
}
function preencherCenarios(){
  const sel = $('#m-cen'); if (!sel) return;
  if (cenMapa && !DB.propostas.some(p => p.id === cenMapa)) cenMapa = '';
  sel.innerHTML = '<option value="">Estrutura atual</option>' + DB.propostas.filter(p => p.status !== 'Aplicada').map(p => `<option value="${esc(p.id)}" ${p.id === cenMapa ? 'selected' : ''}>Proposta: ${esc(p.nome)}</option>`).join('');
  sel.value = cenMapa;
  const f = $('#m-cen-faixa');
  if (f) {
    f.classList.toggle('hidden', !cenMapa);
    if (cenMapa) { const p = DB.propostas.find(x => x.id === cenMapa), cp = custoProposta(p), b = baseAtual(), d = cp.m - b.m;
      f.innerHTML = `<i class="fa-solid fa-lightbulb"></i><span><b>${esc(p.nome)}</b> · ${itensProp(p).length} alteração(ões) · ${d ? (d > 0 ? '+' : '−') + fmtM0(Math.abs(d)) + '/mês' : 'sem impacto financeiro'} · somente visualização</span><button class="btn btn-s btn-sm" onclick="abrirComparativo('', ${arg(p.id)})"><i class="fa-solid fa-code-compare"></i>Comparar com o atual</button><button class="btn btn-s btn-sm" onclick="trocarVista('propostas');propSel=${arg(p.id)};abaProp('propostas')"><i class="fa-solid fa-pen"></i>Editar proposta</button><button class="btn btn-s btn-sm" onclick="escolherCenarioMapa('')"><i class="fa-solid fa-xmark"></i>Voltar ao atual</button>`; }
  }
  document.body.classList.toggle('cen-ativo', !!cenMapa);
}
function escolherCenarioMapa(id){
  cenMapa = id || ''; limparMulti(true); fecharPainel();
  if (cenMapa) { ancestraisMarcados(listaCenario(cenMapa)).forEach(a => abertos.add(a)); }
  if (vistaAtual !== 'mapa') trocarVista('mapa'); else desenharMapa();
  setTimeout(() => ajustar(true), 40);
}
function verPropostaNoMapa(id){ escolherCenarioMapa(id); }
function marcasHTML(s){ return (s._marcas && s._marcas.length) ? [...new Set(s._marcas)].map(m => `<span class="cen-tag" style="--t:${ROT_MARCA[m][1]}">${ROT_MARCA[m][0]}</span>`).join('') : ''; }
function infoCenario(id){
  const lista = listaCenario(cenMapa), m = new Map(lista.map(s => [s.id, s])), s = m.get(id); if (!s) return;
  const linhas = linhasCenario(cenMapa).filter(l => l.setorId === id), real = DB.setores.find(x => x.id === id);
  const pai = m.get(s.paiId), paiOrig = s._paiOrig ? m.get(s._paiOrig) : null;
  abrirModal({ titulo: s.nome, rotulo:'Fechar', semCancelar:true, largura:480,
    html:`<p style="margin-top:-6px">${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''} ${marcasHTML(s)}</p>
      <p><span class="rot">Responde a (nesta proposta)</span>${esc(pai ? pai.nome : '—')}${paiOrig ? `<br><small style="color:var(--mut)">antes: ${esc(paiOrig.nome)}</small>` : ''}</p>
      ${real && real.nome !== s.nome ? `<p><span class="rot">Nome atual</span>${esc(real.nome)}</p>` : ''}
      <div><span class="rot">Custos nesta proposta</span>${linhas.length ? linhas.map(l => { const c = calcDesp(l); return `<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0"><span>${esc(c.r.codigo || l.descricao || c.categoria)} × ${c.qtd.toLocaleString('pt-BR')}</span><b>${fmtM(c.mensal)}/mês</b></div>`; }).join('') : '<p class="s">Nenhum.</p>'}</div>
      <div class="acoes" style="justify-content:flex-start">${real ? `<button type="button" class="btn btn-s btn-sm" onclick="this.closest('.modal').remove();escolherCenarioMapa('');setTimeout(()=>irPara(${arg(id)}),80)"><i class="fa-solid fa-arrow-right"></i>Abrir setor na estrutura atual</button>` : ''}</div>` });
}
/* ---------- Comparativo lado a lado ---------- */
const cmp = { a:'', b:'', sinc:true, v:[null, null] };
function diffCenarios(aId, bId){
  const A = listaCenario(aId), B = listaCenario(bId), mA = new Map(A.map(s => [s.id, s])), mB = new Map(B.map(s => [s.id, s]));
  const ativo = s => s && s.status !== 'Extinto', nm = (m, id) => { const s = m.get(id); return s ? (s.sigla || s.nome) : '(topo)'; };
  const est = [];
  B.forEach(s => { const a = mA.get(s.id);
    if (ativo(s) && !ativo(a)) est.push({ id:s.id, tipo:a ? 'reativado' : 'novo', txt:`<b>${esc(s.nome)}</b> (${esc(s.tipo)}) sob ${esc(nm(mB, s.paiId))}` });
    if (!ativo(s) && ativo(a)) est.push({ id:s.id, tipo:'extinto', txt:`<b>${esc(a.nome)}</b> (${esc(a.tipo)})` });
    if (a && ativo(s) && ativo(a)) {
      if ((a.paiId || '') !== (s.paiId || '')) est.push({ id:s.id, tipo:'movido', txt:`<b>${esc(s.nome)}</b>: ${esc(nm(mA, a.paiId))} → ${esc(nm(mB, s.paiId))}` });
      if (a.nome !== s.nome || (a.sigla || '') !== (s.sigla || '')) est.push({ id:s.id, tipo:'renomeado', txt:`${esc(a.nome)} → <b>${esc(s.nome)}</b>` });
      if (a.tipo !== s.tipo) est.push({ id:s.id, tipo:'tipo', txt:`<b>${esc(s.nome)}</b>: ${esc(a.tipo)} → ${esc(s.tipo)}` });
    }
  });
  A.forEach(a => { if (!mB.has(a.id) && ativo(a)) est.push({ id:a.id, tipo:'extinto', txt:`<b>${esc(a.nome)}</b> (${esc(a.tipo)})` }); });
  const custo = lst => { const m = new Map(); lst.forEach(l => { const c = calcDesp(l); const o = m.get(l.setorId) || { m:0, itens:[] }; o.m += c.mensal; o.itens.push((c.r.codigo || l.descricao || c.categoria) + (c.qtd !== 1 ? ' ×' + c.qtd.toLocaleString('pt-BR') : '')); m.set(l.setorId, o); }); return m; };
  const cA = custo(linhasCenario(aId)), cB = custo(linhasCenario(bId)), fin = [];
  new Set([...cA.keys(), ...cB.keys()]).forEach(id => { const x = cA.get(id) || { m:0, itens:[] }, y = cB.get(id) || { m:0, itens:[] }, d = y.m - x.m; if (Math.abs(d) > .004) fin.push({ id, nome:(mB.get(id) || mA.get(id) || {}).nome || '(sem setor)', a:x, b:y, d }); });
  fin.sort((p, q) => Math.abs(q.d) - Math.abs(p.d));
  const tot = (l, k) => l.reduce((t, x) => t + calcDesp(x)[k], 0), LA = linhasCenario(aId), LB = linhasCenario(bId);
  return { est, fin, tA:tot(LA, 'mensal'), tB:tot(LB, 'mensal'), aA:tot(LA, 'anual'), aB:tot(LB, 'anual'), mA, mB, A, B };
}
function abrirComparativo(a, b){
  cmp.a = a || ''; cmp.b = b !== undefined ? b : (cenMapa || (DB.propostas[0] || {}).id || '');
  let el = $('#cmp'); if (!el) { el = document.createElement('div'); el.id = 'cmp'; document.body.appendChild(el); }
  el.classList.remove('hidden'); renderComparativo();
}
function fecharComparativo(){ const el = $('#cmp'); if (el) { el.classList.add('hidden'); el.innerHTML = ''; } }
function opcoesCen(sel){ return '<option value="">Estrutura atual (oficial)</option>' + DB.propostas.map(p => `<option value="${esc(p.id)}" ${p.id === sel ? 'selected' : ''}>${esc(p.nome)}${p.status ? ' · ' + esc(p.status) : ''}</option>`).join(''); }
function renderComparativo(){
  const el = $('#cmp'), D = diffCenarios(cmp.a, cmp.b), dif = D.tB - D.tA;
  const ROT = { novo:['Criado', '#16a34a', 'fa-square-plus'], reativado:['Reativado', '#16a34a', 'fa-rotate-left'], extinto:['Extinto', '#dc2626', 'fa-square-minus'], movido:['Subordinação', '#7c3aed', 'fa-arrows-up-down-left-right'], renomeado:['Nome', '#0891b2', 'fa-pen'], tipo:['Tipo', '#0e7490', 'fa-tag'] };
  el.innerHTML = `<div class="cmp-topo"><b><i class="fa-solid fa-code-compare"></i> Comparar cenários</b>
      <select class="campo" onchange="cmp.a=this.value;renderComparativo()">${opcoesCen(cmp.a)}</select><span class="cmp-x">×</span><select class="campo" onchange="cmp.b=this.value;renderComparativo()">${opcoesCen(cmp.b)}</select>
      <label class="chk" style="margin-left:6px"><input type="checkbox" ${cmp.sinc ? 'checked' : ''} onchange="cmp.sinc=this.checked"><span>Mover os dois mapas juntos</span></label>
      <button class="btn btn-s btn-sm" onclick="exportarComparativo()"><i class="fa-solid fa-file-csv"></i>CSV</button><button class="btn btn-s btn-sm btn-i" title="Fechar (Esc)" onclick="fecharComparativo()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="cmp-mapas">
      ${[0, 1].map(i => `<div class="cmp-pane"><div class="cmp-tit"><span>${i ? 'B' : 'A'} · ${esc(nomeCenario(i ? cmp.b : cmp.a))}</span><b>${fmtM0(i ? D.tB : D.tA)}/mês</b></div><div class="cmp-vp" id="cmp-vp${i}"><div class="mundo-cmp" id="cmp-m${i}"></div></div></div>`).join('')}
    </div>
    <div class="cmp-dif">
      <div class="cmp-res"><span><b>${D.est.length}</b> mudança(s) de estrutura</span><span><b>${D.fin.length}</b> setor(es) com custo diferente</span><span>Diferença de custo (B − A): <b class="${dif > 0 ? 'fin-pos' : dif < 0 ? 'fin-neg' : ''}">${dif ? (dif > 0 ? '+' : '−') + fmtM(Math.abs(dif)) + '/mês · ' + (D.aB - D.aA > 0 ? '+' : '−') + fmtM0(Math.abs(D.aB - D.aA)) + '/ano' : 'nenhuma'}</b></span></div>
      <div class="cmp-col"><h4>Estrutura</h4>${D.est.length ? D.est.map(x => `<button class="cmp-it" onclick="cmpFocar(${arg(x.id)})" style="--c:${ROT[x.tipo][1]}"><i class="fa-solid ${ROT[x.tipo][2]}"></i><span><small>${ROT[x.tipo][0]}</small>${x.txt}</span></button>`).join('') : '<p class="s">Nenhuma diferença de estrutura.</p>'}</div>
      <div class="cmp-col"><h4>Custos por setor</h4>${D.fin.length ? D.fin.map(x => `<button class="cmp-it" onclick="cmpFocar(${arg(x.id)})" style="--c:${x.d > 0 ? '#dc2626' : '#16a34a'}"><i class="fa-solid ${x.d > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i><span><small>${x.d > 0 ? '+' : '−'}${fmtM(Math.abs(x.d))}/mês</small><b>${esc(x.nome)}</b><br><span style="color:var(--mut);font-size:11.5px">A: ${esc(x.a.itens.join(', ') || '—')} · B: ${esc(x.b.itens.join(', ') || '—')}</span></span></button>`).join('') : '<p class="s">Nenhuma diferença de custo.</p>'}</div>
    </div>`;
  // marcas de diferença em cada lado
  const marcaA = new Map(), marcaB = new Map();
  D.est.forEach(x => { const t = x.tipo === 'reativado' ? 'novo' : x.tipo === 'tipo' ? 'renomeado' : x.tipo; if (t === 'extinto') { marcaA.set(x.id, 'extinto'); marcaB.set(x.id, 'extinto'); } else marcaB.set(x.id, t); if (t === 'movido') marcaA.set(x.id, 'movido'); });
  D.fin.forEach(x => { if (!marcaB.has(x.id)) marcaB.set(x.id, 'cargo'); });
  [[cmp.a, marcaA, 0], [cmp.b, marcaB, 1]].forEach(([id, mk, i]) => montarPaneCmp(id, mk, i));
}
function montarPaneCmp(cid, marcas, i){
  const lista = listaCenario(cid).map(s => Object.assign({}, s, { _marcas: marcas.has(s.id) ? [marcas.get(s.id)] : [] }));
  const anc = ancestraisMarcados(lista); marcas.forEach((v, id) => anc.add(id));
  let html = '', L;
  comLista(lista, () => {
    calcularLayout();
    let ar = ''; visiveis.forEach(s => filhosVis(s.id).forEach(k => { if (pos.has(k.id)) ar += `<path d="${caminhoAresta(s, k)}"/>`; }));
    html = `<svg style="position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible">${ar}</svg>` + visiveis.map(cardHTML).join('').replace(/ sel /g, ' ').replace(/ msel /g, ' ');
    L = limites(); cmp['pos' + i] = new Map(pos);
  }, false, anc);
  const vp = $('#cmp-vp' + i), mu = $('#cmp-m' + i); mu.innerHTML = html;
  const r = vp.getBoundingClientRect(), k = Math.max(.1, Math.min((r.width - 30) / (L.x1 - L.x0), (r.height - 30) / (L.y1 - L.y0), .9));
  cmp.v[i] = { k, x:(r.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:14 - L.y0 * k };
  aplicarCmp(i);
  let arr = null;
  vp.onpointerdown = e => { if (e.target.closest('.no')) { const id = e.target.closest('.no').dataset.id; cmpFocar(id); return; } arr = { x:e.clientX, y:e.clientY, v:Object.assign({}, cmp.v[i]) }; vp.setPointerCapture(e.pointerId); vp.classList.add('pan'); };
  vp.onpointermove = e => { if (!arr) return; const dx = e.clientX - arr.x, dy = e.clientY - arr.y; [i, ...(cmp.sinc ? [1 - i] : [])].forEach(j => { if (j === i) { cmp.v[j].x = arr.v.x + dx; cmp.v[j].y = arr.v.y + dy; } else { cmp.v[j].x += e.movementX; cmp.v[j].y += e.movementY; } aplicarCmp(j); }); };
  vp.onpointerup = vp.onpointercancel = () => { arr = null; vp.classList.remove('pan'); };
  vp.onwheel = e => { e.preventDefault(); const b = vp.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top, f = Math.exp(-e.deltaY * .0015); [i, ...(cmp.sinc ? [1 - i] : [])].forEach(j => { const v = cmp.v[j]; if (!v) return; const kk = Math.max(.06, Math.min(2.5, v.k * f)), q = kk / v.k; cmp.v[j] = { k:kk, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; aplicarCmp(j); }); };
}
function aplicarCmp(i){ const m = $('#cmp-m' + i), v = cmp.v[i]; if (m && v) m.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`; }
function cmpFocar(id){
  [0, 1].forEach(i => { const p = cmp['pos' + i] && cmp['pos' + i].get(id), vp = $('#cmp-vp' + i); document.querySelectorAll(`#cmp-m${i} .no`).forEach(n => n.classList.toggle('sel', n.dataset.id === id)); if (!p || !vp) return; const r = vp.getBoundingClientRect(), k = Math.max(cmp.v[i].k, .6); cmp.v[i] = { k, x:r.width / 2 - (p.x + NW / 2) * k, y:r.height / 2 - (p.y + NH / 2) * k }; const m = $('#cmp-m' + i); m.style.transition = 'transform .4s'; aplicarCmp(i); setTimeout(() => { m.style.transition = ''; }, 420); });
}
function exportarComparativo(){
  const D = diffCenarios(cmp.a, cmp.b), q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/<[^>]+>/g, '') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const l = ['A;' + q(nomeCenario(cmp.a)), 'B;' + q(nomeCenario(cmp.b)), 'Custo mensal A;' + n(D.tA), 'Custo mensal B;' + n(D.tB), 'Diferença mensal;' + n(D.tB - D.tA), 'Diferença anual;' + n(D.aB - D.aA), '', 'Mudança de estrutura;Detalhe', ...D.est.map(x => q(x.tipo) + ';' + q(x.txt)), '', 'Setor;Custo mensal A;Custo mensal B;Diferença;Itens A;Itens B', ...D.fin.map(x => [x.nome, n(x.a.m), n(x.b.m), n(x.d), x.a.itens.join(', '), x.b.itens.join(', ')].map(q).join(';'))];
  baixarArquivo('gaborg-comparativo-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + l.join('\r\n'), 'text/csv;charset=utf-8');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#cmp') && !$('#cmp').classList.contains('hidden') && !document.querySelector('.modal')) { e.stopImmediatePropagation(); fecharComparativo(); } }, true);

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
      <div class="tv-kpis">${tvKpi('#3b82f6', 'Setores ativos', at.length.toLocaleString('pt-BR'), `${areas.length} áreas${(() => { const e = at.filter(s => s.tipo === 'Unidades Escolares').reduce((t, s) => t + num(s.quantidade), 0); return e ? ' · ' + e.toLocaleString('pt-BR') + ' escolas' : ''; })()}`)}${tvKpi('#22c55e', 'Servidores', soma('servidores').toLocaleString('pt-BR'), `${soma('comissionados').toLocaleString('pt-BR')} comissionados`)}${tvKpi('#a855f7', 'Custo mensal', fmtRc(f.Atual.m), f.Proposto.m ? `proposto ${fmtRc(f.Proposto.m)}` : 'lançamentos atuais', true)}${tvKpi('#f59e0b', 'Validações pendentes', pend, `${DB.validacoes.length} no total`)}${tvKpi('#ef4444', 'Sem responsável', at.filter(s => !s.responsavel && filhosDe(s.id).length).length, 'chefias a definir')}</div>
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

/* Erros inesperados depois de aberto: avisa em vez de falhar em silêncio */
window.addEventListener('error', e => { if (window.GABORG_INICIADO && e.message && typeof toast === 'function') toast('Erro: ' + e.message + ' — recarregue a página. Se repetir, envie esta mensagem ao suporte.', 'erro'); });
window.addEventListener('unhandledrejection', e => { const m = e.reason && (e.reason.message || String(e.reason)); if (window.GABORG_INICIADO && m && !/abort/i.test(m) && typeof toast === 'function') console.warn('GABOrg:', m); });

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

window.GABORG_VERSAO_JS = VERSAO;
(async function iniciar(){
  window.GABORG_INICIADO = true;
  if (window.GABORG_VERSAO_HTML && window.GABORG_VERSAO_HTML !== VERSAO) setTimeout(() => toast(`Versões diferentes: index.html ${window.GABORG_VERSAO_HTML} × arquivo.js ${VERSAO}. Envie os dois arquivos da mesma versão ao GitHub.`, 'aviso'), 1500);
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
