// Tipos para recordatorios
export interface Reminder {
  id: string;
  user_id: string;
  type: 'payment' | 'project_deadline' | 'client_followup' | 'tax_deadline' | 'custom';
  title: string;
  description?: string;
  due_date: string;
  is_completed: boolean;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface CreateReminderData {
  type: Reminder['type'];
  title: string;
  description?: string;
  due_date: string;
  is_recurring?: boolean;
  recurrence_pattern?: Reminder['recurrence_pattern'];
  priority?: Reminder['priority'];
}

// Tipos para templates
export interface CalculationTemplate {
  id: string;
  name: string;
  description?: string;
  rubro: string;
  experiencia: string;
  modo: 'hora' | 'proyecto';
  config: Record<string, any>;
  is_default: boolean;
  is_public: boolean;
  created_by?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateFavorite {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
}

// Tipos para el dashboard
export interface DashboardStats {
  totalCalculos: number;
  favoritos: number;
  esteMes: number;
  promedioTarifaHora: number;
  promedioProyecto: number;
  modoMasUsado: string;
  rubroMasUsado: string;
  experienciaPromedio: string;
  recordatoriosPendientes: number;
  templatesUsados: number;
}

// Tipos para notificaciones
export interface NotificationData {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// Tipos para el sistema de recordatorios
export interface ReminderStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

// Tipos para filtros y búsqueda
export interface ReminderFilters {
  type?: Reminder['type'];
  priority?: Reminder['priority'];
  is_completed?: boolean;
  due_date_from?: string;
  due_date_to?: string;
}

export interface TemplateFilters {
  rubro?: string;
  experiencia?: string;
  modo?: 'hora' | 'proyecto';
  is_favorite?: boolean;
  search?: string;
} 