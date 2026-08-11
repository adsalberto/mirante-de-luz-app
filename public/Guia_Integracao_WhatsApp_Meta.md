# GUIA OFICIAL DE INTEGRAÇÃO - WHATSAPP BUSINESS CLOUD API (META)
## Casa Espírita / Centro Espírita Mirante de Luz (CEMIL)

Este guia contém as instruções passo a passo para cadastrar, configurar e obter as credenciais oficiais da **Meta (WhatsApp Cloud API)** para envio automático e massivo de lembretes de escala, convocação de trabalhadores e avisos do mural.

---

### REQUISITOS PRÉVIOS
1. **Conta Pessoal no Facebook**: Necessária para acessar o portal de desenvolvedores.
2. **Número de Telefone Dedicado**: Um número exclusivo para a Casa Espírita (que não esteja em uso em um aplicativo WhatsApp normal no celular; se estiver em uso, precisará ser desvinculado antes).
3. **Gerenciador de Negócios da Meta (Meta Business Manager)**: Conta comercial da instituição (pode ser criada durante o processo com o CNPJ ou dados da Casa Espírita).

---

### ETAPA 1: Cadastro no Portal Meta for Developers
1. Acesse: **[developers.facebook.com](https://developers.facebook.com/)**
2. Faça login com a conta do Facebook responsável pela administração da Casa Espírita.
3. Clique em **"Começar"** ou **"Meus Apps"** no canto superior direito.
4. Conclua a verificação de conta digitando seu e-mail e número para confirmação via SMS.

---

### ETAPA 2: Criação do Aplicativo de Negócios
1. No painel de Desenvolvedores, clique no botão azul **"Criar App"**.
2. Selecione o tipo de aplicativo: **"Outro"** ou **"Negócios"** (*Business*).
3. Informe os detalhes do app:
   - **Nome do App**: `CEMIL - Lembretes de Escala` (ou nome da sua Casa Espírita).
   - **E-mail de contato**: E-mail oficial da secretaria/administração.
   - **Conta do Gerenciador de Negócios**: Selecione a conta comercial da instituição (ou crie uma nova).
4. Clique em **"Criar App"** e digite sua senha do Facebook para confirmar.

---

### ETAPA 3: Adicionar o Produto WhatsApp
1. No painel do seu app recém-criado, role a página até a seção **"Adicionar produtos ao seu app"**.
2. Localize o **WhatsApp** e clique em **"Configurar"**.
3. Selecione ou vincule sua conta do Gerenciador de Negócios Meta.
4. A Meta exibirá a tela **"Painel do WhatsApp / Começar"**. Aqui você verá:
   - **Token de Acesso Temporário** (válido por 24 horas - usado apenas para testes iniciais).
   - **Identificação do Número de Telefone (Phone Number ID)** - *Guarde este código*.
   - **Identificação da Conta do WhatsApp Business (WABA ID)** - *Guarde este código*.

---

### ETAPA 4: Cadastrar o Número Oficial da Casa Espírita
1. Na mesma tela de configuração do WhatsApp, vá até a seção **"Etapa 5: Adicionar número de telefone"**.
2. Clique no botão **"Adicionar número de telefone"**.
3. Preencha os dados do perfil público:
   - **Nome de exibição do WhatsApp**: `Centro Espírita Mirante de Luz` (deve condizer com o nome da instituição).
   - **Categoria**: `Organização sem fins lucrativos` ou `Religioso/Comunitário`.
4. Digite o número de telefone fixo ou móvel exclusivo da instituição.
5. Selecione o método de verificação (**SMS** ou **Ligação telefônica**) e insira o código de 6 dígitos recebido.

---

### ETAPA 5: Gerar o Token de Acesso Permanente (System User Token)
*Atenção: O token da tela inicial expira em 24h. Para o sistema funcionar continuamente, gere um Token Permanente seguindo estes passos:*

1. Acesse o **Gerenciador de Negócios da Meta**: **[business.facebook.com](https://business.facebook.com/)**
2. Vá em **Configurações do Negócio** > **Usuários** > **Usuários do Sistema**.
3. Clique em **Adicionar** para criar um Usuário do Sistema:
   - **Nome**: `Bot_Escalas_CEMIL`
   - **Função**: `Administrador`
4. Após criar, clique em **Adicionar Ativos**:
   - Selecione **Apps** > Selecione o app criado (`CEMIL - Lembretes de Escala`).
   - Marque a permissão **Controle total** e salve.
5. Clique no botão **"Gerar Novo Token"**:
   - Selecione o App: `CEMIL - Lembretes de Escala`.
   - Na lista de permissões, marque obrigatoriamente:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Clique em **Gerar Token**.
6. **COPIE E GUARDE O TOKEN EM LOCAL SEGURO** (ele só é exibido uma vez).

---

### ETAPA 6: Criar e Aprovar os Modelos de Mensagem (Templates HSM)
Pelas diretrizes da Meta, **mensagens ativas** iniciadas pela instituição (como lembretes de escala) exigem o uso de **Modelos pré-aprovados**.

1. No painel do WhatsApp no *Meta Developers*, clique no link **"Criar modelos de mensagem"** (ou acesse o *Gerenciador do WhatsApp*).
2. Clique em **"Criar modelo"**:
   - **Categoria**: `UTILITY` (Utilidade)
   - **Nome do Modelo**: `lembrete_escala_voluntario` (use apenas letras minúsculas e underline).
   - **Idioma**: `Portuguese (BR)`.
3. Configure o texto do modelo com variáveis:
   ```text
   Olá, {{1}}! 🌿
   
   Lembramos da sua escala de trabalho voluntário no Centro Espírita Mirante de Luz:
   📅 Setor: {{2}}
   ⏰ Data/Horário: {{3}}
   
   Por favor, confirme sua presença respondendo esta mensagem.
   Que a paz do Mestre Jesus acompanhe seus passos!
   ```
4. Clique em **Enviar para análise** (a aprovação automática da Meta leva de 1 a 15 minutos).

---

### ETAPA 7: Inserir as Credenciais no Sistema
Quando for retomar a integração no sistema, cadastre as variáveis de ambiente no arquivo de configuração do projeto (`.env`):

```env
# CREDENCIAIS OFICIAIS META WHATSAPP CLOUD API
WHATSAPP_CLOUD_API_TOKEN=EAAG... (seu token permanente gerado na Etapa 5)
WHATSAPP_PHONE_NUMBER_ID=1092837465... (Phone Number ID da Etapa 3)
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321... (WABA ID da Etapa 3)
WHATSAPP_TEMPLATE_NAME=lembrete_escala_voluntario
```

---

### RESUMO DOS DADOS OBTIDOS
Preencha a tabela abaixo conforme for realizando o cadastro na Meta:

| Item | Valor Obtido no Painel Meta |
| :--- | :--- |
| **Phone Number ID** | `___________________________________` |
| **WABA ID** | `___________________________________` |
| **Token Permanente** | `___________________________________` |
| **Nome do Modelo (Template)** | `lembrete_escala_voluntario` |

---
*Documento gerado em 11/08/2026 para o Centro Espírita Mirante de Luz (CEMIL).*
