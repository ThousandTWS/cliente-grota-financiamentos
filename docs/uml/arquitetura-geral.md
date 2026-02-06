# Arquitetura UML - Grota Financiamentos

Sistema de financiamento veicular com painel administrativo, portal de lojistas e site público.

---

## 1. Visão Geral do Sistema

```mermaid
graph TB
    subgraph "Frontend Applications"
        AC["admin-console<br>(Next.js)"]
        DP["dealer-portal<br>(Next.js)"]
        PS["public-site<br>(Next.js)"]
    end

    subgraph "Backend"
        API["api-service<br>(Spring Boot)"]
        PW["process-worker"]
    end

    subgraph "External Services"
        DB[(PostgreSQL)]
        MAIL["Email Service"]
        CLOUD["Cloudinary<br>(Storage)"]
    end

    AC --> API
    DP --> API
    PS --> API
    API --> DB
    API --> MAIL
    API --> CLOUD
    PW --> DB
```

---

## 2. Diagrama de Componentes (Backend)

```mermaid
graph LR
    subgraph "API Service Modules"
        AUTH["auth"]
        USER["user"]
        DEALER["dealer"]
        MANAGER["manager"]
        OPERATOR["operator"]
        SELLER["seller"]
        PROPOSAL["proposal"]
        BILLING["billing"]
        VEHICLE["vehicle"]
        DOCUMENT["document"]
        NOTIF["notification"]
    end

    AUTH --> USER
    MANAGER --> USER
    MANAGER --> DEALER
    OPERATOR --> USER
    OPERATOR --> DEALER
    SELLER --> USER
    SELLER --> DEALER
    PROPOSAL --> DEALER
    PROPOSAL --> SELLER
    BILLING --> PROPOSAL
    VEHICLE --> DEALER
    DOCUMENT --> DEALER
```

---

## 3. Diagrama de Classes - Entidades Principais

```mermaid
classDiagram
    class User {
        +Long id
        +String fullName
        +String email
        +String password
        +UserRole role
        +UserStatus status
        +LocalDateTime createdAt
        +markAsVerified()
        +generateVerificationCode()
    }

    class UserRole {
        <<enumeration>>
        ADMIN
        DEALER
        SELLER
        MANAGER
        OPERATOR
    }

    class UserStatus {
        <<enumeration>>
        ATIVO
        PENDENTE
        INATIVO
    }

    class Dealer {
        +Long id
        +String enterprise
        +String fullNameEnterprise
        +String cnpj
        +String phone
        +String referenceCode
        +Address address
    }

    class Seller {
        +Long id
        +String CPF
        +String phone
        +LocalDate birthData
        +Address address
        +Boolean canView
        +Boolean canCreate
        +Boolean canUpdate
        +Boolean canDelete
    }

    class Manager {
        +Long id
        +String CPF
        +String phone
        +LocalDate birthData
        +Address address
    }

    class Operator {
        +Long id
        +String CPF
        +String phone
        +LocalDate birthData
        +Address address
        +Boolean canView
        +Boolean canCreate
        +Boolean canUpdate
        +Boolean canDelete
    }

    User "1" -- "0..1" Dealer
    User "1" -- "0..1" Seller
    User "1" -- "0..1" Manager
    User "1" -- "0..1" Operator
    User --> UserRole
    User --> UserStatus
    Dealer "1" -- "*" Seller
    Dealer "1" -- "*" Manager
    Dealer "1" -- "*" Operator
```

---

## 4. Diagrama de Classes - Proposta e Cobrança

```mermaid
classDiagram
    class Proposal {
        +Long id
        +String customerName
        +String customerCpf
        +String customerEmail
        +String customerPhone
        +String vehiclePlate
        +String vehicleBrand
        +String vehicleModel
        +BigDecimal vehicleValue
        +BigDecimal entryValue
        +BigDecimal financedValue
        +Integer installments
        +ProposalStatus status
        +LocalDateTime createdAt
    }

    class ProposalStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
        PAID
        CANCELLED
    }

    class BillingContract {
        +Long id
        +LocalDate startDate
        +LocalDate endDate
        +BigDecimal totalValue
        +Integer installmentCount
        +BillingStatus status
    }

    class BillingInstallment {
        +Long id
        +Integer installmentNumber
        +BigDecimal value
        +LocalDate dueDate
        +LocalDate paidDate
        +BillingStatus status
    }

    class BillingStatus {
        <<enumeration>>
        PENDING
        PAID
        OVERDUE
        CANCELLED
    }

    Proposal --> ProposalStatus
    Proposal "*" -- "1" Dealer
    Proposal "*" -- "0..1" Seller
    BillingContract "1" -- "1" Proposal
    BillingContract "1" -- "*" BillingInstallment
    BillingContract --> BillingStatus
    BillingInstallment --> BillingStatus
```

---

## 5. Diagrama de Classes - Veículos e Documentos

```mermaid
classDiagram
    class Vehicle {
        +Long id
        +String plate
        +String brand
        +String model
        +Integer year
        +String color
        +BigDecimal fipeValue
        +String fipeCode
    }

    class Document {
        +Long id
        +String name
        +String url
        +String publicId
        +String type
        +LocalDateTime uploadedAt
    }

    class Partner {
        +Long id
        +String name
        +String cpf
        +PartnerType type
    }

    class PartnerType {
        <<enumeration>>
        SOCIO
        PROCURADOR
    }

    class Notification {
        +Long id
        +String title
        +String description
        +String actor
        +String targetType
        +Long targetId
        +String href
        +Boolean readFlag
        +LocalDateTime createdAt
    }

    Dealer "1" -- "*" Vehicle
    Dealer "1" -- "*" Document
    Dealer "1" -- "*" Partner
    Partner --> PartnerType
```

---

## 6. Arquitetura em Camadas (Por Módulo)

```mermaid
graph TB
    subgraph "Module Pattern"
        CTRL["Controller Layer<br>(REST Endpoints)"]
        SVC["Service Layer<br>(Business Logic)"]
        REPO["Repository Layer<br>(Data Access)"]
        DTO["DTOs<br>(Data Transfer)"]
        MODEL["Model/Entity<br>(Domain)"]
        FACTORY["Factory<br>(Object Creation)"]
    end

    CTRL --> SVC
    SVC --> REPO
    SVC --> FACTORY
    CTRL --> DTO
    SVC --> DTO
    REPO --> MODEL
    FACTORY --> MODEL
```

---

## 7. Diagrama de Sequência - Criação de Proposta

```mermaid
sequenceDiagram
    participant C as Client
    participant PC as ProposalController
    participant PS as ProposalService
    participant PR as ProposalRepository
    participant NS as NotificationService
    participant DB as Database

    C->>PC: POST /proposals
    PC->>PS: create(user, dto)
    PS->>PS: validate data
    PS->>PR: save(proposal)
    PR->>DB: INSERT
    DB-->>PR: proposal
    PS->>NS: create(notification)
    NS-->>PS: notificationDTO
    PS-->>PC: ProposalResponseDTO
    PC-->>C: 201 Created
```

---

## 8. Diagrama de Sequência - Autenticação

```mermaid
sequenceDiagram
    participant C as Client
    participant AC as AuthController
    participant AS as AuthService
    participant UR as UserRepository
    participant JWT as JwtService
    participant RT as RefreshTokenRepo

    C->>AC: POST /auth/login
    AC->>AS: authenticate(email, password)
    AS->>UR: findByEmail(email)
    UR-->>AS: User
    AS->>AS: validatePassword()
    AS->>JWT: generateToken(user)
    JWT-->>AS: accessToken
    AS->>JWT: generateRefreshToken(user)
    JWT-->>AS: refreshToken
    AS->>RT: save(refreshToken)
    AS-->>AC: AuthResponseDTO
    AC-->>C: 200 OK + tokens
```

---

## 9. Diagrama de Fluxo - Atualização de Status de Proposta

```mermaid
stateDiagram-v2
    [*] --> PENDING: Nova proposta
    PENDING --> APPROVED: Admin aprova
    PENDING --> REJECTED: Admin rejeita
    PENDING --> CANCELLED: User cancela
    APPROVED --> PAID: Pagamento confirmado
    APPROVED --> CANCELLED: User cancela
    REJECTED --> [*]
    PAID --> [*]
    CANCELLED --> [*]
```

---

## 10. Relacionamentos Entre Entidades

| Entidade        | Relacionamento | Entidade           |
| --------------- | -------------- | ------------------ |
| User            | 1:1            | Dealer             |
| User            | 1:1            | Seller             |
| User            | 1:1            | Manager            |
| User            | 1:1            | Operator           |
| Dealer          | 1:N            | Seller             |
| Dealer          | 1:N            | Manager            |
| Dealer          | 1:N            | Operator           |
| Dealer          | 1:N            | Vehicle            |
| Dealer          | 1:N            | Document           |
| Dealer          | 1:N            | Partner            |
| Dealer          | 1:N            | Proposal           |
| Seller          | 1:N            | Proposal           |
| Proposal        | 1:1            | BillingContract    |
| BillingContract | 1:N            | BillingInstallment |

---

## 11. Estrutura de Diretórios do Backend

```
api-service/src/main/java/org/example/server/
├── core/
│   ├── email/          # EmailService
│   ├── exception/      # Global exceptions
│   └── util/           # Utilities
├── modules/
│   ├── auth/           # Authentication & Security
│   ├── billing/        # Contracts & Installments
│   ├── dealer/         # Dealer management
│   ├── document/       # Document uploads
│   ├── manager/        # Manager CRUD
│   ├── notification/   # Notification system
│   ├── operator/       # Operator CRUD
│   ├── proposal/       # Proposal workflow
│   ├── seller/         # Seller CRUD
│   ├── user/           # User management
│   └── vehicle/        # Vehicle catalog
└── shared/
    └── address/        # Embedded Address
```

---

## 12. Tecnologias Utilizadas

| Camada       | Tecnologias                                            |
| ------------ | ------------------------------------------------------ |
| **Frontend** | Next.js 14, React, TypeScript, Ant Design, TailwindCSS |
| **Backend**  | Java 21, Spring Boot 3, Spring Security, JPA/Hibernate |
| **Database** | PostgreSQL                                             |
| **Auth**     | JWT (Access + Refresh Tokens)                          |
| **Storage**  | Cloudinary                                             |
| **Build**    | Turborepo, pnpm, Maven                                 |
| **CI/CD**    | Jenkins                                                |
