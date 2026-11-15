import { Suspense } from 'react';
import { hiveRoutes } from '../../../appConfigs/hiveRoutes';
import SmsinboxProfile from '../uiControl/SmsinboxProfile';


export async function generateMetadata({ searchParams }) {
  const mosyTitle = "Smsinbox profile"//searchParams?.mosyTitle || "Tasks";

  return {
    title: mosyTitle ? decodeURIComponent(mosyTitle) : `Smsinbox Profile`,
    description: 'Smsinbox profile / item details',
    
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
                 <SmsinboxProfile />
               </Suspense>
            </div>
          </div>
        </div>
    </>
)
}

