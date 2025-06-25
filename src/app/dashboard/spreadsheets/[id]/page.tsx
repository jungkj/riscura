import NotionSpreadsheet from '@/components/spreadsheet/NotionSpreadsheet';

export default async function SpreadsheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NotionSpreadsheet />;
} 