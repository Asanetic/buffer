import { Suspense } from 'react';
import WalletsWalletMoneyInList from '../uiControl/WalletsWalletMoneyInList';
import { WalletsWalletMoneyInSchema } from '../WalletsWalletMoneyInSchema';
import { hiveRoutes } from '../../../../../appConfigs/hiveRoutes';

export async function generateMetadata() {
  return { title: WalletsWalletMoneyInSchema.label, description: WalletsWalletMoneyInSchema.description, icons: { icon: `${hiveRoutes.hiveBaseRoute}/logo.png` } };
}

export default function Page() {
  return (
    <div className="main-wrapper">
      <div className="page-wrapper">
        <div className="content container-fluid p-0 m-0 ">
          <Suspense fallback={<div className="col-md-12 p-5 text-center h3">Loading...</div>}>
            <WalletsWalletMoneyInList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
