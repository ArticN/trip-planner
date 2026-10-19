// marca do app: uma rota com dois pontos (origem e destino)
export default function Mark({ size = 22 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 18c0-6 12-2 12-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6" cy="18" r="2.6" fill="currentColor" />
      <circle cx="18" cy="6" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
