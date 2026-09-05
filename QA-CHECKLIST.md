# Checklist de QA — Moto Trilhas Beta

## Entrada e sala

- [ ] Digitar um apelido e entrar sem criar conta.
- [ ] Entrar com 2, 3 e 4 navegadores na mesma sala.
- [ ] Confirmar que o quinto jogador é colocado em outra sala.
- [ ] Confirmar que apelidos com caracteres indevidos são normalizados.
- [ ] Confirmar que apelidos bloqueados são substituídos por um nome genérico.

## Controles

- [ ] Esquerda e direita mudam entre as três faixas.
- [ ] Pular evita obstáculos baixos.
- [ ] Abaixar evita obstáculos altos.
- [ ] Rampas lançam a moto automaticamente.
- [ ] Controles funcionam por toque e teclado.

## Progressão

- [ ] Cada fase troca o cenário.
- [ ] A recompensa aparece ao terminar a fase.
- [ ] Fases 2, 4, 6 e 8 liberam motos novas.
- [ ] A moto recém-liberada é equipada automaticamente.
- [ ] A garagem permite voltar para motos anteriores.
- [ ] O progresso permanece após recarregar a página no mesmo navegador.

## Multiplayer

- [ ] Ranking acompanha o progresso dos quatro jogadores.
- [ ] Ordem de chegada é registrada.
- [ ] Desconectar e reconectar em até 15 segundos preserva o piloto.
- [ ] Jogador desconectado por mais tempo é removido da sala.
- [ ] Uma fase não fica presa indefinidamente se alguém parar de jogar.

## Dispositivos

- [ ] Chrome/Edge desktop.
- [ ] Safari iPhone/iPad.
- [ ] Chrome Android.
- [ ] Tela de 320 px de largura sem rolagem horizontal indevida.
- [ ] Botões possuem área de toque confortável.

## Produção

- [ ] HTTPS habilitado.
- [ ] WebSocket funcionando através do provedor/CDN.
- [ ] Health check em `/health` respondendo `ok: true`.
- [ ] Política de privacidade e termos revisados antes de publicação infantil.
- [ ] Analytics e publicidade desabilitados até revisão específica de privacidade.
