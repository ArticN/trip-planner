// estrela em SVG (cor herdada do texto)
export function Star({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: '-2px' }}>
      <path fill="currentColor" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

// nota de 0 a 5 em estrelas
export function Stars({ value }) {
  return (
    <span className="stars" role="img" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= value ? 'on' : ''}><Star /></span>)}
    </span>
  );
}
