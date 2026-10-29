'use client';
import { useEffect, useState } from 'react';
import { getApiRoutes } from '../../AppRoutes/apiRoutesHandler';
import { mosyGetData, mosyPostData } from '../../../MosyUtils/hiveUtils';
import { closeMosyCard } from '../../../components/MosyCard';

const apiRoutes = getApiRoutes();
const fmt = (n) => Number(n || 0).toLocaleString('en-KE');

// Allocates part of an account's balance to a wallet. The wallet gets a money-in record; the account is
// deliberately left untouched (this is a record, not a movement), so its net balance doesn't change.
// The amount is capped at the account's current balance.
export default function TransferToWalletCard({ account, onDone, modalId = 'modal3' }) {
  const [wallets, setWallets] = useState([]);
  const [balance, setBalance] = useState(Number(account?.net_balance) || 0);
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const w = await mosyGetData({ endpoint: apiRoutes.walletslist.base, params: { pageNo: 1, pageSize: 500 } });
      setWallets(Array.isArray(w?.data) ? w.data : []);
      // fresh balance, the row handed in may predate recent postings
      const a = await mosyGetData({ endpoint: apiRoutes.accountslist.base, params: { pageNo: 1, pageSize: 500 } });
      const mine = (Array.isArray(a?.data) ? a.data : []).find((r) => r.record_id === account?.record_id);
      if (mine) setBalance(Number(mine.net_balance) || 0);
    })().catch((e) => setError(e.message));
  }, [account?.record_id]);

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(String(amount).replace(/,/g, ''));
    if (!walletId) return setError('Select a wallet.');
    if (!amt || amt <= 0) return setError('Enter an amount greater than 0.');
    if (amt > balance) return setError(`Amount exceeds the available balance (KES ${fmt(balance)}).`);

    setSaving(true);
    setError('');
    try {
      const res = await mosyPostData({
        url: apiRoutes.walletsmoneyin.base,
        data: {
          date: new Date().toISOString().slice(0, 10),
          amount: amt,
          category: 'Transfer from account',
          ref_no: account?.account_name || account?.record_id || '',
          wallet_id: walletId,
        },
      });
      if (res?.status !== 'success') throw new Error(res?.message || 'Could not save the transfer.');
      closeMosyCard(modalId);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="p-3">
      <p className="mb-3">
        From <strong>{account?.account_name || account?.record_id}</strong> — available{' '}
        <strong>KES {fmt(balance)}</strong>
      </p>

      <div className="form-group mb-3">
        <label className="font-weight-bold fw-semibold small mb-1 d-block">Wallet</label>
        <select className="form-control form-select" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          <option value="">Select wallet</option>
          {wallets.map((w) => (
            <option key={w.record_id} value={w.record_id}>{w.wallet_name}</option>
          ))}
        </select>
      </div>

      <div className="form-group mb-3">
        <label className="font-weight-bold fw-semibold small mb-1 d-block">Amount</label>
        <input
          className="form-control"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
        />
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <button type="submit" className="btn btn-primary w-100" style={{ width: '100%' }} disabled={saving}>
        {saving ? 'Saving…' : 'Transfer to wallet'}
      </button>
    </form>
  );
}
