import { supabase } from '../supabaseClient';

export const createAuditLog = async ({
  user,
  action,
  entity,
  tableName,
  recordId,
  description,
  metadata = {},
}) => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      action,
      entity,
      table_name: tableName,
      record_id: recordId ? String(recordId) : null,
      description,
      metadata,
    });

    if (error) {
      console.warn('Audit log failed:', error);
    }
  } catch (error) {
    console.warn('Audit log exception:', error);
  }
};