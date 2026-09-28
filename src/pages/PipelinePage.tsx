import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Deal, DealStage } from '../types.ts';
import { api } from '../api.ts';
import { Plus, Building2, Users, RefreshCw } from 'lucide-react';

const STAGES: DealStage[] = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const PipelinePage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadDeals = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDeals();
      setDeals(data);
    } catch (err) {
      console.error('Failed to load deals for pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const dealId = Number(draggableId);
    const newStage = destination.droppableId as DealStage;

    // Optimistically update deals state
    const previousDeals = [...deals];
    setDeals((currentDeals) =>
      currentDeals.map((d) => {
        if (d.id === dealId) {
          let updatedProb = d.probability;
          if (newStage === 'Won') updatedProb = 100;
          else if (newStage === 'Lost') updatedProb = 0;
          return { ...d, stage: newStage, probability: updatedProb };
        }
        return d;
      })
    );

    setIsUpdating(true);
    try {
      await api.updateDealStage(dealId, newStage);
    } catch (err) {
      console.error('Failed to update deal stage on server:', err);
      // Revert optimistic update
      setDeals(previousDeals);
      alert('Failed to update deal stage. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Group deals by stage
  const dealsByStage = STAGES.reduce<Record<DealStage, Deal[]>>((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {} as Record<DealStage, Deal[]>);

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Loading sales pipeline...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="filter-toolbar" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gray-900)' }}>
            Sales Pipeline Board
          </h2>
          {isUpdating && (
            <span style={{ fontSize: '12px', color: 'var(--crm-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={12} className="spin" /> Updating stage...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadDeals}
            title="Refresh pipeline"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/deals" className="btn btn-primary btn-sm">
            <Plus size={14} /> New Deal
          </Link>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="pipeline-board">
          {STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage] || [];
            const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
            const expectedRevenue = Math.round(
              stageDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0)
            );

            return (
              <div key={stage} className="pipeline-column" data-stage={stage}>
                <div className="column-header">
                  <div className="column-title-row">
                    <span className="column-name">{stage}</span>
                    <span className="column-count">{stageDeals.length}</span>
                  </div>
                  <div className="column-stats">
                    <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                      ${totalValue.toLocaleString()}
                    </span>
                    <span style={{ color: 'var(--crm-blue-dark)', fontSize: '11px', fontWeight: 500 }} title="Expected revenue based on probability">
                      Exp: ${expectedRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="column-cards-container"
                      style={{
                        backgroundColor: snapshot.isDraggingOver ? 'var(--crm-blue-light)' : undefined,
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {stageDeals.length === 0 ? (
                        <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '12px' }}>
                          No deals
                        </div>
                      ) : (
                        stageDeals.map((deal, index) => {
                          const dealExpected = Math.round(deal.value * (deal.probability / 100));

                          return (
                            <Draggable
                              key={deal.id}
                              draggableId={String(deal.id)}
                              index={index}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className="deal-card"
                                  style={{
                                    ...dragProvided.draggableProps.style,
                                    boxShadow: dragSnapshot.isDragging
                                      ? 'var(--shadow-lg)'
                                      : undefined,
                                    borderColor: dragSnapshot.isDragging
                                      ? 'var(--crm-blue)'
                                      : undefined,
                                  }}
                                >
                                  <Link
                                    to={`/deals/${deal.id}`}
                                    className="deal-card-name"
                                    style={{ textDecoration: 'none', display: 'block' }}
                                    onClick={(e) => {
                                      // If user was dragging, don't trigger click navigation
                                      if (dragSnapshot.isDragging) e.preventDefault();
                                    }}
                                  >
                                    {deal.name}
                                  </Link>

                                  <div className="deal-card-org">
                                    {deal.organization_name ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <Building2 size={11} color="var(--gray-500)" />
                                        {deal.organization_name}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--gray-400)' }}>No Organization</span>
                                    )}
                                  </div>

                                  {deal.contact_name && (
                                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <Users size={11} /> {deal.contact_name}
                                    </div>
                                  )}

                                  <div className="deal-card-footer">
                                    <div className="deal-card-value">
                                      ${deal.value.toLocaleString()}
                                    </div>
                                    <div className="deal-card-expected">
                                      {deal.probability}% (${dealExpected.toLocaleString()})
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
