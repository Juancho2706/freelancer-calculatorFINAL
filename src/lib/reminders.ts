import { supabase } from './supabase-config';
import { Reminder, CreateReminderData, ReminderStats, ReminderFilters } from '@/utils/types';

// Obtener todos los recordatorios del usuario
export async function getReminders(filters?: ReminderFilters): Promise<Reminder[]> {
  try {
    let query = supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true });

    // Aplicar filtros
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.is_completed !== undefined) {
      query = query.eq('is_completed', filters.is_completed);
    }
    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }
    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
}

// Obtener recordatorios pendientes (no completados)
export async function getPendingReminders(): Promise<Reminder[]> {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending reminders:', error);
    throw error;
  }
}

// Obtener recordatorios vencidos
export async function getOverdueReminders(): Promise<Reminder[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .lt('due_date', now)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching overdue reminders:', error);
    throw error;
  }
}

// Crear un nuevo recordatorio
export async function createReminder(reminderData: CreateReminderData): Promise<Reminder> {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .insert([reminderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
}

// Actualizar un recordatorio
export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
}

// Marcar recordatorio como completado
export async function completeReminder(id: string): Promise<Reminder> {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .update({ is_completed: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error completing reminder:', error);
    throw error;
  }
}

// Eliminar un recordatorio
export async function deleteReminder(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
}

// Obtener estadísticas de recordatorios
export async function getReminderStats(): Promise<ReminderStats> {
  try {
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*');

    if (error) throw error;

    const now = new Date();
    const stats: ReminderStats = {
      total: reminders?.length || 0,
      completed: reminders?.filter(r => r.is_completed).length || 0,
      pending: reminders?.filter(r => !r.is_completed).length || 0,
      overdue: reminders?.filter(r => !r.is_completed && new Date(r.due_date) < now).length || 0,
      byType: {},
      byPriority: {}
    };

    // Contar por tipo
    reminders?.forEach(reminder => {
      stats.byType[reminder.type] = (stats.byType[reminder.type] || 0) + 1;
      stats.byPriority[reminder.priority] = (stats.byPriority[reminder.priority] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    throw error;
  }
}

// Crear recordatorios automáticos basados en cálculos
export async function createAutomaticReminders(calculoId: string, calculoData: any): Promise<void> {
  try {
    const reminders = [];

    // Recordatorio para seguimiento de cliente (si es un proyecto)
    if (calculoData.modo === 'proyecto') {
      const projectDeadline = new Date();
      projectDeadline.setDate(projectDeadline.getDate() + 7); // 1 semana después

      reminders.push({
        type: 'project_deadline' as const,
        title: `Seguimiento proyecto: ${calculoData.nombreProyecto || 'Proyecto'}`,
        description: `Recordatorio para hacer seguimiento del proyecto con presupuesto ${calculoData.presupuesto?.toLocaleString('es-CL')} CLP`,
        due_date: projectDeadline.toISOString(),
        priority: 'medium' as const
      });
    }

    // Recordatorio para revisar tarifas (cada 3 meses)
    const reviewDate = new Date();
    reviewDate.setMonth(reviewDate.getMonth() + 3);

    reminders.push({
      type: 'custom' as const,
      title: 'Revisar tarifas',
      description: 'Es momento de revisar y actualizar tus tarifas según el mercado',
      due_date: reviewDate.toISOString(),
      priority: 'low' as const,
      is_recurring: true,
      recurrence_pattern: 'monthly' as const
    });

    // Insertar recordatorios
    if (reminders.length > 0) {
      const { error } = await supabase
        .from('reminders')
        .insert(reminders);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error creating automatic reminders:', error);
    // No lanzar error para no afectar el cálculo principal
  }
}

// Función para obtener recordatorios próximos (próximos 7 días)
export async function getUpcomingReminders(): Promise<Reminder[]> {
  try {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .gte('due_date', now.toISOString())
      .lte('due_date', nextWeek.toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    throw error;
  }
} 