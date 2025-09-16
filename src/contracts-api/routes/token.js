import { Router } from 'express';
import { aliases, ids, invokeRead, invokeTx } from '../utils/stellar.js';
import { ensureAddr } from '../utils/format.js';

const r = Router();

/** GET /v1/token/balance/:addr -> balanceOf */
r.get('/balance/:addr', async (req, res, next) => {
  try {
    const addr = ensureAddr(req.params.addr);
    const out = await invokeRead(
      aliases.admin, ids.token, 'balance',
      ['--id', addr]   // para SAC padrão: "--id" é o parâmetro da função "balance"
    );
    res.json({ ok: true, address: addr, balance: JSON.parse(out) });
  } catch (e) { next(e); }
});

/** POST /v1/token/transfer -> transfer(from -> to, amount) */
r.post('/transfer', async (req, res, next) => {
  try {
    const { fromSourceAlias = aliases.advertiser, from = fromSourceAlias, to, amount } = req.body || {};
    const meta = await invokeTx(
      fromSourceAlias, ids.token, 'transfer',
      ['--from', from, '--to_muxed', to, '--amount', String(amount), '--send', 'yes']
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

export default r;
