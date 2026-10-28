# 🍳 Planejamento Familiar Pro - Web App Full-Stack

Aplicativo web completo, moderno, responsivo (mobile-first) e 100% intuitivo, desenvolvido com base na planilha **"Planejamento Familiar Pro Final - Novembro 2026"**.

---

## ✨ Principais Funcionalidades

### 👨‍👩‍👧‍👦 1. Seletor Global de Membros da Família
- Localizado no cabeçalho superior e acessível de qualquer tela.
- Permite alterar o número de pessoas (inteiros ou decimais, ex: `1`, `2`, `3`, `3.5`, `4`, `5`).
- **Recalcula instantaneamente**:
  - Quantidades de cada ingrediente para a família toda;
  - Medidas caseiras para a panela (copos, xícaras, colheres);
  - Custos por refeição e do dia;
  - Consumo semanal e projeções de compras para as 5 semanas.

### 🍳 2. Modo "Na Panela Hoje" (Kitchen Mode)
- Abre diretamente no dia atual da semana (Segunda a Domingo).
- Exibe os 4 cartões de refeição (`Café da Manhã`, `Almoço`, `Lanche da Tarde`, `Jantar`) com tipografia de alto contraste para quem está cozinhando.
- **Medida Caseira Total Destacada**: ex: `🥄 2 xícara(s) de chá`, `🍗 4 pedaço(s) c/ osso`, `🥛 3 copos cheios`.
- Permite editar ou trocar o ingrediente na hora se o cardápio do dia mudar.

### 📅 3. Cardápio Semanal Dinâmico (Edição Bidirecional)
- Navegação rápida por abas horizontais no topo (`Seg`, `Ter`, `Qua`, `Qui`, `Sex`, `Sáb`, `Dom`).
- **Cards Financeiros no Topo**:
  - Custo total do dia selecionado e de cada refeição;
  - Média diária por refeição na semana;
  - **Total Geral da Semana (Custo Real Consumido)** e **Valor Projetado para 30 Dias** (`(Total_Semana / 7) * 30`).
- **Edição Bidirecional**:
  - Ao editar a `Porção por Pessoa`, o sistema calcula automaticamente a `Qtd Total (Família) = Porção * Membros`.
  - Ao editar a `Qtd Total (Família)`, o sistema calcula automaticamente a `Porção por Pessoa = Qtd Total / Membros`.
  - Ajuste direto pelo número de medidas caseiras (`[-]` e `[+]`).
- **Duplicação de Refeição**: copie o almoço ou jantar de um dia para outros dias da semana com 1 clique.

### 🛒 4. Compras da Semana (Supermercado com 1 Mão)
- Filtro por semana (`Semana 1` a `Semana 5`).
- Exibe **apenas os itens que precisam ser comprados** (`qtd_comprar > 0`), agrupados por setor:
  - 🥩 Açougue e Ovos
  - 🍎 Hortifrúti e Polpas
  - 🌾 Mercearia e Grãos
  - 🥛 Laticínios e Padaria
  - 🧼 Higiene e Limpeza
  - 📦 Itens Extras Avulsos
- **Barra Fixa Inferior**:
  - Mostra o total colocado no carrinho vs o total previsto da semana.
  - Barra de progresso visual de compras.
- **Ajuste Rápido de Preço**: toque no preço ou quantidade caso o mercado esteja cobrando valor diferente.
- **Virada de Semana com Conferência de Sobras**:
  - Lista itens de pacote que têm sobra teórica calculada.
  - Botão **`[Zerou em Casa!]`** para zerar a sobra com 1 toque e já agendar para compra na nova semana.
- **Compartilhamento no WhatsApp**:
  - Botão verde destacado com ícone do WhatsApp.
  - Opções: *"Enviar Lista Completa"*, *"Enviar Apenas Faltantes"* ou *"Copiar Texto"*.
  - Mensagem perfeitamente formatada com emojis e totais.

### 📊 5. Motor de Compras de 5 Semanas (Giro de Estoque)
- Tabela analítica completa com os 53 ingredientes.
- Cálculo em cascata com sobra de despensa:
  - Se `tipo_compra == "Peso"`: compra a falta exata, custo proporcional ao pacote.
  - Se `tipo_compra == "Pacote"` ou `"Unidade"`: arredonda para cima (`CEIL`), gerando sobras teóricas que alimentam a próxima semana.
- Campo de Estoque Inicial editável para cada ingrediente.

### 🧼 6. Higiene, Limpeza e Fraldas
- 100% editável: cadastre, edite ou remova produtos de limpeza, higiene e itens de bebê.
- Integração automática com o orçamento e com a lista de compras da semana selecionada.

### 🌾 7. Catálogo de Ingredientes (53 Ingredientes)
- Busca instantânea e filtros por categoria (`Mercearia`, `Carnes/Ovos`, `Hortifrúti`, `Laticínios/Padaria`, `Outros`).
- Todos os campos são editáveis: nome, embalagem, unidade, preço, tipo de compra, porção base e nome da medida caseira.

### 💾 8. Persistência & Backup
- **Salvamento Automático**: toda alteração é gravada instantaneamente no LocalStorage.
- **Exportar / Importar Backup (JSON)**.
- **Restaurar Padrão da Planilha**: restaura com 1 clique a base original de Novembro 2026.
- **Sincronização em Nuvem (Supabase)**.

---

## 🚀 Como Executar

### Opção 1: Abrir diretamente no Navegador
Abra o arquivo `index.html` em qualquer navegador (Google Chrome, Edge, Safari, Firefox). Funciona 100% offline!

### Opção 2: Iniciar Servidor Local Node.js
```bash
# Na pasta planejamento-familiar-pro:
node server.js
```
Acesse no navegador do computador ou do celular na mesma rede:
`http://localhost:3000`

---

## 📱 Instalação no Celular (PWA)
1. Abra o link do app no Safari (iOS) ou Chrome (Android).
2. Toque no botão de compartilhamento / opções.
3. Selecione **"Adicionar à Tela de Início"** (Add to Home Screen).
4. O app será instalado e funcionará como um aplicativo nativo em tela cheia com ícone próprio!
