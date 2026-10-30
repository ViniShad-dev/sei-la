# Sword Clicker: Infinite Forge

Um clicker incremental de forja, em português, com arte original em SVG, fontes locais e nenhum serviço externo necessário durante o jogo.

## Baixar e jogar (sem instalar nada)

1. No GitHub, clique em **Code → Download ZIP**.
2. No Windows, clique com o botão direito no ZIP e escolha **Extrair tudo**.
3. Abra a pasta extraída e dê dois cliques em **index.html**.

O HTML inclui o jogo, estilos e fontes. Funciona diretamente no navegador, sem Node, servidor ou conexão com a internet. Também suporta abrir apenas o HTML pelo ZIP, mas extrair tudo mantém o endereço do save mais estável. Os saves locais ficam associados ao navegador e ao caminho do arquivo: antes de mover a pasta ou baixar uma atualização, exporte seu progresso nas configurações.

## Desenvolver localmente

Requer Node.js 20.11+ (validado com Node 24).

```sh
npm ci
npm run build
npm start
```

Abra `http://localhost:5173` no navegador. `PORT=8080 npm start` altera a porta. Após editar `src/`, execute `npm run build` e atualize a página. O build gera o `index.html` independente que fica versionado para download. O mesmo arquivo pode ser servido em hospedagem estática, inclusive em subpastas.

## Como jogar

- Clique na lâmina ou pressione **Espaço** para produzir metal. Intervalos entre 450 e 650ms concedem golpes perfeitos.
- Contrate aprendizes e expanda a automação. Os marcos 10, 25, 50, 100, 200 e 400 dobram a produção de cada gerador.
- Alterne entre compras de 1, 10, 100 e o máximo acessível. Melhore a eficiência na aba Melhorias.
- Evolua materiais, refine a lâmina e combine quatro tipos de runas. Runas desbloqueiam no bronze.
- Pressione **F** para ativar Fúria da Forja. Colete eventos dourados; a cada três, descubra um artefato.
- Renascimento desbloqueia após 1 milhão de metal produzido na jornada. Leia a confirmação: parte da forja reinicia, mas o legado permanece. Você recebe 15 metal para recomeçar a automação.
- Almas conquistadas dão pontos de especialização, que podem ser redistribuídos gratuitamente. Desafios ficam disponíveis após o primeiro renascimento.
- **S** salva. Configurações permitem exportar/importar saves, restaurar backup, alternar som, notação científica e efeitos.

## Conteúdo implementado

- 28 geradores com custos exponenciais, seis marcos de quantidade, melhorias específicas e sinergias que beneficiam geradores antigos.
- 332 melhorias funcionais: 224 melhorias individuais e 108 de clique, críticos, sinergia, runas, metalurgia e eventos/offline.
- 24 materiais visuais, refinamento de até 100 níveis e quatro encantamentos de até 100 níveis.
- Críticos, combos, golpes perfeitos, poder ativo com recarga, partículas e som sintetizado opcional.
- Oito artefatos de cinco raridades, dois a quatro espaços de equipamento, filtros e comparação de bônus.
- Cinco eventos com três raridades; bônus diferentes podem coexistir.
- Renascimento e três progressões permanentes adicionais: espaços de artefatos, frequência de eventos e recarga da habilidade.
- Loja permanente com quatro melhorias, seis caminhos de especialização e 18 nós com efeitos próprios e pré-requisitos.
- Quatro desafios opcionais com restrições efetivas e recompensas permanentes.
- 85 conquistas, incluindo uma descoberta oculta no brasão. Cada conquista concede +1% global.
- Interface responsiva, navegação por teclado, confirmação de ações destrutivas e redução de animações.
- Salvamento versionado, validação estrutural, cópia anterior de backup, exportação/importação JSON e produção offline limitada.
- Números em mantissa/expoente: custos e produção continuam funcionando acima de `1e308`.

## Validação

```sh
npm test                         # testes da economia, conteúdo e persistência
npm run simulate -- 21600         # seis horas simuladas por estratégia
npm ci                           # ferramentas de desenvolvimento
npx playwright install chromium  # caso não haja um Chromium instalado
npm run test:browser              # inicia e encerra seu próprio servidor na porta 5181
npm run test:download             # testa o HTML isolado, aberto diretamente por file://
```

Para usar Chromium do sistema:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

O teste de navegador usa um perfil descartável e verifica cliques, compras, melhorias, evolução, runas, artefatos, habilidades, desafios, prestígio, exportação/importação e dez telas em cinco larguras. Capturas ficam em `test-results/`, ignorado pelo Git.

`docs/economy-report.json` guarda uma execução real do simulador. `docs/DESIGN.md` explica fórmulas, metodologia e limites. Uma simulação não comprova a promessa de centenas de horas: o balanceamento de longo prazo ainda precisa de partidas humanas e estratégias mais amplas.

## Organização

- `src/number.js`: aritmética científica positiva e formatação.
- `src/content.js`: catálogo de geradores, materiais, melhorias, artefatos e objetivos.
- `src/engine.js`: regras econômicas, progressão e serialização, independentes do DOM.
- `src/app.js`: interface, efeitos, acessibilidade e persistência no navegador.
- `src/art.js` / `src/style.css`: desenho original da espada e identidade visual.
- `scripts/`: empacotamento em HTML independente, servidor local, simulação e testes de navegador.
- `tests/`: testes automatizados da lógica.

## Dados e licenças

O progresso é armazenado apenas no navegador. Exporte o save antes de limpar dados ou mudar de dispositivo. Nenhum sistema de contas, nuvem ou sincronização está implementado. O save não é criptografado nem um mecanismo contra trapaças.

Ícones e espadas foram desenhados para este projeto. Cormorant Garamond e DM Sans são distribuídas sob SIL Open Font License; cópias das licenças acompanham os arquivos em `src/fonts/`.
