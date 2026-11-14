# The Xandão-Files
Arquivo público (estilo X, dark mode) sobre o Inquérito 4.781 do STF, em React 18 (UMD) + htm, sem build.

## Como rodar
Abra `index.html` no navegador (precisa de internet para carregar React por CDN) ou rode `python3 -m http.server 8000`.

## Estrutura
- `data.js`: perfis, processos e inquéritos conexos. Cada processo tem `passos` (andamentos); `inquiries` reúne resumos, vínculos e fontes. Perfis `related` aparecem em “Pessoas mencionadas”; cadastros sem URL/documento de origem são identificados como não verificados.
- `app.js`: componentes React; o feed incorpora vínculos documentados dos inquéritos, com fontes e hashtags, sem duplicar perfis que já têm publicação. `style.css`: visual. `fotos/` e `logo.png`: imagens.
- Rotas por hash: `#/`, `#/inqueritos`, `#/caso/<id>`, `#/inquerito` (linha do tempo do Inq. 4.781), `#/perfis`, `#/perfil/<id>`, `#/p/<processo>`.

## Regras de conteúdo
- Nenhum texto é post original: são descrições factuais com fonte.
- Perfis de autoridades são ilustrativos, não são contas reais.
- Contagens nos perfis consideram só os registros deste arquivo.
- Use só fotos com licença adequada e registre o crédito.
