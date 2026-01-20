# Pipeline Jenkins

Arquivos de automacao ficam em `infra/jenkins/Jenkinsfile`. O pipeline usa pnpm/turborepo para os apps Next.js e Maven para o `apps/api-service`.

## Requisitos do Jenkins
- Plugin Pipeline ativo e agente com git e acesso à internet.
- JDK 17+ no `PATH`.
- Node 20+: se não existir no agente, o pipeline baixa Node `${NODE_VERSION}` para `${WORKSPACE}/.tooling` (usa `curl` ou `wget` + `tar`).
- `npm` é fornecido pelo Node baixado; `pnpm` é instalado via corepack ou `npm -g` fallback.
- Ferramentas de linha de comando necessárias no agente: `curl` ou `wget`, `tar`, `bash`, `chmod`.
- Credenciais recomendadas:
  - File credential com um `.env.ci` para os frontends (ID usado em `ENV_FILE_CREDENTIAL_ID`).
  - Secrets de deploy/registries caso o estágio `Deploy` seja habilitado.
- Se quiser o registro de tempo e cores no log, instale os plugins **Timestamper** e **AnsiColor** e adicione `timestamps()` e `ansiColor('xterm')` em `options`.

> Nota: o pipeline não fixa `NODE_ENV=production`; o `pnpm install` usa `--prod=false` para garantir que as devDependencies (ex.: turbo) sejam instaladas para lint/build.

## Como configurar o job
- Crie um Multibranch Pipeline (ou um Pipeline apontando para o repo) e defina o caminho do script como `infra/jenkins/Jenkinsfile`.
- Garanta que o agente escolhido tenha os tool names `node-20` e `jdk-17` configurados em `Manage Jenkins > Tools`.
- Habilite `Build with Parameters` para usar:
  - `DEPLOY` (bool): executa o estagio de deploy apenas em `main`.
  - `ENV_FILE_CREDENTIAL_ID` (string opcional): ID do arquivo `.env` aplicado antes de `pnpm build`.
- Se usar agentes com label especifico, ajuste `agent` ou restrinja o job para esse label.

## Variaveis de ambiente importantes
Inclua no `.env.ci` usado pelos frontends (ou configure direto no job):
- `NEXT_PUBLIC_URL_API`
- `LOGISTA_SESSION_SECRET`
- `LOGISTA_API_BASE_URL`
- `ADMIN_SESSION_SECRET`
- `ADMIN_API_BASE_URL`
- `DEFAULT_API_BASE_URL`
- `ARCJET_KEY`
- `APIBRASIL_DEVICE_TOKEN_CPF`
- `APIBRASIL_TOKEN`

Para o `apps/api-service` inclua as variaveis Spring/DB necessarias (por exemplo `SPRING_PROFILES_ACTIVE`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`).

## O que o pipeline faz
- Checkout do codigo.
- Prepara pnpm (corepack) e fixa `pnpm@9.0.0`; instala dependencias com store local em `${WORKSPACE}/.pnpm-store`.
- Quality gates em paralelo: `pnpm lint` e `pnpm check-types`.
- `pnpm build` para todos os apps Next.js.
- Build do Spring Boot: `./mvnw -B clean verify` em `apps/api-service`.
- Publica artefatos: JAR do backend, pastas `.next` das apps e relatorios JUnit do Maven.
- Estagio `Deploy` (opcional) para encaixar helm/kubectl/ssh/terraform conforme o ambiente.

## Dicas e ajustes
- Para pipelines mais rapidos, mantenha o workspace entre builds ou habilite o plugin de cache para `~/.cache` e `${WORKSPACE}/.pnpm-store`.
- Se usar Turbo Remote Cache, configure `TURBO_TOKEN` e `TURBO_TEAM` como credenciais de ambiente.
- Caso precise de npm registries privados, configure um secret text e escreva `.npmrc` no passo de setup (antes do `pnpm install`).
