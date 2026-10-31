import React from 'react';
import { DropdownItem } from 'chatty';

export function Button() {
  return (
    <div style={{ width: 220, padding: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
      <DropdownItem onClick={() => {}}>Edit profile</DropdownItem>
      <DropdownItem onClick={() => {}}>Notifications</DropdownItem>
    </div>
  );
}

export function Link() {
  return (
    <div style={{ width: 220, padding: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
      <DropdownItem tag="a" href="/profile">View profile</DropdownItem>
    </div>
  );
}
