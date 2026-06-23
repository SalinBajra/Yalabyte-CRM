export default function BrandLogo() {
  return (
    <span className="inline-grid h-12 w-14 place-items-center" aria-label="YalaByte">
      <img
        src="/images/yalabyte-yb-logo.png"
        alt=""
        className="h-full w-full object-contain [filter:drop-shadow(0_0_2px_rgba(107,234,255,0.65))_drop-shadow(0_0_10px_rgba(19,200,222,0.22))]"
        aria-hidden="true"
      />
    </span>
  );
}
