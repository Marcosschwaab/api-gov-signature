
# API de Assinatura Digital com GOV.BR em NestJS

Esta é uma API construída em NestJS para facilitar a integração com o serviço de assinatura digital de documentos do GOV.BR.

## Funcionalidades

- Inicia o fluxo de assinatura de um hash de documento.
- Orquestra o processo de autenticação e autorização OAuth2 com a API do GOV.BR.
- Recebe o callback do GOV.BR, obtém o token de acesso e realiza a assinatura digital.

## Pré-requisitos

- Node.js (versão 16 ou superior)
- npm
- Credenciais da API do GOV.BR (`client_id` e `client_secret`)

## Instalação

1. Clone este repositório:
   ```bash
   git clone <url-do-repositorio>
   cd <nome-do-diretorio>
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

## Configuração

1. Crie um arquivo `.env` na raiz do projeto.

2. Adicione as seguintes variáveis de ambiente ao arquivo `.env`:
   ```
   # Credenciais da API GOV.BR
   GOV_CLIENT_ID=seu_client_id
   GOV_CLIENT_SECRET=seu_client_secret
   GOV_REDIRECT_URI=http://localhost:3000/signature/callback
   ```

   - Substitua `seu_client_id` e `seu_client_secret` pelas suas credenciais reais fornecidas pelo GOV.BR.
   - A `GOV_REDIRECT_URI` deve ser a mesma que você cadastrou na plataforma do GOV.BR.

## Como Usar

1. Inicie a aplicação:
   ```bash
   npm run start:dev
   ```

2. **Iniciar a Assinatura**

   Para iniciar o processo de assinatura, envie uma requisição `POST` para o endpoint `/signature` com o hash do documento que você deseja assinar.

   **Exemplo de Requisição (usando cURL):**
   ```bash
   curl -X POST http://localhost:3000/signature \
   -H "Content-Type: application/json" \
   -d '{"hash": "SEU_HASH_EM_BASE64"}'
   ```

   - Substitua `SEU_HASH_EM_BASE64` pelo hash SHA-256 do seu documento, codificado em Base64.

   **Resposta:**

   A API retornará um objeto JSON com a URL de autorização do GOV.BR:
   ```json
   {
     "url": "https://assinador.iti.br/oauth2/authorize?response_type=code&client_id=...&scope=sign&redirect_uri=...&state=..."
   }
   ```

3. **Redirecionamento e Autenticação**

   - Redirecione o usuário para a `url` recebida na resposta.
   - O usuário fará a autenticação na plataforma do GOV.BR e autorizará a assinatura.

4. **Callback e Finalização**

   - Após a autorização, o GOV.BR redirecionará o usuário de volta para a `GOV_REDIRECT_URI` (`http://localhost:3000/signature/callback`).
   - A API receberá o código de autorização, o trocará por um token de acesso e usará esse token para assinar o hash do documento.
   - O resultado da assinatura (o pacote PKCS#7) será retornado como uma resposta JSON para o navegador do usuário (ou para o cliente que fez a requisição de callback).

## Fluxo da API

1.  **`POST /signature`**
    - **Corpo da Requisição**: `{ "hash": "<hash_em_base64>" }`
    - **Ação**: O `SignatureController` recebe o hash. O `SignatureService` constrói a URL de autorização do GOV.BR, incluindo o `client_id`, `redirect_uri`, e o `hash` (no parâmetro `state` para ser recuperado no callback).
    - **Resposta**: `{ "url": "<url_de_autorizacao>" }`

2.  **`GET /signature/callback`**
    - **Parâmetros da Query**: `code`, `state`
    - **Ação**:
        - O GOV.BR redireciona o usuário para este endpoint com um `code` de autorização e o `state` (que contém o hash original).
        - O `SignatureController` extrai o `code` e o `state`.
        - O `SignatureService` faz uma requisição `POST` para o endpoint de token do GOV.BR para trocar o `code` por um `access_token`.
        - Com o `access_token`, o `SignatureService` faz uma requisição `POST` para o endpoint de assinatura do GOV.BR, enviando o hash para ser assinado.
    - **Resposta**: Retorna o pacote de assinatura PKCS#7 em formato JSON.

```
