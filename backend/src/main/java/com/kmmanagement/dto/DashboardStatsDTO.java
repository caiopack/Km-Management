package com.kmmanagement.dto;

import java.math.BigDecimal;

public record DashboardStatsDTO(
    long totalAgendamentos, 
    long clientesNovos, 
    long clientesRecorrentes,
    BigDecimal valorEsperado, // Total Geral (100%)
    BigDecimal valorRecebido, // Já Pago (Sinais + Pagamentos Totais)
    BigDecimal valorAPagar    // O que falta (Restante)
) {}