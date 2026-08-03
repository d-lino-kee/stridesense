/**
 * A characterful avatar: a slowly-rotating brand gradient ring around a
 * squircle photo/initial, with an optional live activity dot.
 */
export default function Avatar({
  src,
  initial,
  size = 40,
  status = false,
  spin = true,
}: {
  src?: string | null
  initial: string
  size?: number
  status?: boolean
  spin?: boolean
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* rotating gradient ring */}
      <span
        className={`absolute inset-0 rounded-[32%] bg-[conic-gradient(from_0deg,#f96316,#fb843c,#f59e0b,#ea4b0c,#f96316)] ${
          spin ? 'animate-spin' : ''
        }`}
        style={spin ? { animationDuration: '7s' } : undefined}
      />
      {/* white gap */}
      <span className="absolute inset-[2px] rounded-[30%] bg-white" />
      {/* photo or initial */}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-[3px] rounded-[28%] object-cover"
          style={{ width: size - 6, height: size - 6 }}
        />
      ) : (
        <span
          className="absolute inset-[3px] flex items-center justify-center rounded-[28%] bg-brand-gradient font-black text-white"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </span>
      )}
      {/* live dot */}
      {status && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </span>
      )}
    </span>
  )
}
