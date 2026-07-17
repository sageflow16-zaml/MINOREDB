import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useResearchQuestions, useDeleteRQ, useGenerateHypothesis } from '../hooks/useResearch';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function ResearchQuestionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: questions, isLoading, error } = useResearchQuestions(projectId!);
  const deleteRQ = useDeleteRQ(projectId!);
  const generateHypothesis = useGenerateHypothesis(projectId!);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading questions." />;

  return (
    <div>
      <PageHeader title="Research Questions" />
      
      {!questions || questions.length === 0 ? (
        <EmptyState message="No research questions found." />
      ) : (
        <DataTable 
          data={questions} 
          columns={[
            { header: 'Statement', accessor: 'question_statement' },
            { header: 'Origin', accessor: 'inquiry_origin' },
            { header: 'Created At', accessor: 'created_at' },
            { header: 'Actions', accessor: (row) => (
              <div className="flex gap-2">
                <button 
                  onClick={() => generateHypothesis.mutate(row.id)}
                  disabled={generateHypothesis.isPending}
                  className="text-green-500 disabled:opacity-50"
                >
                  Generate Hypothesis
                </button>
                <button onClick={() => setDeleteId(row.id)} className="text-red-500">Delete</button>
              </div>
            )}
          ]} 
        />
      )}
      <ConfirmDialog 
        isOpen={!!deleteId} 
        title="Delete Question" 
        message="Are you sure you want to delete this question?" 
        onConfirm={() => { if (deleteId) deleteRQ.mutate(deleteId); setDeleteId(null); }} 
        onCancel={() => setDeleteId(null)} 
      />
    </div>
  );
}
