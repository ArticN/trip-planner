import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import MapView from './MapView.jsx';
import Mark from './Mark.jsx';
import { setTripAccent } from './theme.js';
import { useSheet, useIsMobile, SheetHandle, heightOf } from './Sheet.jsx';
import PinPanel from './PinPanel.jsx';
import Metro from './Metro.jsx';
import { KINDS, rangeDays, dayNum, dayWeek, fmtDay, fmtDayLong, makeFx } from './util.js';

const noop = () => {};

// roteiro aberto por link de compartilhamento: só leitura, sem login
export default function ShareView({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState('trip');
  const [selectedId, setSelectedId] = useState(null);
  const sheet = useSheet('half');
  const isMobile = useIsMobile();

  useEffect(() => {
    api.shared(token).then(setData).catch((e) => setError(/404/.test(e.message) ? 'Este link não existe ou foi desativado.' : 'Não consegui abrir o roteiro agora.'));
  }, [token]);

  const trip = data?.trip;
  const fx = useMemo(() => (trip ? makeFx(trip) : null), [trip]);
  // a viagem pode ter uma cor própria (Aparência), que vale enquanto ela está aberta
  useEffect(() => { setTripAccent(trip?.accent); return () => setTripAccent(null); }, [trip?.accent]);
  const cityMap = useMemo(() => Object.fromEntries((data?.cities || []).map((c) => [c.key, c])), [data]);
  const days = useMemo(() => (trip ? rangeDays(trip.start, trip.end) : []), [trip]);
  const byDay = useMemo(() => {
    const m = {};
    (data?.activities || []).forEach((a) => { (m[a.day] ||= []).push(a); });
    Object.values(m).forEach((l) => l.sort((x, y) => x.sort - y.sort || x.id - y.id));
    return m;
  }, [data]);
  const mainCity = (d) => {
    const counts = {};
    (byDay[d] || []).forEach((a) => { if (a.city && a.city !== 'transito') counts[a.city] = (counts[a.city] || 0) + 1; });
    return cityMap[Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0]];
  };
  const theme = (d) => (data?.days || []).find((x) => x.day === d)?.title;

  useEffect(() => { document.title = trip ? `${trip.name} · roteiro` : 'Trip Planner'; }, [trip]);

  if (error) return <div className="splash"><h1><Mark size={44} /></h1><p>{error}</p></div>;
  if (!data) return <div className="splash"><h1><Mark size={44} /></h1><p>Carregando roteiro…</p></div>;

  const items = (sel === 'trip' ? data.activities : (byDay[sel] || []).map((a, i) => ({ ...a, n: i + 1 })));
  const stayFor = (day) => data.stays.find((s) => s.check_in <= day && day < s.check_out) || null;
  const pinned = items.find((a) => a.id === selectedId && a.lat != null) || null;
  const go = (d) => { setSel(d); setSelectedId(null); };
  const pick = (a) => { setSelectedId(a.id); if (a.lat != null && isMobile) sheet.setDetent('peek'); };

  return (
    <div className="app share">
      <header className="top">
        <div className="brand" onClick={() => go('trip')} role="button" tabIndex={0}>
          <span className="logo"><Mark /></span>
          <div>
            <div className="brand-name">{trip.name}</div>
            <div className="brand-sub">{fmtDay(trip.start)} a {fmtDay(trip.end)}</div>
          </div>
        </div>
        <span className="spacer" />
        <span className="share-badge hide-sm">Somente leitura</span>
      </header>

      <div className="main" data-detent={sheet.detent}>
        <aside className="side" ref={sheet.ref}>
          <SheetHandle detent={sheet.detent} handleProps={sheet.handleProps} onKey={() => sheet.setDetent((d) => (d === 'full' ? 'half' : 'full'))} />
          <nav className="strip" aria-label="Dias da viagem">
            <button className={`dchip trip${sel === 'trip' ? ' on' : ''}`} onClick={() => go('trip')}><b>Geral</b></button>
            {days.map((d) => (
              <button key={d} className={`dchip${sel === d ? ' on' : ''}`} onClick={() => go(d)} style={{ '--c': mainCity(d)?.color || '#94a3b8' }} title={fmtDayLong(d)}>
                <small>{dayWeek(d)}</small>
                <b>{dayNum(d)}</b>
                <i className="cdot" />
              </button>
            ))}
          </nav>
          <div className="side-body share-body">
            {sel === 'trip' ? (
              <>
                {trip.cover && <div className="share-cover" style={{ backgroundImage: `url("${trip.cover.replace(/"/g, '%22')}")` }} />}
                {trip.subtitle && <p className="muted">{trip.subtitle}</p>}
                <div className="metro-side">
                  <Metro
                    stays={data.stays}
                    cityMap={cityMap}
                    cities={data.cities}
                    daysInfo={days.map((d) => ({ day: d, cities: [...new Set((byDay[d] || []).map((a) => a.city).filter(Boolean))] }))}
                  />
                </div>
                <div className="agenda">
                  {days.map((d) => {
                    const c = mainCity(d);
                    const n = (byDay[d] || []).length;
                    return (
                      <button key={d} className="ag-head share-day" style={{ '--c': c?.color || 'var(--ctl)' }} onClick={() => go(d)}>
                        <b>{fmtDayLong(d)}</b>
                        <span>{[c?.name, theme(d), n ? `${n} atividade${n > 1 ? 's' : ''}` : 'livre'].filter(Boolean).join(' · ')}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <h2 className="share-h">{fmtDayLong(sel)}</h2>
                {theme(sel) && <p className="muted">{theme(sel)}</p>}
                {stayFor(sel) && <p className="muted small">Hospedagem · {stayFor(sel).name}</p>}
                <div className="ag-day">
                  {items.length === 0 && <div className="muted small">Nada planejado.</div>}
                  {items.map((a) => (
                    <button key={a.id} className={`ag-item${a.id === selectedId ? ' sel' : ''}`} onClick={() => pick(a)}>
                      <span className="ag-time">{a.start || '—'}{a.end ? <small>{a.end}</small> : null}</span>
                      <span className="ag-dot" style={{ '--k': (KINDS[a.kind] || KINDS.sight).color }} />
                      <span className="ag-title">{a.title}{a.location ? <small>{a.location}</small> : null}{a.details ? <small className="wrap">{a.details}</small> : null}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        <section className="mapwrap">
          <MapView
            mode={sel === 'trip' ? 'trip' : 'day'}
            items={items}
            stays={data.stays}
            cities={data.cities}
            stayByDay={sel === 'trip' ? null : stayFor(sel)}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); if (isMobile && id) sheet.setDetent('peek'); }}
            padBottom={isMobile && sheet.detent !== 'full' ? heightOf(sheet.detent, window.innerHeight - 56) : 0}
            onEdit={noop}
            editPositions={false}
            onMove={noop}
            picking={false}
            onPick={noop}
            fitKey={sel}
            showStays={sel !== 'trip'}
            labelNumbers
            onBackground={() => setSelectedId(null)}
          />
          {pinned && <PinPanel a={pinned} n={pinned.n} cityMap={cityMap} fx={fx} tripTz={trip.tz} onClose={() => setSelectedId(null)} />}
        </section>
      </div>
    </div>
  );
}
