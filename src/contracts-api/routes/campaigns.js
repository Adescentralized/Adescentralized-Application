import { Router } from 'express';
import { aliases, ids, invokeRead, invokeTx } from '../utils/stellar.js';
import { safeJSON, toBytes32Hex } from '../utils/format.js';

const r = Router();

/** POST /v1/campaigns -> create_campaign (advertiser assina) */
r.post('/', async (req, res, next) => {
  try {
    const {
      advertiserSourceAlias = aliases.advertiser,
      advertiser = advertiserSourceAlias,
      campaign_id,               // pode vir string "livre" (hash) ou hex64
      initial_deposit = 0
    } = req.body || {};

    const campaignHex = toBytes32Hex(campaign_id || `campaign_${Date.now()}`);

    const meta = await invokeTx(
      advertiserSourceAlias, ids.advault, 'create_campaign',
      ['--campaign_id', campaignHex, '--advertiser', advertiser, '--initial_deposit', String(initial_deposit), '--send', 'yes']
    );

    res.json({ ok: true, campaign_id: campaignHex, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

/** POST /v1/campaigns/:id/deposit -> deposit (from assina) */
r.post('/:id/deposit', async (req, res, next) => {
  try {
    const {
      fromSourceAlias = aliases.advertiser,
      from = fromSourceAlias,
      amount
    } = req.body || {};
    const campaignHex = toBytes32Hex(req.params.id);

    const meta = await invokeTx(
      fromSourceAlias, ids.advault, 'deposit',
      ['--campaign_id', campaignHex, '--from', from, '--amount', String(amount), '--send', 'yes']
    );

    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

/** GET /v1/campaigns/:id -> get_campaign */
r.get('/:id', async (req, res, next) => {
  try {
    const campaignHex = toBytes32Hex(req.params.id);
    const out = await invokeRead(
      aliases.admin, ids.advault, 'get_campaign',
      ['--campaign_id', campaignHex]
    );
    res.json({ ok: true, campaign_id: campaignHex, result: safeJSON(out) ?? out });
  } catch (e) { next(e); }
});

/** POST /v1/campaigns/:id/close -> close_campaign (admin) */
r.post('/:id/close', async (req, res, next) => {
  try {
    const { reason = 'test_completed' } = req.body || {};
    const campaignHex = toBytes32Hex(req.params.id);
    const meta = await invokeTx(
      aliases.admin, ids.advault, 'close_campaign',
      ['--campaign_id', campaignHex, '--reason', String(reason)]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

/** POST /v1/campaigns/:id/refund -> refund_unspent (admin) */
r.post('/:id/refund', async (req, res, next) => {
  try {
    const { to = aliases.advertiser } = req.body || {};
    const campaignHex = toBytes32Hex(req.params.id);
    const meta = await invokeTx(
      aliases.admin, ids.advault, 'refund_unspent',
      ['--campaign_id', campaignHex, '--to', to]
    );
    res.json({ ok: true, tx: meta.txHash || (meta.stdout || null), stderr: meta.stderr || null });
  } catch (e) { next(e); }
});

export default r;
