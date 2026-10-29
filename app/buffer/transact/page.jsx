import { hiveRoutes } from '../../appConfigs/hiveRoutes';

export async function generateMetadata() {
  return {
    title: 'Transact',
    description: 'Record money in, money out and transfers',
    icons: { icon: `${hiveRoutes.hiveBaseRoute}/logo.png` },
  };
}

// The quick-access bar (Money In / Out / Transfer) is mounted once in buffer/layout.jsx, so it is on this page too.
export default function Page() {
  return (
    <div className="main-wrapper">
      <div className="page-wrapper">
        <div className="content container-fluid p-4">
          <h4>Transact</h4>
          <p className="text-muted">Use the Money In, Money Out and Transfer buttons at the bottom of the screen.</p>
        </div>
      </div>
    </div>
  );
}
