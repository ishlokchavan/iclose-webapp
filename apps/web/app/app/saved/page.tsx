import { createClient } from '@/lib/supabase/server'
export default async function Saved() {
  const supabase = await createClient()
  const { data } = await supabase.from('saved_items').select('id, project_id, created_at')
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Saved</h1>
      {(!data || data.length === 0)
        ? <p className="mt-4 text-[15px] text-text-secondary">Nothing saved yet.</p>
        : <p className="mt-4 text-[15px]">{data.length} saved item(s).</p>}
    </div>
  )
}
