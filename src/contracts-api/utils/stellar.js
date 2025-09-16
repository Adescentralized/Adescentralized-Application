import { execFile } from 'node:child_process';

const {
  NETWORK,
  ADVAULT_CONTRACT,
  TOKEN_CONTRACT,
  VERIFIER_REGISTRY_CONTRACT,
  ADMIN_ALIAS = 'admin',
  ADVERTISER_ALIAS = 'advertiser',
  PUBLISHER_ALIAS = 'publisher',
  VIEWER_ALIAS = 'viewer',
  VERIFIER_ALIAS = 'verifier',
  API_KEY
} = process.env;

export function guardAdmin(req) {
  const key = req.headers['x-api-key'];
  if (!API_KEY || key !== API_KEY) {
    const err = new Error('unauthorized');
    err.status = 401;
    throw err;
  }
}

export const aliases = {
  admin: ADMIN_ALIAS,
  advertiser: ADVERTISER_ALIAS,
  publisher: PUBLISHER_ALIAS,
  viewer: VIEWER_ALIAS,
  verifier: VERIFIER_ALIAS
};

export const ids = {
  advault: ADVAULT_CONTRACT,
  token: TOKEN_CONTRACT,
  registry: VERIFIER_REGISTRY_CONTRACT
};

/** extrai o hash da tx de mensagens comuns do CLI */
function parseTxHash(text = '') {
  const patterns = [
    /Signing transaction:\s*([0-9a-fA-F]{64})/i,
    /Submitting transaction:\s*([0-9a-fA-F]{64})/i,
    /Submitted tx hash:\s*([0-9a-fA-F]{64})/i,
    /Transaction Hash:\s*([0-9a-fA-F]{64})/i
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].toLowerCase();
  }
  return null;
}

/** versão clássica: retorna só stdout (mantém compatibilidade onde já usamos) */
export function runStellar(description, args) {
  return new Promise((resolve, reject) => {
    execFile('stellar', args, { timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) {
        const msg = `[stellar:${description}] ${stderr || err.message}`;
        const e = new Error(msg);
        e.status = 400;
        return reject(e);
      }
      resolve((stdout || '').trim());
    });
  });
}

/** nova versão: retorna também stderr e o hash da tx quando existir */
export function runStellarMeta(description, args) {
  return new Promise((resolve, reject) => {
    execFile('stellar', args, { timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) {
        const msg = `[stellar:${description}] ${stderr || err.message}`;
        const e = new Error(msg);
        e.status = 400;
        return reject(e);
      }
      const out = (stdout || '').trim();
      const errOut = (stderr || '').trim();
      const txHash = parseTxHash(`${out}\n${errOut}`);
      let resultJson = null;
      try { resultJson = out ? JSON.parse(out) : null; } catch {}
      resolve({ stdout: out, stderr: errOut, txHash, resultJson });
    });
  });
}

/** Resolve an alias (like 'advertiser') to a public address (G...).
 * If the input already looks like a public address it is returned as-is.
 * Otherwise it runs `stellar keys public-key <alias>` to obtain the address.
 */
export function resolveAliasToAddr(aliasOrAddr) {
  if (!aliasOrAddr) return Promise.reject(new Error('empty address'));
  if (/^G[A-Z0-9]{10,}$/.test(aliasOrAddr)) return Promise.resolve(aliasOrAddr);
  return new Promise((resolve, reject) => {
    execFile('stellar', ['keys', 'public-key', aliasOrAddr], { timeout: 10_000 }, (err, stdout, stderr) => {
      if (err) {
        const msg = `[stellar:keys public-key] ${stderr || err.message}`;
        const e = new Error(msg);
        e.status = 400;
        return reject(e);
      }
      resolve((stdout || '').trim());
    });
  });
}

export function invokeRead(sourceAlias, contractId, func, kvArgs = []) {
  return runStellar(
    func,
    ['contract','invoke','--network', NETWORK, '--source', sourceAlias,
     '--id', contractId, '--', func, ...kvArgs]
  );
}

/** útil quando queremos o hash da tx mesmo que a função não retorne valor */
export function invokeTx(sourceAlias, contractId, func, kvArgs = []) {
  return runStellarMeta(
    func,
    [
      'contract','invoke',
      '--network', NETWORK,
      '--source', sourceAlias,
      '--id', contractId,
      // '--send',  
      '--',
      func, ...kvArgs
    ]
  );
}
