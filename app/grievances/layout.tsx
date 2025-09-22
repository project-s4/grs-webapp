import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grievances - Grievance Redressal System',
  description: 'View and manage your grievances',
};

export default function GrievancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
