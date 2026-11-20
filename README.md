# The Xandão-Files
Arquivo público (estilo X, dark mode) sobre o Inquérito 4.781 do STF, em React 18 (UMD) + htm, sem build.

## Como rodar
Copie `.env.example` para `.env` e rode `php -S 127.0.0.1:8000 -t .`; abra `http://localhost:8000`. É necessário PHP com a extensão cURL e internet para carregar React por CDN e acessar o modelo. Não abra o arquivo diretamente com `file://` nem use um servidor estático como `python -m http.server`: a análise precisa do endpoint PHP.

## Análise de publicações com IA
Use o botão de análise no cabeçalho de uma publicação (ou a ação na thread) para abrir uma análise concisa gerada pelo modelo `gpt-oss:20b`, sem sair do feed. O modal identifica a publicação original e exibe a resposta contextualizada. O navegador envia somente o ID do processo para `api/explain_process.php`; o PHP monta o contexto a partir de `data.js` e chama a API compatível com OpenAI em `/v1/chat/completions`. Assim, o navegador não precisa acessar a Nosana diretamente nem depende do CORS dela.

Configure `LLM_BASE_URL`, `LLM_MODEL` e, se necessário, `LLM_API_KEY` no `.env` do servidor. O modelo e a URL não são enviados ao cliente; não versione o `.env` nem exponha uma chave no JavaScript. O endpoint usa sessão, token CSRF, limitação de chamadas por sessão e cache local. Em produção, publique o site e o endpoint em uma hospedagem com PHP e cURL, usando HTTPS. As análises são geradas por IA, podem conter erros e não substituem a consulta às fontes originais.

## Estrutura
- `data.js`: perfis, processos e inquéritos conexos. Cada processo tem `passos` (andamentos) e pode ter `notes` (notas contextuais com fonte); `inquiries` reúne resumos, vínculos e fontes. Perfis `related` aparecem em “Pessoas mencionadas”; cadastros sem URL/documento de origem são identificados como não verificados.
- `app.js`: componentes React; o feed incorpora vínculos documentados dos inquéritos, com fontes e hashtags, sem duplicar perfis que já têm publicação. Também integra a análise de publicações com IA. `api/explain_process.php`: endpoint server-side de sessão/CSRF, cache e chamada ao modelo. `style.css`: visual. `fotos/` e `logo.png`: imagens.
- Rotas por hash: `#/`, `#/inqueritos`, `#/caso/<id>`, `#/inquerito` (linha do tempo do Inq. 4.781), `#/perfis`, `#/perfil/<id>`, `#/p/<processo>`.

## Regras de conteúdo
- Nenhum texto é post original: são descrições factuais com fonte.
- Perfis de autoridades são ilustrativos, não são contas reais.
- Contagens nos perfis consideram só os registros deste arquivo.
- Use só fotos com licença adequada e registre o crédito.
