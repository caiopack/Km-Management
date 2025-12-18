package com.csemanager.dto;

public class TaskDTO {
    private Long id;
    private String titulo;
    private String descricao;
    private String status;
    private Integer prioridade;
    private Long clienteId;
    private String clienteNome;
    private String clienteEndereco;
    private String dataServico;
    private String criadoPor;
    // --- NOVO CAMPO ---
    private Double valorPago;

    public TaskDTO() {}

    public TaskDTO(Long id, String titulo, String descricao, String status, Integer prioridade,
                   Long clienteId, String clienteNome, String clienteEndereco, String dataServico, 
                   String criadoPor, Double valorPago) {
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.status = status;
        this.prioridade = prioridade;
        this.clienteId = clienteId;
        this.clienteNome = clienteNome;
        this.clienteEndereco = clienteEndereco;
        this.dataServico = dataServico;
        this.criadoPor = criadoPor;
        this.valorPago = valorPago;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getPrioridade() { return prioridade; }
    public void setPrioridade(Integer prioridade) { this.prioridade = prioridade; }

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getClienteEndereco() { return clienteEndereco; }
    public void setClienteEndereco(String clienteEndereco) { this.clienteEndereco = clienteEndereco; }

    public String getDataServico() { return dataServico; }
    public void setDataServico(String dataServico) { this.dataServico = dataServico; }

    public String getCriadoPor() { return criadoPor; }
    public void setCriadoPor(String criadoPor) { this.criadoPor = criadoPor; }

    public Double getValorPago() { return valorPago; }
    public void setValorPago(Double valorPago) { this.valorPago = valorPago; }
}