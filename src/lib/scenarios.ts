import { supabase } from './supabase';
import type { ScenarioRow } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const MAX_SCENARIOS = 3;
export type Scenario = ScenarioRow;

// ── List ──────────────────────────────────────────────────────────────────────
export async function listScenarios(): Promise<Scenario[]> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Scenario[];
}

// ── Save (create new) ─────────────────────────────────────────────────────────
export async function saveScenario(
  name: string,
  scenarioData: Record<string, unknown>,
  mapImageUrl?: string | null,
): Promise<Scenario> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('NOT_AUTHENTICATED');

  // Upload map image to Storage if a blob URL is provided
  let mapImagePath: string | null = null;
  if (mapImageUrl && mapImageUrl.startsWith('blob:')) {
    try {
      const blob = await fetch(mapImageUrl).then(r => r.blob());
      const ext = blob.type.split('/')[1] || 'png';
      const path = `${user.id}/${uuidv4()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('scenario-maps')
        .upload(path, blob, { contentType: blob.type });
      if (uploadError) console.warn('Map upload failed (continuing without image):', uploadError);
      else mapImagePath = path;
    } catch (e) {
      console.warn('Map upload failed (continuing without image):', e);
    }
  }

  const { data, error } = await supabase
    .from('scenarios')
    .insert({
      user_id: user.id,
      name,
      scenario_data: scenarioData,
      map_image_path: mapImagePath,
    })
    .select()
    .single();

  if (error) {
    if (error.message?.includes('SCENARIO_LIMIT_REACHED')) throw new Error('SCENARIO_LIMIT_REACHED');
    throw error;
  }
  return data as Scenario;
}

// ── Update (overwrite existing) ───────────────────────────────────────────────
export async function updateScenario(
  id: string,
  updates: {
    name?: string;
    scenarioData?: Record<string, unknown>;
    mapImageUrl?: string | null;
    oldMapImagePath?: string | null;
  },
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('NOT_AUTHENTICATED');

  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.scenarioData !== undefined) patch.scenario_data = updates.scenarioData;

  if (updates.mapImageUrl && updates.mapImageUrl.startsWith('blob:')) {
    try {
      const blob = await fetch(updates.mapImageUrl).then(r => r.blob());
      const ext = blob.type.split('/')[1] || 'png';
      const path = `${user.id}/${uuidv4()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('scenario-maps')
        .upload(path, blob, { contentType: blob.type });
      if (!uploadError) {
        patch.map_image_path = path;
        // Clean up old image
        if (updates.oldMapImagePath) {
          supabase.storage.from('scenario-maps').remove([updates.oldMapImagePath]);
        }
      }
    } catch (e) {
      console.warn('Map upload failed on update:', e);
    }
  }

  const { error } = await supabase.from('scenarios').update(patch).eq('id', id);
  if (error) throw error;
}

// ── Rename only ───────────────────────────────────────────────────────────────
export async function renameScenario(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('scenarios').update({ name }).eq('id', id);
  if (error) throw error;
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteScenario(id: string, mapImagePath?: string | null): Promise<void> {
  const { error } = await supabase.from('scenarios').delete().eq('id', id);
  if (error) throw error;
  if (mapImagePath) {
    await supabase.storage.from('scenario-maps').remove([mapImagePath]);
  }
}

// ── Get signed URL for a stored map image ────────────────────────────────────
export async function getMapImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('scenario-maps')
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
