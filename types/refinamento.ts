// =====================================================
// INDEX: TYPES - REFINAMENTO EASYDENT
// Exporta todos os types dos novos módulos
// =====================================================

// Módulos P0 (Críticos)
export * from './confirmations';
export * from './labOrders';
export * from './recalls';

// Módulos P1 e P2
export * from './inventory';
export * from './modules';

// Re-exportar types principais para facilitar importação
export type {
    // Confirmações
    AppointmentConfirmation,
    PendingConfirmation,
    ConfirmationStatus,
    CreateConfirmationDTO,
    UpdateConfirmationDTO,
    ConfirmationStats,

    // Laboratório
    LabOrder,
    OverdueLabOrder,
    LabSupplierPerformance,
    LabOrderStatus,
    CreateLabOrderDTO,
    UpdateLabOrderDTO,
    LabOrderStats,

    // Recalls
    PatientRecall,
    RecallOpportunity,
    RecallType,
    RecallStatus,
    CreateRecallDTO,
    UpdateRecallDTO,
    RecallStats,

    // Estoque
    InventoryItem,
    InventoryMovement,
    LowStockItem,
    ProcedureRecipe,
    ProcedureMaterialUsage,
    CreateInventoryItemDTO,
    CreateInventoryMovementDTO,
    InventoryStats,

    // Anamnese
    PatientAnamnesis,
    MedicalAlert,
    AlertType,
    AlertSeverity,

    // Imagens
    ClinicalImage,
    ClinicalImageType,

    // Contratos
    RecurringContract,
    ContractType,
    ContractStatus,
    MRRDashboard,

    // Prescrições
    Prescription,
    PrescriptionItem,
    MedicalCertificate,
    MedicationLibrary,
    PrescriptionType,

    // Odontograma
    DentalCharting,
    ToothStatus,

    // Produtividade
    ProfessionalMonthlyMetrics,
    ProfessionalRanking,

    // KPIs
    ClinicKPIs,
} from './modules';
