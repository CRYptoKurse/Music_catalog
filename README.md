flowchart TB
    subgraph CLI [Командная строка (CLI)]
        direction LR
        A1[micropki ca]
        A2[micropki repo]
        A3[micropki ocsp]
        A4[micropki client]
    end

    subgraph Core [Ядро PKI]
        B1[CA module<br>ca.py / csr.py]
        B2[Policy engine<br>policy.py]
        B3[Templates<br>templates.py]
        B4[Crypto utils<br>crypto_utils.py]
    end

    subgraph Data [Хранение данных]
        C1[(SQLite DB<br>database.py)]
        C2[Audit log + chain.dat<br>audit.py]
        C3[CT log (simulated)<br>transparency.py]
    end

    subgraph Servers [Серверы]
        D1[Repository Server<br>repo.py / Flask]
        D2[OCSP Responder<br>ocsp_responder.py / Flask]
    end

    subgraph Client [Клиентские утилиты]
        E1[CSR generation<br>client.py / gen_csr]
        E2[Certificate validation<br>validation.py]
        E3[Revocation check<br>revocation_check.py]
    end

    subgraph External [Внешние системы]
        F1[HTTPS Client<br>curl / browser]
        F2[Code Signing Tool<br>openssl]
        F3[PKI End-User]
    end

    %% Связи CLI → ядро
    A1 --> B1
    A1 --> B2
    A1 --> B3
    A1 --> B4
    A1 --> C1
    A1 --> C2
    A1 --> C3

    A2 --> D1
    A3 --> D2
    A4 --> E1
    A4 --> E2
    A4 --> E3

    %% Связи ядра с хранилищами
    B1 --> C1
    B1 --> C2
    B1 --> C3
    B2 -.-> B1
    B3 -.-> B1

    %% Репозиторий вызывает CA для /request-cert
    D1 --> B1
    D1 --> C1

    %% OCSP responder читает БД
    D2 --> C1
    D2 --> E3   %% использует check_revocation_status

    %% Клиентские утилиты используют crypto и validation
    E1 --> B4
    E2 --> B4
    E2 --> E3
    E3 --> B4

    %% Внешние взаимодействия
    F1 --> D1
    F1 --> D2
    F2 --> E1
    F3 --> A4

    %% Легенда
    style CLI fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style Core fill:#fff9c4,stroke:#fbc02d,stroke-width:2px
    style Data fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style Servers fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    style Client fill:#fbe9e7,stroke:#bf360c,stroke-width:2px
    style External fill:#eceff1,stroke:#455a64,stroke-width:2px
