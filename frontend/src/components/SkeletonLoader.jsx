import React from 'react';

const Skeleton = ({ width = '100%', height = '1rem', borderRadius = '6px', style = {} }) => (
  <div
    className="skeleton"
    style={{ width, height, borderRadius, ...style }}
    aria-hidden="true"
  />
);

export const SkeletonCard = () => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <Skeleton height="8px" borderRadius="0" />
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="1.1rem" />
          <Skeleton width="40%" height="0.8rem" style={{ marginTop: '0.4rem' }} />
        </div>
        <Skeleton width="70px" height="1.4rem" borderRadius="999px" />
      </div>
      <Skeleton width="100%" height="0.85rem" />
      <Skeleton width="80%" height="0.85rem" />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Skeleton width="90px" height="0.82rem" />
        <Skeleton width="90px" height="0.82rem" />
      </div>
    </div>
    <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
      <Skeleton height="2rem" borderRadius="8px" style={{ flex: 1 }} />
      <Skeleton height="2rem" borderRadius="8px" style={{ flex: 1 }} />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <div className="table-wrapper">
    <table>
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i}><Skeleton width="80%" height="0.85rem" /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}><Skeleton width={c === 0 ? '40px' : '70%'} height="0.85rem" /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonStat = () => (
  <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
    <Skeleton width="3rem" height="2rem" style={{ margin: '0 auto 0.5rem' }} />
    <Skeleton width="4rem" height="0.82rem" style={{ margin: '0 auto' }} />
  </div>
);

export default Skeleton;
