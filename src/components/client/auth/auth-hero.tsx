import Image from "next/image";

export function AuthHero() {
  return (
    <header className="relative flex h-[320px] w-full flex-col items-center bg-[linear-gradient(150deg,#c81324_52%,#760910_100%)] px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-16 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_48%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[34%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 top-12 h-28 w-28 rounded-full bg-white/8 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 top-16 h-36 w-36 rounded-full bg-black/10 blur-3xl" />

      <div className="relative z-10 mt-7 flex flex-col items-center">
        <div className="relative mb-5 flex items-center justify-center">
          {/* <div className="absolute inset-0 rounded-full bg-white/14 blur-2xl" />
          <div className="absolute inset-4 rounded-full border border-white/20" /> */}
          <Image
            src="/gym-final-logo.png"
            alt="Community Fitness Logo"
            width={132}
            height={132}
            priority
            className="relative h-auto w-[132px] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
          />
        </div>

        <p className="text-[1.9rem] font-bold leading-[1.08] tracking-tight text-white">
          The Community Fitness
        </p>
        <p className="mt-2 text-[0.74rem] font-semibold tracking-[0.24em] text-white/85">
          By Strategy First
        </p>
      </div>
    </header>
  );
}
