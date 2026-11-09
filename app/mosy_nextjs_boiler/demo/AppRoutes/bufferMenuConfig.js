// bufferMenuConfig.js
//
// Sidebar menu for the "buffer" app. Extended by clone-module.js: modules you
// confirm are added below, grouped by the first word of their table name
// (fuel_stations, fuel_pumps -> "Fuel"). Modules already here are never duplicated,
// and the file is copied to _recycled/ before any change - so reorder, rename,
// regroup, add dashboards or quick actions and set `roles` freely.
// Your own grouping: app/<app>/AppRoutes/menuGroups.txt  ("Sales = fuel_sales, sales_orders").

export const bufferSidebarConfig = [

  // ============================================================
  // HOME  (added by clone-module.js)
  // ============================================================
  {
    type: "link",
    label: "Dashboard",
    icon: "fa fa-dashboard",
    href: (routes) => `${routes.buffer}/dashboard/main`,
    roles: []
  },


  // ============================================================
  // ACCOUNTS  (menu group - added by clone-module.js)
  // ============================================================

  {
    type: "submenu",
    label: "Accounts",
    icon: "fa fa-book",
    roles: [],
    items: [
      // <menu-group:account>
      {
        type: "submenu",
        label: "List",
        icon: "fa fa-book",
        roles: [],
        items: [
          {
            label: "Add New List",
            href: (routes) => `${routes.buffer}/accountslist/profile`,
            roles: []
          },
          {
            label: "Manage List",
            href: (routes) => `${routes.buffer}/accountslist/list?setgv=sheet`,
            roles: []
          },
          {
            label: "View List",
            href: (routes) => `${routes.buffer}/accountslist/list?setgv=table`,
            roles: []
          },
          {
            label: "Import List",
            href: (routes) => `${routes.buffer}/accountslist/import`,
            roles: []
          }
        ]
      },
      {
        type: "submenu",
        label: "Money in",
        icon: "fa fa-book",
        roles: [],
        items: [
          {
            label: "Add New Money in",
            href: (routes) => `${routes.buffer}/accountsmoneyin/profile`,
            roles: []
          },
          {
            label: "Manage Money in",
            href: (routes) => `${routes.buffer}/accountsmoneyin/list?setgv=sheet`,
            roles: []
          },
          {
            label: "View Money in",
            href: (routes) => `${routes.buffer}/accountsmoneyin/list?setgv=table`,
            roles: []
          },
          {
            label: "Import Money in",
            href: (routes) => `${routes.buffer}/accountsmoneyin/import`,
            roles: []
          }
        ]
      },
      {
        type: "submenu",
        label: "Money out",
        icon: "fa fa-book",
        roles: [],
        items: [
          {
            label: "Add New Money out",
            href: (routes) => `${routes.buffer}/accountsmoneyout/profile`,
            roles: []
          },
          {
            label: "Manage Money out",
            href: (routes) => `${routes.buffer}/accountsmoneyout/list?setgv=sheet`,
            roles: []
          },
          {
            label: "View Money out",
            href: (routes) => `${routes.buffer}/accountsmoneyout/list?setgv=table`,
            roles: []
          },
          {
            label: "Import Money out",
            href: (routes) => `${routes.buffer}/accountsmoneyout/import`,
            roles: []
          }
        ]
      },
      {
        type: "submenu",
        label: "Transfers",
        icon: "fa fa-book",
        roles: [],
        items: [
          {
            label: "Add New Transfer",
            href: (routes) => `${routes.buffer}/accountstransfers/profile`,
            roles: []
          },
          {
            label: "Manage Transfers",
            href: (routes) => `${routes.buffer}/accountstransfers/list?setgv=sheet`,
            roles: []
          },
          {
            label: "View Transfers",
            href: (routes) => `${routes.buffer}/accountstransfers/list?setgv=table`,
            roles: []
          },
          {
            label: "Import Transfers",
            href: (routes) => `${routes.buffer}/accountstransfers/import`,
            roles: []
          }
        ]
      },
      // </menu-group:account>
    ]
  },

  // ============================================================
  // WALLETS  (menu group - added by clone-module.js)
  // ============================================================

  {
    type: "submenu",
    label: "Wallets",
    icon: "fa fa-money",
    roles: [],
    items: [
      // <menu-group:wallet>
      {
        type: "submenu",
        label: "List",
        icon: "fa fa-money",
        roles: [],
        items: [
          {
            label: "Add New List",
            href: (routes) => `${routes.buffer}/walletslist/profile`,
            roles: []
          },
          {
            label: "Manage List",
            href: (routes) => `${routes.buffer}/walletslist/list?setgv=sheet`,
            roles: []
          },
          {
            label: "View List",
            href: (routes) => `${routes.buffer}/walletslist/list?setgv=table`,
            roles: []
          },
          {
            label: "Import List",
            href: (routes) => `${routes.buffer}/walletslist/import`,
            roles: []
          }
        ]
      },
      {
        type: "submenu",
        label: "Money in",
        icon: "fa fa-money",
        roles: [],
        items: [
          {
            label: "Add New Money in",
            href: (routes) => `${routes.buffer}/walletsmoneyin/profile`,
            roles: []
          },
          {
            label: "Manage Money in",
            href: (routes) => `${routes.buffer}/walletsmoneyin/list?setgv=sheet`,
            roles: []
          },
          {
            label: "View Money in",
            href: (routes) => `${routes.buffer}/walletsmoneyin/list?setgv=table`,
            roles: []
          },
          {
            label: "Import Money in",
            href: (routes) => `${routes.buffer}/walletsmoneyin/import`,
            roles: []
          }
        ]
      },
      {
        type: "submenu",
        label: "Money out",
        icon: "fa fa-money",
        roles: [],
        items: [
          {
            label: "Add New Money out",
            href: (routes) => `${routes.buffer}/walletsmoneyout/profile`,
            roles: []
          },
          {
            label: "Manage Money out",
            href: (routes) => `${routes.buffer}/walletsmoneyout/list?setgv=sheet`,
            roles: []
          },
          {
            label: "View Money out",
            href: (routes) => `${routes.buffer}/walletsmoneyout/list?setgv=table`,
            roles: []
          },
          {
            label: "Import Money out",
            href: (routes) => `${routes.buffer}/walletsmoneyout/import`,
            roles: []
          }
        ]
      },
      {
        type: "submenu",
        label: "Transfers",
        icon: "fa fa-money",
        roles: [],
        items: [
          {
            label: "Add New Transfer",
            href: (routes) => `${routes.buffer}/walletstransfers/profile`,
            roles: []
          },
          {
            label: "Manage Transfers",
            href: (routes) => `${routes.buffer}/walletstransfers/list?setgv=sheet`,
            roles: []
          },
          {
            label: "View Transfers",
            href: (routes) => `${routes.buffer}/walletstransfers/list?setgv=table`,
            roles: []
          },
          {
            label: "Import Transfers",
            href: (routes) => `${routes.buffer}/walletstransfers/import`,
            roles: []
          }
        ]
      },
      // </menu-group:wallet>
    ]
  },

  // ============================================================
  // REPORTS  (added by gen-report.js)
  // ============================================================

  {
    type: "submenu",
    label: "Reports",
    icon: "fa fa-bar-chart",
    roles: [],
    items: [

      {
        type: "submenu",
        label: "Accounts",
        roles: [],
        items: [
          {
            label: "Account Balances",
            href: (routes) => `${routes.buffer}/reports/accounts/accountbalances/list`,
            roles: []
          },
          {
            label: "Account Money In",
            href: (routes) => `${routes.buffer}/reports/accounts/accountmoneyin/list`,
            roles: []
          },
          {
            label: "Account Money Out",
            href: (routes) => `${routes.buffer}/reports/accounts/accountmoneyout/list`,
            roles: []
          },
          {
            label: "Account Transfers",
            href: (routes) => `${routes.buffer}/reports/accounts/accounttransfers/list`,
            roles: []
          },
          {
            label: "Account Transaction Forecast",
            href: (routes) => `${routes.buffer}/reports/accounts/accountforecast/list`,
            roles: []
          }
          // gen-report:group:accounts:end
        ]
      },
      {
        type: "submenu",
        label: "Wallets",
        roles: [],
        items: [
          {
            label: "Wallet Balances",
            href: (routes) => `${routes.buffer}/reports/wallets/walletbalances/list`,
            roles: []
          },
          {
            label: "Wallet Money In",
            href: (routes) => `${routes.buffer}/reports/wallets/walletmoneyin/list`,
            roles: []
          },
          {
            label: "Wallet Money Out",
            href: (routes) => `${routes.buffer}/reports/wallets/walletmoneyout/list`,
            roles: []
          },
          {
            label: "Wallet Transfers",
            href: (routes) => `${routes.buffer}/reports/wallets/wallettransfers/list`,
            roles: []
          },
          {
            label: "Wallet Transaction Forecast",
            href: (routes) => `${routes.buffer}/reports/wallets/walletforecast/list`,
            roles: []
          }
          // gen-report:group:wallets:end
        ]
      }
      // gen-report:reports:end

    ]
  },

  // ============================================================
  // SYSTEM USERS  (added by clone-module.js)
  // ============================================================

  {
    type: "submenu",
    label: "System users",
    icon: "fa fa-user",
    roles: [],
    items: [

      {
        label: "Add New System user",
        href: (routes) => `${routes.buffer}/systemusers/profile`,
        roles: []
      },
      {
        label: "Manage System users",
        href: (routes) => `${routes.buffer}/systemusers/list?setgv=sheet`,
        roles: []
      },
      {
        label: "View System users",
        href: (routes) => `${routes.buffer}/systemusers/list?setgv=table`,
        roles: []
      },
      {
        label: "Import System users",
        href: (routes) => `${routes.buffer}/systemusers/import`,
        roles: []
      }

    ]
  }
];
