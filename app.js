/**
 * Planejamento Familiar Pro - Web App Full-Stack
 * Motor de Cálculo, Estado Reativo, Interface Mobile-First, Cardápio por Semana e Persistência
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'planejamento_familiar_pro_v14';
  const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const MEALS_ORDER = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'];

  // Map JS Date getDay() (0 = Dom, 1 = Seg, ...) to Portuguese names
  
  // Retorna os 7 dias ordenados a partir do 1º dia escolhido pelo usuário (ex: Sábado -> Sex ou Seg -> Dom)
  function getOrderedDaysOfWeek() {
    const defaultDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const startDay = state.firstDayOfWeek || 'Segunda';
    const idx = defaultDays.indexOf(startDay);
    if (idx === -1 || idx === 0) return [...defaultDays];
    return [...defaultDays.slice(idx), ...defaultDays.slice(0, idx)];
  }

  // Helper: Calcula o intervalo de datas exato para uma semana (1 a 5)
  function calculateNextCycleStartDate() {
    const cycleStart = state.cycleStartDate || '2026-11-02';
    const parts = cycleStart.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = (parseInt(parts[1], 10) || 11) - 1;
    const day = parseInt(parts[2], 10) || 2;

    const startDate = new Date(year, month, day);
    // Add 35 days (5 weeks * 7 days)
    startDate.setDate(startDate.getDate() + 35);

    const pad = (n) => String(n).padStart(2, '0');
    return `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
  }

  function getWeekDateRange(weekNumber) {
    const cycleStart = state.cycleStartDate || '2026-11-02';
    const parts = cycleStart.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = (parseInt(parts[1], 10) || 11) - 1;
    const day = parseInt(parts[2], 10) || 2;

    const startDate = new Date(year, month, day);
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const pad = (n) => String(n).padStart(2, '0');
    const startDayStr = pad(startDate.getDate());
    const startMonthStr = pad(startDate.getMonth() + 1);
    const endDayStr = pad(endDate.getDate());
    const endMonthStr = pad(endDate.getMonth() + 1);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const startMonthName = monthNames[startDate.getMonth()];
    const endMonthName = monthNames[endDate.getMonth()];

    return {
      start: `${startDayStr}/${startMonthStr}`,
      end: `${endDayStr}/${endMonthStr}`,
      label: `${startDayStr}/${startMonthStr} a ${endDayStr}/${endMonthStr}`,
      shortLabel: `${startDayStr}/${startMonthStr} - ${endDayStr}/${endMonthStr}`,
      fullLabel: `${startDayStr} de ${startMonthName} a ${endDayStr} de ${endMonthName}`,
      startDate,
      endDate
    };
  }

  // Modal para escolha livre do 1º dia da semana e data inicial do ciclo
  function openCycleConfigModal() {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const currentFirstDay = state.firstDayOfWeek || 'Segunda';
    const currentDate = state.cycleStartDate || '2026-11-02';

    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2.5">
            <span class="text-2xl">📅</span>
            <div>
              <h3 class="text-lg font-bold text-white">Configuração do Ciclo Semanal</h3>
              <p class="text-xs text-slate-400">Defina o primeiro dia da semana e a data inicial das compras.</p>
            </div>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-3.5">
          <!-- Seletor do 1º Dia da Semana -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              1º Dia da Semana (Início do Ciclo):
            </label>
            <select id="cfg-first-day"
                    onchange="window.app.previewCycleDates()"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
              ${days.map(d => `
                <option value="${d}" ${d === currentFirstDay ? 'selected' : ''}>
                  ${d} ${d === 'Sábado' ? '(ex: Sábado a Sexta-feira)' : (d === 'Segunda' ? '(ex: Segunda a Domingo)' : (d === 'Domingo' ? '(ex: Domingo a Sábado)' : ''))}
                </option>
              `).join('')}
            </select>
            <p class="text-[11px] text-slate-400 mt-1">
              As abas dos dias no Cardápio e no modo Cozinha se reorganizarão nesta ordem.
            </p>
          </div>

          <!-- Data Inicial da Semana 1 -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              Data de Início da Semana 1:
            </label>
            <input type="date" id="cfg-start-date" value="${currentDate}"
                   onchange="window.app.previewCycleDates()"
                   class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
            <p class="text-[11px] text-slate-400 mt-1">
              Data em que começa a Semana 1 do planejamento.
            </p>
          </div>

          <!-- Prévia ao Vivo das 5 Semanas -->
          <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <span class="text-xs font-bold text-emerald-400 block">Prévia das 5 Semanas Geradas:</span>
            <div id="cycle-preview-list" class="space-y-1.5 text-xs text-slate-300">
              <!-- Preenchido via previewCycleDates() -->
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
          <button onclick="window.app.closeModal()"
                  class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition">
            Cancelar
          </button>
          <button onclick="window.app.saveCycleConfig()"
                  class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5">
            <span>💾</span> <span>Salvar Configuração</span>
          </button>
        </div>
      </div>
    `);

    setTimeout(() => previewCycleDates(), 10);
  }

  function previewCycleDates() {
    const inputDate = document.getElementById('cfg-start-date')?.value || state.cycleStartDate || '2026-11-02';
    const container = document.getElementById('cycle-preview-list');
    if (!container) return;

    const parts = inputDate.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = (parseInt(parts[1], 10) || 11) - 1;
    const day = parseInt(parts[2], 10) || 2;
    const pad = (n) => String(n).padStart(2, '0');

    let html = '';
    for (let w = 1; w <= 5; w++) {
      const s = new Date(year, month, day);
      s.setDate(s.getDate() + (w - 1) * 7);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      html += `
        <div class="flex justify-between items-center py-1 border-b border-slate-800/50 last:border-0">
          <span class="font-semibold text-slate-200">Semana ${w}:</span>
          <span class="font-mono text-emerald-400">${pad(s.getDate())}/${pad(s.getMonth()+1)} a ${pad(e.getDate())}/${pad(e.getMonth()+1)}</span>
        </div>
      `;
    }
    container.innerHTML = html;
  }

  function saveCycleConfig(firstDayArg, startDateArg) {
    const firstDay = firstDayArg || document.getElementById('cfg-first-day')?.value || 'Segunda';
    const startDate = startDateArg || document.getElementById('cfg-start-date')?.value || '2026-11-02';

    state.firstDayOfWeek = firstDay;
    state.cycleStartDate = startDate;
    saveState();
    closeModal();
    renderApp();
    showToast(`Ciclo atualizado! Semana começa em ${firstDay} (Início: ${startDate})`, 'success');
  }

  function getTodayName() {
    const dayIdx = new Date().getDay();
    const map = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return map[dayIdx] || 'Segunda';
  }

  // --- STATE ---
  let state = {
    familyMembers: 3,
    activeTab: 'panela', // 'panela' | 'cardapio' | 'compras' | 'giro' | 'higiene' | 'ingredientes' | 'config'
    activeDay: getTodayName(),
    activeWeek: 1, // 1 to 5 (Global active week)
    ingredients: [],
    menuItems: [], // Legacy / Base menu
    menuByWeek: { 1: [], 2: [], 3: [], 4: [], 5: [] }, // Cardápio individual por semana
    hygieneItems: [],
    initialStock: {}, // { [ingName]: number }
    pantryAdjustments: {}, // { [`w${week}_${ingName}`]: number } (ajustes reais na virada de semana)
    cartChecked: {}, // { [`${week}_${itemId}`]: boolean }
    adjustedPrices: {}, // { [`${week}_${itemId}`]: { price, qty, pack } }
    extraItems: [], // [ { id, week, nome, categoria, qtd, preco, checked } ]
    pendingCarriedItems: [],
    completedTurnovers: {}, // { [week]: { timestamp, formattedDate, nextWeek } }
    firstDayOfWeek: 'Segunda', // 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo'
    cycleStartDate: '2026-11-02', // Data YYYY-MM-DD em que inicia a Semana 1
    currentCycleNumber: 1,
    cycleHistory: [],
    dishNames: {}, // { [`${week}_${day}_${meal}`]: string }
    activeKitchenMeal: 'Almoço',
    shoppingViewFilter: 'all',
    supabaseConfig: { url: 'https://deydppcfgyqbudzqiqty.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleWRwcGNmZ3lxYnVkenFpcXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNTMyMjEsImV4cCI6MjEwODcyOTIyMX0.zetBuSXxlB3uvFxBkBjEvp9VimsG1E9hvRxKp4JRaZs', autoSync: true },
    lastSync: null
  };

  // --- INITIALIZATION ---
  function initApp() {
    loadState();
    registerServiceWorker();
    setupEventListeners();
    renderApp();
  }

  function loadState() {
    try {
      // Limpa chaves legadas para evitar persistência de dados antigos/corrompidos
      ['planejamento_familiar_pro_state', 'planejamento_familiar_pro_v1', 'planejamento_familiar_pro_v2', 'planejamento_familiar_pro_v3', 'planejamento_familiar_pro_v4', 'planejamento_familiar_pro_v5'].forEach((k) => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      let saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const v10Saved = localStorage.getItem('planejamento_familiar_pro_v13') || localStorage.getItem('planejamento_familiar_pro_v12') || localStorage.getItem('planejamento_familiar_pro_v11') || localStorage.getItem('planejamento_familiar_pro_v10') || localStorage.getItem('planejamento_familiar_pro_v9');
        if (v10Saved) {
          saved = v10Saved;
          try { localStorage.setItem(STORAGE_KEY, v10Saved); } catch (e) {}
        }
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };

        // Higieniza nomes de ciclos que ficaram com undefined
        if (Array.isArray(state.cycleHistory)) {
          state.cycleHistory.forEach(c => {
            if (c.name && c.name.includes('undefined')) {
              c.name = `Ciclo ${c.cycleNumber || 1}`;
            }
          });
        }

        // Garante que dishNames exista
        if (!state.dishNames) state.dishNames = {};

        // Verifica se há porções corrompidas ou dados antigos (ex: Couve = 25 ou Açúcar = 16.67)
        const isCorrupted = !state.ingredients || state.ingredients.length !== 53 ||
          !state.menuItems || state.menuItems.length !== 176 ||
          state.menuItems.some((i) => (i.ingrediente_nome.includes('Couve') && i.porcao_pessoa > 1) ||
                                     (i.ingrediente_nome.includes('Açúcar Demerara') && Math.abs(i.porcao_pessoa - 16.67) < 0.1));

        if (isCorrupted) {
          console.warn('Detectado cardápio com dados legados. Sincronizando com cardápio oficial dos prints...');
          state.familyMembers = window.INITIAL_SEED_DATA.family_members || 3;
          state.ingredients = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.ingredients || []));
          state.menuItems = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.menu_items || []));
          state.hygieneItems = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.hygiene_items || []));
          state.menuByWeek = {
            1: JSON.parse(JSON.stringify(state.menuItems)),
            2: JSON.parse(JSON.stringify(state.menuItems)),
            3: JSON.parse(JSON.stringify(state.menuItems)),
            4: JSON.parse(JSON.stringify(state.menuItems)),
            5: JSON.parse(JSON.stringify(state.menuItems))
          };
        }
      } else if (window.INITIAL_SEED_DATA) {
        state.familyMembers = window.INITIAL_SEED_DATA.family_members || 3;
        state.ingredients = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.ingredients || []));
        state.menuItems = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.menu_items || []));
        state.hygieneItems = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.hygiene_items || []));
      }

      // Garante que todas as 5 semanas tenham exatamente os 176 itens oficiais
      if (!state.supabaseConfig) {
      state.supabaseConfig = { url: 'https://deydppcfgyqbudzqiqty.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleWRwcGNmZ3lxYnVkenFpcXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNTMyMjEsImV4cCI6MjEwODcyOTIyMX0.zetBuSXxlB3uvFxBkBjEvp9VimsG1E9hvRxKp4JRaZs', autoSync: true };
    } else {
      if (!state.supabaseConfig.url || state.supabaseConfig.url.includes('unywwknptwwizgapsvkl')) {
        state.supabaseConfig.url = 'https://deydppcfgyqbudzqiqty.supabase.co';
      }
      if (!state.supabaseConfig.key) {
        state.supabaseConfig.key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleWRwcGNmZ3lxYnVkenFpcXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNTMyMjEsImV4cCI6MjEwODcyOTIyMX0.zetBuSXxlB3uvFxBkBjEvp9VimsG1E9hvRxKp4JRaZs';
      }
      state.supabaseConfig.autoSync = true;
    }
    if (!state.menuByWeek) state.menuByWeek = {};
      if (!state.completedTurnovers) state.completedTurnovers = {};
      if (!state.firstDayOfWeek) state.firstDayOfWeek = 'Segunda';
      if (!state.cycleStartDate) state.cycleStartDate = '2026-11-02';
      const base = (state.menuItems && state.menuItems.length === 176) ? state.menuItems : (window.INITIAL_SEED_DATA?.menu_items || []);
      for (let w = 1; w <= 5; w++) {
        const weekItems = state.menuByWeek[w];
        const weekCorrupted = !weekItems || weekItems.length !== 176 || weekItems.some((i) => (i.ingrediente_nome.includes('Couve') && i.porcao_pessoa > 1) || (i.ingrediente_nome.includes('Açúcar Demerara') && Math.abs(i.porcao_pessoa - 16.67) < 0.1));
        if (weekCorrupted) {
          state.menuByWeek[w] = JSON.parse(JSON.stringify(base));
        }
      }

      saveState();
    } catch (e) {
      console.error('Erro ao carregar estado do LocalStorage:', e);
      if (window.INITIAL_SEED_DATA) {
        state.familyMembers = window.INITIAL_SEED_DATA.family_members || 3;
        state.ingredients = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.ingredients || []));
        state.menuItems = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.menu_items || []));
        state.hygieneItems = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.hygiene_items || []));
        state.menuByWeek = {
          1: JSON.parse(JSON.stringify(state.menuItems)),
          2: JSON.parse(JSON.stringify(state.menuItems)),
          3: JSON.parse(JSON.stringify(state.menuItems)),
          4: JSON.parse(JSON.stringify(state.menuItems)),
          5: JSON.parse(JSON.stringify(state.menuItems))
        };
      }
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (state.supabaseConfig?.autoSync && state.supabaseConfig.url && state.supabaseConfig.key) {
        syncWithSupabaseSilent();
      }
    } catch (e) {
      console.error('Erro ao salvar no LocalStorage:', e);
    }
  }

  function resetToDefault() {
    if (!window.INITIAL_SEED_DATA) {
      showToast('Dados iniciais não encontrados.', 'error');
      return;
    }
    state.familyMembers = window.INITIAL_SEED_DATA.family_members || 3;
    state.ingredients = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.ingredients || []));
    state.menuItems = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.menu_items || []));
    state.hygieneItems = JSON.parse(JSON.stringify(window.INITIAL_SEED_DATA.hygiene_items || []));
    state.menuByWeek = {
      1: JSON.parse(JSON.stringify(state.menuItems)),
      2: JSON.parse(JSON.stringify(state.menuItems)),
      3: JSON.parse(JSON.stringify(state.menuItems)),
      4: JSON.parse(JSON.stringify(state.menuItems)),
      5: JSON.parse(JSON.stringify(state.menuItems))
    };
    state.initialStock = {};
    state.pantryAdjustments = {};
    state.cartChecked = {};
    state.adjustedPrices = {};
    state.extraItems = [];
    state.pendingCarriedItems = [];
    state.completedTurnovers = {};
    saveState();
    renderApp();
    showToast('Dados originais da planilha restaurados com sucesso!', 'success');
  }

  function resetToOfficialMenu() {
    if (confirm('Deseja restaurar todo o cardápio oficial dos prints para todas as semanas?')) {
      resetToDefault();
      showToast('Cardápio 100% sincronizado com a planilha oficial!', 'success');
    }
  }

  // Helper to get active week's menu items
  function getActiveMenuItems(week = state.activeWeek) {
    if (!state.menuByWeek[week]) {
      state.menuByWeek[week] = JSON.parse(JSON.stringify(state.menuItems || []));
    }
    return state.menuByWeek[week];
  }

  // --- SERVICE WORKER ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('SW registration error:', err);
      });
    }
  }

  // --- RECALCULATION ENGINES ---

  function formatMeasureNumber(num) {
    if (isNaN(num)) return '0';
    const rounded = Math.round(num * 10) / 10;
    return rounded.toString().replace('.', ',');
  }

  function formatHouseholdMeasure(qtdTotalFamilia, basePortion, measureName) {
    if (!basePortion || basePortion <= 0) return '';
    const measures = Math.round((qtdTotalFamilia / basePortion) * 10) / 10;
    return `${formatMeasureNumber(measures)} ${measureName}`;
  }

  function getCategoryBadgeClass(category) {
    const map = {
      'Carnes/Ovos': 'bg-rose-950/60 text-rose-300 border border-rose-800/40',
      'Hortifrúti': 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40',
      'Mercearia': 'bg-amber-950/60 text-amber-300 border border-amber-800/40',
      'Laticínios/Padaria': 'bg-blue-950/60 text-blue-300 border border-blue-800/40',
      'Higiene & Limpeza': 'bg-pink-950/60 text-pink-300 border border-pink-800/40',
      'Outros': 'bg-slate-800 text-slate-300 border border-slate-700'
    };
    return map[category] || 'bg-slate-800 text-slate-300 border border-slate-700';
  }

  function getIngredientByName(name) {
    return state.ingredients.find((i) => i.nome.trim().toLowerCase() === name.trim().toLowerCase()) || null;
  }

  // When family members count changes: recalculates all 5 weeks' menus
  function updateFamilyMembers(newCount) {
    const val = parseFloat(newCount);
    if (isNaN(val) || val <= 0) return;
    state.familyMembers = Math.round(val * 10) / 10;

    [1, 2, 3, 4, 5].forEach((w) => {
      const items = getActiveMenuItems(w);
      items.forEach((item) => {
        const ing = getIngredientByName(item.ingrediente_nome);
        item.qtd_total_familia = Math.round(item.porcao_pessoa * state.familyMembers * 100) / 100;
        if (ing) {
          item.medida_caseira_str = formatHouseholdMeasure(item.qtd_total_familia, ing.peso_porcao_base, ing.nome_medida_caseira);
          item.custo = (item.qtd_total_familia / ing.tamanho_pacote) * ing.preco_pacote;
        }
      });
    });

    saveState();
    renderApp();
    showToast(`Família: ${state.familyMembers} pessoa(s). Todas as porções e compras recalculadas!`, 'info');
  }

  // Bidirectional helper for menu item editing
  function computeMenuItemFromPortion(portionPerson, ing) {
    const qtdTotal = Math.round(portionPerson * state.familyMembers * 100) / 100;
    const measures = ing.peso_porcao_base > 0 ? Math.round((qtdTotal / ing.peso_porcao_base) * 10) / 10 : 0;
    const cost = ing.tamanho_pacote > 0 ? (qtdTotal / ing.tamanho_pacote) * ing.preco_pacote : 0;
    return {
      porcao_pessoa: portionPerson,
      qtd_total_familia: qtdTotal,
      medida_caseira_str: formatHouseholdMeasure(qtdTotal, ing.peso_porcao_base, ing.nome_medida_caseira),
      medidas_num: measures,
      custo: cost
    };
  }

  function computeMenuItemFromTotal(qtdTotal, ing) {
    const portionPerson = state.familyMembers > 0 ? Math.round((qtdTotal / state.familyMembers) * 100) / 100 : 0;
    const measures = ing.peso_porcao_base > 0 ? Math.round((qtdTotal / ing.peso_porcao_base) * 10) / 10 : 0;
    const cost = ing.tamanho_pacote > 0 ? (qtdTotal / ing.tamanho_pacote) * ing.preco_pacote : 0;
    return {
      porcao_pessoa: portionPerson,
      qtd_total_familia: qtdTotal,
      medida_caseira_str: formatHouseholdMeasure(qtdTotal, ing.peso_porcao_base, ing.nome_medida_caseira),
      medidas_num: measures,
      custo: cost
    };
  }

  function computeMenuItemFromMeasures(measures, ing) {
    const qtdTotal = Math.round(measures * ing.peso_porcao_base * 100) / 100;
    const portionPerson = state.familyMembers > 0 ? Math.round((qtdTotal / state.familyMembers) * 100) / 100 : 0;
    const cost = ing.tamanho_pacote > 0 ? (qtdTotal / ing.tamanho_pacote) * ing.preco_pacote : 0;
    return {
      porcao_pessoa: portionPerson,
      qtd_total_familia: qtdTotal,
      medida_caseira_str: formatHouseholdMeasure(qtdTotal, ing.peso_porcao_base, ing.nome_medida_caseira),
      medidas_num: measures,
      custo: cost
    };
  }

  // Weekly consumption engine for a specific week's menu
  function getWeeklyConsumptions(week = state.activeWeek) {
    const consumption = {};
    const items = getActiveMenuItems(week);
    items.forEach((item) => {
      const name = item.ingrediente_nome;
      consumption[name] = (consumption[name] || 0) + (item.qtd_total_familia || 0);
    });
    return consumption;
  }

  // 5-Weeks Cascade Shopping Calculation Engine
  // Each week uses its OWN cardápio consumption and carries over verified leftovers
  function calculate5WeeksCascade() {
    const results = [];
    const consumptionsByWeek = {};
    for (let w = 1; w <= 5; w++) {
      consumptionsByWeek[w] = getWeeklyConsumptions(w);
    }

    const allIngNames = state.ingredients.map(i => i.nome).sort((a, b) => a.localeCompare(b));

    allIngNames.forEach((name) => {
      const ing = getIngredientByName(name);
      if (!ing) return;

      const initialStockVal = state.initialStock[name] || 0;
      const row = {
        ingrediente: ing.nome,
        categoria: ing.categoria || 'Mercearia',
        tipo_compra: ing.tipo_compra || ing.tipo_venda || 'Pacote',
        tamanho_pacote: ing.tamanho_pacote || 1,
        medida: ing.medida || ing.unidade_pacote || 'un',
        preco_pacote: ing.preco_pacote || 0,
        estoque_inicial: initialStockVal,
        weeks: []
      };

      let estoqueDisponivel = initialStockVal;

      for (let w = 1; w <= 5; w++) {
        const consumoSemanal = Math.round((consumptionsByWeek[w][name] || 0) * 100) / 100;

        // Check if there was a manual adjustment from turnover for this week
        if (state.pantryAdjustments[`w${w}_${name}`] !== undefined) {
          estoqueDisponivel = state.pantryAdjustments[`w${w}_${name}`];
        }

        const falta = Math.max(0, consumoSemanal - estoqueDisponivel);
        let qtdComprar = 0;
        let custoEstimado = 0;
        let sobraProximaSemana = 0;

        const isPeso = (ing.tipo_compra || ing.tipo_venda) === 'Peso';
        if (isPeso) {
          qtdComprar = falta;
          custoEstimado = ing.tamanho_pacote > 0 ? (qtdComprar / ing.tamanho_pacote) * ing.preco_pacote : 0;
          sobraProximaSemana = Math.max(0, estoqueDisponivel - consumoSemanal);
        } else {
          // Pacote or Unidade
          qtdComprar = falta > 0 && ing.tamanho_pacote > 0 ? Math.ceil(falta / ing.tamanho_pacote) : 0;
          custoEstimado = qtdComprar * ing.preco_pacote;
          sobraProximaSemana = estoqueDisponivel + (qtdComprar * ing.tamanho_pacote) - consumoSemanal;
        }

        row.weeks.push({
          week: w,
          consumo_semanal: consumoSemanal,
          estoque_disponivel: Math.round(estoqueDisponivel * 100) / 100,
          falta: Math.round(falta * 100) / 100,
          qtd_comprar: Math.round(qtdComprar * 100) / 100,
          custo_estimado: Math.round(custoEstimado * 100) / 100,
          sobra_proxima_semana: Math.round(sobraProximaSemana * 100) / 100
        });

        // Next week available stock is this week's leftover
        estoqueDisponivel = sobraProximaSemana;
      }

      results.push(row);
    });

    return results;
  }

  // Financial summary for a specific week's Menu
  function getMenuFinancialSummary(week = state.activeWeek) {
    const dayTotals = {};
    const mealTotals = {
      'Café da Manhã': 0,
      'Almoço': 0,
      'Lanche da Tarde': 0,
      'Jantar': 0
    };
    DAYS_OF_WEEK.forEach((d) => { dayTotals[d] = 0; });

    let totalSemana = 0;
    const items = getActiveMenuItems(week);

    items.forEach((item) => {
      const c = item.custo || 0;
      totalSemana += c;
      if (dayTotals[item.dia_nome] !== undefined) {
        dayTotals[item.dia_nome] += c;
      }
      if (mealTotals[item.refeicao] !== undefined) {
        mealTotals[item.refeicao] += c;
      }
    });

    const projetado30Dias = (totalSemana / 7) * 30;

    const mediaRefeicaoDiaria = {
      'Café da Manhã': mealTotals['Café da Manhã'] / 7,
      'Almoço': mealTotals['Almoço'] / 7,
      'Lanche da Tarde': mealTotals['Lanche da Tarde'] / 7,
      'Jantar': mealTotals['Jantar'] / 7
    };

    return {
      dayTotals,
      mealTotals,
      mediaRefeicaoDiaria,
      totalSemana,
      projetado30Dias
    };
  }

  // --- UI RENDER ROUTER ---
  function renderApp() {
    renderHeader();
    renderTabNavigation();

    const container = document.getElementById('main-content');
    if (!container) return;

    switch (state.activeTab) {
      case 'panela':
        renderKitchenMode(container);
        break;
      case 'cardapio':
        renderMenuMode(container);
        break;
      case 'compras':
        renderWeeklyShoppingMode(container);
        break;
      case 'giro':
        renderCascadeMode(container);
        break;
      case 'higiene':
        renderHygieneMode(container);
        break;
      case 'ingredientes':
        renderIngredientsCatalog(container);
        break;
      case 'historico':
        renderCycleHistoryMode(container);
        break;
      case 'config':
        renderConfigMode(container);
        break;
      default:
        renderKitchenMode(container);
    }
  }

  // --- HEADER & NAVIGATION ---
  function renderHeader() {
    const el = document.getElementById('app-header');
    if (!el) return;

    el.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" onclick="window.app.switchTab('panela')">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
            🍳
          </div>
          <div>
            <h1 class="font-bold text-base sm:text-lg leading-tight tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
              Planejamento Familiar Pro
              <span class="text-[10px] uppercase font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 hidden xs:inline">Novembro 2026</span>
            </h1>
            <p class="text-xs text-slate-400 hidden sm:block">Cardápio Inteligente, Panela & Compras de 5 Semanas</p>
          </div>
        </div>

        <div class="flex items-center space-x-1.5 sm:space-x-2">
          <!-- Active Week Selector Pill -->
          <button onclick="window.app.openWeekSelectorModal()" 
                  class="flex items-center space-x-1 sm:space-x-1.5 bg-blue-950/60 hover:bg-blue-900/60 active:scale-95 text-blue-300 border border-blue-700/60 px-2.5 sm:px-3 py-1.5 rounded-full shadow-sm transition text-xs sm:text-sm font-semibold">
            <span>📅</span>
            <span>Semana <strong class="text-blue-400 font-black">${state.activeWeek}</strong></span>
            <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          <!-- Family Member Selector Button -->
          <button onclick="window.app.openFamilyModal()" 
                  class="flex items-center space-x-1 sm:space-x-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 px-2.5 sm:px-3 py-1.5 rounded-full shadow-sm transition text-xs sm:text-sm font-medium">
            <span>👨‍👩‍👧‍👦</span>
            <span><strong class="text-emerald-400 font-bold">${state.familyMembers}</strong></span>
            <span class="text-[10px] text-slate-400 hidden xs:inline">pessoas</span>
          </button>

          <!-- Cloud Sync Pill -->
          <button onclick="window.app.switchTab('config')" 
                  id="cloud-sync-pill"
                  title="Status da Sincronização em Nuvem (Supabase)"
                  class="flex items-center space-x-1 sm:space-x-1.5 ${state.supabaseConfig?.key ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' : 'bg-slate-800 text-slate-400 border-slate-700'} hover:bg-slate-700 active:scale-95 border px-2 sm:px-2.5 py-1.5 rounded-full shadow-sm transition text-xs cursor-pointer">
            <span>${state.supabaseConfig?.key ? '☁️' : '⚪'}</span>
            <span class="text-[11px] font-semibold hidden md:inline">${state.supabaseConfig?.key ? 'Nuvem Conectada' : 'Nuvem Off'}</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderTabNavigation() {
    const topNav = document.getElementById('top-navigation');
    const bottomNav = document.getElementById('bottom-navigation');

    const tabs = [
      { id: 'panela', label: 'Na Panela Hoje', icon: '🍳', short: 'Panela' },
      { id: 'cardapio', label: 'Cardápio Semanal', icon: '📅', short: 'Cardápio' },
      { id: 'compras', label: 'Compras da Semana', icon: '🛒', short: 'Compras' },
      { id: 'giro', label: 'Giro de 5 Semanas', icon: '📊', short: '5 Semanas' },
      { id: 'historico', label: 'Histórico & Evolução', icon: '📊', short: 'Histórico' },
      { id: 'higiene', label: 'Higiene & Limpeza', icon: '🧼', short: 'Higiene' },
      { id: 'ingredientes', label: 'Ingredientes', icon: '🌾', short: 'Catálogo' },
      { id: 'config', label: 'Configurações', icon: '⚙️', short: 'Ajustes' },
    ];

    if (topNav) {
      topNav.innerHTML = `
        <div class="max-w-6xl mx-auto px-4 overflow-x-auto no-scrollbar flex space-x-2 py-2 border-b border-slate-800">
          ${tabs.map((tab) => `
            <button onclick="window.app.switchTab('${tab.id}')"
                    class="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition flex items-center space-x-1.5 ${state.activeTab === tab.id ? 'tab-active' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
              <span>${tab.icon}</span>
              <span>${tab.label}</span>
            </button>
          `).join('')}
        </div>
      `;
    }

    if (bottomNav) {
      const mobileTabs = tabs.filter(t => ['panela', 'cardapio', 'compras', 'historico', 'higiene', 'ingredientes'].includes(t.id));
      bottomNav.innerHTML = `
        <div class="flex justify-around items-center py-2 px-1 safe-bottom bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
          ${mobileTabs.map((tab) => `
            <button onclick="window.app.switchTab('${tab.id}')"
                    class="flex flex-col items-center justify-center flex-1 py-1 transition ${state.activeTab === tab.id ? 'text-emerald-400 font-bold' : 'text-slate-400'}">
              <span class="text-xl mb-0.5">${tab.icon}</span>
              <span class="text-[10px] leading-tight">${tab.short}</span>
            </button>
          `).join('')}
        </div>
      `;
    }
  }

  // --- SCREEN 1: NA PANELA HOJE (KITCHEN MODE) ---
  function renderKitchenMode(container) {
    const summary = getMenuFinancialSummary(state.activeWeek);
    const dayItems = getActiveMenuItems(state.activeWeek).filter((i) => i.dia_nome === state.activeDay);
    const dayCost = summary.dayTotals[state.activeDay] || 0;

    const mealIcons = {
      'Café da Manhã': '☕',
      'Almoço': '🍲',
      'Lanche da Tarde': '🥪',
      'Jantar': '🍽️'
    };

    const currentMeal = state.activeKitchenMeal || 'Almoço';
    const mealsToDisplay = currentMeal === 'todas' ? MEALS_ORDER : [currentMeal];

    // Helpers para navegação anterior/próxima refeição no carrossel
    const currentMealIdx = MEALS_ORDER.indexOf(currentMeal);
    const prevMeal = currentMealIdx > 0 ? MEALS_ORDER[currentMealIdx - 1] : MEALS_ORDER[MEALS_ORDER.length - 1];
    const nextMeal = currentMealIdx < MEALS_ORDER.length - 1 ? MEALS_ORDER[currentMealIdx + 1] : MEALS_ORDER[0];

    container.innerHTML = `
      <div class="space-y-5 pb-24">
        <!-- Hero Banner Kitchen Mode -->
        <div class="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Modo Cozinha Ativo
                </span>
                <span class="text-xs text-blue-400 font-bold bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-700/40">
                  Semana ${state.activeWeek}
                </span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Na Panela Hoje: <span class="text-emerald-400">${state.activeDay}</span>
              </h2>
              <p class="text-xs sm:text-sm text-slate-300 mt-0.5">
                Família de <strong>${state.familyMembers} pessoa(s)</strong> • Custo hoje: <strong class="text-emerald-300">R$ ${dayCost.toFixed(2).replace('.', ',')}</strong>
              </p>
            </div>
            
            <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button onclick="window.app.openWeekSelectorModal()"
                      class="px-3 py-1.5 rounded-xl bg-blue-950/70 hover:bg-blue-900/70 text-blue-300 border border-blue-800 text-xs font-semibold flex items-center gap-1.5 transition">
                <span>🗓️</span> <span>Semana ${state.activeWeek}</span>
              </button>
              <button onclick="window.app.openDuplicateMealModal('${state.activeDay}')"
                      class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition">
                <span>📋</span> <span>Copiar Dia</span>
              </button>
            </div>
          </div>

          <!-- Day Switcher Tabs -->
          <div class="flex space-x-1.5 mt-4 overflow-x-auto no-scrollbar pb-0.5">
            ${getOrderedDaysOfWeek().map((day) => {
              const isToday = day === getTodayName();
              const isSelected = day === state.activeDay;
              return `
                <button onclick="window.app.setActiveDay('${day}')"
                        class="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition flex flex-col items-center flex-1 min-w-[62px] ${isSelected ? 'day-tab-active' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'}">
                  <span>${day.slice(0, 3)}</span>
                  ${isToday ? '<span class="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">Hoje</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Horizontal Meal Carousel / Selector Bar -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs px-1">
            <span class="text-slate-400 font-semibold flex items-center gap-1.5">
              <span>🍽️</span> <span>Selecione a Refeição:</span>
            </span>
            ${currentMeal !== 'todas' ? `
              <span class="text-slate-400 text-[11px]">
                Refeição ${currentMealIdx + 1} de 4
              </span>
            ` : ''}
          </div>

          <div class="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            ${MEALS_ORDER.map((mealName) => {
              const isSelected = currentMeal === mealName;
              const mealItems = dayItems.filter((i) => i.refeicao === mealName);
              const dishKey = `${state.activeWeek}_${state.activeDay}_${mealName}`;
              const dishName = state.dishNames?.[dishKey];
              const mealCost = mealItems.reduce((acc, cur) => acc + (cur.custo || 0), 0);

              return `
                <button onclick="window.app.setActiveKitchenMeal('${mealName}')"
                        class="flex-1 min-w-[125px] sm:min-w-[145px] p-2.5 rounded-2xl border transition flex flex-col justify-between text-left ${isSelected ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/50' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'}">
                  <div class="flex items-center justify-between w-full">
                    <span class="text-xl">${mealIcons[mealName] || '🍴'}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 border border-slate-700/60'}">
                      ${mealItems.length} itens
                    </span>
                  </div>
                  <div class="mt-2 w-full">
                    <span class="font-extrabold text-xs sm:text-sm block leading-tight truncate">${mealName}</span>
                    <span class="text-[11px] font-bold text-emerald-400 block mt-0.5">R$ ${mealCost.toFixed(2).replace('.', ',')}</span>
                    <span class="text-[10px] text-slate-400 truncate block mt-0.5 font-medium ${dishName ? 'text-emerald-300 font-bold' : ''}">
                      ${dishName ? `🍽️ ${dishName}` : '+ Nome do prato'}
                    </span>
                  </div>
                </button>
              `;
            }).join('')}

            <!-- Button to view all 4 meals vertically -->
            <button onclick="window.app.setActiveKitchenMeal('todas')"
                    class="shrink-0 px-3.5 py-2.5 rounded-2xl border transition flex flex-col items-center justify-center text-center ${currentMeal === 'todas' ? 'bg-emerald-950/90 border-emerald-500 text-white ring-1 ring-emerald-500/50 shadow-lg' : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'}">
              <span class="text-xl">📋</span>
              <span class="text-[11px] font-extrabold mt-1 whitespace-nowrap">Todas</span>
              <span class="text-[9px] text-slate-400 whitespace-nowrap">as 4</span>
            </button>
          </div>
        </div>

        <!-- Quick Stepper Arrows (visible in single meal mode) -->
        ${currentMeal !== 'todas' ? `
          <div class="flex items-center justify-between bg-slate-900/70 border border-slate-800/80 rounded-xl px-3 py-2 text-xs">
            <button onclick="window.app.setActiveKitchenMeal('${prevMeal}')"
                    class="flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold transition px-2 py-1 rounded-lg hover:bg-slate-800">
              <span>←</span> <span>${mealIcons[prevMeal]}</span> <span class="hidden sm:inline">${prevMeal}</span>
            </button>
            
            <span class="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <span>${mealIcons[currentMeal]}</span> <span>${currentMeal}</span>
            </span>

            <button onclick="window.app.setActiveKitchenMeal('${nextMeal}')"
                    class="flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold transition px-2 py-1 rounded-lg hover:bg-slate-800">
              <span class="hidden sm:inline">${nextMeal}</span> <span>${mealIcons[nextMeal]}</span> <span>→</span>
            </button>
          </div>
        ` : ''}

        <!-- Meals Cards (Single active meal in focus OR all 4) -->
        <div class="${currentMeal === 'todas' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6' : 'space-y-4'}">
          ${mealsToDisplay.map((mealName) => {
            const mealItems = dayItems.filter((i) => i.refeicao === mealName);
            const mealCost = mealItems.reduce((acc, cur) => acc + (cur.custo || 0), 0);
            const dishKey = `${state.activeWeek}_${state.activeDay}_${mealName}`;
            const dishName = state.dishNames?.[dishKey];

            return `
              <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                <!-- Meal Header -->
                <div class="px-4 sm:px-5 py-3.5 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between gap-2">
                  <div class="flex items-center space-x-2.5">
                    <span class="text-2xl">${mealIcons[mealName] || '🍴'}</span>
                    <div>
                      <h3 class="font-bold text-base text-white leading-tight">${mealName}</h3>
                      <span class="text-xs text-slate-400 font-medium">${mealItems.length} ingredientes</span>
                    </div>
                  </div>

                  <div class="text-right">
                    <span class="text-xs text-slate-400 block font-medium">Subtotal</span>
                    <span class="font-extrabold text-base text-emerald-400 block">R$ ${mealCost.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <!-- Custom Dish Name Banner / Edit Option -->
                <div class="px-4 sm:px-5 py-2.5 bg-emerald-950/30 border-b border-emerald-900/30 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="text-sm">🍲</span>
                    ${dishName ? `
                      <div class="min-w-0 flex-1">
                        <span class="text-[10px] text-emerald-400 block font-semibold uppercase tracking-wider">Prato do Dia:</span>
                        <span class="text-xs sm:text-sm font-black text-white block truncate leading-tight">${dishName}</span>
                      </div>
                    ` : `
                      <span class="text-xs text-slate-400 italic truncate">Nenhum prato definido para este ${mealName.toLowerCase()}</span>
                    `}
                  </div>

                  <button onclick="window.app.openEditDishNameModal('${state.activeWeek}', '${state.activeDay}', '${mealName}')"
                          class="shrink-0 px-2.5 py-1 rounded-lg ${dishName ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-600/40'} text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                          title="Definir nome da receita ou prato">
                    <span>✏️</span> <span>${dishName ? 'Alterar' : '+ Nome do Prato'}</span>
                  </button>
                </div>

                <!-- Ingredients List -->
                <div class="p-3 sm:p-4 space-y-2.5 flex-1 overflow-y-auto">
                  ${mealItems.length === 0 ? `
                    <div class="text-center py-8 text-slate-500 text-xs">
                      Nenhum ingrediente adicionado neste ${mealName.toLowerCase()}.
                    </div>
                  ` : mealItems.map((item) => {
                    const ing = getIngredientByName(item.ingrediente_nome);
                    return `
                      <div onclick="window.app.openEditMealItemModal('${item.id}', ${state.activeWeek})"
                           class="bg-slate-800/50 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer transition group">
                        <div class="space-y-1 flex-1 pr-3">
                          <div class="flex items-center gap-2">
                            <span class="font-semibold text-white text-sm sm:text-base group-hover:text-emerald-300 transition">
                              ${item.ingrediente_nome}
                            </span>
                            ${ing ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryBadgeClass(ing.categoria)}">${ing.categoria}</span>` : ''}
                          </div>
                          
                          <div class="flex items-center flex-wrap gap-2 pt-0.5">
                            <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs sm:text-sm px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                              <span>🥄 Medida:</span>
                              <strong>${item.medida_caseira_str || 'Conforme receita'}</strong>
                            </span>
                            
                            <span class="text-xs text-slate-400">
                              Total Família: <strong class="text-slate-200">${item.qtd_total_familia} ${item.medida}</strong>
                              (${item.porcao_pessoa} ${item.medida}/pessoa)
                            </span>
                          </div>
                        </div>

                        <div class="flex items-center space-x-2">
                          <span class="text-xs sm:text-sm font-semibold text-slate-300 whitespace-nowrap">
                            R$ ${(item.custo || 0).toFixed(2).replace('.', ',')}
                          </span>
                          <div class="w-7 h-7 rounded-lg bg-slate-700/60 group-hover:bg-emerald-500 group-hover:text-slate-900 flex items-center justify-center text-slate-400 transition">
                            ✏️
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <!-- Footer Actions -->
                <div class="p-3 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button onclick="window.app.openAddMealItemModal('${state.activeDay}', '${mealName}', ${state.activeWeek})"
                          class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition">
                    <span>+ Adicionar Ingrediente</span>
                  </button>

                  <button onclick="window.app.openDuplicateMealModal('${state.activeDay}', '${mealName}')"
                          class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition">
                    Copiar Refeição
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderMenuMode(container) {
    const summary = getMenuFinancialSummary(state.activeWeek);
    const dayItems = getActiveMenuItems(state.activeWeek).filter((i) => i.dia_nome === state.activeDay);
    const dayCost = summary.dayTotals[state.activeDay] || 0;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Week Selector Header in Cardápio -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Cardápio Personalizado por Semana
                </span>
                <span class="text-xs text-slate-400">Alimenta diretamente as compras da semana</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                Cardápio: <span class="text-blue-400">Semana ${state.activeWeek}</span>
              </h2>
            </div>

            <!-- Action: Replicate Week Menu to other weeks & Sync -->
            <div class="flex items-center gap-2 flex-wrap">
              <button onclick="window.app.resetToOfficialMenu()"
                      class="px-3.5 py-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/50 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
                      title="Sincroniza todas as 5 semanas com os 176 itens oficiais dos prints">
                <span>🔄</span> <span>Sincronizar Oficial</span>
              </button>
              <button onclick="window.app.openCopyWeekMenuModal(${state.activeWeek})"
                      class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition">
                <span>📋</span> <span>Copiar Semana ${state.activeWeek} p/ Outras</span>
              </button>
            </div>
          </div>

<!-- Week Switcher Tabs with Date Range -->
          <div class="flex items-center gap-2">
            <div class="flex-1 min-w-0 flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
              ${[1, 2, 3, 4, 5].map((w) => {
                const isSelected = w === state.activeWeek;
                const dRange = getWeekDateRange(w);
                return `
                  <button onclick="window.app.setActiveWeek(${w})"
                          class="flex-1 min-w-[85px] py-2 px-2.5 rounded-xl text-center transition flex flex-col items-center ${isSelected ? 'tab-active' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                    <span class="text-xs sm:text-sm font-bold">Semana ${w}</span>
                    <span class="text-[10px] opacity-80 whitespace-nowrap mt-0.5">${dRange.label}</span>
                  </button>
                `;
              }).join('')}
            </div>
            <button onclick="window.app.openCycleConfigModal()"
                    class="shrink-0 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Ajustar 1º dia da semana e datas do calendário">
              <span>📅</span> <span class="hidden sm:inline">Ciclo</span>
            </button>
          </div>
        </div>

        <!-- Top Financial Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block mb-1">Custo Total (${state.activeDay})</span>
            <span class="text-xl sm:text-2xl font-black text-white">R$ ${dayCost.toFixed(2).replace('.', ',')}</span>
            <span class="text-[11px] text-slate-400 block mt-1">Semana ${state.activeWeek}</span>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block mb-1">Total Geral da Semana ${state.activeWeek}</span>
            <span class="text-xl sm:text-2xl font-black text-emerald-400">R$ ${summary.totalSemana.toFixed(2).replace('.', ',')}</span>
            <span class="text-[11px] text-slate-400 block mt-1">Custo real consumido (7 dias)</span>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block mb-1">Projetado para 30 Dias</span>
            <span class="text-xl sm:text-2xl font-black text-amber-400">R$ ${summary.projetado30Dias.toFixed(2).replace('.', ',')}</span>
            <span class="text-[11px] text-slate-400 block mt-1">(Total_Semana / 7) * 30</span>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <span class="text-xs text-slate-400 font-medium block mb-1">Média Diária / Refeição</span>
            <div class="text-[11px] text-slate-300 space-y-0.5 mt-1">
              <div>Café: <strong>R$ ${summary.mediaRefeicaoDiaria['Café da Manhã'].toFixed(2).replace('.', ',')}</strong></div>
              <div>Almoço: <strong>R$ ${summary.mediaRefeicaoDiaria['Almoço'].toFixed(2).replace('.', ',')}</strong></div>
              <div>Jantar: <strong>R$ ${summary.mediaRefeicaoDiaria['Jantar'].toFixed(2).replace('.', ',')}</strong></div>
            </div>
          </div>
        </div>

        <!-- Clean Day Tabs -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div class="flex items-center justify-between mb-2 px-1">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtrar Dia da Semana</span>
            <span class="text-xs text-emerald-400 font-medium">Toque para ver e editar as refeições</span>
          </div>
          <div class="flex space-x-1.5 overflow-x-auto no-scrollbar">
            ${getOrderedDaysOfWeek().map((day) => {
              const isSelected = day === state.activeDay;
              const subtotal = summary.dayTotals[day] || 0;
              return `
                <button onclick="window.app.setActiveDay('${day}')"
                        class="flex-1 min-w-[76px] py-2 px-2 rounded-xl text-center transition flex flex-col items-center ${isSelected ? 'day-tab-active' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'}">
                  <span class="text-xs font-bold">${day}</span>
                  <span class="text-[10px] mt-0.5 opacity-90">R$ ${subtotal.toFixed(0)}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4 Meal Cards / Accordions for Selected Day -->
        <div class="space-y-4">
          ${MEALS_ORDER.map((mealName) => {
            const mealItems = dayItems.filter((i) => i.refeicao === mealName);
            const mealCost = mealItems.reduce((acc, cur) => acc + (cur.custo || 0), 0);
            
            const dishKey = `${state.activeWeek}_${state.activeDay}_${mealName}`;
            const dishName = state.dishNames?.[dishKey];

            return `
              <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                <div class="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center space-x-2 flex-wrap">
                    <span class="font-bold text-base text-white">${mealName}</span>
                    ${dishName ? `
                      <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 font-semibold truncate max-w-[200px]">
                        🍽️ ${dishName}
                      </span>
                    ` : ''}
                    <button onclick="window.app.openEditDishNameModal('${state.activeWeek}', '${state.activeDay}', '${mealName}')"
                            class="text-xs text-slate-400 hover:text-emerald-400 p-1" title="Editar nome do prato">
                      ✏️
                    </button>
                    <span class="text-xs text-slate-400">(${mealItems.length} itens)</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="text-sm font-bold text-emerald-400">R$ ${mealCost.toFixed(2).replace('.', ',')}</span>
                    <button onclick="window.app.openAddMealItemModal('${state.activeDay}', '${mealName}', ${state.activeWeek})"
                            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg transition shadow-sm">
                      + Item
                    </button>
                    <button onclick="window.app.duplicateSingleMeal('${state.activeDay}', '${mealName}', ${state.activeWeek})"
                            class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700 transition">
                      Copiar
                    </button>
                  </div>
                </div>

                <div class="divide-y divide-slate-800/60">
                  ${mealItems.length === 0 ? `
                    <div class="p-4 text-center text-slate-500 text-sm">
                      Nenhum ingrediente. Clique em "+ Item" para adicionar.
                    </div>
                  ` : mealItems.map((item) => {
                    const ing = getIngredientByName(item.ingrediente_nome);
                    return `
                      <div onclick="window.app.openEditMealItemModal('${item.id}', ${state.activeWeek})"
                           class="p-3.5 hover:bg-slate-800/50 flex items-center justify-between cursor-pointer transition gap-3">
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <span class="font-semibold text-sm sm:text-base text-white">${item.ingrediente_nome}</span>
                            ${ing ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryBadgeClass(ing.categoria)}">${ing.categoria}</span>` : ''}
                          </div>
                          <div class="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Porção: <strong>${item.porcao_pessoa} ${item.medida}</strong>/pessoa</span>
                            <span>Total Família: <strong class="text-slate-200">${item.qtd_total_familia} ${item.medida}</strong></span>
                            <span class="text-emerald-400 font-medium">Panela: <strong>${item.medida_caseira_str || '-'}</strong></span>
                          </div>
                        </div>

                        <div class="text-right flex items-center space-x-3">
                          <span class="font-bold text-sm text-slate-200">
                            R$ ${(item.custo || 0).toFixed(2).replace('.', ',')}
                          </span>
                          <span class="text-xs text-slate-500">›</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- SCREEN 3: COMPRAS DA SEMANA (SUPERMARKET MODE - ONE HAND UX) ---
  
  // Helper: Renderiza o botão de virada com proteção de segurança
  function renderTurnoverButton(week) {
    const isCompleted = !!state.completedTurnovers?.[week];

    // Se já foi concluída: botão de segurança consolidado
    if (isCompleted) {
      if (week === 5) {
        return `
          <button onclick="window.app.openCycleTurnoverModal()"
                  class="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/60 active:scale-95 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm">
            <span>🏆</span> <span>Ciclo Concluído • Novo Ciclo</span>
          </button>
        `;
      }
      return `
        <button onclick="window.app.promptReopenTurnover(${week})"
                class="px-3 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/50 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
                title="Virada da Semana ${week} já consolidada. Clique para reabrir caso necessário.">
          <span>✓</span> <span>Semana ${week} Concluída</span>
        </button>
      `;
    }

    // Se for semana futura (bloqueada até concluir as anteriores)
    if (week > state.activeWeek) {
      return `
        <button disabled
                class="px-3 py-2 rounded-xl bg-slate-800/40 text-slate-500 border border-slate-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-60"
                title="Conclua a Semana ${state.activeWeek} antes de virar esta semana">
          <span>🔒</span> <span>Virada Bloqueada</span>
        </button>
      `;
    }

    // Se for a última semana (Semana 5)
    if (week === 5) {
      return `
        <button onclick="window.app.openCycleTurnoverModal()"
                class="px-3.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 border border-amber-600/60 active:scale-95 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm">
          <span>🏆</span> <span>Concluir Ciclo de 5 Semanas</span>
        </button>
      `;
    }
    // Semana ativa pronta para virar (Semana X -> X+1)
    return `
      <button onclick="window.app.openTurnoverModal(${week})"
              class="px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-600/50 active:scale-95 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Conferir estoque e avançar para a Semana ${week + 1}">
        <span>🔄</span> <span>Virar p/ Semana ${week + 1}</span>
      </button>
    `;
  }

  function setShoppingViewFilter(mode) {
    state.shoppingViewFilter = mode;
    saveState();
    renderApp();
  }

  function renderWeeklyShoppingMode(container) {
    const cascade = calculate5WeeksCascade();
    const currentWeekIdx = state.activeWeek; // 1 to 5
    const currentFilter = state.shoppingViewFilter || 'all'; // 'all' (Compras + Em Estoque) | 'to_buy' (Apenas a Comprar)

    // Filter items to buy in this week (qtd_comprar > 0)
    const itemsToBuy = [];
    const itemsInStock = [];

    cascade.forEach((row) => {
      const wData = row.weeks[currentWeekIdx - 1];
      if (!wData) return;

      if (wData.qtd_comprar > 0) {
        const adj = state.adjustedPrices[`${currentWeekIdx}_cascade_${row.ingrediente}`] || state.adjustedPrices[`${currentWeekIdx}_${row.ingrediente}`];
        const finalPrice = adj?.price !== undefined ? adj.price : wData.custo_estimado;
        const finalQty = adj?.qty !== undefined ? adj.qty : wData.qtd_comprar;

        itemsToBuy.push({
          id: `cascade_${row.ingrediente}`,
          nome: row.ingrediente,
          categoria: row.categoria,
          tipo_compra: row.tipo_compra,
          tamanho_pacote: row.tamanho_pacote,
          medida: row.medida,
          qtd_comprar: finalQty,
          custo_estimado: finalPrice,
          preco_pacote_original: row.preco_pacote,
          isExtra: false
        });
      } else if (wData.consumo_semanal > 0) {
        // Item utilizado nas receitas desta semana, mas coberto 100% pelo estoque existente
        itemsInStock.push({
          id: `instock_${row.ingrediente}`,
          nome: row.ingrediente,
          categoria: row.categoria,
          tipo_compra: row.tipo_compra,
          tamanho_pacote: row.tamanho_pacote,
          medida: row.medida,
          consumo_semanal: wData.consumo_semanal,
          estoque_disponivel: wData.estoque_disponivel,
          sobra_proxima_semana: wData.sobra_proxima_semana,
          isCovered: true
        });
      }
    });

    // Add hygiene items for this week
    const hygieneThisWeek = state.hygieneItems.filter(h => h.semana_compra === `Semana ${currentWeekIdx}`);
    hygieneThisWeek.forEach((h) => {
      const cost = h.quantidade * h.valor_unitario;
      itemsToBuy.push({
        id: `hyg_${h.id}`,
        nome: h.nome_item,
        categoria: 'Higiene & Limpeza',
        tipo_compra: 'Unidade',
        tamanho_pacote: 1,
        medida: 'un',
        qtd_comprar: h.quantidade,
        custo_estimado: cost,
        preco_pacote_original: h.valor_unitario,
        isExtra: false
      });
    });

    // Add extra items added for this week
    const extraThisWeek = state.extraItems.filter(e => e.week === currentWeekIdx);
    extraThisWeek.forEach((e) => {
      itemsToBuy.push({
        id: `extra_${e.id}`,
        nome: e.nome,
        categoria: e.categoria || 'Extra',
        tipo_compra: 'Unidade',
        tamanho_pacote: 1,
        medida: 'un',
        qtd_comprar: e.qtd,
        custo_estimado: e.preco,
        preco_pacote_original: e.preco,
        isExtra: true
      });
    });

    // Calculate totals (only active shopping items)
    let totalPrevisto = 0;
    let totalCarrinho = 0;
    let countCarrinho = 0;

    itemsToBuy.forEach((item) => {
      totalPrevisto += item.custo_estimado;
      const isChecked = !!state.cartChecked[`${currentWeekIdx}_${item.id}`];
      if (isChecked) {
        totalCarrinho += item.custo_estimado;
        countCarrinho++;
      }
    });

    const progressPct = itemsToBuy.length > 0 ? Math.round((countCarrinho / itemsToBuy.length) * 100) : 0;

    // Group items by Supermarket Department / Sector
    const sectors = {
      'Açougue e Ovos': { toBuy: [], inStock: [] },
      'Hortifrúti e Polpas': { toBuy: [], inStock: [] },
      'Mercearia e Grãos': { toBuy: [], inStock: [] },
      'Laticínios e Padaria': { toBuy: [], inStock: [] },
      'Higiene e Limpeza': { toBuy: [], inStock: [] },
      'Outros / Extras': { toBuy: [], inStock: [] }
    };

    function getSectorKey(categoria) {
      if (categoria === 'Carnes/Ovos') return 'Açougue e Ovos';
      if (categoria === 'Hortifrúti') return 'Hortifrúti e Polpas';
      if (categoria === 'Mercearia') return 'Mercearia e Grãos';
      if (categoria === 'Laticínios/Padaria') return 'Laticínios e Padaria';
      if (categoria === 'Higiene & Limpeza' || categoria === 'Higiene' || categoria === 'Limpeza' || categoria === 'Bebê / Fraldas') return 'Higiene e Limpeza';
      return 'Outros / Extras';
    }

    itemsToBuy.forEach((item) => {
      const key = getSectorKey(item.categoria);
      sectors[key].toBuy.push(item);
    });

    itemsInStock.forEach((item) => {
      const key = getSectorKey(item.categoria);
      sectors[key].inStock.push(item);
    });

    const totalToBuyCount = itemsToBuy.length;
    const totalInStockCount = itemsInStock.length;

    container.innerHTML = `
      <div class="space-y-5 pb-24">
        <!-- Week Selector & Actions Header -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Modo Supermercado</span>
                <span class="text-xs text-slate-400">Cardápio da Semana ${currentWeekIdx}</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-white mt-1">
                Compras: <span class="text-emerald-400">Semana ${currentWeekIdx}</span>
              </h2>
            </div>

            <!-- Top Action Buttons -->
            <div class="flex items-center gap-2 flex-wrap">
              <button onclick="window.app.openWhatsAppModal(${currentWeekIdx})"
                      class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition">
                <span class="text-base">📱</span>
                <span>WhatsApp</span>
              </button>

              ${renderTurnoverButton(currentWeekIdx)}

              <button onclick="window.app.openAddExtraItemModal(${currentWeekIdx})"
                      class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1 transition">
                <span>+ Avulso</span>
              </button>

              <button onclick="window.app.openStockExplanationModal()"
                      class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition" title="Como funciona o estoque?">
                ℹ️
              </button>
            </div>
          </div>

          <!-- Horizontal 5-Week Tabs with Date Ranges -->
          <div class="flex items-center gap-2">
            <div class="flex-1 min-w-0 flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
              ${[1, 2, 3, 4, 5].map((w) => {
                const isSelected = w === currentWeekIdx;
                const dRange = getWeekDateRange(w);
                return `
                  <button onclick="window.app.setActiveWeek(${w})"
                          class="flex-1 min-w-[85px] py-2 px-2.5 rounded-xl text-center transition flex flex-col items-center ${isSelected ? 'tab-active' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                    <span class="text-xs sm:text-sm font-bold">Semana ${w}</span>
                    <span class="text-[10px] opacity-80 whitespace-nowrap mt-0.5">${dRange.label}</span>
                  </button>
                `;
              }).join('')}
            </div>
            <button onclick="window.app.openCycleConfigModal()"
                    class="shrink-0 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Ajustar 1º dia da semana e datas do calendário">
              <span>🗓️</span> <span class="hidden sm:inline">Ciclo</span>
            </button>
          </div>

          <!-- Quick Bulk Check / Uncheck Bar & Cart Financial Summary -->
          <div class="pt-3 mt-3 border-t border-slate-800 space-y-3">
            <!-- Resumo Financeiro da Semana & Carrinho -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                <span class="text-slate-400 block text-[11px] mb-0.5 font-medium">Total Previsto da Semana:</span>
                <span class="text-base sm:text-lg font-black text-white">R$ ${totalPrevisto.toFixed(2).replace('.', ',')}</span>
                <span class="text-[10px] text-slate-400 block mt-0.5">${totalToBuyCount} itens a comprar</span>
              </div>

              <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 shadow-sm">
                <span class="text-emerald-300 block text-[11px] mb-0.5 font-medium">No Carrinho (Marcados):</span>
                <span class="text-base sm:text-lg font-black text-emerald-400">R$ ${totalCarrinho.toFixed(2).replace('.', ',')}</span>
                <span class="text-[10px] text-emerald-400/80 block mt-0.5">${countCarrinho} de ${totalToBuyCount} itens</span>
              </div>

              <div class="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-center shadow-sm">
                <div class="flex justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                  <span>Progresso do Carrinho</span>
                  <span class="text-emerald-400 font-bold">${progressPct}%</span>
                </div>
                <div class="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full transition-all duration-300"
                       style="width: ${progressPct}%"></div>
                </div>
              </div>
            </div>

            <!-- Botões Rápidos Marcar/Desmarcar -->
            <div class="flex items-center justify-between text-xs pt-1">
              <span class="text-slate-400">
                Itens Marcados: <strong class="text-emerald-400 font-bold">${countCarrinho}</strong> de <strong>${totalToBuyCount}</strong>
              </span>
              <div class="flex items-center space-x-2">
                <button onclick="window.app.checkAllCartItems(${currentWeekIdx})"
                        class="px-3 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-semibold transition flex items-center gap-1">
                  <span>✓</span> <span>Marcar Todos</span>
                </button>
                <button onclick="window.app.uncheckAllCartItems(${currentWeekIdx})"
                        class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition flex items-center gap-1">
                  <span>✕</span> <span>Desmarcar Todos</span>
                </button>
              </div>
            </div>

            <!-- Seletor de Modo de Exibição (Todos vs Foco Mercado) -->
            <div class="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="text-slate-400 font-semibold flex items-center gap-1.5">
                <span>👁️</span> <span>Exibição da Lista:</span>
              </span>
              <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button onclick="window.app.setShoppingViewFilter('all')"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${currentFilter === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                  <span>📋</span> <span>Todos (${totalToBuyCount} a comprar + ${totalInStockCount} em estoque)</span>
                </button>
                <button onclick="window.app.setShoppingViewFilter('to_buy')"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${currentFilter === 'to_buy' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                  <span>🛒</span> <span>Foco Mercado (${totalToBuyCount} a comprar)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Banner de Herança de Estoque (se a semana anterior já fez virada) -->
        ${(state.completedTurnovers?.[currentWeekIdx - 1]) ? `
          <div class="p-3.5 bg-emerald-950/40 border border-emerald-600/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-200 shadow-sm">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">📦</span>
              <div>
                <strong class="text-emerald-300 block">Estoque Inicial Atualizado</strong>
                <span>Saldos herdados da conferência da <strong>Semana ${currentWeekIdx - 1}</strong>.</span>
              </div>
            </div>
            <span class="text-[11px] font-medium text-emerald-400 bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-700/50 whitespace-nowrap">
              ${state.completedTurnovers[currentWeekIdx - 1].formattedDate || 'Consolidado'}
            </span>
          </div>
        ` : ''}

        <!-- Informative Banner when ALL items are covered -->
        ${totalToBuyCount === 0 && totalInStockCount > 0 ? `
          <div class="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-5 text-center space-y-2 shadow-sm">
            <span class="text-3xl">🛡️</span>
            <h3 class="text-base sm:text-lg font-bold text-white">Todos os ${totalInStockCount} ingredientes da Semana ${currentWeekIdx} estão 100% cobertos pelo seu estoque!</h3>
            <p class="text-xs text-emerald-300 max-w-lg mx-auto">
              Você já possui quantidade suficiente de tudo em sua despensa para cobrir as refeições desta semana. Nenhuma compra é necessária no supermercado!
            </p>
          </div>
        ` : ''}

        <!-- Supermarket List by Sector -->
        ${totalToBuyCount === 0 && (currentFilter === 'to_buy' || totalInStockCount === 0) ? `
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <span class="text-4xl">🎉</span>
            <h3 class="text-lg font-bold text-white">Nenhum item pendente para a Semana ${currentWeekIdx}!</h3>
            <p class="text-sm text-slate-400 max-w-md mx-auto">
              O estoque da sua despensa cobre todo o consumo previsto do cardápio da Semana ${currentWeekIdx}.
            </p>
          </div>
        ` : Object.keys(sectors).map((sectorName) => {
          const { toBuy, inStock } = sectors[sectorName];
          const showInStock = currentFilter === 'all' && inStock.length > 0;
          if (toBuy.length === 0 && !showInStock) return '';

          const sectorSubtotal = toBuy.reduce((sum, item) => sum + (item.custo_estimado || 0), 0);
          const sectorCheckedCount = toBuy.filter((item) => !!state.cartChecked[`${currentWeekIdx}_${item.id}`]).length;
          const sectorCheckedTotal = toBuy.filter((item) => !!state.cartChecked[`${currentWeekIdx}_${item.id}`]).reduce((sum, item) => sum + (item.custo_estimado || 0), 0);

          const sectorIcons = {
            'Açougue e Ovos': '🥩',
            'Hortifrúti e Polpas': '🥬',
            'Mercearia e Grãos': '🌾',
            'Laticínios e Padaria': '🧀',
            'Higiene e Limpeza': '🧼',
            'Outros / Extras': '📦'
          };

          return `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
              <div class="px-4 py-3 bg-slate-800/90 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <span class="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <span class="text-base">${sectorIcons[sectorName] || '🛒'}</span>
                  <span>${sectorName}</span>
                </span>
                <div class="text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <span class="text-xs text-slate-400 font-medium">Subtotal:</span>
                    <span class="font-black text-sm text-emerald-400">R$ ${sectorSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-medium block mt-0.5">
                    ${toBuy.length} a comprar ${sectorCheckedCount > 0 ? `• ${sectorCheckedCount} no carrinho (R$ ${sectorCheckedTotal.toFixed(2).replace('.', ',')})` : ''} ${inStock.length > 0 ? `• <span class="text-blue-300 font-semibold">${inStock.length} em estoque</span>` : ''}
                  </span>
                </div>
              </div>

              <!-- Itens a Comprar -->
              ${toBuy.length > 0 ? `
                <div class="divide-y divide-slate-800/60">
                  ${toBuy.map((item) => {
                    const checkKey = `${currentWeekIdx}_${item.id}`;
                    const isChecked = !!state.cartChecked[checkKey];

                    let qtdStr = '';
                    const itemTipo = item.tipo_compra || item.tipo_venda || 'Pacote';
                    const itemMed = item.medida || 'g';

                    if (itemTipo === 'Peso') {
                      qtdStr = `${item.qtd_comprar}${itemMed}`;
                    } else if (itemTipo === 'Unidade') {
                      if (itemMed === 'un') {
                        qtdStr = `${item.qtd_comprar} un`;
                      } else if (item.tamanho_pacote && item.tamanho_pacote > 1) {
                        qtdStr = `${item.qtd_comprar} un (${item.tamanho_pacote}${itemMed})`;
                      } else {
                        qtdStr = `${item.qtd_comprar} un`;
                      }
                    } else {
                      qtdStr = `${item.qtd_comprar} ${itemTipo.toLowerCase()}(s) de ${item.tamanho_pacote}${itemMed}`;
                    }

                    return `
                      <div class="p-3.5 flex items-center justify-between gap-3 transition ${isChecked ? 'cart-item-checked' : 'hover:bg-slate-800/40'}">
                        <div class="flex items-center space-x-3.5 flex-1 cursor-pointer" onclick="window.app.toggleCartItem('${checkKey}')">
                          <div class="w-7 h-7 rounded-lg border-2 flex items-center justify-center transition flex-shrink-0 ${isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold' : 'border-slate-600 bg-slate-800'}">
                            ${isChecked ? '✓' : ''}
                          </div>
                          <div class="flex-1">
                            <span class="item-title font-bold text-sm sm:text-base text-white block">
                              ${item.nome}
                            </span>
                            <span class="text-xs text-slate-400 block mt-0.5">
                              Qtd: <strong class="text-slate-200">${qtdStr}</strong>
                            </span>
                          </div>
                        </div>

                        <div class="text-right flex items-center space-x-2">
                          <button onclick="window.app.openAdjustPriceModal('${currentWeekIdx}', '${item.id}', '${item.nome}', ${item.custo_estimado}, ${item.qtd_comprar})"
                                  class="text-right p-1.5 rounded-lg hover:bg-slate-800 transition">
                            <span class="font-extrabold text-sm sm:text-base text-emerald-400 block whitespace-nowrap">
                              R$ ${item.custo_estimado.toFixed(2).replace('.', ',')}
                            </span>
                            ${(state.adjustedPrices && (state.adjustedPrices[`${currentWeekIdx}_${item.id}`] || state.adjustedPrices[`${currentWeekIdx}_${item.nome}`])) ? `
                              <span class="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-600/50">Ajustado</span>
                            ` : `
                              <span class="text-[10px] text-slate-400 underline decoration-slate-600">Ajustar</span>
                            `}
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}

              <!-- Itens Cobertos pelo Estoque (Não Comprar) -->
              ${showInStock ? `
                <div>
                  <div class="px-4 py-2 bg-blue-950/30 border-t border-b border-blue-900/40 flex items-center justify-between text-xs">
                    <span class="font-bold text-blue-300 flex items-center gap-1.5">
                      <span>🛡️</span> <span>Já Cobertos pelo Estoque (Não Comprar)</span>
                    </span>
                    <span class="text-[11px] text-blue-300/80 font-medium">${inStock.length} ${inStock.length === 1 ? 'item coberto' : 'itens cobertos'}</span>
                  </div>

                  <div class="divide-y divide-slate-800/40 bg-slate-900/40">
                    ${inStock.map((item) => {
                      return `
                        <div class="p-3.5 flex items-center justify-between gap-3 opacity-90 hover:opacity-100 transition">
                          <div class="flex items-center space-x-3.5 flex-1 min-w-0">
                            <div class="w-7 h-7 rounded-lg border border-blue-500/40 bg-blue-950/60 text-blue-400 flex items-center justify-center flex-shrink-0 text-sm shadow-sm"
                                 title="Estoque suficiente no armário. Não é necessário comprar!">
                              🛡️
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-bold text-sm sm:text-base text-slate-200">
                                  ${item.nome}
                                </span>
                                <span class="text-[10px] text-blue-300 font-bold bg-blue-950/80 border border-blue-600/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>✓</span> <span>Não precisa comprar</span>
                                </span>
                              </div>
                              <div class="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                <span>Consumo da semana: <strong class="text-slate-200">${item.consumo_semanal} ${item.medida}</strong></span>
                                <span class="text-slate-600">•</span>
                                <span>No armário: <strong class="text-blue-300">${item.estoque_disponivel} ${item.medida}</strong></span>
                                <span class="text-slate-600">•</span>
                                <span>Sobrará: <strong class="text-emerald-400">${item.sobra_proxima_semana} ${item.medida}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div class="text-right flex-shrink-0">
                            <span class="font-bold text-xs sm:text-sm text-slate-500 line-through block whitespace-nowrap">
                              R$ 0,00
                            </span>
                            <span class="text-[10px] text-emerald-400 font-semibold block mt-0.5 whitespace-nowrap">
                              100% Coberto
                            </span>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}

        <!-- Fixed Bottom Supermarket Bar -->
        <div class="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 sm:p-4 z-40 shadow-2xl safe-bottom">
          <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                <span class="text-slate-300 font-medium">
                  🛒 No Carrinho: <strong class="text-emerald-400 font-bold">R$ ${totalCarrinho.toFixed(2).replace('.', ',')}</strong>
                  <span class="text-slate-500 text-xs">(${countCarrinho}/${totalToBuyCount})</span>
                </span>
                <span class="text-slate-400 text-xs">
                  Previsto: <strong class="text-white">R$ ${totalPrevisto.toFixed(2).replace('.', ',')}</strong>
                </span>
              </div>

              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
              </div>
            </div>

            <button onclick="window.app.openWhatsAppModal(${currentWeekIdx})"
                    class="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition whitespace-nowrap">
              <span>📱</span>
              <span class="hidden xs:inline">WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Bulk Cart Check / Uncheck
  function checkAllCartItems(week) {
    const cascade = calculate5WeeksCascade();
    cascade.forEach((row) => {
      const wData = row.weeks[week - 1];
      if (wData && wData.qtd_comprar > 0) {
        state.cartChecked[`${week}_cascade_${row.ingrediente}`] = true;
      }
    });
    state.hygieneItems.filter(h => h.semana_compra === `Semana ${week}`).forEach(h => {
      state.cartChecked[`${week}_hyg_${h.id}`] = true;
    });
    state.extraItems.filter(e => e.week === week).forEach(e => {
      state.cartChecked[`${week}_extra_${e.id}`] = true;
    });
    saveState();
    renderApp();
    showToast(`Todos os itens da Semana ${week} marcados no carrinho!`, 'info');
  }

  function uncheckAllCartItems(week) {
    Object.keys(state.cartChecked).forEach(key => {
      if (key.startsWith(`${week}_`)) {
        state.cartChecked[key] = false;
      }
    });
    saveState();
    renderApp();
    showToast(`Todos os itens da Semana ${week} desmarcados!`, 'info');
  }

  // --- SCREEN 4: GIRO DE ESTOQUE 5 SEMANAS (CASCADE MODE) ---
  function renderCascadeMode(container) {
    const cascade = calculate5WeeksCascade();

    const weekTotals = [0, 0, 0, 0, 0];
    cascade.forEach((row) => {
      row.weeks.forEach((w, idx) => {
        weekTotals[idx] += w.custo_estimado;
      });
    });

    const total5Weeks = weekTotals.reduce((a, b) => a + b, 0);
    const mediaSemanal = total5Weeks / 5;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Motor de Compras</span>
              <h2 class="text-2xl font-black text-white mt-1">Giro de Estoque em Cascata (5 Semanas)</h2>
              <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
                Cada semana calcula o consumo do seu respectivo cardápio, abatendo sobras e ajustando pacotes inteiros.
              </p>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 block">Total 5 Semanas</span>
              <span class="text-2xl font-black text-emerald-400">R$ ${total5Weeks.toFixed(2).replace('.', ',')}</span>
              <span class="text-xs text-slate-400 block mt-0.5">Média: R$ ${mediaSemanal.toFixed(2).replace('.', ',')}/sem</span>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            ${weekTotals.map((tot, idx) => `
              <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5 text-center cursor-pointer hover:border-emerald-500 transition"
                   onclick="window.app.setActiveWeek(${idx + 1}); window.app.switchTab('compras');">
                <span class="text-xs text-slate-400 block font-medium">Semana ${idx + 1}</span>
                <span class="text-base sm:text-lg font-bold text-white mt-0.5 block">R$ ${tot.toFixed(2).replace('.', ',')}</span>
                <span class="text-[10px] text-emerald-400">Ver compras ›</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div class="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
            <span class="font-bold text-sm text-white">Detalhamento dos 53 Ingredientes</span>
            <span class="text-xs text-slate-400">Estoque inicial editável na coluna azul</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left text-slate-300 cascade-table">
              <thead class="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
                <tr>
                  <th class="px-4 py-3 sticky left-0 bg-slate-800 z-10">Ingrediente</th>
                  <th class="px-3 py-3">Tipo</th>
                  <th class="px-3 py-3">Tam. Pacote</th>
                  <th class="px-3 py-3 text-center bg-blue-950/40 border-l border-r border-blue-900/60">Estoque Inicial</th>
                  <th class="px-3 py-3 text-center" colspan="3">Semana 1 (Comprar | Custo | Sobra)</th>
                  <th class="px-3 py-3 text-center" colspan="3">Semana 2 (Comprar | Custo | Sobra)</th>
                  <th class="px-3 py-3 text-center" colspan="3">Semana 3 (Comprar | Custo | Sobra)</th>
                  <th class="px-3 py-3 text-center" colspan="3">Semana 4 (Comprar | Custo | Sobra)</th>
                  <th class="px-3 py-3 text-center" colspan="3">Semana 5 (Comprar | Custo | Sobra)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${cascade.map((row) => `
                  <tr class="hover:bg-slate-800/40 transition">
                    <td class="px-4 py-3 font-semibold text-white sticky left-0 bg-slate-900 z-10 whitespace-nowrap">
                      ${row.ingrediente}
                    </td>
                    <td class="px-3 py-3 text-slate-400">${row.tipo_compra}</td>
                    <td class="px-3 py-3 text-slate-400">${row.tamanho_pacote} ${row.medida}</td>
                    
                    <td class="px-3 py-3 text-center bg-blue-950/20 border-l border-r border-blue-900/40">
                      <button onclick="window.app.openEditStockModal('${row.ingrediente}', ${row.estoque_inicial})"
                              class="px-2 py-0.5 rounded bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 font-bold text-xs border border-blue-800/40">
                        ${row.estoque_inicial} ${row.medida}
                      </button>
                    </td>

                    ${row.weeks.map((w) => `
                      <td class="px-2 py-3 text-center font-bold ${w.qtd_comprar > 0 ? 'text-amber-400' : 'text-slate-500'}">
                        ${w.qtd_comprar > 0 ? `${w.qtd_comprar}` : '-'}
                      </td>
                      <td class="px-2 py-3 text-right font-semibold ${w.custo_estimado > 0 ? 'text-emerald-400' : 'text-slate-500'}">
                        ${w.custo_estimado > 0 ? `R$ ${w.custo_estimado.toFixed(2)}` : '-'}
                      </td>
                      <td class="px-2 py-3 text-center text-slate-400 border-r border-slate-800 text-[11px]">
                        ${w.sobra_proxima_semana > 0 ? `${w.sobra_proxima_semana}` : '0'}
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- SCREEN 5: HIGIENE, LIMPEZA E FRALDAS ---
  function renderHygieneMode(container) {
    const categories = ['Todos', 'Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Em Estoque / Não Comprar'];
    const activeFilter = window.__hygieneFilter || 'Todos';

    const filteredItems = state.hygieneItems.filter((item) => {
      if (activeFilter === 'Todos') return true;
      return item.semana_compra === activeFilter;
    });

    const weekTotals = {
      'Semana 1': 0, 'Semana 2': 0, 'Semana 3': 0, 'Semana 4': 0, 'Semana 5': 0
    };
    state.hygieneItems.forEach((item) => {
      const c = item.quantidade * item.valor_unitario;
      if (weekTotals[item.semana_compra] !== undefined) {
        weekTotals[item.semana_compra] += c;
      }
    });

    const totalGeralHigiene = Object.values(weekTotals).reduce((a, b) => a + b, 0);

    container.innerHTML = `
      <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Módulo 4</span>
              <h2 class="text-2xl font-black text-white mt-1">Higiene, Limpeza e Fraldas</h2>
              <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
                Total planejado nas 5 semanas: <strong class="text-purple-400">R$ ${totalGeralHigiene.toFixed(2).replace('.', ',')}</strong>
              </p>
            </div>
            <button onclick="window.app.openAddHygieneModal()"
                    class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition self-start sm:self-auto">
              <span>+ Adicionar Item</span>
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            ${[1, 2, 3, 4, 5].map((w) => `
              <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5 text-center cursor-pointer hover:border-purple-500/50 transition"
                   onclick="window.__hygieneFilter = 'Semana ${w}'; window.app.renderApp();">
                <span class="text-[11px] text-slate-400 block font-medium">Semana ${w}</span>
                <span class="text-sm sm:text-base font-bold text-white mt-0.5 block">
                  R$ ${(weekTotals[`Semana ${w}`] || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
            `).join('')}
          </div>

          <div class="flex space-x-1.5 overflow-x-auto no-scrollbar mt-4 pt-2 border-t border-slate-800">
            ${categories.map((cat) => `
              <button onclick="window.__hygieneFilter = '${cat}'; window.app.renderApp();"
                      class="px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${activeFilter === cat ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div class="divide-y divide-slate-800">
            ${filteredItems.length === 0 ? `
              <div class="p-8 text-center text-slate-500 text-sm">
                Nenhum item cadastrado nesta categoria. Clique em "+ Adicionar Item".
              </div>
            ` : filteredItems.map((item) => {
              const totalCost = item.quantidade * item.valor_unitario;
              return `
                <div onclick="window.app.openEditHygieneModal('${item.id}')"
                     class="p-4 hover:bg-slate-800/50 flex items-center justify-between cursor-pointer transition gap-3">
                  <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-white text-sm sm:text-base">${item.nome_item}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-900/40 text-purple-300 border border-purple-800/50">
                        ${item.categoria || 'Geral'}
                      </span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.semana_compra === 'Em Estoque / Não Comprar' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50'}">
                        ${item.semana_compra}
                      </span>
                    </div>
                    <div class="text-xs text-slate-400">
                      ${item.quantidade} un × R$ ${item.valor_unitario.toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  <div class="text-right flex items-center space-x-3">
                    <div>
                      <span class="font-extrabold text-sm sm:text-base text-purple-300 block">
                        R$ ${totalCost.toFixed(2).replace('.', ',')}
                      </span>
                      <span class="text-[10px] text-slate-400">${item.status_estoque || 'Planejado'}</span>
                    </div>
                    <span class="text-slate-500">›</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // --- SCREEN 6: INGREDIENTES & CONFIGURAÇÕES (CRUD 100%) ---
  function renderIngredientsCatalog(container) {
    const categories = ['Todos', 'Mercearia', 'Carnes/Ovos', 'Hortifrúti', 'Laticínios/Padaria', 'Outros'];
    const activeCategory = window.__ingCategoryFilter || 'Todos';
    const searchQuery = (window.__ingSearchQuery || '').toLowerCase();

    const filtered = state.ingredients.filter((ing) => {
      const matchCat = activeCategory === 'Todos' || ing.categoria === activeCategory;
      const matchSearch = !searchQuery || ing.nome.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });

    container.innerHTML = `
      <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Módulo 1</span>
              <h2 class="text-2xl font-black text-white mt-1">Catálogo de Ingredientes (53 Itens)</h2>
              <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
                Total de ${state.ingredients.length} ingredientes configurados. Edite preços, embalagens e medidas caseiras.
              </p>
            </div>
            <button onclick="window.app.openAddIngredientModal()"
                    class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition self-start sm:self-auto">
              <span>+ Novo Ingrediente</span>
            </button>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <input type="text"
                     placeholder="Buscar ingrediente por nome..."
                     value="${window.__ingSearchQuery || ''}"
                     oninput="window.__ingSearchQuery = this.value; window.app.renderApp();"
                     class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500">
            </div>
          </div>

          <div class="flex space-x-1.5 overflow-x-auto no-scrollbar mt-3">
            ${categories.map((cat) => `
              <button onclick="window.__ingCategoryFilter = '${cat}'; window.app.renderApp();"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${activeCategory === cat ? 'tab-active' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          ${filtered.map((ing) => `
            <div onclick="window.app.openEditIngredientModal('${ing.id}')"
                 class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-2 group">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="font-bold text-base text-white group-hover:text-emerald-300 transition">${ing.nome}</h4>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryBadgeClass(ing.categoria)}">
                    ${ing.categoria}
                  </span>
                </div>
                <div class="text-right">
                  <span class="font-black text-sm text-emerald-400 block">
                    R$ ${ing.preco_pacote.toFixed(2).replace('.', ',')}
                  </span>
                  <span class="text-[10px] text-slate-400">por ${(ing.tipo_compra || ing.tipo_venda || 'Pacote').toLowerCase()}</span>
                </div>
              </div>

              <div class="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                <div class="flex justify-between">
                  <span>Pacote/Embalagem:</span>
                  <strong class="text-slate-200">${ing.tamanho_pacote} ${ing.medida || ing.unidade_pacote || 'un'}</strong>
                </div>
                <div class="flex justify-between">
                  <span>Base porção:</span>
                  <strong class="text-slate-200">${ing.peso_porcao_base} ${ing.medida || ing.unidade_pacote || 'un'} (${ing.nome_medida_caseira || ''})</strong>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- SCREEN 7: CONFIGURAÇÕES, BACKUP & REDE ---
  function renderConfigMode(container) {
    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚙️</span>
            <div>
              <h2 class="text-2xl font-black text-white">Configurações & Conexão</h2>
              <p class="text-xs text-slate-400">Acesso pelo celular, backup e sincronização.</p>
            </div>
          </div>

          <!-- Supabase Cloud Sync Card -->
          <div class="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-lg space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm">
                  ☁️
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-white flex items-center gap-2">
                    <span>Banco na Nuvem (Supabase)</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${state.supabaseConfig?.key ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
                      ${state.supabaseConfig?.key ? '🟢 Conectado' : '⚪ Não Configurado'}
                    </span>
                  </h3>
                  <p class="text-xs text-slate-400">Sincronize cardápio, compras, sobras e estoque entre PC e Celular em qualquer lugar.</p>
                </div>
              </div>
              ${state.lastSync ? `
                <div class="text-[11px] text-slate-400 text-right">
                  Última sincronização:<br>
                  <strong id="supabase-last-sync-label" class="text-emerald-400 font-mono">${new Date(state.lastSync).toLocaleString('pt-BR')}</strong>
                </div>
              ` : ''}
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Project URL (URL do Projeto Supabase):</label>
                <input type="text" id="supabase-url-input" 
                       value="${state.supabaseConfig?.url || 'https://deydppcfgyqbudzqiqty.supabase.co'}" 
                       placeholder="https://sua-id.supabase.co"
                       class="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500">
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-bold text-slate-300">Project API Key (anon / public):</label>
                  <span class="text-[10px] text-slate-400">Settings ⚙️ ➔ API ➔ Project API keys (anon)</span>
                </div>
                <div class="relative">
                  <input type="password" id="supabase-key-input" 
                         value="${state.supabaseConfig?.key || ''}" 
                         placeholder="Cole aqui sua anon public key (começa com eyJ...)"
                         class="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-slate-200 focus:outline-none focus:border-emerald-500">
                  <button type="button" onclick="const el=document.getElementById('supabase-key-input'); el.type = el.type==='password'?'text':'password';"
                          class="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs p-0.5">
                    👁️
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <input type="checkbox" id="supabase-autosync-toggle" ${state.supabaseConfig?.autoSync !== false ? 'checked' : ''} 
                       class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700">
                <label for="supabase-autosync-toggle" class="text-xs font-medium text-slate-300 cursor-pointer">
                  Sincronização Automática (Salvar alterações na nuvem silenciosamente a cada mudança)
                </label>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap gap-2.5 pt-2">
                <button onclick="window.app.saveSupabaseFromForm()"
                        class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition shadow border border-slate-700">
                  <span>💾</span> <span>Salvar Credenciais</span>
                </button>

                <button onclick="window.app.testSupabaseConnection(true)"
                        class="px-3.5 py-2 rounded-xl bg-blue-900/40 hover:bg-blue-800/50 active:scale-95 text-blue-300 border border-blue-700/60 font-bold text-xs flex items-center gap-1.5 transition shadow">
                  <span>🔄</span> <span>Testar Conexão</span>
                </button>

                <button onclick="window.app.uploadToSupabase(true)"
                        class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition shadow">
                  <span>☁️</span> <span>Enviar Dados do App para a Nuvem</span>
                </button>

                <button onclick="window.app.downloadFromSupabase(true)"
                        class="px-3.5 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-600/50 active:scale-95 font-bold text-xs flex items-center gap-1.5 transition shadow">
                  <span>⬇️</span> <span>Baixar Dados da Nuvem</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Cloud Hosting Guide (Vercel) -->
          <div class="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-2">
            <h3 class="text-sm font-bold text-purple-300 flex items-center gap-2">
              <span>🚀</span> <span>Como Usar no Celular Sem Depender do Computador Ligado</span>
            </h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              Para acessar o app direto na rua (4G) sem precisar rodar no computador, você pode publicar o aplicativo gratuitamente na <strong>Vercel</strong> conectada ao seu repositório GitHub. O app ganha um link HTTPS próprio (ex: <code class="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">https://planejamento-familiar.vercel.app</code>) e pode ser instalado direto como aplicativo no seu celular!
            </p>
          </div>

          <!-- Mobile Connection Info Card (Wi-Fi Local Fallback) -->
          <div class="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-2">
            <h3 class="text-sm font-bold text-blue-300 flex items-center gap-2">
              <span>📱</span> <span>Acesso Local no Celular (Mesmo Wi-Fi de Casa)</span>
            </h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              No navegador do celular (Chrome ou Safari), digite o endereço IP do seu computador na rede:<br>
              <strong class="text-base text-emerald-400 font-mono select-all bg-slate-900 px-2 py-1 rounded block mt-1.5 border border-slate-700">
                http://192.168.10.34:3000
              </strong>
            </p>
            <p class="text-[11px] text-slate-400">
              * Para acesso local, o computador precisa estar ligado com o servidor ativo e no mesmo Wi-Fi.
            </p>
          </div>

          <!-- Weekly Cycle & Calendar Settings -->
          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label class="block text-sm font-bold text-white">Ciclo Semanal & Calendário</label>
                <p class="text-xs text-slate-400 mt-0.5">1º dia da semana: <strong class="text-emerald-400">${state.firstDayOfWeek || 'Segunda'}</strong> • Início do Ciclo: <strong class="text-emerald-400">${state.cycleStartDate || '2026-11-02'}</strong></p>
              </div>
              <button onclick="window.app.openCycleConfigModal()"
                      class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow">
                <span>🗓️</span> <span>Alterar 1º Dia / Início do Ciclo</span>
              </button>
            </div>
          </div>

          <!-- Family Members Settings -->
          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <label class="block text-sm font-bold text-white">Quantidade de Pessoas na Casa (Membros da Família):</label>
            <div class="flex items-center space-x-3">
              <button onclick="window.app.updateFamilyMembers(Math.max(0.5, state.familyMembers - 0.5))"
                      class="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center transition">
                -
              </button>
              <input type="number" step="0.5" min="0.5" max="20"
                     value="${state.familyMembers}"
                     onchange="window.app.updateFamilyMembers(this.value)"
                     class="w-24 text-center font-black text-xl text-emerald-400 bg-slate-900 border border-slate-700 rounded-xl py-2 focus:outline-none focus:border-emerald-500">
              <button onclick="window.app.updateFamilyMembers(state.familyMembers + 0.5)"
                      class="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg flex items-center justify-center transition">
                +
              </button>
            </div>
            <p class="text-xs text-slate-400">
              Recalcula automaticamente todas as semanas do cardápio e compras.
            </p>
          </div>

          <!-- Backup Export and Import -->
          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-4">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>💾</span> <span>Backup Local dos Dados</span>
            </h3>
            
            <div class="flex flex-wrap gap-3">
              <button onclick="window.app.exportBackupJSON()"
                      class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition">
                <span>📥</span> <span>Baixar Arquivo de Backup (JSON)</span>
              </button>

              <label class="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow transition">
                <span>📤</span> <span>Restaurar de Arquivo JSON</span>
                <input type="file" accept=".json" class="hidden" onchange="window.app.importBackupJSON(event)">
              </label>
            </div>
          </div>

          <!-- Reset to Seed Data -->
          <div class="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
            <h3 class="text-sm font-bold text-rose-300 flex items-center gap-2">
              <span>⚠️</span> <span>Restaurar Padrão Original da Planilha</span>
            </h3>
            <p class="text-xs text-rose-200/70">
              Restaura todos os 53 ingredientes e o cardápio original da planilha "Planejamento Familiar Pro Final - Novembro 2026".
            </p>
            <button onclick="window.app.confirmResetToDefault()"
                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition">
              Restaurar Padrão da Planilha
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // --- MODALS ---

  // Week Selector Modal
  function openWeekSelectorModal() {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-2xl">📅</span>
            <h3 class="text-lg font-bold text-white">Selecionar Semana Ativa</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <p class="text-xs text-slate-300">
          Escolha a semana que você está vivenciando agora. O cardápio e a lista de compras se sincronizam automaticamente com ela:
        </p>

        <div class="space-y-2">
          ${[1, 2, 3, 4, 5].map((w) => {
            const isCurrent = w === state.activeWeek;
            const summary = getMenuFinancialSummary(w);
            return `
              <button onclick="window.app.setActiveWeek(${w}); window.app.closeModal();"
                      class="w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${isCurrent ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800'}">
                <div>
                  <span class="font-extrabold text-base block">Semana ${w} ${isCurrent ? '(Semana Ativa)' : ''}</span>
                  <span class="text-xs opacity-80 block mt-0.5">Cardápio planejado: R$ ${summary.totalSemana.toFixed(2).replace('.', ',')}</span>
                </div>
                <span class="text-sm font-bold ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'} px-3 py-1 rounded-full">
                  ${isCurrent ? 'Ativa' : 'Selecionar'}
                </span>
              </button>
            `;
          }).join('')}
        </div>
        <div class="pt-2 border-t border-slate-800">
          <button onclick="window.app.openCycleConfigModal()"
                  class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition">
            <span>📅</span> <span>Configurar 1º Dia e Datas do Ciclo</span>
          </button>
        </div>
      </div>
    `);
  }

  // Copy whole week menu to other weeks
  function openCopyWeekMenuModal(sourceWeek) {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Duplicar Cardápio Semanal</span>
            <h3 class="text-lg font-bold text-white mt-0.5">Copiar Semana ${sourceWeek} para outras</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <p class="text-xs text-slate-300">
          Deseja replicar todos os pratos e ingredientes da <strong>Semana ${sourceWeek}</strong> para quais semanas?
        </p>

        <div class="space-y-2">
          ${[1, 2, 3, 4, 5].filter(w => w !== sourceWeek).map((w) => `
            <label class="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input type="checkbox" name="copy-week-target" value="${w}" class="w-4 h-4 rounded text-blue-500">
              <span class="text-sm font-bold text-white">Semana ${w}</span>
            </label>
          `).join('')}
        </div>

        <div class="pt-2">
          <button onclick="window.app.confirmCopyWeekMenu(${sourceWeek})"
                  class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition">
            Copiar Cardápio
          </button>
        </div>
      </div>
    `);
  }

  function confirmCopyWeekMenu(sourceWeek) {
    const checkboxes = document.querySelectorAll('input[name="copy-week-target"]:checked');
    const targetWeeks = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));

    if (targetWeeks.length === 0) {
      showToast('Selecione ao menos uma semana destino.', 'info');
      return;
    }

    const sourceItems = getActiveMenuItems(sourceWeek);
    targetWeeks.forEach((targetW) => {
      state.menuByWeek[targetW] = JSON.parse(JSON.stringify(sourceItems));
    });

    saveState();
    renderApp();
    closeModal();
    showToast(`Cardápio da Semana ${sourceWeek} replicado para ${targetWeeks.length} semana(s)!`, 'success');
  }

  // Stock Explanation Modal
  function openStockExplanationModal() {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-2xl">📦</span>
            <h3 class="text-lg font-bold text-white">Como Funciona a Despensa & Estoque?</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <strong class="text-emerald-400 block font-bold">1. No Supermercado (Carrinho):</strong>
            <span>Os checkboxes da tela de compras servem para conferência. Conforme você pega o produto na prateleira, você marca o item.</span>
          </div>

          <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <strong class="text-blue-400 block font-bold">2. Consumo Automático pelo Cardápio:</strong>
            <span>Durante os 7 dias da semana, a sua família consome o que está cadastrado no cardápio de Segunda a Domingo.</span>
          </div>

          <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <strong class="text-amber-400 block font-bold">3. Virada de Semana & Abatimento:</strong>
            <span>
              Ao clicar no botão <strong>"Virar Semana / Estoque"</strong>, o sistema calcula a sobra teórica:
              <br><code class="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded text-xs">Sobra = Estoque Anterior + Comprado - Consumo do Cardápio</code>.
            </span>
          </div>

          <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <strong class="text-purple-400 block font-bold">4. Ajuste Fino pelo Usuário:</strong>
            <span>
              Na tela de virada, você confere o armário de casa. Se previa 700g de arroz mas só tem 500g, você digita <strong>500</strong>. Esse valor vira o estoque exato para a próxima semana!
            </span>
          </div>
        </div>

        <div class="pt-2">
          <button onclick="window.app.closeModal()"
                  class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow">
            Entendido!
          </button>
        </div>
      </div>
    `);
  }

  // Family Members Modal
  function openFamilyModal() {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <span>👨‍👩‍👧‍👦</span> <span>Membros da Família</span>
          </h3>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <p class="text-xs text-slate-300">
          Ajuste a quantidade de pessoas que comem em casa. Todas as porções, medidas da panela e compras de todas as semanas serão recalculadas.
        </p>

        <div class="flex items-center justify-center space-x-4 py-4 bg-slate-800/40 rounded-2xl border border-slate-800">
          <button onclick="window.app.adjustFamilyModal(-0.5)"
                  class="w-12 h-12 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-black text-2xl flex items-center justify-center shadow">
            -
          </button>
          
          <div class="text-center">
            <input type="number" id="family-modal-input" step="0.5" min="0.5" max="20"
                   value="${state.familyMembers}"
                   class="w-24 text-center font-black text-3xl text-emerald-400 bg-transparent focus:outline-none">
            <span class="text-xs text-slate-400 block font-medium">pessoas</span>
          </div>

          <button onclick="window.app.adjustFamilyModal(0.5)"
                  class="w-12 h-12 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-black text-2xl flex items-center justify-center shadow">
            +
          </button>
        </div>

        <div class="flex justify-center gap-2">
          ${[1, 2, 3, 3.5, 4, 5, 6].map((num) => `
            <button onclick="document.getElementById('family-modal-input').value = ${num}; window.app.applyFamilyModal();"
                    class="px-3 py-1 rounded-xl text-xs font-semibold ${state.familyMembers === num ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
              ${num}
            </button>
          `).join('')}
        </div>

        <div class="pt-3">
          <button onclick="window.app.applyFamilyModal()"
                  class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition">
            Confirmar e Recalcular
          </button>
        </div>
      </div>
    `);
  }

  function adjustFamilyModal(delta) {
    const input = document.getElementById('family-modal-input');
    if (!input) return;
    const current = parseFloat(input.value) || state.familyMembers;
    const next = Math.max(0.5, Math.round((current + delta) * 10) / 10);
    input.value = next;
  }

  function applyFamilyModal() {
    const input = document.getElementById('family-modal-input');
    if (!input) return;
    updateFamilyMembers(input.value);
    closeModal();
  }

  // Bidirectional Edit Modal for Menu Items
  function openEditMealItemModal(itemId, week = state.activeWeek) {
    const items = getActiveMenuItems(week);
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const ing = getIngredientByName(item.ingrediente_nome);
    if (!ing) return;

    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Semana ${week} • ${item.dia_nome} • ${item.refeicao}</span>
            <h3 class="text-lg font-bold text-white mt-0.5">${item.ingrediente_nome}</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-400">Trocar Ingrediente:</label>
          <select id="edit-meal-ing-select"
                  onchange="window.app.handleSwapIngredient(this.value, '${item.id}')"
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
            ${state.ingredients.map((i) => `
              <option value="${i.nome}" ${i.nome === item.ingrediente_nome ? 'selected' : ''}>
                ${i.nome} (${i.categoria}) — R$ ${i.preco_pacote.toFixed(2)}/${i.tamanho_pacote}${i.medida}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800 space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span class="font-bold text-white">Edição Bidirecional:</span>
            <span>${state.familyMembers} pessoa(s)</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Porção / Pessoa (${item.medida}):</label>
              <input type="number" step="any" min="0" id="input-portion-person"
                     value="${item.porcao_pessoa}"
                     oninput="window.app.handlePortionChange(this.value)"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-bold text-base text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1">Total Família (${item.medida}):</label>
              <input type="number" step="any" min="0" id="input-total-family"
                     value="${item.qtd_total_familia}"
                     oninput="window.app.handleTotalFamilyChange(this.value)"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-bold text-base text-emerald-400 focus:outline-none focus:border-emerald-500">
            </div>
          </div>

          <div class="pt-1">
            <label class="block text-xs text-slate-400 mb-1">Medida para a Panela (${ing.nome_medida_caseira}):</label>
            <div class="flex items-center space-x-2">
              <button onclick="window.app.stepMeasureModal(-0.5)"
                      class="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center">-</button>
              <input type="number" step="0.1" min="0" id="input-measures-count"
                     value="${(ing.peso_porcao_base > 0 ? (item.qtd_total_familia / ing.peso_porcao_base) : 0).toFixed(1)}"
                     oninput="window.app.handleMeasuresChange(this.value)"
                     class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center font-bold text-white focus:outline-none focus:border-emerald-500">
              <button onclick="window.app.stepMeasureModal(0.5)"
                      class="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center">+</button>
            </div>
            <span id="live-measure-str" class="text-xs text-emerald-400 font-medium block mt-1">
              🥄 ${item.medida_caseira_str || ''}
            </span>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
            <span class="text-slate-400">Custo da porção da família:</span>
            <span id="live-cost-preview" class="font-extrabold text-sm text-emerald-400">
              R$ ${(item.custo || 0).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button onclick="window.app.deleteMenuItem('${item.id}', ${week})"
                  class="px-3 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/30 text-xs font-bold transition">
            Excluir Item
          </button>

          <button onclick="window.app.saveEditedMenuItem('${item.id}', ${week})"
                  class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg transition">
            Salvar Alterações
          </button>
        </div>
      </div>
    `);

    window.__currentEditingItem = { ...item, ing, week };
  }

  function handlePortionChange(val) {
    const ctx = window.__currentEditingItem;
    if (!ctx) return;
    const num = parseFloat(val) || 0;
    const res = computeMenuItemFromPortion(num, ctx.ing);
    
    const inputTotal = document.getElementById('input-total-family');
    const inputMeasures = document.getElementById('input-measures-count');
    const measureStr = document.getElementById('live-measure-str');
    const costPreview = document.getElementById('live-cost-preview');

    if (inputTotal) inputTotal.value = res.qtd_total_familia;
    if (inputMeasures) inputMeasures.value = res.medidas_num;
    if (measureStr) measureStr.innerText = `🥄 ${res.medida_caseira_str}`;
    if (costPreview) costPreview.innerText = `R$ ${res.custo.toFixed(2).replace('.', ',')}`;

    ctx.porcao_pessoa = res.porcao_pessoa;
    ctx.qtd_total_familia = res.qtd_total_familia;
    ctx.medida_caseira_str = res.medida_caseira_str;
    ctx.custo = res.custo;
  }

  function handleTotalFamilyChange(val) {
    const ctx = window.__currentEditingItem;
    if (!ctx) return;
    const num = parseFloat(val) || 0;
    const res = computeMenuItemFromTotal(num, ctx.ing);

    const inputPortion = document.getElementById('input-portion-person');
    const inputMeasures = document.getElementById('input-measures-count');
    const measureStr = document.getElementById('live-measure-str');
    const costPreview = document.getElementById('live-cost-preview');

    if (inputPortion) inputPortion.value = res.porcao_pessoa;
    if (inputMeasures) inputMeasures.value = res.medidas_num;
    if (measureStr) measureStr.innerText = `🥄 ${res.medida_caseira_str}`;
    if (costPreview) costPreview.innerText = `R$ ${res.custo.toFixed(2).replace('.', ',')}`;

    ctx.porcao_pessoa = res.porcao_pessoa;
    ctx.qtd_total_familia = res.qtd_total_familia;
    ctx.medida_caseira_str = res.medida_caseira_str;
    ctx.custo = res.custo;
  }

  function handleMeasuresChange(val) {
    const ctx = window.__currentEditingItem;
    if (!ctx) return;
    const num = parseFloat(val) || 0;
    const res = computeMenuItemFromMeasures(num, ctx.ing);

    const inputPortion = document.getElementById('input-portion-person');
    const inputTotal = document.getElementById('input-total-family');
    const measureStr = document.getElementById('live-measure-str');
    const costPreview = document.getElementById('live-cost-preview');

    if (inputPortion) inputPortion.value = res.porcao_pessoa;
    if (inputTotal) inputTotal.value = res.qtd_total_familia;
    if (measureStr) measureStr.innerText = `🥄 ${res.medida_caseira_str}`;
    if (costPreview) costPreview.innerText = `R$ ${res.custo.toFixed(2).replace('.', ',')}`;

    ctx.porcao_pessoa = res.porcao_pessoa;
    ctx.qtd_total_familia = res.qtd_total_familia;
    ctx.medida_caseira_str = res.medida_caseira_str;
    ctx.custo = res.custo;
  }

  function stepMeasureModal(delta) {
    const input = document.getElementById('input-measures-count');
    if (!input) return;
    const cur = parseFloat(input.value) || 0;
    const next = Math.max(0, Math.round((cur + delta) * 10) / 10);
    input.value = next;
    handleMeasuresChange(next);
  }

  function handleSwapIngredient(newIngName, itemId) {
    const newIng = getIngredientByName(newIngName);
    if (!newIng) return;
    const ctx = window.__currentEditingItem;
    if (!ctx) return;

    ctx.ing = newIng;
    ctx.ingrediente_nome = newIng.nome;
    ctx.medida = newIng.medida;
    handlePortionChange(ctx.porcao_pessoa);
  }

  function saveEditedMenuItem(itemId, week = state.activeWeek) {
    const ctx = window.__currentEditingItem;
    if (!ctx) return;

    const items = getActiveMenuItems(week);
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        ingrediente_nome: ctx.ingrediente_nome,
        medida: ctx.medida,
        porcao_pessoa: ctx.porcao_pessoa,
        qtd_total_familia: ctx.qtd_total_familia,
        medida_caseira_str: ctx.medida_caseira_str,
        custo: ctx.custo
      };
      saveState();
      renderApp();
      closeModal();
      showToast('Item atualizado com sucesso!', 'success');
    }
  }

  function deleteMenuItem(itemId, week = state.activeWeek) {
    if (!confirm('Deseja realmente remover este ingrediente desta refeição?')) return;
    state.menuByWeek[week] = getActiveMenuItems(week).filter((i) => i.id !== itemId);
    saveState();
    renderApp();
    closeModal();
    showToast('Ingrediente removido da refeição.', 'info');
  }

  // Add Item to Meal Modal
  function openAddMealItemModal(day, meal, week = state.activeWeek) {
    const sortedIngs = [...state.ingredients].sort((a, b) => a.nome.localeCompare(b.nome));
    const firstIng = sortedIngs[0];

    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Semana ${week} • Adicionar</span>
            <h3 class="text-lg font-bold text-white mt-0.5">${day} • ${meal}</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Selecione o Ingrediente:</label>
            <select id="new-meal-ing"
                    onchange="window.app.updateNewMealIngredientPreview(this.value)"
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
              ${sortedIngs.map((i) => `
                <option value="${i.nome}">${i.nome} (${i.categoria}) — ${i.tamanho_pacote}${i.medida}</option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Porção / Pessoa:</label>
              <input type="number" step="any" min="0" id="new-meal-portion" value="${firstIng?.peso_porcao_base || 50}"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Unidade:</label>
              <input type="text" id="new-meal-unit" value="${firstIng?.medida || 'g'}" readonly
                     class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-400">
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button onclick="window.app.confirmAddMealItem('${day}', '${meal}', ${week})"
                  class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition">
            Adicionar Ingrediente
          </button>
        </div>
      </div>
    `);
  }

  function updateNewMealIngredientPreview(ingName) {
    const ing = getIngredientByName(ingName);
    if (!ing) return;
    const unitInput = document.getElementById('new-meal-unit');
    const portionInput = document.getElementById('new-meal-portion');
    if (unitInput) unitInput.value = ing.medida;
    if (portionInput && (!portionInput.value || parseFloat(portionInput.value) === 0)) {
      portionInput.value = ing.peso_porcao_base || 50;
    }
  }

  function confirmAddMealItem(day, meal, week = state.activeWeek) {
    const select = document.getElementById('new-meal-ing');
    const portionInput = document.getElementById('new-meal-portion');
    if (!select || !portionInput) return;

    const ingName = select.value;
    const ing = getIngredientByName(ingName);
    if (!ing) return;

    const portion = parseFloat(portionInput.value) || ing.peso_porcao_base || 1;
    const computed = computeMenuItemFromPortion(portion, ing);

    const newItem = {
      id: `menu_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      dia_cod: day,
      dia_nome: day,
      refeicao: meal,
      ingrediente_nome: ing.nome,
      porcao_pessoa: computed.porcao_pessoa,
      medida: ing.medida,
      qtd_total_familia: computed.qtd_total_familia,
      medida_caseira_str: computed.medida_caseira_str,
      custo: computed.custo
    };

    if (!state.menuByWeek[week]) state.menuByWeek[week] = [];
    state.menuByWeek[week].push(newItem);

    saveState();
    renderApp();
    closeModal();
    showToast(`Adicionado à Semana ${week}: ${ing.nome}!`, 'success');
  }

  // Duplicate Single Meal
  function duplicateSingleMeal(sourceDay, sourceMeal, week = state.activeWeek) {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Copiar Refeição</span>
            <h3 class="text-lg font-bold text-white mt-0.5">${sourceMeal} (${sourceDay})</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <p class="text-xs text-slate-300">
          Selecione o(s) dia(s) para os quais deseja duplicar os ingredientes desta refeição:
        </p>

        <div class="space-y-2">
          ${DAYS_OF_WEEK.filter((d) => d !== sourceDay).map((targetDay) => `
            <label class="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input type="checkbox" name="duplicate-target-day" value="${targetDay}" class="w-4 h-4 rounded text-emerald-500">
              <span class="text-sm font-semibold text-white">${targetDay}</span>
            </label>
          `).join('')}
        </div>

        <div class="pt-2">
          <button onclick="window.app.confirmDuplicateMeal('${sourceDay}', '${sourceMeal}', ${week})"
                  class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition">
            Copiar para Dias Selecionados
          </button>
        </div>
      </div>
    `);
  }

  function confirmDuplicateMeal(sourceDay, sourceMeal, week = state.activeWeek) {
    const checkboxes = document.querySelectorAll('input[name="duplicate-target-day"]:checked');
    const targetDays = Array.from(checkboxes).map((cb) => cb.value);

    if (targetDays.length === 0) {
      showToast('Selecione ao menos um dia destino.', 'info');
      return;
    }

    const items = getActiveMenuItems(week);
    const sourceItems = items.filter((i) => i.dia_nome === sourceDay && i.refeicao === sourceMeal);
    if (sourceItems.length === 0) {
      showToast('Nenhum item para copiar nesta refeição.', 'info');
      return;
    }

    targetDays.forEach((targetDay) => {
      state.menuByWeek[week] = state.menuByWeek[week].filter((i) => !(i.dia_nome === targetDay && i.refeicao === sourceMeal));

      sourceItems.forEach((item) => {
        state.menuByWeek[week].push({
          ...item,
          id: `menu_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          dia_cod: targetDay,
          dia_nome: targetDay
        });
      });
    });

    saveState();
    renderApp();
    closeModal();
    showToast(`Refeição copiada para ${targetDays.length} dia(s)!`, 'success');
  }

  function openDuplicateMealModal(sourceDay, week = state.activeWeek) {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Copiar Dia Completo</span>
            <h3 class="text-lg font-bold text-white mt-0.5">Copiar cardápio de ${sourceDay}</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <p class="text-xs text-slate-300">
          Escolha os dias que receberão todas as 4 refeições de <strong>${sourceDay}</strong>:
        </p>

        <div class="space-y-2">
          ${DAYS_OF_WEEK.filter((d) => d !== sourceDay).map((targetDay) => `
            <label class="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input type="checkbox" name="duplicate-full-day" value="${targetDay}" class="w-4 h-4 rounded text-emerald-500">
              <span class="text-sm font-semibold text-white">${targetDay}</span>
            </label>
          `).join('')}
        </div>

        <div class="pt-2">
          <button onclick="window.app.confirmDuplicateFullDay('${sourceDay}', ${week})"
                  class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition">
            Substituir e Duplicar Dia
          </button>
        </div>
      </div>
    `);
  }

  function confirmDuplicateFullDay(sourceDay, week = state.activeWeek) {
    const checkboxes = document.querySelectorAll('input[name="duplicate-full-day"]:checked');
    const targetDays = Array.from(checkboxes).map((cb) => cb.value);

    if (targetDays.length === 0) {
      showToast('Selecione ao menos um dia destino.', 'info');
      return;
    }

    const sourceItems = getActiveMenuItems(week).filter((i) => i.dia_nome === sourceDay);

    targetDays.forEach((targetDay) => {
      state.menuByWeek[week] = state.menuByWeek[week].filter((i) => i.dia_nome !== targetDay);
      sourceItems.forEach((item) => {
        state.menuByWeek[week].push({
          ...item,
          id: `menu_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          dia_cod: targetDay,
          dia_nome: targetDay
        });
      });
    });

    saveState();
    renderApp();
    closeModal();
    showToast(`Cardápio de ${sourceDay} copiado para ${targetDays.length} dia(s)!`, 'success');
  }

  // Stock Edit Modal (Semana 1)
  function openEditStockModal(ingName, currentStock) {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Estoque Inicial (Semana 1)</span>
            <h3 class="text-lg font-bold text-white mt-0.5">${ingName}</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div>
          <label class="block text-xs text-slate-400 mb-1">Quantidade já em casa no armário:</label>
          <input type="number" step="any" min="0" id="stock-input-val" value="${currentStock}"
                 class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 font-bold text-lg text-emerald-400 focus:outline-none focus:border-emerald-500">
        </div>

        <div class="flex gap-2">
          <button onclick="document.getElementById('stock-input-val').value = 0"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300">
            Zerar
          </button>
        </div>

        <div class="pt-2">
          <button onclick="window.app.saveStockInitial('${ingName}')"
                  class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition">
            Salvar Estoque
          </button>
        </div>
      </div>
    `);
  }

  function saveStockInitial(ingName) {
    const input = document.getElementById('stock-input-val');
    if (!input) return;
    const val = parseFloat(input.value) || 0;
    state.initialStock[ingName] = val;
    saveState();
    renderApp();
    closeModal();
    showToast(`Estoque inicial de ${ingName} atualizado!`, 'success');
  }

  // Supermarket Price Adjust Modal
  function openAdjustPriceModal(week, itemId, name, curCost, curQty) {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Ajuste no Supermercado (Semana ${week})</span>
            <h3 class="text-lg font-bold text-white mt-0.5">${name}</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <p class="text-xs text-slate-300">
          O preço ou tamanho da embalagem mudou no supermercado? Ajuste aqui para atualizar a conta exata:
        </p>

        <div class="space-y-3 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Preço Total Cobrado (R$):</label>
            <input type="text" inputmode="decimal" id="adj-price-input" value="${curCost.toFixed(2).replace('.', ',')}"
                   placeholder="Ex: 21,00"
                   class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Quantidade de Pacotes / Peso Comprado:</label>
            <input type="text" inputmode="decimal" id="adj-qty-input" value="${curQty}"
                   placeholder="Ex: 500"
                   class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500">
          </div>
        </div>

        <div class="pt-2 flex justify-between gap-3">
          <button onclick="window.app.resetAdjustPrice('${week}', '${itemId}')"
                  class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">
            Restaurar Previsto
          </button>
          <button onclick="window.app.saveAdjustPrice('${week}', '${itemId}')"
                  class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg">
            Salvar Valor Real
          </button>
        </div>
      </div>
    `);
  }

  function saveAdjustPrice(week, itemId) {
    const pInput = document.getElementById('adj-price-input');
    const qInput = document.getElementById('adj-qty-input');
    if (!pInput || !qInput) return;

    const rawP = pInput.value.replace(',', '.').trim();
    const rawQ = qInput.value.replace(',', '.').trim();
    const price = parseFloat(rawP) || 0;
    const qty = parseFloat(rawQ) || 0;

    const cleanItemName = itemId.replace(/^cascade_/, '');

    if (!state.adjustedPrices) state.adjustedPrices = {};
    state.adjustedPrices[`${week}_${itemId}`] = { price, qty };
    state.adjustedPrices[`${week}_${cleanItemName}`] = { price, qty };
    state.adjustedPrices[`${week}_cascade_${cleanItemName}`] = { price, qty };

    saveState();
    renderApp();
    closeModal();
    showToast(`Ajustado: ${qty} por R$ ${price.toFixed(2).replace('.', ',')}!`, 'success');
  }

  function resetAdjustPrice(week, itemId) {
    if (!state.adjustedPrices) state.adjustedPrices = {};
    const cleanItemName = itemId.replace(/^cascade_/, '');
    delete state.adjustedPrices[`${week}_${itemId}`];
    delete state.adjustedPrices[`${week}_${cleanItemName}`];
    delete state.adjustedPrices[`${week}_cascade_${cleanItemName}`];

    saveState();
    renderApp();
    closeModal();
    showToast('Valor restaurado para o previsto.', 'info');
  }

  // Add Extra Item Modal
  function openAddExtraItemModal(week) {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Item Avulso no Supermercado</span>
            <h3 class="text-lg font-bold text-white mt-0.5">Adicionar à Semana ${week}</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Nome do Item:</label>
            <input type="text" id="extra-item-name" placeholder="Ex: Sobremesa especial, Refrigerante..."
                   class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Quantidade:</label>
              <input type="number" step="any" min="1" id="extra-item-qty" value="1"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Valor Estimado (R$):</label>
              <input type="number" step="0.01" min="0" id="extra-item-price" placeholder="0,00"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500">
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button onclick="window.app.saveExtraItem(${week})"
                  class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition">
            Adicionar à Lista de Compras
          </button>
        </div>
      </div>
    `);
  }

  function saveExtraItem(week) {
    const nameInput = document.getElementById('extra-item-name');
    const qtyInput = document.getElementById('extra-item-qty');
    const priceInput = document.getElementById('extra-item-price');

    if (!nameInput || !nameInput.value.trim()) {
      showToast('Digite o nome do item.', 'info');
      return;
    }

    const item = {
      id: `ext_${Date.now()}`,
      week,
      nome: nameInput.value.trim(),
      categoria: 'Itens Extras',
      qtd: parseFloat(qtyInput?.value) || 1,
      preco: parseFloat(priceInput?.value) || 0,
      checked: false
    };

    state.extraItems.push(item);
    saveState();
    renderApp();
    closeModal();
    showToast('Item avulso adicionado!', 'success');
  }

  // --- WHATSAPP SHARING ENGINE ---
  function openWhatsAppModal(week) {
    const cascade = calculate5WeeksCascade();
    const currentWeekIdx = week;

    const itemsToBuy = [];
    cascade.forEach((row) => {
      const wData = row.weeks[currentWeekIdx - 1];
      if (wData && wData.qtd_comprar > 0) {
        const isChecked = !!state.cartChecked[`${currentWeekIdx}_cascade_${row.ingrediente}`];
        itemsToBuy.push({
          id: `cascade_${row.ingrediente}`,
          nome: row.ingrediente,
          categoria: row.categoria,
          tipo_compra: row.tipo_compra,
          tamanho_pacote: row.tamanho_pacote,
          medida: row.medida,
          qtd_comprar: wData.qtd_comprar,
          custo_estimado: wData.custo_estimado,
          isChecked
        });
      }
    });

    const hygieneThisWeek = state.hygieneItems.filter(h => h.semana_compra === `Semana ${currentWeekIdx}`);
    hygieneThisWeek.forEach((h) => {
      const isChecked = !!state.cartChecked[`${currentWeekIdx}_hyg_${h.id}`];
      itemsToBuy.push({
        id: `hyg_${h.id}`,
        nome: h.nome_item,
        categoria: 'Higiene & Limpeza',
        tipo_compra: 'Unidade',
        tamanho_pacote: 1,
        medida: 'un',
        qtd_comprar: h.quantidade,
        custo_estimado: h.quantidade * h.valor_unitario,
        isChecked
      });
    });

    const extraThisWeek = state.extraItems.filter(e => e.week === currentWeekIdx);
    extraThisWeek.forEach((e) => {
      const isChecked = !!state.cartChecked[`${currentWeekIdx}_extra_${e.id}`];
      itemsToBuy.push({
        id: `extra_${e.id}`,
        nome: e.nome,
        categoria: 'Itens Extras',
        tipo_compra: 'Unidade',
        tamanho_pacote: 1,
        medida: 'un',
        qtd_comprar: e.qtd,
        custo_estimado: e.preco,
        isChecked
      });
    });

    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-2xl text-emerald-400">💬</span>
            <div>
              <h3 class="text-lg font-bold text-white">Compartilhar no WhatsApp</h3>
              <span class="text-xs text-slate-400">Semana ${currentWeekIdx} • Planejamento Familiar Pro</span>
            </div>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <p class="text-xs text-slate-300">
          Selecione o formato desejado para a mensagem no WhatsApp:
        </p>

        <div class="space-y-2.5">
          <button onclick="window.app.dispatchWhatsApp(${week}, 'all')"
                  class="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm flex items-center justify-between shadow-lg transition">
            <span class="flex items-center gap-2">
              <span>🛒</span> <span>Enviar Lista Completa da Semana</span>
            </span>
            <span class="text-xs bg-emerald-700/60 px-2 py-0.5 rounded-full">${itemsToBuy.length} itens</span>
          </button>

          <button onclick="window.app.dispatchWhatsApp(${week}, 'pending')"
                  class="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-sm flex items-center justify-between transition">
            <span class="flex items-center gap-2">
              <span>◻️</span> <span>Enviar Apenas Faltantes (Não Marcados)</span>
            </span>
            <span class="text-xs bg-slate-700 px-2 py-0.5 rounded-full">
              ${itemsToBuy.filter(i => !i.isChecked).length} itens
            </span>
          </button>

          <button onclick="window.app.copyWhatsAppText(${week}, 'all')"
                  class="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition">
            <span>📋</span> <span>Copiar Texto Formatado para a Área de Transferência</span>
          </button>
        </div>
      </div>
    `);
  }

  function formatWhatsAppMessage(week, filterMode) {
    const cascade = calculate5WeeksCascade();
    const currentWeekIdx = week;

    let items = [];
    cascade.forEach((row) => {
      const wData = row.weeks[currentWeekIdx - 1];
      if (wData && wData.qtd_comprar > 0) {
        const isChecked = !!state.cartChecked[`${currentWeekIdx}_cascade_${row.ingrediente}`];
        if (filterMode === 'pending' && isChecked) return;
        items.push({
          nome: row.ingrediente,
          categoria: row.categoria,
          tipo_compra: row.tipo_compra,
          tamanho_pacote: row.tamanho_pacote,
          medida: row.medida,
          qtd_comprar: wData.qtd_comprar,
          custo_estimado: wData.custo_estimado
        });
      }
    });

    const hygieneThisWeek = state.hygieneItems.filter(h => h.semana_compra === `Semana ${currentWeekIdx}`);
    hygieneThisWeek.forEach((h) => {
      const isChecked = !!state.cartChecked[`${currentWeekIdx}_hyg_${h.id}`];
      if (filterMode === 'pending' && isChecked) return;
      items.push({
        nome: h.nome_item,
        categoria: 'Higiene & Limpeza',
        tipo_compra: 'Unidade',
        tamanho_pacote: 1,
        medida: 'un',
        qtd_comprar: h.quantidade,
        custo_estimado: h.quantidade * h.valor_unitario
      });
    });

    const extraThisWeek = state.extraItems.filter(e => e.week === currentWeekIdx);
    extraThisWeek.forEach((e) => {
      const isChecked = !!state.cartChecked[`${currentWeekIdx}_extra_${e.id}`];
      if (filterMode === 'pending' && isChecked) return;
      items.push({
        nome: e.nome,
        categoria: 'Itens Extras',
        tipo_compra: 'Unidade',
        tamanho_pacote: 1,
        medida: 'un',
        qtd_comprar: e.qtd,
        custo_estimado: e.preco
      });
    });

    const sectors = {
      '🥩 *AÇOUGUE E OVOS*': [],
      '🌾 *MERCEARIA E GRÃOS*': [],
      '🍎 *HORTIFRÚTI E POLPAS*': [],
      '🥛 *LATICÍNIOS E PADARIA*': [],
      '🧼 *HIGIENE E LIMPEZA*': [],
      '📦 *ITENS EXTRAS*': []
    };

    let total = 0;

    items.forEach((item) => {
      total += item.custo_estimado;
      let line = '';
      if (item.tipo_compra === 'Peso') {
        let q = item.qtd_comprar;
        if (item.medida === 'g' && q >= 1000) {
          line = `◻️ ${item.nome}: ${(q / 1000).toFixed(2).replace('.', ',')} kg (R$ ${item.custo_estimado.toFixed(2).replace('.', ',')})`;
        } else {
          line = `◻️ ${item.nome}: ${q} ${item.medida} (R$ ${item.custo_estimado.toFixed(2).replace('.', ',')})`;
        }
      } else if (item.tipo_compra === 'Unidade') {
        if (item.medida === 'un') {
          line = `◻️ ${item.nome}: ${item.qtd_comprar} un (R$ ${item.custo_estimado.toFixed(2).replace('.', ',')})`;
        } else if (item.tamanho_pacote && item.tamanho_pacote > 1) {
          line = `◻️ ${item.nome}: ${item.qtd_comprar} un (${item.tamanho_pacote}${item.medida}) (R$ ${item.custo_estimado.toFixed(2).replace('.', ',')})`;
        } else {
          line = `◻️ ${item.nome}: ${item.qtd_comprar} un (R$ ${item.custo_estimado.toFixed(2).replace('.', ',')})`;
        }
      } else {
        line = `◻️ ${item.nome}: ${item.qtd_comprar} pct de ${item.tamanho_pacote}${item.medida} (R$ ${item.custo_estimado.toFixed(2).replace('.', ',')})`;
      }

      if (item.categoria === 'Carnes/Ovos') sectors['🥩 *AÇOUGUE E OVOS*'].push(line);
      else if (item.categoria === 'Mercearia') sectors['🌾 *MERCEARIA E GRÃOS*'].push(line);
      else if (item.categoria === 'Hortifrúti') sectors['🍎 *HORTIFRÚTI E POLPAS*'].push(line);
      else if (item.categoria === 'Laticínios/Padaria') sectors['🥛 *LATICÍNIOS E PADARIA*'].push(line);
      else if (item.categoria === 'Higiene & Limpeza' || item.categoria === 'Higiene' || item.categoria === 'Limpeza' || item.categoria === 'Bebê / Fraldas') sectors['🧼 *HIGIENE E LIMPEZA*'].push(line);
      else sectors['📦 *ITENS EXTRAS*'].push(line);
    });

    const inStockWa = [];
    cascade.forEach((row) => {
      const wData = row.weeks[currentWeekIdx - 1];
      if (wData && wData.consumo_semanal > 0 && wData.qtd_comprar === 0) {
        inStockWa.push({
          nome: row.ingrediente,
          medida: row.medida,
          consumo: wData.consumo_semanal,
          estoque: wData.estoque_disponivel,
          sobra: wData.sobra_proxima_semana
        });
      }
    });

    let msg = `🛒 *LISTA DE COMPRAS - SEMANA ${week}*\n📅 Planejamento Familiar Pro\n\n`;
    Object.keys(sectors).forEach((sec) => {
      if (sectors[sec].length > 0) {
        msg += `${sec}\n${sectors[sec].join('\n')}\n\n`;
      }
    });

    if (filterMode === 'all' && inStockWa.length > 0) {
      msg += `🛡️ *JÁ TEM EM CASA (NÃO PRECISA COMPRAR):*\n`;
      inStockWa.forEach((it) => {
        msg += `▫️ ${it.nome}: ${it.estoque} ${it.medida} no armário (usará ${it.consumo} ${it.medida}, sobra ${it.sobra} ${it.medida})\n`;
      });
      msg += `\n`;
    }

    msg += `💰 *Total Estimado da Semana: R$ ${total.toFixed(2).replace('.', ',')}*`;
    return msg;
  }

  function dispatchWhatsApp(week, mode) {
    const msg = formatWhatsAppMessage(week, mode);
    const encoded = encodeURIComponent(msg);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
    closeModal();
  }

  function copyWhatsAppText(week, mode) {
    const msg = formatWhatsAppMessage(week, mode);
    navigator.clipboard.writeText(msg).then(() => {
      showToast('Texto da lista copiado para a área de transferência!', 'success');
      closeModal();
    }).catch(() => {
      showToast('Erro ao copiar texto.', 'error');
    });
  }

    // --- WEEK TURNOVER ("VIRADA DE SEMANA") ENGINE COM AJUSTE FINO COMPLETO ---
  function fillSuggestedTurnover() {
    const inputs = document.querySelectorAll('input[id^="leftover-input-"]');
    inputs.forEach(input => {
      const sug = input.getAttribute('data-suggested');
      if (sug !== null) {
        input.value = sug;
      }
    });
    showToast('Quantidades restauradas para as sobras calculadas', 'info');
  }

  function zeroAllTurnover() {
    const inputs = document.querySelectorAll('input[id^="leftover-input-"]');
    inputs.forEach(input => {
      input.value = 0;
    });
    showToast('Todas as sobras foram zeradas (0)', 'info');
  }

  function openTurnoverModal(currentWeek) {
    const cascade = calculate5WeeksCascade();
    const currentWeekIdx = currentWeek;

    const leftoverItems = [];
    cascade.forEach((row) => {
      const wData = row.weeks[currentWeekIdx - 1];
      if (!wData) return;

      const hadPlannedBuy = wData.qtd_comprar > 0;
      const isBought = !!(state.cartChecked[`${currentWeekIdx}_cascade_${row.ingrediente}`] || state.cartChecked[`${currentWeekIdx}_${row.ingrediente}`]);
      const isWeight = (row.tipo_compra || row.tipo_venda) === 'Peso';
      const adj = state.adjustedPrices?.[`${currentWeekIdx}_cascade_${row.ingrediente}`] || state.adjustedPrices?.[`${currentWeekIdx}_${row.ingrediente}`];

      let theoreticalLeftover = wData.sobra_proxima_semana || 0;
      if (isBought && adj?.qty !== undefined) {
        if (isWeight) {
          theoreticalLeftover = Math.max(0, Math.round((adj.qty - wData.consumo_semanal) * 100) / 100);
        } else {
          theoreticalLeftover = Math.max(0, Math.round((wData.estoque_disponivel + (adj.qty * (row.tamanho_pacote || 1)) - wData.consumo_semanal) * 100) / 100);
        }
      }

      // CRITÉRIO TRANSPARENTE: Só entra no modal o que foi EFETIVAMENTE COMPRADO nesta semana e tem sobra de pacote
      if (hadPlannedBuy && isBought && theoreticalLeftover > 0) {
        leftoverItems.push({
          ingrediente: row.ingrediente,
          sobraTeorica: theoreticalLeftover,
          medida: row.medida,
          tamanho_pacote: row.tamanho_pacote,
          isBought: true,
          status: 'bought',
          defaultVal: theoreticalLeftover,
          consumoSemanal: wData.consumo_semanal,
          qtdComprar: wData.qtd_comprar
        });
      }
    });

    renderModal(`
      <div class="space-y-4 max-w-xl mx-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Virada de Semana & Conferência</span>
            <h3 class="text-lg font-bold text-white mt-0.5">Semana ${currentWeek} ➔ Semana ${Math.min(5, currentWeek + 1)}</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1 text-xl">✕</button>
        </div>

        <div class="p-3 bg-blue-950/40 rounded-xl border border-blue-800/40 text-xs text-slate-300 space-y-1.5">
          <strong class="text-blue-300 flex items-center gap-1.5">
            <span>🔍</span> <span>Conferência das Sobras das Compras:</span>
          </strong>
          <p class="leading-relaxed">
            Abaixo estão <strong>apenas os produtos comprados nesta semana</strong> que têm sobra prevista de pacote no armário. Ajuste a quantidade real se necessário. Itens não comprados não aparecem e serão recalculados para a próxima semana!
          </p>
        </div>

        ${leftoverItems.length > 0 ? `
          <!-- Ações Rápidas de Conferência -->
          <div class="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
            <span class="text-slate-400 font-semibold flex items-center gap-1">
              <span>⚡</span> <span>Ações Rápidas:</span>
            </span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button onclick="window.app.fillSuggestedTurnover()"
                      class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition text-[11px] flex items-center gap-1">
                <span>↺</span> <span>Restaurar Sobras Teóricas</span>
              </button>
              <button onclick="window.app.zeroAllTurnover()"
                      class="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 font-medium transition text-[11px] flex items-center gap-1">
                <span>0</span> <span>Zerar Todas</span>
              </button>
            </div>
          </div>
        ` : ''}

        <div class="max-h-72 overflow-y-auto space-y-3 pr-1">
          ${leftoverItems.length === 0 ? `
            <div class="text-center py-6 text-slate-400 text-xs bg-slate-800/40 rounded-xl space-y-1.5 p-4 border border-slate-800">
              <span class="text-2xl block mb-1">🎉</span>
              <strong class="text-white text-sm block">Nenhum pacote comprado com sobra pendente!</strong>
              <p class="text-slate-400 max-w-sm mx-auto leading-relaxed">
                Todos os itens comprados foram consumidos integralmente ou não houve compra nova com sobra. O estoque da Semana ${Math.min(5, currentWeek + 1)} está pronto para ser ativado.
              </p>
            </div>
          ` : leftoverItems.map((item) => {
            const cleanId = item.ingrediente.replace(/[^a-zA-Z0-9]/g, '_');
            const stepVal = item.medida === 'g' || item.medida === 'ml' ? 50 : 1;
            const nextWeek = Math.min(5, currentWeek + 1);
            const initialVal = (state.completedTurnovers?.[currentWeek] && state.pantryAdjustments[`w${nextWeek}_${item.ingrediente}`] !== undefined)
              ? state.pantryAdjustments[`w${nextWeek}_${item.ingrediente}`]
              : item.defaultVal;

            return `
              <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-sm text-white">${item.ingrediente}</span>
                      <span class="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-600/50 flex items-center gap-1">
                        <span>✓</span> <span>Comprado</span>
                      </span>
                    </div>
                    <span class="text-[11px] text-slate-400 block mt-1">
                      Previsão teórica pós-consumo: <strong class="text-slate-200 font-semibold">${item.sobraTeorica} ${item.medida}</strong>
                    </span>
                  </div>

                  <div class="flex gap-1.5 flex-shrink-0">
                    <button onclick="document.getElementById('leftover-input-${cleanId}').value = 0"
                            class="px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] font-semibold transition"
                            title="Zerar sobra deste item">
                      Zerou!
                    </button>
                    <button onclick="document.getElementById('leftover-input-${cleanId}').value = ${item.sobraTeorica}"
                            class="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold transition"
                            title="Restaurar valor calculado">
                      Manter ${item.sobraTeorica}
                    </button>
                  </div>
                </div>

                <!-- Interactive Numeric Adjustment -->
                <div class="flex items-center space-x-2 pt-1">
                  <span class="text-xs text-slate-400 font-medium">Real no armário:</span>
                  
                  <button onclick="window.app.stepLeftoverInput('${cleanId}', -${stepVal})"
                          class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-sm flex items-center justify-center transition">-</button>
                  
                  <input type="number" step="any" min="0"
                         id="leftover-input-${cleanId}"
                         data-ing="${item.ingrediente}"
                         data-suggested="${item.defaultVal}"
                         value="${initialVal}"
                         class="w-24 bg-slate-900 border border-slate-700 text-emerald-400 rounded-lg py-1 px-2 text-center text-sm font-bold focus:outline-none focus:border-emerald-500">
                  
                  <button onclick="window.app.stepLeftoverInput('${cleanId}', ${stepVal})"
                          class="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-sm flex items-center justify-center transition">+</button>

                  <span class="text-xs text-slate-400 font-bold">${item.medida}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="pt-3 border-t border-slate-800">
          <button onclick="window.app.confirmWeekTurnover(${currentWeek})"
                  class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition">
            Confirmar Estoque e Ir para Semana ${Math.min(5, currentWeek + 1)}
          </button>
        </div>
      </div>
    `);
  }

  function stepLeftoverInput(cleanId, delta) {
    const input = document.getElementById(`leftover-input-${cleanId}`);
    if (!input) return;
    const cur = parseFloat(input.value) || 0;
    input.value = Math.max(0, Math.round((cur + delta) * 100) / 100);
  }

  function confirmWeekTurnover(currentWeek) {
    const nextWeek = Math.min(5, currentWeek + 1);
    const cascade = calculate5WeeksCascade();

    // 1. Para itens planejados para compra nesta semana que NÃO foram comprados:
    // Garante que o ajuste de despensa para a próxima semana seja 0 (evitando estoque fantasma)
    cascade.forEach((row) => {
      const wData = row.weeks[currentWeek - 1];
      if (!wData) return;
      const isBought = !!(state.cartChecked[`${currentWeek}_cascade_${row.ingrediente}`] || state.cartChecked[`${currentWeek}_${row.ingrediente}`]);
      if (wData.qtd_comprar > 0 && !isBought) {
        state.pantryAdjustments[`w${nextWeek}_${row.ingrediente}`] = 0;
      }
    });

    // 2. Salva as sobras verificadas dos itens comprados que estavam no modal
    const inputs = document.querySelectorAll('input[id^="leftover-input-"]');
    inputs.forEach((input) => {
      const ingName = input.getAttribute('data-ing');
      const val = parseFloat(input.value);
      if (ingName && !isNaN(val)) {
        state.pantryAdjustments[`w${nextWeek}_${ingName}`] = val;
      }
    });

    // 3. Registra a virada como concluída
    if (!state.completedTurnovers) state.completedTurnovers = {};
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    state.completedTurnovers[currentWeek] = {
      timestamp: now.toISOString(),
      formattedDate: formattedDate,
      nextWeek: nextWeek
    };

    state.activeWeek = nextWeek;
    saveState();
    renderApp();
    closeModal();
    showToast(`Virada da Semana ${currentWeek} concluída com sucesso! Semana ${nextWeek} ativada.`, 'success');
  }

  function promptReopenTurnover(week) {
    const nextWeek = Math.min(5, week + 1);
    const turnoverInfo = state.completedTurnovers?.[week];
    const dataStr = turnoverInfo?.formattedDate ? `em ${turnoverInfo.formattedDate}` : '';

    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center space-x-3 text-amber-400">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">⚠️</div>
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Proteção de Segurança</span>
            <h3 class="font-bold text-white text-base">Virada da Semana ${week} Já Consolidada</h3>
          </div>
        </div>

        <div class="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            A virada da <strong>Semana ${week} para a Semana ${nextWeek}</strong> já foi realizada anteriormente ${dataStr}.
          </p>
          <p class="text-amber-200 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/40">
            <strong>Atenção:</strong> Se você reabrir a conferência, as quantidades confirmadas agora substituirão os saldos herdados na Semana ${nextWeek}.
          </p>
          <p class="text-slate-400 text-[11px]">
            Deseja realmente reabrir a conferência de estoque da Semana ${week}?
          </p>
        </div>

        <div class="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
          <button onclick="window.app.closeModal()"
                  class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition">
            Cancelar
          </button>
          <button onclick="window.app.openTurnoverModal(${week})"
                  class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-600/30 flex items-center gap-1.5">
            <span>⚠️</span> <span>Sim, Reabrir Conferência</span>
          </button>
        </div>
      </div>
    `);
  }

  // --- HIGIENE MODALS ---
  function openAddHygieneModal() {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white">Adicionar Item de Higiene / Limpeza</h3>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Nome do Item:</label>
            <input type="text" id="hyg-name" placeholder="Ex: Papel Higiênico, Fralda Tam G..."
                   class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Categoria:</label>
              <select id="hyg-cat" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                <option value="Higiene">Higiene</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Bebê / Fraldas">Bebê / Fraldas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Semana de Compra:</label>
              <select id="hyg-week" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                <option value="Semana 1">Semana 1</option>
                <option value="Semana 2">Semana 2</option>
                <option value="Semana 3">Semana 3</option>
                <option value="Semana 4">Semana 4</option>
                <option value="Semana 5">Semana 5</option>
                <option value="Em Estoque / Não Comprar">Em Estoque / Não Comprar</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Quantidade:</label>
              <input type="number" step="any" min="1" id="hyg-qty" value="1"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Valor Unitário (R$):</label>
              <input type="number" step="0.01" min="0" id="hyg-price" placeholder="0,00"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-purple-300 font-bold">
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button onclick="window.app.saveNewHygieneItem()"
                  class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg transition">
            Cadastrar Item
          </button>
        </div>
      </div>
    `);
  }

  function saveNewHygieneItem() {
    const name = document.getElementById('hyg-name')?.value.trim();
    if (!name) {
      showToast('Digite o nome do item.', 'info');
      return;
    }

    const cat = document.getElementById('hyg-cat')?.value || 'Higiene';
    const week = document.getElementById('hyg-week')?.value || 'Semana 1';
    const qty = parseFloat(document.getElementById('hyg-qty')?.value) || 1;
    const price = parseFloat(document.getElementById('hyg-price')?.value) || 0;

    const newItem = {
      id: `hyg_${Date.now()}`,
      nome_item: name,
      categoria: cat,
      semana_compra: week,
      quantidade: qty,
      valor_unitario: price,
      status_estoque: week.includes('Estoque') ? 'Em Estoque' : 'Comprar'
    };

    state.hygieneItems.push(newItem);
    saveState();
    renderApp();
    closeModal();
    showToast('Item de higiene adicionado com sucesso!', 'success');
  }

  function openEditHygieneModal(itemId) {
    const item = state.hygieneItems.find(h => h.id === itemId);
    if (!item) return;

    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white">Editar Item de Higiene</h3>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Nome:</label>
            <input type="text" id="edit-hyg-name" value="${item.nome_item}"
                   class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Semana:</label>
              <select id="edit-hyg-week" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                ${['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Em Estoque / Não Comprar'].map(w => `
                  <option value="${w}" ${w === item.semana_compra ? 'selected' : ''}>${w}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Categoria:</label>
              <select id="edit-hyg-cat" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                ${['Higiene', 'Limpeza', 'Bebê / Fraldas', 'Outros'].map(c => `
                  <option value="${c}" ${c === item.categoria ? 'selected' : ''}>${c}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Quantidade:</label>
              <input type="number" step="any" min="1" id="edit-hyg-qty" value="${item.quantidade}"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Valor Unitário (R$):</label>
              <input type="number" step="0.01" min="0" id="edit-hyg-price" value="${item.valor_unitario.toFixed(2)}"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-purple-300 font-bold">
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2">
          <button onclick="window.app.deleteHygieneItem('${item.id}')"
                  class="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
            Excluir
          </button>
          <button onclick="window.app.saveEditedHygieneItem('${item.id}')"
                  class="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg">
            Salvar
          </button>
        </div>
      </div>
    `);
  }

  function saveEditedHygieneItem(itemId) {
    const idx = state.hygieneItems.findIndex(h => h.id === itemId);
    if (idx === -1) return;

    state.hygieneItems[idx].nome_item = document.getElementById('edit-hyg-name')?.value.trim() || state.hygieneItems[idx].nome_item;
    state.hygieneItems[idx].semana_compra = document.getElementById('edit-hyg-week')?.value || state.hygieneItems[idx].semana_compra;
    state.hygieneItems[idx].categoria = document.getElementById('edit-hyg-cat')?.value || state.hygieneItems[idx].categoria;
    state.hygieneItems[idx].quantidade = parseFloat(document.getElementById('edit-hyg-qty')?.value) || 1;
    state.hygieneItems[idx].valor_unitario = parseFloat(document.getElementById('edit-hyg-price')?.value) || 0;

    saveState();
    renderApp();
    closeModal();
    showToast('Item atualizado com sucesso!', 'success');
  }

  function deleteHygieneItem(itemId) {
    if (!confirm('Deseja realmente excluir este item de higiene?')) return;
    state.hygieneItems = state.hygieneItems.filter(h => h.id !== itemId);
    saveState();
    renderApp();
    closeModal();
    showToast('Item excluído.', 'info');
  }

  // --- INGREDIENT CATALOG MODALS ---
  function openAddIngredientModal() {
    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white">Cadastrar Novo Ingrediente</h3>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Nome:</label>
            <input type="text" id="new-ing-name" placeholder="Ex: Arroz Granjeiro"
                   class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Categoria:</label>
              <select id="new-ing-cat" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                <option value="Mercearia">Mercearia</option>
                <option value="Carnes/Ovos">Carnes/Ovos</option>
                <option value="Hortifrúti">Hortifrúti</option>
                <option value="Laticínios/Padaria">Laticínios/Padaria</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Tipo de Compra:</label>
              <select id="new-ing-tipo" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                <option value="Pacote">Pacote</option>
                <option value="Peso">Peso</option>
                <option value="Unidade">Unidade</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Tam. Pacote:</label>
              <input type="number" step="any" min="0" id="new-ing-pack" value="1000"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Medida:</label>
              <select id="new-ing-unit" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="un">un</option>
                <option value="kg">kg</option>
                <option value="l">l</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Preço (R$):</label>
              <input type="number" step="0.01" min="0" id="new-ing-price" placeholder="0,00"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Peso/Porção Base:</label>
              <input type="number" step="any" min="0" id="new-ing-base" value="100"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Nome Medida Caseira:</label>
              <input type="text" id="new-ing-measure-name" placeholder="Ex: xícara(s) de chá"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button onclick="window.app.saveNewIngredient()"
                  class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition">
            Salvar Ingrediente
          </button>
        </div>
      </div>
    `);
  }

  function saveNewIngredient() {
    const name = document.getElementById('new-ing-name')?.value.trim();
    if (!name) {
      showToast('Digite o nome do ingrediente.', 'info');
      return;
    }

    const newIng = {
      id: `ing_${Date.now()}`,
      nome: name,
      categoria: document.getElementById('new-ing-cat')?.value || 'Mercearia',
      tipo_compra: document.getElementById('new-ing-tipo')?.value || 'Pacote',
      tamanho_pacote: parseFloat(document.getElementById('new-ing-pack')?.value) || 1,
      medida: document.getElementById('new-ing-unit')?.value || 'g',
      preco_pacote: parseFloat(document.getElementById('new-ing-price')?.value) || 0,
      peso_porcao_base: parseFloat(document.getElementById('new-ing-base')?.value) || 1,
      nome_medida_caseira: document.getElementById('new-ing-measure-name')?.value.trim() || 'unidade(s)'
    };

    state.ingredients.push(newIng);
    saveState();
    renderApp();
    closeModal();
    showToast(`Ingrediente ${name} adicionado com sucesso!`, 'success');
  }

  function openEditIngredientModal(ingId) {
    const ing = state.ingredients.find(i => i.id === ingId);
    if (!ing) return;

    renderModal(`
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white">Editar Ingrediente</h3>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Nome:</label>
            <input type="text" id="edit-ing-name" value="${ing.nome}"
                   class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Categoria:</label>
              <select id="edit-ing-cat" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                ${['Mercearia', 'Carnes/Ovos', 'Hortifrúti', 'Laticínios/Padaria', 'Outros'].map(c => `
                  <option value="${c}" ${c === ing.categoria ? 'selected' : ''}>${c}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Tipo de Compra:</label>
              <select id="edit-ing-tipo" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                ${['Pacote', 'Peso', 'Unidade'].map(t => `
                  <option value="${t}" ${t === ing.tipo_compra ? 'selected' : ''}>${t}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Tam. Pacote:</label>
              <input type="number" step="any" min="0" id="edit-ing-pack" value="${ing.tamanho_pacote}"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Medida:</label>
              <select id="edit-ing-unit" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                ${['g', 'ml', 'un', 'kg', 'l'].map(u => `
                  <option value="${u}" ${u === ing.medida ? 'selected' : ''}>${u}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Preço (R$):</label>
              <input type="number" step="0.01" min="0" id="edit-ing-price" value="${ing.preco_pacote.toFixed(2)}"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Peso/Porção Base:</label>
              <input type="number" step="any" min="0" id="edit-ing-base" value="${ing.peso_porcao_base}"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Nome Medida Caseira:</label>
              <input type="text" id="edit-ing-measure-name" value="${ing.nome_medida_caseira}"
                     class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2">
          <button onclick="window.app.deleteIngredient('${ing.id}')"
                  class="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
            Excluir
          </button>
          <button onclick="window.app.saveEditedIngredient('${ing.id}')"
                  class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg">
            Salvar Alterações
          </button>
        </div>
      </div>
    `);
  }

  function saveEditedIngredient(ingId) {
    const idx = state.ingredients.findIndex(i => i.id === ingId);
    if (idx === -1) return;

    const oldName = state.ingredients[idx].nome;
    const newName = document.getElementById('edit-ing-name')?.value.trim() || oldName;

    state.ingredients[idx].nome = newName;
    state.ingredients[idx].categoria = document.getElementById('edit-ing-cat')?.value || state.ingredients[idx].categoria;
    state.ingredients[idx].tipo_compra = document.getElementById('edit-ing-tipo')?.value || state.ingredients[idx].tipo_compra;
    state.ingredients[idx].tamanho_pacote = parseFloat(document.getElementById('edit-ing-pack')?.value) || state.ingredients[idx].tamanho_pacote;
    state.ingredients[idx].medida = document.getElementById('edit-ing-unit')?.value || state.ingredients[idx].medida;
    state.ingredients[idx].preco_pacote = parseFloat(document.getElementById('edit-ing-price')?.value) || state.ingredients[idx].preco_pacote;
    state.ingredients[idx].peso_porcao_base = parseFloat(document.getElementById('edit-ing-base')?.value) || state.ingredients[idx].peso_porcao_base;
    state.ingredients[idx].nome_medida_caseira = document.getElementById('edit-ing-measure-name')?.value.trim() || state.ingredients[idx].nome_medida_caseira;

    // Update across all 5 weeks' menus
    const updatedIng = state.ingredients[idx];
    [1, 2, 3, 4, 5].forEach((w) => {
      const items = getActiveMenuItems(w);
      items.forEach((m) => {
        if (m.ingrediente_nome === oldName) {
          m.ingrediente_nome = newName;
        }
        if (m.ingrediente_nome === newName) {
          m.medida = updatedIng.medida;
          m.medida_caseira_str = formatHouseholdMeasure(m.qtd_total_familia, updatedIng.peso_porcao_base, updatedIng.nome_medida_caseira);
          m.custo = (m.qtd_total_familia / updatedIng.tamanho_pacote) * updatedIng.preco_pacote;
        }
      });
    });

    saveState();
    renderApp();
    closeModal();
    showToast(`Ingrediente ${newName} atualizado com sucesso!`, 'success');
  }

  function deleteIngredient(ingId) {
    const ing = state.ingredients.find(i => i.id === ingId);
    if (!ing) return;

    if (!confirm(`Deseja realmente excluir o ingrediente ${ing.nome}?`)) return;

    state.ingredients = state.ingredients.filter(i => i.id !== ingId);
    saveState();
    renderApp();
    closeModal();
    showToast(`Ingrediente ${ing.nome} removido.`, 'info');
  }

  // Backup Methods
  function exportBackupJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `Planejamento_Familiar_Backup_${dateStr}.json`);
    dlAnchorElem.click();
    showToast('Backup exportado com sucesso!', 'success');
  }

  function importBackupJSON(event) {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.ingredients && (parsed.menuItems || parsed.menuByWeek)) {
          state = { ...state, ...parsed };
          saveState();
          renderApp();
          showToast('Backup importado com sucesso!', 'success');
        } else {
          showToast('Arquivo de backup inválido.', 'error');
        }
      } catch (err) {
        showToast('Erro ao ler arquivo JSON.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function confirmResetToDefault() {
    if (confirm('Tem certeza de que deseja restaurar o padrão original da planilha? Todas as modificações manuais serão reiniciadas para os valores padrão.')) {
      resetToDefault();
    }
  }

  // --- SINCRONIZAÇÃO SUPABASE ---
  let supabaseSyncTimer = null;
  let supabaseSyncStatus = 'idle';

  function updateCloudStatusBadge(status) {
    supabaseSyncStatus = status;
    const badge = document.getElementById('cloud-sync-pill');
    if (!badge) return;
    if (status === 'syncing') {
      badge.innerHTML = '<span class="animate-spin inline-block">🔄</span> <span class="text-[11px] font-semibold text-amber-300 hidden md:inline">Sincronizando...</span>';
      badge.className = 'flex items-center space-x-1 sm:space-x-1.5 bg-amber-950/60 text-amber-300 border border-amber-700/60 px-2 sm:px-2.5 py-1.5 rounded-full shadow-sm transition text-xs';
    } else if (status === 'synced') {
      badge.innerHTML = '<span>☁️</span> <span class="text-[11px] font-semibold text-emerald-300 hidden md:inline">Nuvem Ok</span>';
      badge.className = 'flex items-center space-x-1 sm:space-x-1.5 bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 px-2 sm:px-2.5 py-1.5 rounded-full shadow-sm transition text-xs';
    } else if (status === 'error') {
      badge.innerHTML = '<span>⚠️</span> <span class="text-[11px] font-semibold text-rose-300 hidden md:inline">Erro Nuvem</span>';
      badge.className = 'flex items-center space-x-1 sm:space-x-1.5 bg-rose-950/60 text-rose-300 border border-rose-700/60 px-2 sm:px-2.5 py-1.5 rounded-full shadow-sm transition text-xs';
    } else {
      const hasKey = !!state.supabaseConfig?.key;
      badge.innerHTML = '<span>' + (hasKey ? '☁️' : '⚪') + '</span> <span class="text-[11px] font-semibold ' + (hasKey ? 'text-slate-300' : 'text-slate-400') + ' hidden md:inline">' + (hasKey ? 'Nuvem Conectada' : 'Nuvem Off') + '</span>';
      badge.className = 'flex items-center space-x-1 sm:space-x-1.5 ' + (hasKey ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' : 'bg-slate-800 text-slate-400 border-slate-700') + ' hover:bg-slate-700 active:scale-95 border px-2 sm:px-2.5 py-1.5 rounded-full shadow-sm transition text-xs cursor-pointer';
    }
  }

  function syncWithSupabaseSilent() {
    if (!state.supabaseConfig?.autoSync || !state.supabaseConfig.url || !state.supabaseConfig.key) return;
    if (supabaseSyncTimer) clearTimeout(supabaseSyncTimer);
    supabaseSyncTimer = setTimeout(() => {
      uploadToSupabase(false);
    }, 1500);
  }

  async function testSupabaseConnection(manual = true) {
    const cfg = state.supabaseConfig;
    if (!cfg || !cfg.url || !cfg.key) {
      if (manual) showToast('Preencha a URL e a Chave anon do Supabase primeiro.', 'warning');
      return false;
    }
    try {
      updateCloudStatusBadge('syncing');
      const cleanUrl = cfg.url.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/planejamento_familiar_state?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`
        }
      });
      if (res.ok) {
        updateCloudStatusBadge('synced');
        if (manual) showToast('🟢 Conexão com Supabase realizada com sucesso!', 'success');
        return true;
      } else {
        updateCloudStatusBadge('error');
        const errText = await res.text();
        if (manual) {
          if (res.status === 404 || errText.includes('relation') || errText.includes('does not exist')) {
            showToast('⚠️ Conectado ao Supabase, mas a tabela "planejamento_familiar_state" ainda não foi criada. Execute o script SQL no SQL Editor do Supabase.', 'warning');
          } else {
            showToast(`❌ Falha na autenticação (${res.status}): Verifique sua anon public key.`, 'error');
          }
        }
        return false;
      }
    } catch (err) {
      updateCloudStatusBadge('error');
      if (manual) showToast('❌ Erro de rede ao conectar com Supabase: ' + err.message, 'error');
      return false;
    }
  }

  async function uploadToSupabase(showNotification = true) {
    const cfg = state.supabaseConfig;
    if (!cfg || !cfg.url || !cfg.key) {
      if (showNotification) showToast('Configure a URL e a Chave do Supabase antes de enviar.', 'warning');
      return false;
    }
    try {
      updateCloudStatusBadge('syncing');
      const cleanUrl = cfg.url.replace(/\/+$/, '');
      const payload = {
        id: 'default',
        state: state,
        updated_at: new Date().toISOString()
      };
      const res = await fetch(`${cleanUrl}/rest/v1/planejamento_familiar_state`, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        state.lastSync = new Date().toISOString();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
        updateCloudStatusBadge('synced');
        if (showNotification) showToast('☁️ Dados salvos e sincronizados com a nuvem Supabase!', 'success');
        const lastSyncEl = document.getElementById('supabase-last-sync-label');
        if (lastSyncEl) lastSyncEl.textContent = new Date().toLocaleString('pt-BR');
        return true;
      } else {
        const errText = await res.text();
        updateCloudStatusBadge('error');
        if (showNotification) {
          if (res.status === 404 || errText.includes('relation') || errText.includes('does not exist')) {
            showToast('⚠️ A tabela "planejamento_familiar_state" não existe no Supabase. Crie-a no SQL Editor com o script fornecido.', 'warning');
          } else {
            showToast(`Erro ao salvar no Supabase (${res.status}): ${errText.slice(0, 100)}`, 'error');
          }
        }
        return false;
      }
    } catch (err) {
      updateCloudStatusBadge('error');
      if (showNotification) showToast('Falha na conexão com Supabase: ' + err.message, 'error');
      return false;
    }
  }

  async function downloadFromSupabase(showNotification = true) {
    const cfg = state.supabaseConfig;
    if (!cfg || !cfg.url || !cfg.key) {
      if (showNotification) showToast('Configure a URL e a Chave do Supabase antes de baixar.', 'warning');
      return false;
    }
    if (showNotification) {
      if (!confirm('Deseja baixar os dados da nuvem? Isso substituirá os dados locais deste navegador pelos dados mais recentes do Supabase.')) {
        return false;
      }
    }
    try {
      updateCloudStatusBadge('syncing');
      const cleanUrl = cfg.url.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/planejamento_familiar_state?id=eq.default&select=*`, {
        method: 'GET',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (!rows || rows.length === 0 || !rows[0].state) {
          if (showNotification) showToast('Nenhum dado salvo no Supabase ainda. Faça um envio inicial antes de baixar!', 'warning');
          updateCloudStatusBadge('idle');
          return false;
        }
        const cloudState = rows[0].state;
        const savedConfig = state.supabaseConfig;
        state = {
          ...cloudState,
          supabaseConfig: savedConfig,
          lastSync: rows[0].updated_at || new Date().toISOString()
        };
        saveState();
        renderApp();
        updateCloudStatusBadge('synced');
        if (showNotification) showToast('⬇️ Dados sincronizados com sucesso da nuvem Supabase!', 'success');
        return true;
      } else {
        const errText = await res.text();
        updateCloudStatusBadge('error');
        if (showNotification) showToast('Erro ao baixar do Supabase: ' + errText.slice(0, 100), 'error');
        return false;
      }
    } catch (err) {
      updateCloudStatusBadge('error');
      if (showNotification) showToast('Falha ao conectar com Supabase: ' + err.message, 'error');
      return false;
    }
  }

  function saveSupabaseFromForm() {
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    const autoSyncInput = document.getElementById('supabase-autosync-toggle');
    const url = (urlInput && urlInput.value.trim()) || state.supabaseConfig?.url || 'https://deydppcfgyqbudzqiqty.supabase.co';
    const key = keyInput ? keyInput.value.trim() : (state.supabaseConfig?.key || '');
    const autoSync = autoSyncInput ? autoSyncInput.checked : true;

    state.supabaseConfig = { url, key, autoSync };
    saveState();
    showToast('Configurações do Supabase salvas!', 'success');
    updateCloudStatusBadge(key ? 'idle' : 'idle');
    renderApp();
  }

  // Modal Container
  function renderModal(contentHtml) {
    let modalEl = document.getElementById('app-modal-container');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'app-modal-container';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop" onclick="if(event.target === this) window.app.closeModal()">
        <div class="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl bottom-sheet bottom-sheet-mobile max-h-[92vh] overflow-y-auto">
          ${contentHtml}
        </div>
      </div>
    `;
  }

  function closeModal() {
    const modalEl = document.getElementById('app-modal-container');
    if (modalEl) modalEl.innerHTML = '';
  }

  // Toast
  function showToast(message, type = 'info') {
    let container = document.getElementById('app-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'app-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white border border-slate-700';

    toast.className = `toast max-w-sm w-full py-2.5 px-4 rounded-xl shadow-xl flex items-center justify-between text-xs sm:text-sm font-medium mb-2 ${bgClass}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="ml-3 text-slate-300 hover:text-white" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }


  // ==========================================
  // SISTEMA DE FECHAMENTO DE CICLO & HISTÓRICO
  // ==========================================

  function calculateCycleSummary(targetWeekIdx = 5) {
    const cascade = calculate5WeeksCascade();
    const weekSummaries = [];
    let totalCyclePrevisto = 0;
    let totalCycleReal = 0;
    let totalItemsBought = 0;
    let totalItemsPlanned = 0;

    for (let w = 1; w <= 5; w++) {
      let wPrevisto = 0;
      let wReal = 0;
      let wCountPlanned = 0;
      let wCountBought = 0;

      cascade.forEach((row) => {
        const wd = row.weeks[w - 1];
        if (wd && wd.qtd_comprar > 0) {
          const adj = state.adjustedPrices[`${w}_cascade_${row.ingrediente}`] || state.adjustedPrices[`${w}_${row.ingrediente}`];
          const cost = adj?.price !== undefined ? adj.price : wd.custo_estimado;
          wPrevisto += cost;
          wCountPlanned++;
          if (state.cartChecked[`${w}_cascade_${row.ingrediente}`]) {
            wReal += cost;
            wCountBought++;
          }
        }
      });

      // Hygiene items
      state.hygieneItems.filter(h => h.semana_compra === `Semana ${w}`).forEach((h) => {
        const cost = h.quantidade * h.valor_unitario;
        wPrevisto += cost;
        wCountPlanned++;
        if (state.cartChecked[`${w}_hyg_${h.id}`]) {
          wReal += cost;
          wCountBought++;
        }
      });

      // Extra items
      state.extraItems.filter(e => e.week === w).forEach((e) => {
        wPrevisto += e.preco;
        wCountPlanned++;
        if (state.cartChecked[`${w}_extra_${e.id}`]) {
          wReal += e.preco;
          wCountBought++;
        }
      });

      const dRange = getWeekDateRange(w);
      weekSummaries.push({
        week: w,
        dateRange: dRange.label,
        totalPrevisto: wPrevisto,
        totalReal: wReal,
        itemsPlanned: wCountPlanned,
        itemsBought: wCountBought,
        isConcluded: !!state.completedTurnovers?.[w]
      });

      totalCyclePrevisto += wPrevisto;
      totalCycleReal += wReal;
      totalItemsPlanned += wCountPlanned;
      totalItemsBought += wCountBought;
    }

    return {
      weekSummaries,
      totalCyclePrevisto,
      totalCycleReal,
      totalItemsPlanned,
      totalItemsBought
    };
  }

    function fillSuggestedCycleTurnover() {
    const inputs = document.querySelectorAll('input[id^="cycle-leftover-"]');
    inputs.forEach(input => {
      const sug = input.getAttribute('data-suggested');
      if (sug !== null) {
        input.value = sug;
      }
    });
    showToast('Valores restaurados para as sobras calculadas do ciclo', 'info');
  }

  function zeroAllCycleTurnover() {
    const inputs = document.querySelectorAll('input[id^="cycle-leftover-"]');
    inputs.forEach(input => {
      input.value = 0;
    });
    showToast('Todas as sobras do ciclo foram zeradas (0)', 'info');
  }

  function openCycleTurnoverModal() {
    const cascade = calculate5WeeksCascade();
    const summary = calculateCycleSummary();
    const cycleNum = state.currentCycleNumber || 1;
    const range1 = getWeekDateRange(1);
    const range5 = getWeekDateRange(5);
    const cycleLabel = `Ciclo ${cycleNum} (${range1.start} a ${range5.end})`;

    // Apenas itens que foram EFETIVAMENTE COMPRADOS na Semana 5 e tiveram sobra
    const leftoverItems = [];
    cascade.forEach((row) => {
      const w5Data = row.weeks[4]; // index 4 = Week 5
      if (!w5Data) return;

      const hadPlannedBuy = w5Data.qtd_comprar > 0;
      const isBought = !!(state.cartChecked[`5_cascade_${row.ingrediente}`] || state.cartChecked[`5_${row.ingrediente}`]);
      const isWeight = (row.tipo_compra || row.tipo_venda) === 'Peso';
      const adj = state.adjustedPrices?.[`5_cascade_${row.ingrediente}`] || state.adjustedPrices?.[`5_${row.ingrediente}`];
      
      let theoreticalLeftover = w5Data.sobra_proxima_semana || 0;
      if (isBought && adj?.qty !== undefined) {
        if (isWeight) {
          theoreticalLeftover = Math.max(0, Math.round((adj.qty - w5Data.consumo_semanal) * 100) / 100);
        } else {
          theoreticalLeftover = Math.max(0, Math.round((w5Data.estoque_disponivel + (adj.qty * (row.tamanho_pacote || 1)) - w5Data.consumo_semanal) * 100) / 100);
        }
      }

      if (hadPlannedBuy && isBought && theoreticalLeftover > 0) {
        leftoverItems.push({
          ingrediente: row.ingrediente,
          sobraTeorica: theoreticalLeftover,
          medida: row.medida,
          tamanho_pacote: row.tamanho_pacote,
          isBought: true,
          status: 'bought',
          defaultVal: theoreticalLeftover
        });
      }
    });

    const nextStartDate = calculateNextCycleStartDate();

    renderModal(`
      <div class="space-y-4 max-w-xl mx-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🏆</span>
            <div>
              <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Conclusão de Ciclo Completo</span>
              <h3 class="text-lg font-bold text-white leading-tight">Fechamento do ${cycleLabel}</h3>
            </div>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1 text-xl">✕</button>
        </div>

        <!-- Financial Summary Card of the Cycle -->
        <div class="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/90 border border-slate-700/80 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-300">Resumo Financeiro das 5 Semanas:</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/40 text-emerald-300 font-semibold">
              Ciclo ${cycleNum}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div class="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
              <span class="text-slate-400 block text-[10px]">Total Previsto:</span>
              <strong class="text-base text-white font-black">R$ ${summary.totalCyclePrevisto.toFixed(2).replace('.', ',')}</strong>
            </div>

            <div class="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60">
              <span class="text-emerald-300 block text-[10px]">Total no Carrinho:</span>
              <strong class="text-base text-emerald-400 font-black">R$ ${summary.totalCycleReal.toFixed(2).replace('.', ',')}</strong>
            </div>

            <div class="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
              <span class="text-slate-400 block text-[10px]">Itens Comprados:</span>
              <strong class="text-base text-slate-200 font-black">${summary.totalItemsBought} de ${summary.totalItemsPlanned}</strong>
            </div>
          </div>
        </div>

        <!-- Week 5 Final Leftovers Conference -->
        <div class="space-y-2">
          <div class="p-3 bg-blue-950/40 rounded-xl border border-blue-800/40 text-xs text-slate-300 space-y-1">
            <strong class="text-blue-300 flex items-center gap-1.5">
              <span>📦</span> <span>Sobras Finais Compradas na Semana 5:</span>
            </strong>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              O que sobrou das compras da Semana 5 será transferido como <strong>Estoque Inicial da Semana 1 do próximo ciclo</strong>.
            </p>
          </div>

          ${leftoverItems.length > 0 ? `
            <!-- Ações Rápidas do Ciclo -->
            <div class="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <span class="text-slate-400 font-semibold flex items-center gap-1">
                <span>⚡</span> <span>Ações Rápidas:</span>
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button onclick="window.app.fillSuggestedCycleTurnover()"
                        class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition text-[11px] flex items-center gap-1">
                  <span>↺</span> <span>Restaurar Sobras</span>
                </button>
                <button onclick="window.app.zeroAllCycleTurnover()"
                        class="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 font-medium transition text-[11px] flex items-center gap-1">
                  <span>0</span> <span>Zerar Todas</span>
                </button>
              </div>
            </div>
          ` : ''}

          <div class="max-h-56 overflow-y-auto space-y-2.5 pr-1">
            ${leftoverItems.length === 0 ? `
              <div class="text-center py-4 text-slate-400 text-xs bg-slate-800/40 rounded-xl border border-slate-800 p-3">
                Nenhum ingrediente comprado com sobra pendente na Semana 5.
              </div>
            ` : leftoverItems.map((item) => {
              const cleanId = item.ingrediente.replace(/[^a-zA-Z0-9]/g, '_');
              const stepVal = item.medida === 'g' || item.medida === 'ml' ? 50 : 1;

              return `
                <div class="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-sm text-white">${item.ingrediente}</span>
                        <span class="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/50">✓ Comprado</span>
                      </div>
                      <span class="text-[10px] text-slate-400 block mt-0.5">
                        Cálculo teórico: <strong class="text-slate-300">${item.sobraTeorica} ${item.medida}</strong>
                      </span>
                    </div>

                    <div class="flex gap-1">
                      <button onclick="document.getElementById('cycle-leftover-${cleanId}').value = 0"
                              class="px-2 py-0.5 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[10px] font-semibold transition">
                        Zerou!
                      </button>
                      <button onclick="document.getElementById('cycle-leftover-${cleanId}').value = ${item.sobraTeorica}"
                              class="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-semibold transition">
                        Manter
                      </button>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2 pt-0.5">
                    <span class="text-xs text-slate-400 font-medium">Real no armário:</span>
                    <button onclick="window.app.stepCycleLeftover('${cleanId}', -${stepVal})"
                            class="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center">-</button>
                    <input type="number" step="any" min="0"
                           id="cycle-leftover-${cleanId}"
                           data-ing="${item.ingrediente}"
                           data-suggested="${item.defaultVal}"
                           value="${item.defaultVal}"
                           class="w-24 bg-slate-900 border border-slate-700 text-emerald-400 rounded-lg py-1 px-2 text-center text-xs font-bold focus:outline-none focus:border-emerald-500">
                    <button onclick="window.app.stepCycleLeftover('${cleanId}', ${stepVal})"
                            class="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center">+</button>
                    <span class="text-xs text-slate-400 font-bold">${item.medida}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Next Cycle Configuration Section -->
        <div class="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
          <label class="block text-xs font-bold text-white flex items-center gap-1.5">
            <span>🗓️</span> <span>Data de Início do Novo Ciclo (Ciclo ${cycleNum + 1}):</span>
          </label>
          <div class="flex items-center gap-2">
            <input type="date" id="next-cycle-start-date"
                   value="${nextStartDate}"
                   class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-emerald-500">
            <span class="text-[11px] text-slate-400">Começa na ${state.firstDayOfWeek || 'Segunda'}</span>
          </div>
          <p class="text-[11px] text-slate-400">
            * O cardápio e os ingredientes permanecem salvos exatamente como você configurou. O carrinho da Semana 1 será limpo para a nova rodada!
          </p>
        </div>

        <!-- Confirm Action Button -->
        <div class="pt-2 border-t border-slate-800 flex flex-col gap-2">
          <button onclick="window.app.confirmCycleCompletion()"
                  class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition">
            <span>🏆</span> <span>Arquivar Ciclo no Histórico & Iniciar Ciclo ${cycleNum + 1}</span>
          </button>
          <button onclick="window.app.closeModal()"
                  class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition">
            Voltar sem fechar ciclo
          </button>
        </div>
      </div>
    `);
  }

  function stepCycleLeftover(cleanId, delta) {
    const input = document.getElementById(`cycle-leftover-${cleanId}`);
    if (!input) return;
    const cur = parseFloat(input.value) || 0;
    input.value = Math.max(0, Math.round((cur + delta) * 100) / 100);
  }

  function confirmCycleCompletion() {
    const cycleNum = state.currentCycleNumber || 1;
    const summary = calculateCycleSummary();
    const range1 = getWeekDateRange(1);
    const range5 = getWeekDateRange(5);
    const cycleName = `Ciclo ${cycleNum} (${range1.start} a ${range5.end})`;

    const cascade = calculate5WeeksCascade();
    const verifiedLeftovers = {};

    // 1. Itens da Semana 5:
    cascade.forEach((row) => {
      const w5Data = row.weeks[4];
      if (!w5Data) return;
      const isBought = !!(state.cartChecked[`5_cascade_${row.ingrediente}`] || state.cartChecked[`5_${row.ingrediente}`]);
      if (w5Data.qtd_comprar > 0 && !isBought) {
        // Não comprado na Semana 5: saldo para o novo ciclo é 0
        verifiedLeftovers[row.ingrediente] = 0;
      } else if (w5Data.qtd_comprar === 0 && w5Data.sobra_proxima_semana > 0) {
        // Item que já estava no armário (ex: azeite): transfere seu saldo natural para o novo ciclo
        verifiedLeftovers[row.ingrediente] = w5Data.sobra_proxima_semana;
      }
    });

    // 2. Sobras dos itens comprados no modal
    const inputs = document.querySelectorAll('input[id^="cycle-leftover-"]');
    inputs.forEach((input) => {
      const ingName = input.getAttribute('data-ing');
      const val = parseFloat(input.value);
      if (ingName && !isNaN(val)) {
        verifiedLeftovers[ingName] = val;
      }
    });

    // Archive current cycle in history
    if (!Array.isArray(state.cycleHistory)) state.cycleHistory = [];
    state.cycleHistory.unshift({
      cycleNumber: cycleNum,
      name: cycleName,
      startDate: state.cycleStartDate || '2026-11-02',
      completedAt: new Date().toISOString(),
      summary: summary,
      leftoversAtEnd: verifiedLeftovers
    });

    // Advance to next cycle
    state.currentCycleNumber = cycleNum + 1;
    const nextDateInput = document.getElementById('next-cycle-start-date');
    if (nextDateInput && nextDateInput.value) {
      state.cycleStartDate = nextDateInput.value;
    } else {
      state.cycleStartDate = calculateNextCycleStartDate();
    }

    // Set verified leftovers as initial stock for the new cycle
    state.initialStock = { ...verifiedLeftovers };
    state.pantryAdjustments = {}; // Clear manual turnover adjustments for new cycle
    state.completedTurnovers = {}; // Reset turnover records for the new cycle
    state.activeWeek = 1; // Return to Week 1

    // Clear Week 1 cartChecked so user starts with a clean shopping list for the new cycle
    Object.keys(state.cartChecked).forEach((k) => {
      if (k.startsWith('1_')) {
        delete state.cartChecked[k];
      }
    });

    saveState();
    closeModal();
    renderApp();
    showToast(`${cycleName} concluído com sucesso! Ciclo ${state.currentCycleNumber} iniciado.`, 'success');
  }

  function renderCycleHistoryMode(container) {
    const history = state.cycleHistory || [];
    const currentNum = state.currentCycleNumber || 1;
    const currentRange1 = getWeekDateRange(1);
    const currentRange5 = getWeekDateRange(5);
    const currentSummary = calculateCycleSummary();

    const totalCyclesArchived = history.length;
    const grandTotalSpent = history.reduce((acc, c) => acc + (c.totalReal || 0), 0);
    const grandTotalPrevisto = history.reduce((acc, c) => acc + (c.totalPrevisto || 0), 0);
    const avgSpentPerCycle = totalCyclesArchived > 0 ? grandTotalSpent / totalCyclesArchived : 0;
    const avgSpentPerWeek = totalCyclesArchived > 0 ? grandTotalSpent / (totalCyclesArchived * 5) : 0;

    container.innerHTML = `
      <div class="space-y-6 max-w-4xl mx-auto pb-24">
        <!-- Header -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-600/40 flex items-center justify-center text-2xl shadow">
                📊
              </div>
              <div>
                <h2 class="text-xl sm:text-2xl font-black text-white">Histórico & Evolução de Ciclos</h2>
                <p class="text-xs text-slate-400">Acompanhe seus gastos, compras e evolução financeira ao longo dos meses.</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="window.app.switchTab('compras')"
                      class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700">
                <span>🛒</span> <span>Ver Ciclo Ativo</span>
              </button>
              ${history.length > 0 ? `
                <button onclick="window.app.shareGeneralHistoryWhatsApp()"
                        class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow">
                  <span>📱</span> <span>Exportar Relatório</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div class="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-sm">
              <span class="text-[11px] text-slate-400 block font-medium">Ciclos Arquivados</span>
              <span class="text-xl font-black text-white mt-0.5 block">${totalCyclesArchived}</span>
              <span class="text-[10px] text-slate-500">Ciclo ${currentNum} em andamento</span>
            </div>

            <div class="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 shadow-sm">
              <span class="text-[11px] text-emerald-300 block font-medium">Total Gasto em Compras</span>
              <span class="text-xl font-black text-emerald-400 mt-0.5 block">R$ ${grandTotalSpent.toFixed(2).replace('.', ',')}</span>
              <span class="text-[10px] text-emerald-400/70">Soma de ciclos fechados</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-sm">
              <span class="text-[11px] text-slate-400 block font-medium">Média por Ciclo (Mês)</span>
              <span class="text-xl font-black text-white mt-0.5 block">R$ ${avgSpentPerCycle.toFixed(2).replace('.', ',')}</span>
              <span class="text-[10px] text-slate-500">Baseado no histórico</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-sm">
              <span class="text-[11px] text-slate-400 block font-medium">Média Semanal</span>
              <span class="text-xl font-black text-amber-300 mt-0.5 block">R$ ${avgSpentPerWeek.toFixed(2).replace('.', ',')}</span>
              <span class="text-[10px] text-slate-500">Custo médio por semana</span>
            </div>
          </div>
        </div>

        <!-- Current Active Cycle Status Banner -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 to-slate-900 border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⏳</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-blue-300">Ciclo Atual em Andamento:</span>
                <span class="text-[11px] font-black text-white bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/50">
                  Ciclo ${currentNum}
                </span>
                <span class="text-xs text-slate-400">(${currentRange1.start} a ${currentRange5.end})</span>
              </div>
              <p class="text-xs text-slate-300 mt-0.5">
                Semana ativa: <strong class="text-emerald-400">Semana ${state.activeWeek}</strong> • Total previsto: <strong>R$ ${currentSummary.totalCyclePrevisto.toFixed(2).replace('.', ',')}</strong> • No carrinho: <strong>R$ ${currentSummary.totalCycleReal.toFixed(2).replace('.', ',')}</strong>
              </p>
            </div>
          </div>

          <button onclick="window.app.switchTab('compras')"
                  class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap transition shadow">
            Ir para Compras da Semana
          </button>
        </div>

        <!-- Section: Archived Cycles List -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>📚</span> <span>Histórico de Ciclos Concluídos (${history.length})</span>
            </h3>
            ${history.length > 0 ? `
              <span class="text-xs text-slate-400">Mais recentes primeiro</span>
            ` : ''}
          </div>

          ${history.length === 0 ? `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <span class="text-4xl">📂</span>
              <h4 class="text-lg font-bold text-white">Nenhum ciclo arquivado ainda</h4>
              <p class="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Você está atualmente no <strong>Ciclo ${currentNum}</strong>. Conforme você avança e conclui a Semana 5 na aba Compras, o fechamento completo do ciclo será registrado aqui com gráficos, comparativos e histórico semana a semana!
              </p>
              <div class="pt-2">
                <button onclick="window.app.switchTab('compras')"
                        class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow">
                  Acompanhar Compras da Semana ${state.activeWeek}
                </button>
              </div>
            </div>
          ` : `
            <div class="space-y-3">
              ${history.map((cycle, idx) => {
                const diff = (cycle.totalPrevisto || 0) - (cycle.totalReal || 0);
                const economyLabel = diff > 0 ? `Economia de R$ ${diff.toFixed(2).replace('.', ',')}` : diff < 0 ? `Acima em R$ ${Math.abs(diff).toFixed(2).replace('.', ',')}` : 'Gasto exatamente o previsto';

                return `
                  <div class="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition shadow-md space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-bold text-xs">
                            ${cycle.name || `Ciclo ${cycle.cycleNumber}`}
                          </span>
                          <span class="text-xs text-slate-400">
                            Fechado em ${cycle.formattedDateClosed || 'Data não registrada'}
                          </span>
                        </div>
                        <h4 class="text-lg font-black text-white mt-1">
                          Gasto Real: <span class="text-emerald-400">R$ ${(cycle.totalReal || 0).toFixed(2).replace('.', ',')}</span>
                          <span class="text-xs font-normal text-slate-400 ml-2">(Previsto: R$ ${(cycle.totalPrevisto || 0).toFixed(2).replace('.', ',')})</span>
                        </h4>
                      </div>

                      <div class="flex items-center gap-2">
                        <button onclick="window.app.openCycleDetailModal('${cycle.id}')"
                                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
                          <span>🔍</span> <span>Ver Detalhes</span>
                        </button>

                        <button onclick="window.app.shareCycleWhatsApp('${cycle.id}')"
                                class="p-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/40 text-xs transition"
                                title="Compartilhar resumo no WhatsApp">
                          <span>📱</span>
                        </button>

                        <button onclick="window.app.deleteCycleHistory('${cycle.id}')"
                                class="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 border border-slate-700 text-xs transition"
                                title="Excluir este ciclo do histórico">
                          <span>🗑️</span>
                        </button>
                      </div>
                    </div>

                    <!-- 5 Weeks Breakdown Preview Bar -->
                    <div class="grid grid-cols-5 gap-1.5 text-center text-xs pt-1 border-t border-slate-800/80">
                      ${(cycle.weekSummaries || []).map((ws) => `
                        <div class="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                          <span class="text-[10px] text-slate-400 font-medium block">Sem ${ws.week}</span>
                          <strong class="text-xs text-white block mt-0.5">R$ ${(ws.totalReal || 0).toFixed(2).replace('.', ',')}</strong>
                          <span class="text-[9px] text-emerald-400/80 block mt-0.5">${ws.itemsBought || 0} itens</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  function openCycleDetailModal(cycleId) {
    const cycle = (state.cycleHistory || []).find(c => c.id === cycleId);
    if (!cycle) return;

    renderModal(`
      <div class="space-y-4 max-w-lg mx-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Detalhes do Ciclo</span>
            <h3 class="text-lg font-bold text-white mt-0.5">${cycle.name || `Ciclo ${cycle.cycleNumber}`}</h3>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1 text-xl">✕</button>
        </div>

        <div class="grid grid-cols-2 gap-2.5 text-xs">
          <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span class="text-slate-400 block text-[10px]">Total Previsto:</span>
            <strong class="text-base text-white font-black">R$ ${(cycle.totalPrevisto || 0).toFixed(2).replace('.', ',')}</strong>
          </div>
          <div class="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/50">
            <span class="text-emerald-300 block text-[10px]">Total Real Comprado:</span>
            <strong class="text-base text-emerald-400 font-black">R$ ${(cycle.totalReal || 0).toFixed(2).replace('.', ',')}</strong>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="text-xs font-bold text-slate-300">Detalhamento Semana a Semana:</h4>
          <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
            ${(cycle.weekSummaries || []).map((ws) => `
              <div class="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-white">Semana ${ws.week}</span>
                  <span class="text-[10px] text-slate-400 block">${ws.dateRange || ''}</span>
                </div>
                <div class="text-right">
                  <span class="font-black text-emerald-400">R$ ${(ws.totalReal || 0).toFixed(2).replace('.', ',')}</span>
                  <span class="text-[10px] text-slate-400 block">${ws.itemsBought || 0} itens comprados</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${cycle.finalLeftovers && Object.keys(cycle.finalLeftovers).length > 0 ? `
          <div class="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
            <strong class="text-slate-200 block">Sobras transferidas para o ciclo seguinte:</strong>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              ${Object.entries(cycle.finalLeftovers).filter(([k, v]) => v > 0).map(([k, v]) => `${k}: ${v}`).join(' • ') || 'Nenhuma sobra com saldo restante'}
            </p>
          </div>
        ` : ''}

        <div class="pt-2 border-t border-slate-800 flex items-center gap-2">
          <button onclick="window.app.shareCycleWhatsApp('${cycle.id}')"
                  class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow">
            <span>📱</span> <span>Compartilhar no WhatsApp</span>
          </button>
          <button onclick="window.app.closeModal()"
                  class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition">
            Fechar
          </button>
        </div>
      </div>
    `);
  }

  function deleteCycleHistory(cycleId) {
    if (!confirm('Deseja realmente excluir este ciclo do histórico? Essa ação não pode ser desfeita.')) return;
    state.cycleHistory = (state.cycleHistory || []).filter(c => c.id !== cycleId);
    saveState();
    renderApp();
    showToast('Ciclo removido do histórico.', 'info');
  }

  function shareCycleWhatsApp(cycleId) {
    const cycle = (state.cycleHistory || []).find(c => c.id === cycleId);
    if (!cycle) return;

    let text = `🛒 *RELATÓRIO FINANCEIRO - ${cycle.name || 'CICLO'}*\n`;
    text += `📅 Fechamento: ${cycle.formattedDateClosed}\n`;
    text += `💰 *Gasto Real:* R$ ${(cycle.totalReal || 0).toFixed(2).replace('.', ',')}\n`;
    text += `📊 Previsto Inicial: R$ ${(cycle.totalPrevisto || 0).toFixed(2).replace('.', ',')}\n`;
    text += `📦 Total de Itens Comprados: ${cycle.totalItemsBought || 0}\n\n`;
    text += `*Evolução por Semana:*\n`;

    (cycle.weekSummaries || []).forEach(ws => {
      text += `• *Semana ${ws.week}* (${ws.dateRange}): R$ ${(ws.totalReal || 0).toFixed(2).replace('.', ',')} (${ws.itemsBought || 0} itens)\n`;
    });

    text += `\n_Gerado por Planejamento Familiar Pro_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }

  function shareGeneralHistoryWhatsApp() {
    const history = state.cycleHistory || [];
    if (history.length === 0) return;

    const grandTotal = history.reduce((acc, c) => acc + (c.totalReal || 0), 0);
    let text = `📊 *HISTÓRICO GERAL DE COMPRAS & EVOLUÇÃO*\n`;
    text += `Total de Ciclos Concluídos: ${history.length}\n`;
    text += `💰 Total Investido: R$ ${grandTotal.toFixed(2).replace('.', ',')}\n\n`;
    text += `*Resumo dos Ciclos:*\n`;

    history.forEach((c) => {
      text += `• *${c.name}*: R$ ${(c.totalReal || 0).toFixed(2).replace('.', ',')} (${c.totalItemsBought || 0} itens)\n`;
    });

    text += `\n_Gerado por Planejamento Familiar Pro_`;
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }

  
  // ==========================================
  // GESTÃO DO NOME DOS PRATOS (POR REFEIÇÃO E DIA)
  // ==========================================

  function setActiveKitchenMeal(meal) {
    state.activeKitchenMeal = meal;
    renderApp();
  }

  function openEditDishNameModal(week, day, meal) {
    const key = `${week}_${day}_${meal}`;
    const currentName = state.dishNames?.[key] || '';
    const dayItems = getActiveMenuItems(week).filter((i) => i.dia_nome === day && i.refeicao === meal);

    // Gera sugestões automáticas baseadas nos ingredientes
    const mainIngredients = dayItems.slice(0, 3).map(i => i.ingrediente).join(', ');
    const autoSuggestion = mainIngredients ? `${meal === 'Almoço' || meal === 'Jantar' ? 'Prato com ' : ''}${mainIngredients}` : '';

    renderModal(`
      <div class="space-y-4 max-w-md mx-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🍽️</span>
            <div>
              <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Cardápio Familiar</span>
              <h3 class="text-lg font-bold text-white mt-0.5">${meal} • ${day}</h3>
            </div>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-white p-1 text-xl">✕</button>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-300">
            Qual é o prato / receita deste ${meal}?
          </label>
          <input type="text" id="dish-name-input"
                 value="${currentName}"
                 placeholder="Ex: Feijão com arroz e bife acebolado"
                 class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500">
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Esse nome aparecerá no cabeçalho da refeição na cozinha ("Na Panela Hoje") e no Cardápio Semanal.
          </p>
        </div>

        ${autoSuggestion ? `
          <div class="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span class="text-slate-400 block text-[10px] mb-1">Sugestão rápida baseada nos ingredientes:</span>
            <button onclick="document.getElementById('dish-name-input').value = '${autoSuggestion}'"
                    class="text-left font-medium text-emerald-300 hover:text-emerald-200 transition text-xs flex items-center gap-1.5">
              <span>💡</span> <span class="underline decoration-dotted">${autoSuggestion}</span>
            </button>
          </div>
        ` : ''}

        <div class="pt-2 border-t border-slate-800 flex items-center gap-2">
          <button onclick="window.app.saveDishName('${week}', '${day}', '${meal}')"
                  class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-900/30">
            <span>💾</span> <span>Salvar Nome do Prato</span>
          </button>
          ${currentName ? `
            <button onclick="window.app.clearDishName('${week}', '${day}', '${meal}')"
                    class="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-semibold transition border border-slate-700">
              Limpar
            </button>
          ` : ''}
          <button onclick="window.app.closeModal()"
                  class="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition">
            Cancelar
          </button>
        </div>
      </div>
    `);

    setTimeout(() => {
      document.getElementById('dish-name-input')?.focus();
    }, 100);
  }

  function saveDishName(week, day, meal) {
    const input = document.getElementById('dish-name-input');
    const val = input ? input.value.trim() : '';

    if (!state.dishNames) state.dishNames = {};
    const key = `${week}_${day}_${meal}`;
    if (val) {
      state.dishNames[key] = val;
    } else {
      delete state.dishNames[key];
    }

    saveState();
    closeModal();
    renderApp();
    showToast(`Prato do ${meal} atualizado com sucesso!`, 'success');
  }

  function clearDishName(week, day, meal) {
    if (!state.dishNames) state.dishNames = {};
    delete state.dishNames[`${week}_${day}_${meal}`];
    saveState();
    closeModal();
    renderApp();
    showToast(`Nome do prato removido.`, 'info');
  }

    window.app = {
    switchTab: (tabId) => {
      state.activeTab = tabId;
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    setActiveDay: (day) => {
      state.activeDay = day;
      renderApp();
    },
    setActiveWeek: (week) => {
      state.activeWeek = week;
      renderApp();
    },

    openWeekSelectorModal,
    openCycleConfigModal,
    previewCycleDates,
    saveCycleConfig,
    getOrderedDaysOfWeek,
    getWeekDateRange,
    setActiveKitchenMeal,
    openEditDishNameModal,
    saveDishName,
    clearDishName,
    openCycleTurnoverModal,
    stepCycleLeftover,
    confirmCycleCompletion,
    renderCycleHistoryMode,
    openCycleDetailModal,
    deleteCycleHistory,
    shareCycleWhatsApp,
    shareGeneralHistoryWhatsApp,
    openCopyWeekMenuModal,
    confirmCopyWeekMenu,
    resetToOfficialMenu,
    openStockExplanationModal,

    openFamilyModal,
    adjustFamilyModal,
    applyFamilyModal,
    updateFamilyMembers,

    openEditMealItemModal,
    handlePortionChange,
    handleTotalFamilyChange,
    handleMeasuresChange,
    stepMeasureModal,
    handleSwapIngredient,
    saveEditedMenuItem,
    deleteMenuItem,
    openAddMealItemModal,
    updateNewMealIngredientPreview,
    confirmAddMealItem,
    duplicateSingleMeal,
    confirmDuplicateMeal,
    openDuplicateMealModal,
    confirmDuplicateFullDay,

    toggleCartItem: (checkKey) => {
      state.cartChecked[checkKey] = !state.cartChecked[checkKey];
      saveState();
      renderApp();
    },
    checkAllCartItems,
    uncheckAllCartItems,
    setShoppingViewFilter,
    uncheckAllCartItems,

    openAdjustPriceModal,
    saveAdjustPrice,
    resetAdjustPrice,
    openAddExtraItemModal,
    saveExtraItem,

    openWhatsAppModal,
    dispatchWhatsApp,
    copyWhatsAppText,

    openTurnoverModal,
    promptReopenTurnover,
    stepLeftoverInput,
    confirmWeekTurnover,
    fillSuggestedTurnover,
    zeroAllTurnover,
    fillSuggestedCycleTurnover,
    zeroAllCycleTurnover,

    openEditStockModal,
    saveStockInitial,

    openAddHygieneModal,
    saveNewHygieneItem,
    openEditHygieneModal,
    saveEditedHygieneItem,
    deleteHygieneItem,

    openAddIngredientModal,
    saveNewIngredient,
    openEditIngredientModal,
    saveEditedIngredient,
    deleteIngredient,

    exportBackupJSON,
    importBackupJSON,
    confirmResetToDefault,

    // Supabase
    saveSupabaseFromForm,
    testSupabaseConnection,
    uploadToSupabase,
    downloadFromSupabase,

    closeModal,
    renderApp
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
