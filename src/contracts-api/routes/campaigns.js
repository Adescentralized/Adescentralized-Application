import { Router } from 'express';
import { aliases, ids, invokeRead, invokeTx, resolveAliasToAddr } from '../utils/stellar.js';
import { safeJSON, toBytes32Hex } from '../utils/format.js';

const r = Router();

/**
 * POST /v1/campaigns
 * - Cria campanha SEM depósito (mais robusto)
 * - Se initial_deposit > 0, tenta depositar na sequência
 * - Se o depósito falhar, retorna 207-like (ok parcial) com detalhes
 */
r.post('/', async (req, res, next) => {
  try {
    const {
      advertiserSourceAlias = aliases.admin,  // quem assina a tx
      advertiser = 'admin',                   // alias aceito; resolvemos p/ G...
      campaign_id,
      initial_deposit = 0
    } = req.body || {};

    // 1) normaliza campaign_id
    const campaignHex = toBytes32Hex(campaign_id || `campaign_${Date.now()}`);

    // 2) resolve advertiser -> G...
    const advertiserAddr = await resolveAliasToAddr(advertiser);

    // 3) cria campanha SEM depósito (0)
    const createMeta = await invokeTx(
      advertiserSourceAlias,
      ids.advault,
      'create_campaign',
      [
        '--campaign_id', campaignHex,
        '--advertiser', advertiserAddr,       // passamos Address direto
        '--initial_deposit', '0'
      ]
    );

    // 4) se não há depósito, retornamos sucesso aqui
    if (!initial_deposit || Number(initial_deposit) === 0) {
      return res.json({
        ok: true,
        campaign_id: campaignHex,
        created_tx: createMeta.txHash,
        note: 'campaign created without initial deposit'
      });
    }

    // 5) tentar depositar na sequência
    try {
      const depositMeta = await invokeTx(
        advertiserSourceAlias,
        ids.advault,
        'deposit',
        [
          '--campaign_id', campaignHex,
          '--from', advertiserAddr,             // Address (G...)
          '--amount', String(initial_deposit)
        ]
      );

      return res.json({
        ok: true,
        campaign_id: campaignHex,
        created_tx: createMeta.txHash,
        deposit_tx: depositMeta.txHash
      });
    } catch (depErr) {
      // 6) depósito falhou, mas campanha já foi criada — devolvemos erro detalhado
      return res.status(409).json({
        ok: false,
        partial: true,
        campaign_id: campaignHex,
        created_tx: createMeta.txHash,
        error: depErr.message || String(depErr),
        hint: [
          'O depósito falhou (token.transfer). Verifique:',
          '1) Se o TOKEN_CONTRACT no .env é mesmo o SAC do USDC que você quer.',
          '2) Se a conta do advertiser tem saldo suficiente nesse token.',
          '3) Se a chamada direta ao token funciona (veja teste abaixo).'
        ]
      });
    }
  } catch (e) { next(e); }
});

/** GET /v1/campaigns/:id -> get_campaign */
r.get('/:id', async (req, res, next) => {
  try {
    const campaignHex = toBytes32Hex(req.params.id);
    const out = await invokeRead(
      aliases.admin,
      ids.advault,
      'get_campaign',
      ['--campaign_id', campaignHex]
    );
    res.json({ ok: true, campaign_id: campaignHex, result: safeJSON(out) ?? out });
  } catch (e) { next(e); }
});

/** POST /v1/campaigns/:id/deposit -> deposit */
r.post('/:id/deposit', async (req, res, next) => {
  try {
    const { fromSourceAlias = aliases.admin, from = 'admin', amount } = req.body || {};
    if (!amount || Number.isNaN(Number(amount))) {
      const err = new Error('amount inválido');
      err.status = 400;
      throw err;
    }
    const campaignHex = toBytes32Hex(req.params.id);
    const fromAddr = await resolveAliasToAddr(from);

    const meta = await invokeTx(
      fromSourceAlias,
      ids.advault,
      'deposit',
      ['--campaign_id', campaignHex, '--from', fromAddr, '--amount', String(amount)]
    );

    res.json({ ok: true, tx: meta.txHash, stdout: meta.stdout, stderr: meta.stderr });
  } catch (e) { next(e); }
});

/** POST /v1/campaigns/:id/close -> close_campaign (admin) */
r.post('/:id/close', async (req, res, next) => {
  try {
    const { reason = 'test_completed' } = req.body || {};
    const campaignHex = toBytes32Hex(req.params.id);
    const meta = await invokeTx(
      aliases.admin,
      ids.advault,
      'close_campaign',
      ['--campaign_id', campaignHex, '--reason', String(reason)]
    );
    res.json({ ok: true, tx: meta.txHash, stdout: meta.stdout, stderr: meta.stderr });
  } catch (e) { next(e); }
});

/** POST /v1/campaigns/:id/refund -> refund_unspent (admin) */
r.post('/:id/refund', async (req, res, next) => {
  try {
    const { to = 'admin' } = req.body || {};
    const toAddr = await resolveAliasToAddr(to);
    const campaignHex = toBytes32Hex(req.params.id);
    const meta = await invokeTx(
      aliases.admin,
      ids.advault,
      'refund_unspent',
      ['--campaign_id', campaignHex, '--to', toAddr]
    );
    res.json({ ok: true, tx: meta.txHash, stdout: meta.stdout, stderr: meta.stderr });
  } catch (e) { next(e); }
});

export default r;
