import { Helmet } from 'react-helmet-async';

interface PageHelmetProps {
  title: string;
  description?: string;
}

const APP_NAME = 'RateMyPix';
const DEFAULT_DESCRIPTION = 'Share, rate, and discover photos from your life celebrations.';

export const PageHelmet = ({ title, description }: PageHelmetProps) => {
  const pageTitle = `${title} | ${APP_NAME}`;
  const pageDescription = description || DEFAULT_DESCRIPTION;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
    </Helmet>
  );
};