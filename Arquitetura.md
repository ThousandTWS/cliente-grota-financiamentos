Este repositório é um **starter Turborepo** adaptado para o projeto **Grota Financiamentos de Veículos**. Contém o website público, a Área do Logista (painel para lojistas) e um CRM interno para gestão de propostas, clientes e contratos — organizados num monorepo para compartilhar UI, configs e utilitários.

> Estrutura pensada para desenvolvimento rápido, deploy independente de cada app e compartilhamento de componentes e tipos.

- `public-site` — site institucional e páginas públicas (Next.js)
- `dealer-portal` — painel do lojista com BFF para autenticação/rotas (`/app/api/auth/*`)
- `admin-console` — CRM interno + BFF seguindo o mesmo padrão de sessão e permissões
- `api-service` — API Spring Boot que concentra propostas, notificações e cadastros
- `e2e-tests` — suíte Playwright para cenários end-to-end

> Todos os apps e pacotes usam TypeScript.

---

## Arquitetura Geral

```
┌──────────────┐      ┌───────────────────────┐      ┌───────────────┐
│ public-site  │ HTTP │ dealer-portal (BFF)   │ HTTP │ api-service   │
│              │ ───▶ │ /api/auth/*           │ ───▶ │ /api/v1/grota │
└──────────────┘      └─────────┬─────────────┘      └───────────────┘
                                 │
                                 │ WS + REST
                        ┌────────▼─────────┐
                        │ admin-console    │
                        │ realtime server  │
                        └──────────────────┘
```

- **public-site**: landing page, captação e onboarding. O login/cadastro chama o BFF do painel do lojista (`NEXT_PUBLIC_LOGISTA_PANEL_URL`) para que o cookie de sessão httpOnly seja emitido no mesmo domínio do painel.
- **dealer-portal**: BFF + UI. A camada `/app/api/auth/*` proxia as rotas da API Spring, criptografa/renova sessões (`packages/auth`) e expõe apenas cookies seguros (`grota.logista.session`). O middleware (`apps/dealer-portal/middleware.ts`) valida o escopo/role antes de renderizar qualquer rota protegida.
- **admin-console**: CRM interno com o mesmo padrão de BFF (rotas `/api/auth/*` + middleware). Após autenticar, consome os serviços de propostas/logistas, WebSocket compartilhado (`packages/realtime-*`) e dashboards.
- **api-service**: serviços REST em Spring Boot que concentram os domínios de proposta, notificações e autenticação.
- **packages/**:
  - `auth`: utilitário de criptografia AES-GCM usado pelos dois painéis para serializar a sessão.
  - `ui`, `eslint-config`, `typescript-config`: componentes e configuração compartilhados.
  - `realtime-client`/`server`: camada de WebSocket que conecta admin ↔ logista para recados e sync de propostas.
- **infrastructure/**: playbooks e IaC para subir os serviços (Dockerfiles, pipelines e scripts).
- **generators/**: templates Plop/Turbo para gerar novas features com a mesma estrutura de pastas.
- **e2e-tests/**: suíte Playwright para garantir cobertura de ponta a ponta das jornadas críticas.

### Fluxo de autenticação recomendado

1. Usuário cria conta no **public-site** → `POST ${NEXT_PUBLIC_LOGISTA_PANEL_URL}/api/auth/register`.
2. Painel **dealer-portal** proxia o request para `POST /auth/register` (Spring), aguarda verificação e grava sessão quando o login acontece.
3. Ao ser redirecionado para `/visao-geral`, o middleware do painel valida o cookie e carrega `GET /auth/me`.
4. O painel **admin-console** repete o mesmo modelo (BFF + sessão cifrada) e garante isolamento por papel (`ADMIN_SESSION_SECRET`).

> Nunca faça o login diretamente contra o endpoint da API; use sempre o BFF do painel correspondente para que o cookie esteja no domínio certo.

```
/ (root)
├─ apps/
│  ├─ public-site/
│  ├─ dealer-portal/
│  ├─ admin-console/
│  ├─ api-service/
│  └─ e2e-tests/
├─ packages/
│  ├─ ui/
│  ├─ eslint-config/
│  ├─ typescript-config/
│  ├─ realtime-client/
│  └─ realtime-server/
└─ turbo.json
```

Foi adicionado um canal WebSocket compartilhado para permitir que o painel administrativo envie recados imediatos aos lojistas diretamente do dashboard:

1. **Suba o servidor** dedicado no workspace:

   ```bash
   Websocks
   pnpm realtime
   pnpm --filter @grota/realtime-server dev

   Apps
   pnpm dev --filter grota-website
   pnpm dev --filter grota-painel-logista
   pnpm dev --filter grota-painel-admin

   ```

   > O servidor usa `ws://localhost:4545` por padrão (configurável via `WS_PORT`).

2. **Defina o endpoint** público nos apps que consumirão o canal, por exemplo em `.env.local`:

   ```bash
   NEXT_PUBLIC_REALTIME_WS_URL=ws://localhost:4545
   ```

## Comunicação em tempo real (Admin ↔ Logista)

Foi adicionado um canal WebSocket compartilhado para permitir que o painel administrativo envie recados imediatos aos lojistas diretamente do dashboard:

1. **Suba o servidor** dedicado no workspace:

   ```bash
   Websocks
   pnpm realtime
   pnpm --filter @grota/realtime-server dev

   Apps
   pnpm dev --filter grota-website
   pnpm dev --filter grota-painel-logista
   pnpm dev --filter grota-painel-admin

   ```

   > O servidor usa `ws://localhost:4545` por padrão (configurável via `WS_PORT`).

2. **Defina o endpoint** público nos apps que consumirão o canal, por exemplo em `.env.local`:

   ```bash
   NEXT_PUBLIC_REALTIME_WS_URL=ws://localhost:4545
   ```

3. Abra as páginas `apps/admin-console/(admin)/visao-geral` e `apps/dealer-portal/(logista)/visao-geral` para visualizar o card _Canal Admin ↔ Logista_. As mensagens viajam instantaneamente enquanto ambos estiverem conectados.

Os pacotes `packages/realtime-client` (hook + tipos compartilhados) e `packages/realtime-server` (servidor ws com histórico e presença) concentram a implementação.

## API – Propostas e Notificações

O backend Spring agora expõe os contratos necessários para integrar o fluxo completo entre logista e admin:

- `POST /api/v1/grota-financiamentos/proposals` cria uma nova ficha. Payload mínimo:

````json
{
  "dealerId": 1,
  "sellerId": 2,
  "customerName": "Fulano de Tal",
  "customerCpf": "12345678900",
  "customerBirthDate": "1990-05-10",
  "customerEmail": "cliente@email.com",
  "customerPhone": "11999999999",
  "cnhCategory": "AB",
3. Abra as páginas `apps/admin-console/(admin)/visao-geral` e `apps/dealer-portal/(logista)/visao-geral` para visualizar o card *Canal Admin ↔ Logista*. As mensagens viajam instantaneamente enquanto ambos estiverem conectados.

Os pacotes `packages/realtime-client` (hook + tipos compartilhados) e `packages/realtime-server` (servidor ws com histórico e presença) concentram a implementação.

## API – Propostas e Notificações

O backend Spring agora expõe os contratos necessários para integrar o fluxo completo entre logista e admin:

- `POST /api/v1/grota-financiamentos/proposals` cria uma nova ficha. Payload mínimo:

```json


- `GET /api/v1/grota-financiamentos/proposals?dealerId=&status=` lista as propostas com filtros opcionais.
- `PATCH /api/v1/grota-financiamentos/proposals/{id}/status` atualiza o status (SUBMITTED, PENDING, APPROVED, REJECTED) e as notas.

Para notificações:

- `POST /api/v1/grota-financiamentos/notifications` recebe `{ "title", "description", "actor", "targetType", "targetId", "href" }`.
- `GET /api/v1/grota-financiamentos/notifications?targetType=ADMIN&targetId=` lista notificações por tipo/alvo.
- `PATCH /api/v1/grota-financiamentos/notifications/{id}/read` marca como lida.

Esses contratos permitem alimentar o WebSocket de notificações e sincronizar a esteira entre admin/logista.

### Páginas sincronizadas automaticamente

- **Esteira de Propostas** (apps `admin-console` e `dealer-portal`): novas fichas criadas em qualquer lado já aparecem no outro painel sem necessidade de atualizar a página. Ao salvar um rascunho é emitido um snapshot com os dados básicos via evento `PROPOSAL_CREATED` e todos os clientes atualizam sua fila imediatamente.
- **Gestão de Logistas** (apps `admin-console` → `dealer-portal` e card “Lojistas cadastrados” da visão geral): criar, editar ou excluir um lojista dispara eventos `DEALER_UPSERTED/DEALER_DELETED`, fazendo com que a tabela principal e os cards do dashboard reflitam a alteração em tempo real.
- **Canal Admin ↔ Logista** (dashboard geral): continua disponível para trocas rápidas; o mesmo socket é compartilhado com os eventos acima, então basta manter o servidor WebSocket ativo para usar toda a sincronização.
- **Upload de Documentos** (apps `dealer-portal`): o formulário de envio na rota `/documentos` publica eventos `DOCUMENT_UPLOADED/DOCUMENTS_REFRESH_REQUEST`, exibindo o status de análise sem recarregar a página e notificando o backoffice sobre novos arquivos.
- **Gestão de Documentos** (apps `admin-console`): a página `/gestao-documentos` agora consome o backend real, revisa arquivos via `PUT /documents/{id}/review` e replica as ações para o painel do lojista com eventos `DOCUMENT_REVIEW_UPDATED/DOCUMENTS_REFRESH_REQUEST`.

> Sempre que futuros endpoints do backend estiverem disponíveis, basta converter os handlers atuais para disparar os mesmos eventos (ou o `DEALER/PROPOSALS_REFRESH_REQUEST`) após persistir a operação — a UI já está preparada para escutar as notificações.

## APIs REST

### Autenticação (Auth)

| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/api/v1/grota-financiamentos/auth/register` | Cadastro de lojistas via painel externo | Retorna DTO com dados do dealer criado. |
| `POST` | `/api/v1/grota-financiamentos/auth/login` | Emite access + refresh token e cookies (`access_token`, `refresh_token`) | Valida credenciais e resolve o identificador de login. |
| `POST` | `/api/v1/grota-financiamentos/auth/refresh` | Gera novo access token com refresh token em cookie | Retorna novo cookie seguro sem expirar o `refresh_token`. |
| `POST` | `/api/v1/grota-financiamentos/auth/logout` | Remove cookies de sessão e revoga refresh token | Envia `Set-Cookie` com valor vazio para expirar. |
| `GET` | `/api/v1/grota-financiamentos/auth/me` | Retorna dados do usuário autenticado e permissões | Calcula permissões derivadas de seller/operator/manager. |
| `PUT` | `/api/v1/grota-financiamentos/auth/verify-code` | Valida código enviado por e-mail para concluir login | Necessário para ativar conta. |
| `POST` | `/api/v1/grota-financiamentos/auth/resend-code` | Reenvia código de verificação | Aceita DTO com e-mail. |
| `PUT` | `/api/v1/grota-financiamentos/auth/change-password` | Atualiza senha atual com nova senha | Requer autenticação, valida dados. |
| `POST` | `/api/v1/grota-financiamentos/auth/forgot-password` | Dispara código para redefinição de senha | Gera código temporário via e-mail. |
| `POST` | `/api/v1/grota-financiamentos/auth/reset-password` | Confirma nova senha usando código enviado | Finaliza fluxo de reset no backend. |

### Dealers e perfil

| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/api/v1/grota-financiamentos/dealers/admin-register` | Cadastro de lojista feito pelo admin | Envia dados completos de endereço e sócios. |
| `GET` | `/api/v1/grota-financiamentos/dealers` | Lista de lojistas com paginação automática | Ordena por nome (10 por página). |
| `GET` | `/api/v1/grota-financiamentos/dealers/{id}` | Detalhes de um lojista específico | Retorna DTO do registro. |
| `GET` | `/api/v1/grota-financiamentos/dealers/{id}/details` | Perfil completo do lojista (visão pública) | Alternativa ao `/me/details`. |
| `GET` | `/api/v1/grota-financiamentos/dealers/me/details` | Perfil completo do lojista autenticado | Usa o `AuthenticationPrincipal` para buscar o dealer. |
| `GET` | `/api/v1/grota-financiamentos/dealers/{id}/documents` | Documentos associados ao lojista | Inclui metadados para painel |
| `GET` | `/api/v1/grota-financiamentos/dealers/{id}/vehicles` | Veículos registrados pelo lojista | Retorna DTOs do pacote `vehicle`. |
| `PUT` | `/api/v1/grota-financiamentos/dealers/me` | Atualiza dados do lojista autenticado | Reusa DTO de cadastro. |
| `PUT` | `/api/v1/grota-financiamentos/dealers/profile/complete` | Completa perfil pós-cadastro | Permite informações adicionais. |
| `PATCH` | `/api/v1/grota-financiamentos/dealers/profile/update` | Atualiza dados de perfil empresarial | Pode alterar empresa, CNPJ e endereço. |
| `POST` | `/api/v1/grota-financiamentos/dealers/logo` | Upload da logomarca do lojista | Envia `multipart/form-data` com validação Cloudinary. |
| `DELETE` | `/api/v1/grota-financiamentos/dealers/{id}` | Remove lojista e dados relacionados | Retorna `204 No Content`. |

### Gestão de documentos

| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/api/v1/grota-financiamentos/documents/upload` | Upload de documento por lojista | Recebe `documentType` e arquivo com possível `dealerId`. |
| `PUT` | `/api/v1/grota-financiamentos/documents/{id}/review` | Atualiza status de revisão de um documento | Requer perfil admin (`DocumentReviewRequestDTO`). |
| `GET` | `/api/v1/grota-financiamentos/documents` | Lista todos documentos do usuário autenticado | Usado no painel lojista para mostrar pendências. |
| `GET` | `/api/v1/grota-financiamentos/documents/{id}/url` | Gera URL pré-assinada | Entrega a `String` com acesso temporário ao arquivo. |

### Propostas

| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/api/v1/grota-financiamentos/proposals` | Cria ficha de proposta nova | Cabeçalho `X-Actor` opcional e registra IP. |
| `GET` | `/api/v1/grota-financiamentos/proposals` | Lista propostas filtradas por `dealerId` e `status` | Utiliza enums `ProposalStatus`. |
| `PATCH` | `/api/v1/grota-financiamentos/proposals/{id}/status` | Atualiza status (SUBMITTED, PENDING, APPROVED, REJECTED) | Registra IP de atualização. |
| `GET` | `/api/v1/grota-financiamentos/proposals/{id}/events` | Timeline de eventos da proposta | Serve dashboards/admin para histórico. |

### Notificações

| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/api/v1/grota-financiamentos/notifications` | Cria notificação com `targetType`, `actor`, `href`, etc. | Alimenta WebSocket e BFFs. |
| `GET` | `/api/v1/grota-financiamentos/notifications` | Lista notificações filtradas por `targetType` e `targetId` | Requer query string. |
| `PATCH` | `/api/v1/grota-financiamentos/notifications/{id}/read` | Marca notificação como lida | Retorna `204`. |
| `GET` | `/api/v1/grota-financiamentos/notifications/stream` | SSE para eventos em tempo real | `text/event-stream`, o mesmo canal usado pelo dashboard admin. |

### Usuários (User)

| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/api/v1/grota-financiamentos/users` | Cria usuário interno/admin/papel | Valida role via enums `UserRole`. |
| `GET` | `/api/v1/grota-financiamentos/users` | Lista usuários, opcionalmente por `role` | Retorna array de DTOs. |
| `GET` | `/api/v1/grota-financiamentos/users/{id}` | Busca usuário por ID | |
| `PATCH` | `/api/v1/grota-financiamentos/users/{id}/dealer` | Atualiza vínculo entre usuário e lojista | Aceita `dealerId` opcional. |
| `GET` | `/api/v1/grota-financiamentos/users/me` | Dados do usuário autenticado | Utiliza `AuthenticationPrincipal`. |
| `PUT` | `/api/v1/grota-financiamentos/users/me` | Atualiza perfil do usuário autenticado | Usa `UserProfileUpdateDTO`. |

### Vendedores, operadores e gestores

| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/api/v1/grota-financiamentos/sellers` | Cadastro de vendedor | Associado ao dealer via autenticação. |
| `GET` | `/api/v1/grota-financiamentos/sellers` | Lista vendedores (filtrável por `dealerId`) | Ordena por nome. |
| `GET` | `/api/v1/grota-financiamentos/sellers/{id}` | Busca vendedor por ID | |
| `PUT` | `/api/v1/grota-financiamentos/sellers/{id}` | Atualiza dados do vendedor | |
| `PATCH` | `/api/v1/grota-financiamentos/sellers/{id}/dealer` | Reatribui lojista do vendedor | `dealerId` opcional na query. |
| `DELETE` | `/api/v1/grota-financiamentos/sellers/{id}` | Remove vendedor com usuário associado | Retorna `204 No Content`. |
| `POST` | `/api/v1/grota-financiamentos/operators` | Cadastro de operador | Regras semelhantes às do seller. |
| `GET` | `/api/v1/grota-financiamentos/operators` | Lista operadores (por `dealerId`) | |
| `GET` | `/api/v1/grota-financiamentos/operators/{id}` | Busca operador por ID | |
| `PUT` | `/api/v1/grota-financiamentos/operators/{id}` | Atualiza dados do operador | |
| `PATCH` | `/api/v1/grota-financiamentos/operators/{id}/dealer` | Reatribui lojista do operador | |
| `DELETE` | `/api/v1/grota-financiamentos/operators/{id}` | Remove operador e usuário | |
| `POST` | `/api/v1/grota-financiamentos/managers` | Cadastro de gestor | |
| `GET` | `/api/v1/grota-financiamentos/managers` | Lista gestores (por `dealerId`) | |
| `GET` | `/api/v1/grota-financiamentos/managers/{id}` | Busca gestor por ID | |
| `PUT` | `/api/v1/grota-financiamentos/managers/{id}` | Atualiza dados do gestor | |
| `PATCH` | `/api/v1/grota-financiamentos/managers/{id}/dealer` | Reatribui lojista do gestor | |
| `DELETE` | `/api/v1/grota-financiamentos/managers/{id}` | Remove gestor e usuário | |

### Veículos

| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/api/v1/grota-financiamentos/vehicles` | Cadastro de novo veículo | Requer usuário autenticado. |
| `GET` | `/api/v1/grota-financiamentos/vehicles` | Lista todos os veículos | |
| `GET` | `/api/v1/grota-financiamentos/vehicles/{id}` | Busca veículo por ID | |
| `PUT` | `/api/v1/grota-financiamentos/vehicles/{vehicleId}` | Atualiza dados do veículo | Fornece DTO completo. |
| `PATCH` | `/api/v1/grota-financiamentos/vehicles/{id}/status` | Atualiza status (DISPONÍVEL, VENDIDO, etc.) | Usa `VehicleStatusUpdateDTO`. |

Gerar chave openssl rand -base64 48
Z1z3Uay+jLoTyGj0GFua1T6PcmjnZFjETZnHVv/OhjtC8RzuULEKttX+ZHqn01ti
````
