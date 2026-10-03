import React from 'react';
import { Badge } from 'chatty';

export function Light() {
  return <Badge color="primary">New</Badge>;
}

export function Solid() {
  return <Badge variant="solid" color="success">Online</Badge>;
}

export function Statuses() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Badge color="success">Delivered</Badge>
      <Badge color="error">Failed</Badge>
      <Badge color="warning">Pending</Badge>
      <Badge color="info">Typing</Badge>
      <Badge color="light">Archived</Badge>
    </div>
  );
}
