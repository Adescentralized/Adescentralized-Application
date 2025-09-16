import { Router } from 'express';
import { guardAdmin, aliases, ids, invokeRead, invokeTx } from '../utils/stellar.js';
import { ensureAddr } from '../utils/format.js';
const r = Router();

/** POST /v1/registry/init (admin) */
r.post('/init', async (req, res, next) => {
  try {
    guardAdmin(req);
    const { owner = aliases.admin } = req.body || {};
    const meta = await invokeTx(
      aliases.admin, ids.registry, 'init',
      ['--owner', owner]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

/** POST /v1/registry/pause (admin) */
r.post('/pause', async (req, res, next) => {
  try {
    guardAdmin(req);
  const meta = await invokeTx(aliases.admin, ids.registry, 'pause');
  res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

/** POST /v1/registry/unpause (admin) */
r.post('/unpause', async (req, res, next) => {
  try {
    guardAdmin(req);
  const meta = await invokeTx(aliases.admin, ids.registry, 'unpause');
  res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

/** GET /v1/registry/paused */
r.get('/paused', async (req, res, next) => {
  try {
    const out = await invokeRead(aliases.admin, ids.registry, 'is_paused');
    res.json({ ok: true, result: JSON.parse(out) });
  } catch (e) { next(e); }
});

/** GET /v1/registry/owner */
r.get('/owner', async (req, res, next) => {
  try {
    const out = await invokeRead(aliases.admin, ids.registry, 'owner');
    res.json({ ok: true, result: JSON.parse(out) });
  } catch (e) { next(e); }
});

/** POST /v1/registry/verifiers (admin) -> add_verifier */
r.post('/verifiers', async (req, res, next) => {
  try {
    guardAdmin(req);
    const { addr } = req.body || {};
    const meta = await invokeTx(
      aliases.admin, ids.registry, 'add_verifier',
      ['--v', addr || aliases.verifier]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

/** DELETE /v1/registry/verifiers/:addr (admin) -> remove_verifier */
r.delete('/verifiers/:addr', async (req, res, next) => {
  try {
    guardAdmin(req);
    const addr = req.params.addr;
    const meta = await invokeTx(
      aliases.admin, ids.registry, 'remove_verifier',
      ['--v', addr]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

/** GET /v1/registry/verifiers/:addr -> is_verifier */
r.get('/verifiers/:addr', async (req, res, next) => {
  try {
    const addr = req.params.addr;
    const out = await invokeRead(
      aliases.admin, ids.registry, 'is_verifier',
      ['--v', addr]
    );
    res.json({ ok: true, result: JSON.parse(out) });
  } catch (e) { next(e); }
});

/** POST /v1/registry/publishers (admin) -> set_publisher_status */
r.post('/publishers', async (req, res, next) => {
  try {
    guardAdmin(req);
    const { addr, allowed } = req.body || {};
    ensureAddr(addr);
    const meta = await invokeTx(
      aliases.admin, ids.registry, 'set_publisher_status',
      ['--p', addr, '--allowed', String(!!allowed)]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

r.get('/publishers/:addr', async (req, res, next) => {
  try {
    const addr = ensureAddr(req.params.addr);
    const out = await invokeRead(
      aliases.admin, ids.registry, 'is_publisher_allowed',
      ['--p', addr]
    );
    res.json({ ok: true, result: JSON.parse(out) });
  } catch (e) { next(e); }
});

export default r;
