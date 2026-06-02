import { createClient } from '@/lib/supabase/server'

// RSC direct read. RLS returns only published projects to a buyer (Blueprint §34.1).
export default async function Explore() {
  const supabase = await createClient()
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, slug, name, price_from, currency, handover_quarter, availability')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Explore off-plan projects</h1>
      <p className="mt-2 text-[15px] text-text-secondary">Every project, one honest view.</p>

      {error && <p className="mt-8 text-danger text-[15px]">Could not load projects: {error.message}</p>}

      {!error && (!projects || projects.length === 0) && (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[17px] font-semibold">No projects published yet</p>
          <p className="mt-2 text-[15px] text-text-secondary">
            Add developers, areas, and projects via the admin portal — published projects will appear here.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {projects?.map((p) => (
          <article key={p.id} className="rounded-2xl bg-surface-2 p-6 shadow-1">
            <h2 className="text-[17px] font-semibold">{p.name}</h2>
            <p className="mt-1 text-[15px] text-text-secondary">Handover {p.handover_quarter ?? 'TBC'}</p>
            <p className="mt-3 text-[15px]">
              From <span className="font-semibold tabular-nums">{p.currency} {Number(p.price_from ?? 0).toLocaleString()}</span>
            </p>
            <span className="mt-3 inline-block text-[12px] font-semibold rounded-pill bg-accent-soft text-accent px-3 py-1">
              {p.availability}
            </span>
          </article>
        ))}
      </div>
    </div>
  )
}
