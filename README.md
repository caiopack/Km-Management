# CSE Manager

<p align="center">
  <strong>Uma plataforma completa para a gestão de serviços de refrigeração.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-007396?style=for-the-badge&logo=java&logoColor=white" alt="Java 21">
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.5-6DB33F?style=for-the-badge&logo=spring&logoColor=white" alt="Spring Boot 3.4.5">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
</p>

## Sobre o Projeto

O **CSE Manager** é uma solução `full-stack` desenvolvida para centralizar e otimizar a gestão de operações de serviços. A arquitetura divide-se em dois componentes principais:

* **Backend**: Uma API RESTful robusta, desenvolvida com Java e Spring Boot, responsável por toda a lógica de negócio, persistência de dados e segurança da aplicação.
* **Frontend**: Uma Single-Page Application (SPA) reativa e dinâmica, construída com React, que consome a API do backend para fornecer a interface de utilizador.

---

## Funcionalidades

-   **Autenticação Segura**: Sistema de login e registo com tokens JWT para garantir a segurança dos dados.
-   **Dashboard de Métricas**: Painel de controle com gráficos que exibem uma visão geral das tarefas.
-   **Gestão de Clientes (CRM)**: Interface completa para criar, visualizar, editar e apagar clientes.
-   **Agenda Kanban**: Quadro interativo para organizar as tarefas por estado, com funcionalidade `drag-and-drop`.
-   **Geração de Orçamentos**: Ferramenta para criar e exportar orçamentos detalhados em formato PDF.
-   **Interface Responsiva**: Design adaptável para desktops e dispositivos móveis.

---

## Demonstrações

### **Login e Registo**
![1](https://github.com/user-attachments/assets/67c0aabb-090e-426f-834b-5b01092649d1)

### **Dashboard Interativo**
![2](https://github.com/user-attachments/assets/f11293c9-6f4f-41ea-8ece-7b962343348c)

### **Agenda Kanban**
![3](https://github.com/user-attachments/assets/408e53d6-93e7-4822-b064-8549711e4265)

### **Gestão de Clientes**
![4](https://github.com/user-attachments/assets/68b825be-0042-4a30-a100-ab3aac5333c8)

### **Geração de Orçamentos**
![5](https://github.com/user-attachments/assets/00a38efa-577f-47dd-991c-2d1dbe651dd2)

---

## Pilha Tecnológica

| Componente | Tecnologias Utilizadas |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.4.5, Spring Security, Spring Data JPA, MySQL, Maven |
| **Frontend**| React 19, React Router 7, Axios, Bootstrap 5, Recharts, Dnd-Kit, jspdf |

---

## Guia de Instalação e Execução

Para executar o projeto localmente, siga os passos abaixo.

### Pré-requisitos

-   Java JDK 21 ou superior
-   Apache Maven
-   Node.js e npm
-   Servidor MySQL

### Backend

1.  **Navegue para o diretório do backend:**
    ```bash
    cd backend
    ```

2.  **Configure a Base de Dados:**
    -   Certifique-se de que o seu servidor MySQL está em execução.
    -   Crie uma base de dados com o nome `cse_manager`.
    -   No ficheiro `src/main/resources/application.properties`, atualize as suas credenciais:
        ```properties
        spring.datasource.url=jdbc:mysql://localhost:3306/cse_manager?useSSL=false&serverTimezone=UTC
        spring.datasource.username=seu_utilizador
        spring.datasource.password=sua_senha
        ```

3.  **Execute a aplicação:**
    ```bash
    ./mvnw spring-boot:run
    ```
    O servidor será iniciado em `http://localhost:8080`.

### Frontend

1.  **Navegue para o diretório do frontend:**
    ```bash
    cd frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm start
    ```
    A aplicação será aberta no seu navegador em `http://localhost:3000`.
