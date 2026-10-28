// Grid name → your existing list component. A schema grid block says { kind: 'grid', ref: 'clients' }.
// This is the only front-end file that changes per app, and only when the schema uses a grid.
//
// import ClientsList from '../../clients/uiControl/ClientsList';
// export default { clients: ClientsList };

import AccountslistList from "../../accountslist/uiControl/AccountslistList";
import WalletslistList from "../../walletslist/uiControl/WalletslistList";

export default {
    latestAccounts:AccountslistList,
    latestWallets:WalletslistList
};

