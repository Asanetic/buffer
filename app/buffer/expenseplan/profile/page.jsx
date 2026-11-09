import { Suspense } from 'react';
import { hiveRoutes } from '../../../appConfigs/hiveRoutes';
import ExpenseplanProfile from '../uiControl/ExpenseplanProfile';


export async function generateMetadata({ searchParams }) {
  const mosyTitle = "Expenseplan profile"//searchParams?.mosyTitle || "Tasks";

  return {
    title: mosyTitle ? decodeURIComponent(mosyTitle) : `Expenseplan Profile`,
    description: 'Expenseplan profile / item details',
    
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
                 <ExpenseplanProfile />
               </Suspense>
            </div>
          </div>
        </div>
    </>
)
}

