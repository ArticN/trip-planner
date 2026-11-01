import Mark from './Mark.jsx';

// tela de configuração: aparece no lugar do app quando a instalação ainda não está pronta
// (banco não ligado ou recusando o token), explicando em português o que fazer na Vercel e no Turso
const GUIDE = 'https://github.com/ArticN/trip-planner/blob/main/docs/GUIA.md';
const TURSO = 'https://app.turso.tech';
const VERCEL = 'https://vercel.com/dashboard';

const Ext = ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>;

const REDEPLOY = (
  <li>
    Volte para a página do projeto na <Ext href={VERCEL}>Vercel</Ext>, abra <b>Deployments</b>, clique nos <b>⋯</b> do
    primeiro da lista e escolha <b>Redeploy</b>. Variável nova ou alterada só vale depois disso.
  </li>
);

const TEXTS = {
  missing: {
    title: 'Falta ligar o banco de dados',
    lead: 'O site já está no ar, mas ainda não sabe onde guardar as suas viagens. São três passos:',
    steps: (
      <>
        <li>
          No <Ext href={TURSO}>Turso</Ext>, crie um banco (<b>Create Database</b>), copie a <b>URL</b> dele (começa com{' '}
          <code>libsql://</code>) e gere um <b>token</b> (<b>Create Token</b>, leitura e escrita, sem expirar).
        </li>
        <li>
          Na <Ext href={VERCEL}>Vercel</Ext>, abra o projeto, vá em <b>Settings → Environment Variables</b> e crie{' '}
          <code>TURSO_DATABASE_URL</code> com a URL e <code>TURSO_AUTH_TOKEN</code> com o token. Aproveite e crie{' '}
          <code>APP_PASSWORD</code> com a senha que você vai usar para entrar.
        </li>
        {REDEPLOY}
      </>
    ),
  },
  token: {
    title: 'O banco recusou o acesso',
    lead: 'O endereço do banco está certo, mas o token não foi aceito. Normalmente ele foi colado pela metade, com espaço sobrando ou expirou.',
    steps: (
      <>
        <li>No <Ext href={TURSO}>Turso</Ext>, abra o banco e gere um token novo (leitura e escrita, sem expirar).</li>
        <li>
          Na <Ext href={VERCEL}>Vercel</Ext>, em <b>Settings → Environment Variables</b>, edite <code>TURSO_AUTH_TOKEN</code> e
          cole o token novo inteiro.
        </li>
        {REDEPLOY}
      </>
    ),
  },
  error: {
    title: 'Não consegui falar com o banco',
    lead: 'As variáveis existem, mas o banco não respondeu. Confira:',
    steps: (
      <>
        <li>
          Na <Ext href={VERCEL}>Vercel</Ext>, em <b>Settings → Environment Variables</b>, a <code>TURSO_DATABASE_URL</code> deve
          começar com <code>libsql://</code> e terminar com <code>.turso.io</code>, sem espaços.
        </li>
        <li>No <Ext href={TURSO}>Turso</Ext>, confira se o banco ainda existe e não está pausado.</li>
        {REDEPLOY}
      </>
    ),
  },
};

export default function Setup({ info }) {
  const t = TEXTS[info.db] || TEXTS.error;
  return (
    <div className="setup">
      <div className="setup-card">
        <span className="logo"><Mark size={40} /></span>
        <h1>{t.title}</h1>
        <p>{t.lead}</p>
        <ol>{t.steps}</ol>
        {info.detail && info.db !== 'missing' && <p className="setup-detail">Mensagem técnica: <code>{info.detail}</code></p>}
        <div className="setup-actions">
          <button className="primary" onClick={() => window.location.reload()}>Já fiz, verificar de novo</button>
          <Ext href={GUIDE}>Guia completo, passo a passo</Ext>
        </div>
        <p className="setup-help">
          Travou? Copie esta tela (ou tire um print) e mande para o <Ext href="https://claude.ai">Claude</Ext> com a pergunta
          “estou instalando o Trip Planner na Vercel e apareceu isto, o que eu faço?”.
        </p>
      </div>
    </div>
  );
}

// aviso na tela inicial quando o app publicado não tem senha
export function NoPasswordBar() {
  return (
    <div className="setup-bar" role="alert">
      <b>Seu planner está sem senha:</b> qualquer pessoa com o link pode ver e editar. Na <Ext href={VERCEL}>Vercel</Ext>, crie a
      variável <code>APP_PASSWORD</code> em Settings → Environment Variables e faça Redeploy.
    </div>
  );
}
