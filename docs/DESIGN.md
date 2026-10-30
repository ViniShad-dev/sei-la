# Economia e decisões de implementação

## Fórmulas

Custos de geradores crescem por `1,15^quantidade`. Compras em lote usam a soma geométrica; Máx faz busca binária e cobra o total uma única vez. Um pequeno limite de tolerância relativa (`1e-12`) absorve arredondamento na comparação de compra, e a subtração nunca produz saldo negativo. Máx compra até 10 mil unidades por ação; há limite de 100 mil por gerador.

Produção combina quantidade, marcos, melhorias individuais, material, refinamento, legado, conquistas, especializações, encantamentos, artefatos e eventos. Sinergias adjacentes e o nó Motor perpétuo tornam produtores antigos úteis novamente. Cada fator pode ser inspecionado pelas descrições; Estatísticas mostra a produção final individual.

Cliques combinam poder base, material/legado, críticos, ritmo, combo, runas e uma parcela da produção automática. A sequência expira após 1s; a janela perfeita vai de 450 a 650ms. Eventos são limitados, expiram e não podem ser coletados duas vezes. Bônus com tipos distintos coexistem, mas cada evento é calculado pelo relógio, não pelo número de frames.

O prestígio base concede `floor(sqrt(max(0, log10(produção da jornada) - 5)))` almas. O último nó da Transcendência adiciona uma alma a cada três níveis, apenas quando há produção suficiente para o primeiro prestígio. Almas conquistadas dão +5% global por alma e pontos de especialização; gastar almas na loja não remove esses bônus. As três elevações adicionais exigem contagens crescentes e não reiniciam a jornada. Elas modificam capacidade de equipamentos, frequência de eventos e recarga ativa.

Especializações não consomem almas: usam uma reserva de pontos calculada a partir das almas já conquistadas e ascensões. Redistribuir é gratuito. Cada um dos 18 nós tem função específica.

## Tempo e persistência

A produção usa tempo decorrido e integra intervalos entre expirações de bônus. A frequência de desenho não dita quanto se produz. Conquistas são verificadas ao final de cada atualização; em grandes saltos de tempo, um bônus de conquista recém-obtido só afeta a atualização seguinte.

Ao fechar/ocultar a aba, o estado é salvo. Ao reabrir/retornar, a produção offline aplica eficiência base de 50% e limite de oito horas, ampliáveis. Bônus temporários não são estendidos artificialmente por horas offline. O relógio nunca recua no estado, evitando receber o mesmo intervalo duas vezes. Mudanças manuais no relógio podem gerar progresso até o limite offline: não existe servidor anti-trapaça.

O formato JSON inclui versão, identificador do jogo e estado validado. O carregamento tenta o save principal e depois o backup. Dados importados precisam respeitar tipos, limites, catálogo e consistência de equipamentos/pontos. Versões futuras precisam adicionar migrações explícitas; versões desconhecidas são recusadas em vez de interpretadas silenciosamente.

A aritmética usa mantissa normalizada e expoente separado; não converte custos altos para números nativos. Precisão relativa é de ponto flutuante (aproximadamente 15 dígitos); parcelas menores que essa resolução são descartadas. Contadores e expoentes possuem limites de validação para rejeitar saves malformados.

## Simulação e limites

`scripts/simulate.js` executa a lógica real, sem recursos injetados, em passos de 1s. A estratégia manual clica uma vez por segundo; a automática faz 20 cliques iniciais e para; a híbrida mantém um clique por segundo. As três coletam eventos. Compras são escolhidas a cada 5s por uma heurística de retorno marginal, que admite alternativas com retorno próximo. O simulador limita a três renascimentos para também observar uma jornada prolongada.

A utilidade da heurística é produção por segundo mais um clique por segundo. Ela não estima perfeitamente críticos, combos, descobertas ou benefícios futuros de todos os nós. Não é uma busca exaustiva da melhor estratégia e não substitui testes humanos.

A primeira rodada de uma hora identificou poucas compras na estratégia manual e uma interrupção da estratégia automática após renascer sem recursos. As correções foram uma curva própria para melhorias de clique (custo inicial 50, crescimento ×5, efeito ×2,2) e 15 metal iniciais nos renascimentos. O relatório versionado registra a rodada posterior.

A versão possui conteúdo funcional e objetivos finitos. Ainda não há evidência de centenas de horas interessantes, balanceamento completo do fim do jogo, compatibilidade testada em Safari/Firefox ou migração de saves de versões futuras. Não há combate, exploração, monetização, multijogador ou sincronização de contas.

## Leitura do relatório

O primeiro prestígio na simulação híbrida ocorreu em cerca de 14 minutos, e na automática em cerca de 20 minutos. A estratégia estritamente manual avança mais devagar; o jogo incentiva combinar cliques e automação. Nas seis horas simuladas, estratégias automáticas chegam perto do último material, mas ainda não compram todas as melhorias. Isso demonstra que **a duração de dezenas/centenas de horas ainda não foi atingida como evidência de teste**. Os intervalos de compra da estratégia manual continuam sendo um ponto de atenção para futuras rodadas de balanceamento.

A revisão também corrigiu um problema de relevância tardia: a parcela da produção automática adicionada ao clique agora recebe os bônus de Fúria, runas e artefatos de clique. Um teste de regressão verifica esses multiplicadores com um gerador do último nível.

## Distribuição por download

`npm run build` usa esbuild para gerar um `index.html` independente, com JavaScript clássico encapsulado, CSS e fontes incorporados. Não há imports de módulos, caminhos absolutos de recursos ou requisições externas durante a abertura. A versão para download não precisa de Node nem servidor; o código modular continua em `src/` para desenvolvimento.

`npm run test:download` copia apenas o HTML para uma pasta temporária e testa cliques, compra, fontes, salvamento/recarregamento e largura mobile. O modo padrão usa `file://`. O Chromium gerenciado deste ambiente recusou esse protocolo com `ERR_BLOCKED_BY_ADMINISTRATOR`; a validação local usou `DOWNLOAD_TEST_HTTP=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:download`, que serve exclusivamente esse HTML isolado por HTTP. Esse resultado não é apresentado como verificação direta de `file://`.
