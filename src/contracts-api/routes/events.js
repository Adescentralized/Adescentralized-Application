import { Router } from 'express';
import { aliases, ids, invokeRead, invokeTx } from '../utils/stellar.js';
import { ensureAddr, sym, toBytes32Hex } from '../utils/format.js';

const r = Router();

/** POST /v1/events/submit -> submit_event (verifier assina) */
r.post('/submit', async (req, res, next) => {
  try {
    const { verifierSourceAlias = aliases.verifier, att } = req.body || {};
    if (!att) throw new Error('att obrigatório');

    const payload = {
      event_id: '0x' + toBytes32Hex(att.event_id),
      campaign_id: '0x' + toBytes32Hex(att.campaign_id),
      publisher: ensureAddr(att.publisher),
      viewer: ensureAddr(att.viewer),
      event_kind: sym(att.event_kind || 'click'),
      timestamp: Number(att.timestamp ?? Math.floor(Date.now()/1000)),
      nonce: '0x' + toBytes32Hex(att.nonce || `nonce_${Date.now()}`)
    };

    const meta = await invokeTx(
      verifierSourceAlias, ids.advault, 'submit_event',
      ['--att', JSON.stringify(payload), '--verifier', verifierSourceAlias]
    );

    res.json({ ok: true, attestation: payload, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

export default r;
