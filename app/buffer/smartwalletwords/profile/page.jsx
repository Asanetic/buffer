import { Suspense } from 'react';
import { hiveRoutes } from '../../../appConfigs/hiveRoutes';
import SmartwalletwordsProfile from '../uiControl/SmartwalletwordsProfile';


export async function generateMetadata({ searchParams }) {
  const mosyTitle = "Smartwalletwords profile"//searchParams?.mosyTitle || "Tasks";

  return {
    title: mosyTitle ? decodeURIComponent(mosyTitle) : `Smartwalletwords Profile`,
    description: 'Smartwalletwords profile / item details',
    
    icons: {
      icon: `${hiveRoutes.hiveBaseRoute}/logo.png`
    },    
  };
}
export default function Page() {

return (
     <>
        <div className="main-wrapper">
          <div className="page-wrapper">
            <div className="content container-fluid p-0 m-0 ">
               <Suspense fallback={<div className="col-md-12 p-5 text-center h3">Loading...</div>}>
                 <SmartwalletwordsProfile />
               </Suspense>
            </div>
          </div>
        </div>
    </>
)
}

