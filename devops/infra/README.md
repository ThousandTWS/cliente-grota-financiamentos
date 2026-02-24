# Infraestrutura de Producao (Docker)

Este diretório sobe os serviços:
- `postgres:17`
- `redis`
- `api-service` (Spring Boot)
- `nginx-proxy-manager` + `mariadb` (banco do NPM)
- `portainer`

## 1. Preparar variaveis

```bash
cd devops/infra
cp .env.example .env
```

Edite o arquivo `.env` e troque todas as senhas/chaves antes de subir em producao.

## 2. Subir stack

```bash
docker compose up -d --build
```

Verificar status:

```bash
docker compose ps
```

## 3. DNS para thousandtws.digital

No seu provedor DNS, crie os registros `A` apontando para o IP publico do servidor:
- `thousandtws.digital`
- `www.thousandtws.digital` (opcional)
- `npm.thousandtws.digital` (opcional para o painel)

## 4. Acesso ao Nginx Proxy Manager

Acesse:
- `http://SEU_IP_PUBLICO:81`

Credenciais iniciais do NPM (definidas no `.env`):
- Email: `NPM_INITIAL_ADMIN_EMAIL`
- Senha: `NPM_INITIAL_ADMIN_PASSWORD`

No primeiro acesso, altere credenciais.

## 5. Criar Proxy Host para API

No Nginx Proxy Manager:
1. `Proxy Hosts` -> `Add Proxy Host`
2. `Domain Names`: `thousandtws.digital,www.thousandtws.digital`
3. `Scheme`: `http`
4. `Forward Hostname / IP`: `127.0.0.1`
5. `Forward Port`: `8080`
6. Ative `Websockets Support` e `Block Common Exploits`

Na aba `SSL`:
1. Marque `Request a new SSL Certificate`
2. Ative `Force SSL`
3. Ative `HTTP/2 Support`
4. Ative `HSTS Enabled` (opcional)

Salve.

## 6. Acesso ao Portainer

Acesse:
- `http://SEU_IP_PUBLICO:9000`

## 7. Observacoes de infraestrutura

- Este ambiente está em `network_mode: host` para contornar falha de `iptables` no Docker do servidor (`DOCKER-ISOLATION-STAGE-2` ausente).
- Se você corrigir o Docker do host, pode voltar para redes Docker dedicadas (`proxy` e `internal`) para maior isolamento.

## 8. Observacoes de seguranca

- Nao exponha portas do PostgreSQL e Redis para internet.
- Mantenha backup dos volumes Docker.
- Troque periodicamente as senhas do `.env`.
