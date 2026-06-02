import { createClient } from '@/lib/supabase/server'
export default async function Me() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user!.id).single()
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">My iClose</h1>
      <p className="mt-4 text-[15px] text-text-secondary">{profile?.full_name ?? profile?.email ?? user?.email}</p>
    </div>
  )
}
