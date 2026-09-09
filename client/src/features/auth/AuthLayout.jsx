function BuildingMark({ dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.png" alt="College Room Management System logo" className="h-16 w-16 object-contain" />
      <div>
        <p className={`text-base font-bold leading-tight tracking-tight ${dark ? 'text-[#12354a]' : 'text-white'}`}>College Room</p>
        <p className={`text-base font-bold leading-tight tracking-tight ${dark ? 'text-[#12354a]' : 'text-white'}`}>Management System</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#55d6c1]">Campus living</p>
      </div>
    </div>
  )
}

function FormBrand() {
  return (
    <div className="mb-7 flex items-center gap-3 lg:hidden">
      <img src="/logo.png" alt="College Room Management System logo" className="h-14 w-14 object-contain" />
      <div>
        <p className="text-sm font-bold leading-tight text-[#12354a]">College Room</p>
        <p className="text-sm font-bold leading-tight text-[#12354a]">Management System</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#0d8c7a]">Staff portal</p>
      </div>
    </div>
  )
}

function BuildingIllustration() {
  return (
    <div className="relative mx-auto mt-10 h-64 max-w-sm sm:h-72">
      <div className="absolute left-1/2 top-6 h-48 w-48 -translate-x-1/2 rotate-45 rounded-[2.5rem] border border-white/10 bg-white/5" />
      <div className="absolute bottom-3 left-1/2 h-36 w-60 -translate-x-1/2 rounded-t-[5rem] border-x-8 border-t-8 border-[#55d6c1] bg-[#135d69] shadow-2xl shadow-black/20">
        <div className="grid grid-cols-3 gap-3 p-7">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className={`h-5 rounded-sm ${index % 4 === 0 ? 'bg-[#f5c96b]' : 'bg-[#b6ece4]/70'}`} />
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 h-16 w-24 -translate-x-1/2 rounded-t-full bg-[#f5f7fb]/90" />
      <span className="absolute left-8 top-20 h-3 w-3 rounded-full bg-[#f5c96b] shadow-[0_0_0_8px_rgba(245,201,107,0.12)]" />
      <span className="absolute right-10 top-10 h-2.5 w-2.5 rounded-full bg-[#55d6c1] shadow-[0_0_0_7px_rgba(85,214,193,0.12)]" />
    </div>
  )
}

export default function AuthLayout({ children, eyebrow, title, description, variant = 'login' }) {
  return (
    <div className="grid h-full w-full overflow-hidden bg-white lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#12354a] p-8 text-white sm:flex sm:p-10 lg:p-12">
        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full border-[32px] border-white/5" />
        <div className="relative z-10"><BuildingMark /></div>
        <div className="relative z-10 mt-12 lg:mt-0">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#55d6c1]">{eyebrow}</p>
          <h1 className="max-w-md text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">{description}</p>
          <BuildingIllustration />
        </div>
        <p className="relative z-10 mt-8 text-xs text-slate-400">A calmer way to manage campus living.</p>
      </section>
      <section className="flex min-h-0 items-center justify-center overflow-hidden bg-white p-4 sm:p-8 lg:p-12">
        <div className={`w-full max-w-md auth-card-enter-${variant === 'register' ? 'right' : 'left'}`}><FormBrand />{children}</div>
      </section>
    </div>
  )
}