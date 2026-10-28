// Dimev3 — Device Financing Dashboard
//
// Uses only verified tables and columns from the supplied schema.
// Tenant filtering is handled by the dashboard backend using the login token.
//
// No assumed loan status values.
// No invented columns.
// No invented tables.

export default {
  brand: 'Dimev3',
  tz: 'Africa/Nairobi',
  cacheMs: 15000,
  refreshMs: 30000,

  layout: [
    // ==================================================
    // 1. DATE FILTER
    // ==================================================
    {
      kind: 'filters',
      id: 'financialFilters',
      date: true,
      fields: [],
    },
  
    // ==================================================
    // 2. SUMMARY CARDS
    // ==================================================
    {
      kind: 'stats',
      id: 'cashFlowSummary',
      items: [
        {
          id: 'totalAccounts',
          label: 'Total Accounts',
          query: {
            table: 'accounts_list',
            agg: 'count',
          },
        },
        {
          id: 'totalWallets',
          label: 'Total Wallets',
          query: {
            table: 'wallets_list',
            agg: 'count',
          },
        },
        {
          id: 'walletMoneyIn',
          label: 'Wallet Money In',
          prefix: 'KES ',
          query: {
            table: 'wallets_money_in',
            agg: 'sum',
            col: 'amount',
            dateCol: 'date',
          },
        },
        {
          id: 'walletMoneyOut',
          label: 'Wallet Money Out',
          prefix: 'KES ',
          query: {
            table: 'wallets_money_out',
            agg: 'sum',
            col: 'amount',
            dateCol: 'date',
          },
        },
        {
          id: 'walletNetMovement',
          label: 'Wallet Net Movement',
          prefix: 'KES ',
          query: {
            sql: `
              SELECT
                (
                  SELECT COALESCE(SUM(i.amount), 0)
                  FROM {db}.wallets_money_in i
                  WHERE (:site IS NULL OR i.hive_site_id = :site)
                    AND (:from IS NULL OR i.date >= :from)
                    AND (
                      :to IS NULL
                      OR i.date < DATE_ADD(:to, INTERVAL 1 DAY)
                    )
                )
                -
                (
                  SELECT COALESCE(SUM(o.amount), 0)
                  FROM {db}.wallets_money_out o
                  WHERE (:site IS NULL OR o.hive_site_id = :site)
                    AND (:from IS NULL OR o.date >= :from)
                    AND (
                      :to IS NULL
                      OR o.date < DATE_ADD(:to, INTERVAL 1 DAY)
                    )
                ) AS value
            `,
          },
        },
        {
          id: 'accountNetMovement',
          label: 'Account Net Movement',
          prefix: 'KES ',
          query: {
            sql: `
              SELECT
                (
                  SELECT COALESCE(SUM(i.amount), 0)
                  FROM {db}.accounts_money_in i
                  WHERE (:site IS NULL OR i.hive_site_id = :site)
                    AND (:from IS NULL OR i.date >= :from)
                    AND (
                      :to IS NULL
                      OR i.date < DATE_ADD(:to, INTERVAL 1 DAY)
                    )
                )
                -
                (
                  SELECT COALESCE(SUM(o.amount), 0)
                  FROM {db}.accounts_money_out o
                  WHERE (:site IS NULL OR o.hive_site_id = :site)
                    AND (:from IS NULL OR o.date >= :from)
                    AND (
                      :to IS NULL
                      OR o.date < DATE_ADD(:to, INTERVAL 1 DAY)
                    )
                ) AS value
            `,
          },
        },
        {
          id: 'unallocatedAmount',
          label: 'Unallocated Amount',
          prefix: 'KES ',
          query: {
            sql: `
              SELECT
                (
                  (
                    SELECT COALESCE(SUM(i.amount), 0)
                    FROM {db}.accounts_money_in i
                    WHERE (:site IS NULL OR i.hive_site_id = :site)
                      AND (:from IS NULL OR i.date >= :from)
                      AND (
                        :to IS NULL
                        OR i.date < DATE_ADD(:to, INTERVAL 1 DAY)
                      )
                  )
                  -
                  (
                    SELECT COALESCE(SUM(o.amount), 0)
                    FROM {db}.accounts_money_out o
                    WHERE (:site IS NULL OR o.hive_site_id = :site)
                      AND (:from IS NULL OR o.date >= :from)
                      AND (
                        :to IS NULL
                        OR o.date < DATE_ADD(:to, INTERVAL 1 DAY)
                      )
                  )
                )
                -
                (
                  (
                    SELECT COALESCE(SUM(i.amount), 0)
                    FROM {db}.wallets_money_in i
                    WHERE (:site IS NULL OR i.hive_site_id = :site)
                      AND (:from IS NULL OR i.date >= :from)
                      AND (
                        :to IS NULL
                        OR i.date < DATE_ADD(:to, INTERVAL 1 DAY)
                      )
                  )
                  -
                  (
                    SELECT COALESCE(SUM(o.amount), 0)
                    FROM {db}.wallets_money_out o
                    WHERE (:site IS NULL OR o.hive_site_id = :site)
                      AND (:from IS NULL OR o.date >= :from)
                      AND (
                        :to IS NULL
                        OR o.date < DATE_ADD(:to, INTERVAL 1 DAY)
                      )
                  )
                ) AS value
            `,
          },
        },
      ],
      
    },
  
    // ==================================================
    // 3. NET MOVEMENT BY ACCOUNT
    // ==================================================
    {
      kind: 'chart',
      id: 'netMovementByAccount',
      type: 'hbar',
      title: 'Net Movement by Account',
      prefix: 'KES ',
      span: 6,
      query: {
        sql: `
          SELECT
            a.account_name AS label,
            (
              COALESCE((
                SELECT SUM(i.amount)
                FROM {db}.accounts_money_in i
                WHERE i.account_id = a.record_id
                  AND (:site IS NULL OR i.hive_site_id = :site)
                  AND (:from IS NULL OR i.date >= :from)
                  AND (
                    :to IS NULL
                    OR i.date < DATE_ADD(:to, INTERVAL 1 DAY)
                  )
              ), 0)
              -
              COALESCE((
                SELECT SUM(o.amount)
                FROM {db}.accounts_money_out o
                WHERE o.account_id = a.record_id
                  AND (:site IS NULL OR o.hive_site_id = :site)
                  AND (:from IS NULL OR o.date >= :from)
                  AND (
                    :to IS NULL
                    OR o.date < DATE_ADD(:to, INTERVAL 1 DAY)
                  )
              ), 0)
            ) AS value
          FROM {db}.accounts_list a
          WHERE (:site IS NULL OR a.hive_site_id = :site)
          ORDER BY value DESC
        `,
      },
    },
  
    // ==================================================
    // 4. NET MOVEMENT BY WALLET
    // ==================================================
    {
      kind: 'chart',
      id: 'netMovementByWallet',
      type: 'hbar',
      title: 'Net Movement by Wallet',
      prefix: 'KES ',
      span: 6,
      query: {
        sql: `
          SELECT
            w.wallet_name AS label,
            (
              COALESCE((
                SELECT SUM(i.amount)
                FROM {db}.wallets_money_in i
                WHERE i.wallet_id = w.record_id
                  AND (:site IS NULL OR i.hive_site_id = :site)
                  AND (:from IS NULL OR i.date >= :from)
                  AND (
                    :to IS NULL
                    OR i.date < DATE_ADD(:to, INTERVAL 1 DAY)
                  )
              ), 0)
              -
              COALESCE((
                SELECT SUM(o.amount)
                FROM {db}.wallets_money_out o
                WHERE o.wallet_id = w.record_id
                  AND (:site IS NULL OR o.hive_site_id = :site)
                  AND (:from IS NULL OR o.date >= :from)
                  AND (
                    :to IS NULL
                    OR o.date < DATE_ADD(:to, INTERVAL 1 DAY)
                  )
              ), 0)
            ) AS value
          FROM {db}.wallets_list w
          WHERE (:site IS NULL OR w.hive_site_id = :site)
          ORDER BY value DESC
        `,
      },
    },
  
    // ==================================================
    // 5. MONTHLY NET MOVEMENT — ACCOUNTS ONLY
    // ==================================================
    {
      kind: 'chart',
      id: 'monthlyAccountNetMovement',
      type: 'trend',
      title: 'Monthly Net Movement — Accounts',
      prefix: 'KES ',
      span: 12,
      query: {
        sql: `
          SELECT
            movements.month_label AS label,
            SUM(movements.amount) AS value
          FROM (
            SELECT
              DATE_FORMAT(i.date, '%Y-%m') AS month_label,
              SUM(i.amount) AS amount
            FROM {db}.accounts_money_in i
            WHERE (:site IS NULL OR i.hive_site_id = :site)
              AND (:from IS NULL OR i.date >= :from)
              AND (
                :to IS NULL
                OR i.date < DATE_ADD(:to, INTERVAL 1 DAY)
              )
            GROUP BY DATE_FORMAT(i.date, '%Y-%m')
  
            UNION ALL
  
            SELECT
              DATE_FORMAT(o.date, '%Y-%m') AS month_label,
              -SUM(o.amount) AS amount
            FROM {db}.accounts_money_out o
            WHERE (:site IS NULL OR o.hive_site_id = :site)
              AND (:from IS NULL OR o.date >= :from)
              AND (
                :to IS NULL
                OR o.date < DATE_ADD(:to, INTERVAL 1 DAY)
              )
            GROUP BY DATE_FORMAT(o.date, '%Y-%m')
          ) movements
          GROUP BY movements.month_label
          ORDER BY movements.month_label
        `,
      },
    },
  
    // ==================================================
    // 6. LATEST ACCOUNTS
    // ==================================================
    {
      kind: 'grid',
      id: 'latestAccounts',
      ref: 'latestAccounts',
      title: 'Latest Accounts',
      props:{
        hiddenAccounts: ['new']
      }
    },
  
    // ==================================================
    // 7. LATEST WALLETS
    // ==================================================
    {
      kind: 'grid',
      id: 'latestWallets',
      ref: 'latestWallets',
      title: 'Latest Wallets'
    },
  ],
};