import { Router } from 'express';
// O import de 'runStellarMeta' não é mais necessário aqui, pois 'invokeTx' já o utiliza
import { guardAdmin, aliases, ids, invokeRead, invokeTx } from '../utils/stellar.js';
import { safeJSON } from '../utils/format.js';

const r = Router();

/** GET /v1/advault/config -> get_config */
r.get('/config', async (req, res, next) => {
  try {
    const out = await invokeRead(aliases.admin, ids.advault, 'get_config');
    res.json({ ok: true, result: safeJSON(out) ?? out });
  } catch (e) { next(e); }
});

/** GET /v1/advault/paused -> is_protocol_paused */
r.get('/paused', async (req, res, next) => {
  try {
    const out = await invokeRead(aliases.admin, ids.advault, 'is_protocol_paused');
    res.json({ ok: true, result: safeJSON(out) ?? out });
  } catch (e) { next(e); }
});


// --- ROTA /init CORRIGIDA PARA USAR invokeTx ---
/** POST /v1/advault/init (admin) */
r.post('/init', async (req, res, next) => {
  try {
    guardAdmin(req);
    const {
      admin = aliases.admin,
      token = ids.token,
      verifier_registry = ids.registry,
      price_per_event,
      split_publisher_bps,
      split_viewer_bps,
      fee_bps
    } = req.body || {};

    // Monta apenas os argumentos da função do contrato
    const contractArgs = [
      '--admin', admin,
      '--token', token,
      '--verifier_registry', verifier_registry,
      '--price_per_event', String(price_per_event),
      '--split_publisher_bps', String(split_publisher_bps),
      '--split_viewer_bps', String(split_viewer_bps),
      '--fee_bps', String(fee_bps)
    ];

    // Usa a função invokeTx, que já monta o comando 'stellar contract invoke' corretamente
    const meta = await invokeTx(
      aliases.admin,       // source
      ids.advault,         // contractId
      'init',              // function name
      contractArgs         // function arguments
    );

    // Retorna o hash da transação
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null) });
  } catch (e) {
    console.error('[POST /v1/advault/init] Erro:', e.message);
    next(e);
  }
});


/** POST /v1/advault/pause (admin) */
r.post('/pause', async (req, res, next) => {
  try {
    guardAdmin(req);
    const meta = await invokeTx(aliases.admin, ids.advault, 'pause_protocol');
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null) });
  } catch (e) { next(e); }
});

/** POST /v1/advault/unpause (admin) */
r.post('/unpause', async (req, res, next) => {
  try {
    guardAdmin(req);
    const meta = await invokeTx(aliases.admin, ids.advault, 'unpause_protocol');
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null) });
  } catch (e) { next(e); }
});

/** POST /v1/advault/price (admin) -> set_price_per_event */
r.post('/price', async (req, res, next) => {
  try {
    guardAdmin(req);
    const { new_price } = req.body || {};
    const meta = await invokeTx(
      aliases.admin, ids.advault, 'set_price_per_event',
      ['--new_price', String(new_price)]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null) });
  } catch (e) { next(e); }
});

/** POST /v1/advault/splits (admin) -> set_splits */
r.post('/splits', async (req, res, next) => {
  try {
    guardAdmin(req);
    const { pub_bps, view_bps } = req.body || {};
    const meta = await invokeTx(
      aliases.admin, ids.advault, 'set_splits',
      ['--pub_bps', String(pub_bps), '--view_bps', String(view_bps)]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null) });
  } catch (e) { next(e); }
});

/** POST /v1/advault/fee (admin) -> set_fee_bps */
r.post('/fee', async (req, res, next) => {
  try {
    guardAdmin(req);
    const { new_fee } = req.body || {};
    const meta = await invokeTx(
      aliases.admin, ids.advault, 'set_fee_bps',
      ['--new_fee', String(new_fee)]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null) });
  } catch (e) { next(e); }
});

export default r;