# Moto Trilhas — Beta web multiplayer

Versão 0.2 de um jogo infantil de moto para navegador, com corrida multiplayer em salas automáticas de até 4 jogadores.

## Experiência do jogador

1. A pessoa abre o endereço do jogo.
2. Digita apenas um nome/apelido.
3. O servidor coloca o jogador em uma sala com até 4 pilotos.
4. A moto acelera automaticamente.
5. Os únicos comandos são esquerda, direita, pular e abaixar.
6. Ao concluir cada fase, o jogador recebe uma recompensa.
7. Algumas recompensas liberam motos especiais, que aparecem na garagem.
8. A pista muda automaticamente a cada fase.

Não há chat, voz, câmera ou localização.

## Mundos incluídos

1. Bosque Verde
2. Deserto Dourado
3. Montanha Gelada
4. Vulcão Aventura
5. Cidade Neon
6. Praia Tropical
7. Caverna Cristal
8. Vale dos Dinossauros

Depois da oitava fase, os mundos continuam em ciclo e as recompensas podem ser repetidas como progressão de sessão.

## Motos

- Trilha 50 — inicial
- Turbo 80 — liberada após a fase 2
- Neve 100 — liberada após a fase 4
- Neon X — liberada após a fase 6
- Dino 200 — liberada após a fase 8

As motos possuem identidade visual diferente, mas não aumentam a velocidade do jogador no multiplayer. Isso mantém a corrida equilibrada para jogadores novos e recorrentes.

## Melhorias desta versão

- garagem com seleção de motos desbloqueadas;
- equipamentos e recompensas visuais;
- oito pistas com cenários e obstáculos próprios;
- placar com posição e chegada;
- reconexão automática com janela de tolerância de 15 segundos;
- filtro básico de apelidos inadequados no servidor;
- limitação de avanço enviada pelo cliente para reduzir trapaças simples;
- tempo máximo de fase para evitar salas presas;
- efeitos sonoros sintetizados no próprio navegador e botão para desligar;
- layout responsivo para computador, tablet e celular;
- cabeçalhos HTTP que desabilitam câmera, microfone e geolocalização;
- progresso e garagem salvos somente no navegador.

## Rodar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm start
```

Abra:

```text
http://localhost:3000
```

Para testar o multiplayer, abra o endereço em até quatro abas ou dispositivos conectados ao mesmo servidor.

## Validação local do código

```bash
npm run check
```

Esse comando valida a sintaxe do servidor e do jogo e confere se os elementos de interface referenciados pelo JavaScript existem no HTML.

## Publicar na internet

O projeto precisa de uma hospedagem que mantenha um processo Node.js ativo e aceite WebSocket. Configure o serviço para:

- instalar com `npm install`;
- iniciar com `npm start`;
- expor a porta recebida na variável `PORT`;
- manter suporte a WebSocket/Socket.IO;
- usar HTTPS em produção.

O endpoint `/health` pode ser usado como health check.

### Docker

Também há um `Dockerfile` pronto. Exemplo:

```bash
docker build -t moto-trilhas .
docker run --rm -p 3000:3000 -e PORT=3000 moto-trilhas
```

## Estrutura

```text
moto-trilhas-beta/
├── public/
│   ├── index.html
│   ├── style.css
│   └── game.js
├── scripts/
│   └── smoke-check.mjs
├── server.js
├── package.json
├── Dockerfile
└── README.md
```

## Limites desta beta

- A arte é desenhada em Canvas e CSS; ainda não é arte final de estúdio.
- O servidor valida velocidade e chegada, mas ainda não simula todas as colisões de forma autoritativa.
- O progresso fica somente no aparelho/navegador; não há conta familiar ou sincronização entre dispositivos.
- O filtro de apelidos é uma camada básica e deve ser ampliado antes de lançamento público em escala.
- Antes do lançamento comercial para público infantil, deve ser feita uma revisão específica de privacidade, termos, analytics, publicidade e tratamento de dados aplicável ao mercado onde o jogo será disponibilizado.

## Próxima etapa recomendada

A etapa seguinte é a versão 0.3, com arte final/sprites, tela de seleção de aventura, objetivos por fase, animações de vitória, itens colecionáveis, trilha sonora e preparação da infraestrutura de produção.
