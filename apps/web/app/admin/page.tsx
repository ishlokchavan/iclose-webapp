import Link from 'next/link'

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Admin</h1>
      <p className="mt-2 text-[15px] text-text-secondary">
        Cockpit shell. Build out Projects, Leads, Cashback (maker-checker), Transactions, Users, Audit per Blueprint §41.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/projects"
          className="rounded-2xl bg-surface-2 p-6 shadow-1 hover:bg-surface-3 transition-colors"
        >
          <h2 className="text-[17px] font-semibold">Projects</h2>
          <p className="mt-2 text-[15px] text-text-secondary">
            Review the catalog and publish projects to Explore.
          </p>
        </Link>
        <Link
          href="/admin/leads"
          className="rounded-2xl bg-surface-2 p-6 shadow-1 hover:bg-surface-3 transition-colors"
        >
          <h2 className="text-[17px] font-semibold">Leads</h2>
          <p className="mt-2 text-[15px] text-text-secondary">
            All buyer enquiries with status tracking.
          </p>
        </Link>
      </div>
    </div>
  )
}
